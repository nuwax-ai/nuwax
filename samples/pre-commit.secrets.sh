#!/usr/bin/env bash
# nuwa-sdlc-kit v1.1.0 · sample — pre-commit 秘钥地板（agent 无关强制层）
# 安装：nuwa-sdlc init --pre-commit（拷入 .git/hooks/pre-commit 并加执行位）
# 豁免与引擎 guard-paths 同规：example/sample/template 后缀 + 构建噪音目录
set -eu

EXEMPT='(\.example|\.sample|\.template)$|^(node_modules|dist|target|buildtrees|vcpkg_installed)/'
PATTERN='(^|/)\.env(\.[^/]+)?$|\.pem$|\.key$|\.(pfx|p12)$|(^|/)id_(rsa|ed25519|ecdsa)$|[Cc]redential|[Ss]ecrets?\.(json|ya?ml|txt)$'

hits="$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null | grep -Ev "$EXEMPT" | grep -E "$PATTERN" || true)"
if [ -n "$hits" ]; then
  echo "❌ [nuwa-sdlc-kit pre-commit] 疑似秘钥文件被暂存，提交被拒：" >&2
  echo "$hits" >&2
  echo "   人工评审后绕过：git commit --no-verify" >&2
  exit 1
fi
