import { useCallback, useState } from 'react';

/**
 * 女娲应用多开标签条目（飞书工作台式侧栏临时菜单项）
 * @description 女娲应用页点击应用打开 /user-app/:id 或 /agent/:id 后，
 * 在左侧「女娲应用」一级菜单下方生成的可关闭临时标签数据。
 * 双时间戳语义：openedAt 决定显示顺序（首次打开序，重复打开位置不变），
 * lastActiveAt 供「关闭当前应用后切到剩余中最近打开的一个」的切换决策。
 */
export interface OpenedAppTabInfo {
  // 应用条目的 targetId（发布对象 id）
  targetId: number;
  // 应用名称（标签显示名）
  name: string;
  // 应用图标 URL（可能为空串，渲染方兜底默认图）
  icon?: string;
  // 标签对应的落地路由：/user-app/:targetId 或 /agent/:targetId（标签唯一键）
  routePath: string;
  // 三方应用主页地址（app/list 回包顶层下发，仅 ThirdApp 有值）：
  // 有值时跳转带 homepageUrl query，UserApp 页跳过域名接口直接 iframe 该地址
  homepageUrl?: string;
  // 首次打开时间戳（定显示序）
  openedAt: number;
  // 最近一次打开/切到该标签的时间戳（定关闭后的切换目标）
  lastActiveAt: number;
}

/** 追加/重复打开时的入参形态（时间戳由本模块生成，调用方不传） */
export type OpenedAppTabInput = Omit<
  OpenedAppTabInfo,
  'openedAt' | 'lastActiveAt'
>;

/**
 * 追加（或重复打开）标签：routePath 已存在时原位保留、仅刷新 lastActiveAt
 * 与名称图标（应用可能改名换图标后重新打开）；不存在则按打开顺序追加。
 */
export const appendOpenedTab = (
  tabs: OpenedAppTabInfo[],
  tab: OpenedAppTabInput,
  now = Date.now(),
): OpenedAppTabInfo[] => {
  const index = tabs.findIndex((item) => item.routePath === tab.routePath);
  if (index === -1) {
    return [...tabs, { ...tab, openedAt: now, lastActiveAt: now }];
  }
  const next = tabs.slice();
  next[index] = {
    ...tab,
    openedAt: tabs[index].openedAt,
    lastActiveAt: now,
  };
  return next;
};

/**
 * 移除标签：routePath 不存在时保持原引用（空操作不产生新数组，
 * 防下游 effect 因引用变化反复触发——同 pageHandoffContext 的教训）。
 */
export const removeOpenedTab = (
  tabs: OpenedAppTabInfo[],
  routePath: string,
): OpenedAppTabInfo[] => {
  if (!tabs.some((item) => item.routePath === routePath)) {
    return tabs;
  }
  return tabs.filter((item) => item.routePath !== routePath);
};

/**
 * 关闭标签后的切换目标：剩余标签中 lastActiveAt 最大（最近打开）的一个；
 * 无剩余返回 null（调用方跳回女娲应用页）。
 */
export const pickNextActiveTab = (
  tabs: OpenedAppTabInfo[],
  closedRoutePath: string,
): OpenedAppTabInfo | null => {
  const remaining = tabs.filter((item) => item.routePath !== closedRoutePath);
  if (remaining.length === 0) {
    return null;
  }
  return remaining.reduce((latest, item) =>
    item.lastActiveAt > latest.lastActiveAt ? item : latest,
  );
};

/** 当前路由是否命中某个已打开标签（导航行高亮让位的判定） */
export const isAppTabActive = (
  tabs: OpenedAppTabInfo[],
  pathname: string,
): boolean => tabs.some((item) => item.routePath === pathname);

/**
 * 标签跳转路径：三方应用带 homepageUrl 有值时附 query（UserApp 页直接
 * iframe 该地址）；其余标签跳纯 routePath。标签点击与关闭后切换共用。
 */
export const getAppTabNavPath = (
  tab: Pick<OpenedAppTabInfo, 'routePath' | 'homepageUrl'>,
): string =>
  tab.homepageUrl
    ? `${tab.routePath}?homepageUrl=${encodeURIComponent(tab.homepageUrl)}`
    : tab.routePath;

/** 最多同时打开的应用标签数（满额再点新应用时提示并拦截） */
export const MAX_OPENED_APP_TABS = 5;

/**
 * 点击应用是否会超出多开上限：重复打开已存在的标签（原位刷新、不新增）
 * 不受限；点新应用且已满 MAX_OPENED_APP_TABS 个时受限（调用方提示并放弃打开）。
 */
export const isAppTabLimitReached = (
  tabs: OpenedAppTabInfo[],
  routePath: string,
  limit = MAX_OPENED_APP_TABS,
): boolean =>
  !tabs.some((item) => item.routePath === routePath) && tabs.length >= limit;

/**
 * 已打开应用标签 Model
 * 只保存在 SPA 运行期内存中（umi plugin-model），刷新即失，
 * 不写 URL、history.state、localStorage，后端不存储。
 */
export default () => {
  const [openedAppTabs, setOpenedAppTabs] = useState<OpenedAppTabInfo[]>([]);

  // 打开（或重复打开/切换到）一个应用标签
  const openApp = useCallback((tab: OpenedAppTabInput) => {
    setOpenedAppTabs((prev) => appendOpenedTab(prev, tab));
  }, []);

  // 关闭一个应用标签
  const closeApp = useCallback((routePath: string) => {
    setOpenedAppTabs((prev) => removeOpenedTab(prev, routePath));
  }, []);

  return { openedAppTabs, openApp, closeApp };
};
