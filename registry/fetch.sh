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

[ $# -ge 2 ] || usage
ACTION="$1"; REPO="$2"; shift 2

case "$REPO" in
  shadcn-ui) BASE="$SHADCN" ;;
  magic-ui)  BASE="$MAGIC" ;;
  *) echo "未知仓库: $REPO"; usage ;;
esac

if [ "$ACTION" = "list" ]; then
  if [ "$REPO" = "magic-ui" ] && [ -f "$ROOT/magic-ui/registry.json" ]; then
    python3 - "$ROOT/magic-ui/registry.json" <<'PY'
import json, sys
j = json.load(open(sys.argv[1]))
names = [i.get("name") for i in j.get("items", []) if i.get("name")]
print(f"Magic UI 共 {len(names)} 个条目：")
print("  " + "  ".join(sorted(set(names))))
PY
  else
    echo "$REPO 已缓存文件："
    ls -1 "$ROOT/$REPO" | sed 's/\.tsx$//' | sed 's/^/  /'
  fi
  exit 0
fi

[ "$ACTION" = "get" ] || [ "$ACTION" = "shadcn-ui" ] || [ "$ACTION" = "magic-ui" ] || true

# 支持 `fetch.sh shadcn-ui button card` 这种省略 get 的写法
if [ "$ACTION" != "get" ]; then
  NAMES=("$ACTION" "$@")
else
  NAMES=("$@")
fi

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
