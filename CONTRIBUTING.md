# 参与贡献

感谢你愿意改进 Lioran-Seoul。这个仓库的主体不是代码，而是一份**可执行的审美判断标准**——所以它对「对不对」的要求比对「多不多」更高。

## 先跑起来

```bash
git clone https://github.com/Jianheng71/Lioran-Seoul.git
cd Lioran-Seoul
node api/server.js     # http://127.0.0.1:4173
node test/smoke.js     # 45 项零依赖自检
```

零依赖，不需要 `npm install`。也可以用 `npm start` / `npm test`。

建议装一下推送前自检，避免把红的提交推上去：

```bash
npm run hooks
```

## 提交前必须通过

```bash
node test/smoke.js
```

CI 会在 Node 18 / 20 / 22 上跑同一份自检（`.github/workflows/ci.yml`）。本地红的，CI 一定红。

## 这个项目的铁律

改动涉及视觉层时，先读 [`LIORAN.md`](LIORAN.md)。核心约束：

1. **功能零改动** —— 不新增、删除、重命名函数 / 变量 / props / state / 路由 / 接口 / 数据字段 / 事件逻辑。
2. **文案一字不改** —— 唯一例外是 Emoji 当图标使用时换成 Lucide 图标，见 `LIORAN.md` 铁律 3。
3. **结构最小侵入** —— 只允许为布局与动效调整 DOM 层级，不改 `name`/`id`/`type`/`href`/条件渲染分支。
4. **克制** —— 一屏最多一个主特效；「炫技」与「统一」冲突时选统一。

`test/smoke.js` 里有一条断言专门守着第 2 条：`preview/demo-after.html` 的可见文案必须与 `demo-before.html` 逐字相同（Emoji 除外）。如果你为了「更好看」改了文案，CI 会拦下来——**这是故意的**。

## 改 `registry/` 的规则

`registry/` 下是**上游组件的真实源码副本**，不是手写示例。

- 新增组件：用 `./registry/fetch.sh shadcn-ui <name>` 或 `./registry/fetch.sh magic-ui <name>` 从上游拉取，不要凭记忆手写。
- 不要修改上游源码的行为逻辑；如需修正导入路径（shadcn v4 的 `cn` 别名问题），在 `registry/INDEX.md` 的已知坑里记录。
- 注意许可：shadcn/ui、Magic UI、Motion、Lenis 均为 MIT。引入其他来源的代码必须确认其许可兼容 MIT，并在 PR 里注明来源与许可。

## 改 `design/` 的规则

`design/tokens.md` 里的数值是全项目共用的。改一个值会同时影响手册、本地规则引擎（`api/server.js` 的 `buildCss`）和工作台。请在 PR 里说明影响范围，并确认 `api/server.js` 注入的 token 与新数值一致。

## 改 `api/` 的规则

- 请求/响应结构由 [`api/contract.md`](api/contract.md) 定义。破坏性变更必须同步改契约文档 + `preview/index.html`。
- 保持零依赖。新增运行时依赖需要充分理由，且必须与「`node api/server.js` 直接能跑」兼容。
- 任何让 `functionIntegrity.confirmed` 退化成常量的改动都会被拒——它是这个项目最核心的承诺。
- 新接口或新错误码，必须在 `test/smoke.js` 里补断言。

## 接 AI 引擎（B 阶段）

`api/server.js` 里的 `beautify()` 是唯一需要替换的函数，接口契约不变。接入时：

1. 系统提示词拼 `LIORAN.md` + `design/tokens.md` + `design/universal-rules.md` + `registry/INDEX.md`。
2. 要求模型严格输出契约定义的 JSON（文件名与数量必须与输入一致）。
3. **API Key 只能放服务端环境变量，绝不能下发到前端**，也不要提交进仓库。
4. 保留 `functionIntegrity` 的判定逻辑：AI 返回结果同样要过校验，不能盲信。

## 提交信息

用 `type: 摘要` 的形式，类型用 `feat` / `fix` / `docs` / `test` / `refactor` / `chore`。正文写清「改了什么 / 为什么 / 影响范围」。

## Pull Request

- 一个 PR 只做一件事。
- 描述里贴 `node test/smoke.js` 的输出。
- 涉及视觉改动的，附改动前后的截图（`preview/demo-*.html` 或真实页面）。
- 涉及 `registry/` 的，注明上游仓库与 commit。

## 行为准则

参与本项目即表示同意遵守 [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md)。

## 安全问题

不要开公开 issue，见 [`SECURITY.md`](SECURITY.md)。
