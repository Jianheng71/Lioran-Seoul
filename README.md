# Lioran-Seoul

**AI 美化师。** 别人用 v0 / Bolt / Cursor 之类把产品搭到能跑，把代码文件交给 Lioran-Seoul，它在**不改动任何核心功能**的前提下，把整个视觉质量拉到大厂水准。

> Seoul 只是项目名，不代表任何风格倾向。默认审美是中性、克制、现代的大厂感。

---

## 一句话定位

不是「从零生成产品」的 AI，是**接手二手代码做纯视觉修饰的画师**。

- 输入：别处 AI 生成的产品代码（功能完整、视觉粗糙）
- 输出：同一套功能，视觉被系统重写过的代码
- 不改变：函数、状态、路由、接口、数据、事件逻辑、文案字面内容

---

## 三个主仓

| 层 | 仓库 | 用途 |
|---|---|---|
| 基础组件 | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | 统一 Button / Card / Input / Dialog 等原子件 |
| 高级效果 | [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | Marquee、Bento Grid、Particles、Dock、渐变文字、背景 |
| 动效底座 | [motiondivision/motion](https://github.com/motiondivision/motion) | 布局动画、页面切换；Lenis 负责平滑滚动 |

**内置规范（不单列仓库）**：Tailwind CSS 定间距刻度、Lucide Icons 定图标、禁止 Emoji 当图标。
**备选皮肤**：Aceternity UI（Spotlight / Background Beams / Tracing Beam / Lamp），偏暗黑 SaaS 质感。官方无 GitHub 仓库，组件在 [ui.aceternity.com](https://ui.aceternity.com) 以 copy-paste 形式提供，详见 `registry/INDEX.md`。

组件源码已真实落在 `registry/` 下，**要用哪个直接拿来用**，不用凭记忆写 props。

---

## 快速开始

```bash
cd Lioran-Seoul
node api/server.js
# 打开 http://localhost:4173
```

零依赖，不需要 `npm install`。工作台支持：

- 粘贴任意 HTML/代码 → 调用 `/api/beautify` → 美化前后并排预览
- 内置一组「美化前 / 美化后」样例，打开即可看到效果差异
- 浏览本地组件素材库，查看每个组件的源码与适用场景

---

## 目录

```
Lioran-Seoul/
├── LIORAN.md              AI 美化师工作手册（A 的核心，角色/铁律/SOP/自检）
├── design/
│   ├── tokens.md          设计 token：间距、字号、圆角、配色、动效时长
│   └── universal-rules.md 栈无关的普适美化规则 + 何时启用 React 注入层
├── registry/
│   ├── INDEX.md           组件总索引：场景 / props / 路径 / 依赖 / 已知坑
│   ├── fetch.sh           按需从上游拉取任意组件源码
│   ├── shadcn-ui/         真实组件源码（button/card/input/dialog/...）
│   ├── magic-ui/          真实组件源码 + 完整 registry.json 目录
│   ├── motion/            Motion 与 Lenis 的可复制动效配方
│   └── foundation/        Tailwind 刻度表、Lucide 图标替换对照表
├── api/
│   ├── contract.md        POST /api/beautify 请求/响应契约
│   └── server.js          零依赖服务：静态托管 + 接口 + 本地规则引擎
└── preview/
    ├── index.html         美化工作台
    ├── demo-before.html   美化前样例（保留完整功能）
    └── demo-after.html    美化后样例（同功能，纯视觉升级）
```

---

## 路线：A → B

- **A（当前已跑通）**：`LIORAN.md` 工作手册 + `design/` 规范 + `registry/` 素材库 + 一组真实前后对比样例。把代码文件发给我，我按手册开跑。
- **B（骨架已就绪）**：`api/contract.md` 定义了 `/api/beautify` 的完整契约，`api/server.js` 里 `beautify()` 是唯一需要换成大模型调用的函数。接上 AI 后，`preview/index.html` 无需改动即可从本地规则引擎切到真实 AI。

契约要点：入参是文件数组，出参是同路径文件数组 + 改动清单 + 「功能未动」确认项。详见 `api/contract.md`。

---

## 上游许可

`registry/` 下的组件源码来自各自上游仓库，版权与许可归原作者所有（shadcn/ui、Magic UI 均为 MIT，Motion 为 MIT，Lenis 为 MIT）。本项目仅作内部素材索引与视觉规范沉淀，不宣称原创。使用到具体组件时请遵循对应上游许可。
