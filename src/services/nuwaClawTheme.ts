/**
 * nuwaclaw 桌面客户端专属主题适配层（内聚所有 nuwaclaw 主题常量与逻辑）。
 *
 * 设计原则（减少侵入 + 减少分散）：
 * - 核心 unifiedThemeService 的配置链 / 优先级 / applyToDOM 完全不改；
 * - 通用主题常量 theme.constants.ts 不掺入任何 nuwaclaw 专属定义；
 * - nuwaclaw 的「品牌蓝主色 + 白底浅灰布局」常量与覆盖逻辑全部内聚在本模块。
 *
 * 机制：「女娲主题」注册进主题切换维度（ThemeColorPanel 在桌面端追加「女娲蓝」
 * 选项）。本层作为独立覆盖挂到主题变化监听：
 * - 桌面端未显式定制主题 → init 时把「女娲蓝 + 纯色背景」写入正式主题配置
 *   （unifiedThemeService.updateData，面板自然高亮），灰白布局随覆盖层生效；
 * - 用户显式选了「女娲蓝」且布局为浅色 → 女娲主题保持生效；
 * - 用户切其他主色/背景图/深色布局 → 覆盖自动让位（随时可切回）。
 * antd 运行时主色由 app.tsx applyThemeConfig 据 isNuwaClawThemeActive() 条件传入；
 * CSS 变量覆盖由 syncNuwaClawCssOverride 维护。
 */
import { STORAGE_KEYS } from '@/constants/theme.constants';
import { unifiedThemeService } from '@/services/unifiedThemeService';
import { ThemeLayoutColorStyle } from '@/types/enums/theme';
import { isNuwaClaw, nuwaClawHost } from '@/utils/nuwaClawBridge';

/** nuwaclaw 专属品牌主色（现代专业开发工具风品牌蓝） */
export const NUWACLAW_PRIMARY = '#2563EB';

/** 女娲主题绑定的背景选项 id（theme.constants 注册的「纯色」背景，无图浅色） */
export const NUWACLAW_BACKGROUND_ID = 'bg-solid';

/**
 * nuwaclaw 桌面专属亮色布局变量覆盖
 * 在通用 light-style1（半透明白 + 背景图）基础上，改为「中性浅灰纯色、不用背景图」：
 * 以 rgb(243,244,246)（#F3F4F6）为基色 + 白卡片层次 + 实色菜单背景（替代半透明叠图）。
 * 仅桌面端且当前亮色时生效；切 dark 走通用 dark-style1。
 */
export const NUWACLAW_LIGHT_STYLE_OVERRIDE: Record<string, string> = {
  '--xagi-layout-bg-primary': '#F3F4F6', // 主内容区（用户指定基色 rgb(243,244,246)，中性冷灰）
  '--xagi-layout-bg-secondary': '#EAEBEF', // 侧栏/次面板（深一档）
  '--xagi-layout-bg-container': '#F3F4F6', // 主内容区面板（token @pageContainerBg 消费；漏配曾致内容区始终白）
  '--xagi-layout-bg-card': '#FFFFFF', // 卡片（白卡浮于灰底，保层次）
  '--xagi-layout-bg-input': '#FFFFFF', // 输入框
  '--xagi-layout-border-primary': '#D3D5DC', // 主描边（保证二级菜单左边框在灰底上可见）
  '--xagi-layout-border-secondary': '#E2E4E9', // 次描边
  '--xagi-layout-text-primary': '#1F2329', // 主文字
  '--xagi-layout-text-secondary': '#646A73', // 次文字
  '--xagi-layout-shadow': 'rgba(15, 23, 42, 0.06)', // 淡阴影（冷黑，灰底上托层次）
  // 菜单背景（token.less 的 @navFirstMenuBg/@navSecondMenuBg 消费）：实色替代半透明
  '--xagi-color-bg-container': '#EEEFF2', // 一级菜单（style2 二级菜单同源）
  '--xagi-color-bg-layout': '#EAEBEF', // 二级菜单（style1）
  // 菜单项 hover/选中高亮（token @navItem*Bg/@navSecondItemActiveBg 消费）：
  // 贴近菜单底的浅灰浮起（选中项另有品牌蓝文字/图标标识，背景弱化不突兀）
  '--xagi-nav-item-hover-bg': '#F2F3F6',
  '--xagi-nav-item-active-bg': '#F5F6F8',
  '--xagi-nav-item-selected-bg': '#F5F6F8',
  '--xagi-nav-second-item-active-bg': '#F5F6F8',
};

/** nuwaclaw 专属覆盖的 CSS 变量集（主色 + 亮色布局实色） */
const NUWACLAW_CSS_VARS: Record<string, string> = {
  '--xagi-color-primary': NUWACLAW_PRIMARY,
  ...NUWACLAW_LIGHT_STYLE_OVERRIDE,
};

/**
 * 是否存在用户/租户「主题相关」的显式配置（命中 default 层则两者皆无）。
 * 直接探测存储而非 currentData.source——app.tsx 初始化的 updateData 会把 source 置 'user'，
 * 致 source 不可靠；此处复刻 loadConfiguration 的 user>tenant>default 探测逻辑。
 * 只认主题相关字段（主色/背景图/租户模板）：GLOBAL_SETTINGS 仅存语言等非主题项时
 * 不算显式定制，桌面端默认（女娲主题）依旧生效。
 */
function hasExplicitThemeConfig(): boolean {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG);
    if (userStr) {
      const config = JSON.parse(userStr);
      if (config?.selectedThemeColor || config?.selectedBackgroundId) {
        return true;
      }
    }
    const globalStr = localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS);
    if (globalStr) {
      const settings = JSON.parse(globalStr);
      if (settings?.primaryColor || settings?.backgroundImageId) {
        return true;
      }
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
 * 女娲主题是否生效：
 * - 桌面端 + 用户/租户均未显式定制主题 → 默认即女娲主题；
 * - 桌面端 + 用户显式选了「女娲蓝」（主色 = NUWACLAW_PRIMARY）且布局为浅色 → 生效；
 * - 切其他主色 / 深色布局 / 租户模板 → 让位（用户在主题切换里可随时切回）。
 * 背景图不作为判定条件：女娲主题本身就禁用背景图，选中即覆盖展示。
 */
export function isNuwaClawThemeActive(): boolean {
  if (!isNuwaClaw()) return false;
  if (!hasExplicitThemeConfig()) return true;
  const data = unifiedThemeService.getCurrentData();
  return (
    data.primaryColor === NUWACLAW_PRIMARY &&
    data.layoutStyle === ThemeLayoutColorStyle.LIGHT
  );
}

/** 桌面端禁用背景图的变量名（单独处理，不并入 NUWACLAW_CSS_VARS 的移除集） */
const BG_IMAGE_VAR = '--xagi-background-image';

/** 桌面主题生效时给 html 铺的灰底（style1 主内容是带边距的浮动圆角面板，缝隙会露出 html 白底） */
const NUWACLAW_HTML_BG =
  NUWACLAW_LIGHT_STYLE_OVERRIDE['--xagi-layout-bg-secondary'];

/**
 * 组装推送给 nuwaclaw 壳的主题状态（guest→host 通道）。
 * 壳侧据此给自己的 antd tokens / CSS 变量叠加同套调色板，让设置弹窗等原生 UI
 * 与 nuwax 统一。色值全部引用 NUWACLAW_LIGHT_STYLE_OVERRIDE，单一来源不另立色板。
 */
function buildShellThemePayload(active: boolean): ShellThemePayload {
  if (!active) return { active: false };
  return {
    active: true,
    primary: NUWACLAW_PRIMARY,
    bgContent: NUWACLAW_LIGHT_STYLE_OVERRIDE['--xagi-layout-bg-primary'],
    bgMenu: NUWACLAW_LIGHT_STYLE_OVERRIDE['--xagi-color-bg-container'],
    bgElevated: NUWACLAW_LIGHT_STYLE_OVERRIDE['--xagi-nav-item-active-bg'],
    border: NUWACLAW_LIGHT_STYLE_OVERRIDE['--xagi-layout-border-primary'],
    borderSecondary:
      NUWACLAW_LIGHT_STYLE_OVERRIDE['--xagi-layout-border-secondary'],
    bgItemHover: NUWACLAW_LIGHT_STYLE_OVERRIDE['--xagi-nav-item-hover-bg'],
  };
}

/**
 * 同步 nuwaclaw 亮色覆盖变量到 documentElement（生效则叠加，否则移除）。
 * 背景图单独处理：让位时不能无脑 removeProperty——那会连带删掉 unifiedThemeService
 * 刚按用户 backgroundId 设置的背景图；仅当当前值是自己设的 'none' 时才移除。
 */
function syncNuwaClawCssOverride(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  // 生效判定已内含「浅色布局」约束（灰白变量仅浅色下有意义），无需再叠加 antdTheme 判断
  const shouldApply = isNuwaClawThemeActive();
  Object.keys(NUWACLAW_CSS_VARS).forEach((key) => {
    if (shouldApply) root.style.setProperty(key, NUWACLAW_CSS_VARS[key]);
    else root.style.removeProperty(key);
  });
  // 桌面端不用背景图（灰白纯色）；html 铺灰底兜住面板缝隙/滚动区。
  // 让位时仅回收自己设的 'none' 与灰底，不动用户图（灰底清空回落 global.less 的 #fff）
  if (shouldApply) {
    root.style.setProperty(BG_IMAGE_VAR, 'none');
    root.style.backgroundColor = NUWACLAW_HTML_BG;
  } else {
    root.style.backgroundColor = '';
    if (root.style.getPropertyValue(BG_IMAGE_VAR) === 'none') {
      root.style.removeProperty(BG_IMAGE_VAR);
    }
  }
  // 同步主题状态给壳（fire-and-forget）：壳的原生 UI（设置弹窗等）跟随统一/回落
  nuwaClawHost.theme.syncTheme(buildShellThemePayload(shouldApply));
}

/**
 * 初始化 nuwaclaw 专属主题适配（仅桌面端生效，浏览器端 no-op）。
 * 应用启动时调用一次：首次同步 + 订阅主题变化维持覆盖；返回 dispose 供 effect cleanup。
 */
export function initNuwaClawTheme(): () => void {
  if (!isNuwaClaw()) return () => {};
  // 桌面端默认切换到女娲主题：用户/租户均未显式定制主题时，把「女娲蓝 + 纯色背景」
  // 写入正式主题配置（走服务统一的存储/DOM 应用链路，主题切换面板因此自然高亮
  // 女娲蓝与纯色两项）。用户此后切任何主题都构成显式配置，此写入不再重复。
  if (!hasExplicitThemeConfig()) {
    unifiedThemeService.updateData({
      primaryColor: NUWACLAW_PRIMARY,
      backgroundId: NUWACLAW_BACKGROUND_ID,
    });
  }
  syncNuwaClawCssOverride();
  unifiedThemeService.addListener(syncNuwaClawCssOverride);
  return () => unifiedThemeService.removeListener(syncNuwaClawCssOverride);
}
