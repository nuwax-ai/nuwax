import type { UserProjectItem } from '@/pages/AppDevPro/type';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { history } from 'umi';

/** 项目类型 tab（全部 = 三类合并） */
export type ProjectTabKey = 'all' | AgentComponentTypeEnum;

/** 项目管理页覆盖的三类项目 */
export const PROJECT_MANAGE_TYPES: AgentComponentTypeEnum[] = [
  AgentComponentTypeEnum.NormalProject,
  AgentComponentTypeEnum.PageApp,
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
 * 按项目类型跳转对应 IDE（与 PROJECT_STRATEGIES 目标路由同源）：
 * - PageApp → 网页应用 IDE（沉浸式路由）
 * - NormalProject / UserApp → 全栈应用 IDE（可携带最新会话 id 直达续聊）
 */
export const openProject = (
  spaceId: number,
  item: Pick<UserProjectItem, 'id' | 'projectType'>,
  conversationId?: number,
) => {
  if (item.projectType === AgentComponentTypeEnum.PageApp) {
    history.push(`/space/${spaceId}/app-dev/${item.id}`);
    return;
  }
  const conversationSuffix = conversationId
    ? `&conversationId=${conversationId}`
    : '';
  history.push(
    `/space/${spaceId}/app-pro?appId=${item.id}${conversationSuffix}`,
  );
};
