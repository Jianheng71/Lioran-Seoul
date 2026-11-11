# Lucide 图标替换对照表

> **硬规则：禁止 Emoji 当图标。所有图标一律 `lucide-react`。**
> 这是解决「AI 生成代码一眼廉价」成本最低、收益最高的一步，属于 L0 必做项。

## 1. 用法规范

```tsx
import { ArrowRight, Check, Zap, Settings } from "lucide-react"

<ArrowRight size={16} strokeWidth={1.75} aria-hidden="true" />
```

- 尺寸只用 **16 / 20 / 24**，同一界面内同层级图标尺寸一致
- `strokeWidth` 全站统一（推荐 `1.75` 或 `2`），不要一处 1.5 一处 2.5
- 颜色继承 `currentColor`，不单独写彩色
- 纯装饰图标加 `aria-hidden="true"`；图标按钮必须在按钮上加 `aria-label`
- 图标与文字间距用 `gap-2`（8px），不要手写 margin

---

## 2. 常见 Emoji → Lucide 映射

| Emoji | Lucide | Emoji | Lucide |
|---|---|---|---|
| ✅ ✔️ | `Check` / `CheckCircle2` | ❌ ✖️ | `X` / `XCircle` |
| 🚀 | `Rocket` | ⚡ | `Zap` |
| ⭐ 🌟 | `Star` | ❤️ | `Heart` |
| 🔥 | `Flame` | 💡 | `Lightbulb` |
| 🎯 | `Target` | 📈 📊 | `TrendingUp` / `BarChart3` |
| 🔔 | `Bell` | ⚙️ 🔧 | `Settings` / `Wrench` |
| 📁 📂 | `Folder` / `FolderOpen` | 🔍 | `Search` |
| ➕ | `Plus` | ➖ | `Minus` |
| ⚠️ ❗ | `AlertTriangle` | ℹ️ | `Info` |
| 📧 ✉️ | `Mail` | 🔒 | `Lock` |
| 👤 🧑 | `User` / `Users` | 🛒 | `ShoppingCart` |
| ⬇️ | `Download` | ⬆️ | `Upload` |
| ✏️ 📝 | `Pencil` / `FileText` | 🗑️ | `Trash2` |
| ⏰ 🕐 | `Clock` | 💬 | `MessageCircle` |
| 🌙 | `Moon` | ☀️ | `Sun` |
| → | `ArrowRight` | ↗ | `ArrowUpRight` |
| ← | `ArrowLeft` | ↓ | `ArrowDown` |
| 🔗 | `Link` | 🔄 | `RefreshCw` |
| 🏠 | `Home` | 📱 | `Smartphone` |
| 💳 | `CreditCard` | 🏆 | `Trophy` |
| 🎨 | `Palette` | 🧩 | `Puzzle` |
| 🛡️ | `Shield` | ✨ | `Sparkles` |

**语义优先**：找不到完全对应的，按「这个图标在这句话里表达什么动作/状态」选，不要按 Emoji 的字面图形硬套。例如表格里的 ✅ 表示「已完成」用 `CheckCircle2`，表示「已勾选」用 `Check`。

---

## 3. 混合图标集清理

用户代码里常同时出现多套图标，按以下优先级统一：

1. 已有 `lucide-react` → 保留，把其余全部换成 Lucide
2. 只有 `@radix-ui/react-icons` / `react-icons` / `heroicons` → 全量替换成 Lucide（**包括 Magic UI 官方示例里的 `ArrowRightIcon`**）
3. 自定义 SVG 图标 → 若是品牌 logo 保留；若是通用功能图标，换 Lucide
4. 图片当图标 → 换 Lucide，除非是品牌资产

替换后统一 `size` 与 `strokeWidth`，否则视觉上仍然"不统一"。

---

## 4. 禁止事项

- ❌ Emoji 当功能图标（正文里的表情符号不在此限，但产品 UI 里建议一并清掉）
- ❌ 一个界面混用两套图标集
- ❌ 给图标单独上彩色（语义色除外，如 danger 用红色）
- ❌ 用 `font-size` 调图标大小
- ❌ 图标按钮没有 `aria-label`
- ❌ 用图标表达状态却不配文字（颜色 + 图标也不够，要有可访问文本）

---

## 5. 检查命令

```bash
# 找出残留的 Emoji（粗略扫描）
grep -rnP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' <目标目录> --include='*.tsx' --include='*.jsx' --include='*.html'

# 找出非 Lucide 图标库
grep -rnE "@radix-ui/react-icons|react-icons|heroicons|@heroicons" <目标目录>
```
