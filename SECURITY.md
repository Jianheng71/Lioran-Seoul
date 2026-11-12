# 安全策略

## 报告漏洞

**不要开公开 issue。** 请用 GitHub 的私密报告：

<https://github.com/Jianheng71/Lioran-Seoul/security/advisories/new>

或在仓库的 **Security → Report a vulnerability** 提交。请附上复现步骤、影响范围与你的环境（Node 版本、操作系统）。

48 小时内会有人回应。修复发布后会在 advisory 里致谢（除非你要求匿名）。

## 支持范围

| 版本 | 是否维护 |
|---|---|
| `main` 分支最新提交 | ✅ |

项目处于 0.x，只有最新版本会被修。

## 这个项目的安全模型

理解边界比堆防护更重要：

- **只监听本机**：`api/server.js` 固定绑定 `127.0.0.1`，不对外暴露。不要改成 `0.0.0.0` 后直接放到公网。
- **不执行用户代码**：本地规则引擎只做字符串注入（追加 `<style>` / `<script>` 标签），不 `eval`、不执行、不写用户磁盘。
- **不发起外部请求**：本地引擎完全离线。`registry/fetch.sh` 是独立脚本，仅在手动运行时访问 GitHub raw。
- **不落盘**：`/api/beautify` 不写任何文件，请求体只存在于内存。
- **请求体上限 2MB**，超出返回 `413 PAYLOAD_TOO_LARGE`。

## 已知的信任假设

在「粘贴任意代码」这个场景里，有几点必须明确：

1. **工作台用 `iframe sandbox="allow-scripts"` 渲染你的代码**，脚本可以运行，但无法访问父页面 DOM、Cookie 或 localStorage。
2. **注入的设计 token 会作用于整页**，包括你没有预期的元素。这是有意的全局重写，不是漏洞。
3. **接 AI 引擎后（B 阶段），用户代码会被发送到模型服务商**。部署者必须在界面上明确告知，并按服务商条款处理数据。API Key 只能放服务端环境变量。

## 供应链

- 运行时零依赖（`package.json` 无 `dependencies`）。
- `registry/` 下是上游 MIT 源码的副本，不在构建或运行时被加载执行，仅作素材供人复制。
