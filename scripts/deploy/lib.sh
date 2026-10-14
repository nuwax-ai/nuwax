# shellcheck shell=bash
#
# scripts/deploy/lib.sh —— 提测脚本共用函数（deploy_test.sh 快速通道 / scripts/deploy_sync_test.sh 全链）
#
# 由调用方 source；调用方需先 set -euo pipefail，并可选提供：
#   DRY_RUN          1 时 run() 只打印不执行
#   CURRENT_STEP     失败提示里的当前步骤名
#   return_to_start  失败归位函数（die 时调用；未定义则跳过）
#   KNOWN_BROKEN_TESTS 质量门存量挂放行清单（| 分隔）

log() { echo ">>> $*"; }
die() {
  trap - ERR
  echo "❌ $*" >&2
  if declare -F return_to_start >/dev/null; then return_to_start; fi
  exit 1
}

# 写操作统一走 run()：DRY_RUN=1 时只打印不执行
run() {
  echo "    \$ $*"
  if [ "${DRY_RUN:-0}" = "1" ]; then
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

# gitlab 远端是内网测试环境落点；同事克隆常只配了 origin，缺失时自动补配
# （2026-10-14 实证：缺远端被当网络错误空耗 3 轮重试后中止）。URL 可用 GITLAB_REMOTE_URL 覆写。
# DRY_RUN 下经 run() 只打印不落配置。
ensure_gitlab_remote() {
  if git remote get-url gitlab >/dev/null 2>&1; then
    return 0
  fi
  local url="${GITLAB_REMOTE_URL:-https://git.yichamao.com/agent-platform/nuwax.git}"
  run git remote add gitlab "$url"
  log "已自动补配 gitlab 远端 → ${url}"
}

# 需人工处理的源码冲突文件（排除机器产物）
source_conflict_files() {
  git diff --name-only --diff-filter=U -- . ':(exclude)dist' ':(exclude)src/constants/version.ts' 2>/dev/null || true
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

# 合并冲突态下：先记下源码冲突清单，再回滚合并，最后打印清单并退出（回滚后清单就查不到了）。
abort_merge_die() { # $1=中文错误信息
  local files
  files="$(source_conflict_files)"
  git merge --abort 2>/dev/null || true
  echo "---- 源码冲突文件（需人工按语义取舍，机器产物已自动消化，此处仅列需人看的）----" >&2
  [ -z "$files" ] || echo "$files" | sed 's/^/    /' >&2
  die "$1"
}

# 合并 ref 进当前分支：已包含则跳过；机器产物冲突自动消化；源码冲突打印清单后回滚并退出。
merge_or_die() { # $1=被合并的 ref $2=合并提交信息
  if git merge-base --is-ancestor "$1" HEAD; then
    log "已包含 $1，跳过合并"
    return 0
  fi
  rgit merge "$1" --no-verify -m "$2" && return 0
  resolve_machine_conflicts "$2（机器产物冲突自动消化）" && return 0
  abort_merge_die "合并 $1 进 $(git branch --show-current) 存在源码冲突，已回滚，未构建也未推送。解决冲突并提交后重跑"
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

# 子模块远端分支领先登记 pin 的清单（只 fetch 子模块远端引用，不改 HEAD/pin/index）。
# 输出形如 " repo(d223ab9e7→1a2b3c4d5) message(...)"；全部已是远端尖时输出为空。
detect_microapp_upgrades() {
  [ -f micro-frontends/apps.json ] || return 0
  local app_id src_dir branch pin tip upgrades=""
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
  printf '%s' "$upgrades"
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
  if [ "${DRY_RUN:-0}" = "1" ]; then
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
