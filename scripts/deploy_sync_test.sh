#!/bin/bash
#
# deploy_sync_test.sh —— 个人分支一键同步测试流程（级联合并版，分支角色可配）
#
# 合并链：个人开发分支（先合 origin/版本开发分支，客户端相关支持）
#        → 推 GitHub → 质量门 → 版本开发分支（推 origin）
#        → 本地 dev → test（构建部署）→ gitlab/test
#
# 流程：
#   1. 前置校验（配置解析 / 分支 / 干净工作区 / git fetch --all --prune / 分支存在性；
#      停在链路中段分支且工作区干净时自动切回起跑分支，支持失败后直接重跑续跑）
#   2. 合并 origin/<版本开发分支> 进个人分支
#   3. 推送个人分支到 GitHub（origin）
#   4. 跑 pnpm run test:conversation 质量门（非存量挂失败则止步，不碰后续分支；
#      断点续跑且版本分支已包含个人分支时跳过——该批代码上一轮已过门并推送）
#   5. 合入版本开发分支并推 origin
#   6. 合入本地 dev（部署数据源；不推送远端），汇合 origin/dev、gitlab/dev 与版本分支；
#      组合源码不同于已测个人分支时补过质量门，按精确 dev 提交缓存成功结果
#   7. 切 test、pull gitlab+origin 双远端，merge dev（仅 dist/ 与版本烤哈希冲突自动
#      按全量重建解决，源码冲突回滚交人工）→ 构建 → 提交 dist
#      → push origin/test + gitlab/test（部署步骤已内联，语义同 deploy_test.sh）
#      → 打印三处远端落点核验
#   8. 切回个人开发分支
#
# 配置（优先级：环境变量 > scripts/deploy_sync_test.env 配置文件 > 交互提示/内置默认）：
#   FEATURE_BRANCH  个人开发分支（必配，无默认；首次交互式运行会逐步提示并写入配置文件）
#   VERSION_BRANCH  团队版本开发分支（必配，无默认；注意历史命名无前导零，如 feat-2026.9.30）
#   DEV_BRANCH      集成分支，默认 dev
#   TEST_BRANCH     测试部署分支，默认 test
#   CONFIG_FILE     配置文件路径，默认 <仓库根>/scripts/deploy_sync_test.env
#                   （已 gitignore 含个人分支名不入库；模板见 scripts/deploy_sync_test.env.example）
#   USE_WORKTREE    auto（默认）/ 1 强制隔离 / 0 原地执行
#   DEPLOY_WORKTREE_DIR 首次隔离的可选目录；默认仓库兄弟目录 .nuwax-deploy-<分支摘要>
#
# 用法：
#   bash scripts/deploy_sync_test.sh            # 真实执行（首次运行自动进入交互式配置）
#   INIT_ONLY=1 bash scripts/deploy_sync_test.sh # 只做配置（交互生成 deploy_sync_test.env），不执行同步
#   DRY_RUN=1 bash scripts/deploy_sync_test.sh  # 演练：写操作只打印不执行（缺配置时不出交互提示，直接报错）
#   FEATURE_BRANCH=... VERSION_BRANCH=... bash scripts/deploy_sync_test.sh   # 环境变量临时覆写
#   KNOWN_BROKEN_TESTS="tests/a.test.tsx|tests/b.test.tsx" bash scripts/deploy_sync_test.sh
#                                     # 质量门存量挂放行清单（| 分隔），默认清单为空。
#                                     # 确有存量挂时显式指定，修复后移除。
#
# 说明：
# - dev 仅本地合并不推送（如需推 origin/dev / gitlab/dev，在步骤 6 后补 run git push 即可）。
# - 远端显式点名（origin / gitlab），不依赖 upstream 隐式行为。
# - 非 DRY_RUN 下任何一步失败即停：成功自动切回原分支；失败时若无未提交改动也自动切回起跑分支
#   （冲突已回滚/构建产物不阻塞的场景），有未提交改动或冲突态则停在出错分支交人工。

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

CONFIG_FILE="${CONFIG_FILE:-$(git rev-parse --show-toplevel)/scripts/deploy_sync_test.env}"

CURRENT_STEP="配置解析"
trap 'echo "❌ 步骤失败：${CURRENT_STEP}（当前分支：$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")）。请按上方输出排查后重跑脚本。" >&2; return_to_start' ERR

# 失败归位：已离开起跑分支且 tracked 无改动时 best-effort 切回，免得失败后停在链路中段分支、
# 重跑还得手工 checkout（首跑实证：停在 test 上重跑被步骤 1 拦死）。配置阶段 FEATURE_BRANCH
# 可能为空，判空自然 no-op；未提交改动/冲突态不切（git diff 非 quiet），交人工处理。
return_to_start() {
  trap - ERR
  [ "${DRY_RUN:-0}" != "1" ] || return 0
  [ "${PIPELINE_STARTED:-0}" = "1" ] || return 0
  [ -n "${FEATURE_BRANCH:-}" ] || return 0
  [ "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)" != "$FEATURE_BRANCH" ] || return 0
  git diff --quiet && git diff --cached --quiet || return 0
  if git checkout "$FEATURE_BRANCH" >/dev/null 2>&1; then
    echo "↩ 已自动切回起跑分支 ${FEATURE_BRANCH}（处理完问题后直接重跑本脚本即可续跑）" >&2
  fi
}

log() { echo ">>> $*"; }
die() {
  trap - ERR
  echo "❌ $*" >&2
  return_to_start
  exit 1
}

# 从配置文件读单项（KEY=VALUE 逐行解析，不 source，避免污染/覆盖环境变量）
read_cfg() {
  local v=""
  if [ -f "$CONFIG_FILE" ]; then
    v="$(grep -E "^${1}=" "$CONFIG_FILE" | tail -1 | cut -d= -f2- || true)"
  fi
  printf '%s' "$v"
}

# 必填项交互提示（无默认值；连续 3 次空输入放弃）
# 注意：提示必须打 stderr——本函数在 $( ) 内调用，stdout 会被捕获成变量值
prompt_required() { # $1=变量名 $2=中文说明
  local ans tries=0
  while [ -z "${ans:-}" ] && [ "$tries" -lt 3 ]; do
    printf '? 请输入%s（%s，必填，无默认值）：' "$2" "$1" >&2
    read -r ans || true
    tries=$((tries + 1))
  done
  [ -n "${ans:-}" ] || echo "（${1} 连续 3 次未输入，放弃）" >&2
  printf '%s' "${ans:-}"
}

# 选填项交互提示（回车取默认值）
prompt_optional() { # $1=变量名 $2=中文说明 $3=默认值
  local ans=""
  printf '? 请输入%s（%s，回车采用默认值）[%s]：' "$2" "$1" "$3" >&2
  read -r ans || true
  printf '%s' "${ans:-$3}"
}

# 写操作统一走 run()：DRY_RUN=1 时只打印不执行
run() {
  echo "    \$ $*"
  if [ "$DRY_RUN" = "1" ]; then
    echo "    [dry-run] 已跳过"
    return 0
  fi
  "$@"
}

# git 命令包装：index.lock 瞬时竞态（并行 git 进程）自动清锁重试一次（2026-09-29 实证故障类）
rgit() {
  if run git "$@"; then return 0; fi
  local lock
  lock="$(git rev-parse --git-dir 2>/dev/null)/index.lock"
  if [ -f "$lock" ]; then
    echo "    ⚠️ 检测到 index.lock 竞态残留，清锁后重试一次" >&2
    rm -f "$lock"
    sleep 2
    run git "$@"
  else
    return 1
  fi
}

# 网络抖动自愈：网络类 git 命令失败时退避重试（SSL 瞬断/fetch 中断按次消化，不拖垮全链）
retry_git() { # retry_git <最大次数> <git 子命令...>
  local max=$1 n=0 backoff
  shift
  while :; do
    if run git "$@"; then return 0; fi
    n=$((n + 1))
    [ "$n" -lt "$max" ] || return 1
    backoff=$((n * 10))
    echo "    ⚠️ 网络命令第 ${n} 次失败，${backoff}s 后重试（最多 ${max} 次）" >&2
    sleep "$backoff"
  done
}

# 源码冲突退出：die 前打印冲突文件清单（人工处理的第一手信息）
conflict_files_die() { # $1=中文错误信息
  echo "---- 源码冲突文件（需人工按语义取舍，机器产物已自动消化，此处仅列需人看的）----" >&2
  git diff --name-only --diff-filter=U -- . ':(exclude)dist' ':(exclude)src/constants/version.ts' 2>/dev/null | sed 's/^/    /' >&2
  die "$1"
}

# merge 冲突自动消化：机器产物冲突无须人工——dist/ 产物文件名带哈希两侧必然各异（随后全量重建）、
# version.ts 烤哈希两侧各异（构建时统一重写，取本地侧）。仅当冲突全部属于这两类才消化并提交合并；
# 存在源码冲突则返回 1（调用方 abort 交人工）。调用前提：merge 冲突态尚未 abort。
resolve_machine_conflicts() { # $1=合并提交信息
  local all nonauto
  all=$(git diff --name-only --diff-filter=U)
  [ -n "$all" ] || return 1
  nonauto=$(git diff --name-only --diff-filter=U -- . ':(exclude)dist' ':(exclude)src/constants/version.ts')
  [ -z "$nonauto" ] || return 1
  if git diff --name-only --diff-filter=U -- dist 2>/dev/null | grep -q .; then
    log "merge 冲突含 dist/ 构建产物，按全量重建处理（清空 dist）"
    git rm -rf -q dist
  fi
  if git diff --name-only --diff-filter=U -- src/constants/version.ts 2>/dev/null | grep -q .; then
    log "merge 冲突含 version.ts 烤哈希，取本地侧（构建时统一重写）"
    git checkout --ours -- src/constants/version.ts
    git add src/constants/version.ts
  fi
  # 微应用适配 patch 冲突取传入侧（merge dev 进 test 时即 dev 侧——部署数据源的适配重制版；
  # 2026-10-09 实证：两侧各有一版重制时人肉 -theirs 易漏）
  local patches
  patches=$(git diff --name-only --diff-filter=U -- 'micro-frontends/*/adapter.patch' 2>/dev/null || true)
  if [ -n "$patches" ]; then
    log "merge 冲突含微应用 adapter.patch，取传入侧（部署数据源适配版）：${patches}"
    echo "$patches" | while IFS= read -r pf; do
      git checkout --theirs -- "$pf"
      git add "$pf"
    done
  fi
  rgit commit --no-verify -m "$1"
  return 0
}

# merge/pull 后配对校验：-X ours 等自动合并会无感撕裂 gitlink/pin（2026-09-30 实证：
# gitlink 随升级链更新而 pin 保旧值，build 前校验才拦下），以 gitlink（升级链权威侧）
# 为准自动修齐 pin 并提交，把 build 前置校验的拦截止于源头。
verify_microapp_pins() {
  local changed
  changed=$(node -e '
    const fs = require("fs");
    const { execSync } = require("child_process");
    const out = [];
    for (const { id, adapter } of JSON.parse(fs.readFileSync("micro-frontends/apps.json", "utf8"))) {
      const conf = JSON.parse(fs.readFileSync(adapter, "utf8"));
      const link = execSync(`git ls-tree HEAD -- ${conf.sourceDir}`).toString().split(/\s+/)[2];
      if (link && conf.pin !== link) {
        fs.writeFileSync(adapter, fs.readFileSync(adapter, "utf8").replace(conf.pin, link));
        out.push(`${id}:${conf.pin.slice(0, 9)}->${link.slice(0, 9)}`);
      }
    }
    console.log(out.join(" "));
  ' 2>/dev/null || true)
  if [ -n "$changed" ]; then
    log "微应用配对撕裂自动修复（pin 以 gitlink 为准）：${changed}"
    git add micro-frontends/*/adapter.json
    rgit commit --no-verify --quiet -m "chore(micro-apps): pin 对齐 gitlink（合并撕裂自动修复 ${changed}）"
  fi
}

# push 带自愈：远端被直推（非快进拒绝）时先并远端再推——同事直推 gitlab 的
# 工作流下 test/版本分支 push 三连拒的场景脚本自动消化（2026-10-09 实证）。
push_with_heal() { # push_with_heal <remote> <branch>
  if retry_git 3 push "$1" "$2"; then return 0; fi
  log "push 被拒（远端有新提交），先合并远端再推：$1/$2"
  retry_git 3 fetch "$1" "$2" || return 1
  if ! rgit merge "refs/remotes/$1/$2" --no-verify -m "merge: 合拢 $1/$2 直推提交"; then
    resolve_machine_conflicts "merge: 合拢 $1/$2 直推提交（机器产物冲突自动消化）" ||
      { git merge --abort 2>/dev/null || true; return 1; }
  fi
  retry_git 3 push "$1" "$2"
}

# pull 带自愈：远端分叉时 pull 走 merge，dist/version.ts 机器产物冲突会让 pull 失败且
# 在 index 留 unmerged 态（下次重跑被拦，死循环——2026-09-30 四连挂实证）；
# 失败即按机器产物消化提交合并，源码冲突才回滚交人工。
pull_with_heal() { # pull_with_heal <remote> <branch>
  if retry_git 3 pull --no-verify "$1" "$2"; then return 0; fi
  if resolve_machine_conflicts "merge: 拉取 $1/$2（机器产物冲突自动消化）"; then
    return 0
  fi
  git merge --abort 2>/dev/null || true
  return 1
}

# 已知存量挂清单：失败套件若全部在清单内则显式放行（大字提示），否则一律拦截
# workspaceDirComputerSwitch 已恢复全绿，不再默认豁免；只接受显式传入的清单。
KNOWN_BROKEN_TESTS="${KNOWN_BROKEN_TESTS:-}"

# 质量门：跑 test:conversation；失败时解析失败套件，仅当全部命中存量挂清单才放行
run_test_gate() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "    \$ pnpm run test:conversation"
    echo "    [dry-run] 已跳过"
    return 0
  fi
  local log_file failed f unexpected=0
  log_file="$(mktemp -t deploy_sync_gate)"
  if pnpm run test:conversation 2>&1 | tee "$log_file"; then
    rm -f "$log_file"
    return 0
  fi
  echo "---- 质量门未全绿，核对失败套件是否全部在存量挂清单内 ----" >&2
  # 只认 vitest 规范的行首 FAIL 行；用例名含 FAILED 字样的 stdout/stderr 行不得误报
  failed="$(grep -E '^[[:space:]]*FAIL[[:space:]]+tests/' "$log_file" | grep -oE 'tests/[^ ]+\.test\.(ts|tsx)' | sort -u || true)"
  rm -f "$log_file"
  [ -n "$failed" ] || return 1
  while IFS= read -r f; do
    case "|$KNOWN_BROKEN_TESTS|" in
    *"|$f|"*) echo "    [存量挂放行] $f" >&2 ;;
    *) echo "    [未放行失败] $f" >&2; unexpected=1 ;;
    esac
  done <<<"$failed"
  [ "$unexpected" = "0" ] || {
    echo "" >&2
    echo "---- 人工自助定位（无需 AI/agent）----" >&2
    echo "① 逐套件隔离复跑（隔离挂=真回归需修代码/测试；隔离过=负载抖动，直接重跑本脚本）：" >&2
    while IFS= read -r f; do
      echo "    npx vitest run ${f}" >&2
    done <<<"$failed"
    echo "② 常见形态：断言与最近合入的接口契约不符（改端点/参数/鉴权方式没同步测试）——" >&2
    echo "   对照失败断言里的期望值与实际值，找最近改该接口的提交（git log -S '<关键字>'）。" >&2
    return 1
  }
  echo "⚠️  质量门以「仅存量挂」放行（清单：${KNOWN_BROKEN_TESTS}）。请尽快修复存量套件并从清单移除。" >&2
  return 0
}

# 分叉输入的组合门：忽略机器产物，成功仅登记精确 HEAD。失败不落成功记录。
run_combined_source_gate() { # $1=角色 $2=已测参照提交 $3=记录路径 $4=日志步骤
  local role="$1" baseline="$2" record="$3" step="$4" head
  if git diff --quiet "$baseline" HEAD -- . ':(exclude)dist' ':(exclude)src/constants/version.ts'; then
    return 0
  fi
  head="$(git rev-parse HEAD)"
  if [ -f "$record" ] && [ "$(sed -n '1p' "$record")" = "$head" ]; then
    log "${step}：组合 ${role} 提交 ${head:0:9} 已过质量门，断点续跑跳过"
    return 0
  fi
  CURRENT_STEP="组合 ${role} 的 test:conversation 质量门"
  log "${step}：组合 ${role} 源码不同于已测参照，执行 pnpm run test:conversation"
  run_test_gate
  mkdir -p "$(dirname "$record")"
  printf '%s\n' "$head" >"$record"
}

# ---------- 配置解析：环境变量 > 配置文件 > 交互提示（回写配置文件） ----------
if [ ! -f "$CONFIG_FILE" ] && [ "${DRY_RUN:-0}" != "1" ] && [ -t 0 ]; then
  echo "未找到配置文件 ${CONFIG_FILE}，进入首次配置（输入内容将回显并写入文件，下次免输入）："
  _FB="${FEATURE_BRANCH:-$(prompt_required FEATURE_BRANCH "个人开发分支")}"
  _VB="${VERSION_BRANCH:-$(prompt_required VERSION_BRANCH "团队版本开发分支（如 feat-2026.9.30，注意无前导零）")}"
  _DB="${DEV_BRANCH:-$(prompt_optional DEV_BRANCH "集成分支（仅本地合并）" dev)}"
  _TB="${TEST_BRANCH:-$(prompt_optional TEST_BRANCH "测试部署分支" test)}"
  # 必填项放弃输入时不写盘，避免残缺配置文件挡住下次交互入口
  [ -n "$_FB" ] && [ -n "$_VB" ] ||
    die "必填项（FEATURE_BRANCH / VERSION_BRANCH）未输入完整，未写入配置。重跑脚本重新配置，或手工创建 ${CONFIG_FILE}"
  cat >"$CONFIG_FILE" <<EOF
# deploy_sync_test.sh 配置（首次交互生成；可手工编辑；删除后重新触发配置）
FEATURE_BRANCH=${_FB}
VERSION_BRANCH=${_VB}
DEV_BRANCH=${_DB}
TEST_BRANCH=${_TB}
EOF
  echo "已写入 ${CONFIG_FILE}，内容如下（即本次运行所用配置）："
  cat "$CONFIG_FILE"
fi

FEATURE_BRANCH="${FEATURE_BRANCH:-$(read_cfg FEATURE_BRANCH)}"
VERSION_BRANCH="${VERSION_BRANCH:-$(read_cfg VERSION_BRANCH)}"
DEV_BRANCH="${DEV_BRANCH:-$(read_cfg DEV_BRANCH)}"
DEV_BRANCH="${DEV_BRANCH:-dev}"
TEST_BRANCH="${TEST_BRANCH:-$(read_cfg TEST_BRANCH)}"
TEST_BRANCH="${TEST_BRANCH:-test}"

[ -n "$FEATURE_BRANCH" ] && [ -n "$VERSION_BRANCH" ] ||
  die "FEATURE_BRANCH / VERSION_BRANCH 未配置（必填项无默认值）。三种方式任选：
  ① 终端交互运行一次本脚本自动生成配置（推荐）：bash scripts/deploy_sync_test.sh
  ② 复制模板后编辑：cp scripts/deploy_sync_test.env.example ${CONFIG_FILE}
     FEATURE_BRANCH=feat-dong.0930
     VERSION_BRANCH=feat-2026.9.30
     DEV_BRANCH=dev
     TEST_BRANCH=test
  ③ 环境变量临时指定：FEATURE_BRANCH=... VERSION_BRANCH=... bash scripts/deploy_sync_test.sh"

DRY_RUN="${DRY_RUN:-0}"
# worktree 模式：auto（默认，主区脏时启用）/ 1 强制 / 0 关闭
USE_WORKTREE="${USE_WORKTREE:-auto}"

# 只配置不执行模式：生成/校验完配置即退出
if [ "${INIT_ONLY:-0}" = "1" ]; then
  log "INIT_ONLY：配置完成（FEATURE=${FEATURE_BRANCH} VERSION=${VERSION_BRANCH} DEV=${DEV_BRANCH} TEST=${TEST_BRANCH}），不执行同步"
  exit 0
fi

# 演练在进入任何恢复/隔离逻辑前退出。下面的真实流程包含 Git 清理、子模块升级和
# pin 配对修复，不能仅靠 run() 包装保证只读；演练只核对缓存引用并打印执行顺序。
if [ "$DRY_RUN" = "1" ]; then
  log "只读演练：不 fetch、不修改 refs/index/文件、不创建或删除 worktree；远端引用以本地缓存为准"
  for b in "$FEATURE_BRANCH" "$VERSION_BRANCH" "$DEV_BRANCH" "$TEST_BRANCH"; do
    git show-ref --verify --quiet "refs/heads/${b}" || die "本地分支 ${b} 不存在：请检查分支名或配置"
  done
  log "步骤 1/8：校验分支与干净状态；有并行现场时创建或复用本脚本登记的独立 worktree"
  run git fetch --all --prune
  log "步骤 2/8：合并 origin/${VERSION_BRANCH} 进 ${FEATURE_BRANCH}"
  run git merge "origin/${VERSION_BRANCH}" --no-verify
  if [ "${UPGRADE_MICRO_APPS:-auto}" != "0" ]; then
    log "步骤 2.5：检查子模块 main，按正规升级工具预检适配后升级"
  fi
  log "步骤 3/8：推送个人分支"
  run git push origin "HEAD:refs/heads/${FEATURE_BRANCH}"
  log "步骤 4/8：test:conversation 质量门（已合入版本分支的同批断点续跑可跳过）"
  run pnpm run test:conversation
  log "步骤 5/8：合入 ${VERSION_BRANCH} 并推 origin"
  run git checkout "$VERSION_BRANCH"
  run git pull --no-verify origin "$VERSION_BRANCH"
  run git merge "$FEATURE_BRANCH" --no-verify
  run git push origin "$VERSION_BRANCH"
  log "步骤 6/8：合入本地 ${DEV_BRANCH}，汇合双远端 dev；不推送 dev"
  run git checkout "$DEV_BRANCH"
  run git pull --no-verify origin "$DEV_BRANCH"
  run git merge "$VERSION_BRANCH" --no-verify
  run git fetch gitlab "refs/heads/${DEV_BRANCH}:refs/remotes/gitlab/${DEV_BRANCH}"
  run git merge "gitlab/${DEV_BRANCH}" --no-verify
  log "组合 dev 源码不同于已测个人分支时补过质量门；成功结果按精确 dev 提交缓存"
  log "步骤 7/8：${TEST_BRANCH} 双远端合入、重建完整 dist（含微应用与移动端）、提交产物及烤哈希"
  run git checkout "$TEST_BRANCH"
  run git pull --no-verify gitlab "$TEST_BRANCH"
  run git pull --no-verify origin "$TEST_BRANCH"
  run git merge "$DEV_BRANCH" --no-verify
  log "步骤 7.1：test 组合源码不同于已测 dev 时补过质量门；只改机器产物时不重复"
  run npm run build:prod:m gitlab
  run git add -f dist
  run git add src/constants/version.ts
  run git push origin "$TEST_BRANCH"
  run git push gitlab "$TEST_BRANCH"
  log "步骤 8/8：切回个人分支角色；演练完成，未执行部署"
  exit 0
fi

# ---------- 正式流程 ----------

# 提测专用 worktree：主区 tracked 不干净（并行开发 WIP/构建现场）时
# 自动切换到当前个人分支登记的兄弟目录隔离跑全链。USE_WORKTREE=1
# 强制启用 / 0 关闭。worktree 以临时分支身份承接 FEATURE_BRANCH 角色，推送时映射回真名。
# 依赖 symlink 主区 node_modules（pnpm 产物跨目录可用，生产 build 不依赖 src/.umi）。
REAL_FEATURE="$FEATURE_BRANCH"
DELIVERY_FEATURE_HEAD="$(git rev-parse "refs/heads/${REAL_FEATURE}")"
log "本轮源码输入：${REAL_FEATURE}@${DELIVERY_FEATURE_HEAD}（后续并行提交留待下一轮）"
WT_DIR=""
DEPLOY_COMMON_DIR="$(cd "$(git rev-parse --git-common-dir)" && pwd -P)"
DEPLOY_KEY="$(printf '%s' "$REAL_FEATURE" | git hash-object --stdin | cut -c1-12)"
DEPLOY_BRANCH="deploy-sync-${DEPLOY_KEY}"
DEPLOY_RECORD="${DEPLOY_COMMON_DIR}/nuwax-deploy/${DEPLOY_KEY}.record"
DEV_GATE_RECORD="${DEPLOY_COMMON_DIR}/nuwax-deploy/${DEPLOY_KEY}.dev-gate"
TEST_GATE_RECORD="${DEPLOY_COMMON_DIR}/nuwax-deploy/${DEPLOY_KEY}.test-gate"
DEPLOY_ROOT="$(cd "$(git rev-parse --show-toplevel)" && pwd -P)"

# 登记记录属于当前 Git common-dir 和个人分支。仅已登记路径可复用，既有任意 worktree
# 或同名分支均不被自动删除；旧版 .nuwax-deploy-worktree / deploy-sync-work 也保留原样。
registered_worktree() {
  [ -f "$DEPLOY_RECORD" ] || return 1
  [ "$(sed -n '1p' "$DEPLOY_RECORD")" = "$REAL_FEATURE" ] || die "提测登记与个人分支不匹配：${DEPLOY_RECORD}"
  [ "$(sed -n '3p' "$DEPLOY_RECORD")" = "$DEPLOY_BRANCH" ] || die "提测登记与临时分支不匹配：${DEPLOY_RECORD}"
  local candidate listed candidate_common
  candidate="$(sed -n '2p' "$DEPLOY_RECORD")"
  [ -n "$candidate" ] && [ -d "$candidate" ] || die "已登记提测目录缺失，保留登记等待人工核对：${candidate}"
  candidate_common="$(cd "$candidate" && cd "$(git rev-parse --git-common-dir)" && pwd -P)"
  [ "$candidate_common" = "$DEPLOY_COMMON_DIR" ] || die "已登记目录不属于当前仓库：${candidate}"
  listed="$(git worktree list --porcelain | awk -v expected="$candidate" '$1 == "worktree" && substr($0, 10) == expected { print substr($0, 10); exit }')"
  [ "$listed" = "$candidate" ] || die "已登记目录不是当前仓库 worktree：${candidate}"
  git show-ref --verify --quiet "refs/heads/${DEPLOY_BRANCH}" || die "已登记临时分支缺失：${DEPLOY_BRANCH}"
  case "$(git -C "$candidate" branch --show-current)" in
    "$DEPLOY_BRANCH"|"$VERSION_BRANCH"|"$DEV_BRANCH"|"$TEST_BRANCH") ;;
    *) die "已登记目录当前用于其它分支，保留原样：${candidate}" ;;
  esac
  printf '%s' "$candidate"
}

registered="$(registered_worktree)" || { [ ! -f "$DEPLOY_RECORD" ] || exit 1; }
if [ -n "${registered:-}" ] && [ "$registered" = "$DEPLOY_ROOT" ]; then
  case "$(git branch --show-current)" in
    "$DEPLOY_BRANCH"|"$VERSION_BRANCH"|"$DEV_BRANCH"|"$TEST_BRANCH") ;;
    *) die "已登记目录当前用于其它分支，保留原样：${DEPLOY_ROOT}" ;;
  esac
  WT_DIR="$registered"
  FEATURE_BRANCH="$DEPLOY_BRANCH"
  log "检测到已登记提测 worktree 内续跑：${WT_DIR}（个人分支角色 ${REAL_FEATURE}）"
fi
enter_worktree_if_needed() {
  [ -z "$WT_DIR" ] || return 0
  [ "$USE_WORKTREE" != "0" ] || return 0
  if [ -z "$(git status --porcelain -uno)" ] && [ "$USE_WORKTREE" != "1" ]; then
    return 0 # 主区干净且未强制：直接在主区跑，免 worktree 开销
  fi
  # worktree 必须在主仓目录树之外（兄弟目录）：物理嵌在主仓内时 vite/pnpm 的包解析会
  # 向上爬到主仓 package.json，把 setupFiles 等 root 相对路径全部解析去主仓（2026-09-30 首战实证）
  MAIN_DIR="$DEPLOY_ROOT"
  if [ -n "${registered:-}" ]; then
    WT_DIR="$registered"
    [ -z "$(git -C "$WT_DIR" status --porcelain -uno)" ] || die "已登记提测 worktree 有未提交现场，请在该目录处理后续跑：${WT_DIR}"
  else
    WT_DIR="${DEPLOY_WORKTREE_DIR:-$(dirname "$(dirname "$DEPLOY_COMMON_DIR")")/.nuwax-deploy-${DEPLOY_KEY}}"
    [ ! -e "$WT_DIR" ] || die "提测目录已存在但没有本脚本登记，保留原样：${WT_DIR}"
    git show-ref --verify --quiet "refs/heads/${DEPLOY_BRANCH}" && die "临时分支已存在但没有本脚本登记，保留原样：${DEPLOY_BRANCH}"
    # 从本地已提交个人分支起跑，保留尚未 push 的源码；工作区 WIP 不进入交付。
    git worktree add "$WT_DIR" -b "$DEPLOY_BRANCH" "$DELIVERY_FEATURE_HEAD" >/dev/null 2>&1 ||
      die "创建提测 worktree 失败：${WT_DIR}"
    WT_DIR="$(cd "$WT_DIR" && pwd -P)"
    mkdir -p "$(dirname "$DEPLOY_RECORD")"
    printf '%s\n' "$REAL_FEATURE" "$WT_DIR" "$DEPLOY_BRANCH" >"$DEPLOY_RECORD"
  fi
  ln -sfn "${MAIN_DIR}/node_modules" "$WT_DIR/node_modules"
  # src/.umi 是 umi 生成的 tsconfig/类型基础（主 tsconfig extends 它）：worktree 不拷则
  # vitest 全套件文件级崩（2026-09-30 首战实证）；从主区拷快照即可（不 symlink，避免主区 dev 重建抖动）
  if [ -d "${MAIN_DIR}/src/.umi" ]; then
    rm -rf "$WT_DIR/src/.umi"
    cp -R "${MAIN_DIR}/src/.umi" "$WT_DIR/src/.umi"
  else
    die "主区缺少 src/.umi（先在主区跑一次 npm run dev 或 max build 生成），worktree 无法启动测试"
  fi
  # worktree 不会带子模块内容，而步骤 7 的 upgrade:micro-apps 强制要求子模块已初始化且
  # HEAD==pin（2026-09-30 首战实证：未 init 时 build 前置校验拦死）；按 gitlink 对齐初始化
  (cd "$WT_DIR" && git submodule update --init --recursive) ||
    die "worktree 子模块初始化失败（网络/子模块远端问题），重跑本脚本重试"
  cd "$WT_DIR"
  FEATURE_BRANCH="$DEPLOY_BRANCH"
  log "已切换已登记提测专用 worktree（起跑区零接触）：${WT_DIR}"
}

CURRENT_STEP="前置校验"
log "步骤 1/8：前置校验（分支角色：个人=${REAL_FEATURE} 版本=${VERSION_BRANCH} 集成=${DEV_BRANCH} 测试=${TEST_BRANCH}）"
# 隔离先于恢复/分支校验：主区的冲突 index 和并行现场同样属于用户，不自动清理。
enter_worktree_if_needed
if git ls-files -u 2>/dev/null | grep -q .; then
  die "当前提测工作区存在未解决冲突，保留 index/文件，请处理后续跑"
fi
# 链路角色被其它 worktree 占用时停止，绝不推断为残留并强制删除。
for b in "$FEATURE_BRANCH" "$VERSION_BRANCH" "$DEV_BRANCH" "$TEST_BRANCH"; do
  occupied=$(git worktree list --porcelain 2>/dev/null | awk -v br="refs/heads/${b}" '
    $1 == "worktree" { p = substr($0, 10) }
    $1 == "branch" && $2 == br { print p; exit }
  ')
  if [ -n "${occupied:-}" ] && [ "$occupied" != "$(git rev-parse --show-toplevel)" ]; then
    die "分支 ${b} 被其它 worktree 占用，保留原样：${occupied}"
  fi
done
if [ "$(git rev-parse --abbrev-ref HEAD)" != "$FEATURE_BRANCH" ]; then
  # 上次失败可能停在链路中段分支（如 test）：tracked 干净时自动切回起跑分支再续跑，不干净才拦
  if git diff --quiet && git diff --cached --quiet; then
    log "当前分支不是 ${FEATURE_BRANCH}（上次失败残留？），工作区干净，自动切换过去"
    run git checkout "$FEATURE_BRANCH"
  else
    die "当前分支不是 ${FEATURE_BRANCH} 且工作区有未提交改动：请先手工处理并切回 ${FEATURE_BRANCH} 再运行本脚本（或检查 FEATURE_BRANCH 配置）"
  fi
fi
[ -z "$(git status --porcelain -uno)" ] ||
  die "工作区有未提交改动，后续 checkout/merge 会互相干扰；请先提交或 stash：
$(git status --porcelain -uno | sed 's/^/    /')"
# 未跟踪文件不参与 merge（若与目标分支撞路径，checkout 时 git 自身会报错拦下），仅提示
UNTRACKED="$(git status --porcelain | grep '^??' || true)"
[ -z "$UNTRACKED" ] || log "提示：存在未跟踪文件（不阻塞流程）：
$(echo "$UNTRACKED" | sed 's/^/    /')"
log "工作区干净，拉取全部远端最新引用……"
retry_git 3 fetch --all --prune

# 复用隔离目录时补入起跑个人分支的新提交，避免沿用上次提测快照漏交付。
if [ -n "$WT_DIR" ] && ! git merge-base --is-ancestor "$DELIVERY_FEATURE_HEAD" "$FEATURE_BRANCH"; then
  if ! rgit merge "$DELIVERY_FEATURE_HEAD" --no-verify -m "merge: 同步 ${REAL_FEATURE} 最新源码到提测 worktree"; then
    git merge --abort 2>/dev/null || true
    die "个人分支最新源码与已登记提测分支冲突，已回滚，请在提测目录解决后续跑"
  fi
fi

# 分支角色存在性校验（fetch 后做，确保远端引用是最新的）：覆写拼错时在这里干净地拦下
for b in "$FEATURE_BRANCH" "$VERSION_BRANCH" "$DEV_BRANCH" "$TEST_BRANCH"; do
  git show-ref --verify --quiet "refs/heads/${b}" ||
    die "本地分支 ${b} 不存在：请检查分支名或配置"
done
for r in "origin/${VERSION_BRANCH}" "origin/${DEV_BRANCH}" "gitlab/${DEV_BRANCH}" "origin/${TEST_BRANCH}" "gitlab/${TEST_BRANCH}"; do
  git show-ref --verify --quiet "refs/remotes/${r}" ||
    die "远端引用 ${r} 不存在：请检查分支名或配置"
done

PIPELINE_STARTED=1
CURRENT_STEP="合并版本开发分支"
log "步骤 2/8：合并 origin/${VERSION_BRANCH} 进 ${REAL_FEATURE}（客户端相关支持）"
if git merge-base --is-ancestor "origin/${VERSION_BRANCH}" "$FEATURE_BRANCH"; then
  log "${REAL_FEATURE} 已包含 origin/${VERSION_BRANCH}，跳过合并"
else
  if ! rgit merge "origin/${VERSION_BRANCH}" --no-verify \
    -m "Merge remote-tracking branch 'origin/${VERSION_BRANCH}' into ${REAL_FEATURE}"; then
    # 机器产物冲突（dist/version.ts）自动消化；源码冲突才回滚交人工
    if ! resolve_machine_conflicts "Merge remote-tracking branch 'origin/${VERSION_BRANCH}' into ${REAL_FEATURE}（机器产物冲突自动消化）"; then
      git merge --abort 2>/dev/null || true
      conflict_files_die "合并 origin/${VERSION_BRANCH} 冲突：已回滚。解决后 git commit，再重跑本脚本（断点续跑免重付）"
    fi
  fi
fi

CURRENT_STEP="微应用子模块升级"
# 子模块自动升级（2026-09-30 提速项，替代每次提测前手工「先更新子模块」）：
# 各子模块远端 main 领先 pin 时走 upgrade:micro-apps 正规通道（fetch→快进→重订 pin→staged），
# 适配 patch 冲突时工具报错交人工（语义不可自动）。UPGRADE_MICRO_APPS=0 关闭。
if [ "${UPGRADE_MICRO_APPS:-auto}" != "0" ]; then
  verify_microapp_pins # gitlink/pin 撕裂先修齐（快速通道只过一半等场景），升级工具才能启动
  upgrades=""
  while IFS=$'\t' read -r app_id src_dir branch pin; do
    [ -n "${app_id:-}" ] || continue
    if ! git -C "$src_dir" fetch origin "$branch" --quiet 2>/dev/null; then
      echo "⚠️ ${app_id} 子模块 fetch 失败，跳过其升级检查" >&2
      continue
    fi
    tip=$(git -C "$src_dir" rev-parse "origin/${branch}" 2>/dev/null || true)
    if [ -n "$tip" ] && [ "$tip" != "$pin" ]; then
      upgrades="${upgrades} ${app_id}(${pin:0:9}→${tip:0:9})"
    fi
  done < <(node -e '
    const fs = require("fs");
    for (const { id, adapter } of JSON.parse(fs.readFileSync("micro-frontends/apps.json", "utf8"))) {
      const conf = JSON.parse(fs.readFileSync(adapter, "utf8"));
      console.log([id, conf.sourceDir, conf.branch, conf.pin].join("\t"));
    }
  ' 2>/dev/null || true)
  if [ -n "$upgrades" ]; then
    log "步骤 2.5：微应用子模块升级${upgrades}"
    node scripts/upgrade-micro-apps.mjs all ||
      die "微应用子模块升级失败（适配 patch 冲突需人工重制，见上方工具输出指引）"
    rgit add micro-frontends submodules || true
    rgit commit --no-verify --quiet -m "chore(micro-apps): 子模块升级${upgrades}（适配无冲突直迁）" ||
      log "升级产物已在暂存外（无新增提交），继续"
  else
    log "步骤 2.5：微应用子模块均已是远端尖，跳过升级"
  fi
fi

# 版本分支双远端盲区根治：同事直推 gitlab/VERSION 的提交不再漏（2026-10-09 用户实证）
if git show-ref --verify --quiet refs/remotes/gitlab/"${VERSION_BRANCH}" 2>/dev/null &&
  ! git merge-base --is-ancestor "gitlab/${VERSION_BRANCH}" "$FEATURE_BRANCH"; then
  log "gitlab/${VERSION_BRANCH} 有独有提交，一并合入（同事直推 gitlab 场景）"
  if ! rgit merge "gitlab/${VERSION_BRANCH}" --no-verify     -m "Merge remote-tracking branch 'gitlab/${VERSION_BRANCH}' into ${REAL_FEATURE}"; then
    resolve_machine_conflicts "Merge gitlab/${VERSION_BRANCH}（机器产物冲突自动消化）" ||
      { git merge --abort 2>/dev/null || true; conflict_files_die "合并 gitlab/${VERSION_BRANCH} 冲突：已回滚。解决后 git commit，再重跑本脚本"; }
  fi
fi

CURRENT_STEP="推送 GitHub 个人分支"
log "步骤 3/8：推送 ${REAL_FEATURE} 到 GitHub（origin）"
if [ -n "$WT_DIR" ]; then
  # worktree 模式：临时分支推回真名远端
  retry_git 3 push origin "HEAD:refs/heads/${REAL_FEATURE}"
  git fetch origin "${REAL_FEATURE}" --quiet
else
  retry_git 3 push origin "$FEATURE_BRANCH"
fi

CURRENT_STEP="test:conversation 质量门"
# 续跑免重跑：VERSION 已包含 FEATURE ⇒ 这批代码上一轮已过质量门并随步骤 5 推上共享分支
# （步骤 5 先合并后推送，顺序保证），本轮步骤 5 注定跳过合并，不会有无门新代码流向共享分支；
# FEATURE 之后有新提交则祖先判定立即失效，恢复拦截。判定与步骤 5 的 skip 同源（本地 VERSION 引用）。
if git merge-base --is-ancestor "$FEATURE_BRANCH" "$VERSION_BRANCH"; then
  log "步骤 4/8：${VERSION_BRANCH} 已包含 ${FEATURE_BRANCH}（断点续跑），跳过质量门"
else
  log "步骤 4/8：执行 pnpm run test:conversation（非存量挂失败则止步）"
  run_test_gate
fi

CURRENT_STEP="合入版本开发分支 ${VERSION_BRANCH}"
log "步骤 5/8：合入团队版本开发分支 ${VERSION_BRANCH} 并推 origin"
run git checkout "$VERSION_BRANCH"
pull_with_heal origin "$VERSION_BRANCH"
if git merge-base --is-ancestor "$FEATURE_BRANCH" "$VERSION_BRANCH"; then
  log "${VERSION_BRANCH} 已包含 ${REAL_FEATURE}，跳过合并"
else
  if ! rgit merge "$FEATURE_BRANCH" --no-verify \
    -m "merge: 合并 ${REAL_FEATURE} 到 ${VERSION_BRANCH}（版本分支同步 $(date +%F)）"; then
    if ! resolve_machine_conflicts "merge: 合并 ${REAL_FEATURE} 到 ${VERSION_BRANCH}（机器产物冲突自动消化）"; then
      git merge --abort 2>/dev/null || true
      conflict_files_die "合并 ${REAL_FEATURE} 进 ${VERSION_BRANCH} 冲突：已回滚。解决后 git commit，再重跑本脚本"
    fi
  fi
fi
push_with_heal origin "$VERSION_BRANCH"

CURRENT_STEP="合入 ${DEV_BRANCH}"
log "步骤 6/8：合入本地 ${DEV_BRANCH}（部署数据源，不推送远端）"
run git checkout "$DEV_BRANCH"
pull_with_heal origin "$DEV_BRANCH"
if git merge-base --is-ancestor "$VERSION_BRANCH" "$DEV_BRANCH"; then
  log "${DEV_BRANCH} 已包含 ${VERSION_BRANCH}，跳过合并"
else
  if ! rgit merge "$VERSION_BRANCH" --no-verify \
    -m "merge: 合并 ${VERSION_BRANCH} 到 ${DEV_BRANCH}（同步测试 $(date +%F)）"; then
    if ! resolve_machine_conflicts "merge: 合并 ${VERSION_BRANCH} 到 ${DEV_BRANCH}（机器产物冲突自动消化）"; then
      git merge --abort 2>/dev/null || true
      conflict_files_die "合并 ${VERSION_BRANCH} 进 ${DEV_BRANCH} 冲突：已回滚。解决后 git commit，再重跑本脚本"
    fi
  fi
fi
# GitLab dev 可能比 test 更早接到共享开发；仅拉取双 test 不保证这些源码已进入交付。
# 先汇合到本地 dev，两个远端 dev 都保持原样。源冲突拒绝自动择侧，阻止后续部署。
retry_git 3 fetch gitlab "refs/heads/${DEV_BRANCH}:refs/remotes/gitlab/${DEV_BRANCH}"
if git merge-base --is-ancestor "gitlab/${DEV_BRANCH}" "$DEV_BRANCH"; then
  log "本地 ${DEV_BRANCH} 已包含 gitlab/${DEV_BRANCH}，跳过合并"
else
  log "步骤 6.1：汇合 gitlab/${DEV_BRANCH} 的 $(git rev-list --count "$DEV_BRANCH..gitlab/${DEV_BRANCH}") 个独有提交"
  if ! rgit merge "gitlab/${DEV_BRANCH}" --no-verify \
    -m "merge: 汇合 gitlab/${DEV_BRANCH} 到本地 ${DEV_BRANCH}（同步测试 $(date +%F)）"; then
    if ! resolve_machine_conflicts "merge: 汇合 gitlab/${DEV_BRANCH} 到本地 ${DEV_BRANCH}（机器产物冲突自动消化）"; then
      git merge --abort 2>/dev/null || true
      die "gitlab/${DEV_BRANCH} 与本地 ${DEV_BRANCH} 存在源码冲突，已回滚；处理后续跑，未进入 test 部署"
    fi
  fi
fi
verify_microapp_pins
# 个人分支的门不能证明来自另一路 dev 的组合源码；失败续跑不能绕过。
run_combined_source_gate "$DEV_BRANCH" "$FEATURE_BRANCH" "$DEV_GATE_RECORD" "步骤 6.2"

CURRENT_STEP="${TEST_BRANCH} 分支构建部署"
log "步骤 7/8：切 ${TEST_BRANCH}、双远端 pull、merge ${DEV_BRANCH}、构建并推送（语义同 deploy_test.sh）"
run git checkout "$TEST_BRANCH"
pull_with_heal gitlab "$TEST_BRANCH"
pull_with_heal origin "$TEST_BRANCH"
if ! rgit merge "$DEV_BRANCH" --no-verify \
  -m "merge: 合并 ${DEV_BRANCH} 到 ${TEST_BRANCH}（同步测试）"; then
  # dist 产物（哈希文件名）与 version.ts 烤哈希均为机器产物，自动消化（清 dist 重建/取本地侧）
  if ! resolve_machine_conflicts "merge: 合并 ${DEV_BRANCH} 到 ${TEST_BRANCH}（机器产物冲突自动消化）"; then
    git merge --abort 2>/dev/null || true
    conflict_files_die "合并 ${DEV_BRANCH} 进 ${TEST_BRANCH} 冲突：已回滚。解决后 git commit，再重跑本脚本"
  fi
fi
verify_microapp_pins
git merge-base --is-ancestor "$DELIVERY_FEATURE_HEAD" HEAD || die "本轮个人分支输入未进入 test，停止构建"
# test 的双远端可能含 dev 以外源码，必须校验真正构建的组合输入。
run_combined_source_gate "$TEST_BRANCH" "$DEV_BRANCH" "$TEST_GATE_RECORD" "步骤 7.1"
TEST_VERIFIED_HEAD="$(git rev-parse HEAD)"
CURRENT_STEP="${TEST_BRANCH} 完整生产构建"
# DIST_RETENTION=1：构建链路保留上一版 dist 的旧哈希资源（保 3 代，DIST_RETAIN_GENERATIONS 可调），
# 发版后持有旧页面的用户懒加载旧 chunk 不再 404（详见 scripts/deploy-asset-retention.mjs）
export DIST_RETENTION=1
run npm run build:prod:m gitlab
rgit add -f dist
rgit add src/constants/version.ts
# 产物无变化时 commit 会因空提交被拒，属正常，继续走推送（推已存在内容为 no-op）
if ! rgit commit -m "update $(date '+%Y%m%d%H%M')" --no-verify; then
  log "构建产物无变更，跳过提交"
fi
if ! git diff --quiet || ! git diff --cached --quiet; then
  die "生产构建留下未提交源码/子模块改动，保留现场，不推 test"
fi
git merge-base --is-ancestor "$DELIVERY_FEATURE_HEAD" HEAD || die "本轮个人分支输入未进入产物提交，停止推送"
# prebuild 可能升级 gitlink/adapter。源码变动须重新过门；仅机器产物变化可把已验证
# 输入的成功记录延续到产物提交，避免下次因 dist 提交改变 HEAD 而重复付费。
run_combined_source_gate "$TEST_BRANCH" "$TEST_VERIFIED_HEAD" "$TEST_GATE_RECORD" "步骤 7.2"
mkdir -p "$(dirname "$TEST_GATE_RECORD")"
printf '%s\n' "$(git rev-parse HEAD)" >"$TEST_GATE_RECORD"
CURRENT_STEP="推送 ${TEST_BRANCH} 产物"
push_with_heal origin "$TEST_BRANCH"
push_with_heal gitlab "$TEST_BRANCH"

# 部署核验：推送成功后远端跟踪引用已更新，打印三处落点头部（可直接贴提测单，免手工 fetch 比对）
log "部署核验（三处远端落点）："
for ref in "origin/${VERSION_BRANCH}" "origin/${TEST_BRANCH}" "gitlab/${TEST_BRANCH}"; do
  echo "    ${ref} → $(git log --oneline -1 "${ref}" 2>/dev/null || echo '读取失败')"
done

CURRENT_STEP="收尾"
log "步骤 8/8：切回 ${REAL_FEATURE}"
run git checkout "$FEATURE_BRANCH"
if [ -n "$WT_DIR" ]; then
  log "worktree 模式提示：本次链路在 ${WT_DIR} 完成（本地临时分支 ${FEATURE_BRANCH}）；主区分支未动，下次重跑自动复用该 worktree"
fi

log "✅ 同步测试流程完成：${VERSION_BRANCH} 与 ${DEV_BRANCH} 已合入、test:conversation 绿、gitlab/${TEST_BRANCH} 已更新"
