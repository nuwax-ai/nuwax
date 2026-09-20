import type { UserProjectItem } from '@/pages/AppDevPro/type';
import { buildAppProRoute } from '@/pages/AppDevPro/utils/appProRoute';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { history } from 'umi';

/** 项目类型 tab（全部 = projectTypes 含三种可管理类型） */
export type ProjectTabKey = 'all' | AgentComponentTypeEnum;

/** 项目管理页可筛选的类型 tab（不含网页应用） */
export const PROJECT_TAB_TYPES: AgentComponentTypeEnum[] = [
  AgentComponentTypeEnum.NormalProject,
  AgentComponentTypeEnum.UserApp,
  AgentComponentTypeEnum.ThirdApp,
];

/** 「全部」Tab 查询时传入的 projectTypes */
export const PROJECT_ALL_TAB_TYPES: AgentComponentTypeEnum[] = [
  AgentComponentTypeEnum.UserApp,
  AgentComponentTypeEnum.NormalProject,
  AgentComponentTypeEnum.ThirdApp,
];

/** 类型 tab 词表 key（i18n 渲染期取词） */
export const PROJECT_TAB_LABEL_KEYS: Record<string, string> = {
  all: 'PC.Pages.SpaceProjectManage.tabAll',
  [AgentComponentTypeEnum.NormalProject]:
    'PC.Pages.SpaceProjectManage.tabNormalProject',
  [AgentComponentTypeEnum.PageApp]: 'PC.Pages.SpaceProjectManage.tabPageApp',
  [AgentComponentTypeEnum.UserApp]: 'PC.Pages.SpaceProjectManage.tabUserApp',
  [AgentComponentTypeEnum.ThirdApp]: 'PC.Pages.SpaceProjectManage.tabThirdApp',
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
 * - UserApp → 有会话 id 时进全栈 IDE，否则进应用详情页
 * - ThirdApp → 三方应用详情页
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
  if (item.projectType === AgentComponentTypeEnum.ThirdApp) {
    history.push(`/space/${spaceId}/third-app-detail/${item.id}`);
    return;
  }
  if (item.projectType === AgentComponentTypeEnum.NormalProject) {
    if (conversationId && agentId) {
      history.push(`/home/chat/${conversationId}/${agentId}`);
      return;
    }
    history.push(`/space/${spaceId}/normal-project-detail/${item.id}`);
    return;
  }
  if (item.projectType === AgentComponentTypeEnum.UserApp) {
    if (conversationId) {
      history.push(buildAppProRoute(spaceId, item.id, conversationId));
      return;
    }
    history.push(`/space/${spaceId}/app-project-detail/${item.id}`);
    return;
  }
  if (conversationId) {
    history.push(buildAppProRoute(spaceId, item.id, conversationId));
  }
};
