// resolver.js —— 种子随机、隐藏骰子记录、四色分解、平行人生
window.G = window.G || {};

/* ---------- 可复现随机（mulberry32） ---------- */
G.rngState = 1;
G.initRng = function (seed) { G.rngState = seed >>> 0 || 1; };
G.rng = function () {
  let t = (G.rngState = (G.rngState + 0x6D2B79F5) | 0);
  t = Math.imul(t ^ (t >>> 15), 1 | t);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
G.rint = (a, b) => a + Math.floor(G.rng() * (b - a + 1));
G.pick = arr => arr[Math.floor(G.rng() * arr.length)];
G.chance = p => G.rng() < p;
G.luck3 = () => G.rng() * 2 - 1; // -1..1

/* ---------- 隐藏骰子记录（四色：出身/运气/选择/努力） ---------- */
// 每次关键结算记录一份四元组（绝对值归一），w 为权重
G.pushRoll = function (stage, label, w, birth, luck, choice, effort) {
  const sum = Math.abs(birth) + Math.abs(luck) + Math.abs(choice) + Math.abs(effort) || 1;
  G.S.rolls.push({
    stage, label, w: w || 1,
    b: Math.abs(birth) / sum, l: Math.abs(luck) / sum,
    c: Math.abs(choice) / sum, e: Math.abs(effort) / sum
  });
};
// 聚合所有 roll → 四色占比
G.quad = function () {
  let W = 0, b = 0, l = 0, c = 0, e = 0;
  G.S.rolls.forEach(r => { W += r.w; b += r.b * r.w; l += r.l * r.w; c += r.c * r.w; e += r.e * r.w; });
  const t = (b + l + c + e) || 1;
  return { b: b / t, l: l / t, c: c / t, e: e / t };
};

/* ---------- 结算公式（同一套供本局与平行人生复用） ---------- */
G.F = {};

// 第一章：期末分数与排名（剧场效应：平均分 ×1.12/学期）
G.F.ch1 = function (a, hid, effort, luck, choiceBonus, terms) {
  const base = 60 + hid.R * 0.8;               // 出身：家庭基盘 + 资源转化
  const you = 100 + base + effort + luck + choiceBonus;
  const avg = 100 + (Math.pow(1.12, terms) - 1) * 42; // 全班平均（军备竞赛）
  const rank = Math.max(1, Math.min(50, Math.round(5 + (avg - you) / 12)));
  return { base, you: Math.round(you), avg: Math.round(avg), rank, luck, effort, choice: choiceBonus };
};

// 第二章：高考分
G.F.gaokao = function (a, hid, effort, answerScore, examLuck) {
  const birth = hid.R * 1.2 + hid.Dadj;        // 实际加到分数上的出身项
  const eff = effort * 1.15 + answerScore * 6; // 努力：十二年 + 答题表现
  const you = 380 + birth + eff + examLuck;
  // 四色归因：人人白得的制度基线（等效 120 分）也记在“出身”头上——
  // 它从来不是你挣来的，只是看起来像
  const quadBirth = 120 + birth;
  return { birth, quadBirth, eff, luck: examLuck, you: Math.round(you) };
};
// 各省 985 线 → 折算出身等效分
G.F.dadj = prov => (610 - prov.line.s985) * 0.8;

// 录取档位
G.F.admit = function (score, prov, peakBro, luckRoll) {
  const L = prov.line;
  let tier = score >= L.s985 ? 's985' : score >= L.s211 ? 's211' : score >= L.yb ? 'yb' : score >= L.eb ? 'eb' : 'zk';
  if (!peakBro && G.chance(luckRoll) && tier !== 'zk') tier = G.F.lower(tier); // 无信息差 → 滑档风险
  return tier;
};
G.F.lower = t => ({ s985: 's211', s211: 'yb', yb: 'eb', eb: 'zk' }[t] || 'zk');

// offer 档位文案
G.F.offer = function (tier, hid, luck) {
  const hot = luck > 0.5;
  if (tier === 's985') return hot ? '星海集团 SSP，核心部门' : '大厂 offer，SP 档';
  if (tier === 's211') return hot ? '独角兽，期权画饼套餐' : '中厂 offer，正常薪';
  if (tier === 'yb') return hot ? '中厂 offer，965' : '小公司，6000，大小周';
  if (tier === 'eb') return hot ? '外包驻场，转正遥遥无期' : '销售岗，底薪 3000';
  return hot ? '电子厂，包吃住' : '门店导购，卖课程';
};

// 职场绩效评级分
G.F.rating = function (w, hid, luck) {
  const birth = hid.G * 0.35;
  const choice = w.vis * 0.8;
  const effort = w.actual * 0.15;
  const luckP = luck * 18;
  return { birth, choice, effort, luck: luckP, total: birth + choice + effort + luckP };
};

// 大学章：绩点军备竞赛与毕业分流
G.F.uni = function (hid, gpaEffort, luck, choiceBonus) {
  const base = 1.1 + hid.R * 0.01;                  // 出身：不用打工的时间、信息、底气
  const gpa = base + gpaEffort + luck + choiceBonus;
  const avg = 2.55 + gpaEffort * 0.55;              // 全员水课水赛，专业平均分也在涨
  const rank = Math.max(1, Math.min(120, Math.round(120 * (3.7 - gpa) / 2.4)));
  return { base, gpa: Math.round(gpa * 100) / 100, avg: Math.round(avg * 100) / 100, rank, luck, effort: gpaEffort, choice: choiceBonus };
};

// 裁员判定：返回 true=被裁
G.F.layoff = function (hid, w, luck) {
  let p = 0.55;
  if (hid.G < 30) p += 0.25;
  if (hid.R < 30) p += 0.05;
  if (w.vis >= 90) p += 0.08;   // 成本最高
  if (w.tang >= 4) p += 0.10;   // “心不在公司”
  if (hid.G >= 70) p -= 0.22;   // 关系户保护：名单是按亲疏排的
  p -= luck * 0.18;
  return G.rng() < Math.max(0.05, Math.min(0.97, p));
};

/* ---------- 平行人生（v1.13：非罗马玩家看"罗马重放"；罗马玩家看"小镇重放"） ---------- */
G.parallel = function () {
  const S = G.S, si = S.sim;
  const isRoma = S.fam === 'roma';
  const hid = isRoma
    ? { R: 15, G: 5, D: C.provinces[2], Dadj: G.F.dadj(C.provinces[2]), int: 66 } // 山河省小镇
    : { R: 90, G: 80, D: C.provinces[0], Dadj: G.F.dadj(C.provinces[0]), int: 75 }; // 海京省罗马
  const a = { edu: si.edu };

  const examLuckP = (G.rng() * 2 - 1) * 32;
  const gk = G.F.gaokao(a, hid, si.effortCh1, si.answerScore, examLuckP);
  const provP = hid.D;
  const peakBro = hid.R >= 55;
  const tierP = G.F.admit(gk.you, provP, peakBro, 0.02);
  const offerP = G.F.offer(tierP, hid, G.rng());

  const days = si.workDays || 10;
  const visP = si.visPerDay * days * (isRoma ? 1 : 1.15);
  const rating = G.F.rating({ vis: visP, actual: si.actualPerDay * days, tang: 0 }, hid, 0.5);
  const layoff = G.F.layoff(hid, { vis: visP, tang: 0 }, isRoma ? -0.4 : 0.6);
  const luckShare = (rating.luck / (rating.total || 1)) * 0.72 + 0.2;

  return {
    birth: isRoma ? '小镇卡 · 山河省' : '罗马卡 · 海京省',
    milestones: [
      { k: '高考', v: gk.you + ' 分（' + provP.name + '）' },
      { k: '录取', v: C.unis[tierP].name + '（' + C.unis[tierP].tag + '）' },
      { k: '第一份 offer', v: offerP },
      { k: '组织架构调整', v: layoff ? '在名单上（替补了一名亲戚的名额）' : '不在名单上（名单是按亲疏排的）' },
      { k: '结局', v: layoff ? (isRoma ? '灵活就业 → 没有家里兜底' : '灵活就业 → 但家里三套房') : (luckShare > 0.6 ? '绩效 A' : '明星员工') }
    ],
    ending: layoff ? 'linghuo' : (luckShare > 0.6 ? 'jixiaoA' : 'mingxing'),
    note: isRoma
      ? '同样的选择流，抽到小镇卡的话——你的人生会是这样。你没做错什么，只是每一格运气都被起始坐标改写了。'
      : (layoff ? '被裁后，他去了马尔代夫“gap 一下”。你的平行人生第一次输给了自己的出生。'
                : '同样的选择，不同的出生。他甚至没努力——不，他也努力了，只是他的努力是“能看见的”。')
  };
};

/* ---------- 结局判定 ---------- */
G.resolveEnding = function () {
  const f = G.S.flags;
  if (f.tianxuan) return 'tianxuan';
  if (f.shixi) return 'shixi';
  if (f.chuzou) return 'chuzou';
  if (f.dagong) return 'liushui';
  if (f.fakao) return 'fankang';
  if (f.tuisai) return 'tuisai';
  if (f.an) return 'an';
  if (f.xyg) return 'xiayongge';
  if (f.chutan) return 'chutan';
  if (f.kaogongOk) return 'anshang';
  if (f.rider) return 'linghuo';
  if (f.child) return 'jilibang';
  if (f.retained) return (G.S.work.luckShare > 0.45 || G.S.hid.G >= 70) ? 'jixiaoA' : 'mingxing';
  if (G.S.hr && G.S.hr.safe >= 5) return 'baishoutao';
  if ((G.S.flags.tang || 0) >= 5) return 'tangping';
  if (G.S.attrs.edu >= 2) return 'changshan';
  return 'chongkai';
};
