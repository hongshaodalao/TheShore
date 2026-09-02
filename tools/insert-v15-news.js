// 一次性脚本：v1.15 热搜增配 + 共用卡错配修复
const fs = require('fs');

/* ===== data/cards.js：专属热搜 + 学区房 famFilter ===== */
(function () {
  let s = fs.readFileSync('data/cards.js', 'utf8');

  // 1) 新增 7 条专属/共用补充热搜
  const jiabanAnchor = "  jiaban:  { app: '财经早报', tag: '头条', title: '家族办公室数量五年翻十倍', body: '“二代”们的资产配置、传承规划与意义感管理，构成新蓝海。评论区：我一个亿的小目标先立住了。' }";
  if (!s.includes(jiabanAnchor)) { console.error('jiaban anchor not found'); process.exit(1); }
  s = s.replace(jiabanAnchor, jiabanAnchor + ",\n" +
    "  cunqing: { app: '县融媒体', tag: '头条', title: '某县中学一人考上清北 全村扫码看直播', body: '村里在祠堂摆了 18 桌。直播间 12 万人，弹幕刷：寒门贵子。当事人回应：别拍了，我还得填志愿。' },\n" +
    "  dagong:  { app: '热搜', tag: '热', title: '打工子弟学校关停 家长连夜转学籍', body: '一纸通知，三百个孩子转学。家长群里有人说：反正迟早要回老家。这句话被转发了两万次。' },\n" +
    "  jiaoyu:  { app: '财经早报', tag: '头条', title: '家庭教育开支调查：占可支配收入四成', body: '报告显示：中产家庭课外班与升学支出占可支配收入 44%。评论区高赞：这不是教育，这是军备。' },\n" +
    "  guojiBi: { app: '热搜', tag: '爆', title: '某国际学校突然闭店 学费退还引纠纷', body: '一年 22 万的国际学校 overnight 关停，三百个家庭讨要学费。评论：背景提升，提升了闭店速度。' },\n" +
    "  erdai:   { app: '热搜', tag: '热', title: '“二代”接班意愿调查：仅三成愿意接手家族企业', body: '报告称六成二代“更想做自己喜欢的事”。评论区：他们喜欢的事，是很多人的天花板。' },\n" +
    "  lungang: { app: '教育台', tag: '头条', title: '多地推进教师轮岗 名校光环加速退潮', body: '名师要去普通学校任教了。学区房中介连夜改口：我们卖的是地段。' }");

  // 2) 学区房卡标 famFilter（仅中产/罗马）
  const xqfOld = "  { type: 'card', app: '家里', who: '爸爸', title: '学区房',";
  if (!s.includes(xqfOld)) { console.error('xqf anchor not found'); process.exit(1); }
  s = s.replace(xqfOld, "    { ch: 1, famFilter: ['mid', 'roma'], app: '家里', who: '爸爸', title: '学区房',");

  // 3) 双减后卡：小镇变体（通过 variants 字段）
  const shuangjianOld = "  { type: 'card', app: '家长群', who: '妈妈', title: '双减之后',\n    text: '补习班关了一半。妈妈的手机收到一条私信：“一对一家教，原学而优名师，时薪 800。”她盯着屏幕看了很久。',\n    ch: [\n      { label: '请', fx: { score: 8, money: -14 }, reply: '钱变成了分，分变成了安心。产业链只是搬了个地方。' },\n      { label: '不请', fx: { mood: 3 }, set: { deng: 1 }, reply: '“别人都在偷偷学。”这句话成了悬在你头顶的新月亮。' }\n    ] },";
  if (!s.includes(shuangjianOld)) { console.error('shuangjian anchor not found'); process.exit(1); }
  s = s.replace(shuangjianOld, "  { type: 'card', app: '家长群', who: '妈妈', title: '双减之后',\n    text: '补习班关了一半。妈妈的手机收到一条私信：“一对一家教，原学而优名师，时薪 800。”她盯着屏幕看了很久。',\n    variants: {\n      town: {\n        text: '补习班关了一半。妈妈的手机收到一条消息：“镇上退休老教师，在家带课，一学期 2000。”她盯着屏幕看了很久——两个月伙食费。',\n        ch: [\n          { label: '请', fx: { score: 6, money: -6 }, reply: '老教师很认真，你妈很心疼。钱变成了分，分变成了安心——只是这次的安心，便宜了很多，也重了很多。' },\n          { label: '不请', fx: { mood: 3 }, set: { deng: 1 }, reply: '“别人都在偷偷学。”这句话成了悬在你头顶的新月亮。' }\n        ]\n      }\n    },\n    ch: [");

  fs.writeFileSync('data/cards.js', s);
  console.log('cards.js patched');
})();

/* ===== js/engine.js：渲染层支持 famFilter 与 variants ===== */
(function () {
  let s = fs.readFileSync('js/engine.js', 'utf8');

  // 1) G.card 渲染时按 fam 取 variants / 按 famFilter 跳过（跳过由烘焙层处理）
  const cardAnchor = "G.card = function (beat, onDone) {";
  if (!s.includes(cardAnchor)) { console.error('card anchor not found'); process.exit(1); }
  s = s.replace(cardAnchor, cardAnchor + "\n  const v = beat.variants && beat.variants[G.S.fam];\n  if (v) { beat = Object.assign({}, beat, { text: v.text, ch: v.ch }); }");

  // 2) buildChapters 烘焙层：按 famFilter 过滤共用卡
  const normAnchor = "  const norm = b => {\n    if (b.type === 'news') return { t: 'news', id: b.id };\n    const o = clone(b); o.t = 'card'; delete o.type; return o;\n  };\n  G.norm = norm;";
  if (!s.includes(normAnchor)) { console.error('norm anchor not found'); process.exit(1); }
  s = s.replace(normAnchor, "  const norm = b => {\n    if (b.type === 'news') return { t: 'news', id: b.id };\n    const o = clone(b); o.t = 'card'; delete o.type; return o;\n  };\n  G.norm = norm;\n  // v1.15：出生过滤（famFilter 命中之外的一律跳过）\n  const byFam = b => !b.famFilter || b.famFilter.includes(S.fam);");

  // 3) 第一章/第四章等循环处应用过滤（在 forEach 前过滤 ch1 与 ch4Pool/xq）
  s = s.replace("  ch1.forEach(raw => Q.push(norm(raw)));", "  ch1.filter(byFam).forEach(raw => Q.push(norm(raw)));");
  s = s.replace("  const evpool = clone(C.ch4Pool).filter(e => e.type === 'card').map(norm);",
                "  const evpool = clone(C.ch4Pool).filter(e => e.type === 'card' && byFam(e)).map(norm);");
  s = s.replace("  xq.forEach(raw => Q.push(norm(raw)));", "  xq.filter(byFam).forEach(raw => Q.push(norm(raw)));");
  s = s.replace("  uni.forEach(raw => Q.push(norm(raw)));", "  uni.filter(byFam).forEach(raw => Q.push(norm(raw)));");

  fs.writeFileSync('js/engine.js', s);
  console.log('engine.js patched');
})();

/* ===== js/engine.js：新闻位按出生增配 ===== */
(function () {
  let s = fs.readFileSync('js/engine.js', 'utf8');

  // 通用小工具：在新闻节拍后插入本线专属新闻
  const helperAnchor = "G.finishQueue = function () {";
  if (!s.includes(helperAnchor)) { console.error('helper anchor not found'); process.exit(1); }
  s = s.replace(helperAnchor, "/* ---------- v1.15：按出生插入专属热搜 ---------- */\n" +
    "G.famNews = function (newsId) {\n" +
    "  const S = G.S;\n" +
    "  const map = { town: ['cunqing', 'dagong'], mid: ['jiaoyu', 'guojiBi'], roma: ['erdai'] };\n" +
    "  const extra = (map[S.fam] || []).filter(id => C.news[id]);\n" +
    "  const i = S.Q.findIndex(b => b.t === 'news' && b.id === newsId);\n" +
    "  if (i >= 0 && extra.length) S.Q.splice(i + 1, 0, ...extra.map(id => ({ t: 'news', id })));\n" +
    "};\n\n" + helperAnchor);

  // 各新闻位调用：sanSui→cunqing；kaoyan→jiaoyu/guojiBi；xiaozhen→lungang；uni(roma 段)→erdai
  s = s.replace("  Q.push({ t: 'news', id: 'sanSui' });",
    "  Q.push({ t: 'news', id: 'sanSui' });\n  if (S.fam !== 'roma') Q.push({ t: 'news', id: S.fam === 'town' ? 'cunqing' : 'jiaoyu' });");
  s = s.replace("  Q.push({ t: 'news', id: 'kaoyan' });",
    "  Q.push({ t: 'news', id: 'kaoyan' });\n  if (S.fam === 'mid') Q.push({ t: 'news', id: 'guojiBi' });");
  s = s.replace("  Q.push({ t: 'news', id: 'xiaozhen' });",
    "  Q.push({ t: 'news', id: 'xiaozhen' });\n  Q.push({ t: 'news', id: 'lungang' });");
  // 罗马大学段后：erdai（roma 线 buildRoma 中 news jiaban 之后）
  s = s.replace("  Q.push({ t: 'news', id: 'jiaban' });\n  pushCard(pick('信托'));",
    "  Q.push({ t: 'news', id: 'jiaban' });\n  Q.push({ t: 'news', id: 'erdai' });\n  pushCard(pick('信托'));");

  fs.writeFileSync('js/engine.js', s);
  console.log('engine news positions patched');
})();

console.log('v1.15 done');
