// 一次性脚本：v1.19 中产+3 专属卡 / 罗马措辞校准
const fs = require('fs');

/* ===== data/cards.js：中产 +3 ===== */
(function () {
  let s = fs.readFileSync('data/cards.js', 'utf8');
  const anchor = "    { sec: 4, ev: 1, app: '备忘录', who: '你自己', title: '55%',";
  if (!s.includes(anchor)) { console.error('mid anchor not found'); process.exit(1); }
  const newCards = "    { sec: 1, app: '邮件', who: '你自己', title: '主动争取',\n" +
    "      text: '你看到学校合作企业有个实习名额，但没有公开。你写了一封邮件给负责人，附上简历和一页你自己的项目方案。三天后他回复：“来聊聊吧。”',\n" +
    "      ch: [\n" +
    "        { label: '赴约', fx: { skill: 3, vis: 2 }, reply: '你争取到了。后来你发现，班上还有两个名额——但没人告诉他们。你没告诉他们。这就是中产教你的：想要就去要，但别声张。' },\n" +
    "        { label: '等公开', fx: { mood: -2 }, reply: '你等了。名额被另一个主动写邮件的同学拿走了。他不是比你强——他只是知道可以这样做。' }\n" +
    "      ] },\n" +
    "    { sec: 1, app: '客厅', who: '爸爸', title: '怕什么',\n" +
    "      text: '凌晨一点你起夜喝水，看到爸爸还在客厅用笔记本电脑看行业报告。你问他看什么，他说“了解一下”。你知道他不是在了解——他是在怕。怕公司裁员，怕行业消失，怕你家的阶层滑落到他没有退路。',\n" +
    "      ch: [\n" +
    "        { label: '坐下来陪他看', fx: { mood: 1, skill: 1 }, reply: '你们看了半小时。他讲了两个行业趋势。你听不太懂，但你听懂了一件事：他也在跑。这个家的人都在跑，只是没人喊累。' },\n" +
    "        { label: '说“爸早点睡”', fx: { mood: 0 }, reply: '他说“就来”。你回房间了。灯又亮了一个小时。' }\n" +
    "      ] },\n" +
    "    { sec: 4, ev: 1, app: '工位', who: '组长', title: '不讲道理',\n" +
    "      text: '组长把一个不属于你的锅扣到了你头上。你没有沉默——你拿着证据找到了组长，一条一条讲清楚。这是你从小学就学会的事：跟老师讲道理，跟校长讲道理。有时候有用，有时候没有。但你敢开口。',\n" +
    "      ch: [\n" +
    "        { label: '讲完了', fx: { vis: 2, mood: 2 }, reply: '组长说：“行，这次算你的。”你没有“赢”——但你知道自己没有错。这就够了。' },\n" +
    "        { label: '忍了', fx: { mood: -4 }, reply: '你忍了。你想起爸爸说过“职场上不要硬碰硬”。但你想起自己中学时跟校长讲道理的样子——你变了。' }\n" +
    "      ] },\n" +
    anchor;
  s = s.replace(anchor, newCards);
  fs.writeFileSync('data/cards.js', s);
  console.log('mid +3 cards added');
})();

/* ===== data/cards.js：罗马措辞校准 ===== */
(function () {
  let s = fs.readFileSync('data/cards.js', 'utf8');
  // 间隔年回复校准
  const gapOld = "        { label: '不发', fx: { mood: -1 }, reply: '你没发。说不清为什么——可能是怕被“寻找自己”这四个字烫到。' }";
  const gapNew = "        { label: '不发', fx: { mood: -1 }, reply: '你没发。不是为了低调——是你真的不确定，这算不算“做了什么”。' }";
  if (s.includes(gapOld)) s = s.replace(gapOld, gapNew);
  // Summer 增加试错权
  const summerOld = "        { label: '不想去', fx: { mood: 1 }, reply: '你换了家画廊实习，工资更低，开心更多。爸爸说：“随你，反正都一样。”' }";
  const summerNew = "        { label: '不想去', fx: { mood: 1 }, reply: '你换了家画廊实习，工资更低，开心更多。搞砸了也没关系——家里会兜底。这叫“积累经验”。不是每个人都能把失败叫积累的。' }";
  if (s.includes(summerOld)) s = s.replace(summerOld, summerNew);
  fs.writeFileSync('data/cards.js', s);
  console.log('roma calibration done');
})();

console.log('v1.19 data done');
