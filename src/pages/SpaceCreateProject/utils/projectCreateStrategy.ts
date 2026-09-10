import { createAppDevInitialPayloadKey } from '@/hooks/useAppDevInitialAutoSend';
import { apiProjectCreate } from '@/services/appDev';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentSubTypeEnum } from '@/types/enums/space';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { SelectedDocInfo } from '@/types/interfaces/repo';
import { message } from 'antd';
import { history } from 'umi';

export interface ProjectCreatePayload {
  type: AgentComponentTypeEnum;
  subType?: string;
  prompt: string;
  files?: UploadFileInfo[];
  skillIds?: number[];
  modelId?: number;
  tools?: any[];
  computerId?: string;
  /**
   * 自定义工作目录（wiki #17）：仅个人电脑沙箱生效，非空才传；
   * 选中目录被占用时后端报错（目录禁止跨项目复用）。
   */
  workspaceDir?: string;
  agentMode?: string;
  agentId?: number;
  /** 调试关联智能体ID，透传 /api/project/create */
  devAgentId?: number;
  /** 资料库已选文档：随 routeState 透传给目标页（消费链路后续接入） */
  selectedDocs?: SelectedDocInfo[];
}

interface ProjectStrategy {
  getUrl: (params: {
    spaceId: number;
    targetId: number;
    conversationId: number;
    tenantConfigInfo?: any;
    agentId?: number;
  }) => string;
}

const PROJECT_STRATEGIES: Partial<
  Record<AgentComponentTypeEnum, ProjectStrategy>
> = {
  [AgentComponentTypeEnum.Agent]: {
    getUrl: ({ spaceId, targetId, conversationId }) =>
      `/space/${spaceId}/agent-dev?agentId=${targetId}&conversationId=${conversationId}`,
  },
  [AgentComponentTypeEnum.UserApp]: {
    getUrl: ({ spaceId, targetId, conversationId }) =>
      `/space/${spaceId}/app-pro?appId=${targetId}&conversationId=${conversationId}`,
  },
  // todo： 根据实际需求，修改跳转路径
  [AgentComponentTypeEnum.NormalProject]: {
    getUrl: ({ spaceId, targetId, conversationId }) =>
      `/space/${spaceId}/app-pro?appId=${targetId}&conversationId=${conversationId}`,
  },
  [AgentComponentTypeEnum.PageApp]: {
    getUrl: ({ spaceId, targetId }) => `/space/${spaceId}/app-dev/${targetId}`,
  },
  [AgentComponentTypeEnum.Skill]: {
    getUrl: ({ spaceId, targetId, conversationId }) =>
      `/space/${spaceId}/skill-details-conversation/${targetId}?conversationId=${conversationId}`,
  },
  [AgentComponentTypeEnum.Plugin]: {
    getUrl: ({ spaceId, targetId, conversationId }) =>
      `/space/${spaceId}/plugin/${targetId}/cloud-tool?conversationId=${conversationId}`,
  },
};

export const createProjectAndNavigate = async ({
  payload,
  spaceId,
  tenantConfigInfo,
  setContext,
}: {
  payload: ProjectCreatePayload;
  spaceId: number;
  tenantConfigInfo?: any;
  setContext: (key: string, value: unknown) => void;
}) => {
  const strategy = PROJECT_STRATEGIES[payload.type];

  if (!strategy) {
    return;
  }

  const flowTargetType =
    payload.subType === AgentSubTypeEnum.Flow ? 'AgentFlow' : payload.type;
  try {
    const res = await apiProjectCreate({
      spaceId,
      targetType: flowTargetType,
      subType: payload.subType,
      sandboxId: payload.computerId ? Number(payload.computerId) : undefined,
      workspaceDir: payload.workspaceDir,
      devAgentId: payload.devAgentId,
    });
    if (!res?.data?.targetId) {
      // 业务失败（含自定义目录被占用）：展示后端错误信息并中止
      throw new Error(
        res?.message || dict('PC.Components.WorkspaceDir.createProjectFailed'),
      );
    }
    const { targetId, conversationId } = res.data;

    const routeState = {
      message: payload.prompt,
      files: payload.files,
      skillIds: payload.skillIds,
      modelId: payload.modelId,
      infos: payload.tools,
      selectedComputerId: payload.computerId,
      agentMode: payload.agentMode,
      selectedDocs: payload.selectedDocs,
    };

    if (payload.type === AgentComponentTypeEnum.PageApp) {
      setContext(createAppDevInitialPayloadKey(targetId), routeState);
    }

    const url = strategy.getUrl({
      spaceId,
      targetId,
      conversationId,
      tenantConfigInfo,
      agentId: payload.agentId,
    });

    const finalUrl =
      payload.subType === AgentSubTypeEnum.Flow
        ? `/space/${spaceId}/agent/${targetId}`
        : url;

    history.push(finalUrl, routeState);
  } catch (error: any) {
    message.error(
      error?.message || dict('PC.Components.WorkspaceDir.createProjectFailed'),
    );
  }
};
