// 一次性脚本：重写 drawShare 支持三套皮肤
const fs = require('fs');
const f = 'js/engine.js';
let s = fs.readFileSync(f, 'utf8');
const oldSig = 'function drawShare(cv, d) {';
const endMarker = 'function wrapText';
const start = s.indexOf(oldSig);
const end = s.indexOf(endMarker);
if (start < 0 || end < 0) { console.error('anchors missing', start, end); process.exit(1); }

const newFn = `function drawShare(cv, d, skin) {
  skin = skin || 'paper';
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  const e = d.e, q = d.q, S = d.S;
  const kai = '"Songti SC","SimSun",serif';
  if (skin === 'obituary') {
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.fillStyle = '#fff'; ctx.font = '700 22px ' + kai;
    ctx.textAlign = 'center';
    ctx.fillText('讣　告', W / 2, 90);
    ctx.font = '16px sans-serif';
    const fn2 = S.fam === 'roma' ? '某「罗马」' : S.fam === 'mid' ? '某「中产」' : '某「小镇做题家」';
    ctx.fillText(fn2 + '，生于 1991。', W / 2, 140);
    ctx.fillText('卒于 2026' + (S.endId === 'linghuo' ? ' 组织架构调整。' : S.endId === 'anshang' ? ' 无限期材料撰写。' : '。'), W / 2, 168);
    ctx.fillStyle = '#ccc'; ctx.font = '14px sans-serif';
    ctx.fillText('"' + e.quote + '"', W / 2, 220);
    ctx.fillStyle = '#999'; ctx.font = '12px sans-serif';
    ctx.fillText('出身 ' + Math.round(q.b * 100) + '% / 运气 ' + Math.round(q.l * 100) + '% / 选择 ' + Math.round(q.c * 100) + '% / 努力 ' + Math.round(q.e * 100) + '%', W / 2, 280);
    ctx.fillText('享年 35 岁。', W / 2, 310);
    ctx.fillStyle = '#d33'; ctx.font = '700 16px sans-serif';
    ctx.fillText('—— 他在流水线上站了 12 小时，在工位上坐了 996 天，', W / 2, 380);
    ctx.fillText('在题海里游了 12 年。他一直以为自己在往岸上游。', W / 2, 404);
    ctx.fillStyle = '#888'; ctx.font = '12px sans-serif';
    ctx.fillText('The Shore', W / 2, H - 70);
    return;
  }
  if (skin === 'doc') {
    ctx.fillStyle = '#fdf5e6'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c00'; ctx.fillRect(40, 40, W - 80, 4);
    ctx.font = '700 26px ' + kai; ctx.textAlign = 'center'; ctx.fillStyle = '#c00';
    ctx.fillText('关于某同志人生复盘情况的通报', W / 2, 90);
    ctx.fillStyle = '#17161a'; ctx.font = '14px sans-serif'; ctx.textAlign = 'left';
    var dy = 140;
    var docs = [
      '根据《上岸》第 ' + S.run + ' 届领导小组统计，现将有关情况通报如下：',
      '一、出生成分：' + (C.families.find(function(f){return f.id===S.fam;}) || {name:'?'}).name + '。',
      '二、四色构成：出身 ' + Math.round(q.b*100) + '%，运气 ' + Math.round(q.l*100) + '%，选择 ' + Math.round(q.c*100) + '%，努力 ' + Math.round(q.e*100) + '%。',
      '三、结局认定："' + e.name + '"。"' + e.quote + '"',
      '四、处理意见：不予处理。人生不予补考。',
      '特此通报。'
    ];
    docs.forEach(function(t) {
      var lines2 = Math.ceil(ctx.measureText(t).width / (W - 112));
      for (var li = 0; li < lines2; li++) {
        ctx.fillText(t.slice(li * 30, (li + 1) * 30), 56, dy); dy += 26;
      }
      dy += 8;
    });
    ctx.fillStyle = '#c00'; ctx.font = '700 20px ' + kai;
    ctx.fillText('The Shore 领导小组', W - 220, H - 120);
    ctx.font = '13px sans-serif'; ctx.fillStyle = '#999';
    ctx.fillText(new Date().getFullYear() + ' 年 ' + (new Date().getMonth() + 1) + ' 月（印）', W - 220, H - 90);
    ctx.strokeStyle = '#c00'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(W - 100, H - 105, 32, 0, Math.PI * 2); ctx.stroke();
    ctx.font = '700 11px sans-serif'; ctx.fillStyle = '#c00'; ctx.textAlign = 'center';
    ctx.fillText('不予', W - 100, H - 110);
    ctx.fillText('补考', W - 100, H - 96);
    return;
  }
  // —— 纸面（默认）——
  ctx.fillStyle = '#f7f4ee'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#17161a'; ctx.lineWidth = 3; ctx.strokeRect(24, 24, W - 48, H - 48);
  ctx.fillStyle = '#7c150f'; ctx.fillRect(48, 48, 96, 96);
  ctx.fillStyle = '#f3e9dc'; ctx.font = '800 34px ' + kai;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('上岸', 96, 98);
  ctx.fillStyle = '#17161a'; ctx.font = '26px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('第 ' + S.run + ' 世 · 结局', 170, 76);
  ctx.font = '800 44px ' + kai;
  ctx.fillText('「' + e.name + '」', 170, 118);
  ctx.fillStyle = '#4a4640'; ctx.font = '20px sans-serif';
  wrapText(ctx, '"' + e.quote + '"', 48, 200, W - 96, 32);
  var bx = 48, by = 300, bw = W - 96, bh = 56;
  var segs = [
    ['出身', q.b, '#17161a'], ['运气', q.l, '#c73326'],
    ['选择', q.c, '#9b948a'], ['努力', q.e, '#fffdf8']
  ];
  var xx = bx;
  segs.forEach(function(sg) { var w2 = bw * sg[1]; ctx.fillStyle = sg[2]; ctx.fillRect(xx, by, w2, bh); if (sg[0] === '努力') { ctx.strokeStyle = '#ccc'; ctx.strokeRect(xx, by, w2, bh); } xx += w2; });
  xx = bx;
  segs.forEach(function(sg) { var w2 = bw * sg[1]; ctx.fillStyle = sg[2] === '#fffdf8' ? '#4a4640' : '#fff'; ctx.font = '18px sans-serif'; ctx.textAlign = 'center'; if (w2 > 60) ctx.fillText(sg[0] + ' ' + Math.round(sg[1] * 100) + '%', xx + w2 / 2, by + bh / 2); xx += w2; });
  ctx.textAlign = 'left'; ctx.fillStyle = '#4a4640'; ctx.font = '16px sans-serif';
  wrapText(ctx, S.daily ? '每日一签 · ' + S.daily : '局号 #' + S.seed.toString(16).toUpperCase(), 48, 420, W - 96, 24);
  if (S.persona) { ctx.fillStyle = '#7c150f'; ctx.font = '700 22px ' + kai; ctx.fillText('人格「' + S.persona.label.name + '」', 48, 462); }
  ctx.fillStyle = '#17161a'; ctx.font = '700 20px sans-serif';
  wrapText(ctx, '你以为你在上岸，其实你在划向更深的海。', 48, S.persona ? 500 : 470, W - 96, 30);
  ctx.fillStyle = '#a39c8d'; ctx.font = '13px sans-serif';
  ctx.fillText('The Shore · 上岸 —— 一个关于优绩主义的讽刺模拟', 48, H - 60);
}

`;

s = s.slice(0, start) + newFn + s.slice(end);
fs.writeFileSync(f, s);
console.log('drawShare rewritten with 3 skins');
