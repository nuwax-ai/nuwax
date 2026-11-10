#!/bin/bash
# 临时 test 提测：目标分支准备源码并构建，保存本机恢复文件后只在内网仓库重建 test。
# 用法：bash deploy_test_clean.sh [目标分支]；省略时使用当前分支，DRY_RUN=1 完全只读。
# dist 只提交到 test；目标分支全部非 dist 改动（包括已有业务改动）会自动提交。
# 目标分支源码仍推 origin 与 gitlab。test 含完整 dist 且每次都是新建分支，只推内网，不推 GitHub。

if [ -z "${BASH_VERSION:-}" ] || (shopt -qo posix) 2>/dev/null; then
  exec bash "$0" "$@"
fi
set -euo pipefail

# 入口及函数在 checkout 前完整加载，允许目标分支尚未包含这个新入口。
main() {
  # clean_exit 在选定内网远端之前也会运行；空字符串表示还没有可补推的 test 远端。
  TEST_REMOTES=""
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
  cd "$ROOT"
  source "$ROOT/scripts/deploy/lib.sh"
  CURRENT_STEP="参数与预检"
  trap 'clean_exit $?' EXIT
  trap 'exit 130' INT
  trap 'exit 143' TERM

  if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
    echo "用法：bash deploy_test_clean.sh [目标分支]（省略时使用当前分支）"
    echo "DRY_RUN=1 只读演练；真实运行会提交目标分支全部非 dist 改动。"
    return 0
  fi
  [ "$#" -le "1" ] || die "最多指定一个目标分支：bash deploy_test_clean.sh [目标分支]"
  START_BRANCH="$(git branch --show-current)"
  [ -n "$START_BRANCH" ] || die "请先检出一个本地分支，不能从 detached HEAD 运行"
  TARGET_BRANCH="${1:-$START_BRANCH}"
  case "$TARGET_BRANCH" in test|HEAD|refs/*|-*) die "不能将 ${TARGET_BRANCH} 用作目标分支" ;; esac
  git check-ref-format "refs/heads/$TARGET_BRANCH" >/dev/null || die "目标分支名无效"
  DRY_RUN="${DRY_RUN:-0}"
  [ "$DRY_RUN" = "0" ] || [ "$DRY_RUN" = "1" ] || die "DRY_RUN 只能为 0 或 1"
  log "本次提测目标分支：${TARGET_BRANCH}"

  if [ "$DRY_RUN" = "1" ]; then
    git rev-parse --verify "refs/heads/${TARGET_BRANCH}^{commit}" >/dev/null 2>&1 ||
      git rev-parse --verify "refs/remotes/origin/${TARGET_BRANCH}^{commit}" >/dev/null 2>&1 ||
      git rev-parse --verify "refs/remotes/gitlab/${TARGET_BRANCH}^{commit}" >/dev/null 2>&1 ||
      die "本地及远端缓存均无目标分支 ${TARGET_BRANCH}，请核对分支名或先 fetch"
    log "只读演练：不 fetch、不提交、不修改 refs/index/文件或远端"
    log "1. 预检、fetch origin/gitlab、记录旧 test；检出 ${TARGET_BRANCH}"
    log "2. 提交全部非 dist 改动，汇合同名双远端目标分支；不合入 dev 或旧 test"
    log "3. 目标分支按 adapter.json 分支的远端快进子模块并提交 pin/适配；运行质量门和 build:prod:m"
    log "4. 构建若修改源码，提交后重新过门和构建一次；普通双推目标分支并核对 HEAD"
    log "5. 将 GitHub、内网和本地旧 test 保存到本机恢复文件（不创建 backup 分支）；只删除内网旧 test"
    log "6. 从最终目标提交创建 test，仅提交完整 dist；只推内网并核对 HEAD"
    log "7. 切回 ${TARGET_BRANCH}；失败保留产物和状态，打印补推/恢复命令"
    return 0
  fi

  git ls-files -u | grep -q . && die "存在未解决的合并冲突，请先处理"
  local operation
  for operation in MERGE_HEAD CHERRY_PICK_HEAD REVERT_HEAD rebase-merge rebase-apply; do
    [ ! -e "$(git rev-parse --git-path "$operation")" ] || die "存在未结束的 Git 操作：${operation}"
  done
  if [ "$START_BRANCH" != "$TARGET_BRANCH" ] && [ -n "$(git status --porcelain --untracked-files=normal --ignore-submodules=all)" ]; then
    die "当前其他分支 ${START_BRANCH} 有未提交代码，请先处理；不会将其带入 ${TARGET_BRANCH}"
  fi
  assert_submodule_files_clean
  local occupied
  occupied="$(git worktree list --porcelain | awk -v root="$ROOT" '
    /^worktree / { directory=substr($0,10) }
    $0 == "branch refs/heads/test" && directory != root { print directory }
  ')"
  [ -z "$occupied" ] || die "本地 test 被其它 worktree 占用，保留原样：${occupied}"

  COMMON_DIR="$(cd "$(git rev-parse --git-common-dir)" && pwd -P)"
  mkdir -p "$COMMON_DIR/nuwax-deploy"
  LOCK_DIR="$COMMON_DIR/nuwax-deploy/clean-test.lock"
  mkdir "$LOCK_DIR" 2>/dev/null || die "已有临时 test 提测在运行；若上次异常终止，请先核对 ${LOCK_DIR}"
  LOCK_HELD=1
  printf '%s\n' "$$" >"$LOCK_DIR/pid"
  RUN_DIR="$(mktemp -d "$COMMON_DIR/nuwax-deploy/clean-$(date -u '+%Y%m%dT%H%M%SZ')-XXXXXX")"
  RUN_ID="$(basename "$RUN_DIR")"
  record target "$TARGET_BRANCH"
  record step "$CURRENT_STEP"
  # 即使目标分支曾跟踪 dist，也不把现有暂存产物误收进源码提交。
  if [ -d dist ]; then tar -cf "$RUN_DIR/original-dist.tar" dist; fi
  ensure_gitlab_remote
  # 显式 refspec 兼容只抓取 main 的单分支克隆；输入固定为本轮 fetch 到的提交。
  # bundle 不保留 shallow 边界；先补齐历史，避免生成缺少父提交的恢复文件。
  if [ "$(git rev-parse --is-shallow-repository)" = "true" ]; then
    log "当前为浅克隆，先补齐 Git 历史以生成完整恢复文件"
    retry_git 3 fetch origin --unshallow --prune '+refs/heads/*:refs/remotes/origin/*'
  else
    retry_git 3 fetch origin --prune '+refs/heads/*:refs/remotes/origin/*'
  fi
  retry_git 3 fetch gitlab --prune '+refs/heads/*:refs/remotes/gitlab/*'
  ORIGIN_OLD_TEST="$(cached_head origin test)"
  GITLAB_OLD_TEST="$(cached_head gitlab test)"
  ORIGIN_OLD_TARGET="$(cached_head origin "$TARGET_BRANCH")"
  GITLAB_OLD_TARGET="$(cached_head gitlab "$TARGET_BRANCH")"
  # 同事机器常把 origin 配成内网仓库，ensure_gitlab_remote 又会补一个同地址的 gitlab。
  # 两次 fetch 之间若有人写入，以较晚的 gitlab 快照为准，避免同一仓库被记成两个旧提交。
  if remotes_share_repository origin gitlab; then
    log "origin 与 gitlab 指向同一仓库，按一个远端发布"
    ORIGIN_OLD_TEST="$GITLAB_OLD_TEST"
    ORIGIN_OLD_TARGET="$GITLAB_OLD_TARGET"
  fi
  # 在改动目标分支之前定好 test 落点。找不到内网仓库时停止，避免后面把 dist 推到 GitHub。
  collect_test_remotes
  record old-origin-test "$ORIGIN_OLD_TEST"
  record old-gitlab-test "$GITLAB_OLD_TEST"
  if [ -n "$GITLAB_OLD_TEST" ] && git cat-file -e "$GITLAB_OLD_TEST:dist" 2>/dev/null; then
    git archive --format=tar "$GITLAB_OLD_TEST" dist >"$RUN_DIR/previous-dist.tar"
  fi

  CURRENT_STEP="准备目标分支 ${TARGET_BRANCH}"
  if ! git show-ref --verify --quiet "refs/heads/$TARGET_BRANCH"; then
    local initial="${ORIGIN_OLD_TARGET:-$GITLAB_OLD_TARGET}"
    [ -n "$initial" ] || die "本地及双远端均不存在目标分支 ${TARGET_BRANCH}"
    git branch "$TARGET_BRANCH" "$initial"
  fi
  git checkout "$TARGET_BRANCH"
  commit_source "chore(deploy): prepare ${TARGET_BRANCH} for test"
  restore_source_dist
  local remote tip
  for remote in origin gitlab; do
    if [ "$remote" = origin ]; then tip="$ORIGIN_OLD_TARGET"; else tip="$GITLAB_OLD_TARGET"; fi
    [ -z "$tip" ] || merge_target "$tip" "$remote"
  done
  git -c credential.interactive=never submodule update --init --recursive
  CURRENT_STEP="目标分支升级微应用"
  export MICRO_APP_REQUIRED=1 DIST_RETENTION=1
  export DIST_RETENTION_HISTORY_REF="${GITLAB_OLD_TEST:-HEAD}"
  verify_microapp_pins
  # 子模块 pin 跟 adapter.json 所配分支的远端。overlay 同名文件有远端改动时不中断，
  # 冲突段已由升级脚本采用远端代码；覆盖层本身仍是宿主入口，宽度等可见差异需同步进 overlay。
  npm run upgrade:micro-apps -- all --allow-overlay-changes
  npm run generate:version
  assert_submodule_files_clean
  commit_source "chore(micro-apps): prepare pins and adapters for test"

  local attempt build_input
  for attempt in 1 2; do
    CURRENT_STEP="目标分支质量门（第 ${attempt} 轮）"
    run_test_gate
    [ -z "$(source_status)" ] || die "质量门产生非 dist 修改，保留现场，未删除远端 test"
    build_input="$(git rev-parse HEAD)"
    CURRENT_STEP="目标分支完整构建（第 ${attempt} 轮）"
    seed_previous_dist
    npm run build:prod:m
    [ "$(git branch --show-current)" = "$TARGET_BRANCH" ] && [ "$(git rev-parse HEAD)" = "$build_input" ] ||
      die "构建改变了目标分支或 HEAD，保留现场，未删除远端 test"
    assert_submodule_files_clean
    if [ -z "$(source_status)" ]; then break; fi
    [ "$attempt" = "1" ] || die "再次构建仍产生非 dist 修改，源码不稳定，未删除远端 test"
    commit_source "chore(deploy): commit source generated by production build"
  done
  SOURCE_HEAD="$(git rev-parse HEAD)"
  validate_dist
  tar -cf "$RUN_DIR/built-dist.tar" dist
  record source "$SOURCE_HEAD"
  CURRENT_STEP="双推目标分支 ${TARGET_BRANCH}"
  for remote in origin gitlab; do
    if [ "$remote" = origin ]; then tip="$ORIGIN_OLD_TARGET"; else tip="$GITLAB_OLD_TARGET"; fi
    # 不调用 push_both_remotes：其自愈合并会使已构建源码在推送期间发生变化。
    if remote_needs_update "$remote" "$TARGET_BRANCH" "$tip" "$SOURCE_HEAD"; then
      git push "$remote" "$SOURCE_HEAD:refs/heads/$TARGET_BRANCH"
    fi
    record target-published "$remote"
  done
  expect_remote origin "$TARGET_BRANCH" "$SOURCE_HEAD"
  expect_remote gitlab "$TARGET_BRANCH" "$SOURCE_HEAD"

  CURRENT_STEP="保存旧 test 本机恢复文件"
  save_test_rollback
  # 只核对即将改写的内网 test。GitHub 上的旧 test 保持原样，期间被别人更新也不影响本次发布。
  for remote in $TEST_REMOTES; do
    if [ "$remote" = origin ]; then tip="$ORIGIN_OLD_TEST"; else tip="$GITLAB_OLD_TEST"; fi
    expect_remote "$remote" test "$tip"
  done
  expect_remote origin "$TARGET_BRANCH" "$SOURCE_HEAD"
  expect_remote gitlab "$TARGET_BRANCH" "$SOURCE_HEAD"
  [ "$(git branch --show-current)" = "$TARGET_BRANCH" ] && [ "$(git rev-parse HEAD)" = "$SOURCE_HEAD" ] && [ -z "$(source_status)" ] ||
    die "发布前目标源码发生变化，未删除远端 test"
  CURRENT_STEP="删除内网旧 test"
  for remote in $TEST_REMOTES; do
    if [ "$remote" = origin ]; then tip="$ORIGIN_OLD_TEST"; else tip="$GITLAB_OLD_TEST"; fi
    # 目标状态是「分支不存在」。同一仓库只选了一个远端，不会把第二次读到的空分支当成别人删除。
    if remote_needs_update "$remote" test "$tip" ""; then
      if [ -n "$tip" ]; then
        git push "$remote" --delete test
        record deleted "$remote"
      fi
    fi
    expect_remote "$remote" test ""
  done

  CURRENT_STEP="从目标提交创建本地 test 并提交 dist"
  if git show-ref --verify --quiet refs/heads/test; then
    [ "$(git rev-parse refs/heads/test)" = "$LOCAL_OLD_TEST" ] || die "本地 test 在保存恢复文件后发生变化，停止重建"
    git branch -D test
  fi
  git checkout -b test "$SOURCE_HEAD"
  rm -rf dist
  tar -xf "$RUN_DIR/built-dist.tar"
  git add -f -A -- dist
  git diff --cached --quiet -- . ':(top,exclude)dist' || die "产物提交混入非 dist 修改，停止推送"
  git commit --no-verify --allow-empty -m "chore(deploy): build test from ${TARGET_BRANCH}@${SOURCE_HEAD:0:9}"
  TEST_HEAD="$(git rev-parse HEAD)"
  record test "$TEST_HEAD"
  git diff --quiet "$SOURCE_HEAD" "$TEST_HEAD" -- . ':(top,exclude)dist' || die "test 源码偏离已构建目标，停止推送"
  CURRENT_STEP="发布新 test"
  # test 是删掉后重建的全新分支，并带上完整 dist。只写入内网，供测试环境扫描。
  for remote in $TEST_REMOTES; do
    if remote_needs_update "$remote" test "" "$TEST_HEAD"; then
      git push "$remote" "$TEST_HEAD:refs/heads/test"
    fi
    record published "$remote"
    expect_remote "$remote" test "$TEST_HEAD"
  done
  git checkout "$TARGET_BRANCH"
  git -c credential.interactive=never submodule update --init --recursive
  if [ "${ROLLBACK_READY:-0}" = "1" ]; then
    # 仅成功时原子替换上一份常规恢复文件；失败运行保留自己的文件和产物。
    mv -f "$ROLLBACK_BUNDLE" "$COMMON_DIR/nuwax-deploy/test-rollback.bundle"
    ROLLBACK_BUNDLE="$COMMON_DIR/nuwax-deploy/test-rollback.bundle"
    record rollback-latest "$ROLLBACK_BUNDLE"
    log "本机最近一次恢复文件：$ROLLBACK_BUNDLE（无需切换任何 backup 分支）"
  fi
  rm -f "$RUN_DIR/original-dist.tar" "$RUN_DIR/previous-dist.tar" "$RUN_DIR/built-dist.tar"
  record complete "$TEST_HEAD"
  log "✅ 内网 test 推送完成：${TEST_HEAD}（源码 ${TARGET_BRANCH}@${SOURCE_HEAD}；远端 ${TEST_REMOTES}）"
  log "运行记录：${RUN_DIR}/state；环境部署由现有扫描系统完成"
}

record() { printf '%s\t%s\n' "$1" "$2" >>"$RUN_DIR/state"; }

source_status() { git status --porcelain --untracked-files=normal --ignore-submodules=none -- . ':(top,exclude)dist'; }

assert_submodule_files_clean() {
  git submodule foreach --quiet --recursive '
    if [ -n "$(git status --porcelain --untracked-files=all --ignore-submodules=all)" ] || ! git diff --cached --quiet --ignore-submodules=none; then
      echo "子模块 ${displaypath} 有未提交文件修改，不会自动提交子项目源码" >&2
      exit 1
    fi
  ' || die "子模块存在未提交文件修改，已保留现场"
}

commit_source() {
  git reset -q HEAD -- dist
  # 已跟踪源码即使后来被 ignore，修改/删除仍要提交；只对新增文件应用忽略规则。
  git add -u -- . ':(top,exclude)dist'
  git ls-files --others --exclude-standard -z -- . ':(top,exclude)dist' >"$RUN_DIR/source-paths"
  if [ -s "$RUN_DIR/source-paths" ]; then
    git --literal-pathspecs add --pathspec-from-file="$RUN_DIR/source-paths" --pathspec-file-nul
  fi
  if ! git diff --cached --quiet; then git commit --no-verify -m "$1"; fi
}

restore_source_dist() {
  rm -rf dist
  if git cat-file -e HEAD:dist 2>/dev/null; then git restore --source=HEAD --staged --worktree -- dist; fi
}

merge_target() {
  local tip="$1" remote="$2" before conflicts
  git merge-base --is-ancestor "$tip" HEAD && return 0
  before="$(git rev-parse HEAD)"
  # 不快进提交合并，确保同名远端自带的 dist 不成为本次源码变更。
  if ! git merge --no-ff --no-commit --no-verify "$tip"; then
    conflicts="$(git diff --name-only --diff-filter=U -- . ':(top,exclude)dist')"
    if [ -n "$conflicts" ]; then
      git merge --abort
      die "合并 ${remote}/${TARGET_BRANCH} 存在源码冲突，已回滚，未删除远端 test：
$conflicts"
    fi
    [ -e "$(git rev-parse --git-path MERGE_HEAD)" ] || die "合并 ${remote}/${TARGET_BRANCH} 失败"
  fi
  if [ -n "$(git ls-files -- dist)" ] || git cat-file -e "$before:dist" 2>/dev/null; then
    git restore --source="$before" --staged --worktree -- dist
  fi
  git commit --no-verify -m "merge: sync ${remote}/${TARGET_BRANCH} before test build"
}

seed_previous_dist() {
  rm -rf dist .dist-retention-snapshot
  if [ -f "$RUN_DIR/previous-dist.tar" ]; then
    tar -xf "$RUN_DIR/previous-dist.tar"
  else
    log "GitLab 旧 test 无 dist，按首次部署构建"
  fi
}

validate_dist() {
  [ -s dist/index.html ] && [ -s dist/m/index.html ] || die "完整构建缺少 dist/index.html 或 dist/m/index.html"
  node - "$SOURCE_HEAD" <<'NODE'
const fs = require('fs');
const version = JSON.parse(fs.readFileSync('dist/version.json', 'utf8'));
if (!/^[0-9a-f]{7,40}$/.test(version.gitHash ?? '') || !process.argv[2].startsWith(version.gitHash)) {
  throw new Error('dist/version.json 与最终目标提交不一致，禁止替换 test');
}
NODE
}

remote_head() {
  local result
  result="$(git ls-remote --heads "$1" "refs/heads/$2")" || return 1
  printf '%s' "${result%%[[:space:]]*}"
}

cached_head() { git rev-parse --verify "refs/remotes/$1/$2^{commit}" 2>/dev/null || true; }

expect_remote() {
  local actual
  actual="$(remote_head "$1" "$2")" || die "无法读取 $1/$2，停止后续发布"
  [ "$actual" = "$3" ] || die "$1/$2 出现并发更新（预期 ${3:-不存在}，实际 ${actual:-不存在}），停止；不自动合入或覆盖"
}

# 配置里的远程地址。不用 git remote get-url：它会套用 insteadOf，
# 把 https://git.yichamao.com 改写成实际传输地址后，主机判断会落空。
configured_remote_url() {
  git config --get "remote.${1}.url" 2>/dev/null || true
}

# 从远程 URL 解析主机名，用来区分内网仓库和 GitHub。
# https、ssh:// 与 git@host:path 都能解析，端口会被去掉。
# file:// 和本地路径没有可识别的主机，返回空字符串。
url_host() {
  local url="$1" host
  url="${url%.git}"
  url="${url%/}"
  if [[ "$url" =~ ^[a-zA-Z][a-zA-Z0-9+.-]*://([^/]+@)?([^/:]+) ]]; then
    host="$(printf '%s' "${BASH_REMATCH[2]}" | tr '[:upper:]' '[:lower:]')"
    printf '%s' "${host%%:*}"
    return 0
  fi
  if [[ "$url" =~ ^([^@]+@)?([^:]+):(.+)$ ]]; then
    host="$(printf '%s' "${BASH_REMATCH[2]}" | tr '[:upper:]' '[:lower:]')"
    printf '%s' "${host%%:*}"
    return 0
  fi
  printf ''
}

# 内网仓库主机。默认 git.yichamao.com；设置 GITLAB_REMOTE_URL 时跟该地址的主机走。
internal_repository_host() {
  url_host "${GITLAB_REMOTE_URL:-https://git.yichamao.com/agent-platform/nuwax.git}"
}

# 选出本轮要删除并重建 test 的远端，写入 TEST_REMOTES。
# 远端名字不能当依据：有的克隆把 origin 配成内网，名叫 gitlab 的远端也可能指向 GitHub。
# 纳入规则：
#   1. 主机是 github.com 的远端不发布 test，即使它的名字叫 gitlab。
#   2. 主机等于内网主机的远端纳入。origin 指向 git.yichamao.com 时从这里进入。
#   3. 名字叫 gitlab、且不是 GitHub 的远端纳入。本机 file:// 夹具和未使用标准主机的内网地址走这里。
# 主机加路径相同的仓库只保留一个，gitlab 优先于 origin。
# 没有内网仓库，或同时出现两个不同的内网仓库时停止，避免把带 dist 的新分支推到 GitHub。
collect_test_remotes() {
  local name host canon seen=" " count=0
  TEST_REMOTES=""
  for name in gitlab origin; do
    git remote get-url "$name" >/dev/null 2>&1 || continue
    host="$(url_host "$(configured_remote_url "$name")")"
    if [ "$host" = "github.com" ]; then
      continue
    fi
    if [ "$host" != "$(internal_repository_host)" ] && [ "$name" != "gitlab" ]; then
      continue
    fi
    canon="$(canonical_remote_url "$name")"
    case "$seen" in
      *" $canon "*) continue ;;
    esac
    seen="$seen$canon "
    TEST_REMOTES="${TEST_REMOTES:+$TEST_REMOTES }$name"
    count=$((count + 1))
  done
  [ "$count" -ge 1 ] || die "找不到内网仓库远端，无法发布 test。请让 gitlab 指向内网仓库，或把 origin 配成 $(internal_repository_host)；不会改推 GitHub"
  [ "$count" -eq 1 ] || die "识别到多个不同的内网仓库（${TEST_REMOTES}），无法确定 test 发布目标"
  log "test 只发布到内网仓库：${TEST_REMOTES}"
}

# 比较主机和仓库路径。https、ssh 和带账号的 URL 视为同一仓库；不同主机（例如 IP 与域名）不在这里合并。
canonical_remote_url() {
  local url host path
  # 与主机判断一样读配置地址，避免 insteadOf 把同一仓库改写成两条本地路径。
  url="$(configured_remote_url "$1")"
  [ -n "$url" ] || url="$(git remote get-url "$1")"
  url="${url%.git}"
  url="${url%/}"
  if [[ "$url" =~ ^[a-zA-Z][a-zA-Z0-9+.-]*://([^/]+@)?([^/]+)/(.+)$ ]]; then
    host="$(printf '%s' "${BASH_REMATCH[2]}" | tr '[:upper:]' '[:lower:]')"
    path="${BASH_REMATCH[3]}"
    printf '%s/%s' "$host" "$path"
    return 0
  fi
  if [[ "$url" =~ ^([^@]+@)?([^:]+):(.+)$ ]]; then
    host="$(printf '%s' "${BASH_REMATCH[2]}" | tr '[:upper:]' '[:lower:]')"
    path="${BASH_REMATCH[3]}"
    printf '%s/%s' "$host" "$path"
    return 0
  fi
  printf '%s' "$url"
}

remotes_share_repository() {
  [ "$(canonical_remote_url "$1")" = "$(canonical_remote_url "$2")" ]
}

# 写入前核对远端。返回 0 表示仍是记录的旧值，调用方应推送或删除。
# 返回 1 表示已经是本次目标：origin 与 gitlab 指向同一内网仓库时，第一次写入会让第二次读到新值。
# 既不是旧值也不是目标提交，才是别人的并发更新，直接停止。
remote_needs_update() { # remote branch previous desired
  local actual
  actual="$(remote_head "$1" "$2")" || die "无法读取 $1/$2，停止后续发布"
  if [ "$actual" = "$4" ]; then
    log "$1/$2 已是目标状态，跳过重复写入"
    return 1
  fi
  if [ "$actual" != "$3" ]; then
    die "$1/$2 出现并发更新（预期 ${3:-不存在}，实际 ${actual:-不存在}），停止；不自动合入或覆盖"
  fi
  return 0
}

save_test_rollback() {
  local label tip ref
  local refs=()
  [ "$(git rev-parse --is-shallow-repository)" = "false" ] || die "仓库仍为浅克隆，不能生成完整恢复文件；未删除旧 test"
  LOCAL_OLD_TEST="$(git rev-parse --verify refs/heads/test^{commit} 2>/dev/null || true)"
  record old-local-test "$LOCAL_OLD_TEST"
  for label in origin gitlab local; do
    case "$label" in
      origin) tip="$ORIGIN_OLD_TEST" ;;
      gitlab) tip="$GITLAB_OLD_TEST" ;;
      local) tip="$LOCAL_OLD_TEST" ;;
    esac
    [ -n "$tip" ] || continue
    # bundle 需要命名引用；使用临时私有引用，不在本地/远端创建分支。
    ref="refs/nuwax-deploy/$RUN_ID/$label"
    git update-ref "$ref" "$tip" ""
    refs+=("$ref")
  done
  [ "${#refs[@]}" != "0" ] || return 0
  ROLLBACK_BUNDLE="$RUN_DIR/test-rollback.bundle"
  git bundle create "$ROLLBACK_BUNDLE" "${refs[@]}"
  git bundle verify "$ROLLBACK_BUNDLE"
  ROLLBACK_READY=1
  record rollback-bundle "$ROLLBACK_BUNDLE"
  clear_rollback_refs
}

clear_rollback_refs() {
  [ -n "${RUN_ID:-}" ] || return 0
  local ref tip
  while read -r ref tip; do
    git update-ref -d "$ref" "$tip" || return 1
  done < <(git for-each-ref --format='%(refname) %(objectname)' "refs/nuwax-deploy/$RUN_ID/")
}

print_command() { printf '    '; printf '%q ' "$@"; printf '\n'; }

clean_exit() {
  local status="$1" remote old
  trap - EXIT
  if [ "$status" != "0" ]; then
    echo "❌ 临时 test 提测失败：${CURRENT_STEP:-预检}；保留当前分支、源码与产物，未报告完成" >&2
    if [ -n "${RUN_DIR:-}" ]; then
      record failed "${CURRENT_STEP:-预检}"
      echo "运行记录与产物：$RUN_DIR" >&2
      if [ "${ROLLBACK_READY:-0}" = "1" ]; then
        echo "旧 test 已保存到本机恢复文件：$ROLLBACK_BUNDLE；需要恢复时先在本仓库导入对象：" >&2
        print_command git bundle unbundle "$ROLLBACK_BUNDLE" >&2
      fi
      if [ -n "${TEST_HEAD:-}" ]; then
        echo "确认内网 test 缺失或已指向本轮提交后，可补推同一产物（不要合入旧 test，也不要推 GitHub）：" >&2
        for remote in $TEST_REMOTES; do print_command git push "$remote" "$TEST_HEAD:refs/heads/test" >&2; done
      fi
      for remote in $TEST_REMOTES; do
        if [ "$remote" = origin ]; then old="${ORIGIN_OLD_TEST:-}"; else old="${GITLAB_OLD_TEST:-}"; fi
        if [ -n "$old" ]; then
          echo "仅在 ${remote}/test 缺失且决定恢复旧版本时执行：" >&2
          print_command git push "$remote" "$old:refs/heads/test" >&2
        fi
      done
      if [ -n "${SOURCE_HEAD:-}" ]; then
        echo "目标源码如仅一端推送成功，可核对后补推（若远端已有新提交，先处理并重新构建）：" >&2
        for remote in origin gitlab; do print_command git push "$remote" "$SOURCE_HEAD:refs/heads/$TARGET_BRANCH" >&2; done
      fi
    fi
  fi
  clear_rollback_refs || echo "临时恢复引用清理失败，请核对 refs/nuwax-deploy/${RUN_ID:-}" >&2
  if [ "${LOCK_HELD:-0}" = "1" ]; then rm -rf "$LOCK_DIR"; fi
  exit "$status"
}

main "$@"
