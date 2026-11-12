#!/usr/bin/env bash
# Lioran-Seoul · 一键激活 GitHub Actions CI
#
#   ./scripts/enable-ci.sh                 # 交互式，静默输入 token
#   GH_WORKFLOW_TOKEN=ghp_xxx ./scripts/enable-ci.sh
#   ./scripts/enable-ci.sh ghp_xxx         # 会进 shell 历史，不推荐
#
# 做的事：
#   1. 校验 token 是否具备 workflow 权限（没有就直接告诉你怎么办）
#   2. 把 token 存进 git 凭据（osxkeychain / 系统凭据助手）
#   3. 把 ci/github-actions.yml 移到 .github/workflows/ci.yml
#   4. README 补 CI 徽章
#   5. 提交并推送
#   6. 等 Actions 跑完，打印结论与链接
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REPO_SLUG="Jianheng71/Lioran-Seoul"
TEMPLATE="ci/github-actions.yml"
TARGET=".github/workflows/ci.yml"

say()  { printf '%s\n' "$*"; }
fail() { printf '\033[31m%s\033[0m\n' "$*" >&2; exit 1; }

scopes_of() {
  curl -s -I -H "Authorization: token $1" https://api.github.com/user \
    | tr -d '\r' | awk -F': ' 'tolower($1)=="x-oauth-scopes"{print $2}'
}

login_of() {
  curl -s -H "Authorization: token $1" https://api.github.com/user \
    | python3 -c 'import json,sys; print(json.load(sys.stdin).get("login",""))'
}

# ---------- 1. 拿到一个有 workflow 权限的 token ----------
TOKEN="${GH_WORKFLOW_TOKEN:-}"
if [ -z "$TOKEN" ] && [ $# -ge 1 ]; then
  TOKEN="$1"
  say "⚠️  通过命令行传 token 会留在 shell 历史里，下次建议用交互式输入。"
fi
if [ -z "$TOKEN" ]; then
  say "需要一次 GitHub 授权：给 token 加上 workflow 权限。"
  say ""
  say "  1) 打开（scope 已预选 repo + workflow）："
  say "     https://github.com/settings/tokens/new?scopes=repo,workflow&description=Lioran-Seoul%20CI"
  say "  2) 或者给现有 token 补勾 workflow："
  say "     https://github.com/settings/tokens"
  say ""
  printf "粘贴 token（输入不回显）："
  read -rs TOKEN
  say ""
fi
[ -n "$TOKEN" ] || fail "没有拿到 token，退出。"

SCOPES="$(scopes_of "$TOKEN")"
# GitHub 返回形如 "repo, workflow"（逗号后带空格），比较前去掉空白
SCOPES_KEY="$(printf '%s' "$SCOPES" | tr -d '[:space:]')"
LOGIN="$(login_of "$TOKEN")"
[ -n "$LOGIN" ] || fail "token 无效或已过期。"

case ",$SCOPES_KEY," in
  *,workflow,*) ;;
  *)
    fail "这个 token 权限是 [$SCOPES]，缺少 workflow。
  给现有 token 补勾：https://github.com/settings/tokens
  或新建（scope 已预选）：https://github.com/settings/tokens/new?scopes=repo,workflow"
    ;;
esac
say "✓ token 有效：${LOGIN}（scopes: ${SCOPES}）"

# ---------- 2. 存入 git 凭据 ----------
# 沙箱或受限环境下 keychain 可能不可写，失败不致命：推送时会直接带上本次的 token
if printf 'protocol=https\nhost=github.com\nusername=%s\npassword=%s\n\n' "$LOGIN" "$TOKEN" \
   | git credential approve 2>/dev/null; then
  say "✓ 凭据已更新"
else
  say "· 系统凭据写入失败（受限环境），本次推送改为直接携带 token"
fi

# ---------- 3. 把工作流放到它的最终位置 ----------
if [ -f "$TEMPLATE" ]; then
  mkdir -p "$(dirname "$TARGET")"
  git mv "$TEMPLATE" "$TARGET" 2>/dev/null || mv "$TEMPLATE" "$TARGET"
  rmdir ci 2>/dev/null || true
  say "✓ 工作流已就位：$TARGET"
else
  say "· 工作流已在 $TARGET"
fi

# ---------- 4. README 补徽章 ----------
BADGE='[![CI](https://github.com/Jianheng71/Lioran-Seoul/actions/workflows/ci.yml/badge.svg)](https://github.com/Jianheng71/Lioran-Seoul/actions/workflows/ci.yml)'
if ! grep -q 'actions/workflows/ci.yml/badge.svg' README.md; then
  python3 - "$BADGE" <<'PY'
import sys
badge = sys.argv[1]
p = "README.md"
s = open(p, encoding="utf-8").read()
lines = s.split("\n")
if lines and lines[0].startswith("# "):
    lines.insert(1, "\n" + badge)
else:
    lines.insert(0, badge + "\n")
open(p, "w", encoding="utf-8").write("\n".join(lines))
PY
  say "✓ README 已补 CI 徽章"
fi

# ---------- 5. 提交并推送 ----------
git add -A
if git diff --cached --quiet; then
  say "· 没有需要提交的改动"
else
  git commit -q -m "ci: 启用 GitHub Actions（Node 18/20/22 跑自检）"
  say "✓ 已提交"
fi

# 用内联 credential helper 推送，绕过可能过期的系统凭据
export GH_USER="$LOGIN" GH_PASS="$TOKEN"
git -c credential.helper= \
    -c 'credential.helper=!f() { test "$1" = get && { echo "username=${GH_USER}"; echo "password=${GH_PASS}"; }; }; f' \
    push origin HEAD 2>&1 | tail -3 || true

git fetch -q origin 2>/dev/null || true
if [ "$(git rev-parse HEAD)" = "$(git rev-parse origin/main 2>/dev/null || echo none)" ]; then
  say "✓ 已推送"
else
  fail "推送失败。确认 token 有 repo + workflow 权限，且当前分支为 main。"
fi

# ---------- 6. 等结果 ----------
say ""
say "等待 Actions 启动…"
RUN_ID=""
for _ in $(seq 1 20); do
  sleep 3
  RUN_ID="$(curl -s -H "Authorization: token $TOKEN" \
    "https://api.github.com/repos/$REPO_SLUG/actions/runs?per_page=1" \
    | python3 -c 'import json,sys; r=json.load(sys.stdin).get("workflow_runs",[]); print(r[0]["id"] if r else "")')"
  [ -n "$RUN_ID" ] && break
done

if [ -z "$RUN_ID" ]; then
  say "没拿到运行记录，去这里看：https://github.com/$REPO_SLUG/actions"
  exit 0
fi

say "运行 #$RUN_ID 已创建，等待完成…"
for _ in $(seq 1 60); do
  sleep 5
  STATUS="$(curl -s -H "Authorization: token $TOKEN" \
    "https://api.github.com/repos/$REPO_SLUG/actions/runs/$RUN_ID" \
    | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("status",""), d.get("conclusion") or "")')"
  case "$STATUS" in
    "completed success")
      say ""
      say "✅ CI 通过：https://github.com/$REPO_SLUG/actions/runs/$RUN_ID"
      exit 0
      ;;
    "completed "*)
      say ""
      fail "❌ CI 失败（${STATUS}）：https://github.com/$REPO_SLUG/actions/runs/$RUN_ID"
      ;;
  esac
done

say "等了 5 分钟还没结束，去这里看：https://github.com/$REPO_SLUG/actions/runs/$RUN_ID"
