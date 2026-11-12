## 这个 PR 做了什么

<!-- 一句话说明。一个 PR 只做一件事。 -->

## 类型

- [ ] fix（修复 bug）
- [ ] feat（新能力）
- [ ] docs（文档）
- [ ] test（测试）
- [ ] refactor（重构，不改行为）
- [ ] chore（工具链 / 依赖）

## 影响范围

- [ ] `api/server.js` 或接口契约
- [ ] `design/`（设计 token）
- [ ] `registry/`（组件素材库）
- [ ] `preview/`（工作台 / demo）
- [ ] `LIORAN.md`（工作手册）
- [ ] 构建 / CI

## 自检

```bash
node test/smoke.js
```

<!-- 粘贴输出 -->

## 铁律自检

- [ ] 没有改动任何函数、状态、路由、接口、数据字段、事件逻辑
- [ ] 没有改动用户可见文案（Emoji → Lucide 图标除外，见 `LIORAN.md` 铁律 3）
- [ ] 没有改动表单 `name`/`id`、按钮 `type`、链接 `href`、条件渲染分支
- [ ] 没有引入无法在目标技术栈运行的依赖
- [ ] 运行时仍然是零依赖

## 如果改了接口

- [ ] 同步更新了 `api/contract.md`
- [ ] 同步更新了 `preview/index.html`
- [ ] 在 `test/smoke.js` 补了断言

## 如果改了 `registry/`

- [ ] 组件来自 `./registry/fetch.sh` 或上游仓库，不是手写
- [ ] 注明了上游仓库、commit 与许可

## 截图

<!-- 涉及视觉改动请附前后对比 -->
