/**
 * 认证失效/登出场景的本地存储清理工具
 *
 * 背景：请求拦截器遇 4010（USER_NO_LOGIN）会整体 clear 本地存储——用户主题
 * 配置（xagi-user-theme-config，含导航风格 navigationStyleId 显式选择）与切换
 * 标记一并被毁；登录弹回后配置读取链回退到租户模板，导航风格被兜底成默认
 * style3（单栏），用户在主题面板的选择凭丢失（2026-09-10 闪切单栏缺陷）。
 * 主题偏好与登录态无关，会话闪断重登不应销毁，clear 时暂存原样恢复。
 */
import { STORAGE_KEYS } from '@/constants/theme.constants';

/** clear 时需要保留的主题偏好键（用户显式选择，跨会话/跨登录态保留） */
const THEME_PREF_STORAGE_KEYS: string[] = [
  STORAGE_KEYS.USER_THEME_CONFIG,
  STORAGE_KEYS.GLOBAL_SETTINGS,
  STORAGE_KEYS.HAS_USER_SWITCH_THEME,
];

/**
 * 清空本地存储但保留主题偏好键。
 * 用于 4010 会话失效清理：其余键（token/菜单/空间/租户缓存等）照常清空，
 * 三个主题键原值恢复——只有它们是用户在设置里的显式选择，丢了无法自愈。
 */
export function clearStoragePreservingThemePrefs(): void {
  const preserved = THEME_PREF_STORAGE_KEYS.map(
    (key) => [key, localStorage.getItem(key)] as const,
  );
  localStorage.clear();
  preserved.forEach(([key, value]) => {
    if (value !== null) {
      localStorage.setItem(key, value);
    }
  });
}
