/** 已发布分类接口中,网页应用分类树的根节点 key */
export const PAGE_APP_CATEGORY_ROOT_KEY = 'PageApp';

/** 全栈应用子类型标识:回包 targetSubType 为该值时,点击卡片跳全栈应用页 */
export const USER_APP_TARGET_SUBTYPE = 'UserApp';

/** 网页应用子类型标识:targetType=Agent 且 targetSubType 为该值时,点击不上报最近使用 */
export const PAGE_APP_TARGET_SUBTYPE = 'PageApp';

/** 三方应用子类型标识:回包 targetSubType 为该值时,点击卡片与全栈应用同走 /user-app 路由 */
export const THIRD_APP_TARGET_SUBTYPE = 'ThirdApp';

/** 全栈应用详情路由前缀(拼 targetId 跳转 /user-app/:appId) */
export const USER_APP_PATH_PREFIX = '/user-app';

/** 广场-网页应用地址(「更多」入口跳转) */
export const SQUARE_PAGE_APP_PATH = '/square?cate_type=PageApp';

/** 列表每页数量(与广场一致) */
export const APP_LIST_PAGE_SIZE = 48;

/** 最近使用列表拉取条数(recentlyUsed/list 请求体 pageSize 参数) */
export const RECENT_USED_SIZE = 100;

/** 最近使用收起时最多展示的行数(超出走展开/收起;列数按首行卡片实测) */
export const RECENT_COLLAPSED_MAX_ROWS = 2;

/** 应用列表滚动容器 id(无限滚动加载挂载目标) */
export const APP_SCROLL_CONTAINER_ID = 'nuwa-apps-scroll-container';
