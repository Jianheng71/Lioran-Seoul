# Lenis 平滑滚动配方

> 上游：[darkroomengineering/lenis](https://github.com/darkroomengineering/lenis)，MIT，零运行时依赖，基于原生滚动（sticky、锚点、可访问性不受影响）。
> 归属 L2 动效底座，与 Motion 配合驱动滚动联动。

```bash
npm i lenis
```

官方提供多框架适配：`lenis`（原生）、`lenis/react`、`lenis/vue`、`lenis/snap`。

---

## 1. 原生 JS（纯 HTML / 任意栈）

```js
import Lenis from "lenis"

const lenis = new Lenis({
  duration: 1.1,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
})

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)
```

> 纯静态页若不愿引入依赖，用 `html { scroll-behavior: smooth; }` 即可——但注意它无法与滚动联动动画同步。

## 2. React（推荐 `lenis/react`）

官方必引 CSS，否则滚动行为不完整：

```js
import "lenis/dist/lenis.css"
```

```tsx
import { ReactLenis, useLenis } from "lenis/react"

function App() {
  // 回调每次滚动触发，仅做视觉联动，不要在这里改业务逻辑
  useLenis(({ scroll, progress }) => {})

  return (
    <>
      <ReactLenis root options={{ duration: 1.1, smoothWheel: true }} />
      {/* 页面内容 */}
    </>
  )
}
```

`root={true}` 时 Lenis 使用默认 `<html>` 滚动容器，并通过 context 让 `useLenis` 在组件树任意位置可用；**不需要**把内容包在 `<ReactLenis>` 里面。自定义滚动容器时用 `root="asChild"` 包裹。

⚠️ **不要**在已经用 `ReactLenis` 的项目里再手动 `new Lenis()`，会双重接管滚动导致抖动。
⚠️ `useLenis` 的回调签名是 `(lenis) => {}`（拿到实例），不是解构参数。

## 3. Vue

```vue
<script setup>
import { VueLenis as Lenis } from "lenis/vue"
</script>

<template>
  <Lenis root :options="{ duration: 1.1 }">
    <router-view />
  </Lenis>
</template>
```

## 4. 与 Motion 联动

`ReactLenis` 内部已驱动 raf，Motion 的 `useScroll` 直接读原生 scroll 即可工作，无需额外桥接。若项目用原生 Lenis 实例且需要同步 `useScroll`，在 Lenis 的 `scroll` 事件里触发 Motion 的更新即可，不要另起一个 rAF 循环。

---

## 5. 使用边界（LIORAN 铁律相关）

- **只做视觉**，不接管、不改写用户已有的滚动业务逻辑（无限加载、虚拟列表、锚点跳转、路由 scroll restoration）
- 若目标项目已有自己的滚动接管库（GSAP ScrollTrigger / 自定义 rAF），先评估冲突，**宁可不接 Lenis**
- `prefers-reduced-motion: reduce` 时禁用平滑滚动：

```js
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
const lenis = reduce ? null : new Lenis({ duration: 1.1 })
```

- 后台 / 表单 / 数据密集页面**不加**平滑滚动，长滚动落地页与官网才用
- 平滑滚动不改变锚点 href，不修改任何链接目标

## 6. 自检

- [ ] 全站只有一个 Lenis 实例
- [ ] 没有破坏无限滚动、虚拟列表、锚点跳转
- [ ] reduced-motion 下已降级
- [ ] 只在长滚动营销页启用
