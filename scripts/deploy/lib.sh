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

# 子模块对齐：无仓库权限/网络不通（开源社区版、无权限同事的常态）只警告并跳过，
# 不弹登录（GCM/终端口令）、不退避重试；已存的凭据仍可静默使用。后续 sync-micro-apps 按空目录跳过微应用。
update_submodules_soft() {
  if (
    export GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never
    run git -c credential.interactive=never submodule update --init --recursive
  ); then
    return 0
  fi
  echo "    ⚠️ 子模块拉取失败（多为无仓库权限），已跳过；对应微应用将被跳过（资料库/消息等功能缺失）" >&2
  return 0
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

# 共享分支（版本/dev/test）在同事克隆里可能未检出（单分支克隆常态）：缺失时从远端补建。
# 基底引用由调用方先校验存在；个人分支是提测输入，不走此函数。
ensure_local_branch() { # ensure_local_branch <分支> <基底引用>
  local branch=$1 base=$2
  git show-ref --verify --quiet "refs/heads/${branch}" && return 0
  run git branch "$branch" "$base"
  log "已自动补建本地分支 ${branch} ← ${base}（当前克隆未检出该分支）"
}

# 需人工处理的源码冲突文件（排除机器产物）
source_conflict_files() {
  git diff --name-only --diff-filter=U -- . ':(exclude)dist' ':(exclude)src/constants/version.ts' 2>/dev/null || true
}

# 合并时两侧微应用 pin / gitlink 不一致：不按 ours/theirs 取舍。
# 2026-10-23 实证：部分克隆（blob:none）读不到合并基线对象时，git 会把本可快进的子模块报成
# “commits don't follow merge-base”，提测因此整段回滚。登记在 apps.json 里的指针冲突直接对齐
# 子模块 origin/<branch> 尖端；adapter.json 若还有 pin 以外的字段冲突则返回 1，交给调用方回滚。
# 返回 0 表示没有这类冲突，或已经把它们暂存好。
resolve_microapp_pin_conflicts() {
  [ -f micro-frontends/apps.json ] || return 0
  local plan adapter source_dir branch tip
  if ! plan="$(node --input-type=module <<'EOF'
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const gitOut = (args) => execFileSync('git', args, { encoding: 'utf8' });
const unmerged = new Set(
  gitOut(['diff', '--name-only', '--diff-filter=U']).split('\n').filter(Boolean),
);
const apps = JSON.parse(fs.readFileSync('micro-frontends/apps.json', 'utf8'));
const lines = [];
for (const app of apps) {
  const adapter = app.adapter;
  let confText = '';
  if (unmerged.has(adapter)) {
    let theirsText = '';
    try {
      confText = gitOut(['show', `:2:${adapter}`]);
      theirsText = gitOut(['show', `:3:${adapter}`]);
    } catch {
      console.error(`无法读取 ${adapter} 的两侧版本，需人工取舍`);
      process.exit(2);
    }
    let ours;
    let theirs;
    try {
      ours = JSON.parse(confText);
      theirs = JSON.parse(theirsText);
    } catch {
      console.error(`${adapter} 不是合法 JSON，需人工取舍`);
      process.exit(2);
    }
    const keys = new Set([...Object.keys(ours), ...Object.keys(theirs)]);
    const extra = [...keys].filter(
      (key) => key !== 'pin' && JSON.stringify(ours[key]) !== JSON.stringify(theirs[key]),
    );
    if (extra.length) {
      console.error(
        `微应用 adapter 冲突超出 pin 字段，需人工取舍：${adapter}（${extra.join(', ')}）`,
      );
      process.exit(2);
    }
  } else if (fs.existsSync(adapter)) {
    confText = fs.readFileSync(adapter, 'utf8');
  } else {
    continue;
  }
  const conf = JSON.parse(confText);
  const sourceDir = conf.sourceDir;
  if (!unmerged.has(adapter) && !(sourceDir && unmerged.has(sourceDir))) continue;
  if (!sourceDir || !conf.branch) {
    console.error(`${adapter} 缺少 sourceDir 或 branch，无法对齐最新提交`);
    process.exit(2);
  }
  lines.push([adapter, sourceDir, conf.branch].join('\t'));
}
if (lines.length) process.stdout.write(`${lines.join('\n')}\n`);
EOF
)"; then
    return 1
  fi
  [ -n "$plan" ] || return 0
  while IFS=$'\t' read -r adapter source_dir branch; do
    [ -n "${adapter:-}" ] || continue
    log "微应用指针冲突，不取两侧版本，拉取 ${source_dir} 的 origin/${branch} 最新"
    retry_git 3 -C "$source_dir" fetch origin "$branch" || return 1
    tip="$(git -C "$source_dir" rev-parse "origin/${branch}")" || return 1
    git -C "$source_dir" checkout -q --detach "$tip" || return 1
    node --input-type=module -e '
      import { execFileSync } from "node:child_process";
      import fs from "node:fs";
      const adapter = process.argv[1];
      const tip = process.argv[2];
      let text;
      try {
        text = execFileSync("git", ["show", `:2:${adapter}`], { encoding: "utf8" });
      } catch {
        text = fs.readFileSync(adapter, "utf8");
      }
      const pin = JSON.parse(text).pin;
      if (!pin || !text.includes(pin)) {
        console.error(`${adapter} 找不到可替换的 pin`);
        process.exit(2);
      }
      fs.writeFileSync(adapter, text.split(pin).join(tip));
    ' "$adapter" "$tip" || return 1
    git add -- "$adapter" "$source_dir" || return 1
    log "已对齐 ${source_dir} → ${tip:0:9}"
  done <<<"$plan"
}

# merge 冲突自动消化：机器产物冲突无须人工——dist/ 产物文件名带哈希两侧必然各异（随后全量重建）、
# version.ts 烤哈希两侧各异（构建时统一重写，取本地侧）。微应用 pin/gitlink 冲突对齐远端最新。
# 仅当剩下的冲突全部属于机器产物才消化并提交合并；存在其它源码冲突则返回 1（调用方 abort 交人工）。
# 调用前提：merge 冲突态尚未 abort。
resolve_machine_conflicts() { # $1=合并提交信息
  local all nonauto
  all=$(git diff --name-only --diff-filter=U)
  [ -n "$all" ] || return 1
  resolve_microapp_pin_conflicts || return 1
  all=$(git diff --name-only --diff-filter=U)
  if [ -z "$all" ]; then
    rgit commit --no-verify -m "$1"
    return 0
  fi
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

# 全量会话门被机器打满时会成片超时（2026-10-23 实证：7 个失败全是 Test timed out in 5000ms，
# 隔离复跑全绿）。失败箭头行全部是超时时退避重试；夹杂断言失败则立即停下，避免把真回归重跑掉。
# GATE_JITTER_RETRIES 是首次失败后的额外次数，GATE_JITTER_BACKOFF 是每次重试前的等待秒数。
GATE_JITTER_RETRIES="${GATE_JITTER_RETRIES:-1}"
GATE_JITTER_BACKOFF="${GATE_JITTER_BACKOFF:-15}"

# 只认 vitest 的 “→ ” 原因行。没有原因行（加载崩溃、脚本直接退出）不算抖动。
gate_failure_is_jitter() { # $1=质量门日志
  local reasons
  reasons="$(grep -E '^[[:space:]]*→ ' "$1" 2>/dev/null || true)"
  [ -n "$reasons" ] || return 1
  if printf '%s\n' "$reasons" | grep -v 'Test timed out' | grep -q .; then
    return 1
  fi
  return 0
}

report_gate_failure() { # $1=日志 $2=失败套件清单（可空）
  local log_file="$1" failed="$2" f unexpected=0 keep_log
  echo "---- 质量门未全绿，核对失败套件是否全部在存量挂清单内 ----" >&2
  keep_log="$(cd "$(git rev-parse --git-common-dir)" && pwd -P)/nuwax-deploy/gate-failure.log"
  mkdir -p "$(dirname "$keep_log")"
  cp "$log_file" "$keep_log"
  echo "完整输出已保存：${keep_log}" >&2
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
    echo "③ 大面积一起挂（十几个文件）先查环境再查代码：node -v 看版本是否与团队一致、" >&2
    echo "   node_modules 是否过期（pnpm install 重装；本仓锁定 pnpm，勿用 npm install 混装）。" >&2
    return 1
  }
  echo "⚠️  质量门以「仅存量挂」放行（清单：${KNOWN_BROKEN_TESTS}）。请尽快修复存量套件并从清单移除。" >&2
  return 0
}

# 跑一轮质量门。成功或「仅存量挂」返回 0；真失败返回 1，并把日志路径、失败套件写到调用方变量。
run_test_gate_once() { # 写出 GATE_LOG_FILE、GATE_FAILED_FILES
  local log_file
  # src/.umi 是 gitignored 的生成物，tsconfig.json extends 它；缺失会让 14 个会话测试文件整体加载失败
  if [ ! -f src/.umi/tsconfig.json ]; then
    echo "    src/.umi 缺失，先执行 pnpm run setup 生成"
    pnpm run setup || return 1
  fi
  log_file="$(mktemp -t deploy_sync_gate)"
  GATE_LOG_FILE="$log_file"
  GATE_FAILED_FILES=""
  if pnpm run test:conversation 2>&1 | tee "$log_file"; then
    rm -f "$log_file"
    GATE_LOG_FILE=""
    return 0
  fi
  # 只认 vitest 规范的行首 FAIL 行；用例名含 FAILED 字样的 stdout/stderr 行不得误报
  GATE_FAILED_FILES="$(grep -E '^[[:space:]]*FAIL[[:space:]]+tests/' "$log_file" | grep -oE 'tests/[^ ]+\.test\.(ts|tsx)' | sort -u || true)"
  return 1
}

# 质量门：跑 test:conversation；失败时解析失败套件，仅当全部命中存量挂清单才放行。
# 超时抖动按 GATE_JITTER_RETRIES 重试，重试仍失败才打印人工定位并返回 1。
run_test_gate() {
  if [ "${DRY_RUN:-0}" = "1" ]; then
    echo "    \$ pnpm run test:conversation"
    echo "    [dry-run] 已跳过"
    return 0
  fi
  local attempt=0 max_attempts=$(( ${GATE_JITTER_RETRIES:-1} + 1 ))
  while [ "$attempt" -lt "$max_attempts" ]; do
    attempt=$((attempt + 1))
    if run_test_gate_once; then
      return 0
    fi
    # 全部命中存量挂清单时直接放行，不占用抖动重试。
    if [ -n "$GATE_FAILED_FILES" ] && gate_failures_are_known "$GATE_FAILED_FILES"; then
      report_gate_failure "$GATE_LOG_FILE" "$GATE_FAILED_FILES"
      rm -f "$GATE_LOG_FILE"
      return 0
    fi
    # 没有失败套件清单（进程崩溃、脚本直接退出）或夹杂断言失败时不重试。
    if [ "$attempt" -lt "$max_attempts" ] && [ -n "${GATE_LOG_FILE:-}" ] && gate_failure_is_jitter "$GATE_LOG_FILE"; then
      log "质量门失败均为超时，疑似负载抖动，${GATE_JITTER_BACKOFF}s 后重试（第 ${attempt}/${GATE_JITTER_RETRIES} 次额外尝试）"
      sleep "$GATE_JITTER_BACKOFF"
      rm -f "$GATE_LOG_FILE"
      continue
    fi
    if [ -n "${GATE_LOG_FILE:-}" ]; then
      report_gate_failure "$GATE_LOG_FILE" "$GATE_FAILED_FILES" || true
    fi
    rm -f "${GATE_LOG_FILE:-}"
    return 1
  done
  return 1
}

# 失败套件是否全部在存量挂清单内。清单为空或有任一未登记套件则返回 1。
gate_failures_are_known() { # $1=失败套件清单
  local f
  [ -n "${1:-}" ] || return 1
  [ -n "${KNOWN_BROKEN_TESTS:-}" ] || return 1
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    case "|$KNOWN_BROKEN_TESTS|" in
    *"|$f|"*) ;;
    *) return 1 ;;
    esac
  done <<<"$1"
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
