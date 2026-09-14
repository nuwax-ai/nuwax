/**
 * 会话详情页「聊天区 vs 右侧面板（文件树/终端/云电脑）」分栏宽度偏好。
 * 拖拽结束后持久化到 localStorage，刷新 / 重开会话后恢复上次宽度。
 * 存储的是左侧聊天区宽度百分比，默认 40（与历史 CSS 固定比例一致）。
 */

export const CHAT_PANEL_WIDTH_STORAGE_KEY = 'chat_panel_width_percent';

/** 左侧聊天区宽度百分比上下限，超出按边界处理 */
export const CHAT_PANEL_WIDTH_MIN = 20;
export const CHAT_PANEL_WIDTH_MAX = 80;
export const CHAT_PANEL_WIDTH_DEFAULT = 40;

const clampPercent = (value: number): number =>
  Math.max(
    CHAT_PANEL_WIDTH_MIN,
    Math.min(CHAT_PANEL_WIDTH_MAX, Math.round(value)),
  );

export const loadChatPanelWidthPercent = (): number => {
  try {
    const raw = localStorage.getItem(CHAT_PANEL_WIDTH_STORAGE_KEY);
    const parsed = raw === null ? NaN : Number(raw);
    return Number.isFinite(parsed)
      ? clampPercent(parsed)
      : CHAT_PANEL_WIDTH_DEFAULT;
  } catch {
    return CHAT_PANEL_WIDTH_DEFAULT;
  }
};

export const saveChatPanelWidthPercent = (percent: number): void => {
  try {
    localStorage.setItem(
      CHAT_PANEL_WIDTH_STORAGE_KEY,
      String(clampPercent(percent)),
    );
  } catch {
    // ignore: localStorage 不可用，降级为仅本次会话生效
  }
};
