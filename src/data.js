// 預設人員清單（支援啟用/停用）
export const DEFAULT_USERS = [
  { id: 'u1', name: '林淑萍', active: true },
  { id: 'u2', name: '余姿旻', active: true },
  { id: 'u3', name: '邱佳琪', active: true },
  { id: 'u4', name: '林盈君', active: true },
  { id: 'u5', name: '陳玟霈', active: true },
  { id: 'u6', name: '許仲宜', active: true },
  { id: 'u7', name: '賴宥蓁', active: true },
  { id: 'u8', name: '陳韋嘉', active: true },
  { id: 'u9', name: '王琇儀', active: true },
  { id: 'u10', name: '蔡雅婷', active: true },
  { id: 'u11', name: '蔡亞真', active: true },
  { id: 'u12', name: '夏若萍', active: true },
  { id: 'u13', name: '鄧宜榛', active: true }
];

// 作業身分
export const ROLES = [
  { id: 'sorter', name: '分秤' },
  { id: 'puller', name: '拉料' },
  { id: 'cs', name: '客服' }
];

// 時段定義
export const SHIFTS = [
  { id: 'morning', name: '上午時段 (AM)' },
  { id: 'afternoon', name: '下午時段 (PM)' }
];

// 預設路線清單（依時段分類）
export const DEFAULT_ROUTES = {
  morning: [
    { id: 'S1', name: 'S1', active: true },
    { id: 'P', name: 'P', active: true },
    { id: 'S2', name: 'S2', active: true },
    { id: 'K', name: 'K', active: true },
    { id: 'A', name: 'A', active: true },
    { id: 'B', name: 'B', active: true }
  ],
  afternoon: [
    { id: 'F', name: 'F', active: true },
    { id: 'H', name: 'H', active: true },
    { id: 'I', name: 'I', active: true },
    { id: 'C', name: 'C', active: true },
    { id: 'J', name: 'J', active: true },
    { id: 'M2', name: 'M2', active: true }
  ]
};

// 預設組別清單（依時段與角色分類）
export const DEFAULT_GROUPS = {
  morning: {
    sorter: [
      { id: 'm_s1', name: '組別1', routes: ['S1', 'P', 'S2'] },
      { id: 'm_s2', name: '組別2', routes: ['K', 'A', 'B'] }
    ],
    puller: [
      { id: 'm_p1', name: '組別1', routes: ['S1', 'K', 'A'] },
      { id: 'm_p2', name: '組別2', routes: ['P', 'S2', 'B'] }
    ]
  },
  afternoon: {
    sorter: [
      { id: 'a_s1', name: '組別1', routes: ['F', 'H', 'I'] },
      { id: 'a_s2', name: '組別2', routes: ['C', 'J', 'M2'] }
    ],
    puller: [
      { id: 'a_p1', name: '組別1', routes: ['F', 'C', 'M2'] },
      { id: 'a_p2', name: '組別2', routes: ['H', 'I', 'J'] }
    ]
  }
};

export const DEFAULT_CONFIG = {
  users: DEFAULT_USERS,
  routes: DEFAULT_ROUTES,
  groups: DEFAULT_GROUPS
};

// 根據路線列表初始化狀態結構
export const createInitialRoutesState = (routesConfig = DEFAULT_ROUTES) => {
  const state = { morning: {}, afternoon: {} };
  ['morning', 'afternoon'].forEach(shift => {
    const list = routesConfig[shift] || [];
    list.forEach(r => {
      state[shift][r.name || r.id] = {
        sorter: false,
        puller: false,
        printed: false
      };
    });
  });
  return state;
};
