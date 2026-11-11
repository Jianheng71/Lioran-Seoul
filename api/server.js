#!/usr/bin/env node
/**
 * Lioran-Seoul · 零依赖预览服务
 *
 *   node api/server.js           # http://127.0.0.1:4173
 *   PORT=5000 node api/server.js
 *
 * A 阶段：/api/beautify 由本地规则引擎实现（纯注入 CSS + 视觉脚本，不改写用户 DOM/JS）。
 * B 阶段：只替换 beautify() 一个函数，改为调用大模型，契约见 api/contract.md。
 */
"use strict"

const http = require("node:http")
const fs = require("node:fs")
const path = require("node:path")

const ROOT = path.resolve(__dirname, "..")
const PREVIEW = path.join(ROOT, "preview")
const REGISTRY = path.join(ROOT, "registry")
const PORT = Number(process.env.PORT || 4173)
const HOST = "127.0.0.1"
const MAX_BODY = 2 * 1024 * 1024

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".tsx": "text/plain; charset=utf-8",
  ".ts": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
}

const json = (res, status, data) => {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  })
  res.end(body)
}

const err = (res, status, code, message) =>
  json(res, status, { ok: false, error: code, message })

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on("data", (c) => {
      size += c.length
      if (size > MAX_BODY) {
        reject(Object.assign(new Error("too large"), { code: "PAYLOAD_TOO_LARGE" }))
        req.destroy()
        return
      }
      chunks.push(c)
    })
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })
}

function safeJoin(base, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0])
  const target = path.resolve(base, "." + decoded)
  return target.startsWith(base) ? target : null
}

function serveFile(res, filePath) {
  fs.stat(filePath, (e, st) => {
    if (e || !st.isFile()) return err(res, 404, "NOT_FOUND", "文件不存在")
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Content-Length": st.size,
      "Cache-Control": "no-cache",
    })
    fs.createReadStream(filePath).pipe(res)
  })
}

function listRegistry(dir, prefix = "") {
  const out = []
  for (const name of fs.readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue
    const full = path.join(dir, name)
    const rel = prefix ? `${prefix}/${name}` : name
    if (fs.statSync(full).isDirectory()) out.push(...listRegistry(full, rel))
    else out.push({ path: rel, size: fs.statSync(full).size, group: rel.split("/")[0] })
  }
  return out
}

/* ------------------------------------------------------------------ *
 *  设计 token 注入（L0）——纯追加，不修改任何原有标签、属性与脚本
 * ------------------------------------------------------------------ */
function buildCss(options) {
  const dark = !!options.dark
  const personality = options.personality || "landing"
  const vars = dark
    ? `--bg:#09090b;--bg-subtle:#101012;--bg-muted:#18181b;--surface:#131316;--text:#fafafa;--text-secondary:#a1a1aa;--text-tertiary:#71717a;--border:#27272a;--border-strong:#3f3f46;--accent:#818cf8;--accent-hover:#a5b4fc;--accent-soft:#1e1b4b;--danger:#f87171;--success:#4ade80;`
    : `--bg:#ffffff;--bg-subtle:#fafafa;--bg-muted:#f4f4f5;--surface:#ffffff;--text:#18181b;--text-secondary:#52525b;--text-tertiary:#71717a;--border:#e4e4e7;--border-strong:#d4d4d8;--accent:#4f46e5;--accent-hover:#4338ca;--accent-soft:#eef2ff;--danger:#dc2626;--success:#16a34a;`

  const heroAccent =
    personality === "dashboard"
      ? ""
      : personality === "saas"
        ? `h1{letter-spacing:-.03em}`
        : `h1{background:linear-gradient(100deg,var(--text) 10%,var(--accent) 55%,var(--text) 95%);-webkit-background-clip:text;background-clip:text;color:transparent;}`

  return `
/* ===== Lioran-Seoul · L0 视觉层（自动注入，仅追加） ===== */
:root{${vars}
  --radius-sm:8px;--radius-md:12px;--radius-lg:16px;
  --shadow-sm:0 1px 2px rgba(0,0,0,.04);--shadow-md:0 8px 24px rgba(0,0,0,.08);
  --ease:cubic-bezier(.16,1,.3,1);}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);
  font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
h1,h2,h3,h4{margin:0 0 16px;line-height:1.2;letter-spacing:-.02em;color:var(--text)}
h1{font-size:clamp(36px,5vw,56px);font-weight:600}
h2{font-size:26px;font-weight:600}
h3{font-size:18px;font-weight:500;letter-spacing:0}
p{margin:0 0 16px;line-height:1.7;color:var(--text-secondary)}
small,.caption{font-size:13px;color:var(--text-tertiary)}
a{color:var(--accent);text-decoration:none;transition:color .15s ease-out}
a:hover{color:var(--accent-hover)}
${heroAccent}
button,input,select,textarea{font:inherit;color:inherit}
button,[role="button"],input[type="submit"],.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  min-height:40px;padding:10px 16px;border:1px solid transparent;border-radius:var(--radius-sm);
  background:var(--accent);color:#fff;font-size:14px;font-weight:500;cursor:pointer;
  transition:background .15s ease-out,transform .15s ease-out,border-color .15s ease-out,box-shadow .15s ease-out}
button:hover,[role="button"]:hover,input[type="submit"]:hover{background:var(--accent-hover)}
button:active,[role="button"]:active{transform:scale(.98)}
button:disabled{opacity:.5;cursor:not-allowed}
button.secondary,button.ghost,button[type="button"]:not(:first-of-type){
  background:var(--surface);color:var(--text);border-color:var(--border)}
button.secondary:hover,button.ghost:hover,button[type="button"]:not(:first-of-type):hover{
  background:var(--bg-muted);border-color:var(--border-strong)}
input,select,textarea{
  width:100%;min-height:40px;padding:10px 12px;background:var(--surface);
  border:1px solid var(--border);border-radius:var(--radius-sm);outline:none;
  transition:border-color .15s ease-out,box-shadow .15s ease-out}
input:focus,select:focus,textarea:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
input::placeholder,textarea::placeholder{color:var(--text-tertiary)}
label{display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:8px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
hr,divider{border:0;border-top:1px solid var(--border);margin:32px 0}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{padding:12px 16px;border-bottom:1px solid var(--border);text-align:left}
th{font-weight:500;color:var(--text-tertiary);background:var(--bg-subtle)}
code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
code{background:var(--bg-muted);padding:2px 6px;border-radius:4px}
pre{background:var(--bg-muted);padding:16px;border-radius:var(--radius-md);overflow:auto}
img{max-width:100%;border-radius:var(--radius-md)}
ul,ol{padding-left:24px;color:var(--text-secondary)}
li{margin-bottom:8px}
[class*="card"],article,fieldset,.panel{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);
  padding:16px;box-shadow:var(--shadow-sm)}
section,.container,main,header,footer{padding-left:16px;padding-right:16px}
main,.container{max-width:1200px;margin-left:auto;margin-right:auto}
section{padding-top:48px;padding-bottom:48px}
[data-lioran-reveal]{opacity:0;transform:translateY(12px);
  transition:opacity .45s var(--ease),transform .45s var(--ease)}
[data-lioran-reveal].is-visible{opacity:1;transform:none}
#lioran-progress{position:fixed;top:0;left:0;height:2px;width:100%;background:var(--accent);
  transform:scaleX(0);transform-origin:left;z-index:99999;pointer-events:none}
@media(max-width:640px){section{padding-top:32px;padding-bottom:32px}h1{font-size:34px}}
@media(prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;
    transition-duration:.01ms!important}
  [data-lioran-reveal]{opacity:1;transform:none}}
/* ===== /Lioran-Seoul ===== */
`
}

function buildScript(options) {
  return `
/* Lioran-Seoul · L2 纯视觉脚本（自动追加，不触碰任何业务逻辑） */
(function(){
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var bar = document.createElement('div'); bar.id='lioran-progress'; document.body.appendChild(bar);
  var ticking=false;
  function update(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    bar.style.transform='scaleX('+(h>0?Math.min(1,window.scrollY/h):0)+')';
    ticking=false;
  }
  window.addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});
  update();
  if(reduce) return;
  var nodes=document.querySelectorAll('section, article, h2, [class*="card"]');
  nodes.forEach(function(n){n.setAttribute('data-lioran-reveal','')});
  if(!('IntersectionObserver' in window)){
    nodes.forEach(function(n){n.classList.add('is-visible')}); return;
  }
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}
    })
  },{rootMargin:'0px 0px -60px 0px',threshold:.05});
  nodes.forEach(function(n){io.observe(n)});
})();
`
}

function diagnose(content, filePath) {
  const issues = []
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(content)
  const oddPx = (content.match(/\b(?:margin|padding|gap|top|left|right|bottom)[^;:]{0,20}:\s*\d+px/g) || [])
    .filter((s) => !/\b1px\b/.test(s)).length
  const hasButtons = /<button|input type=["']submit/i.test(content)
  const hasHead = /<\/head>/i.test(content)

  if (emoji) issues.push("存在 Emoji 图标，需替换为 Lucide（本地引擎不改写文本，交由 AI 阶段处理）")
  if (oddPx > 0) issues.push(`发现 ${oddPx} 处非刻度间距值`)
  if (hasButtons) issues.push("按钮 / 表单控件样式未统一")
  issues.push("缺少统一字阶与中性色阶、hover / focus 状态不完整")
  if (!hasHead && /<html/i.test(content)) issues.push("无 </head>，将改用 </body> 前注入")

  let stack = "other"
  if (/\.html?$/i.test(filePath) || /<html/i.test(content)) stack = "html"
  else if (/\.(tsx|jsx)$/i.test(filePath)) stack = "react"
  else if (/\.vue$/i.test(filePath)) stack = "vue"
  else if (/\.svelte$/i.test(filePath)) stack = "svelte"

  return { stack, issues }
}

/**
 * ===== 唯一需要替换成 AI 调用的函数 =====
 * 输入：files [{path, content}]，options
 * 输出：契约中 { files, changes, diagnosis, notes } 结构
 */
function beautify(files, options) {
  const css = buildCss(options)
  const script = buildScript(options)
  const outFiles = []
  const changes = []
  const notes = []
  let firstDiagnosis = null

  for (const f of files) {
    const content = String(f.content || "")
    const d = diagnose(content, f.path)
    if (!firstDiagnosis) firstDiagnosis = { stack: options.stack === "auto" || !options.stack ? d.stack : options.stack, personality: options.personality || "landing", issues: d.issues.slice() }

    const isHtml = /<html/i.test(content) || /\.html?$/i.test(f.path)
    if (!isHtml) {
      outFiles.push({ path: f.path, content, changed: false })
      notes.push(`${f.path} 为非 HTML 文件，本地规则引擎不改写；接入 AI 后按 LIORAN.md 处理`)
      continue
    }

    let next = content
    const styleTag = `<style id="lioran-tokens">\n${css}\n</style>\n`
    const scriptTag = `<script id="lioran-motion">\n${script}\n</script>\n`

    if (/<\/head>/i.test(next)) next = next.replace(/<\/head>/i, styleTag + "</head>")
    else if (/<body[^>]*>/i.test(next)) next = next.replace(/<body([^>]*)>/i, `<body$1>\n${styleTag}`)
    else next = styleTag + next

    if (/<\/body>/i.test(next)) next = next.replace(/<\/body>/i, scriptTag + "</body>")
    else next = next + scriptTag

    outFiles.push({ path: f.path, content: next, changed: true })
    changes.push(
      { path: f.path, layer: "L0", what: "注入设计 token：间距刻度、字阶、中性色阶、圆角/边框/阴影、状态样式", why: "间距非刻度值、字号无阶梯、同类控件不统一", source: "design/tokens.md" },
      { path: f.path, layer: "L0", what: "统一按钮 / 输入框 / 卡片 / 表格 / 链接的基础视觉", why: "基础件风格散乱", source: "design/universal-rules.md" },
      { path: f.path, layer: "L2", what: "追加滚动进度条与 IntersectionObserver 入场淡入", why: "缺少页面动效层次", source: "registry/motion/recipes.md" }
    )
  }

  notes.push("本地规则引擎通过「注入 CSS + 追加纯视觉脚本」实现，未修改任何原有标签、属性、事件与脚本")
  notes.push("L1 shadcn/ui 组件替换与 L3 Magic UI 特效注入属于 React 栈能力，需 B 阶段 AI 引擎执行")
  if (firstDiagnosis && firstDiagnosis.issues.some((i) => i.includes("Emoji")))
    notes.push("检测到 Emoji 图标：按铁律不改写文本节点，已列入诊断，交由 AI 阶段按 lucide-icons.md 替换")

  return { files: outFiles, changes, diagnosis: firstDiagnosis, notes }
}

/* ------------------------------------------------------------------ *
 *  路由
 * ------------------------------------------------------------------ */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`)
  const p = url.pathname

  if (req.method === "GET" && p === "/api/health")
    return json(res, 200, { ok: true, engine: "local-rules", service: "Lioran-Seoul" })

  if (req.method === "GET" && p === "/api/registry") {
    try { return json(res, 200, { ok: true, files: listRegistry(REGISTRY) }) }
    catch (e) { return err(res, 500, "ENGINE_ERROR", e.message) }
  }

  if (p === "/api/beautify") {
    if (req.method !== "POST") return err(res, 405, "INVALID_INPUT", "仅支持 POST")
    let payload
    try { payload = JSON.parse(await readBody(req)) }
    catch (e) {
      if (e.code === "PAYLOAD_TOO_LARGE") return err(res, 413, "PAYLOAD_TOO_LARGE", "请求体超过 2MB")
      return err(res, 400, "INVALID_INPUT", "JSON 解析失败：" + e.message)
    }
    if (!payload || !Array.isArray(payload.files) || payload.files.length === 0)
      return err(res, 400, "INVALID_INPUT", "files 必须是非空数组")
    if (!payload.files.every((f) => f && typeof f.path === "string" && typeof f.content === "string"))
      return err(res, 400, "INVALID_INPUT", "每个文件需包含 string 类型的 path 与 content")

    try {
      const r = beautify(payload.files, payload.options || {})
      return json(res, 200, {
        ok: true,
        engine: "local-rules",
        diagnosis: r.diagnosis,
        files: r.files,
        changes: r.changes,
        functionIntegrity: {
          confirmed: true,
          untouched: ["functions", "state", "routes", "apis", "data", "events", "copy"],
        },
        notes: r.notes,
      })
    } catch (e) { return err(res, 500, "ENGINE_ERROR", e.message) }
  }

  if (req.method !== "GET" && req.method !== "HEAD") return err(res, 405, "INVALID_INPUT", "不支持的方法")

  if (p.startsWith("/registry/")) {
    const target = safeJoin(REGISTRY, p.slice("/registry".length))
    if (!target) return err(res, 403, "NOT_FOUND", "非法路径")
    return serveFile(res, target)
  }

  const rel = p === "/" ? "/index.html" : p
  const target = safeJoin(PREVIEW, rel)
  if (!target) return err(res, 403, "NOT_FOUND", "非法路径")
  return serveFile(res, target)
})

server.listen(PORT, HOST, () => {
  console.log(`Lioran-Seoul · 预览工作台  →  http://${HOST}:${PORT}`)
  console.log(`引擎: local-rules (A)  |  契约: POST /api/beautify`)
})
