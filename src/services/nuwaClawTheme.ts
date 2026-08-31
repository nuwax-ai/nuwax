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
 * - 用户显式选了「纯色」背景且布局为浅色 → 灰白布局保持生效（任意主色：
 *   灰白外观跟随背景维度，主色只影响点缀色，不再互相绑架）；
 * - 用户切图片背景 / 深色布局 → 覆盖自动让位（随时可切回）。
 * antd 运行时主色由 app.tsx applyThemeConfig 据 isNuwaClawDefaultThemeActive()
 * 条件传入（仅默认态强制品牌蓝，显式定制后跟随用户主色）；CSS 变量覆盖由
 * syncNuwaClawCssOverride 维护。
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
  // 贴近菜单底的极浅浮起（选中项另有品牌蓝文字/图标标识，背景弱化不突兀）。
  // 一级菜单底 #EEEFF2 → hover +2 / 选中 +4；二级菜单底 #EAEBEF → 选中 +4
  '--xagi-nav-item-hover-bg': '#F0F1F5',
  '--xagi-nav-item-active-bg': '#F2F3F6',
  '--xagi-nav-item-selected-bg': '#F2F3F6',
  '--xagi-nav-second-item-active-bg': '#EEF0F3',
};

/** nuwaclaw 专属覆盖的 CSS 变量集（亮色布局实色；主色单独处理，见 sync） */
const NUWACLAW_CSS_VARS: Record<string, string> = {
  ...NUWACLAW_LIGHT_STYLE_OVERRIDE,
};

/**
 * 读取租户主题默认值（色 + 背景），用于识别用户层是否只是租户默认的「回声」。
 * 回声链：登录时 tenantConfigInfo 模型在无用户切换标记的情况下，会把租户模板
 * templateConfig 直接 updateData 写入用户层（source:'user'）——用户层值 ≡ 租户
 * 模板值不代表用户显式定制（用户 dump 实证：#5147ff/bg-variant-8 逐项全等）。
 * 字段与 loadTenantSettings 同源：优先 templateConfig（用户层同款字段名），
 * 缺省回落 themeConfig.defaultThemeColor/defaultBackgroundId。
 */
function readTenantThemeDefaults(): {
  color: string | null;
  background: string | null;
} {
  try {
    const tenantStr = localStorage.getItem(STORAGE_KEYS.TENANT_CONFIG_INFO);
    if (!tenantStr) return { color: null, background: null };
    const tenant = JSON.parse(tenantStr);
    if (tenant?.templateConfig) {
      const template = JSON.parse(tenant.templateConfig);
      return {
        color:
          template?.selectedThemeColor ??
          tenant?.themeConfig?.defaultThemeColor ??
          null,
        background:
          template?.selectedBackgroundId ??
          tenant?.themeConfig?.defaultBackgroundId ??
          null,
      };
    }
    return {
      color: tenant?.themeConfig?.defaultThemeColor ?? null,
      background: tenant?.themeConfig?.defaultBackgroundId ?? null,
    };
  } catch {
    return { color: null, background: null };
  }
}

const colorEq = (a?: string | null, b?: string | null): boolean =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();
const backgroundEq = (a?: string | null, b?: string | null): boolean =>
  !!a && !!b && a === b;

/**
 * 是否存在用户的显式主题定制。
 * 直接探测存储而非 currentData.source——app.tsx 初始化的 updateData 会把 source 置 'user'，
 * 致 source 不可靠；此处复刻 loadConfiguration 的 user>tenant>default 探测逻辑。
 * 只认主题相关字段（主色/背景图）；**值 ≡ 租户默认视为回声不算定制**（登录同步写入，
 * 见 readTenantThemeDefaults）；租户模板存在本身也不再单独算显式——它正是回声的来源。
 * 无租户默认可参照时退回旧行为：用户层任意主题字段有值即算显式。
 */
function hasExplicitThemeConfig(): boolean {
  try {
    const tenantDefaults = readTenantThemeDefaults();
    const userStr = localStorage.getItem(STORAGE_KEYS.USER_THEME_CONFIG);
    if (userStr) {
      const config = JSON.parse(userStr);
      if (
        (config?.selectedThemeColor &&
          !colorEq(config.selectedThemeColor, tenantDefaults.color)) ||
        (config?.selectedBackgroundId &&
          !backgroundEq(config.selectedBackgroundId, tenantDefaults.background))
      ) {
        return true;
      }
    }
    const globalStr = localStorage.getItem(STORAGE_KEYS.GLOBAL_SETTINGS);
    if (globalStr) {
      const settings = JSON.parse(globalStr);
      if (
        (settings?.primaryColor &&
          !colorEq(settings.primaryColor, tenantDefaults.color)) ||
        (settings?.backgroundImageId &&
          !backgroundEq(settings.backgroundImageId, tenantDefaults.background))
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 女娲灰白纯色布局是否生效：
 * - 桌面端 + 无显式定制（用户层为空或 ≡ 租户默认回声）→ 默认即女娲主题；
 * - 桌面端 + 用户显式选了「纯色」背景且布局为浅色 → 生效（任意主色）；
 * - 切图片背景 / 深色布局 → 让位（用户在主题切换里可随时切回）。
 * 灰白布局跟随背景维度而非主色：否则「选纯色不换主色只得白底」「蓝主色下
 * 换背景图被强制吞回 none」两类切换失效（用户实测踩中，2026-08-31 修复）。
 */
export function isNuwaClawThemeActive(): boolean {
  if (!isNuwaClaw()) return false;
  if (!hasExplicitThemeConfig()) return true;
  const data = unifiedThemeService.getCurrentData();
  return (
    data.backgroundId === NUWACLAW_BACKGROUND_ID &&
    data.layoutStyle === ThemeLayoutColorStyle.LIGHT
  );
}

/**
 * 桌面端「默认女娲主题」是否生效（用户未显式定制主题）：配置层主色可能仍是
 * 平台默认/租户回声，生效主色需按品牌蓝展示——app.tsx 的 antd token 与
 * ThemeSwitchPanel 色板高亮用。显式定制后主色完全跟随用户选择，不再强制。
 */
export function isNuwaClawDefaultThemeActive(): boolean {
  return isNuwaClaw() && !hasExplicitThemeConfig();
}

/** 桌面端禁用背景图的变量名（单独处理，不并入 NUWACLAW_CSS_VARS 的移除集） */
const BG_IMAGE_VAR = '--xagi-background-image';

/** 桌面主题生效时给 html 铺的灰底（style1 主内容是带边距的浮动圆角面板，缝隙会露出 html 白底） */
const NUWACLAW_HTML_BG =
  NUWACLAW_LIGHT_STYLE_OVERRIDE['--xagi-layout-bg-secondary'];

/**
 * 组装推送给 nuwaclaw 壳的主题状态（guest→host 通道）。
 * 壳侧据此给自己的 antd tokens / CSS 变量叠加同套调色板，让设置弹窗等原生 UI
 * 与 nuwax 统一。色值全部引用 NUWACLAW_LIGHT_STYLE_OVERRIDE，单一来源不另立色板；
 * 主色与 webview 生效值同源（默认态品牌蓝，显式定制后跟随用户主色）。
 */
function buildShellThemePayload(active: boolean): ShellThemePayload {
  if (!active) return { active: false };
  return {
    active: true,
    primary: isNuwaClawDefaultThemeActive()
      ? NUWACLAW_PRIMARY
      : unifiedThemeService.getCurrentData().primaryColor,
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
 * 新语义下让位必因 backgroundId≠bg-solid（applyToDOM 随后已写 url(...)）或深色
 * 布局，此时残留的 'none' 只可能来自本覆盖层，按值判定自洽。
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
  // 主色仅在「默认女娲主题」（未显式定制）时由本层兜底为品牌蓝——配置层主色
  // 可能仍是平台默认/租户回声色；显式定制后 --xagi-color-primary 完全交给
  // unifiedThemeService.applyToDOM 按用户主色维护（其恒写入该变量，本层不越权）。
  if (shouldApply && isNuwaClawDefaultThemeActive()) {
    root.style.setProperty('--xagi-color-primary', NUWACLAW_PRIMARY);
  }
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
