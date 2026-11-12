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
    let settled = false
    const chunks = []
    const fail = (code, message) => {
      if (settled) return
      settled = true
      reject(Object.assign(new Error(message), { code }))
    }
    req.on("data", (c) => {
      size += c.length
      if (size > MAX_BODY) {
        // 停止累积但不要 destroy：先把 413 正常写回客户端
        chunks.length = 0
        fail("PAYLOAD_TOO_LARGE", "请求体超过 2MB")
        return
      }
      chunks.push(c)
    })
    req.on("end", () => {
      if (settled) return
      settled = true
      resolve(Buffer.concat(chunks).toString("utf8"))
    })
    req.on("error", (e) => fail("INVALID_INPUT", e.message))
  })
}

function safeJoin(base, urlPath) {
  let decoded
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0])
  } catch {
    return null
  }
  if (decoded.includes("\0")) return null
  const target = path.resolve(base, "." + decoded)
  // 必须落在 base 目录内部：/a/preview 不能匹配 /a/preview-other
  const rel = path.relative(base, target)
  if (rel === "") return target
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null
  return target
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
const PERSONALITIES = ["landing", "saas", "dashboard", "docs"]
const LEVELS = ["L0", "L1", "L2", "L3", "full"]

function resolvePersonality(value) {
  if (value && PERSONALITIES.includes(value)) return value
  return "landing" // auto 或未知值
}

function resolveLevel(value) {
  if (value && LEVELS.includes(value)) return value
  return "full"
}

/** 该层级是否包含 L2 动效脚本 */
function levelIncludesMotion(level) {
  return level === "L2" || level === "L3" || level === "full"
}
function buildCss(options) {
  const dark = !!options.dark
  const personality = resolvePersonality(options.personality)
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
  const oddPx = (content.match(/\b(?:margin|padding|gap|top|left|right|bottom)\s*:\s*\d+px/g) || [])
    .filter((s) => !/\b1px\b/.test(s)).length
  const hasButtons = /<button|input\s+type=["']submit/i.test(content)
  const hasHead = /<\/head>/i.test(content)

  if (emoji) issues.push("存在 Emoji 图标，需替换为 Lucide（本地引擎不改写文本，交由 AI 阶段处理）")
  if (oddPx > 0) issues.push(`发现 ${oddPx} 处非刻度间距值`)
  if (hasButtons) issues.push("按钮 / 表单控件样式未统一")

  // 只在确有信号时追加，避免对任何输入都输出同一段套话
  const fontSizes = new Set(
    (content.match(/font-size\s*:\s*[^;"'}<]+/gi) || []).map((s) => s.replace(/\s+/g, "").toLowerCase()),
  )
  if (fontSizes.size > 5) issues.push(`出现 ${fontSizes.size} 种字号，超出 5 级阶梯`)
  if (hasButtons && !/:hover/i.test(content)) issues.push("缺少 hover / focus-visible 视觉状态")
  if (!/--accent|--color-primary|--primary/i.test(content)) issues.push("没有中性色阶与单一强调色变量")
  if (!hasHead && /<html/i.test(content)) issues.push("无 </head>，将改用 </body> 前注入")

  let stack = "other"
  if (/\.html?$/i.test(filePath) || /<html/i.test(content)) stack = "html"
  else if (/\.(tsx|jsx)$/i.test(filePath)) stack = "react"
  else if (/\.vue$/i.test(filePath)) stack = "vue"
  else if (/\.svelte$/i.test(filePath)) stack = "svelte"

  return { stack, issues }
}

/* ------------------------------------------------------------------ *
 *  功能完整性校验——不再硬编码 confirmed:true，而是真的核对
 * ------------------------------------------------------------------ */
const STYLE_OPEN = `<style id="lioran-tokens">`
const SCRIPT_OPEN = `<script id="lioran-motion">`

/** 剥掉本引擎注入的两段内容，应能逐字节还原原文件 */
function stripInjected(html) {
  return html
    .replace(/<style id="lioran-tokens">[\s\S]*?<\/style>[ \t]*\r?\n?/i, "")
    .replace(/<script id="lioran-motion">[\s\S]*?<\/script>[ \t]*\r?\n?/i, "")
}

/** 提取用户可见文案（去标签、去脚本样式、压缩空白） */
function visibleText(html) {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function verifyIntegrity(original, output) {
  const checks = []
  const restored = stripInjected(output)
  if (restored !== original) {
    return {
      confirmed: false,
      reason: "注入层无法无损剥离，输出与原文不一致（可能原文件已含同名 style/script 标记）",
      checks,
    }
  }
  checks.push("注入层可无损剥离：标签、属性、事件绑定与原文件逐字节一致")
  if (visibleText(original) !== visibleText(output)) {
    return { confirmed: false, reason: "用户可见文案发生变化", checks }
  }
  checks.push("用户可见文案未变")
  return { confirmed: true, checks }
}

/**
 * ===== 唯一需要替换成 AI 调用的函数 =====
 * 输入：files [{path, content}]，options
 * 输出：契约中 { files, changes, diagnosis, notes } 结构
 */
function beautify(files, options) {
  const css = buildCss(options)
  const script = buildScript(options)
  const level = resolveLevel(options.level)
  const withMotion = levelIncludesMotion(level)
  const outFiles = []
  const changes = []
  const notes = []
  const integrityChecks = []
  const integrityFailures = []
  let firstDiagnosis = null

  for (const f of files) {
    const content = String(f.content || "")
    const d = diagnose(content, f.path)
    if (!firstDiagnosis) {
      firstDiagnosis = {
        stack: !options.stack || options.stack === "auto" ? d.stack : options.stack,
        personality: resolvePersonality(options.personality),
        issues: d.issues.slice(),
      }
    }

    const isHtml = /<html/i.test(content) || /\.html?$/i.test(f.path)
    if (!isHtml) {
      outFiles.push({ path: f.path, content, changed: false })
      notes.push(`${f.path} 为非 HTML 文件，本地规则引擎不改写；接入 AI 后按 LIORAN.md 处理`)
      continue
    }

    let next = content
    const styleTag = `${STYLE_OPEN}\n${css}\n</style>\n`
    const scriptTag = `${SCRIPT_OPEN}\n${script}\n</script>\n`

    // 用函数式 replace，避免内容里的 $& / $' 被当成替换模式
    if (/<\/head>/i.test(next)) next = next.replace(/<\/head>/i, () => styleTag + "</head>")
    else if (/<body[^>]*>/i.test(next)) next = next.replace(/<body([^>]*)>/i, (m, attrs) => `<body${attrs}>${styleTag}`)
    else next = styleTag + next

    if (withMotion) {
      if (/<\/body>/i.test(next)) next = next.replace(/<\/body>/i, () => scriptTag + "</body>")
      else next = next + scriptTag
    }

    outFiles.push({ path: f.path, content: next, changed: true })

    changes.push({
      path: f.path,
      layer: "L0",
      what: "注入设计 token：间距刻度、字阶、中性色阶、圆角/边框/阴影、状态样式",
      why: "间距非刻度值、字号无阶梯、同类控件不统一",
      source: "design/tokens.md",
    })
    changes.push({
      path: f.path,
      layer: "L0",
      what: "统一按钮 / 输入框 / 卡片 / 表格 / 链接的基础视觉",
      why: "基础件风格散乱",
      source: "design/universal-rules.md",
    })
    if (withMotion) {
      changes.push({
        path: f.path,
        layer: "L2",
        what: "追加滚动进度条与 IntersectionObserver 入场淡入",
        why: "缺少页面动效层次",
        source: "registry/motion/recipes.md",
      })
    }

    const v = verifyIntegrity(content, next)
    integrityChecks.push(...v.checks)
    if (!v.confirmed) integrityFailures.push({ path: f.path, reason: v.reason })
  }

  notes.push("本地规则引擎通过「注入 CSS + 追加纯视觉脚本」实现，未修改任何原有标签、属性、事件与脚本")
  if (level === "L0") notes.push("已按 level=L0 只注入规范层，未追加 L2 动效脚本")
  if (!withMotion && level !== "L0") notes.push(`level=${level} 不含 L2 动效，已跳过动效脚本`)
  notes.push("L1 shadcn/ui 组件替换与 L3 Magic UI 特效注入属于 React 栈能力，需 B 阶段 AI 引擎执行")
  if (firstDiagnosis && firstDiagnosis.issues.some((i) => i.includes("Emoji")))
    notes.push("检测到 Emoji 图标：按铁律不改写文本节点，已列入诊断，交由 AI 阶段按 lucide-icons.md 替换")

  return {
    files: outFiles,
    changes,
    diagnosis: firstDiagnosis,
    notes,
    integrity: {
      confirmed: integrityFailures.length === 0,
      checks: [...new Set(integrityChecks)],
      failures: integrityFailures,
    },
  }
}


/* ------------------------------------------------------------------ *
 *  路由
 * ------------------------------------------------------------------ */
const server = http.createServer((req, res) => {
  handle(req, res).catch((e) => {
    if (res.headersSent) return res.destroy()
    err(res, 500, "ENGINE_ERROR", "服务内部错误：" + (e && e.message ? e.message : String(e)))
  })
})

async function handle(req, res) {
  let p
  try {
    p = new URL(req.url, `http://${HOST}:${PORT}`).pathname
  } catch {
    return err(res, 400, "INVALID_INPUT", "非法请求路径")
  }

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
    // 请求体按 UTF-8 解码，非法字节会变成 U+FFFD
    if (payload.files.some((f) => f.content.includes("\uFFFD")))
      return err(res, 400, "UNSUPPORTED_ENCODING", "文件内容不是合法 UTF-8")

    try {
      const r = beautify(payload.files, payload.options || {})
      return json(res, 200, {
        ok: true,
        engine: "local-rules",
        diagnosis: r.diagnosis,
        files: r.files,
        changes: r.changes,
        functionIntegrity: {
          confirmed: r.integrity.confirmed,
          untouched: ["functions", "state", "routes", "apis", "data", "events", "copy"],
          checks: r.integrity.checks,
          failures: r.integrity.failures,
        },
        notes: r.notes,
      })
    } catch (e) { return err(res, 500, "ENGINE_ERROR", e.message) }
  }

  if (req.method !== "GET" && req.method !== "HEAD") return err(res, 405, "INVALID_INPUT", "不支持的方法")

  if (p.startsWith("/registry/")) {
    const target = safeJoin(REGISTRY, p.slice("/registry".length))
    if (!target) return err(res, 400, "INVALID_INPUT", "非法路径")
    return serveFile(res, target)
  }

  const rel = p === "/" ? "/index.html" : p
  const target = safeJoin(PREVIEW, rel)
  if (!target) return err(res, 400, "INVALID_INPUT", "非法路径")
  return serveFile(res, target)
}

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.error(`端口 ${PORT} 已被占用，换一个：PORT=5000 node api/server.js`)
    process.exit(1)
  }
  console.error("服务错误：" + e.message)
  process.exit(1)
})

server.listen(PORT, HOST, () => {
  console.log(`Lioran-Seoul · 预览工作台  →  http://${HOST}:${PORT}`)
  console.log(`引擎: local-rules (A)  |  契约: POST /api/beautify`)
})

