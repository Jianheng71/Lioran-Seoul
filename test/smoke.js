#!/usr/bin/env node
/**
 * Lioran-Seoul · 零依赖自检
 *
 *   node test/smoke.js
 *
 * 在随机端口拉起 api/server.js，跑完断言后关闭。不联网、不写磁盘。
 */
"use strict"

const { spawn } = require("node:child_process")
const path = require("node:path")
const fs = require("node:fs")

const ROOT = path.resolve(__dirname, "..")
const PORT = 4300 + Math.floor(Math.random() * 500)
const BASE = `http://127.0.0.1:${PORT}`

let passed = 0
const failures = []

function ok(name, cond, detail) {
  if (cond) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failures.push(name + (detail ? ` — ${detail}` : ""))
    console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`)
  }
}

function eq(name, actual, expected) {
  ok(name, JSON.stringify(actual) === JSON.stringify(expected), `期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`)
}

async function postJSON(bodyPath, raw) {
  const res = await fetch(`${BASE}/api/beautify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw !== undefined ? raw : await fs.promises.readFile(bodyPath),
  })
  let json = null
  try { json = await res.json() } catch { /* 非 JSON 响应 */ }
  return { status: res.status, json }
}

function beautify(files, options) {
  const raw = JSON.stringify({ files, options })
  return postJSON(null, raw)
}

function waitForServer(proc, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("服务启动超时")), timeoutMs)
    proc.stdout.on("data", (d) => {
      if (String(d).includes("http://")) { clearTimeout(timer); resolve() }
    })
    proc.stderr.on("data", (d) => process.stderr.write("[server] " + d))
    proc.on("exit", (code) => { clearTimeout(timer); reject(new Error("服务提前退出，code=" + code)) })
  })
}

/** 可见文案：去脚本样式、去标签、压缩空白。用于比对 demo 前后。 */
function visibleText(html) {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** 去掉 Emoji 图标（唯一允许的字面差异，见 LIORAN.md 铁律 3） */
function stripEmoji(s) {
  return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]\s*/gu, "").replace(/\s+/g, " ").trim()
}

async function main() {
  const proc = spawn(process.execPath, [path.join(ROOT, "api", "server.js")], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ["ignore", "pipe", "pipe"],
  })

  try {
    await waitForServer(proc)
    console.log(`\n服务已启动：${BASE}\n`)

    /* ---------- 1. 健康检查 ---------- */
    console.log("接口")
    let r = await fetch(`${BASE}/api/health`)
    const health = await r.json()
    ok("GET /api/health 返回 local-rules", health.ok === true && health.engine === "local-rules")

    /* ---------- 2. 畸形 URL 不再打崩服务 ---------- */
    r = await fetch(`${BASE}/%E4%ZZ`)
    eq("畸形百分号编码返回 400", r.status, 400)
    r = await fetch(`${BASE}/api/health`)
    ok("畸形请求后服务仍存活", (await r.json()).ok === true)

    /* ---------- 3. 路径穿越 ---------- */
    r = await fetch(`${BASE}/../api/server.js`)
    const body = await r.text()
    ok("路径穿越被拒绝", r.status !== 200 && !body.includes("createServer"), `status=${r.status}`)
    r = await fetch(`${BASE}/registry/../../package.json`)
    ok("registry 路径穿越被拒绝", r.status !== 200)

    /* ---------- 4. 参数校验 ---------- */
    eq("空 files 返回 400", (await beautify([])).status, 400)
    const badJson = await postJSON(null, "{bad")
    eq("非法 JSON 返回 400", badJson.status, 400)
    const listDir = await postJSON(null, JSON.stringify({ files: [{ path: "a.html", content: 1 }] }))
    eq("content 非字符串返回 400", listDir.status, 400)

    /* ---------- 5. 2MB 上限 ---------- */
    const big = JSON.stringify({ files: [{ path: "a.html", content: "x".repeat(2 * 1024 * 1024 + 10) }] })
    const rBig = await postJSON(null, big)
    eq("超过 2MB 返回 413", rBig.status, 413)
    eq("错误码为 PAYLOAD_TOO_LARGE", rBig.json.error, "PAYLOAD_TOO_LARGE")

    /* ---------- 6. 非 UTF-8 ---------- */
    const badBytes = Buffer.concat([
      Buffer.from('{"files":[{"path":"a.html","content":"'),
      Buffer.from([0xff, 0xfe, 0x80]),
      Buffer.from('"}]}'),
    ])
    const rEnc = await postJSON(null, badBytes)
    eq("非法 UTF-8 返回 UNSUPPORTED_ENCODING", rEnc.json && rEnc.json.error, "UNSUPPORTED_ENCODING")

    /* ---------- 7. level 选项真的生效 ---------- */
    const html = "<html><head><title>t</title></head><body><h1>标题</h1></body></html>"
    const l0 = await beautify([{ path: "a.html", content: html }], { level: "L0" })
    ok("level=L0 注入 token 样式", l0.json.files[0].content.includes('id="lioran-tokens"'))
    ok("level=L0 不含动效脚本", !l0.json.files[0].content.includes("lioran-motion"))
    ok("level=L0 改动清单只有 L0", l0.json.changes.every((c) => c.layer === "L0"))

    const full = await beautify([{ path: "a.html", content: html }], { level: "full" })
    ok("level=full 含动效脚本", full.json.files[0].content.includes("lioran-motion"))
    ok("level=full 改动清单含 L2", full.json.changes.some((c) => c.layer === "L2"))

    /* ---------- 8. 功能完整性是真校验 ---------- */
    ok("正常改造 functionIntegrity 通过", full.json.functionIntegrity.confirmed === true)
    ok("完整性检查项非空", (full.json.functionIntegrity.checks || []).length >= 2)
    const collide = await beautify(
      [{ path: "a.html", content: '<html><head><style id="lioran-tokens">a{}</style></head><body></body></html>' }],
      { level: "L0" },
    )
    ok("注入标记冲突时 functionIntegrity 判定失败", collide.json.functionIntegrity.confirmed === false)
    ok("失败时给出原因", (collide.json.functionIntegrity.failures || []).length === 1)

    /* ---------- 9. 诊断 ---------- */
    const d = await beautify([
      { path: "a.html", content: '<html><head></head><body><div style="padding:13px">🚀 立即开始</div><button>Go</button></body></html>' },
    ])
    const issues = d.json.diagnosis.issues.join(" | ")
    ok("识别 Emoji", issues.includes("Emoji"))
    ok("识别非刻度间距", issues.includes("非刻度间距"))

    const clean = await beautify([
      { path: "a.html", content: "<html><head></head><body><h1>Hi</h1></body></html>" },
    ])
    ok("无 Emoji 时不误报", !clean.json.diagnosis.issues.join(" ").includes("Emoji"))

    /* ---------- 10. 非 HTML 原样返回 ---------- */
    const tsx = "export default function App() { return null }"
    const rTsx = await beautify([{ path: "App.tsx", content: tsx }])
    eq("非 HTML 文件原样返回", rTsx.json.files[0].content, tsx)
    eq("非 HTML 文件标记未改动", rTsx.json.files[0].changed, false)

    /* ---------- 11. 素材库接口 ---------- */
    r = await fetch(`${BASE}/api/registry`)
    const reg = await r.json()
    ok("GET /api/registry 列出文件", reg.ok === true && reg.files.length > 20)
    ok("registry 含 shadcn 组件", reg.files.some((f) => f.path === "shadcn-ui/button.tsx"))

    /* ---------- 12. 预览工作台可访问 ---------- */
    r = await fetch(`${BASE}/`)
    const indexHtml = await r.text()
    ok("工作台首页可访问", r.status === 200 && indexHtml.includes("AI 美化师工作台"))
    r = await fetch(`${BASE}/demo-before.html`)
    ok("demo-before 可访问", r.status === 200)
    r = await fetch(`${BASE}/demo-after.html`)
    ok("demo-after 可访问", r.status === 200)

    /* ---------- 13. demo-after 必须守住文案铁律 ---------- */
    console.log("\n文案一致性（demo-before → demo-after）")
    const before = visibleText(await (await fetch(`${BASE}/demo-before.html`)).text())
    const after = visibleText(await (await fetch(`${BASE}/demo-after.html`)).text())
    eq("除 Emoji 图标外，可见文案逐字一致", after, stripEmoji(before))
    ok("demo-after 不含 Emoji 图标", !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u.test(after))
    const beforeText = stripEmoji(before)
    for (const word of ["任务看板", "实时讨论", "进度报告"]) {
      const n = (beforeText.match(new RegExp(word, "g")) || []).length
      const m = (after.match(new RegExp(word, "g")) || []).length
      ok(`「${word}」出现次数与原文一致（${n}）`, n === m, `原 ${n}，新 ${m}`)
    }
    ok("demo-after 未新增「始终同步」功能卡", !after.includes("始终同步"))
    ok("demo-after 未新增营销文案", !after.includes("无需信用卡") && !after.includes("受到这些团队的信任"))

    /* ---------- 14. 原业务逻辑未改 ---------- */
    console.log("\n业务逻辑")
    const afterSrc = await (await fetch(`${BASE}/demo-after.html`)).text()
    for (const fn of ["scrollToTry", "subscribe", "addTodo"]) {
      ok(`保留 ${fn}()`, afterSrc.includes(`function ${fn}(`))
    }
    ok("保留 email / todoInput / todoList 的 id", ["email", "todoInput", "todoList"].every((id) => afterSrc.includes(`id="${id}"`)))
    ok("保留原有 onclick 绑定", afterSrc.includes('onclick="scrollToTry()"') && afterSrc.includes('onclick="subscribe()"') && afterSrc.includes('onclick="addTodo()"'))

    /* ---------- 15. fetch.sh 参数解析 ---------- */
    console.log("\nregistry/fetch.sh")
    const sh = path.join(ROOT, "registry", "fetch.sh")
    ok("fetch.sh 可执行", (fs.statSync(sh).mode & 0o111) !== 0)
    const { execFileSync } = require("node:child_process")
    const listed = execFileSync("bash", [sh, "list", "shadcn-ui"], { encoding: "utf8" })
    ok("fetch.sh list shadcn-ui 正常", listed.includes("button") && listed.includes("card"))
    const magic = execFileSync("bash", [sh, "list", "magic-ui"], { encoding: "utf8" })
    ok("fetch.sh list magic-ui 读到 registry.json", magic.includes("Magic UI 共"))

    /* ---------- 16. 关闭后端口释放 ---------- */
  } finally {
    proc.kill("SIGTERM")
  }

  console.log(`\n${"-".repeat(52)}`)
  if (failures.length) {
    console.log(`失败 ${failures.length} 项 / 通过 ${passed} 项`)
    failures.forEach((f) => console.log("  ✗ " + f))
    process.exitCode = 1
  } else {
    console.log(`全部通过：${passed} 项`)
  }
}

main().catch((e) => {
  console.error("自检异常：" + e.message)
  process.exitCode = 1
})
