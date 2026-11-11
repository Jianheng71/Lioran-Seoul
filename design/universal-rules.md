# 普适美化规则（栈无关）

> 这份规则对 **React / Vue / Svelte / 纯 HTML / 任意 CSS 方案** 全部成立，是 L0 通用视觉层。
> 用户输入什么技术栈都先做这一层，做到位已经能解决大部分「AI 生成代码很丑」的问题。

---

## 1. 视觉诊断清单

拿到代码先逐条打勾，输出问题列表（此时不改代码）：

**排版**
- [ ] 字号没有阶梯，标题和正文差不多大
- [ ] 行高过紧（< 1.4）或正文一行超过 90 字符
- [ ] 字重混用，或满屏加粗
- [ ] 中英文 / 数字混排没有统一字体栈

**间距与对齐**
- [ ] 出现非刻度的随手数值
- [ ] 同类卡片间距不一致
- [ ] 元素没有对齐到同一条基线 / 网格
- [ ] 区块之间缺少留白节奏，整页挤成一坨

**一致性**
- [ ] 按钮大小、圆角、颜色不统一
- [ ] 卡片边框 / 阴影各写各的
- [ ] 同一含义用了多种颜色
- [ ] 表单控件高度、内边距不一致

**图标与状态**
- [ ] 用 Emoji 当图标
- [ ] 混用多套图标集、线宽不一
- [ ] 缺 hover / focus-visible / disabled / loading / error
- [ ] 只有颜色表达状态，没有文字或图形冗余

**层次**
- [ ] 没有主次，所有元素同等抢眼
- [ ] 缺中性色阶，靠彩色区分层次
- [ ] 背景、卡片、浮层没有深度区分

**响应式**
- [ ] 固定宽度、375px 溢出
- [ ] 窄屏没有重排，只是缩放

---

## 2. L0 改造顺序（收益从高到低）

1. **收间距** — 全部收进 Tailwind 刻度，先解决「乱」
2. **建字阶** — 5 级以内，先解决「糊」
3. **统一基础件** — 按钮 / 输入框 / 卡片三件套，先解决「散」
4. **中性色阶 + 单一强调色** — 先解决「花」
5. **图标全换 Lucide** — 先解决「廉价感」
6. **补齐状态** — 先解决「没做完的感觉」
7. **响应式与可访问性** — 收尾

**不要一上来加特效。** 前 6 步没做完就加渐变和粒子，只会让丑变得更显眼。

---

## 3. 通用规则

- **对齐**：所有内容对齐到同一个最大宽度容器（落地页 1200px，后台 1440px），左右留白随断点变化但保持一致。
- **留白**：留白比边框更能分组。能用间距区分的，不要加分割线。
- **层次**：靠「字号 + 字重 + 中性色深浅」三件套建立层次，颜色是最后手段。
- **字体栈**：中文内容提供完整 fallback；数字用 `font-variant-numeric: tabular-nums` 对齐表格列。
- **边框**：`1px`，颜色用 `--border`；不要用 2px 以上的实线做装饰。
- **阴影**：最多 3 级，且只用于真正浮起的层。
- **图片**：统一 `object-fit: cover` 与圆角，补 `alt`，避免拉伸。
- **可访问性**：交互元素必须有可见 focus；图标按钮补 `aria-label`；纯装饰元素 `aria-hidden="true"`。
- **性能**：装饰动画只用 transform/opacity；背景粒子用 canvas 或 CSS，不阻塞首屏。

---

## 4. 何时启用 React 注入层

| 检测到的栈 | L0 | L1 shadcn | L2 Motion | L3 Magic UI |
|---|---|---|---|---|
| React + Tailwind | ✅ | ✅ 换原子件 | ✅ `motion/react` | ✅ 按页面性格取用 |
| React + 其他 CSS | ✅ | ⚠️ 仅对齐视觉规格，不强行装 shadcn | ✅ | ⚠️ 需先补 Tailwind，否则用 CSS 近似 |
| Vue / Svelte | ✅ | ❌ 不引入 | ✅ Vue 用 `motion-v`，Svelte 用 CSS 过渡 | ❌ CSS 近似 |
| 纯 HTML / 静态页 | ✅ | ❌ | ✅ CSS transition + IntersectionObserver | ❌ CSS 近似 |
| 小程序 / 原生 | ✅ 按 rpx 刻度映射 | ❌ | ❌ 用平台动画 API | ❌ |

**原则**：绝不为了用某个组件去改用户的技术栈、加构建工具或换框架。降级的视觉效果可以略弱，但功能完整性不能动。

---

## 5. 特效降级对照

| 原特效 | 纯 CSS / 非 React 近似 |
|---|---|
| Marquee | `@keyframes` 无限平移 + `transform: translateX(-50%)`，hover 时 `animation-play-state: paused` |
| Bento Grid | CSS Grid `grid-template-columns: repeat(3, 1fr)` + 跨行跨列 |
| AnimatedGradientText | `background: linear-gradient` + `background-clip: text` + 背景位移动画 |
| DotPattern / Particles | `radial-gradient` 平铺背景，或轻量 canvas |
| BlurFade | `IntersectionObserver` 加 class，触发 opacity + translateY 过渡 |
| ScrollProgress | `scroll` 事件 + `scaleX` 顶部进度条（用 `requestAnimationFrame` 节流） |
| NumberTicker | `requestAnimationFrame` 数字插值 |
| Spotlight / Aurora | `radial-gradient` 伪元素 + 鼠标位置 CSS 变量 |

降级实现同样要遵守 `design/tokens.md` 的时长与缓动限制，并尊重 `prefers-reduced-motion`。

---

## 6. 交付前必须确认

- 所有交互行为与改造前一致（按钮、表单、跳转、数据）
- 文案字面内容未变
- 没有引入用户技术栈跑不起来的依赖
- 375px / 768px / 1440px 三档均无溢出
- 关掉动效后内容完整可读
