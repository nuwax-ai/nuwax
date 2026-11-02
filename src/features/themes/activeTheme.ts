import type { HostThemeSnapshot } from '@/types/interfaces/hostBridge';

// 旧偏好服务只读当前主题，不反向依赖存储、宿主桥或 React。
let active: HostThemeSnapshot | null = null;
export const getActiveThemeSnapshot = (): HostThemeSnapshot | null => active;
export const setActiveThemeSnapshot = (
  snapshot: HostThemeSnapshot | null,
): void => {
  active = snapshot;
};
