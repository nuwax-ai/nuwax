import { parseAppProRoute } from '@/pages/AppDevPro/utils/appProRoute';

/**
 * 侧栏选中关系策略纯函数单源（2026-09-12 抽取）。
 *
 * 收敛「当前路由会话 ↔ 侧栏各处选中态」的判定策略，避免散落在布局组件里内联：
 * - 会话详情路径识别与会话 id 提取（NewHomeSection 派生当前会话的唯一入口）
 * - 单栏导航行高亮决策（SidebarNavLayout：会话详情页抑制 homepage 兜底高亮）
 * - 任务列表与项目分组的选中互斥（会话属项目时选中只落项目分组一处，用户定调）
 *
 * 全部为纯函数：不依赖 React/umi，可独立单测；布局组件只做状态接线。
 * 分层边界：项目子会话反查（findProjectIdByConversation）留在
 * NewHomeSection/components/ProjectPanel/projectPagination.ts——它依赖组件私有的
 * ProjectItem 数据结构，属组件内纯逻辑，不上提。
 *
 * ⚠️ 经典布局注意：ClassicLayout renderSecondMenu 依赖 activeTab==='homepage'
 * 渲染会话列表，useMenuNavigation 的 homepage 兜底不能改——导航高亮抑制
 * （resolveNavHighlightTab）仅限单栏 SidebarNavLayout 消费。
 */

/** 会话详情路由：/home/chat/:id/:agentId（第一段 id = 会话 id），前缀匹配含子路径 */
const CONVERSATION_DETAIL_PATH = /^\/home\/chat(?:\/|$)/;

/** 会话详情路径中的会话 id 段 */
const CONVERSATION_ID_SEGMENT = /^\/home\/chat\/([^/]+)/;

/** 工作空间域路由前缀：/space/:spaceId/*（app-pro 等全栈 IDE 面板承载项目会话） */
const WORKSPACE_PATH_PREFIX = /^\/space(?:\/|$)/;

/** 是否会话详情路由（pathname 不含查询参数，前缀匹配） */
export const isConversationDetailPath = (pathname: string): boolean =>
  CONVERSATION_DETAIL_PATH.test(pathname);

/**
 * 从路由提取当前会话 id；无法识别返回 null。
 * 两类承载路由：
 * - /home/chat/:id/:agentId —— 会话 id 取路径段
 * - /space/:spaceId/app-pro/:appId/:conversationId —— 全栈 IDE 会话面板，id 取路径段
 *   （项目子会话点击即跳此路由，2026-09-15 侧栏选中补全）
 */
export const extractConversationIdFromPath = (
  pathname: string,
  search = '',
): string | null => {
  if (isConversationDetailPath(pathname)) {
    return pathname.match(CONVERSATION_ID_SEGMENT)?.[1] ?? null;
  }
  const appProRoute = parseAppProRoute(pathname);
  if (appProRoute) {
    return String(appProRoute.conversationId);
  }
  if (WORKSPACE_PATH_PREFIX.test(pathname)) {
    // agent-dev 等仍走 query；app-pro 已在上方路径段解析
    const id = new URLSearchParams(search).get('conversationId');
    return id ? id : null;
  }
  return null;
};

/**
 * 单栏导航行高亮决策。
 * - 应用标签命中（女娲应用多开标签，/user-app/:id、/agent/:id）时导航整体让位，
 *   选中关系收敛到标签项（判断置于最前——不依赖 activeTab 兜底到哪个 code）；
 * - 会话详情路由下抑制 homepage 兜底高亮（useMenuNavigation 匹配不到一级菜单时
 *   兜底选中第一个菜单=homepage，与会话行形成双白卡，2026-09-12 定调收敛）；
 * - 会话行命中时导航整体让位（2026-09-15 用户定调优先级：先命中项目/任务列表中
 *   的会话，然后才是导航菜单——/space/app-pro 项目会话不该亮「工作空间」）。
 * 其余激活码原样返回。
 */
export const resolveNavHighlightTab = (
  activeTab: string,
  pathname: string,
  conversationRowActive = false,
  appTabActive = false,
): string => {
  if (appTabActive) {
    return '';
  }
  if (conversationRowActive) {
    return '';
  }
  if (activeTab === 'homepage' && isConversationDetailPath(pathname)) {
    return '';
  }
  return activeTab;
};

/**
 * 任务列表条目选中判定（与项目分组互斥）。
 * 命中路由会话、且该会话未被反查为项目子会话（activeProjectChildId 由
 * ProjectPanel 上报）时才高亮；会话归属项目的场景选中只落项目分组一处。
 * 相比内联版的差异：路由会话缺失时恒为不高亮（原实现对无 id 条目会误真，属顺手收紧）。
 */
export const isTaskConversationActive = (
  routeChatId: string | undefined,
  conversationId: number | string | undefined,
  activeProjectChildId: string | null,
): boolean =>
  routeChatId !== undefined &&
  routeChatId !== activeProjectChildId &&
  conversationId !== undefined &&
  String(conversationId) === routeChatId;
