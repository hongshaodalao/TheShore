// 一次性脚本：向 C.birthCards.town / .roma 各追加 1 张 sec:5 危机联动卡
const fs = require('fs');
const f = 'data/cards.js';
let s = fs.readFileSync(f, 'utf8');

// 小镇：插在 town 数组的最后一张卡（寄回家）结束后
const townMarker = "        { label: '没转', fx: { mood: -2 }, reply: '你没转。那晚你给家里打了个电话，聊了四十分钟，谁也没提钱。' }\n      ] }";
if (!s.includes(townMarker)) { console.error('TOWN MARKER NOT FOUND'); process.exit(1); }
const townCard = "        { label: '没转', fx: { mood: -2 }, reply: '你没转。那晚你给家里打了个电话，聊了四十分钟，谁也没提钱。' }\n      ] },\n" +
"    { sec: 5, app: '深夜阳台', who: '失业第 1 天', title: '全家的绳子',\n" +
"      text: '失业第一晚，你没算自己的账——你算的是全家的：爸爸的降压药一个月 400，家里翻新借的 5 万还没还，妹妹明年上大学。你的 N+1，是你家三年的开销。当年考上大学那顿酒席，全村凑的份子，你记得每一张脸。',\n" +
"      ch: [\n" +
"        { label: '告诉家里', fx: { mood: 3 }, reply: '电话那头沉默了很久。爸爸说：“回来吧，家里饿不着你。”你说好。眼泪掉下来的时候，你发现那不是委屈——是扛了很久的担子，终于有人接了一下。' },\n" +
"        { label: '瞒着，撑住', fx: { mood: -4, money: -3 }, reply: '你把 N+1 拆成两份：一份寄回家，一份交房租。妈妈问工作忙不忙，你说忙。这次撒谎你不觉得累——你早就习惯了当绳子。' }\n" +
"      ] }";
s = s.replace(townMarker, townCard);

// 罗马：插在 roma 数组的最后一张卡（自带滤镜）结束后
const romaMarker = "        { label: '说实话', fx: { mood: 2 }, reply: '介绍人愣住：“条件这么好，挑什么？”你说：“就是条件太好，不知道对方喜欢的是不是我。”' }\n      ] }";
if (!s.includes(romaMarker)) { console.error('ROMA MARKER NOT FOUND'); process.exit(1); }
const romaCard = "        { label: '说实话', fx: { mood: 2 }, reply: '介绍人愣住：“条件这么好，挑什么？”你说：“就是条件太好，不知道对方喜欢的是不是我。”' }\n      ] },\n" +
"    { sec: 5, app: '深夜公寓', who: '失业第 1 天', title: '降落伞',\n" +
"      text: '失业第一晚，你没有盘账——账对你从来不是问题。二舅的电话在你被裁前就到了：“回来歇歇，基金部缺个副总。”你数了数自己的降落伞：爸的公司、二舅的基金、妈在新加坡的公寓。你的账单是一道题：如果收起所有的伞，你算什么？你不敢算。',\n" +
"      ch: [\n" +
"        { label: '接受副总', fx: { mood: -2 }, reply: '你去了。新工牌比上一张更重——不是金属重，是姓氏重。你开始失眠，甚至羡慕被裁的同事：至少他们的下一步，是自己走的。' },\n" +
"        { label: '拒绝，自己找', fx: { mood: 2, skill: 3 }, reply: '你删掉二舅的短信，海投了人生第一份简历。三个月零回音。你管这三个月叫：这辈子第一次自己走路。' }\n" +
"      ] }";
s = s.replace(romaMarker, romaCard);

fs.writeFileSync(f, s);
console.log('inserted town+roma crisis cards');
