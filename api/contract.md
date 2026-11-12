# `/api/beautify` 接口契约

> A 阶段由本地规则引擎实现；B 阶段把 `api/server.js` 里的 `beautify()` 换成大模型调用即可，**请求/响应结构不变，前端无需改动**。

## 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/api/beautify` | 提交代码文件，返回美化后的文件与改动清单 |
| `GET` | `/api/registry` | 列出本地组件素材库文件 |
| `GET` | `/api/health` | 健康检查，返回当前引擎 |
| `GET` | `/registry/*` | 静态读取组件源码 |

---

## POST /api/beautify

### 请求

```json
{
  "projectName": "flowdesk",
  "options": {
    "stack": "auto",
    "personality": "auto",
    "dark": false,
    "level": "full"
  },
  "files": [
    { "path": "index.html", "content": "<!doctype html>..." },
    { "path": "src/App.tsx", "content": "export default ..." }
  ]
}
```

| 字段 | 类型 | 说明 |
|---|---|---|
| `projectName` | string | 可选，仅用于展示 |
| `options.stack` | `auto \| react \| vue \| svelte \| html \| other` | 栈识别结果，`auto` 由服务端推断 |
| `options.personality` | `auto \| landing \| saas \| dashboard \| docs` | 页面性格，决定 L3 特效选型 |
| `options.dark` | boolean | 是否用深色 token |
| `options.level` | `L0 \| L1 \| L2 \| L3 \| full` | 改造到哪一层；`full` = 全部。本地引擎实际支持：`L0` 只注入规范层，`L2` / `L3` / `full` 额外追加动效脚本；`L1` 与 `L3` 的组件替换仍需 AI 引擎 |
| `files` | array | **必填**，`{ path, content }`，路径保持原样 |

### 响应

```json
{
  "ok": true,
  "engine": "local-rules",
  "diagnosis": {
    "stack": "html",
    "personality": "landing",
    "issues": ["字号无阶梯", "存在 Emoji 图标", "间距非刻度值"]
  },
  "files": [
    { "path": "index.html", "content": "<!doctype html>...", "changed": true }
  ],
  "changes": [
    {
      "path": "index.html",
      "layer": "L0",
      "what": "注入设计 token 与基础件统一样式",
      "why": "间距非刻度值、按钮与卡片风格不一致",
      "source": "design/tokens.md"
    }
  ],
  "functionIntegrity": {
    "confirmed": true,
    "untouched": ["functions", "state", "routes", "apis", "data", "events", "copy"],
    "checks": [
      "注入层可无损剥离：标签、属性、事件绑定与原文件逐字节一致",
      "用户可见文案未变"
    ],
    "failures": []
  },
  "notes": ["非 React 栈，L1/L3 已降级为等效 CSS 实现"]
}
```

| 字段 | 说明 |
|---|---|
| `engine` | `local-rules`（当前）/ `ai`（接入大模型后） |
| `diagnosis` | 诊断结果，对应 `LIORAN.md` Step 0 |
| `files` | **与请求同路径、同数量**，只换 `content`；`changed=false` 表示无需改动 |
| `changes` | 逐文件改动清单，格式对应 `LIORAN.md` 第七节 |
| `functionIntegrity` | 「功能未动」确认，前端据此给出安全提示 |
| `functionIntegrity.confirmed` | **实测结果，不是常量**：把注入的 `<style id="lioran-tokens">` 与 `<script id="lioran-motion">` 剥掉后必须逐字节还原原文，且可见文案必须一致 |
| `functionIntegrity.checks` | 本次实际通过的校验项 |
| `functionIntegrity.failures` | 校验失败项（`{ path, reason }`）；`confirmed=false` 时非空 |

### 错误

```json
{ "ok": false, "error": "INVALID_INPUT", "message": "files 必须是非空数组" }
```

| error | 触发 |
|---|---|
| `INVALID_INPUT` | 缺 `files` 或格式错误、路径非法、畸形 URL |
| `PAYLOAD_TOO_LARGE` | 请求体 > 2MB |
| `UNSUPPORTED_ENCODING` | 文件内容不是合法 UTF-8（解码出现 U+FFFD） |
| `ENGINE_ERROR` | 引擎内部失败 |

---

## 铁律在契约层的体现

1. **路径与文件数量不变** — 不新增、删除、重命名文件
2. **只回传视觉层改动** — 服务端本地引擎通过「注入 CSS + 追加纯视觉脚本」实现，不改写用户 DOM 与 JS
3. **改动可审计** — `changes` 必须逐条说明「改了什么 / 为什么 / 取自哪里」
4. **功能确认必返** — `functionIntegrity.confirmed` 为 false 时前端应标红警告

---

## 接入 AI（B 阶段）

替换 `api/server.js` 中的 `beautify(files, options)` 实现，把以下内容拼进 system prompt：

1. `LIORAN.md` — 角色、铁律、SOP、自检、输出格式
2. `design/tokens.md` + `design/universal-rules.md` — 数值与栈无关规则
3. `registry/INDEX.md` — 可用组件与已知坑

再把 `files` 作为 user 消息传入，要求模型按契约的 `changes` / `functionIntegrity` 结构返回 JSON。

**建议的系统提示末尾**：

> 输出严格为契约定义的 JSON。文件名与数量必须与输入一致。任何对函数、状态、路由、接口、数据、事件、文案字面内容的改动都视为失败，请原样保留。

前端 `preview/index.html` 已按此契约实现，接 AI 后无需改动；`engine` 字段会从 `local-rules` 变为 `ai`。

---

## 安全边界

- 服务默认只监听 `127.0.0.1`，不对外暴露
- 不做代码执行、不写用户磁盘、不发起外部请求（本地引擎）
- 请求体上限 2MB，超出返回 `PAYLOAD_TOO_LARGE`
- 接入 AI 后，API Key 只放服务端环境变量，绝不下发到前端
