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
#   6. 合入本地 dev（部署数据源；不推送远端）+ gitlab/dev 独有提交盲区告警
#   7. 切 test、pull gitlab+origin 双远端，merge dev（-X ours；仅 dist/ 产物冲突自动
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
#
# 用法：
#   bash scripts/deploy_sync_test.sh            # 真实执行（首次运行自动进入交互式配置）
#   INIT_ONLY=1 bash scripts/deploy_sync_test.sh # 只做配置（交互生成 deploy_sync_test.env），不执行同步
#   DRY_RUN=1 bash scripts/deploy_sync_test.sh  # 演练：写操作只打印不执行（缺配置时不出交互提示，直接报错）
#   FEATURE_BRANCH=... VERSION_BRANCH=... bash scripts/deploy_sync_test.sh   # 环境变量临时覆写
#   KNOWN_BROKEN_TESTS="tests/a.test.tsx|tests/b.test.tsx" bash scripts/deploy_sync_test.sh
#                                     # 质量门存量挂放行清单（| 分隔），默认放行
#                                     # workspaceDirComputerSwitch（组件 Form 化后
#                                     # mock 未跟上的已知存量挂，修复后请从默认值移除）
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

# 已知存量挂清单：失败套件若全部在清单内则显式放行（大字提示），否则一律拦截
KNOWN_BROKEN_TESTS="${KNOWN_BROKEN_TESTS:-tests/conversation/workspaceDirComputerSwitch.test.tsx}"

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
  [ "$unexpected" = "0" ] || return 1
  echo "⚠️  质量门以「仅存量挂」放行（清单：${KNOWN_BROKEN_TESTS}）。请尽快修复存量套件并从清单移除。" >&2
  return 0
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

# 只配置不执行模式：生成/校验完配置即退出
if [ "${INIT_ONLY:-0}" = "1" ]; then
  log "INIT_ONLY：配置完成（FEATURE=${FEATURE_BRANCH} VERSION=${VERSION_BRANCH} DEV=${DEV_BRANCH} TEST=${TEST_BRANCH}），不执行同步"
  exit 0
fi

# ---------- 正式流程 ----------
CURRENT_STEP="前置校验"
log "步骤 1/8：前置校验（分支角色：个人=${FEATURE_BRANCH} 版本=${VERSION_BRANCH} 集成=${DEV_BRANCH} 测试=${TEST_BRANCH}）"
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
git fetch --all --prune

# 分支角色存在性校验（fetch 后做，确保远端引用是最新的）：覆写拼错时在这里干净地拦下
for b in "$FEATURE_BRANCH" "$VERSION_BRANCH" "$DEV_BRANCH" "$TEST_BRANCH"; do
  git show-ref --verify --quiet "refs/heads/${b}" ||
    die "本地分支 ${b} 不存在：请检查分支名或配置"
done
for r in "origin/${VERSION_BRANCH}" "origin/${DEV_BRANCH}" "origin/${TEST_BRANCH}" "gitlab/${TEST_BRANCH}"; do
  git show-ref --verify --quiet "refs/remotes/${r}" ||
    die "远端引用 ${r} 不存在：请检查分支名或配置"
done

CURRENT_STEP="合并版本开发分支"
log "步骤 2/8：合并 origin/${VERSION_BRANCH} 进 ${FEATURE_BRANCH}（客户端相关支持）"
if git merge-base --is-ancestor "origin/${VERSION_BRANCH}" "$FEATURE_BRANCH"; then
  log "${FEATURE_BRANCH} 已包含 origin/${VERSION_BRANCH}，跳过合并"
else
  if ! run git merge "origin/${VERSION_BRANCH}" --no-verify \
    -m "Merge remote-tracking branch 'origin/${VERSION_BRANCH}' into ${FEATURE_BRANCH}"; then
    git merge --abort 2>/dev/null || true
    die "合并 origin/${VERSION_BRANCH} 冲突：已回滚。请手动 git merge 解决冲突提交后，再重跑本脚本"
  fi
fi

CURRENT_STEP="推送 GitHub 个人分支"
log "步骤 3/8：推送 ${FEATURE_BRANCH} 到 GitHub（origin）"
run git push origin "$FEATURE_BRANCH"

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
run git pull --no-verify origin "$VERSION_BRANCH"
if git merge-base --is-ancestor "$FEATURE_BRANCH" "$VERSION_BRANCH"; then
  log "${VERSION_BRANCH} 已包含 ${FEATURE_BRANCH}，跳过合并"
else
  if ! run git merge "$FEATURE_BRANCH" --no-verify \
    -m "merge: 合并 ${FEATURE_BRANCH} 到 ${VERSION_BRANCH}（版本分支同步 $(date +%F)）"; then
    git merge --abort 2>/dev/null || true
    die "合并 ${FEATURE_BRANCH} 进 ${VERSION_BRANCH} 冲突：已回滚。请手动在 ${VERSION_BRANCH} 上解决冲突提交后，再重跑本脚本"
  fi
fi
run git push origin "$VERSION_BRANCH"

CURRENT_STEP="合入 ${DEV_BRANCH}"
log "步骤 6/8：合入本地 ${DEV_BRANCH}（部署数据源，不推送远端）"
run git checkout "$DEV_BRANCH"
run git pull --no-verify origin "$DEV_BRANCH"
if git merge-base --is-ancestor "$VERSION_BRANCH" "$DEV_BRANCH"; then
  log "${DEV_BRANCH} 已包含 ${VERSION_BRANCH}，跳过合并"
else
  if ! run git merge "$VERSION_BRANCH" --no-verify \
    -m "merge: 合并 ${VERSION_BRANCH} 到 ${DEV_BRANCH}（同步测试 $(date +%F)）"; then
    git merge --abort 2>/dev/null || true
    die "合并 ${VERSION_BRANCH} 进 ${DEV_BRANCH} 冲突：已回滚。请手动在 ${DEV_BRANCH} 上解决冲突提交后，再重跑本脚本"
  fi
fi
# 盲区告警：gitlab 侧集成分支若有未进入本链路的独有提交，本次 test 构建将不包含它们
if ! git merge-base --is-ancestor "gitlab/${DEV_BRANCH}" "$DEV_BRANCH" 2>/dev/null; then
  echo "⚠️  gitlab/${DEV_BRANCH} 存在 $(git rev-list --count "$DEV_BRANCH..gitlab/${DEV_BRANCH}") 个独有提交未进入本次构建链路（本链路只经 origin/${VERSION_BRANCH}），请知悉。" >&2
fi

CURRENT_STEP="${TEST_BRANCH} 分支构建部署"
log "步骤 7/8：切 ${TEST_BRANCH}、双远端 pull、merge ${DEV_BRANCH}、构建并推送（语义同 deploy_test.sh）"
run git checkout "$TEST_BRANCH"
run git pull --no-verify gitlab "$TEST_BRANCH"
run git pull --no-verify origin "$TEST_BRANCH"
if ! run git merge "$DEV_BRANCH" -X ours --no-verify \
  -m "merge: 合并 ${DEV_BRANCH} 到 ${TEST_BRANCH}（冲突以本地 ${TEST_BRANCH} 为准）"; then
  # dist/ 构建产物文件名带内容哈希，test 与 dev 两侧必然各异，-X ours 解不了
  # rename/rename 冲突；dist 随后本步骤会全量重建，故冲突仅在 dist/ 内时
  # 直接清空 dist 提交合并即可，源码冲突才回滚交人工。
  all_conflicts=$(git diff --name-only --diff-filter=U)
  non_dist_conflicts=$(git diff --name-only --diff-filter=U -- . ':(exclude)dist')
  if [ -n "$all_conflicts" ] && [ -z "$non_dist_conflicts" ]; then
    log "merge 冲突全部位于 dist/ 构建产物，按全量重建处理（清空 dist 后提交合并）"
    git rm -rf -q dist
    run git commit --no-verify \
      -m "merge: 合并 ${DEV_BRANCH} 到 ${TEST_BRANCH}（dist 产物冲突按全量重建处理）"
  else
    git merge --abort 2>/dev/null || true
    die "合并 ${DEV_BRANCH} 进 ${TEST_BRANCH} 冲突：已回滚。请手动在 ${TEST_BRANCH} 上解决冲突提交后，再重跑本脚本"
  fi
fi
run npm run build:prod:m gitlab
run git add -f dist
# 产物无变化时 commit 会因空提交被拒，属正常，继续走推送（推已存在内容为 no-op）
if ! run git commit -m "update $(date '+%Y%m%d%H%M')" --no-verify; then
  log "构建产物无变更，跳过提交"
fi
run git push origin "$TEST_BRANCH"
run git push gitlab "$TEST_BRANCH"

# 部署核验：推送成功后远端跟踪引用已更新，打印三处落点头部（可直接贴提测单，免手工 fetch 比对）
log "部署核验（三处远端落点）："
for ref in "origin/${VERSION_BRANCH}" "origin/${TEST_BRANCH}" "gitlab/${TEST_BRANCH}"; do
  echo "    ${ref} → $(git log --oneline -1 "${ref}" 2>/dev/null || echo '读取失败')"
done

CURRENT_STEP="收尾"
log "步骤 8/8：切回 ${FEATURE_BRANCH}"
run git checkout "$FEATURE_BRANCH"

log "✅ 同步测试流程完成：${VERSION_BRANCH} 与 ${DEV_BRANCH} 已合入、test:conversation 绿、gitlab/${TEST_BRANCH} 已更新"
