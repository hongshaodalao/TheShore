// main.js —— 启动、标题页、存档、成就、音效
window.G = window.G || {};

/* ---------- 持久化 ---------- */
var KEY_SAVE = 'shangan_save', KEY_ACH = 'shangan_ach', KEY_META = 'shangan_meta', KEY_MUTE = 'shangan_mute';
var KEY_LINE = 'shangan_line', KEY_ESEEN = 'shangan_end';

G.execIdx = 0;
G.achAll = new Set();
try { (JSON.parse(localStorage.getItem(KEY_ACH) || '[]')).forEach(id => G.achAll.add(id)); } catch (e) {}
G.meta = { runs: 0, lastEnding: '' };
try { G.meta = Object.assign(G.meta, JSON.parse(localStorage.getItem(KEY_META) || '{}')); } catch (e) {}
G.lineage = [];
try { G.lineage = JSON.parse(localStorage.getItem(KEY_LINE) || '[]') || []; } catch (e) {}
G.endSeen = [];
try { G.endSeen = JSON.parse(localStorage.getItem(KEY_ESEEN) || '[]') || []; } catch (e) {}
G.muted = false;
try { G.muted = localStorage.getItem(KEY_MUTE) === '1'; } catch (e) {}

G.storeAch = function () { try { localStorage.setItem(KEY_ACH, JSON.stringify([...G.achAll])); } catch (e) {} };
G.storeMeta = function () { try { localStorage.setItem(KEY_META, JSON.stringify(G.meta)); } catch (e) {} };
G.storeLineage = function () { try { localStorage.setItem(KEY_LINE, JSON.stringify(G.lineage)); } catch (e) {} };
G.storeEndSeen = function () { try { localStorage.setItem(KEY_ESEEN, JSON.stringify(G.endSeen)); } catch (e) {} };

G.save = function () {
  if (!G.S) return;
  try {
    const o = JSON.parse(JSON.stringify(G.S));
    o.qi = G.execIdx;            // 恢复点 = 正在执行的节拍
    o.rngState = G.rngState;
    localStorage.setItem(KEY_SAVE, JSON.stringify(o));
  } catch (e) {}
};
G.loadSave = function () {
  try {
    const t = localStorage.getItem(KEY_SAVE);
    if (!t) return null;
    const o = JSON.parse(t);
    if (o && o.v === 1 && o.Q && o.Q.length) return o;
  } catch (e) {}
  return null;
};
G.clearSave = function () { try { localStorage.removeItem(KEY_SAVE); } catch (e) {} };

/* ---------- 音效（WebAudio 合成，零资源） ---------- */
G.sfx = (function () {
  let ctx = null;
  function ac() {
    if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, dur, type, vol, delay) {
    if (G.muted) return;
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.value = f;
    g.gain.value = 0;
    const t0 = c.currentTime + (delay || 0);
    g.gain.linearRampToValueAtTime(vol || 0.12, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  return {
    click() { tone(660, 0.06, 'square', 0.06); },
    ok() { tone(660, 0.08, 'sine', 0.09); tone(990, 0.1, 'sine', 0.09, 0.07); },
    no() { tone(196, 0.16, 'sawtooth', 0.07); },
    blip() { tone(1180, 0.03, 'sine', 0.03); },
    heart() { tone(58, 0.14, 'sine', 0.3); tone(52, 0.16, 'sine', 0.3, 0.24); },
    ach() { tone(880, 0.1, 'sine', 0.09); tone(1174, 0.12, 'sine', 0.09, 0.1); tone(1568, 0.16, 'sine', 0.09, 0.22); }
  };
})();
document.addEventListener('pointerdown', () => { try { G.sfx.click(); } catch (e) {} }, { once: true });

/* ---------- 恢复 / 新开 ---------- */
G.resumeRun = function () {
  const S = G.S;
  if (G.execIdx >= S.Q.length) { G.toTitle(); return; }
  S.qi = G.execIdx + 1;
  const b = S.Q[G.execIdx];
  G.execBeat(b);
};
G.continueRun = function () {
  const o = G.loadSave();
  if (!o) { G.toTitle(); return; }
  G.S = o;
  G.rngState = o.rngState || 1;
  G.execIdx = o.qi || 0;
  G.glossed = {};
  G.hud();
  G.resumeRun();
};

/* ---------- 标题页 ---------- */
G.toTitle = function () {
  G.S = null;
  G.$('#app').classList.remove('extra');
  G.$('#hud').style.display = '';
  G.$('#hud').innerHTML = '';
  G.$('#wm').textContent = '';
  const save = G.loadSave();
  G.show(
    '<div class="title-wrap" style="width:100%">' +
    '<div class="seal">上岸</div>' +
    '<div class="title-name">上　岸</div>' +
    '<div class="title-sub">The Shore · 一个关于优绩主义的讽刺模拟</div>' +
    '<div class="title-tag">你以为你在<em>上岸</em>，<br>其实你在划向<em>更深的海</em>。</div>' +
    '<div class="title-actions">' +
    (save ? '<button class="btn primary center" id="t-cont">继续上一世（第 ' + save.run + ' 世）</button>' : '') +
    '<button class="btn' + (save ? '' : ' primary') + ' center" id="t-new">出生抽卡 · 开始</button>' +
    '<button class="btn center" id="t-daily">每日一签（' + todayStr() + '）</button>' +
    '<button class="btn center" id="t-ach">成就图鉴（' + G.achAll.size + ' / ' + window.ACH.length + '）</button>' +
    '<button class="btn center" id="t-line">世系树 · 结局图鉴（' + G.lineage.length + ' 世 / ' + G.endSeen.length + ' 结局）</button>' +
    (G.meta.runs > 0 ? '<button class="btn center" id="t-extra">番外：妈妈的手机</button>' : '') +
    (G.endSeen.filter(id => id !== 'admin').length >= Object.keys(window.ENDINGS).length - 1
      ? '<button class="btn center" id="t-admin" style="border-color:var(--gold);color:var(--gold);font-weight:700">？？？？（管理员权限）</button>' : '') +
    '</div>' +
    '<div class="tiny-links"><a id="t-mute">音效：' + (G.muted ? '关' : '开') + '</a>' +
    (save ? '<a id="t-clear">清除存档</a>' : '') + '</div>' +
    '<div class="disclaimer">本作品为虚构讽刺作品，影射社会现象；其中人物、机构、地名、数据均为虚构或化名，' +
    '不针对任何真实个人与组织。如与真实世界雷同，那不是巧合，是问题。</div>' +
    (G.meta.runs ? '<div class="gacha-note" style="text-align:center">累计重生 ' + G.meta.runs + ' 世</div>' : '') +
    '</div>', { center: true });

  G.$('#t-new').onclick = () => {
    G.clearSave();
    G.meta.runs++; G.storeMeta();
    G.newRun({ run: 1 });
  };
  if (save) {
    G.$('#t-cont').onclick = () => G.continueRun();
    G.$('#t-clear').onclick = () => {
      if (confirm('清除存档？这一世的人生将无法找回。')) { G.clearSave(); G.toTitle(); }
    };
  }
  G.$('#t-ach').onclick = achGallery;
  G.$('#t-line').onclick = lineageGallery;
  G.$('#t-daily').onclick = () => {
    G.clearSave();
    G.meta.runs++; G.storeMeta();
    G.newRun({ run: 1, seed: parseInt(todayStr(), 10), daily: todayStr() });
  };
  if (G.meta.runs > 0) G.$('#t-extra').onclick = playExtra;
  const tAdmin = G.$('#t-admin');
  if (tAdmin) tAdmin.onclick = () => G.SCENES.admin(null, G.toTitle);
  G.$('#t-mute').onclick = () => {
    G.muted = !G.muted;
    try { localStorage.setItem(KEY_MUTE, G.muted ? '1' : '0'); } catch (e) {}
    G.toTitle();
  };
};

/* ---------- 成就图鉴 ---------- */
function achGallery() {
  G.show(
    '<div style="max-width:360px;margin:0 auto">' +
    '<div class="report-cap">成 就 图 鉴</div>' +
    '<div class="achgrid">' +
    window.ACH.map(a => {
      const got = G.achAll.has(a.id);
      return '<div class="ach ' + (got ? 'unlocked' : 'locked') + '"><b>' + a.name + '</b>' + a.desc + '</div>';
    }).join('') +
    '</div><div style="height:16px"></div>' +
    '<button class="btn primary center" id="ag-back">返回 ▸</button></div>', {});
  G.$('#ag-back').onclick = G.toTitle;
}
G.achGallery = achGallery;

/* ---------- 世系树 · 结局图鉴 ---------- */
function lineageGallery() {
  var tree;
  if (!G.lineage.length) {
    tree = '<div class="gacha-note" style="text-align:center;padding:20px 0">还没有任何一世走完。<br>先去过一遍人生，再来认领你的血脉。</div>';
  } else {
    var catOf = function(k) {
      if (['tianxuan','jixiaoA','mingxing','shixi','anshang','baishoutao'].indexOf(k) >= 0) return 'win';
      if (['linghuo','an','liushui','dagong'].indexOf(k) >= 0) return 'fall';
      if (['tuisai','tangping','chuzou','chutan','fankang'].indexOf(k) >= 0) return 'quit';
      return 'mid';
    };
    var glyphOf = function(c) { return c === 'win' ? '冠' : c === 'fall' ? '沉' : c === 'quit' ? '隐' : '渡'; };
    tree = '<div class="lineage">' + G.lineage.map((g, i) => {
      const e = window.ENDINGS[g.ending] || { name: g.ending, quote: '' };
      const next = G.lineage[i + 1];
      const cat = catOf(g.ending);
      return '<div class="gen"><div class="gen-head"><div class="gen-avatar ' + cat + '">' + glyphOf(cat) + '</div>' +
        '<div><div class="gen-run">第 ' + g.run + ' 世 · #' + Number(g.seed).toString(16).toUpperCase() + '</div>' +
        '<div class="gen-fam">' + g.fam + (g.inh ? '（继承：' + g.inh + '）' : '') + '</div></div></div>' +
        '<div class="gen-end">结局「<b>' + e.name + '</b>」</div>' +
        '<div class="gen-quote">“' + e.quote + '”</div>' +
        '</div>' + (next ? '<div class="gen-arrow">↓ 遗产流向下一代' +
          (next.inh ? '：' + next.inh : '') + '</div>' : '');
    }).join('') + '</div>' +
      '<div class="gacha-note" style="text-align:center;margin-top:6px">冠=赢家系 · 沉=坠落系 · 隐=退赛系 · 渡=摆渡系<br>每一世都没有白活。</div>';
  }
  const gal = '<div class="report-cap" style="margin-top:20px">结 局 图 鉴</div>' +
    '<div class="achgrid">' + Object.keys(window.ENDINGS).map(k => {
      const e = window.ENDINGS[k], seen = G.endSeen.includes(k);
      return '<div class="ach ' + (seen ? 'unlocked' : 'locked') + '"><b>' +
        (seen ? e.name : '？？？') + '</b>' + (seen ? e.quote : '尚未发生') + '</div>';
    }).join('') + '</div>';
  G.show('<div style="max-width:360px;margin:0 auto">' +
    '<div class="report-cap">世 系 树</div>' + tree + gal +
    '<div style="height:16px"></div>' +
    '<button class="btn primary center" id="lg-back">返回 ▸</button></div>', {});
  G.$('#lg-back').onclick = G.toTitle;
}
G.lineageGallery = lineageGallery;

/* ---------- 每日一签：当日日期串 ---------- */
function todayStr() {
  const d = new Date();
  return d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
}

/* ---------- 番外：《妈妈的手机》（独立运行器，不触碰主线存档） ---------- */
function playExtra() {
  G.$('#app').classList.add('extra');
  G.$('#hud').style.display = 'none';
  G.$('#wm').textContent = '番外 · 妈妈的手机';
  let i = 0;
  function card(beat, next) {
    const sc = G.show(
      '<div class="cardbox"><span class="app-chip">' + beat.app + '</span>' +
      '<div class="card-title">' + beat.title + '</div>' +
      '<div class="card-who">来自：' + beat.who + '</div>' +
      '<div class="card-text">' + G.jargonify(beat.text) + '</div>' +
      '<div class="choices">' + beat.ch.map((c, k) =>
        '<button class="btn" data-k="' + k + '">' + c.label + '</button>').join('') +
      '</div></div>', {});
    sc.querySelectorAll('.choices .btn').forEach(btn => {
      btn.onclick = () => {
        const c = beat.ch[+btn.dataset.k];
        try { G.sfx && G.sfx.click(); } catch (e) {}
        sc.querySelector('.card-text').insertAdjacentHTML('afterend',
          '<div class="reply">' + G.jargonify(c.reply) + '</div>');
        sc.querySelector('.choices').innerHTML = '<button class="btn primary center">继续 ▸</button>';
        sc.querySelector('.choices .btn').onclick = next;
      };
    });
  }
  function step() {
    if (i < C.extraIntro.length) {
      G.cine(C.extraIntro, 'dark', () => { i = C.extraIntro.length; step(); });
      i = C.extraIntro.length; // cine 一次性播完整个 intro 队列
      return;
    }
    const ci = i - C.extraIntro.length;
    if (ci < C.extra.length) {
      card(C.extra[ci], () => { i++; step(); });
      return;
    }
    G.cine(C.extraOutro, 'dark', () => {
      G.show(
        '<div class="endcard"><div class="end-cap">番 外 · 完</div>' +
        '<div class="end-name" style="font-size:32px">妈妈的手机</div>' +
        '<div class="end-quote">“她没有抽卡界面。<br>她把自己活成了你的初始参数。”</div>' +
        '<div class="end-flavor">回到标题，再抽一次的时候，<br>记得你手里这张卡，是谁攒的。</div>' +
        '<div class="choices" style="max-width:260px;margin:0 auto">' +
        '<button class="btn primary center" id="ex-back">回到标题 ▸</button></div></div>', { center: true });
      G.$('#ex-back').onclick = G.toTitle;
    });
  }
  step();
}
G.playExtra = playExtra;

/* ---------- 启动 ---------- */
window.addEventListener('load', () => { G.toTitle(); });
