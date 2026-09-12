/**
 * 认证失效/登出场景的本地存储清理工具
 *
 * 背景：请求拦截器遇 4010（USER_NO_LOGIN）会整体 clear 本地存储——用户显式
 * 偏好会一并被毁，且丢了无法自愈：
 * - 主题配置（xagi-user-theme-config，含导航风格 navigationStyleId 显式选择）：
 *   登录弹回后配置读取链回退到租户模板，导航风格被兜底成默认 style3（单栏）
 *   （2026-09-10 闪切单栏缺陷）。
 * - 语言偏好（umi_locale + umi_locale_user_set）：显式选过的语言被重置回产品默认
 *   （2026-09-11「一进入就是英文」回归的相邻问题）。
 * 这些偏好与登录态无关，会话闪断重登不应销毁，clear 时暂存原样恢复。
 */
import { I18N_STORAGE_KEYS } from '@/constants/i18n.constants';
import { STORAGE_KEYS } from '@/constants/theme.constants';

/** clear 时需要保留的用户显式偏好键（主题三键 + 语言两键，跨会话/跨登录态保留） */
const USER_PREF_STORAGE_KEYS: string[] = [
  STORAGE_KEYS.USER_THEME_CONFIG,
  STORAGE_KEYS.GLOBAL_SETTINGS,
  STORAGE_KEYS.HAS_USER_SWITCH_THEME,
  I18N_STORAGE_KEYS.ACTIVE_LANG,
  I18N_STORAGE_KEYS.USER_SET,
];

/**
 * 清空本地存储但保留用户显式偏好键。
 * 用于 4010 会话失效清理：其余键（token/菜单/空间/租户缓存等）照常清空，
 * 显式偏好键原值恢复——只有它们是用户的选择，丢了无法自愈。
 */
export function clearStoragePreservingUserPrefs(): void {
  const preserved = USER_PREF_STORAGE_KEYS.map(
    (key) => [key, localStorage.getItem(key)] as const,
  );
  localStorage.clear();
  preserved.forEach(([key, value]) => {
    if (value !== null) {
      localStorage.setItem(key, value);
    }
  });
}
