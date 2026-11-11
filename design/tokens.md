# 设计 token · Lioran-Seoul

> 默认审美：中性、克制、现代的大厂感。**Seoul 只是项目名，不代表任何风格倾向**，不要往「韩系留白 / 柔和粉彩」方向解读。
> 所有数值以 Tailwind 刻度为准。目标是「不统一就永远丑」——同类元素在任何页面必须取同一组值。

---

## 1. 间距刻度

只允许下列值，禁止出现 `13px` / `7px` / `18px` 这类随手数。

| token | px | 典型用途 |
|---|---|---|
| `1` | 4 | 图标与文字间隙、细线内边距 |
| `2` | 8 | 紧凑元素内部、chip |
| `3` | 12 | 按钮内纵向、输入框内边距 |
| `4` | 16 | 卡片内边距、表单项间距（**默认基准**） |
| `6` | 24 | 组件之间、区块内分组 |
| `8` | 32 | 小节间距 |
| `12` | 48 | 区块内大留白 |
| `16` | 64 | 区块与区块之间 |
| `24` | 96 | 落地页 section 间距 |

**节奏规则**：一个 section 内部的间距级差不超过 2 档；相邻区块之间至少比区块内部最大间距高一档。

---

## 2. 字号 / 行高阶梯

最多 5 级，不要中间态。

| 级别 | 字号 | 行高 | 字重 | 字距 | 用途 |
|---|---|---|---|---|---|
| display | 48–60px | 1.05 | 600 | -0.03em | 仅 Hero 主标题 |
| h1 | 36px | 1.15 | 600 | -0.02em | 页面标题 |
| h2 | 24px | 1.3 | 600 | -0.01em | 区块标题 |
| h3 | 18px | 1.4 | 500 | 0 | 卡片标题 |
| body | 14–16px | 1.6 | 400 | 0 | 正文 |
| caption | 12–13px | 1.5 | 400 | 0.01em | 辅助信息、标签 |

正文一行控制在 60–75 字符；表格与数据密集区可降到 13px，但不得低于 12px。

---

## 3. 圆角 / 边框 / 阴影

| 元素 | 圆角 | 边框 | 阴影 |
|---|---|---|---|
| 按钮、输入框、select | 8px | 1px `--border` | 无（仅 focus ring） |
| 卡片、弹窗、Bento 单元 | 12px | 1px `--border` | `0 1px 2px rgba(0,0,0,.04)` |
| 浮层、下拉、Tooltip | 10px | 1px `--border` | `0 8px 24px rgba(0,0,0,.08)` |
| 头像、圆形图标容器 | 9999px | — | — |
| 大区块容器 | 16px | 可选 | 可选 |

**同层级必须一致**：同一页面里所有卡片圆角相同，所有按钮圆角相同。
focus 统一用 `outline: 2px solid var(--accent); outline-offset: 2px`，不要各写各的。

---

## 4. 配色

### 浅色（默认）

```css
--bg:            #ffffff;
--bg-subtle:     #fafafa;
--bg-muted:      #f4f4f5;
--surface:       #ffffff;
--text:          #18181b;
--text-secondary:#52525b;
--text-tertiary: #71717a;
--border:        #e4e4e7;
--border-strong: #d4d4d8;
--accent:        #4f46e5;
--accent-hover:  #4338ca;
--accent-soft:   #eef2ff;
--success:       #16a34a;
--warning:       #d97706;
--danger:        #dc2626;
```

### 深色（SaaS / AI 产品可选）

```css
--bg:            #09090b;
--bg-subtle:     #101012;
--bg-muted:      #18181b;
--surface:       #131316;
--text:          #fafafa;
--text-secondary:#a1a1aa;
--text-tertiary: #71717a;
--border:        #27272a;
--border-strong: #3f3f46;
--accent:        #818cf8;
--accent-soft:   #1e1b4b;
```

**规则**

- 全站**有且只有一个强调色**。第二套彩色只用于语义状态（success / warning / danger）。
- 正文对背景对比度 ≥ 4.5:1，大字号 ≥ 3:1。
- 中性色承担 90% 面积；彩色是点缀，不是底色。
- 渐变只允许出现在文字、背景光晕、边框高光，不允许做主内容底色。

---

## 5. 图标

- 全部来自 `lucide-react`，尺寸只用 **16 / 20 / 24**，线宽统一（默认 1.75–2）。
- **禁止 Emoji 当图标**，禁止混用多套图标集。
- 图标颜色继承文字色（`currentColor`），不单独指定彩色。
- 对照表见 `registry/foundation/lucide-icons.md`。

---

## 6. 动效

| 类型 | 时长 | 缓动 |
|---|---|---|
| 微交互（hover / 按下 / focus） | 150–200ms | `ease-out` |
| 展开 / 收起、切换 | 200–300ms | `ease-in-out` |
| 入场（opacity + y） | 300–500ms | `cubic-bezier(.16,1,.3,1)` |
| 列表 stagger | 每项间隔 ≤ 60ms | 同上 |
| 页面切换 | 300–400ms | 同上 |
| 装饰性循环动画 | ≥ 8s，且必须可暂停 | `linear` |

**硬限制**

- 任何装饰动画不得超过 800ms，避免「等动画」的迟滞感。
- 只用 `transform` 和 `opacity` 做动画，不动画 `width` / `height` / `top` / `left`。
- 必须实现 `@media (prefers-reduced-motion: reduce)` 降级为无动画。
- 一屏最多一个主特效；数据密集页面（表格 / 仪表盘 / 表单）不加光晕与粒子。

---

## 7. 状态

每个可交互元素必须齐备 4 态，缺一即视为未完成：

| 状态 | 表现 |
|---|---|
| default | 基准色 |
| hover | 背景或边框提亮一档，不位移 |
| focus-visible | 统一 focus ring |
| disabled | 透明度 .5 + `cursor: not-allowed`，无 hover 反馈 |

加载态用骨架屏或 spinner，禁止让按钮「点了没反应」。错误态用 `--danger` 边框 + 文字提示，不只靠颜色。
