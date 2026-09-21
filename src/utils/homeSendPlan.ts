import type { AgentMode } from '@/components/business-component/AgentIntervention';
import {
  getProjectTypeByFunctionType,
  showSpaceSelectorForFunctionType,
} from '@/constants/recommendAgentPolicy.constants';
import { CLOUD_SANDBOX_ID } from '@/constants/workspaceDirPolicy.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { AgentSelectedComponentInfo } from '@/types/interfaces/agent';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type { SelectedDocInfo } from '@/types/interfaces/repo';
import type { PinnedProjectInfo } from '@/types/interfaces/userProject';
import { buildAppProRedirectPrefix } from '@/utils/appProRoute';
import { normalizeSandboxIdValue } from '@/utils/effectiveSandbox';

/**
 * 首页发送计划纯函数（收编原 src/pages/Home/index.tsx handleEnter 的
 * 双分支决策与参数拼装，2026-09-10 上框需求起下沉；行为不变 + 新增上框优先级）。
 *
 * 分支优先级：
 * 1. 项目上框（pinnedProject）→ 直接创建会话并绑定项目（带
 *    projectId/devAgentId/sandboxId，全栈另带 redirectUrl 直接跳 IDE），
 *    不走 /api/project/create；常规项目参与者（pinnedProjectSandboxSelection）
 *    改带自选沙箱（云端/个人电脑+工作目录）；
 * 2. 项目类推荐（functionType 映射出项目类型）→ 建项目分支 payload；
 * 3. 其余 → 纯会话分支 attach。
 *
 * 纯函数（仅依赖 types/constants/utils 纯函数层），页面侧只做 build → execute。
 */

/**
 * 自定义工作目录仅个人电脑沙箱生效（wiki #17）：云电脑或未选电脑一律不带。
 * 原逻辑在首页两个分支与 useConversation 重复三处，收敛于此。
 */
export const resolvePersonalWorkspacePath = (
  computerId?: string,
  workspacePath?: string,
): string | undefined =>
  computerId && computerId !== CLOUD_SANDBOX_ID
    ? workspacePath || undefined
    : undefined;

/**
 * 常规项目参与者判定（多人参与）：上框常规项目且 owner === false（后端按当前
 * 用户视角回的布尔，须严格等于——undefined=未回包会被 falsy 误吞）→ 参与者，
 * 新建会话时开放沙箱自选（云端/个人电脑+工作目录）——项目沙箱可能绑定的是
 * 创建者的个人电脑，参与者不可用。创建者本人 / 字段未回包 / 非常规项目
 * → false，沿用项目沙箱现状（防御式降级，与 pinned/archived 契约先行同口径）。
 */
export const resolvePinnedSandboxSelectable = (
  pinned?: Pick<PinnedProjectInfo, 'projectType' | 'owner'>,
): boolean =>
  !!pinned &&
  pinned.projectType === AgentComponentTypeEnum.NormalProject &&
  pinned.owner === false;

/**
 * 详情接口回包 creatorId（创建者用户 id）→ owner 布尔（当前用户是否创建者）。
 * 详情契约未随列表加 owner 字段，用详情已有 creatorId 与当前用户 id 比对等价计算；
 * 任一侧缺失返回 undefined（消费侧按 === false 判参与者，undefined 走现状）。
 */
export const resolveProjectOwnerFlag = (
  creatorId?: number,
  currentUserId?: number | string | null,
): boolean | undefined => {
  if (
    creatorId === undefined ||
    creatorId === null ||
    currentUserId === undefined ||
    currentUserId === null ||
    currentUserId === ''
  ) {
    return undefined;
  }
  return String(creatorId) === String(currentUserId);
};

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
  /** 仅个人电脑生效（resolvePersonalWorkspacePath 产物） */
  workspacePath?: string;
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
  /** 仅个人电脑生效（resolvePersonalWorkspacePath 产物） */
  workspacePath?: string;
  skillIds?: number[];
  modelId?: number;
  agentMode?: AgentMode;
  /** 上框项目：直接建会话绑定项目，不走隐式建项目 */
  projectId?: number;
  /** 上框项目类型（UserApp=全栈 / NormalProject=常规），绑定项目时后端必填 */
  projectType?: AgentComponentTypeEnum;
  /** 上框项目为全栈时携带（= 当前选中的全栈类智能体） */
  devAgentId?: number;
  /** 上框项目沙箱（创建者走项目绑定；参与者自选=云端 -1/个人电脑 id，优先于项目沙箱）。
   *  个人电脑 id 可能是非数字形态（新沙箱），数字归一/字符串透传（bug2443 勿 Number 转 NaN） */
  sandboxId?: number | string;
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
  /**
   * 上框常规项目为参与者（resolvePinnedSandboxSelectable 产物）：
   * 沙箱由参与者自选（云端/个人电脑+工作目录），不用项目沙箱
   */
  pinnedProjectSandboxSelection?: boolean;
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
  workspacePath?: string;
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
    pinnedProjectSandboxSelection,
    selectedFunctionType,
    message,
    files,
    skillIds,
    modelId,
    agentMode,
    infos,
    selectedDocs,
    selectedComputerId,
    workspacePath,
    selectedSpaceId,
    fallbackSpaceId,
  } = input;

  // 分支 1：项目上框 → 直接建会话绑定项目（跳过 /api/project/create）
  if (pinnedProject) {
    const isUserApp =
      pinnedProject.projectType === AgentComponentTypeEnum.UserApp;
    // 参与者（常规项目多人参与）自选沙箱：项目沙箱可能绑定创建者的个人电脑
    //（参与者不可用），改带参与者自己的选择——云端也显式云哨兵（CLOUD_SANDBOX_ID），
    // 防后端回落项目沙箱；个人电脑另带工作目录。selectedComputerId 随 attach
    // 走 route state，会话页首条消息沙箱链路（getEffectiveSandboxId）现成衔接。
    const sandboxAttach = pinnedProjectSandboxSelection
      ? {
          selectedComputerId,
          // 类型归一（bug2443）：数字形态转 number，非数字沙箱 id 透传字符串
          sandboxId:
            normalizeSandboxIdValue(
              selectedComputerId && selectedComputerId !== CLOUD_SANDBOX_ID
                ? selectedComputerId
                : CLOUD_SANDBOX_ID,
            ) ?? Number(CLOUD_SANDBOX_ID),
          workspacePath: resolvePersonalWorkspacePath(
            selectedComputerId,
            workspacePath,
          ),
        }
      : {
          ...(pinnedProject.sandboxId
            ? { sandboxId: pinnedProject.sandboxId }
            : {}),
        };
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
        projectType: pinnedProject.projectType,
        ...sandboxAttach,
        ...(isUserApp
          ? {
              devAgentId: currentAgentId,
              // 全栈创建成功直接跳全栈 IDE（缺 spaceId 时降级走默认 /home/chat）
              ...(pinnedProject.spaceId
                ? {
                    redirectUrl: buildAppProRedirectPrefix(
                      pinnedProject.spaceId,
                      pinnedProject.projectId,
                    ),
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
        workspacePath: resolvePersonalWorkspacePath(
          selectedComputerId,
          workspacePath,
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
      workspacePath: resolvePersonalWorkspacePath(
        selectedComputerId,
        workspacePath,
      ),
      skillIds,
      modelId,
      agentMode,
      selectedDocs,
    },
  };
};
