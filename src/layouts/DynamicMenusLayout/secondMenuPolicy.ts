/**
 * 二级菜单列策略纯函数单源（2026-09-12 抽取）。
 *
 * 收敛 ClassicLayout / SidebarNavLayout 双布局此前各持一份的派生逻辑：
 * 二级列显隐、当前菜单标题、标题可见性、二级列背景色。布局差异全部通过参数表达，
 * 策略本身不感知具体布局：
 * - Section 域集合（sectionTabs）由各布局传入：经典含 homepage（选中主页右侧并列
 *   渲染会话列表），单栏不含（主页=会话域无二级列）
 * - navigationStyle 传各布局真实生效值：SidebarNavLayout 仅 style3 挂载、
 *   ClassicLayout 挂载于 style1/style2，同一策略天然各自正确
 *
 * 全部为纯函数、不依赖 React/umi：dict 由调用方注入（i18nRuntime 经 services/i18n
 * 传递依赖 umi，直接 import 会断 vitest），MenuItemDto 仅 type-only 引入。
 * 壳同步副作用见 useSecondMenuShellSync.ts（hook 不入本文件，保本模块可直测）。
 */
import type { MenuItemDto } from '@/types/interfaces/menu';

/** 二级列背景色：移动端实底、style2 半透明白（2026-09-12 page-container 对齐口径）、其余透明 */
export const resolveSecondaryBackgroundColor = (options: {
  isMobile: boolean;
  navigationStyle: string;
  colorBgContainer: string;
}): string => {
  if (options.isMobile) {
    return options.colorBgContainer;
  }
  return options.navigationStyle === 'style2'
    ? 'var(--xagi-layout-bg-container, rgba(255, 255, 255, 0.95))'
    : 'transparent';
};

/** 标题是否展示：工作空间有自己的标题组件（space=静态菜单 / workspace=动态菜单） */
export const resolveIsShowTitle = (activeTab: string): boolean =>
  activeTab !== 'space' && activeTab !== 'workspace';

/** 二级列当前标题解析结果：新对话/更多页面走特殊文案键，其余取一级菜单名 */
export const resolveCurrentTitle = (options: {
  activeTab: string;
  isClickNewConversation: boolean;
  firstLevelMenus: MenuItemDto[];
  /** i18n 词条函数（调用方注入，通常传 @/services/i18nRuntime 的 dict） */
  dict: (key: string) => string;
}): string | undefined => {
  if (options.isClickNewConversation) {
    return options.dict('PC.Layouts.DynamicMenusLayout.newConversation');
  }
  if (options.activeTab === 'more_page') {
    return options.dict('PC.Layouts.DynamicMenusLayout.more');
  }
  return options.firstLevelMenus.find(
    (menu: MenuItemDto) => menu.code === options.activeTab,
  )?.name;
};

/** 二级菜单列显隐：Section 域常显，其余域看当前菜单有无 children */
export const resolveSecondMenuVisibility = (options: {
  activeTab: string;
  /** Section 域集合（常显二级列），布局语义差异由此参数表达 */
  sectionTabs: Set<string>;
  firstLevelMenus: MenuItemDto[];
  otherMenus: MenuItemDto[];
}): boolean => {
  if (!options.activeTab) return false;

  if (options.sectionTabs.has(options.activeTab)) {
    return true;
  }

  const currentMenu =
    options.firstLevelMenus.find(
      (menu: MenuItemDto) => menu.code === options.activeTab,
    ) ||
    options.otherMenus.find(
      (menu: MenuItemDto) => menu.code === options.activeTab,
    );

  if (!currentMenu) {
    return false;
  }

  return !!currentMenu.children?.length;
};
