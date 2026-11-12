#!/usr/bin/env bash
# Lioran-Seoul · 按需从上游拉取任意组件源码
#
#   ./registry/fetch.sh shadcn-ui button        # 拉一个 shadcn 组件
#   ./registry/fetch.sh magic-ui marquee        # 拉一个 Magic UI 组件
#   ./registry/fetch.sh shadcn-ui button card   # 一次拉多个
#   ./registry/fetch.sh list magic-ui           # 列出 Magic UI 全部可用组件名
#   ./registry/fetch.sh list shadcn-ui          # 列出 shadcn 已缓存/常用组件名
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHADCN="https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui"
MAGIC="https://raw.githubusercontent.com/magicuidesign/magicui/main/apps/www/registry/magicui"

usage() {
  echo "用法: fetch.sh <shadcn-ui|magic-ui> <name...>  |  fetch.sh list <shadcn-ui|magic-ui>"
  exit 1
}

list_cached() {
  local repo="$1" dir="$ROOT/$1"
  if [ ! -d "$dir" ]; then
    echo "$repo 目录不存在"
    return 0
  fi
  echo "$repo 已缓存文件："
  ls -1 "$dir" | sed 's/\.tsx$//' | sed 's/^/  /'
}

[ $# -ge 1 ] || usage

# ---- list 子命令 ----
if [ "$1" = "list" ]; then
  REPO="${2:-}"
  case "$REPO" in
    magic-ui)
      if [ -f "$ROOT/magic-ui/registry.json" ]; then
        python3 - "$ROOT/magic-ui/registry.json" <<'PYEOF'
import json, sys
j = json.load(open(sys.argv[1]))
names = [i.get("name") for i in j.get("items", []) if i.get("name")]
print(f"Magic UI 共 {len(names)} 个条目：")
print("  " + "  ".join(sorted(set(names))))
PYEOF
      else
        list_cached magic-ui
      fi
      ;;
    shadcn-ui) list_cached shadcn-ui ;;
    *) echo "未知仓库: ${REPO:-<空>}"; usage ;;
  esac
  exit 0
fi

# ---- 拉取组件：兼容 `fetch.sh <repo> <name>` 与 `fetch.sh get <repo> <name>` ----
if [ "$1" = "get" ]; then shift; fi
REPO="${1-}"
shift || true
case "$REPO" in
  shadcn-ui) BASE="$SHADCN" ;;
  magic-ui)  BASE="$MAGIC" ;;
  *) echo "未知仓库: ${REPO:-<空>}"; usage ;;
esac
[ $# -ge 1 ] || usage
NAMES=("$@")

for name in "${NAMES[@]}"; do
  name="${name%.tsx}"
  dest="$ROOT/$REPO/$name.tsx"
  if curl -fsSL --max-time 25 "$BASE/$name.tsx" -o "$dest"; then
    echo "OK   $REPO/$name.tsx  ($(wc -c < "$dest" | tr -d ' ') bytes)"
  else
    echo "FAIL $REPO/$name.tsx  ← 上游不存在该组件，用 '$0 list $REPO' 查名字"
    rm -f "$dest"
  fi
done
