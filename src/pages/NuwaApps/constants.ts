/** 已发布分类接口中,网页应用分类树的根节点 key */
export const PAGE_APP_CATEGORY_ROOT_KEY = 'PageApp';

/** 广场-网页应用地址(「更多」入口跳转) */
export const SQUARE_PAGE_APP_PATH = '/square?cate_type=PageApp';

/** 列表每页数量(与广场一致) */
export const APP_LIST_PAGE_SIZE = 48;

/** 应用列表目标类型过滤(app/list 请求体 targetTypes,两 tab 共用) */
export const APP_LIST_TARGET_TYPES: string[] = ['Agent', 'UserApp'];

/** 应用列表子类型过滤(app/list 请求体 targetSubTypes,两 tab 共用) */
export const APP_LIST_TARGET_SUBTYPES: string[] = ['PageApp', 'UserApp'];

/** 最近使用列表拉取条数(recentlyUsed/list 请求体参数,暂写死 200) */
export const RECENT_USED_SIZE = 200;

/** 最近使用网格单列最小宽 px(与 index.less 的 recent-list minmax 下限同步修改) */
export const RECENT_GRID_MIN_COLUMN = 210;

/** 最近使用网格列间距 px(与 index.less 的 recent-list gap 同步修改) */
export const RECENT_GRID_GAP = 16;

/** 最近使用收起时最多展示的行数(超出走展开/收起) */
export const RECENT_COLLAPSED_MAX_ROWS = 2;

/** 应用列表滚动容器 id(无限滚动加载挂载目标) */
export const APP_SCROLL_CONTAINER_ID = 'nuwa-apps-scroll-container';
