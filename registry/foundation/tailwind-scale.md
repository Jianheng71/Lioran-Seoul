# Tailwind 间距刻度对照表

> 规范层地基。目标：`design/tokens.md` 定原则，本表做「随手值 → 合法值」的直接映射。
> 改用户代码时，看到左边就改成右边，不要犹豫。

## 1. 刻度总表

| class | rem | px | class | rem | px |
|---|---|---|---|---|---|
| `0` | 0 | 0 | `8` | 2 | 32 |
| `px` | — | 1 | `9` | 2.25 | 36 |
| `0.5` | 0.125 | 2 | `10` | 2.5 | 40 |
| `1` | 0.25 | 4 | `11` | 2.75 | 44 |
| `1.5` | 0.375 | 6 | `12` | 3 | 48 |
| `2` | 0.5 | 8 | `14` | 3.5 | 56 |
| `2.5` | 0.625 | 10 | `16` | 4 | 64 |
| `3` | 0.75 | 12 | `20` | 5 | 80 |
| `3.5` | 0.875 | 14 | `24` | 6 | 96 |
| `4` | 1 | 16 | `28` | 7 | 112 |
| `5` | 1.25 | 20 | `32` | 8 | 128 |
| `6` | 1.5 | 24 | `40` | 10 | 160 |
| `7` | 1.75 | 28 | `48` | 12 | 192 |

**允许值**（Lioran-Seoul 收敛后只用这些）：`1 / 2 / 3 / 4 / 6 / 8 / 12 / 16 / 24`，对应 `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px`。

---

## 2. 随手值 → 合法值

| 见到 | 改成 | 见到 | 改成 |
|---|---|---|---|
| `5px`, `6px` | `gap-1` / `p-1` (4) | `13px`, `15px` | `gap-4` / `p-4` (16) |
| `7px`, `9px` | `gap-2` / `p-2` (8) | `18px`, `20px` | `gap-6` / `p-6` (24) |
| `10px`, `11px` | `gap-3` / `p-3` (12) | `25px`, `30px` | `gap-8` / `p-8` (32) |
| `14px` | `gap-4` (16) 或 `gap-3` (12) | `40px`, `50px` | `gap-12` (48) |
| `margin: 0 auto` | 保留（居中，不算随手值） | `%` 宽高 | 保留（布局需要） |

**判断原则**：往最近的刻度靠；如果两个刻度差不多远，选**较大**的那个——AI 生成的代码普遍偏挤。

---

## 3. 常用组合（直接抄）

```html
<!-- 卡片 -->
<div class="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
  <h3 class="text-lg font-medium">标题</h3>
  <p class="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">描述</p>
</div>

<!-- 表单 -->
<form class="flex flex-col gap-4">
  <label class="flex flex-col gap-2 text-sm">邮箱
    <input class="h-10 rounded-lg border px-3 text-sm outline-none focus-visible:ring-2" />
  </label>
  <button class="h-10 rounded-lg px-4 text-sm font-medium">提交</button>
</form>

<!-- 区块 -->
<section class="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-24">
  <div class="grid gap-6 md:grid-cols-3">...</div>
</section>
```

---

## 4. 断点与容器

| 断点 | 宽度 | 用途 |
|---|---|---|
| 默认 | < 640px | 手机，单列，`px-4` |
| `sm` | ≥ 640px | 大屏手机 |
| `md` | ≥ 768px | 平板，开始双列 |
| `lg` | ≥ 1024px | 桌面，三列 / 侧栏 |
| `xl` | ≥ 1280px | 宽屏 |

| 场景 | 最大宽度 |
|---|---|
| 落地页内容 | 1200px |
| 后台 / 仪表盘 | 1440px |
| 正文长文 | 720px（保证 60–75 字符/行） |

---

## 5. 检查命令

改完后快速扫一遍有没有漏网的随手值：

```bash
grep -rnE '\b(margin|padding|gap|top|left|right|bottom)[^;]*:\s*[0-9]+px' <目标目录>
```

出现的非刻度值逐个收编。注意：`1px` 边框、`<img>` 固定尺寸、`translate` 微调属于合理例外。
