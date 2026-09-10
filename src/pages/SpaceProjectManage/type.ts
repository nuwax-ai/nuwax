import type { UserProjectItem } from '@/pages/AppDevPro/type';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { history } from 'umi';

/** 项目类型 tab（全部 = 三类合并） */
export type ProjectTabKey = 'all' | AgentComponentTypeEnum;

/** 项目管理页覆盖的三类项目（「全部」tab 合并查询口径） */
export const PROJECT_MANAGE_TYPES: AgentComponentTypeEnum[] = [
  AgentComponentTypeEnum.NormalProject,
  AgentComponentTypeEnum.PageApp,
  AgentComponentTypeEnum.UserApp,
];

/**
 * 类型 tab 口径（2026-09-10 新建入口去除网页应用后，网页应用不再提供
 * 独立筛选 tab）；「全部」仍按 PROJECT_MANAGE_TYPES 合并查询，
 * 存量 PageApp 项目照常展示与打开。
 */
export const PROJECT_TAB_TYPES: AgentComponentTypeEnum[] = [
  AgentComponentTypeEnum.NormalProject,
  AgentComponentTypeEnum.UserApp,
];

/** 类型 tab 词表 key（i18n 渲染期取词） */
export const PROJECT_TAB_LABEL_KEYS: Record<string, string> = {
  all: 'PC.Pages.SpaceProjectManage.tabAll',
  [AgentComponentTypeEnum.NormalProject]:
    'PC.Pages.SpaceProjectManage.tabNormalProject',
  [AgentComponentTypeEnum.PageApp]: 'PC.Pages.SpaceProjectManage.tabPageApp',
  [AgentComponentTypeEnum.UserApp]: 'PC.Pages.SpaceProjectManage.tabUserApp',
};

/** 项目类型徽标样式类名（index.less 内 per-type 配色） */
export const projectTypeBadgeClass = (type: string): string =>
  `badge-${type?.toLowerCase()}`;

/**
 * 按项目类型跳转对应落点（常规项目对齐单栏「项目」分组的会话点击，
 * NewHomeSection.handleConversationClick 的 else 分支）：
 * - PageApp → 网页应用 IDE（沉浸式路由）
 * - NormalProject → home/chat 会话详情（常规项目无独立 IDE）；会话 id 与
 *   智能体 id 需齐备，缺任一回退全栈 IDE 路由（由 IDE 内自行建立会话）
 * - UserApp → 全栈应用 IDE（可携带最新会话 id 直达续聊）
 */
export const openProject = (
  spaceId: number,
  item: Pick<UserProjectItem, 'id' | 'projectType'>,
  conversationId?: number,
  agentId?: number,
) => {
  if (item.projectType === AgentComponentTypeEnum.PageApp) {
    history.push(`/space/${spaceId}/app-dev/${item.id}`);
    return;
  }
  if (
    item.projectType === AgentComponentTypeEnum.NormalProject &&
    conversationId &&
    agentId
  ) {
    history.push(`/home/chat/${conversationId}/${agentId}`);
    return;
  }
  const conversationSuffix = conversationId
    ? `&conversationId=${conversationId}`
    : '';
  history.push(
    `/space/${spaceId}/app-pro?appId=${item.id}${conversationSuffix}`,
  );
};
