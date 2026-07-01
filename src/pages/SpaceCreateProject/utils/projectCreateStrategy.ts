import { createAppDevInitialPayloadKey } from '@/hooks/useAppDevInitialAutoSend';
import { apiProjectCreate } from '@/services/appDev';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentSubTypeEnum } from '@/types/enums/space';
import type { UploadFileInfo } from '@/types/interfaces/common';
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
  agentMode?: string;
}

interface ProjectStrategy {
  getUrl: (params: {
    spaceId: number;
    targetId: number;
    conversationId: number;
    tenantConfigInfo?: any;
  }) => string;
}

const PROJECT_STRATEGIES: Partial<
  Record<AgentComponentTypeEnum, ProjectStrategy>
> = {
  [AgentComponentTypeEnum.Agent]: {
    getUrl: ({ spaceId, targetId, conversationId }) =>
      `/space/${spaceId}/agent-dev?agentId=${targetId}&conversationId=${conversationId}`,
  },
  [AgentComponentTypeEnum.PageApp]: {
    getUrl: ({ spaceId, targetId }) => `/space/${spaceId}/app-dev/${targetId}`,
  },
  [AgentComponentTypeEnum.Skill]: {
    getUrl: ({ spaceId, targetId, conversationId, tenantConfigInfo }) =>
      `/space/${spaceId}/skill-details-conversation/${targetId}?agentId=${tenantConfigInfo?.skillDevAgentId}&conversationId=${conversationId}`,
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
  const res = await apiProjectCreate({
    spaceId,
    targetType: flowTargetType,
    subType: payload.subType,
  });
  const { targetId, conversationId } = res.data;

  const routeState = {
    message: payload.prompt,
    files: payload.files,
    skillIds: payload.skillIds,
    modelId: payload.modelId,
    infos: payload.tools,
    selectedComputerId: payload.computerId,
    agentMode: payload.agentMode,
  };

  if (payload.type === AgentComponentTypeEnum.PageApp) {
    setContext(createAppDevInitialPayloadKey(targetId), routeState);
  }

  const url = strategy.getUrl({
    spaceId,
    targetId,
    conversationId,
    tenantConfigInfo,
  });

  const finalUrl =
    payload.subType === AgentSubTypeEnum.Flow
      ? `/space/${spaceId}/agent/${targetId}`
      : url;

  history.push(finalUrl, routeState);
};
