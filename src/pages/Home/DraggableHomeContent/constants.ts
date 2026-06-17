import { dict } from '@/services/i18nRuntime';

export const DRAG_TYPES = {
  CATEGORY: 'CATEGORY',
  AGENT: 'AGENT',
} as const;

export const HOVER_TEXTS = {
  CATEGORY: dict('PC.Pages.HomeDrag.hoverCategory'),
  AGENT: dict('PC.Pages.HomeDrag.hoverAgent'),
} as const;

// 添加其他可能的常量
export const LOADING_MESSAGES = {
  UPDATING_SORT: dict('PC.Pages.HomeDrag.updatingSort'),
} as const;

export const SUCCESS_MESSAGES = {
  SORT_SUCCESS: dict('PC.Pages.HomeDrag.sortSuccess'),
} as const;

export const ERROR_MESSAGES = {
  SORT_FAILED: dict('PC.Pages.HomeDrag.sortFailed'),
} as const;
