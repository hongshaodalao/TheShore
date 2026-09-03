// 一次性脚本：v1.17 引擎层（share皮肤 + dagongChoice + counterfactual场景）
const fs = require('fs');
const f = 'js/engine.js';
let s = fs.readFileSync(f, 'utf8');

// ===== 1. buildChapters：小镇线在 rank 后加打工选择 =====
{
  const old = "  Q.push(norm(C.tongzhuo.ch1));\n  Q.push({ t: 'dm', title: '查分前夜 · 赛前弹幕', pools: ['exam'], n: 9 });";
  const rep = "  Q.push(norm(C.tongzhuo.ch1));\n  if (S.fam === 'town') Q.push({ t: 'fn', id: 'dagongChoice' });\n  Q.push({ t: 'dm', title: '查分前夜 · 赛前弹幕', pools: ['exam'], n: 9 });";
  if (!s.includes(old)) { console.error('ch1 anchor not found'); process.exit(1); }
  s = s.replace(old, rep);
}

// ===== 2. finishQueue 加 counterfactual =====
{
  const old = "  Q.push({ t: 'fn', id: 'parallel' });\n  Q.push({ t: 'fn', id: 'share' });";
  const rep = "  Q.push({ t: 'fn', id: 'parallel' });\n  Q.push({ t: 'fn', id: 'counterfactual' });\n  Q.push({ t: 'fn', id: 'share' });";
  if (!s.includes(old)) { console.error('pq anchor not found'); process.exit(1); }
  s = s.replace(old, rep);
}

// ===== 3. dagongChoice 场景 =====
const dgCode = `
/* ---------- v1.17：小镇打工选择 ---------- */
G.SCENES.dagongChoice = function (b, done) {
  var S = G.S;
  if (S.flags.dagongChosen !== undefined) { done(); return; }
  var D = C.dagong.choice;
  G.show(
    '<div class="cardbox"><span class="app-chip">' + D.app + '</span>' +
    '<div class="card-title">' + D.title + '</div>' +
    '<div class="card-who">来自：' + D.who + '</div>' +
    '<div class="card-text">' + G.jargonify(D.text) + '</div>' +
    '<div class="choices"><button class="btn" id="dg-go">跟表哥走</button>' +
    '<button class="btn primary" id="dg-stay">回去备考</button></div></div>', {});
  G.$('#dg-go').onclick = function () {
    S.flags.dagongChosen = 1; S.flags.dagong = 1;
    var skipIds = ['exam','province','score','zhiyuan','kzq','gradPath','hrA','hrB','jargon','work','layoffTalk','track3','trackGate'];
    var uniStart = -1, finStart = -1;
    for (var i = 0; i < S.Q.length; i++) {
      var b = S.Q[i];
      if (b.lines && b.lines[0] && b.lines[0].t === '第 二 幕' && uniStart < 0) uniStart = i;
      if (b.lines && b.lines[0] && b.lines[0].t === '终 幕' && finStart < 0) finStart = i;
    }
    if (uniStart >= 0 && finStart > uniStart) S.Q.splice(uniStart, finStart - uniStart);
    var schedIdx = -1;
    for (var i2 = 0; i2 < S.Q.length; i2++) { if (S.Q[i2].id === 'schedule') { schedIdx = i2; break; } }
    if (schedIdx >= 0) S.Q.splice(schedIdx);
    var norm = G.norm || function(c) { return { t: 'card', app: c.app, who: c.who, title: c.title, text: c.text, ch: c.ch }; };
    C.dagong.beats.forEach(function(c) { S.Q.push(norm(c)); });
    S.Q.push(norm(C.dagong.final));
    G.finishQueue();
    G.applyChoice(D.ch[0]);
    G.save(); done();
  };
  G.$('#dg-stay').onclick = function () { S.flags.dagongChosen = 0; G.save(); done(); };
};

/* ---------- v1.17：反事实回响 ---------- */
G.SCENES.counterfactual = function (b, done) {
  var S = G.S;
  var matched = (C.counterfactuals || []).filter(function(c) {
    try { return c.cond(S); } catch(e) { return false; }
  });
  var picked = [];
  var pool = matched.slice();
  while (picked.length < Math.min(2, pool.length)) {
    var k = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(k, 1)[0]);
  }
  var items = picked.map(function(c) {
    return '<div class="echo-card" style="border-left-color:var(--gold)"><p>' + c.text + '</p></div>';
  }).join('');
  var fallback = '<div class="echo-card" style="border-left-color:var(--gold)"><p>你的人生里有很多个如果。每一个都通向一个不同的你。</p></div>';
  G.show(
    '<div style="max-width:360px;margin:0 auto">' +
    '<div class="report-cap">反 事 实 回 响</div>' +
    '<div class="zy-note" style="text-align:center">如果当年……</div>' +
    (items || fallback) +
    '<div class="gacha-note" style="text-align:center;margin:14px 0">但那不是你的人生。<br>你的人生是这一条。</div>' +
    '<div class="choices"><button class="btn primary center" id="cf-go">&#9656;</button></div></div>', {});
  G.$('#cf-go').onclick = done;
};

/* ---------- v1.3 小游戏 ②：黑话连连看 ---------- */`;
if (!s.includes('/* ---------- v1.3 小游戏 ②：黑话连连看 ---------- */')) { console.error('jargon anchor not found'); process.exit(1); }
s = s.replace('/* ---------- v1.3 小游戏 ②：黑话连连看 ---------- */', dgCode);

// ===== 4. share 场景加皮肤循环 =====
{
  const boxAnchor = "  G.$('#shareBox').appendChild(cv);";
  if (!s.includes(boxAnchor)) { console.error('shareBox anchor not found'); process.exit(1); }
  var skinCode = boxAnchor + "\n" +
    "  var skins = ['paper', 'obituary', 'doc'];\n" +
    "  var skinNames = ['纸面', '讣告', '红头文件'];\n" +
    "  var skinIdx = 0;\n" +
    "  var skinBtn = document.createElement('button');\n" +
    "  skinBtn.className = 'btn small center';\n" +
    "  skinBtn.style.marginTop = '6px';\n" +
    "  skinBtn.style.width = 'auto';\n" +
    "  skinBtn.textContent = '皮肤：纸面';\n" +
    "  G.$('#shareBox').after(skinBtn);\n" +
    "  skinBtn.onclick = function() {\n" +
    "    skinIdx = (skinIdx + 1) % skins.length;\n" +
    "    skinBtn.textContent = '皮肤：' + skinNames[skinIdx];\n" +
    "    drawShare(cv, { e: e, q: q, S: S, pc: pc }, skins[skinIdx]);\n" +
    "  };\n" +
    "  drawShare(cv, { e: e, q: q, S: S, pc: pc }, skins[0]);";
  s = s.replace(boxAnchor, skinCode);
}

fs.writeFileSync(f, s);
console.log('engine.js v1.17 patched');
