// engine.js —— 流程引擎与全部游戏场景
window.G = window.G || {};

/* ---------- 新局 ---------- */
G.newRun = function (opts) {
  opts = opts || {};
  const seed = opts.seed || (Date.now() % 2147483647 + 1);
  G.initRng(seed);
  G.S = {
    v: 1, seed: seed, run: opts.run || 1, lastEnding: opts.lastEnding || '',
    daily: opts.daily || '',
    qi: 0, Q: [],
    attrs: { edu: -1, skill: 30, money: 0, health: 70, mood: 60, score: 0, age: 6 },
    hid: { R: 0, G: 0, D: null, Dadj: 0, gender: '男' },
    flags: {}, counts: {}, work: { vis: 0, actual: 0, day: 0 },
    uniGpa: null,
    exam: {}, hr: {}, rider: null, kd: {}, lx: null, ev: null, bud: null,
    rolls: [], milestones: [], choicesLog: [],
    famDrawn: false, provSeen: false, endId: '', para: null, ch1res: null
  };
  G.glossed = {};
  G.buildRun();
  G.hud();
  G.runNext();
};

/* ---------- 队列构建（一次性把整局烘焙成可序列化的节拍） ---------- */
G.buildRun = function () {
  // v1.13：只烘焙序章抽卡；抽卡落定后由 buildChapters 按出生烘焙对应流程
  G.S.Q.push({ t: 'fn', id: 'gacha' });
};

/* ---------- v1.13：按出生烘焙章节（分线结构） ---------- */
G.buildChapters = function () {
  const S = G.S;
  if (!S || S.famDrawn !== true || S.Q.length > 1) return; // 仅在抽卡落定且未烘焙时
  const Q = S.Q;
  const clone = o => JSON.parse(JSON.stringify(o));
  const norm = b => {
    if (b.type === 'news') return { t: 'news', id: b.id };
    const o = clone(b); o.t = 'card'; delete o.type; return o;
  };
  G.norm = norm;
  if (S.fam === 'roma') { G.buildRoma(norm); return; }

  // ==== 小镇 / 中产：共享主干 ====
  Q.push({ t: 'cine', style: 'dark', lines: C.interludes.ch1 });
  Q.push({ t: 'fx', fx: { age: 12 } });
  Q.push({ t: 'news', id: 'sanSui' });
  const ch1 = clone(C.ch1);
  const pool = clone(C.ch1Pool);
  ch1.splice(2, 0, pool.shift());
  ch1.splice(8, 0, pool.shift());
  ch1.splice(13, 0, pool.shift());
  ch1.splice(16, 0, pool.shift());
  ch1.forEach(raw => Q.push(norm(raw)));
  Q.push({ t: 'dm', title: '网络舆论 · 教育版', pools: ['edu', 'general'], n: 12 });
  Q.push({ t: 'fn', id: 'schedule' });
  Q.push({ t: 'fn', id: 'rank' });
  Q.push(norm(C.tongzhuo.ch1));
  Q.push({ t: 'dm', title: '查分前夜 · 赛前弹幕', pools: ['exam'], n: 9 });
  // 第二章
  Q.push({ t: 'cine', style: 'dark', lines: C.interludes.ch2 });
  Q.push({ t: 'fx', fx: { age: 18 } });
  if (S.fam === 'mid') Q.push({ t: 'fn', id: 'track3' });
  Q.push({ t: 'fn', id: 'trackGate' });
  // 大学章（18→22 岁）
  Q.push({ t: 'cine', style: 'dark', lines: C.interludes.uni });
  Q.push({ t: 'fx', fx: { age: 19 } });
  Q.push({ t: 'fn', id: 'kzq' });
  Q.push({ t: 'news', id: 'kaoyan' });
  const uni = clone(C.uni);
  const unipool = clone(C.uniPool);
  uni.splice(5, 0, unipool.shift());
  uni.splice(9, 0, unipool.shift());
  uni.splice(12, 0, unipool.shift());
  uni.forEach(raw => Q.push(norm(raw)));
  Q.push({ t: 'dm', title: '校园墙 · 期末特别版', pools: ['uni'], n: 11 });
  Q.push(norm(C.tongzhuo.uni));
  Q.push({ t: 'fn', id: 'gradPath' });
  Q.push({ t: 'news', id: 'xiaozhen' });
  // 第三章
  Q.push({ t: 'cine', style: 'dark', lines: C.interludes.ch3 });
  Q.push({ t: 'fx', fx: { age: 23 } });
  Q.push({ t: 'news', id: 'biyesheng' });
  Q.push({ t: 'fn', id: 'hrA' });
  Q.push({ t: 'dm', title: '招聘软件评论区', pools: ['job'], n: 11 });
  Q.push({ t: 'fn', id: 'hrB' });
  Q.push(norm(C.tongzhuo.ch3));
  Q.push({
    t: 'cine', style: 'dark', lines: [
      { t: '第三章结束了。' },
      { t: '你终于看清了：', big: 1 },
      { t: '这里没有恶人，只有上一位失败者。', big: 1 },
      { t: '——而上一位失败者，也会这么看你。' }
    ]
  });
  // 第四章
  Q.push({ t: 'cine', style: 'dark', lines: C.interludes.ch4 });
  Q.push({ t: 'fx', fx: { age: 26 } });
  Q.push({
    t: 'cine', style: 'paper', lines: [
      { t: '22 岁，你入职了。' },
      { t: 'Offer 邮件写着：“欢迎加入星海集团，我们一起改变世界。”' },
      { t: '工牌照片里的你笑得很用力。' },
      { t: '没人告诉你，世界确实被改变了——从你的睡眠开始。' }
    ]
  });
  // 入职培训：黑话连连看
  Q.push({ t: 'fn', id: 'jargon' });
  // 职场事件池烘焙（固定 7 张 + 向上管理特写）
  const evs = [];
  const evpool = clone(C.ch4Pool).filter(e => e.type === 'card').map(norm);
  for (let i = 0; i < 7; i++) evs.push(evpool.splice(Math.floor(G.rng() * evpool.length), 1)[0]);
  Q.push({ t: 'fn', id: 'work', events: evs });
  // 相亲小章（婚姻市场：优绩主义的最后一条战线）
  Q.push({ t: 'cine', style: 'dark', lines: C.interludes.xq });
  Q.push({ t: 'fx', fx: { age: 30 } });
  Q.push({ t: 'news', id: 'xiangqin' });
  Q.push(norm(C.tongzhuo.ch4));
  const xq = clone(C.xq);
  xq.splice(3, 0, clone(C.xqPool)[Math.floor(G.rng() * C.xqPool.length)]);
  xq.forEach(raw => Q.push(norm(raw)));
  Q.push({ t: 'news', id: 'biye' });
  Q.push({ t: 'fn', id: 'layoffTalk' });
  G.finishQueue();
  G.applyBirthCards();
};

/* ---------- v1.13：罗马线烘焙（约 60 拍） ---------- */
G.buildRoma = function (norm) {
  const S = G.S, Q = S.Q;
  const pick = t => C.birthCards.roma.find(c => c.title === t);
  const pushCard = c => Q.push(norm({ type: 'card', app: c.app, who: c.who, title: c.title, text: c.text, ch: c.ch }));
  Q.push({ t: 'cine', style: 'dark', lines: C.interludesRoma.ch1 });
  Q.push({ t: 'fx', fx: { age: 12 } });
  // 教育段：国际部
  pushCard(C.roma.tzNote);           // 同桌纸条（罗马版）
  pushCard(pick('马术与夏令营'));
  pushCard(pick('母语者'));
  pushCard(pick('饭局'));
  Q.push({ t: 'fn', id: 'meeting' }); // 家族会议：本科去哪国
  Q.push({ t: 'cine', style: 'dark', lines: C.roma.apply });
  Q.push({ t: 'fn', id: 'schedule' }); // 罗马《空日历》：填满你的 13 格空白
  Q.push({ t: 'news', id: 'jiaban' });
  pushCard(pick('信托'));
  // 大学段
  Q.push({ t: 'cine', style: 'dark', lines: C.interludesRoma.uni });
  Q.push({ t: 'fx', fx: { age: 19 } });
  C.roma.uniCards.forEach(c => pushCard(c));
  Q.push({ t: 'dm', title: '校园墙 · 名校版', pools: ['roma', 'general'], n: 10 });
  Q.push(norm(C.tongzhuo.uni));
  // 工作段：内推幕
  Q.push({ t: 'cine', style: 'dark', lines: C.interludesRoma.ch3 });
  Q.push({ t: 'fx', fx: { age: 23 } });
  Q.push({ t: 'fn', id: 'offers' });
  pushCard(pick('自带滤镜'));
  pushCard(pick('一个电话'));
  pushCard(pick('从基层做起'));
  pushCard(pick('没有你'));
  Q.push({ t: 'dm', title: '朋友圈 · 同层', pools: ['roma'], n: 8 });
  // 轮岗段
  Q.push({ t: 'cine', style: 'dark', lines: C.interludesRoma.ch4 });
  Q.push({ t: 'fx', fx: { age: 26 } });
  Q.push({ t: 'news', id: 'jiaban' });
  C.roma.workCards.forEach(c => pushCard(c));
  pushCard(pick('联姻局'));
  pushCard(pick('代驾'));
  Q.push(norm(C.tongzhuo.ch4));
  // 危机 + 安排
  pushCard(pick('降落伞'));
  Q.push({ t: 'cine', style: 'dark', lines: C.interludesRoma.fin });
  Q.push({ t: 'fx', fx: { age: 28 } });
  Q.push({ t: 'fn', id: 'anpai' });
  G.finishQueue();
};

/* ---------- v1.13：终幕共用烘焙 ---------- */
G.finishQueue = function () {
  const S = G.S, Q = S.Q;
  Q.push({ t: 'fn', id: 'ending' });
  Q.push({ t: 'fn', id: 'puzzle' });
  Q.push({ t: 'fn', id: 'report' });
  Q.push({ t: 'fn', id: 'persona' });
  Q.push({ t: 'fn', id: 'echoes' });
  Q.push({ t: 'fn', id: 'parallel' });
  Q.push({ t: 'fn', id: 'share' });
  Q.push({ t: 'fn', id: 'final' });
};

/* ---------- v1.7：出生专属卡注入（小镇/中产；罗马已内联） ---------- */
G.applyBirthCards = function () {
  const S = G.S, Q = S.Q;
  if (S.fam === 'roma') return; // 罗马卡在 buildRoma 内联
  const bc = (window.C.birthCards || {})[S.fam];
  if (!bc || !bc.length) return;
  const norm = G.norm;
  const ch1 = bc.filter(x => x.sec === 1).map(norm);
  const uni = bc.filter(x => x.sec === 2).map(norm);
  const ch3 = bc.filter(x => x.sec === 3).map(norm);
  const ev  = bc.filter(x => x.ev).map(norm);
  // 第一章：在第一章区间内分散插入
  const iNews = Q.findIndex(b => b.id === 'sanSui');
  if (ch1.length && iNews >= 0) {
    const start = iNews + 1;
    const offs = [4, 9, 15, 21];
    ch1.forEach((c, k) => Q.splice(start + offs[Math.min(k, offs.length - 1)] + k, 0, c));
  }
  // 大学：毕业分流前
  const iGrad = Q.findIndex(b => b.id === 'gradPath');
  if (uni.length && iGrad >= 0) uni.forEach((c, k) => Q.splice(iGrad - k, 0, c));
  // 求职：HR 环节后
  const iHrB = Q.findIndex(b => b.id === 'hrB');
  if (ch3.length && iHrB >= 0) ch3.forEach((c, k) => Q.splice(iHrB + 1 + k, 0, c));
  // 职场：混入事件池
  const iWork = Q.findIndex(b => b.id === 'work');
  if (ev.length && iWork >= 0 && Q[iWork].events) Q[iWork].events = Q[iWork].events.concat(ev);
  // v1.8：危机联动卡（sec:5，中产《三件套的账单》等）——插在毕业谈话前，让玩家带着账单做选择
  const crisis = bc.filter(x => x.sec === 5).map(norm);
  const iLay = Q.findIndex(b => b.id === 'layoffTalk');
  if (crisis.length && iLay >= 0) crisis.forEach((c, k) => Q.splice(iLay + k, 0, c));
};

/* ---------- 队列执行 ---------- */
G.insert = function (list) { G.S.Q.splice(G.S.qi, 0, ...list); };
G.runNext = function () {
  const S = G.S;
  if (!S || S.qi >= S.Q.length) return;
  G.execIdx = S.qi;
  G.save();
  const b = S.Q[S.qi];
  S.qi++;
  G.execBeat(b);
};
G.execBeat = function (b) {
  if (!b || !G.S) return;
  switch (b.t) {
    case 'card': G.card(b, G.runNext); break;
    case 'news': G.newsBeat(b.id, G.runNext); break;
    case 'dm': G.dmWall(b.title, b.pools, b.n || 12, G.runNext); break;
    case 'cine': G.cine(b.lines, b.style, G.runNext); break;
    case 'fn': G.SCENES[b.id](b, G.runNext); break;
    case 'ach': G.unlockAch(b.id); G.runNext(); break;
    case 'fx': G.applyFx(b.fx || {}); G.runNext(); break;
  }
};

/* ---------- 数值应用 ---------- */
G.applyFx = function (fx) {
  if (!fx) return;
  const S = G.S, a = S.attrs;
  const cap = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  if (fx.score) a.score = cap(a.score + fx.score, 0, 400);
  if (fx.skill) a.skill = cap(a.skill + fx.skill, 0, 100);
  if (fx.money) a.money = cap(a.money + fx.money, 0, 999);
  if (fx.health) a.health = cap(a.health + fx.health, 0, 100);
  if (fx.mood) a.mood = cap(a.mood + fx.mood, 0, 100);
  if (fx.age) a.age = fx.age;
  if (fx.gpa) S.uniGpa = Math.max(0, Math.round(((S.uniGpa || 0) + fx.gpa) * 100) / 100);
  if (fx.vis) S.work.vis += fx.vis;
  if (fx.actual) S.work.actual += fx.actual;
};
G.applyChoice = function (c) {
  const S = G.S;
  G.applyFx(c.fx);
  if (c.set) Object.keys(c.set).forEach(k => {
    if (k === 'tang' || k === 'deng') S.flags.tang = (S.flags.tang || 0) + c.set[k];
    else S.flags[k] = (S.flags[k] || 0) + c.set[k];
  });
  S.choicesLog.push(c.label);
  // 成就计数
  if ((S.flags.kuaiban || 0) >= 5) G.unlockAch('tikua');
  if ((S.flags.heihua || 0) >= 6) G.unlockAch('heihua');
  if ((S.flags.fubao || 0) >= 5) G.unlockAch('fubao');
  if (S.flags.xiangshang) G.unlockAch('xiangshang');
  G.hud();
  G.save();
};

/* ================================================================
   场景注册表
================================================================ */
G.SCENES = {};

/* ---------- 序章：出生抽卡 ---------- */
G.SCENES.gacha = function (b, done) {
  const S = G.S;
  function draw() {
    const total = C.families.reduce((s, f) => s + f.weight, 0);
    let r = G.rng() * total, fam = C.families[0];
    for (const f of C.families) { if ((r -= f.weight) <= 0) { fam = f; break; } }
    S.fam = fam.id;
    const st = JSON.parse(JSON.stringify(fam.stats));
    // 二周目继承
    if (S.run >= 2 && S.lastEnding && C.inheritMap[S.lastEnding]) {
      const inh = C.inheritMap[S.lastEnding];
      Object.keys(inh.mods).forEach(k => st[k] = inh.mods[k]);
      S.inhNote = inh.note; S.inhName = inh.name;
    }
    S.hid.R = st.R; S.hid.G = st.G;
    S.attrs.money = st.money; S.attrs.health = st.health; S.attrs.mood = st.mood;
    S.hid.gender = G.chance(0.5) ? '女' : '男';
    // 户籍与出身强相关：罗马多海京，小镇多山河（现实也是这么配货的）
    const bias = { roma: 0, mid: 1, town: 2 }[fam.id];
    S.hid.D = G.chance(0.75) ? C.provinces[bias] : G.pick(C.provinces);
    S.hid.Dadj = G.F.dadj(S.hid.D);
    S.famDrawn = true;
    G.buildChapters();
    G.save();
  }
  function render() {
    const fam = C.families.find(f => f.id === S.fam) || C.families[2];
    const inhHtml = S.inhName ? '<div class="gacha-inherit">上一世「' +
      (window.ENDINGS[S.lastEnding] ? ENDINGS[S.lastEnding].name : S.lastEnding) +
      '」→ ' + S.inhName + '</div>' : '';
    G.show(
      '<div class="gacha-card ' + fam.color + '">' +
      '<div class="rarity">' + (S.inhName ? '继承' : fam.rarity) + ' · 第 ' + S.run + ' 世</div>' +
      '<h3>' + fam.name + (S.inhName ? '<span style="font-size:12px;font-weight:400">（继承：' + S.inhName + '）</span>' : '') + '</h3><p>' + fam.text + '</p>' +
      '<p style="margin-top:8px">户籍：<b>' + S.hid.D.name + '</b>　性别：<b>' + S.hid.gender + '</b>（概率 50%，和现实一样不由你选）</p>' +
      '</div>' +
      (S.inhNote ? '<div class="gacha-note">' + S.inhNote + '</div>' : '') +
      '<div class="gacha-note">本卡池概率公示：罗马 2% ／ 中产 18% ／ 小镇 80%。<br>现实没有这行小字。</div>' +
      '<div style="height:14px"></div>' +
      '<div class="choices" style="width:250px"><button class="btn primary center" id="gk">接受这份人生 ▸</button></div>'
      , { center: true });
    G.$('#gk').onclick = done;
    G.hud();
  }
  if (S.famDrawn) { render(); return; }
  const sc = G.show(
    (S.run >= 2 ? '<div class="gacha-inherit">第 ' + S.run + ' 世 · 上一世结局：' +
      (window.ENDINGS[S.lastEnding] ? ENDINGS[S.lastEnding].name : '——') + '</div>' : '') +
    '<div class="gacha-tip">你的人生，从这里抽出来。</div>' +
    '<div style="height:26px"></div>' +
    '<button class="gacha-btn" id="gbtn">抽 卡</button>' +
    '<div class="gacha-note" style="margin-top:24px">家庭、户籍、性别、健康——<br>都不在 your choices 里，在 your chances 里。</div>',
    { center: true });
  G.$('#gbtn').onclick = () => {
    try { G.sfx && G.sfx.click(); } catch (e) {}
    draw(); render();
  };
};

/* ---------- 第一章收尾：模拟考排名（红屏演出） ---------- */
G.SCENES.rank = function (b, done) {
  const S = G.S;
  if (!S.ch1res) {
    const luck = G.luck3() * 22;
    const choiceBonus = Math.min(12, (S.flags.kuaiban || 0) * 1.5);
    const fin = G.F.ch1(S.attrs, S.hid, S.attrs.score, luck, choiceBonus, 16);
    const mid = G.F.ch1(S.attrs, S.hid, S.attrs.score * 0.7, G.luck3() * 22, choiceBonus * 0.7, 12);
    S.ch1res = {
      you: fin.you, rank: fin.rank, avg: fin.avg,
      midYou: mid.you, midRank: mid.rank,
      gain: fin.you - mid.you, avgGain: fin.avg - mid.avg
    };
    G.pushRoll('第一章', '模拟考排名', 3, fin.base, luck, choiceBonus, S.attrs.score);
    if (fin.rank <= 5) G.unlockAch('bieren');
    G.unlockAch('juchang');
    G.save();
  }
  const r = S.ch1res;
  const delta = r.rank - r.midRank;
  const rankLine = delta <= 0
    ? '排名纹丝不动。你多考的每一分，班里其他人也考到了。'
    : '不进反退，倒了 ' + delta + ' 名。剧场里所有人都站起来了，你站起来，只是为了不被挡住。';
  G.cine([
    { t: '高三最后一次模拟考，出分了。' },
    { t: '你的分数：' + r.midYou + ' → ' + r.you, big: 1 },
    { t: '比上次高 ' + r.gain + ' 分。你熬的所有夜，都变成了数字。' },
    { t: '排名：第 ' + r.midRank + ' 名 → 第 ' + r.rank + ' 名', big: 1 },
    { t: rankLine },
    { t: '（全班平均分涨了 ' + r.avgGain + ' 分。这叫剧场效应。）', small: 1 }
  ], 'red', done);
};

/* ---------- 第二章：答题小游戏 ---------- */
G.SCENES.exam = function (b, done) {
  const S = G.S;
  if (!S.exam.qs) {
    const qs = C.questions.slice();
    const picked = [];
    for (let i = 0; i < 8; i++) picked.push(qs.splice(Math.floor(G.rng() * qs.length), 1)[0]);
    S.exam = { qs: picked, qi: 0, score: 0, answered: false, t: 60, answerScore: null };
    G.save();
  }
  const E = S.exam;
  let timer = null;
  function tick() {
    E.t = Math.max(0, E.t - 0.25);
    const bar = G.$('#tbar');
    if (bar) bar.style.width = (E.t / 60 * 100) + '%';
    if (E.t <= 0) { clearInterval(timer); finish('时间到。交卷。'); }
  }
  function finish(msg) {
    E.answerScore = E.score;
    clearInterval(timer);
    G.show(
      '<div class="cardbox"><span class="app-chip">考场</span>' +
      '<div class="card-title">考试结束</div>' +
      '<div class="card-text">' + msg + '<br><br>答题表现：<b>' + E.score + ' / 8</b><br><br>' +
      '请注意：这张卷子只占你高考总分的很小一部分。<br>占大头的，是前面十二年和一份户口。</div>' +
      '<div class="choices"><button class="btn primary center" id="ex-go">对答案（不，先别对）▸</button></div></div>');
    G.$('#ex-go').onclick = () => { G.save(); done(); };
  }
  function renderQ() {
    const q = E.qs[E.qi];
    G.show(
      '<div class="cardbox">' +
      '<div class="exam-top"><span>第 ' + (E.qi + 1) + ' / 8 题</span><span>答对 ' + E.score + '</span></div>' +
      '<div class="timerbar"><i id="tbar"></i></div>' +
      '<div class="exam-q">' + q.q + '</div>' +
      '<div class="exam-opts">' + q.opts.map((o, i) =>
        '<button class="btn opt" data-i="' + i + '">' + o + '</button>').join('') + '</div>' +
      '<div id="why"></div></div>', {});
    if (!timer) timer = setInterval(tick, 250);
    G.$('#scene').querySelectorAll('.opt').forEach(btn => {
      btn.onclick = () => {
        if (E.answered) return;
        E.answered = true;
        const i = +btn.dataset.i, ok = i === q.a;
        if (ok) { E.score++; btn.classList.add('ok'); try { G.sfx && G.sfx.ok(); } catch (e) {} }
        else { btn.classList.add('no'); try { G.sfx && G.sfx.no(); } catch (e) {} }
        G.$('#why').innerHTML = '<div class="exam-why">' + (ok ? '✓ ' : '✗ ') + q.why + '</div>' +
          '<div style="height:10px"></div><button class="btn primary center" id="nx">' +
          (E.qi >= 7 ? '交卷 ▸' : '下一题 ▸') + '</button>';
        G.$('#nx').onclick = () => {
          E.answered = false; E.qi++; G.save();
          if (E.qi >= 8) finish('你做完了最后一题。');
          else renderQ();
        };
      };
    });
  }
  renderQ();
};

/* ---------- 省份卡 ---------- */
G.SCENES.province = function (b, done) {
  const S = G.S, p = S.hid.D;
  S.provSeen = true; G.hud();
  G.show(
    '<div class="cardbox" style="text-align:center">' +
    '<div class="hint-top">第二章 · 高考</div>' +
    '<span class="app-chip">户籍档案</span>' +
    '<div class="card-title" style="font-size:30px;font-family:Songti SC,SimSun,serif">' + p.name + '</div>' +
    '<div class="card-text" style="margin-top:10px">' + p.rate + '<br>985 录取线：' + p.line.s985 + ' 分</div>' +
    '<div class="gacha-note">' + p.note + '</div>' +
    '<div style="height:18px"></div>' +
    '<div class="choices"><button class="btn primary center" id="pv">领取准考证 ▸</button></div></div>', { center: true });
  G.$('#pv').onclick = done;
};

/* ---------- 查分演出 ---------- */
G.SCENES.score = function (b, done) {
  const S = G.S;
  if (!S.exam.gaokao) {
    let luck = G.luck3() * 32;
    let ev = '';
    if (G.chance(0.15)) { luck -= 15; ev = '（考场空调坏了，你流着汗写完了作文）'; }
    else if (G.chance(0.12)) { luck += 8; ev = '（考前一晚刷到的那道题，考了）'; }
    const res = G.F.gaokao(S.attrs, S.hid, S.attrs.score, S.exam.answerScore || 0, luck);
    S.exam.gaokao = res.you; S.exam.gk = res; S.exam.ev = ev;
    G.pushRoll('第二章', '高考分数', 4, res.quadBirth, res.luck, 0, res.eff);
    G.save();
  }
  const gk = S.exam.gaokao, ev = S.exam.ev || '';
  // 一分一段：造出挤在同分的人群
  const crowd = G.rint(300, 2400);
  const rows = [];
  for (let d = 3; d >= -3; d--) {
    const s = gk + d * 2;
    rows.push('<div class="row' + (d === 0 ? ' you' : '') + '"><span>' + s + ' 分</span><span>' +
      (d === 0 ? crowd + ' 人 ← 你' : (crowd + G.rint(-600, 600)) + ' 人') + '</span></div>');
  }
  G.show(
    '<div class="score-wrap"><div class="score-label">2 0 2 6 · 全 国 高 考 · 查 分</div>' +
    '<div class="score-big beat" id="sbn">0</div>' +
    '<div class="score-sub">' + ev + (ev ? '<br>' : '') + '一分一段表：</div>' +
    '<div class="onesec">' + rows.join('') + '</div>' +
    '<div style="height:16px"></div>' +
    '<div class="choices" style="max-width:300px;margin:0 auto"><button class="btn primary center" id="sc-go">填志愿 ▸</button></div></div>',
    { center: true });
  // 数字滚动
  const el = G.$('#sbn'); let cur = 0;
  const iv = setInterval(() => {
    cur += Math.max(3, Math.round(gk / 30));
    if (cur >= gk) { cur = gk; clearInterval(iv); el.classList.remove('beat'); }
    el.textContent = cur;
  }, 40);
  try { G.sfx && G.sfx.heart(); } catch (e) {}
  G.$('#sc-go').onclick = () => { clearInterval(iv); done(); };
};

/* ---------- 志愿填报 + 录取 ---------- */
G.SCENES.zhiyuan = function (b, done) {
  const S = G.S, p = S.hid.D, score = S.exam.gaokao, L = p.line;
  if (S.exam.tier) { done(); return; }
  const hit = t => score >= L[t];
  const rowHtml = (name, key) => '<tr class="' + (hit(key) ? 'hit' : '') + '"><td>' + name + '</td><td>' + L[key] + '</td><td>' + (hit(key) ? '可冲' : '差距 ' + (L[key] - score)) + '</td></tr>';
  const opts = [];
  if (S.hid.R >= 55) opts.push({ label: '峰哥一对一志愿指导（¥5980，稳）', id: 'peak' });
  opts.push({ label: '冲一冲（有滑档风险）', id: 'chong' });
  opts.push({ label: '稳一稳（低报一档）', id: 'wen' });
  if (score < L.yb + 15) opts.push({ label: '复读一年（+30 分左右，心态-15）', id: 'fudu' });
  G.opts(opts,
    '<div class="cardbox"><span class="app-chip">志愿填报</span>' +
    '<div class="card-title">你的分数：<b style="font-family:Songti SC,serif">' + score + '</b></div>' +
    '<div class="zy-note">你的省份：' + p.name + '。同一张卷子，不同的命运兑换汇率。</div>' +
    '<table class="zy-table"><tr><th>批次</th><th>分数线</th><th>状态</th></tr>' +
    rowHtml('985', 's985') + rowHtml('211', 's211') + rowHtml('一本', 'yb') + rowHtml('二本', 'eb') +
    '</table>' +
    '<div class="zy-note">' + (S.hid.R >= 55
      ? '你家买得起信息差：峰哥知道每年的“大小年”，知道哪个专业名字好听其实天坑。'
      : '你家的报考指南是一本翻烂的旧书。信息差，也是出身的一部分。') + '</div></div>',
    opt => {
      if (opt.id === 'fudu') {
        S.exam.gaokao = score + G.rint(15, 45);
        S.exam.fudu = (S.exam.fudu || 0) + 1;
        G.applyFx({ mood: -15, health: -5 });
        G.toast('复读一年。分数 ' + score + ' → ' + S.exam.gaokao + '。心态 -15。');
        G.insert([{ t: 'fn', id: 'zhiyuan' }]);
        done(); return;
      }
      const peak = opt.id === 'peak';
      if (peak) G.applyFx({ money: -6 });
      const rawTier = score >= L.s985 ? 's985' : score >= L.s211 ? 's211' : score >= L.yb ? 'yb' : score >= L.eb ? 'eb' : 'zk';
      let tier = rawTier;
      if (!peak && opt.id === 'chong') tier = G.F.admit(score, p, false, 0.22);
      if (!peak && opt.id === 'wen' && tier !== 'zk') tier = G.F.lower(tier);
      S.exam.tier = tier; S.exam.peak = peak;
      S.exam.slid = tier !== rawTier;
      S.attrs.edu = C.eduIdx[tier];
      const u = C.unis[tier];
      G.pushRoll('第二章', '志愿录取', 3, S.hid.R, S.exam.slid ? -1 : G.luck3() * 8, peak ? 12 : 4, 2);
      if (S.exam.slid) G.unlockAch('huadang');
      G.S.milestones.push(
        { k: '高考', v: score + ' 分（' + p.name + '）' },
        { k: '录取', v: u.name + '（' + u.tag + '）' },
        { k: '第一份 offer', v: G.F.offer(tier, S.hid, G.rng()) }
      );
      G.cine([
        { t: '录取结果公布。' },
        { t: u.name, big: 1 },
        { t: (u.tag === '985' ? '“双一流”的晨光会照到你身上——' : u.tag === '专科' ? '通知书很薄，像这个夏天最后一线希望——' : '这是一张不会让你出头、也饿不死的门票——') + (S.exam.slid ? '但你本来能去更好的地方。这叫滑档。' : '父母在家族群里发了红包。') },
        { t: '第一学历：' + u.tag + '。这四个字会跟你一辈子，虽然官方说“没有第一学历这个概念”。', small: 1 }
      ], 'paper', done);
      G.hud();
    });
  G.hud();
};

/* ---------- 大学章收尾：毕业分流 ---------- */
G.SCENES.gradPath = function (b, done) {
  const S = G.S;
  if (!S.unires) {
    const luck = G.luck3() * 0.25;
    const choice = Math.min(0.45, (S.flags.shuisai ? 0.12 : 0) + (S.flags.banmianfei ? 0.15 : 0) +
      (S.flags.xueshenghui ? 0.08 : 0) + (S.flags.sanfang ? 0.05 : 0));
    const res = G.F.uni(S.hid, S.uniGpa || 0, luck, choice);
    S.unires = res;
    G.pushRoll('大学', '毕业分流', 3, res.base * 60, luck * 60, choice * 60, res.effort * 60);
    G.save();
  }
  const U = S.unires;
  const opts = [];
  if (U.rank <= 24) opts.push({ label: '保研（你排第 ' + U.rank + ' 名，踩着线）', id: 'baoyan' });
  if (S.attrs.edu >= 1) opts.push({ label: '考研（给自己第二次发牌）', id: 'kaoyan' });
  if (S.attrs.edu === 0) opts.push({ label: '专升本（最后一班车）', id: 'zsb' });
  opts.push({ label: '直接就业（绩点变成简历上的一行小字）', id: 'work' });
  function finish(kind) {
    let lines = [];
    if (kind === 'baoyan') {
      S.attrs.edu = Math.min(4, S.attrs.edu + 1);
      S.flags.baoyan = 1;
      S.milestones.push({ k: '毕业去向', v: '保研（第 ' + U.rank + ' / 120 名）' });
      lines = [
        { t: '保研名单公示。你的名字在第 ' + U.rank + ' 行' +
          (U.rank === 24 ? '——最后一个名额。' : '。'), big: 1 },
        { t: '四年，就为了压住一条 1 厘米高的分割线。' },
        { t: '家族群发了红包。妈妈把截图设成了头像。' }
      ];
    } else if (kind === 'kaoyanOk') {
      S.attrs.edu = Math.min(4, S.attrs.edu + 1);
      S.flags.kaoyanOk = 1;
      S.milestones.push({ k: '毕业去向', v: '考研上岸（' + C.eduName[S.attrs.edu] + '）' });
      lines = [
        { t: '拟录取名单出来那天，你盯着自己的名字看了很久。', big: 1 },
        { t: '你把“上岸”两个字发进了家族群。这次没人反驳你。' },
        { t: '只是你还不知道：简历上，你的硕士在第二行，字号更小。', small: 1 }
      ];
    } else if (kind === 'kaoyanFail') {
      S.flags.kaoyanFail = 1;
      G.applyFx({ mood: -15 });
      S.milestones.push({ k: '毕业去向', v: '考研失败（差 11 分）' });
      lines = [
        { t: '差 11 分。', big: 1 },
        { t: '二战？房租、资料、年龄。你把“再考一年”四个字咽了回去。' },
        { t: '它后来变成了简历上的一个字段：空窗期。', small: 1 }
      ];
    } else if (kind === 'zsbOk') {
      S.attrs.edu = 1;
      S.flags.kaoyanOk = 1;
      S.milestones.push({ k: '毕业去向', v: '专升本上岸' });
      lines = [
        { t: '录取通知书到了。两年制本科。', big: 1 },
        { t: '你在新生群里看到有人问：“专升本的一桌坐哪？”', small: 1 }
      ];
    } else if (kind === 'zsbFail') {
      S.flags.kaoyanFail = 1;
      G.applyFx({ mood: -12 });
      S.milestones.push({ k: '毕业去向', v: '专升本失败' });
      lines = [
        { t: '差 9 分。招生办电话再也打不通了。', big: 1 },
        { t: '你收拾行李回家。那张专科毕业证，薄得像一张车票。', small: 1 }
      ];
    } else {
      S.milestones.push({ k: '毕业去向', v: '直接就业' });
      lines = [
        { t: '你抱着简历走进了秋招。', big: 1 },
        { t: '四年绩点、两张奖状、一段实习，浓缩成简历上的一行小字。' },
        { t: 'HR 平均看每份简历的时间是 7.4 秒。你用了四年，写了一份 7 秒的文档。', small: 1 }
      ];
    }
    G.hud();
    G.cine(lines, 'paper', done);
  }
  G.opts(opts,
    '<div class="cardbox"><span class="app-chip">大四 · 毕业分流</span>' +
    '<div class="card-title">你的绩点：<b style="font-family:Songti SC,serif">' + U.gpa.toFixed(1) + '</b>' +
    '<span style="font-size:13px;color:var(--ink2)">　专业平均 ' + U.avg.toFixed(1) + '</span></div>' +
    '<div class="zy-note">专业排名：第 <b>' + U.rank + '</b> / 120 名。保线 24 名。' +
    (U.rank <= 24 ? '你在岸上。' : '岸在' + (U.rank - 24) + '个名次之外。') + '</div>' +
    '<div class="zy-note">四年了。同一个专业的 120 个人，用四年时间重新洗了一次牌——大部分人洗回了原地。</div></div>',
    opt => {
      if (opt.id === 'baoyan') { finish('baoyan'); return; }
      if (opt.id === 'work') { finish('work'); return; }
      if (opt.id === 'zsb') {
        finish(G.chance(0.32 + (S.unires.gpa >= 2.6 ? 0.12 : 0) + Math.max(0, G.luck3()) * 0.12) ? 'zsbOk' : 'zsbFail');
        return;
      }
      let p = 0.32;
      if (S.attrs.edu >= 2) p += 0.1;
      if (S.unires.gpa >= 3.0) p += 0.08;
      p += Math.max(0, G.luck3()) * 0.15;
      finish(G.rng() < Math.min(0.85, p) ? 'kaoyanOk' : 'kaoyanFail');
    });
};

/* ---------- 第三章 A：你被筛 ---------- */
G.SCENES.hrA = function (b, done) {
  const S = G.S;
  const eduName = C.eduName[S.attrs.edu + 1] || '二本';
  const lines = [
    { t: '招聘季。你海投了 47 份简历，收到 3 个面试邀约，0 个 offer。' },
    { t: '今天，你申请了招聘软件的“HR 体验版”。' },
    { t: '系统说：让你亲眼看看，你的简历是怎么被处理的。', small: 1 },
    { t: '简历 #022 ——你的。' },
    { t: '[ 第一学历：' + eduName + ' ]', big: 1 },
    { t: '系统自动打标，用时 3 秒。' },
    { t: '[ 空窗期：8 个月 ]', big: 1 },
    { t: '再 3 秒。空窗期的 8 个月里，你在照顾生病的家人、考证书、投了 200 份简历——系统只看见“8 个月”。' },
    { t: '[ 年龄：29 ]', big: 1 }
  ];
  if (S.hid.gender === '女') lines.push(
    { t: '[ 婚育状态：已婚未育 ]', big: 1 },
    { t: '这个标签从你领证那天起就长在了简历上。它不问你职业规划，只倒计时。' });
  if (S.attrs.edu >= 3) lines.push(
    { t: '你后来读了名校的研究生。但系统表格里，你的 985 硕士排在第二行，字号更小。', small: 1 });
  if (S.flags.kaoyanFail) lines.push(
    { t: '那 8 个月里，你在出租屋刷考研真题。系统字段里，它叫：空窗。', small: 1 });
  lines.push(
    { t: '（简历滑入“不合适”。全程用时 9 秒。）', big: 1 },
    { t: '你读了 ' + (S.attrs.edu >= 3 ? '19 年书。研究生那三年，系统没数。' : '16 年书。') });
  G.cine(lines, 'dark', done);
};

/* ---------- 第三章 B：角色反转，你成为 HR ---------- */
G.SCENES.hrB = function (b, done) {
  const S = G.S;
  if (!S.hr.start) { S.hr = { i: 0, days: 7, hires: 0, fair: 0, safe: 0, log: [], start: 1 }; G.save(); }
  const H = S.hr;
  const labels = r => {
    const L = [];
    if (r.e1.indexOf('双非') >= 0) L.push('第一学历：双非');
    if (r.gap >= 6) L.push('空窗期 ' + r.gap + ' 个月');
    if (r.age >= 35) L.push('35+');
    if (r.extra.indexOf('已婚未育') >= 0) L.push('已婚未育');
    if (r.gap > 0 && r.gap < 6) L.push('需解释空窗');
    return L;
  };
  function finish() {
    let lines = [
      { t: '招聘季结束。你招到 ' + H.hires + ' 人，给出 ' + H.fair + ' 次面试机会，安全拒绝了 ' + H.safe + ' 份简历。' }
    ];
    if (H.hires < 2) lines.push({ t: '上级约谈：“为什么人还没招齐？到面率为什么这么低？”', big: 1 });
    else lines.push({ t: '上级在周会上表扬了你：“效率很高。”', big: 1 });
    if (H.fair === 0) lines.push({ t: '你甚至没有给过任何人一次面试机会。你熟练得让自己害怕。' });
    if (H.safe >= 5) { lines.push({ t: '“安全拒绝”用多了，是有手感的。你现在有手感了。' }); G.unlockAch('baishoutao'); }
    if (H.hires === 0 && H.fair === 0) G.unlockAch('huansuan');
    lines.push({ t: '你关掉招聘系统，屏幕暗下来，映出你的脸。' });
    G.pushRoll('第三章', '招聘执行', 2, S.hid.G * 0.2, G.luck3() * 8, H.fair * 8 + 4, H.hires * 3);
    G.save();
    G.cine(lines, 'paper', done);
  }
  function render() {
    if (H.i >= C.resumes.length) { finish(); return; }
    const r = C.resumes[H.i];
    const L = labels(r);
    const mirror = r.mirror && !H.mirrorSeen;
    if (mirror) H.mirrorSeen = true;
    G.show(
      '<div class="hr-hud"><span class="kpi' + (H.days <= 2 ? ' bad' : '') + '">剩余 ' + H.days + ' 天</span>' +
      '<span class="kpi">已招 ' + H.hires + ' / 2</span>' +
      '<span class="kpi">给面试 ' + H.fair + '</span>' +
      '<span class="kpi">安全拒绝 ' + H.safe + '</span></div>' +
      '<div class="resume"><h3>' + r.name + '</h3>' +
      '<div class="r-row"><span class="k">年龄</span><span>' + r.age + '</span></div>' +
      '<div class="r-row"><span class="k">第一学历</span><span>' + r.e1 + '</span></div>' +
      (r.e2 ? '<div class="r-row"><span class="k">最高学历</span><span>' + r.e2 + '</span></div>' : '') +
      '<div class="r-row"><span class="k">空窗期</span><span>' + (r.gap ? r.gap + ' 个月' : '无') + '</span></div>' +
      (r.extra ? '<div class="r-row"><span class="k">备注</span><span>' + r.extra + '</span></div>' : '') +
      '<div class="r-row"><span class="k">技能</span><span>' + r.skill + '</span></div>' +
      '<div style="margin-top:10px">' + L.map(x => '<span class="r-label">⚠ ' + x + '</span>').join('') + '</div>' +
      (mirror ? '<div class="mirror-flag">这份简历的每一项，都和你被拒的那份一模一样。</div>' : '') +
      '</div>' +
      '<div class="hr-note">系统 KPI：7 天内招满 2 人，人力成本不超预算，“出了问题你负责”。</div>' +
      '<div class="hr-actions">' +
      '<button class="btn" id="h-fair"' + (H.days <= 0 ? ' disabled' : '') + '>给面试机会<br><span style="font-size:11px;opacity:.7">' + (H.days <= 0 ? '没时间了' : '耗时 1 天 · 可能失败') + '</span></button>' +
      '<button class="btn red" id="h-safe">安全拒绝<br><span style="font-size:11px;opacity:.7">0 成本 · 用理由〔' + (L[0] || '综合评估') + '〕</span></button>' +
      '</div>', {});
    G.$('#h-fair').onclick = () => {
      if (H.days <= 0) return;
      H.days--; H.fair++;
      const ok = G.rng() < 0.5 + S.attrs.skill * 0.004;
      if (ok) { H.hires++; G.toast('面试通过，入职了。你花了一天，但招到了一个“不安全”的人。'); }
      else G.toast('面试没过。上级说：别在没把握的人身上浪费时间。');
      H.i++; G.save(); render();
    };
    G.$('#h-safe').onclick = () => {
      H.safe++;
      G.toast('已拒绝。理由：〔' + (L[0] || '综合评估不匹配') + '〕。0 成本，0 风险，0 愧疚（暂时）。');
      H.i++; G.save(); render();
    };
  }
  render();
};

/* ---------- 第四章：职场表演（双进度条） ---------- */
G.SCENES.work = function (b, done) {
  const S = G.S, W = S.work;
  if (!W.start) {
    W.start = 1; W.day = 1; W.evIdx = 0; W.fubaoDay = 0;
    W.events = (b && b.events) || []; W.luckShare = 0; W.layoff = null;
    G.save();
  }
  function bars() {
    return '<div class="bar act"><div class="bar-cap"><span>实际产出（老板看不见）</span><span>' + Math.round(W.actual) + '</span></div>' +
      '<div class="track"><i style="width:' + Math.min(100, W.actual / 2) + '%"></i></div></div>' +
      '<div class="bar vis"><div class="bar-cap"><span>可见产出（老板只看这个）</span><span>' + Math.round(W.vis) + '</span></div>' +
      '<div class="track"><i style="width:' + Math.min(100, W.vis / 2) + '%"></i></div></div>';
  }
  function showEvent() {
    const ev = W.events[W.evIdx];
    G.card(ev, () => { W.evIdx++; G.save(); render(); });
  }
  function dayChoice() {
    G.show(
      '<div class="work-day">入职第 ' + W.day + ' 个月 / 共 10 个月</div>' + bars() +
      '<div class="card-text" style="font-size:14px;color:var(--ink2)">今天怎么过？</div>' +
      '<div class="choices">' +
      '<button class="btn" id="w-off">下班（实际产出 ↑ 心态 ↑，但老板看不见）</button>' +
      '<button class="btn red" id="w-ot">加班（可见产出 ↑↑，健康 ↓↓）</button>' +
      '<button class="btn" id="w-fake">表演加班（工位灯留着，人去吃饭）</button>' +
      '</div>', {});
    G.$('#w-off').onclick = () => step({ actual: 7, vis: -2, health: 5, mood: 4 }, '下班');
    G.$('#w-ot').onclick = () => step({ actual: 4, vis: 18, health: -8, mood: -5 }, '加班');
    G.$('#w-fake').onclick = () => step({ actual: 0, vis: 10, health: -2, mood: -3 }, '表演加班');
  }
  function step(fx, label) {
    G.applyFx(fx);
    S.choicesLog.push(label);
    if (label === '表演加班') { S.flags.heihua = (S.flags.heihua || 0) + 1; if ((S.flags.heihua || 0) >= 6) G.unlockAch('heihua'); }
    if (label === '加班') { S.flags.fubao = (S.flags.fubao || 0) + 1; if ((S.flags.fubao || 0) >= 5) G.unlockAch('fubao'); }
    if (label === '下班') S.flags.tang = (S.flags.tang || 0) + 1;
    W.day++;
    G.save();
    if (W.day > 10) { finishWork(); return; }
    if (W.day === 6) { interim(); return; }
    // 每逢奇数月且还有事件 → 插事件
    if (W.day % 2 === 1 && W.evIdx < W.events.length) { showEvent(); return; }
    // 彩票：极小概率天选之子
    if (G.chance(0.005)) {
      S.flags.tianxuan = 1; G.save();
      G.cine([
        { t: '第 ' + W.day + ' 个月，你随手买了一张彩票——为了凑停车费找的零。' },
        { t: '中奖了。', big: 1 },
        { t: '不是那种“免单咖啡”的中奖。' },
        { t: '是那种，你再也不用看老板脸色的中奖。', big: 1 }
      ], 'red', done);
      return;
    }
    render();
  }
  function interim() {
    const r = G.F.rating(W, S.hid, G.luck3());
    G.show(
      '<div class="cardbox"><span class="app-chip">半年绩效</span>' +
      '<div class="card-title">绩效出炉</div>' +
      '<div class="card-text">你的评级：<b>' + (r.total > 60 ? 'B+' : 'B') + '</b>。<br><br>' +
      '绩效 A 的是隔壁组的小周——那个每天准点下班、汇报PPT做得比代码好的人。<br><br>' +
      '后来你才知道，小周的舅舅是这条业务线的创始人之一。<br><br>' +
      '你加班的所有夜晚，加起来，买不到一个舅舅。</div>' +
      '<div class="choices"><button class="btn primary center" id="it">继续 ▸</button></div></div>');
    G.$('#it').onclick = () => { W.day++; G.save(); render(); };
  }
  function finishWork() {
    const r = G.F.rating(W, S.hid, G.luck3());
    G.pushRoll('第四章', '绩效评级', 3, r.birth, r.luck, r.choice, r.effort);
    W.luckShare = r.luck / (r.total || 1);
    W.layoff = S.flags.tianxuan ? true : G.F.layoff(S.hid, W, G.luck3());
    G.pushRoll('第四章', '裁员名单', 3, S.hid.G * 0.6, W.layoff ? G.luck3() * 10 : 14, W.vis * 0.2, W.actual * 0.15);
    G.save();
    done();
  }
  function render() {
    if (W.evIdx < W.events.length && W.day > 1) { showEvent(); return; }
    dayChoice();
  }
  if (W.day === 1 && W.evIdx === 0) dayChoice();
  else render();
};

/* ---------- 毕业谈话 + 分岔 ---------- */
G.SCENES.layoffTalk = function (b, done) {
  const S = G.S;
  if (S.flags.tianxuan) { done(); return; }
  function branch() {
    const opts = [];
    if (S.work.layoff) {
      opts.push({ label: '送外卖，先活下来', id: 'rider' });
      opts.push({ label: '考公，宇宙的尽头是编制', id: 'kaogong' });
      opts.push({ label: '拿 N+1 开个店，当自己的老板', id: 'kaidian' });
      opts.push({ label: '离开这座城市，退出赛道', id: 'tuisai' });
      opts.push({ label: '把裁员过程实名发出去', id: 'fakao' });
      opts.push({ label: '先躺一段时间', id: 'tang' });
    } else {
      opts.push({ label: '继续干下去（你是幸存者）', id: 'stay' });
      opts.push({ label: '拿赔偿金开店，当自己的老板', id: 'kaidian' });
      opts.push({ label: '把裁员过程实名发出去', id: 'fakao' });
      opts.push({ label: '辞职，退出赛道', id: 'tuisai' });
    }
    G.opts(opts,
      '<div class="cardbox"><span class="app-chip">' + (S.work.layoff ? '失业第 1 天' : '职场') + '</span>' +
      '<div class="card-title">' + (S.work.layoff ? '你 35 岁，工牌被收走了。' : '你活了下来。') + '</div>' +
      '<div class="card-text">' + (S.work.layoff
        ? 'N+1 到账。招聘软件给你打上了新标签：<br>[ 年龄：35 ] [ 状态：空窗 ]。<br><br>现在，你要去哪？'
        : '名单下来了，你不在上面。名单上的人比你努力，也比你便宜——只是没有你幸运。<br><br>你开始怀疑：保住，是奖励，还是缓期。') +
      '</div></div>',
      opt => {
        if (opt.id === 'rider') {
          G.insert([
            { t: 'cine', style: 'dark', lines: [
              { t: '算法给你派了第一单：配送时间 24 分钟。' },
              { t: '你跑了三天，系统学习你的速度，压到了 22 分钟。' },
              { t: '你跑得更快，它压得更狠。第七天：19 分钟。' },
              { t: '系统没有恶意。它只是不关心。' }
            ] },
            { t: 'fn', id: 'rider' }
          ]);
          done();
        } else if (opt.id === 'kaogong') {
          G.insert([{ t: 'fn', id: 'kaogong' }]);
          done();
        } else if (opt.id === 'kaidian') {
          G.applyFx({ money: 15 }); // N+1 到账
          G.insert([
            { t: 'card', app: C.kd.ad.app, who: C.kd.ad.who, title: C.kd.ad.title, text: C.kd.ad.text, ch: C.kd.ad.ch },
            { t: 'cine', style: 'dark', lines: C.kd.tour },
            { t: 'fn', id: 'kzSign' }
          ]);
          done();
        } else if (opt.id === 'tuisai') {
          S.flags.tuisai = 1; G.save();
          G.insert([{ t: 'cine', style: 'paper', lines: [
            { t: '你退了合租的房，回县城盘了个小铺面，做木工。' },
            { t: '朋友们说你疯了：“读那么多书，去打家具？”' },
            { t: '你给自己做了一张桌子。刨花卷起来的时候，你想：' },
            { t: '原来做东西，比做 PPT 踏实。', big: 1 }
          ] }]);
          done();
        } else if (opt.id === 'fakao') {
          S.flags.fakao = 1; G.save();
          G.insert([{ t: 'cine', style: 'dark', lines: [
            { t: '你把裁员谈话的录音整理成帖子：《我的毕业谈话实录》。' },
            { t: '两小时，阅读 10 万+。四小时，帖子没了。' },
            { t: '你的账号也没了。' },
            { t: '七小时后，一条陌生私信：', small: 1 },
            { t: '“师兄，我也遇到了。能请教吗？”', big: 1 }
          ] }]);
          done();
        } else if (opt.id === 'tang') {
          S.flags.tang = (S.flags.tang || 0) + 2; G.save();
          G.insert([{ t: 'cine', style: 'paper', lines: [
            { t: '你给自己放了假。' },
            { t: '第一周睡到自然醒。第二周开始焦虑。第三周你习惯了焦虑。' },
            { t: '第四周，你和焦虑平起平坐。', big: 1 }
          ] }]);
          done();
        } else {
          S.flags.retained = 1; G.save();
          done();
        }
      });
  }
  if (S.work.layoff) {
    G.cine([
      { t: '第 10 个月，全员邮件：《关于组织架构优化的通知》。' },
      { t: '你的名字在附件第二页，和 647 个名字按工号排在一起。', big: 1 },
      { t: '在这里，你终于不排名了。' },
      { t: 'HR 微笑着推过来一份文件：“我们内部叫毕业。”' },
      { t: '“祝你毕业快乐。”' },
      { t: '附页：竞业协议。你下一份工作要去哪，公司想知道。' }
    ], 'red', branch);
  } else {
    G.cine([
      { t: '你活下来了。庆功酒会上，老板拍着你的肩。' },
      { t: '“小张啊，你是跟公司一起打过硬仗的人。”' },
      { t: '你笑着碰杯。你知道那 647 个名字里，有 30 个比你能干。' },
      { t: '但他们不在酒会上。' }
    ], 'paper', branch);
  }
};

/* ---------- v1.3 小游戏 ①：一天 25 小时（无解谜题） ---------- */
/* ---------- v1.14：时间分配谜题（三线分化） ---------- */
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

/* ---------- v1.3 小游戏 ②：黑话连连看 ---------- */
G.SCENES.jargon = function (b, done) {
  const S = G.S;
  if (!S.jg) {
    S.jg = { pickedL: -1, matched: [], miss: 0, rOrder: C.jargonGame.map((p, i) => i) };
    for (let k = S.jg.rOrder.length - 1; k > 0; k--) { const j = Math.floor(G.rng() * (k + 1)); [S.jg.rOrder[k], S.jg.rOrder[j]] = [S.jg.rOrder[j], S.jg.rOrder[k]]; }
    G.save();
  }
  const J = S.jg;
  function result() {
    G.applyFx({ vis: 4, mood: -2 });
    G.cine([
      { t: '培训考核：满分（6 / 6，配错 ' + J.miss + ' 次）。', big: 1 },
      { t: 'HR 看着你的满分，点了点头："很好，你已经具备说谎能力了。"' },
      { t: '结业证书上写着五个字：', },
      { t: '价值观契合。', big: 1 },
      { t: '明天起，说这些话的时候，请不要脸红。', small: 1 }
    ], 'paper', done);
  }
  function render() {
    if (J.matched.length >= C.jargonGame.length) { result(); return; }
    const matchedL = i => J.matched.includes(i);
    G.show(
      '<div style="max-width:360px;margin:0 auto">' +
      '<div class="hint-top">入职培训 · 第一课</div>' +
      '<div class="card-title">连线：把黑话和它的意思配对</div>' +
      '<div class="zy-note">配对正确数：' + J.matched.length + ' / 6　配错：' + J.miss + '</div>' +
      '<div class="match-wrap">' +
      '<div class="match-col">' + C.jargonGame.map((p, i) =>
        '<button class="pair-btn' + (matchedL(i) ? ' matched' : '') + (J.pickedL === i ? ' sel' : '') + '" data-k="L" data-i="' + i + '"' + (matchedL(i) ? ' disabled' : '') + '>' + p[0] + '</button>').join('') + '</div>' +
      '<div class="match-col">' + J.rOrder.map(i =>
        '<button class="pair-btn' + (matchedL(i) ? ' matched' : '') + '" data-k="R" data-i="' + i + '"' + (matchedL(i) ? ' disabled' : '') + '>' + C.jargonGame[i][1] + '</button>').join('') + '</div>' +
      '</div></div>', {});
    G.$('#scene').querySelectorAll('.pair-btn').forEach(btn => {
      btn.onclick = () => {
        const side = btn.dataset.k, i = +btn.dataset.i;
        if (side === 'L') { J.pickedL = (J.pickedL === i ? -1 : i); G.save(); render(); return; }
        if (J.pickedL < 0) { G.toast('先在左边选一个黑话'); return; }
        if (i === J.pickedL) {
          J.matched.push(i); J.pickedL = -1;
          try { G.sfx && G.sfx.ok(); } catch (e) {}
        } else {
          J.miss++;
          J.pickedL = -1;
          try { G.sfx && G.sfx.no(); } catch (e) {}
          G.toast('面试官皱了皱眉。');
        }
        G.save();
        render();
      };
    });
  }
  render();
};

/* ---------- v1.3 小游戏 ③：公平拼图 ---------- */
G.SCENES.puzzle = function (b, done) {
  const S = G.S;
  if (!S.pz) {
    const pieces = C.puzzle.word.split('').concat(C.puzzle.wrong);
    for (let k = pieces.length - 1; k > 0; k--) { const j = Math.floor(G.rng() * (k + 1)); [pieces[k], pieces[j]] = [pieces[j], pieces[k]]; }
    S.pz = { pieces, placed: [], wrong: 0 };
    G.save();
  }
  const P = S.pz;
  function finish() {
    G.applyFx({ mood: -3 });
    G.cine([
      { t: '拼好了。「公平竞争」四个字，齐了。' },
      { t: '但托盘里还剩三块：' + C.puzzle.wrong.join('、') + '。', big: 1 },
      { t: '哪块都放不进去。' },
      { t: '缺的那三块，不属于这张图。', big: 1 },
      { t: '它们属于出生——从你出生那天起，就已经拼在别人的图里了。' }
    ], 'red', done);
  }
  function render() {
    if (P.placed.length >= C.puzzle.word.length) { finish(); return; }
    G.show(
      '<div style="max-width:360px;margin:0 auto;text-align:center">' +
      '<div class="hint-top">终幕之前 · 请完成拼图</div>' +
      '<div class="card-title">把『公平竞争』拼出来</div>' +
      '<div class="pz-grid">' + C.puzzle.word.split('').map((ch, i) =>
        '<div class="pz-slot' + (P.placed.includes(i) ? ' fill' : '') + '">' + (P.placed.includes(i) ? ch : '　') + '</div>').join('') +
      '</div>' +
      '<div class="pz-tray">' + P.pieces.map((p, idx) => ({ p, idx })).filter(x => {
        const slot = C.puzzle.word.indexOf(x.p);
        return !(slot >= 0 && P.placed.includes(slot));
      }).map(x =>
        '<button class="pz-piece" data-i="' + x.idx + '">' + x.p + '</button>').join('') + '</div>' +
      '<div class="zy-note">提示：不是所有碎片都属于这张图。</div>' +
      '</div>', {});
    G.$('#scene').querySelectorAll('.pz-piece').forEach(btn => {
      btn.onclick = () => {
        const idx = +btn.dataset.i, ch = P.pieces[idx];
        const slot = C.puzzle.word.indexOf(ch);
        if (slot >= 0 && !P.placed.includes(slot)) {
          P.placed.push(slot);
          try { G.sfx && G.sfx.ok(); } catch (e) {}
        } else {
          P.wrong++;
          btn.classList.add('shake');
          try { G.sfx && G.sfx.no(); } catch (e) {}
          G.toast('放不进去。');
          setTimeout(render, 500);
          return;
        }
        G.save();
        render();
      };
    });
  }
  render();
};

/* ---------- v1.6：抢课手速战 ---------- */
G.SCENES.kzq = function (b, done) {
  const S = G.S;
  if (!S.kzq) { S.kzq = { round: 0, clicks: 0, slots: 0, wins: 0, log: [] }; G.save(); }
  const K = S.kzq;
  const R = C.kzq.rounds;
  clearInterval(window.__kzqInt);
  function startRound() {
    const r = R[K.round];
    if (r.crash) { crash(); return; }
    K.clicks = 0; K.slots = r.slots;
    render(r);
    window.__kzqInt = setInterval(() => {
      K.slots--;
      const bar = G.$('#kz-slots');
      if (bar) bar.innerText = Math.max(0, K.slots);
      if (K.slots <= 0) endRound(false);
    }, r.drain);
  }
  function render(r) {
    G.show(
      '<div style="max-width:360px;margin:0 auto;text-align:center">' +
      '<div class="hint-top">选课系统 · 第 ' + (K.round + 1) + ' / ' + R.length + ' 轮</div>' +
      '<div class="card-title">' + r.course + '</div>' +
      '<div class="zy-note">剩余名额：<b id="kz-slots" style="font-size:22px;color:var(--red)">' + K.slots + '</b>' +
      '　你的点击：<b>' + K.clicks + '</b> / ' + r.need + '</div>' +
      '<div class="gacha-note">插件已在 0.02 秒内登录。祝你好运。</div>' +
      '<button class="kz-btn" id="kz-go">抢</button>' +
      '<div class="zy-note" style="margin-top:10px">名额清零或点满即结算。手速说话。</div>' +
      '</div>', { center: true });
    G.$('#kz-go').onclick = () => {
      K.clicks++;
      G.$('#kz-go').textContent = '抢 ×' + K.clicks;
      try { G.sfx && G.sfx.click(); } catch (e) {}
      if (K.clicks >= r.need) endRound(true);
    };
  }
  function crash() {
    G.show(
      '<div style="max-width:360px;margin:0 auto;text-align:center">' +
      '<div class="hint-top">选课系统 · 第 3 轮</div>' +
      '<div class="card-title">系统崩了</div>' +
      '<div class="card-text">刷新。502。<br>再刷新。502。<br>三分钟后恢复——所有课的名额都已归零。<br><br>教务处公告："由于访问量过大，本学期选课已结束。"</div>' +
      '<div class="choices"><button class="btn primary center" id="kz-end">认了 ▸</button></div></div>', { center: true });
    G.$('#kz-end').onclick = () => { K.round++; finish(); };
  }
  function endRound(win) {
    clearInterval(window.__kzqInt);
    if (win) K.wins++;
    K.log.push('第' + (K.round + 1) + '轮：' + (win ? '抢到了' : '没抢到'));
    K.round++;
    G.save();
    if (K.round < R.length) startRound();
    else finish();
  }
  function finish() {
    const won = K.wins >= 1;
    if (won) G.applyFx({ gpa: 0.3, mood: 2 });
    else G.applyFx({ skill: 3, gpa: -0.1 });
    const lines = [
      { t: K.log.join('。') + '。' },
      { t: won ? '你抢到了水课。全班 0.4 秒的插件战争里，你是那 12% 的人类胜利。'
               : '你抢到的，是没人要的《高等数理方程》。这是手速的失败，也是知识的胜利——安慰一下自己。', big: 1 },
      { t: won ? '（绩点 +0.3，心情 +2。你把截图发进了家族群。）'
               : '（技能 +3。教授说：选我课的，都是想学习的。——他是全校唯一这么想的。）', small: 1 }
    ];
    G.cine(lines, 'paper', done);
  }
  startRound();
};

/* ---------- 支线：骑手 ---------- */
G.SCENES.rider = function (b, done) {
  const S = G.S;
  if (!S.rider) { S.rider = { i: 0, fine: 0, crash: 0, fast: 0 }; G.save(); }
  const R = S.rider;
  const orders = ['写字楼 · 距离 3.2km · 剩余 8 分钟', '老小区 · 无电梯 · 6 楼 · 剩余 5 分钟', '商场 · 取餐排队 4 分钟 · 剩余 6 分钟'];
  function end() {
    clearTimeout(window.__riderTO);
    S.flags.rider = 1;
    G.pushRoll('支线', '骑手算法', 2, S.hid.R * 0.3, G.luck3() * 10, R.crash * 6 + R.fast * 3, R.fast * 2);
    G.save();
    G.cine([
      { t: '这一天结束：' + (R.fine ? '超时罚款 ' + R.fine * 50 + ' 元。' : '没有超时。') + (R.crash ? '摔了 ' + R.crash + ' 次，膝盖还在渗血。' : '') },
      { t: '手机弹出通知：' },
      { t: '“根据您的配送数据，系统已为您优化配送时间：每单再压缩 30 秒。”', big: 1 },
      { t: '它管这个叫优化。' },
      { t: '明天，红灯还是三秒，时间又少了三十。' }
    ], 'dark', done);
  }
  function render() {
    if (R.i >= 3) { end(); return; }
    clearTimeout(window.__riderTO);
    G.show(
      '<div class="cardbox"><span class="app-chip">骑手 · 第 ' + (R.i + 1) + ' 单</span>' +
      '<div class="card-title">' + orders[R.i] + '</div>' +
      '<div class="rider-timer"><i id="rd-bar" style="width:100%;transition:width 1.5s linear"></i></div>' +
      '<div class="card-text" style="font-size:14px;color:var(--ink2)">绿灯读秒。<b>1.5 秒</b>内不做选择，就是犹豫超时。</div>' +
      '<div class="choices">' +
      '<button class="btn" id="r-wait">等红灯（守规矩，可能超时）</button>' +
      '<button class="btn red" id="r-run">闯过去（快，但……）</button></div></div>', {});
    requestAnimationFrame(() => { const bb = G.$('#rd-bar'); if (bb) bb.style.width = '0%'; });
    window.__riderTO = setTimeout(() => {
      R.fine++;
      G.toast('犹豫超时：罚款 50 元。系统不奖励思考。');
      R.i++; G.save(); render();
    }, 1500);
    G.$('#r-wait').onclick = () => {
      clearTimeout(window.__riderTO);
      if (G.chance(0.5)) { R.fine++; G.toast('超时。罚款 50 元。顾客投诉：慢。'); }
      else G.toast('卡点送到。差 10 秒。');
      R.i++; G.save(); render();
    };
    G.$('#r-run').onclick = () => {
      clearTimeout(window.__riderTO);
      if (G.chance(0.3)) { R.crash++; G.applyFx({ health: -12 }); G.toast('摔车。餐洒了。赔偿 80 元，罚款 50 元，膝盖自费。'); }
      else { R.fast++; G.toast('提前 4 分钟送达。系统记住了：你还能更快。'); }
      G.hud();
      R.i++; G.save(); render();
    };
  }
  render();
};

/* ---------- 支线：考公 ---------- */
G.SCENES.kaogong = function (b, done) {
  const S = G.S;
  if (!S.kq) { S.kq = { i: 0, iq: 0, int: 0, score: 0, done: false, ok: null }; G.save(); }
  const K = S.kq;
  K.iq = K.iq || 0; K.int = K.int || 0;
  function result() {
    if (K.ok === null) {
      let p = 0.22;
      if (S.attrs.edu >= 3) p += 0.18; else if (S.attrs.edu >= 2) p += 0.08;
      p += Math.max(0, G.luck3()) * 0.15 + K.score * 0.04;
      if (!K.int) K.int = 0;
      p += K.int * 0.1;
      K.ok = G.rng() < Math.min(0.9, p);
      G.pushRoll('支线', '考公上岸', 2, S.attrs.edu * 6, G.luck3() * 14, K.score * 6 + K.int * 8, K.score * 4);
      if (K.ok) S.flags.kaogongOk = 1;
      G.save();
    }
    const intNote = K.int >= 2 ? '面试官在你的表上画了两个圈。' :
      K.int === 1 ? '面试官不置可否地点了点头。' : '面试官的表情，像在看一份模板。';
    G.cine(K.ok ? [
      { t: intNote },
      { t: '成绩公布。' },
      { t: '岗位第一，进入体检。', big: 1 },
      { t: '1532 人报名，1 个人上岸。这次是你。' },
      { t: '你在工位上写材料到晚上九点。' },
      { t: '你忽然想不起来，岸是什么样子。', big: 1 }
    ] : [
      { t: intNote },
      { t: '成绩公布。' },
      { t: '差 0.5 分，没进面。', big: 1 },
      { t: '0.5 分。前面有 3 个并列的满分作文句式，后面有 1529 个和你一样的人。' },
      { t: '妈妈说：”再考一年？”' }
    ], 'paper', done);
  }
  function interview() {
    if (K.iq >= C.kgInterview.length) { result(); return; }
    const Q = C.kgInterview[K.iq];
    G.show(
      '<div class="cardbox"><span class="app-chip">结构化面试 · 第 ' + (K.iq + 1) + ' 问</span>' +
      '<div class="exam-q">' + Q.q + '</div>' +
      '<div class="exam-opts">' + Q.opts.map((o, i) =>
        '<button class="btn opt" data-i="' + i + '">' + o.t + '</button>').join('') + '</div>' +
      '<div id="why"></div></div>', {});
    G.$('#scene').querySelectorAll('.opt').forEach(btn => {
      btn.onclick = () => {
        const o = Q.opts[+btn.dataset.i];
        if (o.good) K.int++;
        btn.classList.add(o.good ? 'ok' : 'no');
        G.$('#why').innerHTML = '<div class="exam-why">' + o.r + '</div>' +
          '<div style="height:10px"></div><button class="btn primary center" id="kn">' +
          (K.iq >= C.kgInterview.length - 1 ? '等结果 ▸' : '下一问 ▸') + '</button>';
        G.$('#kn').onclick = () => { K.iq++; G.save(); render(); };
      };
    });
  }
  function render() {
    if (K.i >= C.kaogongQuiz.length) { interview(); return; }
    const q = C.kaogongQuiz[K.i];
    G.show(
      '<div class="cardbox"><span class="app-chip">行测模拟 · 第 ' + (K.i + 1) + ' 题</span>' +
      '<div class="exam-q">' + q.q + '</div>' +
      '<div class="exam-opts">' + q.opts.map((o, i) =>
        '<button class="btn opt" data-i="' + i + '">' + o + '</button>').join('') + '</div>' +
      '<div id="why"></div></div>', {});
    G.$('#scene').querySelectorAll('.opt').forEach(btn => {
      btn.onclick = () => {
        const i = +btn.dataset.i, ok = i === q.a;
        if (ok) K.score++;
        btn.classList.add(ok ? 'ok' : 'no');
        G.$('#why').innerHTML = '<div class="exam-why">' + (ok ? '✓ ' : '✗ ') + q.why + '</div>' +
          '<div style="height:10px"></div><button class="btn primary center" id="kn">' +
          (K.i >= 2 ? '看结果 ▸' : '下一题 ▸') + '</button>';
        G.$('#kn').onclick = () => { K.i++; G.save(); render(); };
      };
    });
  }
  render();
};

/* ---------- v1.5：开店线 · 签约（可拒签） ---------- */
G.SCENES.kzSign = function (b, done) {
  const S = G.S;
  G.show(
    '<div class="cardbox"><span class="app-chip">总部 · 19 层</span>' +
    '<div class="card-title">签约日</div>' +
    '<div class="card-text">合同 26 页。招商经理翻到最后一页，指着签名栏：“今天签，立减 8000，名额就剩俩了。”你前面“排队”的那位，已经是第三次出现在大厅了。</div>' +
    '<div class="choices">' +
    '<button class="btn" id="kz-yes">签（立减 8000，就现在）</button>' +
    '<button class="btn red" id="kz-no">不签了</button></div></div>', {});
  G.$('#kz-yes').onclick = () => {
    G.applyFx({ money: -13 });
    S.flags.kz = 1;
    G.insert([
      { t: 'fn', id: 'budget' },
      { t: 'card', app: C.kd.zhuangxiu.app, who: C.kd.zhuangxiu.who, title: C.kd.zhuangxiu.title, text: C.kd.zhuangxiu.text, ch: C.kd.zhuangxiu.ch },
      { t: 'card', app: C.kd.kaiye.app, who: C.kd.kaiye.who, title: C.kd.kaiye.title, text: C.kd.kaiye.text, ch: C.kd.kaiye.ch },
      { t: 'card', app: C.kd.bengta.app, who: C.kd.bengta.who, title: C.kd.bengta.title, text: C.kd.bengta.text, ch: C.kd.bengta.ch },
      { t: 'card', app: C.kd.shenye.app, who: C.kd.shenye.who, title: C.kd.shenye.title, text: C.kd.shenye.text, ch: C.kd.shenye.ch },
      { t: 'fn', id: 'lianxian' },
      { t: 'fn', id: 'evid' },
      { t: 'fn', id: 'weiquan' }
    ]);
    G.save();
    done();
  };
  G.$('#kz-no').onclick = () => {
    S.flags.chutan = 1;
    G.save();
    G.cine([
      { t: '你没签。招商经理的脸瞬间冷了下来：“再考虑考虑，优惠今天截止。”' },
      { t: '你说你考虑好了——不考虑了。', big: 1 },
      { t: '一周后，你在批发市场支起了摊。' },
      { t: '勇哥是谁？你还不知道。但你会知道的。', small: 1 }
    ], 'paper', done);
  };
};

/* ---------- v1.5：开店线 · 预算分配（30 万怎么花） ---------- */
G.SCENES.budget = function (b, done) {
  const S = G.S;
  if (!S.bud) { S.bud = { v: { fang: 5, zx: 8, sb: 4, yu: 0 } }; G.save(); }
  const B = S.bud;
  const FREE = 17; // 30 万 − 加盟费 12.8 万（取整）
  function render() {
    const t = B.v.fang + B.v.zx + B.v.sb + B.v.yu;
    const ok = t === FREE;
    G.show(
      '<div style="max-width:360px;margin:0 auto">' +
      '<div class="hint-top">加盟费 12.8 万已缴 · 剩余资金分配</div>' +
      '<div class="card-title">这 17 万，怎么花？</div>' +
      '<div class="sched-warn" style="background:#fdf9ec;border-color:#e5d9b0;color:#7a5c00">招商经理：“装修拉满！备用金为零！钱要生钱！”</div>' +
      C.kd.rows.map(r =>
        '<div class="sched-row' + (r.id === 'yu' && B.v.yu === 0 ? ' cut' : '') + '">' +
        '<span class="sr-name">' + r.name + '<small>　' + r.voice + '有话说</small></span>' +
        '<b style="font-variant-numeric:tabular-nums">' + B.v[r.id] + ' 万</b></div>' +
        '<input type="range" class="bud-r" data-id="' + r.id + '" min="0" max="' + FREE + '" step="1" value="' + B.v[r.id] + '">').join('') +
      '<div class="sched-total' + (ok ? ' ok' : ' over') + '">已分配 ' + t + ' / ' + FREE + ' 万</div>' +
      (t < FREE ? '<div class="gacha-note" style="text-align:center">还剩 ' + (FREE - t) + ' 万没花出去。钱不会自己消失。</div>' : '') +
      '<div class="choices"><button class="btn primary center" id="bd-sub" ' + (ok ? '' : 'disabled') + '>按这个方案开干 ▸</button></div>' +
      '<div class="lucky-link"><a id="bd-trap">听招商经理的（装修拉满，备用金 0）</a></div>' +
      '</div>', {});
    G.$('#scene').querySelectorAll('.bud-r').forEach(sl => {
      sl.oninput = () => {
        B.v[sl.dataset.id] = +sl.value;
        render();
      };
    });
    G.$('#bd-trap').onclick = () => {
      B.v = { fang: 5, zx: 8, sb: 4, yu: 0 };
      G.toast('招商经理竖起了大拇指。');
      G.save();
      render();
    };
    const sub = G.$('#bd-sub');
    if (sub) sub.onclick = () => {
      G.toast('备用金：' + B.v.yu + ' 万。');
      G.save();
      done();
    };
  }
  render();
};

/* ---------- v1.5：开店线 · 连线勇哥 ---------- */
G.SCENES.lianxian = function (b, done) {
  const S = G.S;
  if (!S.lx) { S.lx = { q: 0, photoed: 0 }; G.save(); }
  const L = S.lx;
  clearInterval(window.__liveInt);
  const QA = [
    {
      q: '兄弟别急，慢慢说。加盟费，交了多少？',
      opts: [
        { t: '12.8 万，全交了', r: '……嗯。' },
        { t: '分期的，还欠着公司钱', r: '还欠钱？那更得抓紧，别让利息骑到你头上。' },
        { t: '用的是裁员赔偿金', r: '赔偿金也敢套进去……行。那你更得听我说完。' }
      ]
    },
    {
      q: '合同还在吗？',
      opts: [
        { t: '在，我拍照了', r: '好。原件别离手，照片再传一份云备份。', fx: 1 },
        { t: '扔了', r: '……扔了？行。那聊天记录就是你的命。' },
        { t: '只有电子版', r: '电子版也算。多拍几份，存三个地方。', fx: 1 }
      ]
    },
    {
      q: '转账记录、和招商经理的聊天记录，都留了吗？',
      opts: [
        { t: '都留了', r: '好。这些都是证据。' },
        { t: '删了一部分', r: '删了的找不回来就算了。留着的，都算数。' },
        { t: '全在，但不知道有没有用', r: '有没有用不归你判断。交给法官判断。' }
      ]
    }
  ];
  function live() {
    G.show(
      '<div class="live"><div class="live-top"><span class="live-name">勇哥说餐饮 · 直播间</span>' +
      '<span class="live-stat">在线 23,417 · 连麦排队 47</span></div>' +
      '<div class="dm-layer" id="liveLayer"></div>' +
      '<button class="btn red center" id="lx-go" style="position:absolute;left:10%;right:10%;bottom:24px;z-index:3">申请连麦（排队 47）▸</button>' +
      '</div>', { bleed: true, noscroll: true, cls: 'noscroll' });
    const layer = G.$('#liveLayer');
    window.__liveInt = setInterval(() => {
      const pool = window.DANMAKU.yongge;
      const d = document.createElement('div');
      d.className = 'dm-item';
      d.style.top = (5 + Math.random() * 78) + '%';
      d.style.fontSize = (12 + Math.random() * 7) + 'px';
      d.style.animationDuration = (4 + Math.random() * 4) + 's';
      d.textContent = pool[Math.floor(Math.random() * pool.length)];
      layer.appendChild(d);
      setTimeout(() => d.remove(), 8500);
    }, 320);
    G.$('#lx-go').onclick = () => {
      clearInterval(window.__liveInt);
      qa();
    };
  }
  function qa() {
    const i = L.q;
    if (i >= QA.length) { summary(); return; }
    const Q = QA[i];
    const sc = G.show(
      '<div class="live"><div class="live-top"><span class="live-name">连线中 · 勇哥</span>' +
      '<span class="live-stat live-on">● LIVE</span></div>' +
      '<div class="lx-body"><div class="lx-q">勇哥：' + Q.q + '</div>' +
      '<div class="choices">' + Q.opts.map((o, k) =>
        '<button class="btn" data-k="' + k + '">' + o.t + '</button>').join('') +
      '</div><div id="lxr"></div></div></div>', { bleed: true, noscroll: true, cls: 'noscroll' });
    sc.querySelectorAll('.choices .btn').forEach(btn => {
      btn.onclick = () => {
        const o = Q.opts[+btn.dataset.k];
        if (o.fx) L.photoed = 1;
        G.$('#lxr').innerHTML = '<div class="reply">勇哥：“' + o.r + '”</div>' +
          '<button class="btn primary center" id="lxn">▸</button>';
        sc.querySelector('.choices').style.display = 'none';
        G.$('#lxn').onclick = () => { L.q++; G.save(); qa(); };
      };
    });
  }
  function summary() {
    clearInterval(window.__liveInt);
    G.cine([
      { t: '勇哥在屏幕那头沉默了两秒。' },
      { t: '“兄弟，你这情况，我今天连了三十个，都一样。”', big: 1 },
      { t: '“不是你傻，是他们专业干这个的。”', big: 1 },
      { t: '“市监局投诉免费，法院立案也免费。骗子最怕你较真。”' },
      { t: '“店可以倒，人不能倒。止损，也是一种本事。”' },
      { t: '弹幕刷过一排：“世界破破烂烂，勇哥缝缝补补。”', small: 1 }
    ], 'dark', done);
  }
  live();
};

/* ---------- v1.5：开店线 · 证据收集 ---------- */
G.SCENES.evid = function (b, done) {
  const S = G.S;
  if (!S.ev) {
    const tiles = C.kd.evid.map((x, i) => ({ t: x.t, ok: x.ok, i }));
    for (let k = tiles.length - 1; k > 0; k--) { const j = Math.floor(G.rng() * (k + 1)); [tiles[k], tiles[j]] = [tiles[j], tiles[k]]; }
    S.ev = { tiles, found: [], wrong: 0 };
    G.save();
  }
  const E = S.ev;
  function render() {
    const doneAll = E.found.length >= 4;
    G.show(
      '<div style="max-width:360px;margin:0 auto;text-align:center">' +
      '<div class="hint-top">勇哥：把你手里的证据，都翻出来</div>' +
      '<div class="card-title">证据 ' + E.found.length + ' / 4</div>' +
      '<div class="ev-grid">' + E.tiles.map(t =>
        '<button class="ev-tile' + (E.found.includes(t.t) ? ' found' : '') + '" data-t="' + t.t + '">' +
        (E.found.includes(t.t) ? '✓ ' + t.t : '？？') + '</button>').join('') +
      '</div>' +
      '<div class="zy-note">' + (doneAll ? '勇哥：“齐了。够较真一场了。”' : '翻翻你的手机。有用的留下，没用的别浪费时间。') + '</div>' +
      (doneAll ? '<div class="choices"><button class="btn primary center" id="ev-go">决定怎么维权 ▸</button></div>' : '') +
      '</div>', {});
    G.$('#scene').querySelectorAll('.ev-tile').forEach(btn => {
      btn.onclick = () => {
        const t = btn.dataset.t;
        const meta = E.tiles.find(x => x.t === t);
        if (E.found.includes(t)) return;
        if (meta && meta.ok) {
          E.found.push(t);
          try { G.sfx && G.sfx.ok(); } catch (e) {}
        } else {
          E.wrong++;
          btn.classList.add('shake');
          try { G.sfx && G.sfx.no(); } catch (e) {}
          G.toast('勇哥：这不是证据，兄弟。');
          setTimeout(render, 450);
          return;
        }
        G.save();
        render();
      };
    });
    const go = G.$('#ev-go');
    if (go) go.onclick = done;
  }
  render();
};

/* ---------- v1.5：开店线 · 维权四选 ---------- */
G.SCENES.weiquan = function (b, done) {
  const S = G.S;
  const n = S.ev.found.length;
  const strong = n >= 3;
  const advice = strong
    ? '勇哥：“证据够。想快就协商，想较真就立案。”'
    : '勇哥：“证据不到三样，立案悬。要么协商拿回点，要么止损。”';
  const opts = [
    { label: '协商（拿回一部分，签保密协议）', id: 'xie', on: true },
    { label: '市监局投诉调解' + (strong ? '' : '（证据不足）'), id: 'shichang', on: true, disabled: !strong },
    { label: '起诉立案' + (strong ? '' : '（证据不足）'), id: 'qisu', on: true, disabled: !strong },
    { label: '认栽，止损', id: 'ren', on: true }
  ];
  G.opts(opts,
    '<div class="cardbox"><span class="app-chip">维权</span>' +
    '<div class="card-title">证据 ' + n + ' / 4</div>' +
    '<div class="zy-note">' + advice + '</div></div>',
    opt => {
      if (opt.id === 'xie') {
        const refund = strong ? 5 : 2;
        G.applyFx({ money: refund });
        G.cine([
          { t: '招商公司同意退你 ' + refund + ' 万——条件是签保密协议。' },
          { t: '你签了。这不是和解，这是买你闭嘴的价钱。' },
          { t: '但那 ' + refund + ' 万，是真的。', big: 1 }
        ], 'paper', done);
      } else if (opt.id === 'shichang') {
        S.flags.xyg = 1;
        G.save();
        G.cine([
          { t: '市监局受理了。调解桌上，对方律师第一次收起了笑。' },
          { t: '公司退了你六成，先到账。', big: 1 },
          { t: '你把流程写成帖子：《被快招骗后，我这样拿回了钱》。' },
          { t: '评论区第一条：“快去连线勇哥。”你回复：勇哥让我来的。', small: 1 }
        ], 'paper', done);
      } else if (opt.id === 'qisu') {
        S.flags.an = 1;
        G.save();
        G.cine([
          { t: '立案成功。开庭排到八个月后。' },
          { t: '维权群有人退了，说耗不起。你留下了，顺手把群名改成：', },
          { t: '“第 19 页维权团”。', big: 1 }
        ], 'paper', done);
      } else {
        S.flags.chutan = 1;
        G.save();
        G.cine([
          { t: '你算了笔账：耗一年的精力，追不回 12.8 万。' },
          { t: '你把店转了——转给下一个拿着 N+1 的人。', big: 1 },
          { t: '然后你去了批发市场。' }
        ], 'paper', done);
      }
    });
};

/* ---------- 终幕：结局 ---------- */
G.SCENES.ending = function (b, done) {
  const S = G.S;
  if (!S.endId) {
    S.endId = G.resolveEnding();
    if (S.endId === 'changshan') G.unlockAch('changshan');
    if (S.endId === 'anshang') G.unlockAch('anshang');
    S.milestones.push({
      k: '组织架构调整', v: S.fam === 'roma' ? '不存在——名单由二舅写'
        : S.flags.tianxuan ? '（你中奖了，没赶上）'
        : S.work.layoff ? '在名单上（647 人之一）' : '不在名单上（你是幸存者）'
    }, { k: '结局', v: ENDINGS[S.endId].name });
    // 世系树与结局图鉴：跨局持久化
    if (!G.lineage.length || G.lineage[G.lineage.length - 1].run !== S.run) {
      G.lineage.push({
        run: S.run, seed: S.seed, ending: S.endId,
        fam: (C.families.find(f => f.id === S.fam) || { name: '' }).name,
        inh: S.inhName || ''
      });
      G.storeLineage();
    }
    if (!G.endSeen.includes(S.endId)) { G.endSeen.push(S.endId); G.storeEndSeen(); }
    G.save();
  }
  const e = ENDINGS[S.endId];
  const fl = (C.endingFlavors && C.endingFlavors[S.endId] && C.endingFlavors[S.endId][S.fam]) || e.flavor;
  G.show(
    '<div class="endcard"><div class="end-cap">结　局</div>' +
    '<div class="end-name">' + e.name + '</div>' +
    '<div class="end-quote">“' + e.quote + '”</div>' +
    '<div class="end-flavor">' + fl + '</div>' +
    '<div class="gacha-note" style="margin-bottom:20px">结局图鉴 ' + G.endSeen.length + ' / ' +
    Object.keys(ENDINGS).length + ' · 世系树已记录 ' + G.lineage.length + ' 世</div>' +
    '<div class="choices" style="max-width:300px;margin:0 auto">' +
    '<button class="btn primary center" id="ed-go">人生复盘 ▸</button></div></div>', { center: true });
  G.$('#ed-go').onclick = done;
};

/* ---------- 复盘报告 ---------- */
G.SCENES.report = function (b, done) {
  const S = G.S, q = G.quad();
  const pc = x => Math.round(x * 100);
  const rollRows = S.rolls.map(r =>
    '<div class="roll-row"><span class="rr-stage">' + r.stage + ' · ' + r.label + '</span>' +
    '<span class="rr-bar"><i style="width:' + Math.round(r.b * 100) + '%;background:var(--ink)"></i>' +
    '<i style="width:' + Math.round(r.l * 100) + '%;background:var(--red)"></i>' +
    '<i style="width:' + Math.round(r.c * 100) + '%;background:#9b948a"></i>' +
    '<i style="width:' + Math.round(r.e * 100) + '%;background:#fffdf8;border-left:1px solid #ddd"></i></span>' +
    '<span class="rr-pct">努力 ' + Math.round(r.e * 100) + '%</span></div>').join('');
  G.show(
    '<div style="max-width:360px;margin:0 auto">' +
    '<div class="report-cap">人 生 复 盘 报 告</div>' +
    G.stackbarHTML(q) +
    '<div class="report-note">你的一生，被拆解成四种成分。<br>“努力”那一格的宽度，可能会让你想说什么，又没说出口。</div>' +
    '<details class="rolls"><summary>查看骰子原始记录（每一次你不知道的 roll）</summary>' + rollRows + '</details>' +
    '<div class="choices"><button class="btn primary center" id="rp-go">平行人生对比 ▸</button></div>' +
    '<div class="lucky-link"><a id="rp-luck">我认为这一切都是我应得的 →</a></div></div>', {});
  G.$('#rp-go').onclick = done;
  G.$('#rp-luck').onclick = () => G.unlockAch('yunqi');
};

/* ---------- 平行人生 ---------- */
G.SCENES.parallel = function (b, done) {
  const S = G.S;
  if (!S.para) {
    // 平行者重算所需的“选择流”输入
    S.sim = S.sim || {
      edu: Math.max(0, S.attrs.edu), effortCh1: S.attrs.score,
      answerScore: S.exam.answerScore || 0,
      visPerDay: Math.max(6, (S.work.vis || 20) / 10),
      actualPerDay: Math.max(2, (S.work.actual || 20) / 10),
      workDays: 10
    };
    S.para = G.parallel();
    G.save();
  }
  const P = S.para;
  const rowsOf = ms => ms.map(m => '<div class="p-row"><span class="p-k">' + m.k + '</span>' + m.v + '</div>').join('');
  const pm = [
    { k: '高考', v: S.exam.gaokao ? (S.exam.gaokao + ' 分（' + S.hid.D.name + '）')
      : (S.exam.guoji ? '国际申请' : S.exam.yikao ? '艺考' : '家族会议') },
    S.milestones.filter(m => m.k === '录取').concat([{ k: '录取', v: '——' }])[0],
    S.milestones.filter(m => m.k === '毕业去向').concat([{ k: '毕业去向', v: '——' }])[0],
    { k: '第一份 offer', v: S.milestones.filter(m => m.k === '第一份 offer').map(m => m.v)[0] || '——' },
    S.milestones.filter(m => m.k === '组织架构调整').concat([{ k: '组织架构调整', v: '——' }])[0],
    { k: '结局', v: ENDINGS[S.endId].name }
  ];
  G.show(
    '<div style="max-width:360px;margin:0 auto">' +
    '<div class="report-cap">平 行 人 生 对 比</div>' +
    '<div class="report-note">同样的选择流。不同的出生。<br>右边那位，用一模一样的策略走完了它的一生。</div>' +
    '<div class="para">' +
    '<div class="para-col you"><h4>你 · ' + (C.families.find(f => f.id === S.fam) || { name: '小镇卡' }).name + '</h4>' + rowsOf(pm) + '</div>' +
    '<div class="para-col rome"><h4>平行者 · 罗马卡</h4>' + rowsOf(P.milestones) + '</div>' +
    '</div>' +
    '<div class="gacha-note" style="text-align:center">' + P.note + '</div>' +
    '<div style="height:12px"></div>' +
    '<div class="choices"><button class="btn primary center" id="pp-go">生成分享卡 ▸</button></div></div>', {});
  G.$('#pp-go').onclick = done;
};

/* ---------- v1.6：真结局《系统管理员》 ---------- */
G.SCENES.admin = function (b, done) {
  G.unlockAch('guanli');
  if (!G.endSeen.includes('admin')) { G.endSeen.push('admin'); G.storeEndSeen(); }
  G.cine([
    { t: '你集齐了十五种人生。', big: 1 },
    { t: '系统弹出一条从未显示过的通知：' },
    { t: '【管理员权限已开启】', big: 1 },
    { t: '你点开了所有人的卡面：罗马、中产、小镇——背面都印着同一行小字。' },
    { t: '"本卡池概率公示："', small: 1 },
    { t: '罗马 2% · 中产 18% · 小镇 80% · 系统 0% 保底', big: 1 },
    { t: '你以为你在玩游戏。', big: 1 },
    { t: '其实游戏在玩你。', big: 1 }
  ], 'dark', () => {
    const e = window.ENDINGS.admin;
    G.show(
      '<div class="endcard"><div class="end-cap">隐 藏 结 局</div>' +
      '<div class="end-name" style="color:var(--gold)">' + e.name + '</div>' +
      '<div class="end-quote">"' + e.quote + '"</div>' +
      '<div class="end-flavor">' + e.flavor + '</div>' +
      '<div class="choices" style="max-width:260px;margin:0 auto">' +
      '<button class="btn primary center" id="ad-back">回到标题 ▸</button></div></div>', { center: true });
    G.$('#ad-back').onclick = () => done && done();
  });
};

/* ---------- v1.13：中产高三出口三选一 ---------- */
G.SCENES.track3 = function (b, done) {
  const S = G.S;
  if (S.track) { done(); return; } // 存档恢复
  const T = C.track3.intro;
  G.show(
    '<div class="cardbox"><span class="app-chip">' + T.app + '</span>' +
    '<div class="card-title">' + T.title + '</div>' +
    '<div class="card-who">来自：' + T.who + '</div>' +
    '<div class="card-text">' + T.text + '</div>' +
    '<div class="zy-note">' + T.note + '</div>' +
    '<div class="choices">' +
    '<button class="btn" id="tr-gk">高考（峰哥已约，¥5980）</button>' +
    '<button class="btn" id="tr-gj">国际班（中介一条龙，¥30 万）</button>' +
    '<button class="btn" id="tr-yk">艺考（集训+校考，¥20 万）</button>' +
    '</div></div>', {});
  G.$('#tr-gk').onclick = () => { S.track = 'gaokao'; G.save(); done(); };
  G.$('#tr-gj').onclick = () => { S.track = 'guoji'; G.applyFx({ money: -30 }); G.save(); done(); };
  G.$('#tr-yk').onclick = () => { S.track = 'yikao'; G.applyFx({ money: -20 }); G.save(); done(); };
};

/* ---------- v1.13：中产路径闸门 ---------- */
G.SCENES.trackGate = function (b, done) {
  const S = G.S, T = S.track || 'gaokao';
  if (T === 'gaokao') {
    G.insert([
      { t: 'fn', id: 'exam' },
      { t: 'fn', id: 'province' },
      { t: 'fn', id: 'score' },
      { t: 'fn', id: 'zhiyuan' }
    ]);
    done();
    return;
  }
  if (T === 'guoji') {
    G.applyFx({ age: 18 });
    G.cine(C.track3.guoji, 'paper', () => {
      const tier = G.chance(0.5) ? 'overseas1' : 'overseas2';
      S.exam.tier = tier; S.exam.gaokao = null; S.exam.guoji = 1;
      S.attrs.edu = C.eduIdx[tier];
      G.S.milestones.push(
        { k: '高考', v: '国际申请（未参加）' },
        { k: '录取', v: C.unis[tier].name + '（' + C.unis[tier].tag + '）' },
        { k: '第一份 offer', v: G.F.offer('s211', S.hid, G.rng()) }
      );
      G.pushRoll('第二章', '国际申请', 4, S.hid.R * 2.2, G.luck3() * 6, 2, 0);
      G.hud();
      done();
    });
    return;
  }
  // 艺考
  G.applyFx({ age: 18 });
  G.cine(C.track3.yikao, 'paper', () => {
    const tier = S.attrs.skill >= 40 ? 's211' : 'yb';
    S.exam.tier = tier; S.exam.gaokao = 380 + S.attrs.skill * 2; S.exam.yikao = 1;
    S.attrs.edu = C.eduIdx[tier];
    G.S.milestones.push(
      { k: '高考', v: '艺考（文化课七折线）' },
      { k: '录取', v: C.unis[tier].name + '（' + C.unis[tier].tag + '）' },
      { k: '第一份 offer', v: G.F.offer(tier, S.hid, G.rng()) }
    );
    G.pushRoll('第二章', '艺考校考', 4, S.hid.R * 1.6, G.luck3() * 10, S.attrs.skill * 0.4, S.attrs.skill * 0.3);
    G.hud();
    done();
  });
};

/* ---------- v1.13：罗马 · 家族会议 ---------- */
G.SCENES.meeting = function (b, done) {
  const S = G.S;
  const M = C.roma.meeting;
  if (S.exam && S.exam.tier) { done(); return; } // 存档恢复
  G.show(
    '<div class="cardbox"><span class="app-chip">' + M.app + '</span>' +
    '<div class="card-title">' + M.title + '</div>' +
    '<div class="card-who">来自：' + M.who + '</div>' +
    '<div class="card-text">' + M.text + '</div>' +
    '<div class="choices">' + M.ch.map((c, i) =>
      '<button class="btn" data-i="' + i + '">' + c.label + '</button>').join('') +
    '</div></div>', {});
  document.querySelectorAll('#scene .choices .btn').forEach(btn => {
    btn.onclick = () => {
      const c = M.ch[+btn.dataset.i];
      G.applyChoice({ fx: c.fx, set: c.set, label: c.label });
      const tier = c.set.uni === 'domestic' ? 's985' : c.set.uni;
      S.exam = S.exam || {}; S.exam.tier = tier; S.exam.gaokao = null;
      S.attrs.edu = C.eduIdx[tier];
      S.milestones.push(
        { k: '高考', v: '家族会议（未参加）' },
        { k: '录取', v: C.unis[tier].name + '（' + C.unis[tier].tag + '）' }
      );
      sc2();
    };
  });
  function sc2() {
    const sc = document.querySelector('#scene');
    sc.querySelector('.card-text').insertAdjacentHTML('afterend',
      '<div class="reply">' + G.jargonify(M.ch.find(c => c.set.uni === (S.exam.tier === 's985' ? 'domestic' : S.exam.tier)).reply) + '</div>');
    sc.querySelector('.choices').innerHTML = '<button class="btn primary center cont">继续 ▸</button>';
    sc.querySelector('.cont').onclick = done;
    G.hud();
  }
};

/* ---------- v1.13：罗马 · 内推三选一 ---------- */
G.SCENES.offers = function (b, done) {
  const S = G.S;
  const O = C.roma.offers;
  G.card({ app: O.app, who: O.who, title: O.title, text: O.text, ch: O.ch }, () => {
    S.milestones.push({ k: '第一份 offer', v: '三家任选（都靠谱）' });
    G.save();
    done();
  });
};

/* ---------- v1.13：罗马 · 安排（接班/出走 + 终局追加重roll） ---------- */
G.SCENES.anpai = function (b, done) {
  const S = G.S;
  const A = C.roma.anpai;
  if (!S.anpaiDone) {
    G.pushRoll('终幕', '系统审计', 6, 85, 12, 3, 0);
    S.anpaiDone = 1;
    G.save();
  }
  G.show(
    '<div class="cardbox"><span class="app-chip">' + A.app + '</span>' +
    '<div class="card-title">' + A.title + '</div>' +
    '<div class="card-who">来自：' + A.who + '</div>' +
    '<div class="card-text">' + G.jargonify(A.text) + '</div>' +
    '<div class="choices">' + A.ch.map((c, i) =>
      '<button class="btn" data-i="' + i + '">' + c.label + '</button>').join('') +
    '</div></div>', {});
  document.querySelectorAll('#scene .choices .btn').forEach(btn => {
    btn.onclick = () => {
      const c = A.ch[+btn.dataset.i];
      G.applyChoice({ fx: c.fx, set: c.set, label: c.label });
      const sc = document.querySelector('#scene');
      sc.querySelector('.card-text').insertAdjacentHTML('afterend', '<div class="reply">' + c.reply + '</div>');
      sc.querySelector('.choices').innerHTML = '<button class="btn primary center cont">继续 ▸</button>';
      sc.querySelector('.cont').onclick = done;
    };
  });
};

/* ---------- v1.4：人格测试 ---------- */
G.SCENES.persona = function (b, done) {
  const S = G.S;
  function labelFor() {
    const q = G.quad();
    if ((S.hr && S.hr.safe >= 5) || S.endId === 'baishoutao') return C.personas[0];
    if (S.endId === 'tangping' || S.endId === 'tuisai' || (S.flags.tang || 0) >= 5) return C.personas[1];
    if (S.flags.tianxuan || q.l >= 0.4) return C.personas[2];
    if (q.e >= 0.38) return C.personas[3];
    if (q.b >= 0.55) return C.personas[4];
    return C.personas[5];
  }
  function reveal(guess) {
    if (!S.persona) {
      const q = G.quad(), real = Math.round(q.e * 100);
      const diff = guess - real;
      let verdict;
      if (diff > 15) verdict = '你猜 ' + guess + '%。实际 ' + real + '%。你高估了努力——优绩主义教的第一课，就是把运气记成汗水。';
      else if (diff < -15) verdict = '你猜 ' + guess + '%，实际 ' + real + '%。你比系统还低估自己。这不叫谦虚，叫被打怕了。';
      else {
        verdict = '你猜 ' + guess + '%，实际 ' + real + '%。猜得很准。看清牌面的人，才有资格谈下注。';
        if (Math.abs(diff) <= 5) G.unlockAch('renjian');
      }
      S.persona = { guess: guess, real: real, verdict: verdict, label: labelFor() };
      G.save();
    }
    const P = S.persona;
    G.show(
      '<div style="max-width:360px;margin:0 auto">' +
      '<div class="report-cap">你 的 优 绩 人 格</div>' +
      '<div class="report-note">' + P.verdict + '</div>' +
      '<div class="persona-card"><div class="pc-cap">人格鉴定</div>' +
      '<div class="pc-name">「' + P.label.name + '」</div>' +
      '<div class="pc-desc">' + P.label.desc + '</div></div>' +
      '<div class="choices"><button class="btn primary center" id="ps-go">看看别人的牌 ▸</button></div></div>', { center: true });
    G.$('#ps-go').onclick = done;
  }
  if (S.persona) { reveal(S.persona.guess); return; }
  const q = G.quad();
  const pc = x => Math.round(x * 100);
  G.show(
    '<div style="max-width:360px;margin:0 auto">' +
    '<div class="report-cap">复 盘 之 后 · 最 后 一 问</div>' +
    '<div class="card-title">你觉得，你的人生里<br>「努力」占多少？</div>' +
    '<div class="zy-note">四色报告显示：出身 ' + pc(q.b) + '% ／ 运气 ' + pc(q.l) + '% ／ 选择 ' + pc(q.c) + '% ／ 努力 ' + pc(q.e) + '%。<br>先别说，猜个数。</div>' +
    '<div class="guess-val"><b id="gv">50</b>%</div>' +
    '<input type="range" id="gslider" min="0" max="100" step="1" value="50">' +
    '<div class="choices"><button class="btn primary center" id="ps-go">揭晓 ▸</button></div></div>', { center: true });
  const sl = G.$('#gslider');
  sl.oninput = () => { G.$('#gv').textContent = sl.value; };
  G.$('#ps-go').onclick = () => reveal(+sl.value);
};

/* ---------- v1.4：NPC 命运回响 ---------- */
G.SCENES.echoes = function (b, done) {
  const items = C.echoes.map(e => {
    const txt = (e.who === '同桌' && G.S.flags.chimian) ? e.tz : e.txt;
    return '<div class="echo-card"><b>◆ ' + e.who + '</b><p>' + txt + '</p></div>';
  }).join('');
  G.show(
    '<div style="max-width:360px;margin:0 auto">' +
    '<div class="report-cap">他 们 后 来</div>' +
    '<div class="zy-note" style="text-align:center">故事里有名字的人，也有各自的牌。</div>' +
    items +
    '<div class="gacha-note" style="text-align:center;margin:14px 0">过得最平静的那几个，都是退赛的。</div>' +
    '<div class="choices"><button class="btn primary center" id="ec-go">平行人生对比 ▸</button></div></div>', {});
  G.$('#ec-go').onclick = done;
};

/* ---------- 分享卡 ---------- */
G.SCENES.share = function (b, done) {
  const S = G.S, e = ENDINGS[S.endId], q = G.quad();
  const pc = x => Math.round(x * 100);
  const cv = document.createElement('canvas');
  cv.id = 'shareCv'; cv.width = 640; cv.height = 800;
  drawShare(cv, { e, q, S, pc });
  G.show(
    '<div style="max-width:340px;margin:0 auto">' +
    '<div class="report-cap">分 享 卡</div>' +
    '<div id="shareBox"></div>' +
    '<div class="share-actions">' +
    '<button class="btn small center" id="sh-dl">下载图片</button>' +
    '<button class="btn small center" id="sh-cp">复制文案</button></div>' +
    '<div style="height:14px"></div>' +
    '<div class="choices"><button class="btn primary center" id="sh-go">▸</button></div></div>', {});
  G.$('#shareBox').appendChild(cv);
  G.$('#sh-dl').onclick = () => {
    const a = document.createElement('a');
    a.download = '上岸_' + S.seed + '.png';
    a.href = cv.toDataURL('image/png');
    a.click();
  };
  G.$('#sh-cp').onclick = () => {
    const txt = (S.daily ? '【上岸 · 每日一签 ' + S.daily + '】' : '【上岸】') +
      '第 ' + S.run + ' 世 · 结局「' + e.name + '」' +
      (S.persona ? ' · 人格「' + S.persona.label.name + '」' : '') + '\n' +
      '出身 ' + pc(q.b) + '% ／ 运气 ' + pc(q.l) + '% ／ 选择 ' + pc(q.c) + '% ／ 努力 ' + pc(q.e) + '%\n' +
      '“' + e.quote + '”\n——你以为你在上岸，其实你在划向更深的海。';
    copyText(txt).then(() => G.toast('文案已复制'));
  };
  G.$('#sh-go').onclick = done;
};

/* ---------- 结束画面 ---------- */
G.SCENES.final = function (b, done) {
  const S = G.S;
  G.opts([
    { label: '再抽一次（你的孩子将继承这一世）', id: 'again' },
    { label: '就这样吧', id: 'enough' }
  ],
    '<div class="report-cap">第 ' + S.run + ' 世 · 完</div>' +
    '<div class="end-flavor" style="text-align:center">游戏结束了。<br>生活没有。</div>',
    opt => {
      if (opt.id === 'again') {
        G.meta.lastEnding = S.endId;
        G.meta.runs++; G.storeMeta();
        G.clearSave();
        G.newRun({ run: S.run + 1, lastEnding: S.endId });
        if (G.S.run >= 2) G.unlockAch('chongkai');
      } else {
        G.unlockAch('jieshou');
        G.clearSave();
        G.show(
          '<div class="endcard"><div class="end-cap">谢 谢 游 玩</div>' +
          '<div class="end-flavor" style="margin-top:20px">没有人理应配得上自己的成功，<br>正如没有人活该失败。<br><br>—— 本作致敬所有仍在海里的人</div>' +
          '<div class="choices" style="max-width:260px;margin:0 auto">' +
          '<button class="btn primary center" onclick="G.toTitle()">回到标题 ▸</button></div></div>', { center: true });
      }
    });
};

/* ---------- 复制文本兼容 file:// ---------- */
function copyText(txt) {
  if (navigator.clipboard && window.isSecureContext !== false) {
    return navigator.clipboard.writeText(txt).catch(() => fallback());
  }
  function fallback() {
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
    return Promise.resolve();
  }
  return fallback();
}
G.copyText = copyText;

/* ---------- 分享卡绘制 ---------- */
function drawShare(cv, d) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.fillStyle = '#f7f4ee'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#17161a'; ctx.lineWidth = 3; ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.fillStyle = '#7c150f'; ctx.fillRect(48, 48, 96, 96);
  ctx.fillStyle = '#f3e9dc'; ctx.font = '800 34px "Songti SC","SimSun",serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('上岸', 96, 98);
  ctx.fillStyle = '#17161a'; ctx.font = '26px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('第 ' + d.S.run + ' 世 · 结局', 170, 76);
  ctx.font = '800 44px "Songti SC","SimSun",serif';
  ctx.fillText('「' + d.e.name + '」', 170, 118);
  ctx.fillStyle = '#4a4640'; ctx.font = '20px sans-serif';
  wrapText(ctx, '“' + d.e.quote + '”', 48, 200, W - 96, 32);
  // 四色条
  const bx = 48, by = 300, bw = W - 96, bh = 56;
  const segs = [
    ['出身', d.q.b, '#17161a'], ['运气', d.q.l, '#c73326'],
    ['选择', d.q.c, '#9b948a'], ['努力', d.q.e, '#fffdf8']
  ];
  let x = bx;
  segs.forEach(s => {
    const w = bw * s[1];
    ctx.fillStyle = s[2]; ctx.fillRect(x, by, w, bh);
    if (s[0] === '努力') { ctx.strokeStyle = '#ccc'; ctx.strokeRect(x, by, w, bh); }
    x += w;
  });
  x = bx;
  segs.forEach(s => {
    const w = bw * s[1];
    ctx.fillStyle = s[2] === '#fffdf8' ? '#4a4640' : '#fff';
    ctx.font = '18px sans-serif'; ctx.textAlign = 'center';
    if (w > 60) ctx.fillText(s[0] + ' ' + Math.round(s[1] * 100) + '%', x + w / 2, by + bh / 2);
    x += w;
  });
  ctx.textAlign = 'left'; ctx.fillStyle = '#4a4640'; ctx.font = '16px sans-serif';
  wrapText(ctx, d.S.daily ? '每日一签 · ' + d.S.daily : '局号 #' + d.S.seed.toString(16).toUpperCase(), 48, 420, W - 96, 24);
  if (d.S.persona) {
    ctx.fillStyle = '#7c150f'; ctx.font = '700 22px "Songti SC","SimSun",serif';
    ctx.fillText('人格「' + d.S.persona.label.name + '」', 48, 462);
  }
  ctx.fillStyle = '#17161a'; ctx.font = '700 20px sans-serif';
  wrapText(ctx, '你以为你在上岸，其实你在划向更深的海。', 48, d.S.persona ? 500 : 470, W - 96, 30);
  ctx.fillStyle = '#a39c8d'; ctx.font = '13px sans-serif';
  ctx.fillText('The Shore · 《上岸》—— 一个关于优绩主义的讽刺模拟', 48, H - 60);
}
function wrapText(ctx, text, x, y, maxW, lh) {
  let line = '', yy = y;
  for (const ch of text) {
    if (ctx.measureText(line + ch).width > maxW) { ctx.fillText(line, x, yy); line = ch; yy += lh; }
    else line += ch;
  }
  if (line) ctx.fillText(line, x, yy);
}
