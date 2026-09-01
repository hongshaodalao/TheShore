// ui.js —— 渲染基元
window.G = window.G || {};
G.$ = s => document.querySelector(s);

/* ---------- 场景容器 ---------- */
// opts: {bleed 覆盖HUD, center 垂直居中, noscroll}
G.show = function (html, opts) {
  opts = opts || {};
  const app = G.$('#app');
  app.classList.toggle('bleed', !!opts.bleed);
  let sc = G.$('#scene');
  if (!sc) {
    sc = document.createElement('div');
    sc.id = 'scene';
    app.insertBefore(sc, G.$('#toasts'));
  }
  sc.className = 'scene' + (opts.center ? ' center' : '') + (opts.noscroll ? ' noscroll' : '') +
    (opts.cls ? ' ' + opts.cls : '');
  sc.style.cssText = opts.bleed ? 'position:absolute;inset:0;z-index:30;' : '';
  sc.innerHTML = html;
  return sc;
};

/* ---------- HUD ---------- */
G.hud = function () {
  const S = G.S; if (!S) return;
  const a = S.attrs, h = S.hid;
  const cl = v => v <= 30 ? ' warn' : '';
  const sigN = Math.max(1, Math.min(4, Math.ceil(h.G / 25)));
  const sig = [0, 1, 2, 3].map(i => '<i class="' + (i < sigN ? 'on' : '') + '"></i>').join('');
  const batt = '<span class="batt"><i style="width:' + a.health + '%"></i></span>';
  G.$('#hud').innerHTML =
    chip('年龄', a.age) +
    chip('学历', C.eduName[a.edu] || '——') +
    chip('技能', a.skill) +
    chip('存款', a.money + 'w') +
    '<span class="chip' + cl(a.health) + '">电量' + batt + '<b>' + a.health + '%</b></span>' +
    '<span class="chip">心态<b>' + a.mood + '</b></span>' +
    '<span class="chip">绩点<b>' + (S.uniGpa == null ? '——' : (1.1 + S.hid.R * 0.01 + S.uniGpa).toFixed(1)) + '</b></span>' +
    '<span class="chip mut">资源<b>？？</b></span>' +
    '<span class="chip">信号<span class="sig">' + sig + '</span></span>' +
    '<span class="chip">户籍<b>' + (S.provSeen ? h.D.name : '？？') + '</b></span>';
  G.$('#wm').textContent = '第 ' + S.run + ' 世 · #' + String(S.seed.toString(16)).toUpperCase();
  function chip(k, v) { return '<span class="chip">' + k + '<b>' + v + '</b></span>'; }
};

/* ---------- Toast / 成就 ---------- */
G.toast = function (msg, cls, dur) {
  const t = document.createElement('div');
  t.className = 'toast' + (cls ? ' ' + cls : '');
  t.innerHTML = msg;
  G.$('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; }, dur || 2200);
  setTimeout(() => t.remove(), (dur || 2200) + 450);
};
G.unlockAch = function (id) {
  const a = window.ACH.find(x => x.id === id);
  if (!a || G.achAll.has(id)) return;
  G.achAll.add(id);
  G.storeAch();
  G.toast('成就解锁 <b>「' + a.name + '」</b>', 'ach', 2600);
  try { G.sfx && G.sfx.ach(); } catch (e) {}
};

/* ---------- 黑话翻译器 ---------- */
G.glossed = {}; // 本局已弹过的词
G.jargonify = function (text) {
  const terms = (window.GLOSSARY || []).slice().sort((x, y) => y.t.length - x.t.length);
  let out = text, hit = null;
  terms.forEach(g => {
    if (out.indexOf(g.t) === -1) return;
    out = out.split(g.t).join('<span class="jargon" data-t="' + g.t + '">' + g.t + '</span>');
    if (!hit) hit = g;
  });
  // 本局第一次出现 → 自动弹一次翻译
  if (hit && !G.glossed[hit.t]) {
    G.glossed[hit.t] = 1;
    setTimeout(() => G.popTerm(hit.t), 700);
  }
  return out;
};
G.popTerm = function (t) {
  const g = (window.GLOSSARY || []).find(x => x.t === t);
  if (!g) return;
  const old = G.$('.popmask'); if (old) old.remove();
  const m = document.createElement('div');
  m.className = 'popmask';
  m.innerHTML = '<div class="pop"><div class="pop-t">话术翻译器 · 系统内置</div>' +
    '<div class="pop-w">' + g.t + '</div><div class="pop-r">＝ ' + g.r + '</div>' +
    '<button class="btn primary center">知道了</button></div>';
  m.onclick = e => { if (e.target === m || e.target.tagName === 'BUTTON') m.remove(); };
  G.$('#app').appendChild(m);
};
document.addEventListener('click', e => {
  const j = e.target.closest && e.target.closest('.jargon');
  if (j) G.popTerm(j.dataset.t);
});

/* ---------- 事件卡 ---------- */
G.card = function (beat, onDone) {
  const sc = G.show(
    '<div class="cardbox">' +
    '<span class="app-chip">' + (beat.app || '通知') + '</span>' +
    '<div class="card-title">' + beat.title + '</div>' +
    '<div class="card-who">' + (beat.who ? '来自：' + beat.who : '') + '</div>' +
    '<div class="card-text">' + G.jargonify(beat.text) + '</div>' +
    '<div class="choices">' + beat.ch.map((c, i) =>
      '<button class="btn ch" data-i="' + i + '">' + c.label + '</button>').join('') +
    '</div></div>', {});
  G.hud();
  sc.querySelectorAll('.ch').forEach(btn => {
    btn.onclick = () => {
      const c = beat.ch[+btn.dataset.i];
      try { G.sfx && G.sfx.click(); } catch (e) {}
      G.applyChoice(c);
      sc.querySelector('.card-text').insertAdjacentHTML('afterend',
        '<div class="reply">' + G.jargonify(c.reply || '……') + '</div>');
      sc.querySelector('.choices').innerHTML = '<button class="btn primary center cont">继续 ▸</button>';
      sc.querySelector('.cont').onclick = onDone;
    };
  });
};

/* ---------- 新闻推送 ---------- */
G.newsBeat = function (id, onDone) {
  const n = C.news[id];
  const sc = G.show(
    '<div class="newsbox"><div class="news-top"><span class="news-tag">' + n.tag + '</span>' +
    '<span class="news-app">' + n.app + ' · 刚刚</span></div>' +
    '<div class="news-title">' + n.title + '</div>' +
    '<div class="news-body">' + n.body + '</div></div>' +
    '<div class="choices" style="max-width:340px;margin:0 auto">' +
    '<button class="btn primary center">放下手机 ▸</button></div>', { center: false });
  sc.querySelector('.btn').onclick = onDone;
};

/* ---------- 电影演出（点击逐行） ---------- */
G.cine = function (lines, style, onDone) {
  const sc = G.show('<div class="cine-hint">▸ 点击继续</div>',
    { bleed: true, noscroll: true, cls: 'cine ' + (style || 'paper') });
  const hint = sc.querySelector('.cine-hint');
  let i = 0;
  function next() {
    if (!sc.contains(hint)) { sc.onclick = null; return; } // 场景已被替换：处理器作废
    if (i >= lines.length) { sc.onclick = null; onDone && onDone(); return; }
    const L = lines[i++];
    const d = document.createElement('div');
    d.className = 'cline' + (L.big ? ' big' : '') + (L.small ? ' small' : '');
    d.innerHTML = G.jargonify(L.t);
    sc.insertBefore(d, hint);
    try { G.sfx && G.sfx.blip(); } catch (e) {}
  }
  sc.onclick = () => next();
  next();
};

/* ---------- 弹幕墙 ---------- */
G.dmWall = function (title, pools, n, onDone) {
  let pool = [];
  pools.forEach(p => { pool = pool.concat(window.DANMAKU[p] || []); });
  // v1.7：按当前出生混入 2–3 条偏移弹幕
  if (window.G.S && G.S.fam && window.DANMAKU['birth_' + G.S.fam]) {
    pool = pool.concat(window.DANMAKU['birth_' + G.S.fam]);
  }
  const sc = G.show(
    '<div class="dm-title">—— ' + title + ' ——</div>' +
    '<div class="dm-layer"></div>' +
    '<button class="btn primary center dm-continue">继续 ▸</button>',
    { bleed: true, noscroll: true, cls: 'dm-wrap' });
  const layer = sc.querySelector('.dm-layer');
  const used = [];
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      let txt;
      if (used.length < pool.length) {
        let t; do { t = pool[Math.floor(Math.random() * pool.length)]; } while (used.includes(t));
        used.push(t); txt = t;
      } else txt = pool[Math.floor(Math.random() * pool.length)];
      const d = document.createElement('div');
      d.className = 'dm-item';
      d.style.top = (4 + Math.random() * 82) + '%';
      d.style.fontSize = (12 + Math.random() * 7) + 'px';
      d.style.animationDuration = (5 + Math.random() * 5) + 's';
      d.textContent = txt;
      layer.appendChild(d);
      setTimeout(() => d.remove(), 10500);
    }, i * 300);
  }
  const cb = sc.querySelector('.dm-continue');
  setTimeout(() => { cb.style.opacity = '1'; }, 2300);
  cb.onclick = onDone;
};

/* ---------- 通用选项列表 ---------- */
G.opts = function (list, html, onDone) {
  const sc = G.show(html + '<div class="choices" style="max-width:340px;margin:16px auto 0">' +
    list.map((c, i) => '<button class="btn opt-b" data-i="' + i + '"' + (c.disabled ? ' disabled' : '') + '>' +
      c.label + '</button>').join('') +
    '</div>', {});
  sc.querySelectorAll('.opt-b').forEach(b => {
    b.onclick = () => {
      if (b.disabled) { G.toast('还差一点筹码。回去把证据凑齐。'); return; }
      try { G.sfx && G.sfx.click(); } catch (e) {}
      onDone(list[+b.dataset.i]);
    };
  });
  return sc;
};

/* ---------- 堆叠条渲染 ---------- */
G.stackbarHTML = function (q) {
  const pc = x => Math.round(x * 100);
  const b = pc(q.b), l = pc(q.l), c = pc(q.c), e = Math.max(0, 100 - b - l - c);
  return '<div class="stackbar">' +
    '<i class="sb-b" style="width:' + b + '%"></i>' +
    '<i class="sb-l" style="width:' + l + '%"></i>' +
    '<i class="sb-c" style="width:' + c + '%"></i>' +
    '<i class="sb-e" style="width:' + e + '%"></i></div>' +
    '<ul class="legend"><li class="k-b">出身 ' + b + '%</li><li class="k-l">运气 ' + l + '%</li>' +
    '<li class="k-c">选择 ' + c + '%</li><li class="k-e">努力 ' + e + '%</li></ul>';
};
