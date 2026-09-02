// 一次性脚本：engine.js 补丁（byFam 过滤 + 新闻位按出生增配）
const fs = require('fs');
const f = 'js/engine.js';
let s = fs.readFileSync(f, 'utf8');

// 1) byFam 过滤工具（挂在 norm 定义后）
const normAnchor = "  G.norm = norm;";
if (!s.includes(normAnchor)) { console.error('norm anchor not found'); process.exit(1); }
if (!s.includes('const byFam')) {
  s = s.replace(normAnchor, normAnchor + "\n  // v1.15：出生过滤（famFilter 命中之外的一律跳过）\n  const byFam = b => !b.famFilter || b.famFilter.includes(S.fam);");
}

// 2) 各循环应用过滤
if (!s.includes('ch1.filter(byFam)')) {
  s = s.replace("  ch1.forEach(raw => Q.push(norm(raw)));", "  ch1.filter(byFam).forEach(raw => Q.push(norm(raw)));");
}
if (!s.includes('uni.filter(byFam)')) {
  s = s.replace("  uni.forEach(raw => Q.push(norm(raw)));", "  uni.filter(byFam).forEach(raw => Q.push(norm(raw)));");
}
if (!s.includes("evpool = clone(C.ch4Pool).filter(e => e.type === 'card' && byFam(e))")) {
  s = s.replace("  const evpool = clone(C.ch4Pool).filter(e => e.type === 'card').map(norm);",
                "  const evpool = clone(C.ch4Pool).filter(e => e.type === 'card' && byFam(e)).map(norm);");
}
if (!s.includes('xq.filter(byFam)')) {
  s = s.replace("  xq.forEach(raw => Q.push(norm(raw)));", "  xq.filter(byFam).forEach(raw => Q.push(norm(raw)));");
}

// 3) famNews 助手
if (!s.includes('G.famNews')) {
  const helperAnchor = "G.finishQueue = function () {";
  s = s.replace(helperAnchor, "/* ---------- v1.15：按出生插入专属热搜 ---------- */\n" +
    "G.famNews = function (newsId) {\n" +
    "  const S = G.S;\n" +
    "  const map = { town: ['cunqing', 'dagong'], mid: ['jiaoyu', 'guojiBi'], roma: ['erdai'] };\n" +
    "  const extra = (map[S.fam] || []).filter(id => C.news[id]);\n" +
    "  const i = S.Q.findIndex(b => b.t === 'news' && b.id === newsId);\n" +
    "  if (i >= 0 && extra.length) S.Q.splice(i + 1, 0, ...extra.map(id => ({ t: 'news', id })));\n" +
    "};\n\n" + helperAnchor);
}

// 4) 新闻位调用
if (!s.includes("'cunqing'")) {
  s = s.replace("  Q.push({ t: 'news', id: 'sanSui' });",
    "  Q.push({ t: 'news', id: 'sanSui' });\n  if (S.fam !== 'roma') Q.push({ t: 'news', id: S.fam === 'town' ? 'cunqing' : 'jiaoyu' });");
}
if (!s.includes("id: 'guojiBi'")) {
  s = s.replace("  Q.push({ t: 'news', id: 'kaoyan' });",
    "  Q.push({ t: 'news', id: 'kaoyan' });\n  if (S.fam === 'mid') Q.push({ t: 'news', id: 'guojiBi' });");
}
if (!s.includes("id: 'lungang'")) {
  s = s.replace("  Q.push({ t: 'news', id: 'xiaozhen' });",
    "  Q.push({ t: 'news', id: 'xiaozhen' });\n  Q.push({ t: 'news', id: 'lungang' });");
}
if (!s.includes("id: 'erdai'")) {
  s = s.replace("  Q.push({ t: 'news', id: 'jiaban' });",
    "  Q.push({ t: 'news', id: 'jiaban' });\n  Q.push({ t: 'news', id: 'erdai' });");
}

fs.writeFileSync(f, s);
console.log('engine.js patched');
