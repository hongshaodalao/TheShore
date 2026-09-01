// 一次性脚本：重写 SCENES.schedule 为三线分支版
const fs = require('fs');
const f = 'js/engine.js';
let s = fs.readFileSync(f, 'utf8');
const start = s.indexOf('G.SCENES.schedule = function (b, done) {');
const endMarker = '/* ---------- v1.3 小游戏 ②：黑话连连看 ---------- */';
const end = s.indexOf(endMarker);
if (start < 0 || end < 0) { console.error('anchors missing'); process.exit(1); }

const block = `/* ---------- v1.14：时间分配谜题（三线分化） ---------- */
G.SCENES.schedule = function (b, done) {
  const S = G.S;
  const fam = S.fam;
  if (fam === 'roma') { G.SCENES.scheduleRoma(b, done); return; }
  if (fam === 'mid') { G.SCENES.scheduleMid(b, done); return; }

  // ==== 小镇：原版 29h 无解 ====
  if (!S.sched) {
    S.sched = { v: C.schedule.map(r => r.min), warn: '' };
    G.save();
  }
  const SC = S.sched;
  const total = () => SC.v.reduce((a, b) => a + b, 0);
  function render() {
    const t = total();
    const cells = [];
    for (let i = 0; i < Math.max(24, t); i++) {
      cells.push('<i class="' + (i < 24 ? 'f' : 'of') + '"></i>');
    }
    G.show(
      '<div style="max-width:360px;margin:0 auto">' +
      '<div class="hint-top">高三 · 最后一张时间表</div>' +
      '<div class="card-title">把一天排出来</div>' +
      '<div class="zy-note">每项都有人替你规定了最低时长。格子只有 24 个。</div>' +
      '<div class="slotbar">' + cells.join('') + '</div>' +
      '<div class="sched-total' + (t > 24 ? ' over' : t === 24 ? ' ok' : '') + '">已分配 ' + t + ' / 24' +
      (t > 24 ? '<span class="warn">　超了 ' + (t - 24) + ' 小时</span>' : '') + '</div>' +
      (SC.warn ? '<div class="sched-warn">⚠ ' + SC.warn + '</div>' : '') +
      C.schedule.map((r, i) =>
        '<div class="sched-row' + (SC.v[i] < r.min ? ' cut' : '') + '">' +
        '<span class="sr-name">' + r.name + '<small>　' + r.voice + '：至少 ' + r.min + 'h</small></span>' +
        '<span class="sr-step">' +
        '<button class="step-btn" data-i="' + i + '" data-d="-1">−</button>' +
        '<b>' + SC.v[i] + '</b>' +
        '<button class="step-btn" data-i="' + i + '" data-d="1">＋</button></span></div>').join('') +
      '<div class="choices"><button class="btn primary center" id="sc-sub" ' + (t === 24 ? '' : 'disabled') + '>提交这张时间表 ▸</button></div>' +
      (t !== 24 ? '<div class="gacha-note" style="text-align:center">必须恰好分满 24 小时才能提交。</div>' : '') +
      '</div>', {});
    G.$('#scene').querySelectorAll('.step-btn').forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.i, d = +btn.dataset.d;
        if (SC.v[i] + d < 0 || SC.v[i] + d > 14) return;
        SC.v[i] += d;
        SC.warn = SC.v[i] < C.schedule[i].min ? (C.schedule[i].voice + '：' + C.schedule[i].warn) : '';
        try { G.sfx && G.sfx.click(); } catch (e) {}
        G.save();
        render();
      };
    });
    const sub = G.$('#sc-sub');
    if (sub) sub.onclick = () => finish();
  }
  function finish() {
    const cuts = C.schedule.map((r, i) => ({ r, cut: r.min - S.sched.v[i] })).filter(x => x.cut > 0);
    const cutLine = {
      '医生': '医生说睡不够会猝死。那是十年后的事。',
      '妈妈': '妈妈说钱都交了。妈妈没说不能砍。',
      '班主任': '班主任说都这么过来的。没人问你是怎么过来的。',
      '学校': '学校说旷课要请家长。家长说他们也没办法。',
      '现实': '现实说路不会变短。',
      '生存': '生存说人要吃饭。生存没说活干不完。'
    };
    const lines = cuts.map(x => ({ t: '你砍掉了【' + x.r.name + '】' + x.cut + ' 小时。（' + (cutLine[x.r.voice] || '') + '）' }));
    lines.push({ t: '你提交了这张时间表。' });
    lines.push({ t: '这 道 题 无 解', big: 1 });
    lines.push({ t: '最低配置加起来是 29 小时，而你只有 24。' });
    lines.push({ t: '出题的人知道。他们只是想看你砍哪一块。' });
    lines.push({ t: '从小学三年级到高三，你每天都在解这道题。', small: 1 });
    G.applyFx({ health: -5, mood: -8 });
    G.cine(lines, 'red', done);
  }
  render();
};

/* ---------- v1.14：罗马《空日历》——不是不够，是填不满 ---------- */
G.SCENES.scheduleRoma = function (b, done) {
  const S = G.S;
  const D = C.scheduleRoma;
  if (!S.schedR) {
    S.schedR = { v: D.required.map(r => r.min).concat(D.options.map(o => 0)), warn: '' };
    G.save();
  }
  const R = S.schedR;
  const items = D.required.map(r => ({ ...r, req: true })).concat(D.options.map(o => ({ ...o, req: false })));
  const total = () => R.v.reduce((a, b) => a + b, 0);
  let resumeTag = 0;
  function render() {
    const t = total();
    const cells = [];
    for (let i = 0; i < 24; i++) cells.push('<i class="' + (i < t ? 'f' : '') + '"></i>');
    for (let i = 24; i < t; i++) cells.push('<i class="of"></i>');
    G.show(
      '<div style="max-width:360px;margin:0 auto">' +
      '<div class="hint-top">高二 · 你的日历</div>' +
      '<div class="card-title">把一年排出来</div>' +
      '<div class="zy-note">必要项只占 11 格。剩下 13 格是空的——用下面的可选项填满它。</div>' +
      '<div class="slotbar">' + cells.join('') + '</div>' +
      '<div class="sched-total' + (t > 24 ? ' over' : t === 24 ? ' ok' : '') + '">已填 ' + t + ' / 24' +
      (t < 24 ? '<span style="color:#b8860b">　空着 ' + (24 - t) + ' 格</span>' : '') + '</div>' +
      (R.warn ? '<div class="sched-warn">⚠ ' + R.warn + '</div>' : '') +
      '<div class="zy-note" style="color:var(--redd);font-weight:700">—— 必要项 ——</div>' +
      D.required.map((r, i) =>
        '<div class="sched-row"><span class="sr-name">' + r.name + '<small>　' + r.voice + '</small></span>' +
        '<b>' + R.v[i] + '</b></div>').join('') +
      '<div class="zy-note" style="color:var(--ink2);margin-top:8px">—— 可选项（填满空白）——</div>' +
      D.options.map((o, k) => {
        const i = D.required.length + k;
        return '<div class="sched-row' + (R.v[i] > 0 ? ' cut' : '') + '" style="border-style:dotted">' +
        '<span class="sr-name">' + o.name + '<small>　' + o.voice + '</small></span>' +
        '<span class="sr-step">' +
        '<button class="step-btn" data-i="' + i + '" data-d="-1">−</button>' +
        '<b>' + R.v[i] + '</b>' +
        '<button class="step-btn" data-i="' + i + '" data-d="1">＋</button></span></div>';
      }).join('') +
      '<div class="choices"><button class="btn primary center" id="sc-sub" ' + (t === 24 ? '' : 'disabled') + '>提交这份日历 ▸</button></div>' +
      (t !== 24 ? '<div class="gacha-note" style="text-align:center">空着的日子没法见人——填满才能提交。</div>' : '') +
      '</div>', {});
    G.$('#scene').querySelectorAll('.step-btn').forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.i, d = +btn.dataset.d;
        if (R.v[i] + d < 0 || R.v[i] + d > 10) return;
        R.v[i] += d;
        const item = items[i];
        R.warn = d > 0 && item.warn ? item.voice + '：“' + item.warn + '”' : '';
        try { G.sfx && G.sfx.click(); } catch (e) {}
        G.save();
        render();
      };
    });
    const sub = G.$('#sc-sub');
    if (sub) sub.onclick = () => {
      // 按可选项的 tag 统计填充类型
      let resume = 0, life = 0;
      D.options.forEach((o, k) => {
        const v = R.v[D.required.length + k];
        if (o.tag === 'resume') resume += v; else life += v;
      });
      finish(resume, life);
    };
  }
  function finish(resume, life) {
    let lines, fx;
    if (resume > life) {
      fx = { vis: 3, mood: -3 };
      lines = [
        { t: '你把 13 格空白填满了：管理游戏、公益履历、兴趣班——全是"有用"的。' },
        { t: '你的日历好看得像一份简历。', big: 1 },
        { t: '小镇的题是无解，你的题是无题。', big: 1 },
        { t: '他们砍到只剩睡眠，你填什么都觉得空。', small: 1 }
      ];
    } else {
      fx = { mood: 3 };
      lines = [
        { t: '你把 13 格空白填满了：闲书、发呆、一门用不上的手艺——全是"没用"的。' },
        { t: '家族群里有人说你"开始不上进了"。', big: 1 },
        { t: '小镇的题是无解，你的题是无题。', big: 1 },
        { t: '他们砍到只剩睡眠，你填什么都觉得空——但至少，你填的是自己的。', small: 1 }
      ];
    }
    G.applyFx(fx);
    G.cine(lines, 'paper', done);
  }
  render();
};

/* ---------- v1.14：中产《两份账单》——钱和时间里挑一样放弃 ---------- */
G.SCENES.scheduleMid = function (b, done) {
  const S = G.S;
  const M = C.scheduleMid;
  if (!S.schedM) {
    S.schedM = { v: M.map(r => r.min), warn: '', redeemed: 0, redeemedIdx: -1 };
    G.save();
  }
  const MD = S.schedM;
  const total = () => MD.v.reduce((a, b) => a + b, 0);
  function render() {
    const t = total();
    const cells = [];
    for (let i = 0; i < Math.max(24, t); i++) cells.push('<i class="' + (i < 24 ? 'f' : 'of') + '"></i>');
    G.show(
      '<div style="max-width:360px;margin:0 auto">' +
      '<div class="hint-top">高三 · 最后一张时间表</div>' +
      '<div class="card-title">两份账单，抢 24 格</div>' +
      '<div class="zy-note">小镇的表上，每项只有一种价格。你的表上，每项都有两份账单：一份用钱付，一份用时间付。</div>' +
      '<div class="slotbar">' + cells.join('') + '</div>' +
      '<div class="sched-total' + (t > 24 ? ' over' : t === 24 ? ' ok' : '') + '">已分配 ' + t + ' / 24' +
      (t > 24 ? '<span class="warn">　超了 ' + (t - 24) + ' 小时</span>' : '') + '</div>' +
      (MD.warn ? '<div class="sched-warn">⚠ ' + MD.warn + '</div>' : '') +
      M.map((r, i) =>
        '<div class="sched-row' + (MD.v[i] < r.min ? ' cut' : '') + '">' +
        '<span class="sr-name">' + r.name +
        (r.altName ? '<small>　两份账单：' + r.min + 'h（' + (r.altName || '现状') + '）/ ' + r.altMin + 'h（' + (r.altName || '') + '）</small>' : '<small>　' + r.voice + '：至少 ' + r.min + 'h</small>') +
        '</span>' +
        '<span class="sr-step">' +
        '<button class="step-btn" data-i="' + i + '" data-d="-1">−</button>' +
        '<b>' + MD.v[i] + '</b>' +
        '<button class="step-btn" data-i="' + i + '" data-d="1">＋</button></span></div>').join('') +
      (MD.redeemed === 0 && total() > 24 ? '<div class="lucky-link"><a id="md-redeem">花 5 万，把砍掉的一项买回来 →</a></div>' : '') +
      (MD.redeemed > 0 ? '<div class="gacha-note" style="text-align:center">已用赎回：1 次（¥50000）。钱能买回格子，买不回 24 的总量。</div>' : '') +
      '<div class="choices"><button class="btn primary center" id="sc-sub" ' + (t === 24 ? '' : 'disabled') + '>提交这张时间表 ▸</button></div>' +
      (t !== 24 ? '<div class="gacha-note" style="text-align:center">必须恰好分满 24 小时才能提交。</div>' : '') +
      '</div>', {});
    G.$('#scene').querySelectorAll('.step-btn').forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.i, d = +btn.dataset.d;
        if (MD.v[i] + d < 0 || MD.v[i] + d > 14) return;
        // 赎回保护：已赎回的项不能再被砍
        if (d < 0 && i === MD.redeemedIdx) { MD.warn = '这项你已经花钱买回来了。'; render(); return; }
        MD.v[i] += d;
        MD.warn = MD.v[i] < M[i].min ? (M[i].voice + '：' + M[i].warn) : '';
        try { G.sfx && G.sfx.click(); } catch (e) {}
        G.save();
        render();
      };
    });
    const redeem = G.$('#md-redeem');
    if (redeem) redeem.onclick = () => {
      // 找被砍最狠的一项买回来
      let worst = -1, worstCut = 0;
      M.forEach((r, i) => {
        const cut = r.min - MD.v[i];
        if (cut > worstCut) { worstCut = cut; worst = i; }
      });
      if (worst >= 0 && worstCut > 0) {
        MD.v[worst] += worstCut;
        MD.redeemed = 1;
        MD.redeemedIdx = worst;
        MD.warn = '钱到账。' + M[worst].name + ' 买回来了——从别处再砍吧。';
        G.applyFx({ money: -5 });
        try { G.sfx && G.sfx.ok(); } catch (e) {}
        G.save();
        render();
      }
    };
    const sub = G.$('#sc-sub');
    if (sub) sub.onclick = () => finish();
  }
  function finish() {
    const cuts = M.map((r, i) => ({ r, cut: r.min - MD.v[i] })).filter(x => x.cut > 0);
    const cutLine = {
      '医生': '医生说睡不够会猝死。那是十年后的事。',
      '妈妈': '妈妈说机构效率高。妈妈自己盯了两年，白头发多了很多。',
      '班主任': '班主任说都这么过来的。',
      '学校': '学校说旷课要请家长。',
      '房价': '房价说郊区的时间是免费的。免费的最贵。',
      '生存': '生存说人要吃饭。'
    };
    const lines = cuts.map(x => ({ t: '你砍掉了【' + x.r.name + '】' + x.cut + ' 小时。（' + (cutLine[x.r.voice] || '') + '）' }));
    if (MD.redeemed > 0) lines.push({ t: '你还花了 5 万赎回过一项。钱花出去的那一刻，你终于懂了：这题的无解，是能标价的。' });
    lines.push({ t: '这 道 题 无 解', big: 1 });
    lines.push({ t: '小镇在时间里挣扎，你在钱和时间里挑一样放弃。' });
    lines.push({ t: '你们砍的都是睡眠——只是你砍之前，先算了一笔账。', small: 1 });
    G.applyFx({ health: -5, mood: MD.redeemed > 0 ? -10 : -8 });
    G.cine(lines, 'red', done);
  }
  render();
};

`;
s = s.slice(0, start) + block + s.slice(end);
fs.writeFileSync(f, s);
console.log('schedule scenes rewritten');
