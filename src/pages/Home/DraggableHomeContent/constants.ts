export const DRAG_TYPES = {
  CATEGORY: 'CATEGORY',
  AGENT: 'AGENT',
} as const;

export const HOVER_TEXTS = {
  CATEGORY: '可拖拽更换栏目顺序',
  AGENT: '可拖拽更换智能体顺序',
} as const;

// 添加其他可能的常量
export const LOADING_MESSAGES = {
  UPDATING_SORT: '正在更新排序...',
} as const;

export const SUCCESS_MESSAGES = {
  SORT_SUCCESS: '排序更新成功',
} as const;

export const ERROR_MESSAGES = {
  SORT_FAILED: '排序更新失败，请重试',
} as const;
