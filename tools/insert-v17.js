// 一次性脚本：v1.17 数据层（反事实回响池 + 打工支线 + 流水线结局 + 皮肤文案）
const fs = require('fs');

/* ===== data/cards.js ===== */
(function () {
  let s = fs.readFileSync('data/cards.js', 'utf8');

  // 1) 反事实回响池
  const cfAnchor = "// ============ v1.7：出生专属事件卡（同一条流水线，不同的工位） ============";
  if (!s.includes(cfAnchor)) { console.error('CF anchor not found'); process.exit(1); }
  s = s.replace(cfAnchor, "// ============ v1.17：反事实回响池 ============\n" +
    "C.counterfactuals = [\n" +
    "  { cond: S => S.flags.hengshui, text: '如果那天你没有严格执行作息表——如果你多睡了那一个小时，哪怕只是多睡了那一个小时……' },\n" +
    "  { cond: S => S.flags.fubao >= 3, text: '如果你在那些夜晚早点关灯回家……你可能会被提前优化，也可能会被留下来。你永远不会知道。' },\n" +
    "  { cond: S => S.track === 'guoji', text: '如果当年你没有选国际班，而是坐进了高考考场——你的竞争对手会多一个你，独木桥上会多一副肩膀。' },\n" +
    "  { cond: S => S.track === 'gaokao' && S.fam === 'mid', text: '如果当年你选了国际班，你不会认识那些一起熬夜的朋友，也不会知道一杯奶茶要排多久的队。' },\n" +
    "  { cond: S => S.flags.kaidian, text: '如果那天你没有签那份合同——你可能会走一条更安全的路，也更看不见的路。' },\n" +
    "  { cond: S => S.flags.quanzhi, text: '如果那天她没有辞职——你家会多一份收入，少一个全职的妈妈。孩子会在两种忙之间长大。' },\n" +
    "  { cond: S => G.S.hr && G.S.hr.safe > 3, text: '如果你在 HR 的位置上多给几次面试机会——你会被上级骂，但也可能改变了某个人的轨迹。也可能不会。你永远不会知道。' },\n" +
    "  { cond: S => S.flags.baoyan, text: '如果你差了那 0.1 绩点，没能保研——你会走一条更弯的路，但弯路上你会遇见不同的人。' }\n" +
    "];\n\n" + cfAnchor);

  // 2) 打工支线 6 拍
  const dzAnchor = "// ============ v1.7：结局 flavor 双版本 ============";
  if (!s.includes(dzAnchor)) { console.error('DZ anchor not found'); process.exit(1); }
  s = s.replace(dzAnchor, "// ============ v1.17：小镇打工支线 ============\n" +
    "C.dagong = {\n" +
    "  choice: {\n" +
    "    app: '学校门口', who: '表哥', title: '厂里缺人',\n" +
    "    text: '表哥的摩托车停在校门口。“厂里缺人，一个月六千，包吃住。你不是天天说读书没意思吗？”他的后座绑着你的行李——他早就替你收好了。',\n" +
    "    ch: [\n" +
    "      { label: '跟表哥走', fx: { mood: -2 }, set: { dagong: 1 }, reply: '你跨上后座。摩托车驶过你每天走的校门，你回头看了一眼——看的是人，不是学校。' },\n" +
    "      { label: '回去备考', fx: { mood: 1 }, reply: '你说“我要高考”。表哥愣了一下，然后说：“行。”他调转车头，你走进校门。你没有回头。' }\n" +
    "    ]\n" +
    "  },\n" +
    "  beats: [\n" +
    "    { app: '工厂', who: '第一天', title: '流水线',\n" +
    "      text: '早上八点站上流水线，晚上八点换班。你的工作是把一块电池翻个面放进卡槽。第一天你数了：1174 次。之后你不再数了。',\n" +
    "      ch: [\n" +
    "        { label: '继续', fx: { mood: -2, health: -3 }, reply: '你继续翻。手酸到没有感觉之后，反而不酸了。' }\n" +
    "      ] },\n" +
    "    { app: '宿舍', who: '八人间', title: '晚上',\n" +
    "      text: '熄灯后，八人间里有人在打电话，有人在哭，有人在刷短视频笑出声。你躺在床上，想起高三那些“睡不够”的夜晚。那时候的疲惫是有终点的。',\n" +
    "      ch: [\n" +
    "        { label: '继续睡', fx: { mood: -1 }, reply: '你闭上眼。明天六点半的闹钟不会因为你今晚想了什么而推迟。' }\n" +
    "      ] },\n" +
    "    { app: '发薪日', who: '工资条', title: '6000 块',\n" +
    "      text: '第一个月工资到账：6000 块，扣掉伙食 800、住宿 200，剩 5000。你给家里转了 4000。妈妈回了三个字：“别省了。”',\n" +
    "      ch: [\n" +
    "        { label: '给家里转', fx: { mood: 1, money: -4 }, reply: '你转了。剩下的 1000 块，你在小卖部买了一瓶两块的冰红茶。那是那天你唯一给自己买的东西。' }\n" +
    "      ] },\n" +
    "    { app: '流水线', who: '新来的', title: '镜像',\n" +
    "      text: '新来一个十八岁的小年轻，第一天上班问你：“哥，读书有啥用？我一个月也能挣六千。”你看着他，像隔着四年看一面镜子。',\n" +
    "      ch: [\n" +
    "        { label: '说“你不会一直干这个的”', fx: { mood: 2 }, reply: '你说了。你自己都不确定是不是在骗他。但你说了。' }\n" +
    "      ] },\n" +
    "    { app: '深夜', who: '朋友圈', title: '录取通知书',\n" +
    "      text: '高中同学在朋友圈发了大学录取通知书的照片。你给三个人点了赞，然后关掉手机，在黑暗里睁着眼躺了很久。',\n" +
    "      ch: [\n" +
    "        { label: '给三个都点赞', fx: { mood: 1 }, reply: '你真心为他们高兴。也真心地，替自己有点难过。两件事可以同时为真。' }\n" +
    "      ] }\n" +
    "  ],\n" +
    "  final: {\n" +
    "    app: '工厂门口', who: '一年后', title: '你成了表哥',\n" +
    "    text: '一年后。你站在厂门口，看见一个学生蹲在路边——他跟你当年一样，校服还没换。你走过去递了根烟（他不抽），想了想换成一颗糖。',\n" +
    "    ch: [\n" +
    "      { label: '说“回去读书”', fx: { mood: 2 }, reply: '他说：“哥，读书有啥用？”你笑了。你终于说出了表哥一直没说出口的那句话：“没用。但你回去。”' }\n" +
    "    ]\n" +
    "  }\n" +
    "};\n\n" + dzAnchor);

  fs.writeFileSync('data/cards.js', s);
  console.log('cards.js patched');
})();

/* ===== data/endings.js ===== */
(function () {
  let s = fs.readFileSync('data/endings.js', 'utf8');
  const anchor = "  admin: {";
  if (!s.includes(anchor)) { console.error('ENDINGS anchor not found'); process.exit(1); }
  s = s.replace(anchor, "  liushui: {\n" +
    "    name: '流水线',\n" +
    "    quote: '流水线不会停下来等你。但你会习惯的。',\n" +
    "    flavor: '你成了表哥——不是亲的那个，是所有蹲在厂门口递糖给学生的那些人的统称。你终于理解了他：那不是劝退，是把路走通之后，回头告诉下一个人。'\n" +
    "  },\n" + anchor);
  fs.writeFileSync('data/endings.js', s);
  console.log('endings patched');
})();

/* ===== data/cards.js 继承表 ===== */
(function () {
  let s = fs.readFileSync('data/cards.js', 'utf8');
  const anchor = "  liushui:   {";
  if (s.includes(anchor)) { console.log('liushui inherit already exists'); return; }
  const anchor2 = "  shixi:     { name: '罗马家庭卡'";
  if (!s.includes(anchor2)) { console.error('INH anchor2 not found'); process.exit(1); }
  s = s.replace(anchor2, "  liushui:   { name: '机器家庭卡', note: '你家的饭桌上有机油的味道，和一句“读书确实没啥用——但你得读”。', mods: { R: 10, G: 5, money: 35, mood: 45 } },\n" + anchor2);
  fs.writeFileSync('data/cards.js', s);
  console.log('inherit patched');
})();

/* ===== data/danmaku.js ===== */
(function () {
  let s = fs.readFileSync('data/danmaku.js', 'utf8');
  const anchor = "  birth_roma: [";
  if (!s.includes(anchor)) { console.error('DM anchor not found'); process.exit(1); }
  s = s.replace(anchor, "  dagong: [\n" +
    "    '电子厂也有春天',\n" +
    "    '六千不少了兄弟',\n" +
    "    '读书不如打工（转发的都打了差评）',\n" +
    "    '流水线女孩/男孩',\n" +
    "    '齿轮不会问为什么转'\n" +
    "  ],\n" + anchor);
  fs.writeFileSync('data/danmaku.js', s);
  console.log('danmaku patched');
})();

console.log('v1.17 data done');
