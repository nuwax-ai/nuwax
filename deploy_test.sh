#!/bin/bash
#
# deploy_test.sh —— 快速通道：dev → test 一键提测（构建 + 推 origin/test 与 gitlab/test）
#
# 适用：代码已经在 dev（双远端任一侧）上，只想尽快出一版测试环境。
# 个人分支 → 版本分支 → dev → test 的全链提测走 scripts/deploy_sync_test.sh。
#
# 流程：
#   1. 预检：主仓/子仓无文件改动、无未解决冲突；子模块版本偏差自动对齐；fetch 双远端
#   2. 本地 dev 汇合 origin/dev 与 gitlab/dev（只在本地，不推远端 dev）
#   3. 本地 test 汇合 gitlab/test 与 origin/test，再合入 dev
#      机器产物（dist/、version.ts、adapter.patch）冲突自动消化
#      微应用 pin/gitlink 不一致时对齐子模块远端最新；其它源码冲突打印清单后回滚退出
#      子模块升级到远端 main 最新，预检适配后同步并提交 gitlink/adapter.pin
#   4. test:conversation 质量门：源码与已部署的 gitlab/test 相同则跳过；同一提交成功过不重跑
#   5. 生产构建（M 端产物取本地 nuwax-mobile 检出的 origin 远端）→ 提交 dist
#   6. 推 origin/test + gitlab/test，打印两处落点
#
# 决策（2026-10-14；子模块规则于 2026-10-15 按用户要求调整）：
#   - 质量门默认开启（实测约 20 秒，相对 3-4 分钟构建可忽略），GATE=0 紧急绕过
#     失败若全是用例超时，按负载抖动重试一次（GATE_JITTER_RETRIES / GATE_JITTER_BACKOFF）
#   - 自动升级子模块到远端最新；仅检出版本偏差不拦提测，源码改动与适配冲突仍停止
#   - 不推远端 dev；两个远端 dev 互不包含时打印提醒
#
# 用法：
#   bash deploy_test.sh                 # 真实执行
#   DRY_RUN=1 bash deploy_test.sh       # 只读演练：打印执行顺序，不 fetch、不改任何引用/文件
#   GATE=0 bash deploy_test.sh          # 紧急绕过质量门（会大字提示）
#   MOBILE_BUILD_REPO=<url> bash deploy_test.sh      # M 端产物源覆写（默认本地 nuwax-mobile@origin，无检出回退 GitHub）
#   DEV_BRANCH=... TEST_BRANCH=...      # 分支名覆写（默认 dev / test）

# 以 sh 调用时（macOS 的 /bin/sh 是 POSIX 模式 bash，不支持进程替换）切回完整 bash 重新执行
if [ -z "${BASH_VERSION:-}" ] || (shopt -qo posix) 2>/dev/null; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# 失败归位：已离开起跑分支且 tracked 无改动时切回，便于修完问题直接重跑。
return_to_start() {
  [ "${PIPELINE_STARTED:-0}" = "1" ] || return 0
  [ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)" != "$START_BRANCH" ] || return 0
  git diff --quiet && git diff --cached --quiet || return 0
  if git checkout -q "$START_BRANCH" 2>/dev/null; then
    update_submodules_soft >/dev/null 2>&1
    echo "↩ 已切回起跑分支 ${START_BRANCH}（处理完问题后直接重跑本脚本即可）" >&2
  fi
}

on_exit() {
  local status=$1
  [ "$status" != "0" ] || return 0
  echo "❌ 步骤失败：${CURRENT_STEP:-?}（当前分支：$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')）" >&2
  return_to_start
}

# 整个流程包在函数里：bash 会先完整读入再执行，中途 checkout 改写本文件也不会错读。
main() {
  ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
  cd "$ROOT"
  # shellcheck source=scripts/deploy/lib.sh
  source "$ROOT/scripts/deploy/lib.sh"

  DRY_RUN="${DRY_RUN:-0}"
  GATE="${GATE:-1}"
  DEV_BRANCH="${DEV_BRANCH:-dev}"
  TEST_BRANCH="${TEST_BRANCH:-test}"
  export DIST_RETENTION=1
  # 内部部署链必须带微应用：子模块缺失时 sync:micro-apps 不允许跳过（社区版构建才会跳过）
  export MICRO_APP_REQUIRED=1
  START_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  GATE_RECORD="$(cd "$(git rev-parse --git-common-dir)" && pwd -P)/nuwax-deploy/fast-lane.test-gate"
  CURRENT_STEP="预检"
  # 同事克隆可能没配 gitlab 远端：缺失时自动补配（内网测试环境落点），否则第一步 fetch 就挂
  ensure_gitlab_remote

  log "快速通道提测：${DEV_BRANCH} → ${TEST_BRANCH}（推 origin + gitlab，M 端源 ${MOBILE_BUILD_REPO:-nuwax-mobile@origin}，质量门 GATE=${GATE}）"

  if [ "$DRY_RUN" = "1" ]; then
    log "只读演练：不 fetch、不修改 refs/index/文件；以下为真实执行时的顺序"
    for b in "$DEV_BRANCH" "$TEST_BRANCH"; do
      git show-ref --verify --quiet "refs/heads/${b}" && continue
      # 同事克隆常见单分支检出：真实执行会从远端补建，演练只提示（以本地远端缓存为准）
      git show-ref --verify --quiet "refs/remotes/origin/${b}" ||
        git show-ref --verify --quiet "refs/remotes/gitlab/${b}" ||
        die "本地分支 ${b} 不存在，且本地远端缓存里没有 ${b}；请先 fetch 或核对分支名"
      log "真实执行时会自动补建本地分支 ${b}（当前克隆未检出该分支）"
    done
    log "步骤 1/6：预检主仓/子仓文件改动，对齐子模块版本，fetch 双远端"
    update_submodules_soft
    run git fetch origin --prune
    run git fetch gitlab --prune
    log "步骤 2/6：本地 ${DEV_BRANCH} 汇合双远端（不推送）"
    run git checkout "$DEV_BRANCH"
    run git merge "origin/${DEV_BRANCH}" --no-verify
    run git merge "gitlab/${DEV_BRANCH}" --no-verify
    log "步骤 3/6：本地 ${TEST_BRANCH} 汇合双远端并合入 ${DEV_BRANCH}（源码冲突即停）"
    run git checkout "$TEST_BRANCH"
    run git merge "gitlab/${TEST_BRANCH}" --no-verify
    run git merge "origin/${TEST_BRANCH}" --no-verify
    run git merge "$DEV_BRANCH" --no-verify
    update_submodules_soft
    log "步骤 3/6：子模块升级到最新 main，适配预检通过后提交 gitlink/pin"
    run npm run upgrade:micro-apps -- all
    run git commit --no-verify -m "chore(micro-apps): 快速提测升级子模块到最新 main"
    log "步骤 4/6：质量门（源码与 gitlab/${TEST_BRANCH} 相同则跳过）"
    if [ "$GATE" = "0" ]; then log "GATE=0：跳过质量门"; else run_test_gate; fi
    log "步骤 5/6：构建并提交产物"
    run npm run build:prod:m
    run git add -f dist
    run git commit -m "update <时间戳>" --no-verify
    log "步骤 6/6：推送"
    run git push origin "$TEST_BRANCH"
    run git push gitlab "$TEST_BRANCH"
    log "演练完成，未执行部署"
    return 0
  fi

  log "步骤 1/6：预检"
  if git ls-files -u | grep -q .; then
    die "存在未解决的合并冲突，请先处理（git status 查看）"
  fi
  # 未暂存的 gitlink 偏差只是检出版本不同，允许后续自动对齐；已暂存输入不可覆盖。
  [ -z "$(git status --porcelain -uno --ignore-submodules=all)" ] && git diff --cached --quiet --ignore-submodules=none ||
    die "工作区有未提交改动，快速通道会切换分支，请先提交或 stash（需要隔离并行现场请用 scripts/deploy_sync_test.sh）：
$(git status --porcelain -uno | sed 's/^/    /')"
  # 忽略 gitlink 时也会隐藏子仓源码改动，必须在任何 checkout/update 前递归保护。
  # 未跟踪文件也保留，防止切到新提交时与其同名的上游文件发生覆盖冲突。
  git submodule foreach --quiet --recursive '
    if [ -n "$(git status --porcelain --ignore-submodules=all)" ] || ! git diff --cached --quiet --ignore-submodules=none; then
      echo "子模块 ${displaypath} 有未提交文件改动，请先提交或 stash：" >&2
      git status --short >&2
      exit 1
    fi
  ' || die "子模块存在未提交文件改动，已保留现场，尚未对齐版本或切换分支"
  update_submodules_soft
  retry_git 3 fetch origin --prune
  retry_git 3 fetch gitlab --prune
  for r in "origin/${DEV_BRANCH}" "gitlab/${DEV_BRANCH}" "origin/${TEST_BRANCH}" "gitlab/${TEST_BRANCH}"; do
    git show-ref --verify --quiet "refs/remotes/${r}" || die "远端引用 ${r} 不存在"
  done
  # 同事克隆常见单分支检出（只有 dev）：共享分支缺失时从远端补建，gitlab 侧为测试环境落点
  ensure_local_branch "$DEV_BRANCH" "gitlab/${DEV_BRANCH}"
  ensure_local_branch "$TEST_BRANCH" "gitlab/${TEST_BRANCH}"
  PIPELINE_STARTED=1

  CURRENT_STEP="汇合 ${DEV_BRANCH}"
  log "步骤 2/6：本地 ${DEV_BRANCH} 汇合 origin 与 gitlab（只在本地，不推远端 ${DEV_BRANCH}）"
  rgit checkout -q "$DEV_BRANCH"
  merge_or_die "origin/${DEV_BRANCH}" "merge: 拉取 origin/${DEV_BRANCH}（快速通道提测）"
  merge_or_die "gitlab/${DEV_BRANCH}" "merge: 汇合 gitlab/${DEV_BRANCH} 到本地 ${DEV_BRANCH}（快速通道提测）"
  local only_origin only_gitlab
  only_origin="$(git rev-list --count "gitlab/${DEV_BRANCH}..origin/${DEV_BRANCH}")"
  only_gitlab="$(git rev-list --count "origin/${DEV_BRANCH}..gitlab/${DEV_BRANCH}")"
  if [ "$only_origin" != "0" ] && [ "$only_gitlab" != "0" ]; then
    log "提示：两个远端 ${DEV_BRANCH} 互不包含（origin 独有 ${only_origin}、gitlab 独有 ${only_gitlab} 个提交）；本次已在本地汇合进提测，远端 ${DEV_BRANCH} 未改动"
  fi

  CURRENT_STEP="汇合 ${TEST_BRANCH} 并合入 ${DEV_BRANCH}"
  log "步骤 3/6：本地 ${TEST_BRANCH} 汇合 gitlab 与 origin，再合入 ${DEV_BRANCH}"
  rgit checkout -q "$TEST_BRANCH"
  merge_or_die "gitlab/${TEST_BRANCH}" "merge: 拉取 gitlab/${TEST_BRANCH}（快速通道提测）"
  merge_or_die "origin/${TEST_BRANCH}" "merge: 拉取 origin/${TEST_BRANCH}（快速通道提测）"
  merge_or_die "$DEV_BRANCH" "merge: 合并 ${DEV_BRANCH} 到 ${TEST_BRANCH}（快速通道提测）"
  verify_microapp_pins
  update_submodules_soft

  CURRENT_STEP="微应用子模块升级"
  log "步骤 3/6：子模块升级到最新 main（快进检查 + 适配预检）"
  run npm run upgrade:micro-apps -- all ||
    die "微应用子模块升级失败，未构建也未推送（见上方适配/网络错误，处理后重跑）"
  if ! git diff --cached --quiet; then
    rgit commit --no-verify --quiet -m "chore(micro-apps): 快速提测升级子模块到最新 main"
  fi

  CURRENT_STEP="test:conversation 质量门"
  if [ "$GATE" = "0" ]; then
    echo "⚠️  GATE=0：已跳过 test:conversation 质量门，本次提测内容未经门禁验证" >&2
  else
    log "步骤 4/6：质量门（参照已部署的 gitlab/${TEST_BRANCH}，源码无变化则跳过）"
    run_combined_source_gate "$TEST_BRANCH" "gitlab/${TEST_BRANCH}" "$GATE_RECORD" "步骤 4/6"
  fi
  local verified_head
  verified_head="$(git rev-parse HEAD)"

  CURRENT_STEP="生产构建"
  log "步骤 5/6：生产构建（M 端源 ${MOBILE_BUILD_REPO:-nuwax-mobile@origin}，保留上版哈希资源）"
  run npm run build:prod:m
  rgit add -f dist
  rgit add src/constants/version.ts
  if git diff --cached --quiet; then
    log "构建产物无变化，跳过提交"
  else
    rgit commit -q -m "update $(date '+%Y%m%d%H%M')" --no-verify
  fi
  if ! git diff --quiet || ! git diff --cached --quiet; then
    die "生产构建留下未提交的源码/子模块改动，保留现场，不推送 ${TEST_BRANCH}：
$(git status --porcelain -uno | sed 's/^/    /')"
  fi
  # prebuild 若暂存了源码（gitlink/adapter 等）会随产物提交，必须重新过门
  if [ "$GATE" != "0" ]; then
    run_combined_source_gate "$TEST_BRANCH" "$verified_head" "$GATE_RECORD" "步骤 5/6"
    mkdir -p "$(dirname "$GATE_RECORD")"
    git rev-parse HEAD >"$GATE_RECORD"
  fi

  CURRENT_STEP="推送 ${TEST_BRANCH}"
  log "步骤 6/6：推送 origin/${TEST_BRANCH} 与 gitlab/${TEST_BRANCH}"
  push_with_heal origin "$TEST_BRANCH"
  push_with_heal gitlab "$TEST_BRANCH"

  log "部署核验（两处远端落点）："
  for ref in "origin/${TEST_BRANCH}" "gitlab/${TEST_BRANCH}"; do
    echo "    ${ref} → $(git log --oneline -1 "${ref}" 2>/dev/null || echo '读取失败')"
  done
  CURRENT_STEP="收尾"
  rgit checkout -q "$START_BRANCH"
  update_submodules_soft
  log "✅ 快速通道提测完成：gitlab/${TEST_BRANCH} 已更新（M 端源 ${MOBILE_BUILD_REPO:-nuwax-mobile@origin}）"
}

trap 'on_exit $?' EXIT
main "$@"
