// Sample data — work/team chat, mixed Chinese + English names.
const AVATAR_COLORS = [
  ["#2563EB", "#6366F1"],
  ["#059669", "#10B981"],
  ["#F59E0B", "#EF4444"],
  ["#8B5CF6", "#EC4899"],
  ["#0EA5E9", "#22D3EE"],
  ["#F97316", "#F59E0B"],
  ["#14B8A6", "#059669"],
  ["#DB2777", "#8B5CF6"],
  ["#64748B", "#0F172A"],
  ["#9333EA", "#3B82F6"],
];

const PEOPLE = [
  { id: "me", name: "You", zh: "你", status: "online", color: AVATAR_COLORS[0] },
  { id: "bob",     name: "Bob Chen",      zh: "陳柏翰", status: "online",  color: AVATAR_COLORS[1] },
  { id: "charlie", name: "Charlie Liu",   zh: "劉知遠", status: "online",  color: AVATAR_COLORS[2] },
  { id: "david",   name: "David Wu",      zh: "吳定緯", status: "online",  color: AVATAR_COLORS[3] },
  { id: "emma",    name: "Emma Zhao",     zh: "趙雅雯", status: "online",  color: AVATAR_COLORS[4] },
  { id: "frank",   name: "Frank Lin",     zh: "林方楷", status: "online",  color: AVATAR_COLORS[5] },
  { id: "grace",   name: "Grace Huang",   zh: "黃思嘉", status: "online",  color: AVATAR_COLORS[6] },
  { id: "henry",   name: "Henry Tsai",    zh: "蔡宏毅", status: "away",    color: AVATAR_COLORS[7] },
  { id: "iris",    name: "Iris Yang",     zh: "楊依芮", status: "offline", color: AVATAR_COLORS[8] },
  { id: "jay",     name: "Jay Wang",      zh: "王家瑋", status: "offline", color: AVATAR_COLORS[9] },
];

const P = Object.fromEntries(PEOPLE.map(p => [p.id, p]));

// Relative times (all today or yesterday)
const today = (h, m) => ({ h, m, day: 0 });
const yday  = (h, m) => ({ h, m, day: -1 });

const ROOMS = [
  {
    id: "r1",
    kind: "group",
    name: "產品設計組",
    subtitle: "Product Design",
    members: ["me", "bob", "emma", "grace", "frank"],
    pinned: true,
    unread: 3,
    last: today(14, 32),
    topic: "Sprint 24 · 設計評審 · 5 位成員",
    preview: "Grace: 新的登入流程已經 push 上去了 🎉",
    messages: [
      { id: "m1", from: "bob",     text: "早安各位，今天的 standup 可以改成 10:30 嗎？\n我 10 點有個 vendor call。",                    time: today(9, 12) },
      { id: "m2", from: "emma",    text: "OK for me 👍",                                                                           time: today(9, 14) },
      { id: "m3", from: "grace",   text: "沒問題。另外，我剛把新的登入流程 push 上了 figma，\n麻煩有空時看看 frame 3–7 的錯誤狀態。", time: today(9, 22),  attach: { kind: "image", name: "login-flow-v3.fig", meta: "12 frames · 2.4MB" } },
      { id: "m4", from: "me",      text: "收到。frame 5 的 error copy 我有幾個建議，等下約 15 分鐘討論？",                         time: today(10, 45), status: "read" },
      { id: "m5", from: "frank",   text: "加一",                                                                                   time: today(10, 46) },
      { id: "m6", from: "grace",   text: "14:00 meeting room A",                                                                  time: today(10, 50) },
      { id: "m7", from: "emma",    text: "順便一提：tokens v2 已經 merge，\n記得 pull 一下 design-system branch。",                 time: today(13, 58), attach: { kind: "file", name: "tokens-v2-changelog.md", meta: "MD · 8KB" } },
      { id: "m8", from: "me",      text: "Pulled. 顏色看起來好多了，尤其是 neutral ramp 👌",                                       time: today(14, 30), status: "delivered" },
      { id: "m9", from: "grace",   text: "新的登入流程已經 push 上去了 🎉 cc @bob",                                                  time: today(14, 32) },
    ],
  },
  {
    id: "r2",
    kind: "dm",
    with: "emma",
    unread: 0,
    last: today(13, 48),
    preview: "你: sounds good, 等你 ping",
    messages: [
      { id: "m1", from: "emma", text: "你有空看一下我剛剛 share 的 research notes 嗎？",            time: today(11, 20) },
      { id: "m2", from: "me",   text: "在會議中，大概下午 2 點可以看。需要 synchronous 討論嗎？", time: today(11, 30), status: "read" },
      { id: "m3", from: "emma", text: "不用，先看就好。有想法再回我。",                             time: today(11, 32) },
      { id: "m4", from: "me",   text: "sounds good, 等你 ping",                                     time: today(13, 48), status: "read" },
    ],
  },
  {
    id: "r3",
    kind: "group",
    name: "工程週會",
    subtitle: "Engineering Weekly",
    members: ["me", "charlie", "david", "henry", "iris", "jay"],
    unread: 12,
    last: today(12, 3),
    topic: "每週三 10:00 · 6 位成員",
    preview: "Charlie: 新的 auth service 已經 deploy 到 staging",
    messages: [
      { id: "m1", from: "charlie", text: "新的 auth service 已經 deploy 到 staging，\n麻煩 QA team 幫忙跑一下 regression。", time: today(12, 3) },
    ],
  },
  {
    id: "r4",
    kind: "dm",
    with: "bob",
    unread: 1,
    last: today(11, 15),
    preview: "Bob: 明天 1:1 還是照原定時間嗎？",
    messages: [
      { id: "m1", from: "bob", text: "明天 1:1 還是照原定時間嗎？", time: today(11, 15) },
    ],
  },
  {
    id: "r5",
    kind: "group",
    name: "ChatOwl Core",
    subtitle: "Team + Ops",
    members: ["me", "bob", "charlie", "david", "emma", "frank", "grace", "henry"],
    unread: 0,
    last: today(10, 2),
    preview: "David: Q2 roadmap 的 draft 在 notion 上了",
    messages: [
      { id: "m1", from: "david", text: "Q2 roadmap 的 draft 在 notion 上了，\n有任何 feedback 歡迎直接 comment。", time: today(10, 2) },
    ],
  },
  {
    id: "r6",
    kind: "dm",
    with: "grace",
    unread: 0,
    last: yday(18, 4),
    preview: "Grace: 辛苦了 🙏",
    messages: [
      { id: "m1", from: "grace", text: "辛苦了 🙏", time: yday(18, 4) },
    ],
  },
  {
    id: "r7",
    kind: "group",
    name: "午餐吃什麼",
    subtitle: "Lunch plans",
    members: ["me", "bob", "emma", "frank", "grace", "iris"],
    unread: 0,
    last: yday(12, 50),
    preview: "Emma: 今天吃泰式？",
    messages: [
      { id: "m1", from: "emma", text: "今天吃泰式？", time: yday(12, 50) },
    ],
  },
  {
    id: "r8",
    kind: "dm",
    with: "charlie",
    unread: 0,
    last: yday(16, 30),
    preview: "你: thanks for reviewing!",
    messages: [
      { id: "m1", from: "me", text: "thanks for reviewing!", time: yday(16, 30), status: "read" },
    ],
  },
];

const NAV_ITEMS = [
  { id: "all",       label: "所有對話", icon: "MessageSquare", count: 8 },
  { id: "contacts",  label: "聯絡人",   icon: "Users",         count: null },
  { id: "groups",    label: "群組",     icon: "UserGroup",     count: 3 },
  { id: "starred",   label: "重要訊息", icon: "Star",          count: 4 },
];

window.DATA = {
  PEOPLE,
  P,
  ROOMS,
  NAV_ITEMS,
};
