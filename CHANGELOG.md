# 更新日志

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.1] - 2026-11-12

首个开源版本。仓库公开，补 MIT 许可、贡献指南、安全策略、行为准则与 CI。

### 修复

- **服务崩溃**：畸形百分号编码（`/%E4%ZZ`）触发未捕获的 `URIError` 导致进程退出，现返回 `400 INVALID_INPUT`
- **路径校验前缀误匹配**：`startsWith` 放行 `/a/preview-other` 这类同前缀目录，改用 `path.relative` 并拦截 `\0`
- **`options.level` 失效**：契约与工作台提供 `L0` 选项但服务端始终注入 L0+L2，现 `L0` 只注规范层
- **`functionIntegrity.confirmed` 硬编码为 `true`**：改为实测——剥离注入层后须逐字节还原原文，且可见文案一致
- **`UNSUPPORTED_ENCODING` 从未返回**：非 UTF-8 内容现由 U+FFFD 检测并报错
- **`PAYLOAD_TOO_LARGE` 无法回传**：超限时先 `req.destroy()` 导致客户端收到连接重置，现先回 413 再断开
- **注入替换模式隐患**：内容含 `$&` / `$'` 时被当作替换模式，改用函数式 `replace`
- **body 注入路径多插换行**：导致完整性校验误判失败
- **`registry/fetch.sh` 参数解析错误**：文档中的 `fetch.sh shadcn-ui button card` 必定失败；同时补可执行位、修正 `sed` 转义
- **`diagnose()` 套话**：对任何输入都输出同一段问题，改为按字号种类、`:hover`、强调色变量等真实信号判断
- **`personality=auto`** 未正确回落为 `landing`

### 变更

- **`preview/demo-after.html` 重写为严格合规**：删除 6 处凭空新增的文案与 1 张虚构功能卡，恢复「主要功能」原文，数字区块拆分为 `<span>` 但保留 `12000 个团队 · 480000 个任务 · 99 个国家` 逐字不变；同时修正 logo 墙把真实内容 `aria-hidden` 的无障碍问题
- `LIORAN.md` 明确「Emoji 当图标使用」是「文案不动」的唯一例外，消除铁律 1 与图标规范之间的冲突
- `api/contract.md` 同步 `level` 语义、`functionIntegrity` 新字段（`checks` / `failures`）与错误码

### 新增

- `test/smoke.js`：零依赖自检 45 项，覆盖接口、路径安全、参数校验、完整性校验与 demo 文案一致性
- `package.json`：`npm start` / `npm test`，零运行时依赖
- `LICENSE`（MIT）、`CONTRIBUTING.md`、`SECURITY.md`、`CODE_OF_CONDUCT.md`
- `.github/workflows/ci.yml`：Node 18 / 20 / 22 三档跑自检

## [0.1.0] - 2026-11-11

首个提交。

### 新增

- `LIORAN.md`：AI 美化师工作手册（角色、铁律、四层 SOP、自检清单、输出格式）
- `design/tokens.md`、`design/universal-rules.md`：设计 token 与栈无关的普适规则
- `registry/`：shadcn/ui 8 个原子件、Magic UI 12 个特效组件、Motion/Lenis 配方、Lucide 与 Tailwind 对照表
- `api/contract.md`、`api/server.js`：`/api/beautify` 契约与零依赖本地规则引擎
- `preview/index.html`、`preview/demo-before.html`、`preview/demo-after.html`：美化工作台与前后对比样例
