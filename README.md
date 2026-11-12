# Lioran-Seoul

[![CI](https://github.com/Jianheng71/Lioran-Seoul/actions/workflows/ci.yml/badge.svg)](https://github.com/Jianheng71/Lioran-Seoul/actions/workflows/ci.yml)

[![License: MIT](https://img.shields.io/badge/License-MIT-4f46e5.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-3c873a.svg)](package.json)
[![Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)

**AI 美化师。** 别人用 v0 / Bolt / Cursor 之类把产品搭到能跑，把代码文件交给 Lioran-Seoul，它在**不改动任何核心功能**的前提下，把整个视觉质量拉到大厂水准。

> *An "AI beautifier" for AI-generated frontends.* Hand it a working-but-ugly codebase from v0 / Bolt / Cursor; it rewrites the visual layer only — functions, state, routes, APIs, data, event logic and copy stay byte-for-byte intact.

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
git clone https://github.com/Jianheng71/Lioran-Seoul.git
cd Lioran-Seoul

node api/server.js    # 打开 http://127.0.0.1:4173
node test/smoke.js    # 零依赖自检：接口、路径安全、level、完整性、demo 文案

# 或者
npm start
npm test
```

零依赖，不需要 `npm install`。工作台支持：

- 粘贴任意 HTML/代码 → 调用 `/api/beautify` → 美化前后并排预览
- 内置一组「美化前 / 美化后」样例，打开即可看到效果差异
- 浏览本地组件素材库，查看每个组件的源码与适用场景

---

## 自动化

三道自动关卡，装好即用：

| 关卡 | 触发时机 | 作用 |
|---|---|---|
| `npm test` | 手动 | 45 项零依赖自检 |
| pre-push hook | 每次 `git push` | 自检不过就中止推送 |
| GitHub Actions | push / PR | Node 18 / 20 / 22 三档跑同一份自检 |

```bash
npm run hooks       # 安装 pre-push 自检（约 1 秒，可 SKIP_TESTS=1 跳过）
npm run ci:enable   # 激活 GitHub Actions
```

> `ci:enable` 需要 token 具备 `workflow` 权限——这是 GitHub 的硬性限制，任何工具都绕不过。脚本会先校验权限，缺了就给出**scope 已预选**的授权链接；拿到 token 后自动完成：存凭据 → 放置工作流 → 补 CI 徽章 → 提交推送 → 轮询运行结果。

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
├── test/smoke.js          零依赖自检（45 项断言）
├── ci/github-actions.yml  CI 工作流模板（npm run ci:enable 后移到 .github/workflows/）
├── scripts/enable-ci.sh   一键激活 CI
├── .githooks/pre-push     推送前自检
└── preview/
    ├── index.html         美化工作台
    ├── demo-before.html   美化前样例（保留完整功能）
    └── demo-after.html    美化后样例（同功能，纯视觉升级）

CONTRIBUTING.md            贡献指南（铁律、registry 许可、自检要求）
SECURITY.md                安全策略与信任假设
CODE_OF_CONDUCT.md         贡献者行为准则
CHANGELOG.md               更新日志
LICENSE                    MIT
```

---

## 路线：A → B

- **A（当前已跑通）**：`LIORAN.md` 工作手册 + `design/` 规范 + `registry/` 素材库 + 一组真实前后对比样例。本地规则引擎支持 `level=L0`（只注规范层）与 `level=L2/L3/full`（追加动效），返回的「功能未动」是**实测结论**——注入层剥离后必须逐字节还原原文件。`node test/smoke.js` 可回归。
- **B（骨架已就绪）**：`api/contract.md` 定义了 `/api/beautify` 的完整契约，`api/server.js` 里 `beautify()` 是唯一需要换成大模型调用的函数。接上 AI 后，`preview/index.html` 无需改动即可从本地规则引擎切到真实 AI。

契约要点：入参是文件数组，出参是同路径文件数组 + 改动清单 + 「功能未动」确认项。详见 `api/contract.md`。

---

## 许可

本项目以 [MIT License](LICENSE) 发布，可自由使用、修改、分发与商用，保留版权与许可声明即可。

`registry/` 下的组件源码来自各自上游仓库，版权与许可归原作者所有：

| 目录 | 上游 | 许可 |
|---|---|---|
| `registry/shadcn-ui/` | [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | MIT |
| `registry/magic-ui/` | [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | MIT |
| `registry/motion/` | [motiondivision/motion](https://github.com/motiondivision/motion) · [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis) | MIT |

本项目仅作素材索引与视觉规范沉淀，不宣称原创。使用具体组件时请遵循对应上游许可。

---

## 参与贡献

欢迎 issue 与 PR。开始之前请读 [`CONTRIBUTING.md`](CONTRIBUTING.md) —— 这个项目对「不改功能、不改文案」的要求是硬的，`node test/smoke.js` 会拦下越界改动。

- 发现安全问题：走 [`SECURITY.md`](SECURITY.md)，**不要开公开 issue**
- 想讨论审美取舍或用法：开 Discussion
- 组件素材：用 `./registry/fetch.sh` 从上游拉，不要手写

## 致谢

字体与图标规范参考 Tailwind CSS、Lucide Icons；`registry/` 的组件实现归 shadcn/ui、Magic UI、Motion、Lenis 的作者所有。
