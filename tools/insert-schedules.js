// 一次性脚本：v1.14 三份时间表（罗马《空日历》/ 中产《两份账单》）
const fs = require('fs');
const f = 'data/cards.js';
let s = fs.readFileSync(f, 'utf8');
const anchor = "// 黑话连连看词对";
if (!s.includes(anchor)) { console.error('ANCHOR NOT FOUND'); process.exit(1); }
const add = "// ============ v1.14：罗马《空日历》——不是不够，是填不满 ============\n" +
"C.scheduleRoma = {\n" +
"  required: [ // 必要项 11h\n" +
"    { id: 'tz',   name: '陪爸爸见投资人', min: 2, voice: '爸爸',   warn: '这是对你好的场合。' },\n" +
"    { id: 'wc',   name: '陪妈妈出席晚宴', min: 2, voice: '妈妈',   warn: '你不出席，别人会说闲话。' },\n" +
"    { id: 'ke',   name: '自己的课',       min: 1, voice: '学校',   warn: '点名了，人得到。' },\n" +
"    { id: 'js',   name: '健身',           min: 1, voice: '教练',   warn: '体态是形象管理的一部分。' },\n" +
"    { id: 'tong', name: '通勤',           min: 1, voice: '司机',   warn: '路不归你管。' },\n" +
"    { id: 'fan',  name: '吃饭',           min: 2, voice: '生存',   warn: '饭局也是饭。' },\n" +
"    { id: 'fada', name: '发呆',           min: 2, voice: '你自己', warn: '总得留点时间什么都不想。' }\n" +
"  ],\n" +
"  options: [ // 13 格空白由这些自由填入\n" +
"    { id: 'yx',   name: '管理游戏', min: 3, tag: 'resume', warn: '这是领导力的启蒙。' },\n" +
"    { id: 'hj',   name: '酒会社交', min: 2, tag: 'resume', warn: '圈子从这些晚上开始攒。' },\n" +
"    { id: 'xqb',  name: '第三个兴趣班', min: 2, tag: 'resume', warn: '履历上的一行，总得有。' },\n" +
"    { id: 'gy',   name: '公益履历', min: 2, tag: 'resume', warn: '文书上需要这一段。' },\n" +
"    { id: 'pj',   name: '陪家人', min: 1, tag: 'life', warn: '他们其实挺想你。' },\n" +
"    { id: 'kxs',  name: '看闲书', min: 2, tag: 'life', warn: '闲书不闲，只是没人给你算分。' },\n" +
"    { id: 'fy',   name: '发呆', min: 2, tag: 'life', warn: '发呆是最后的自由。' },\n" +
"    { id: 'sy',   name: '用不上的手艺', min: 3, tag: 'life', warn: '用不上——所以它才属于你。' }\n" +
"  ]\n" +
"};\n\n" +
"// ============ v1.14：中产《两份账单》——钱和时间里挑一样放弃 ============\n" +
"C.scheduleMid = [\n" +
"  { id: 'ke',   name: '上课',     min: 8, voice: '学校',   warn: '旷课要请家长。' },\n" +
"  { id: 'zy',   name: '作业',     min: 5, voice: '班主任', warn: '写不完就别睡了。' },\n" +
"  { id: 'bu',   name: '补习',     min: 3, altName: '妈妈自己盯', altMin: 5, voice: '妈妈', warn: '机构一学期两万。', altWarn: '我教不一样吗？' },\n" +
"  { id: 'tong', name: '通勤',     min: 2, altName: '住郊区', altMin: 4, voice: '房价', warn: '市区房就这么贵。', altWarn: '郊区便宜 200 万，一天多两小时。' },\n" +
"  { id: 'fan',  name: '吃饭洗漱', min: 2, voice: '生存',   warn: '人是要吃饭的。' },\n" +
"  { id: 'lian', name: '锻炼',     min: 1, voice: '妈妈',   warn: '体考要考 1000 米。' },\n" +
"  { id: 'shui', name: '睡眠',     min: 8, voice: '医生',   warn: '长期睡不足，会猝死。' }\n" +
"];"; // 中产行数同小镇（7 项 29h），alt 字段只是文案层"另一份账单"的标注
s = s.replace(anchor, add + "\n\n" + anchor);
fs.writeFileSync(f, s);
console.log('schedule data inserted');
