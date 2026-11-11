# 组件素材库索引

> **用法：要用哪个组件，直接打开 `registry/` 下对应文件复制源码。** 全部是 2026-11 从上游 GitHub 仓库拉取的真实源码，不是凭记忆写的示例。
> 缺组件时用 `./registry/fetch.sh <repo> <name>` 现拉，或用 `./registry/fetch.sh list magic-ui` 查完整目录。

## 来源

| 目录 | 上游仓库 | 上游路径 | 许可 |
|---|---|---|---|
| `shadcn-ui/` | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | `apps/v4/registry/new-york-v4/ui/` | MIT |
| `magic-ui/` | [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | `apps/www/registry/magicui/` | MIT |
| `magic-ui/registry.json` | 同上 | 根目录，完整组件目录（约 11 万字符） | MIT |
| `motion/` | [motiondivision/motion](https://github.com/motiondivision/motion) + [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | 官方 README / API 整理的可复制配方 | MIT |

**内置规范**（不单列仓库）：Tailwind CSS、Lucide Icons → 见 `foundation/`。
**备选皮肤**：Aceternity UI → 见文末。

---

## L1 · shadcn/ui 基础组件

| 文件 | 导出 | 用途 |
|---|---|---|
| `button.tsx` | `Button`, `buttonVariants` | 主/次/幽灵按钮，支持 `asChild` |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter` | 卡片容器全套 |
| `input.tsx` | `Input` | 输入框 |
| `dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` | 弹窗 |
| `badge.tsx` | `Badge`, `badgeVariants` | 标签 / 状态徽章 |
| `tabs.tsx` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `tabsListVariants` | 标签页 |
| `separator.tsx` | `Separator` | 分割线 |
| `tooltip.tsx` | `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent` | 提示浮层 |

**替换时的铁律**：只换渲染外壳，原有 `onClick` / `value` / `type` / `disabled` / `onChange` 等全部 props 与事件绑定原样透传。

> ⚠️ **shadcn v4 源码注意**：仓库里写的是 `import { cn } from "cn"`、`import { Slot } from "radix-ui"`，这是 monorepo 内部别名。用官方 CLI 安装时会自动改写成 `@/lib/utils` 和 `radix-ui` 的实际引用。**直接复制本目录文件到用户项目前，先把 `cn` 的导入路径改成目标项目的工具函数路径**，并确认装了 `radix-ui`、`class-variance-authority`、`lucide-react`。

---

## L3 · Magic UI 特效组件

| 文件 | 导出 | 关键 props | 适用场景 | 依赖 |
|---|---|---|---|---|
| `marquee.tsx` | `Marquee` | `reverse`, `pauseOnHover`, `vertical`, `repeat=4`, `className`, `children` | 客户 logo 墙、滚动标语 | 需自定义 `animate-marquee` keyframes |
| `bento-grid.tsx` | `BentoGrid`, `BentoCard` | Grid: `children`, `className`；Card: `name`, `background`, `Icon`, `description`, `href`, `cta`, `className` | 特性区、能力罗列 | shadcn `Button`；示例图标违规，见下 |
| `particles.tsx` | `Particles` | `quantity`, `staticity`, `ease`, `size`, `refresh`, `color`, `vx`, `vy`, `className` | Hero 背景粒子 | 纯 React + canvas |
| `dock.tsx` | `Dock`, `DockIcon`, `dockVariants` | `iconSize=40`, `iconMagnification=60`, `iconDistance=140`, `disableMagnification`, `direction`, `children` | 悬浮式导航 | `motion/react`, `class-variance-authority` |
| `animated-gradient-text.tsx` | `AnimatedGradientText` | `speed`, `colorFrom`, `colorTo`, `children` | Hero 主标题 / 强调短语 | 纯 CSS 动画 |
| `aurora-text.tsx` | `AuroraText` | `children`, `colors`, `speed`, `className` | 渐变流光文字 | React |
| `warp-background.tsx` | `WarpBackground` | `perspective`, `beamsPerSide`, `beamSize`, `beamDelayMax/Min`, `beamDuration`, `gridColor`, `children` | 光束网格背景（**Aurora Background 替代**） | `motion/react` |
| `dot-pattern.tsx` | `DotPattern` | `width`, `height`, `x`, `y`, `cx`, `cy`, `cr`, `glow`, `className` | 轻量点阵背景 | `motion/react` |
| `blur-fade.tsx` | `BlurFade` | `duration`, `delay`, `offset`, `direction`, `blur`, `inView`, `inViewMargin`, `variant`, `children` | 滚动入场淡入 | `motion/react` |
| `scroll-progress.tsx` | `ScrollProgress` | `className` 等 MotionProps | 顶部滚动进度条 | `motion/react` `useScroll` |
| `number-ticker.tsx` | `NumberTicker` | `value`, `startValue`, `direction`, `delay`, `decimalPlaces` | 数据指标滚动数字 | `motion/react` `useInView`, `useMotionValue`, `useSpring` |
| `text-animate.tsx` | `TextAnimate` | `by="text"\|"word"\|"character"\|"line"`, `animation`, `delay`, `duration`, `startOnView`, `once`, `as`, `variants`, `accessible` | 文字逐字/逐词入场 | `motion/react` |

所有 Magic UI 组件都依赖 `@/lib/utils` 里的 `cn()`（来自 `clsx` + `tailwind-merge`）。目标项目没有的话先补。

---

## L2 · Motion 与 Lenis

见 `motion/recipes.md`（布局动画、页面切换、滚动联动、入场配方）与 `motion/lenis.md`（平滑滚动，含 React / Vue / 原生三种接法）。

**导入路径**：`import { motion, AnimatePresence, useScroll, useTransform } from "motion/react"`，安装 `npm i motion`。旧写法 `framer-motion` 已弃用。

---

## 备选皮肤 · Aceternity UI

偏 Linear / Stripe 式暗黑 SaaS 质感，组件：Spotlight、Background Beams、Tracing Beam、Lamp Effect。

> ⚠️ **Aceternity UI 没有官方 GitHub 仓库**，组件在 [ui.aceternity.com/components](https://ui.aceternity.com/components) 以 copy-paste 形式提供。因此它不纳入三个主仓，也不落源码到本目录。需要时按官网取用，并同样遵守 `LIORAN.md` 的铁律与 `design/tokens.md` 的数值。

---

## 已知坑（已核实，动手前必看）

1. **Motion 更名**：`motion/react`，不是 `framer-motion`。
2. **没有 `aurora-background`**：Magic UI 官方目录里不存在该组件，只有 `aurora-text.tsx`。背景需求用 `warp-background` / `dot-pattern` / `animated-grid-pattern`。
3. **BentoCard 图标不符合本项目规范**：官方示例引的是 `@radix-ui/react-icons` 的 `ArrowRightIcon`，必须换成 `lucide-react` 的 `ArrowRight`；同时它依赖 `@/components/ui/button`，目标项目需已有 shadcn Button。
4. **Marquee 需补 CSS**：用到 `animate-marquee`、`animate-marquee-vertical` 两个自定义 keyframes，不补则静止不动。
5. **shadcn 默认图标库就是 Lucide**：官方 `components.json` 中 `"iconLibrary": "lucide"`，与本项目规范天然一致。
6. **Lenis 有官方框架适配**：`lenis`（原生）、`lenis/react`、`lenis/vue`，不要在 React 项目里手动 new 一个实例重复接管滚动。
