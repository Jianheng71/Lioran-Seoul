# Motion 动效配方（可直接复制）

> 上游：[motiondivision/motion](https://github.com/motiondivision/motion)，MIT。
> **导入路径已变更**：Framer Motion 现为 Motion，用 `motion/react`，**不是** `framer-motion`。

```bash
npm i motion
```

```tsx
import {
  motion, AnimatePresence, LayoutGroup,
  useScroll, useSpring, useTransform, useInView, useReducedMotion,
} from "motion/react"
```

**跨栈**：React → `motion/react`；原生 JS → `import { animate } from "motion"`；Vue → `motion-v`。非 React 栈见 `design/universal-rules.md` 的 CSS 降级方案。

时长与缓动一律遵守 `design/tokens.md`：微交互 150–200ms、入场 300–500ms、缓动 `cubic-bezier(.16,1,.3,1)`。

---

## 1. 入场淡入（最常用）

```tsx
const fadeUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

<motion.div
  variants={fadeUp}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-80px" }}
  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
>
  {children}
</motion.div>
```

## 2. 列表 stagger

```tsx
<motion.ul initial="hidden" whileInView="visible" viewport={{ once: true }}
  variants={{ visible: { transition: { staggerChildren: 0.05 } } }}>
  {items.map(item => (
    <motion.li key={item.id} variants={fadeUp}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
      {item.label}
    </motion.li>
  ))}
</motion.ul>
```

每项间隔 ≤ 60ms，列表超过 8 项时总时长会拖沓，改为整块淡入。

## 3. 布局动画（L2 的核心价值）

```tsx
<LayoutGroup>
  {items.map(item => (
    <motion.div layout key={item.id} layoutId={`card-${item.id}`}
      transition={{ layout: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}>
      {item.content}
    </motion.div>
  ))}
</LayoutGroup>
```

用于筛选、排序、展开收起时的位置变化。**只动画 transform/opacity**，不要对 width/height 做动画。

## 4. 页面 / 弹窗切换

```tsx
<AnimatePresence mode="wait">
  <motion.div key={currentKey}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
    {content}
  </motion.div>
</AnimatePresence>
```

⚠️ 包裹 `AnimatePresence` 时不要改变内部组件的 key 生成逻辑，也不要动路由配置——只加视觉壳。

## 5. 滚动进度条

```tsx
const { scrollYProgress } = useScroll()
const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 })

<motion.div style={{ scaleX }} className="fixed left-0 top-0 h-0.5 w-full origin-left bg-[var(--accent)]" />
```

也可直接用本地素材 `magic-ui/scroll-progress.tsx`（同样基于 `useScroll`）。

## 6. 滚动联动（视差 / 淡出）

```tsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
const y = useTransform(scrollYProgress, [0, 1], [40, -40])
const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

<motion.div ref={ref} style={{ y, opacity }}>{children}</motion.div>
```

幅度控制在 40px 以内，避免「飘」。

## 7. 微交互

```tsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15, ease: "easeOut" }}
  {...originalProps}   // 原有 onClick / type / disabled 必须原样透传
>
  {children}
</motion.button>
```

scale 上限 1.02，不要放大到 1.1 那种廉价弹跳。

## 8. 尊重 reduced motion（必做）

```tsx
const reduce = useReducedMotion()

<motion.div
  initial={reduce ? false : { opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: reduce ? 0 : 0.4 }}
/>
```

纯 CSS 项目用：

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 自检

- [ ] 只用了 `motion/react` 导入，没有 `framer-motion`
- [ ] 微交互 ≤ 200ms，入场 ≤ 500ms，无 > 800ms 装饰动画
- [ ] 只动画 transform / opacity
- [ ] `prefers-reduced-motion` 已降级
- [ ] 原有事件 props 全部透传，功能行为未变
- [ ] 数据密集页面没有叠加滚动视差
