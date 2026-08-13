/**
 * nuwaclaw 桌面客户端专属主题适配层（内聚所有 nuwaclaw 主题常量与逻辑）。
 *
 * 设计原则（减少侵入 + 减少分散）：
 * - 核心 unifiedThemeService 的配置链 / 优先级 / applyToDOM 完全不改；
 * - 通用主题常量 theme.constants.ts 不掺入任何 nuwaclaw 专属定义；
 * - nuwaclaw 的「品牌蓝主色 + 白底浅灰布局」常量与覆盖逻辑全部内聚在本模块。
 *
 * 机制：作为一层独立覆盖挂到主题变化监听——仅当桌面端且用户未显式定制主题
 * （配置来源 source=default）时叠加；用户一旦切过主色/背景/dark，source 变 user，
 * 覆盖自动让位（不锁）。antd 运行时主色由 app.tsx applyThemeConfig 据
 * isNuwaClawThemeActive() 条件传入；CSS 变量覆盖由 syncNuwaClawCssOverride 维护。
 */
import { STORAGE_KEYS } from '@/constants/theme.constants';
import { unifiedThemeService } from '@/services/unifiedThemeService';
import { isNuwaClaw } from '@/utils/nuwaClawBridge';

/** nuwaclaw 专属品牌主色（现代专业开发工具风品牌蓝） */
export const NUWACLAW_PRIMARY = '#2563EB';

/**
 * nuwaclaw 桌面专属亮色布局变量覆盖
 * 在通用 light-style1（半透明白）基础上，把背景/描边/文字/阴影改为参考图的实色
 * （白底浅灰 + 精确描边 + 高对比文字）。仅桌面端且当前亮色时生效；切 dark 走通用 dark-style1。
 */
export const NUWACLAW_LIGHT_STYLE_OVERRIDE: Record<string, string> = {
  '--xagi-layout-bg-primary': '#FFFFFF', // 主内容区
  '--xagi-layout-bg-secondary': '#F7F8FA', // 侧栏/次面板浅灰
  '--xagi-layout-bg-card': '#FFFFFF', // 卡片
  '--xagi-layout-bg-input': '#FFFFFF', // 输入框
  '--xagi-layout-border-primary': '#ECEEF1', // 主描边
  '--xagi-layout-border-secondary': '#F0F1F3', // 次描边
  '--xagi-layout-text-primary': '#1F2329', // 主文字
  '--xagi-layout-text-secondary': '#646A73', // 次文字
  '--xagi-layout-shadow': 'rgba(31, 35, 41, 0.06)', // 极淡阴影
};

/** nuwaclaw 专属覆盖的 CSS 变量集（主色 + 亮色布局实色） */
const NUWACLAW_CSS_VARS: Record<string, string> = {
  '--xagi-color-primary': NUWACLAW_PRIMARY,
  ...NUWACLAW_LIGHT_STYLE_OVERRIDE,
};

/**
 * 是否存在用户/租户显式主题配置（命中 default 层则两者皆无）。
 * 直接探测存储而非 currentData.source——app.tsx 初始化的 updateData 会把 source 置 'user'，
 * 致 source 不可靠；此处复刻 loadConfiguration 的 user>tenant>default 探测逻辑。
 */
function hasExplicitThemeConfig(): boolean {
  try {
    if (
      localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG) ||
      localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS)
    ) {
      return true;
    }
    const tenantStr = localStorage.getItem(STORAGE_KEYS.TENANT_CONFIG_INFO);
    if (tenantStr) {
      const tenant = JSON.parse(tenantStr);
      if (tenant?.templateConfig) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * nuwaclaw 专属默认主题是否生效：桌面端 + 用户/租户均未显式定制（命中 default 层）。
 * 用户在主题设置里切过主色/背景/dark → 写 USER_THEME_CONFIG → 返回 false → 覆盖自动让位（不锁）。
 */
export function isNuwaClawThemeActive(): boolean {
  return isNuwaClaw() && !hasExplicitThemeConfig();
}

/** 同步 nuwaclaw 亮色覆盖变量到 documentElement（生效则叠加，否则移除） */
function syncNuwaClawCssOverride(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const shouldApply =
    isNuwaClawThemeActive() &&
    unifiedThemeService.getCurrentData().antdTheme === 'light';
  Object.keys(NUWACLAW_CSS_VARS).forEach((key) => {
    if (shouldApply) root.style.setProperty(key, NUWACLAW_CSS_VARS[key]);
    else root.style.removeProperty(key);
  });
}

/**
 * 初始化 nuwaclaw 专属主题适配（仅桌面端生效，浏览器端 no-op）。
 * 应用启动时调用一次：首次同步 + 订阅主题变化维持覆盖；返回 dispose 供 effect cleanup。
 */
export function initNuwaClawTheme(): () => void {
  if (!isNuwaClaw()) return () => {};
  syncNuwaClawCssOverride();
  unifiedThemeService.addListener(syncNuwaClawCssOverride);
  return () => unifiedThemeService.removeListener(syncNuwaClawCssOverride);
}
