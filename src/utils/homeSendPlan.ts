import type { AgentMode } from '@/components/business-component/AgentIntervention';
import {
  getProjectTypeByFunctionType,
  showSpaceSelectorForFunctionType,
} from '@/constants/recommendAgentPolicy.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { AgentSelectedComponentInfo } from '@/types/interfaces/agent';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type { SelectedDocInfo } from '@/types/interfaces/repo';
import type { PinnedProjectInfo } from '@/types/interfaces/userProject';

/**
 * 首页发送计划纯函数（收编原 src/pages/Home/index.tsx handleEnter 的
 * 双分支决策与参数拼装，2026-09-10 上框需求起下沉；行为不变 + 新增上框优先级）。
 *
 * 分支优先级：
 * 1. 项目上框（pinnedProject）→ 直接创建会话并绑定项目（带
 *    projectId/devAgentId/sandboxId，全栈另带 redirectUrl 直接跳 IDE），
 *    不走 /api/project/create；
 * 2. 项目类推荐（functionType 映射出项目类型）→ 建项目分支 payload；
 * 3. 其余 → 纯会话分支 attach。
 *
 * 纯函数（仅依赖 types/constants 层），页面侧只做 build → execute。
 */

/**
 * 自定义工作目录仅个人电脑沙箱生效（wiki #17）：云电脑或未选电脑一律不带。
 * 原逻辑在首页两个分支与 useConversation 重复三处，收敛于此。
 */
export const resolvePersonalWorkspaceDir = (
  computerId?: string,
  workspaceDir?: string,
): string | undefined =>
  computerId && computerId !== '-1' ? workspaceDir || undefined : undefined;

/** 建项目分支 payload（与 pages 层 ProjectCreatePayload 结构对齐；utils 禁依赖 pages） */
export interface HomeProjectCreatePayload {
  type: AgentComponentTypeEnum;
  subType?: string;
  prompt: string;
  files?: UploadFileInfo[];
  skillIds?: number[];
  modelId?: number;
  tools?: AgentSelectedComponentInfo[];
  computerId?: string;
  /** 仅个人电脑生效（resolvePersonalWorkspaceDir 产物） */
  workspaceDir?: string;
  agentMode?: AgentMode;
  agentId?: number;
  /** 调试关联智能体ID，透传 /api/project/create */
  devAgentId?: number;
  /** 资料库文档（首页能力弹窗选中，随 routeState 透传，项目页消费） */
  selectedDocs?: SelectedDocInfo[];
}

/** 会话分支 attach（与 useConversation.handleCreateConversation 的 attach 结构对齐） */
export interface HomeConversationAttach {
  message: string;
  files?: UploadFileInfo[];
  infos?: AgentSelectedComponentInfo[];
  messageSourceType?: MessageSourceType;
  selectedComputerId?: string;
  /** 仅个人电脑生效（resolvePersonalWorkspaceDir 产物） */
  workspaceDir?: string;
  skillIds?: number[];
  modelId?: number;
  agentMode?: AgentMode;
  /** 上框项目：直接建会话绑定项目，不走隐式建项目 */
  projectId?: number;
  /** 上框项目为全栈时携带（= 当前选中的全栈类智能体） */
  devAgentId?: number;
  /** 上框项目沙箱（优先于个人电脑选择） */
  sandboxId?: number;
  /** 创建成功后的跳转 URL 前缀（拼接会话 id；全栈跳 app-pro 用） */
  redirectUrl?: string;
  /** 资料库文档（首页能力弹窗选中，随首条 chat 消息发送；
   *  专家组件已由调用方按 id+type 去重合并进 infos，不单独透传） */
  selectedDocs?: SelectedDocInfo[];
}

export interface HomeSendPlanInput {
  /** 生效智能体 ID（已含推荐/租户默认 fallback，由页面侧解析） */
  currentAgentId: number;
  /** 首页项目上框（存在时优先生效） */
  pinnedProject?: PinnedProjectInfo;
  /** 当前选中推荐位功能类型（无上框时决定是否走建项目分支） */
  selectedFunctionType?: string | null;
  message: string;
  files?: UploadFileInfo[];
  skillIds?: number[];
  modelId?: number;
  agentMode?: AgentMode;
  /** 手选组件（建项目分支作 tools、会话分支作 infos；专家组件由页面侧合并后传入） */
  infos?: AgentSelectedComponentInfo[];
  /** 资料库文档（建项目随 routeState 透传 / 会话随首条消息发送） */
  selectedDocs?: SelectedDocInfo[];
  selectedComputerId?: string;
  workspaceDir?: string;
  /** 项目类推荐展示空间选择器时的选中空间 */
  selectedSpaceId?: number;
  /** 当前空间（getSpaceId 解析产物） */
  fallbackSpaceId?: number;
}

export type HomeSendPlan =
  | {
      kind: 'createProject';
      payload: HomeProjectCreatePayload;
      /** 空间选择器场景取选中空间，否则当前空间；缺失由执行侧提示 */
      spaceId?: number;
    }
  | {
      kind: 'createConversation';
      agentId: number;
      attach: HomeConversationAttach;
    };

/** 构建首页发送计划 */
export const buildHomeSendPlan = (input: HomeSendPlanInput): HomeSendPlan => {
  const {
    currentAgentId,
    pinnedProject,
    selectedFunctionType,
    message,
    files,
    skillIds,
    modelId,
    agentMode,
    infos,
    selectedDocs,
    selectedComputerId,
    workspaceDir,
    selectedSpaceId,
    fallbackSpaceId,
  } = input;

  // 分支 1：项目上框 → 直接建会话绑定项目（跳过 /api/project/create）
  if (pinnedProject) {
    const isUserApp =
      pinnedProject.projectType === AgentComponentTypeEnum.UserApp;
    return {
      kind: 'createConversation',
      agentId: currentAgentId,
      attach: {
        message,
        files,
        infos,
        messageSourceType: 'home' as MessageSourceType,
        skillIds,
        modelId,
        agentMode,
        selectedDocs,
        projectId: pinnedProject.projectId,
        ...(pinnedProject.sandboxId
          ? { sandboxId: pinnedProject.sandboxId }
          : {}),
        ...(isUserApp
          ? {
              devAgentId: currentAgentId,
              // 全栈创建成功直接跳全栈 IDE（缺 spaceId 时降级走默认 /home/chat）
              ...(pinnedProject.spaceId
                ? {
                    redirectUrl: `/space/${pinnedProject.spaceId}/app-pro?appId=${pinnedProject.projectId}&conversationId=`,
                  }
                : {}),
            }
          : {}),
      },
    };
  }

  // 分支 2：项目类推荐 → 建项目
  const projectType = getProjectTypeByFunctionType(selectedFunctionType);
  if (projectType) {
    return {
      kind: 'createProject',
      spaceId: showSpaceSelectorForFunctionType(selectedFunctionType)
        ? selectedSpaceId
        : fallbackSpaceId,
      payload: {
        type: projectType,
        prompt: message,
        files,
        skillIds,
        modelId,
        tools: infos,
        computerId: selectedComputerId,
        // 自定义工作目录（wiki #17）：仅个人电脑生效，选中目录被占用时创建报错
        workspaceDir: resolvePersonalWorkspaceDir(
          selectedComputerId,
          workspaceDir,
        ),
        agentMode,
        agentId: currentAgentId,
        // 首页选中 agent 创建项目：把该 agent 作为项目调试智能体传给后端
        devAgentId: currentAgentId,
        selectedDocs,
      },
    };
  }

  // 分支 3：纯对话 → 建会话
  return {
    kind: 'createConversation',
    agentId: currentAgentId,
    attach: {
      message,
      files,
      infos,
      messageSourceType: 'home' as MessageSourceType,
      selectedComputerId,
      workspaceDir: resolvePersonalWorkspaceDir(
        selectedComputerId,
        workspaceDir,
      ),
      skillIds,
      modelId,
      agentMode,
      selectedDocs,
    },
  };
};
