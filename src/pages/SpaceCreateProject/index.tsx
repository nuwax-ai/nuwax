import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { createAppDevInitialPayloadKey } from '@/hooks/useAppDevInitialAutoSend';
import { apiAgentConfigUpdate } from '@/services/agentConfig';
import { apiAgentGenerateInfo, apiProjectCreate } from '@/services/appDev';
import { apiPluginHttpUpdate } from '@/services/plugin';
import { apiSkillUpdate } from '@/services/skill';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history, useModel, useParams } from 'umi';
import GreetingHeader from './components/GreetingHeader';
import PromptBox from './components/PromptBox';
import RecentProjects from './components/RecentProjects';
import styles from './index.less';

const cx = classNames.bind(styles);

import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AgentSubTypeEnum } from '@/types/enums/space';
import type { SubmitPayload } from './components/PromptBox';

/**
 * 项目构建与跳转策略接口定义
 * 用于解耦不同项目类型在新建阶段独特的初始化元数据与路由配置
 */
interface ProjectStrategy {
  /** 构建阶段自定义的 Loading 提示文案，若为空则不显示阶段 loading */
  loadingText?: string;
  /** 可选的前置 AI 元数据（名称、描述、头像）生成与接口保存更新逻辑 */
  initMetadata?: (targetId: number, prompt: string) => Promise<void>;
  /** 生成跳转的目标路由 URL */
  getUrl: (params: {
    spaceId: number;
    targetId: number;
    conversationId: number;
    tenantConfigInfo?: any;
  }) => string;
}

/**
 * 封装通用 AI 元数据生成，调用大模型生成名称、描述与图标地址
 * @param prompt 用户输入的原始提示词
 * @returns 包含生成元数据的对象，生成失败则返回 null
 */
const generateProjectMetadata = async (prompt: string) => {
  const res = await apiAgentGenerateInfo({ prompt });
  if (res?.code === SUCCESS_CODE && res?.data) {
    return res.data;
  }
  return null;
};

/**
 * 各种项目构建跳转的行为策略映射表
 * 后续若接入新的 Tab 类型，在此处横向扩展配置即可，核心流程完全无需修改
 */
const PROJECT_STRATEGIES: Partial<
  Record<AgentComponentTypeEnum, ProjectStrategy>
> = {
  // 智能体策略
  [AgentComponentTypeEnum.Agent]: {
    loadingText: '正在使用 AI 自动生成智能体信息...',
    initMetadata: async (targetId, prompt) => {
      const meta = await generateProjectMetadata(prompt);
      if (meta) {
        // 调用智能体配置修改接口进行信息补全更新
        await apiAgentConfigUpdate({
          id: targetId,
          name: meta.name,
          description: meta.description,
          icon: meta.iconUrl,
        } as any);
      }
    },
    getUrl: ({ spaceId, targetId, conversationId }) =>
      `/space/${spaceId}/conversation-agent?agentId=${targetId}&conversationId=${conversationId}`,
  },
  // 技能策略
  [AgentComponentTypeEnum.Skill]: {
    loadingText: '正在使用 AI 自动生成技能信息...',
    initMetadata: async (targetId, prompt) => {
      const meta = await generateProjectMetadata(prompt);
      if (meta) {
        // 调用技能修改接口进行信息补全更新
        await apiSkillUpdate({
          id: targetId,
          name: meta.name,
          description: meta.description,
          icon: meta.iconUrl,
        });
      }
    },
    getUrl: ({ spaceId, targetId, conversationId, tenantConfigInfo }) =>
      `/space/${spaceId}/skill-details-conversation/${targetId}?agentId=${tenantConfigInfo?.skillDevAgentId}&conversationId=${conversationId}`,
  },
  // 插件策略
  [AgentComponentTypeEnum.Plugin]: {
    loadingText: '正在使用 AI 自动生成插件信息...',
    initMetadata: async (targetId, prompt) => {
      const meta = await generateProjectMetadata(prompt);
      if (meta) {
        // 调用 HTTP 插件配置修改接口进行信息补全更新
        await apiPluginHttpUpdate({
          id: targetId,
          name: meta.name,
          description: meta.description,
          icon: meta.iconUrl,
        });
      }
    },
    getUrl: ({ spaceId, targetId, conversationId }) =>
      `/space/${spaceId}/plugin/${targetId}/cloud-tool?conversationId=${conversationId}`,
  },
};

const SpaceCreateProject: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const { setContext } = useModel('pageHandoffContext');

  /**
   * 处理新建项目提交逻辑
   * 基于策略模式，统一控制新建流、AI 元数据初始化以及路由跳转
   */
  const handleCreateSubmit = async ({
    type: targetType,
    subType,
    prompt,
    files,
    skillIds,
    modelId,
    tools,
    computerId,
    agentMode,
  }: SubmitPayload) => {
    // todo: 页面应用不需要策略，直接跳转到页面开发页面，后续再补充
    if (targetType === AgentComponentTypeEnum.PageApp) {
      const res = await apiProjectCreate({ targetType, subType });
      const { targetId } = res.data;

      setContext(createAppDevInitialPayloadKey(targetId), {
        message: prompt,
        files,
        skillIds,
        modelId,
        infos: tools,
        selectedComputerId: computerId,
        agentMode,
      });
      history.push(`/space/${spaceId}/app-dev/${targetId}`);
      return;
    }

    // 1. 匹配对应策略，未配置的类型（如 PageApp）直接拦截返回
    const strategy = PROJECT_STRATEGIES[targetType];

    if (!strategy) {
      return;
    }

    // 2. 开启统一的新建 loading 提示
    const hide = message.loading({
      content: `正在为您使用 AI 引擎构建项目...`,
      key: 'create_project_loading',
      duration: 0,
    });

    try {
      // 3. 调用 API 创建基础项目记录以获取 ID
      // Flow 子类型用专门的 targetType，后端按此区分创建逻辑
      const flowTargetType =
        subType === AgentSubTypeEnum.Flow ? 'AgentFlow' : targetType;
      const res = await apiProjectCreate({
        targetType: flowTargetType,
        subType,
      });
      const { targetId, conversationId } = res.data;

      // 4. 前置自动生成名称、描述和图标，并更新配置信息
      if (prompt && strategy.initMetadata) {
        if (strategy.loadingText) {
          message.loading({
            content: strategy.loadingText,
            key: 'create_project_loading',
            duration: 0,
          });
        }
        try {
          await strategy.initMetadata(targetId, prompt);
        } catch (error) {
          console.error(
            `Failed to generate or update metadata for ${targetType} pre-navigation:`,
            error,
          );
          // 容灾处理：即便元数据生成或更新接口报错，也不阻断核心跳转流程，降级显示
        }
      }

      // 5. 关闭 loading 状态并提示构建成功
      hide();

      message.success({
        content: `构建成功！正在为您跳转到工作台...`,
        key: 'create_project_loading',
        duration: 2,
      });

      // 6. 调用策略计算出对应的路由 URL
      const url = strategy.getUrl({
        spaceId,
        targetId,
        conversationId,
        tenantConfigInfo,
      });

      // AgentFlow 子类型跳转到画布编排页面
      const finalUrl =
        subType === AgentSubTypeEnum.Flow
          ? `/space/${spaceId}/agent-flow/${targetId}`
          : url;

      // 7. 携带初始状态跳转到工作台详情会话中
      if (finalUrl) {
        history.push(finalUrl, {
          message: prompt,
          files,
          skillIds,
          modelId,
          infos: tools,
          selectedComputerId: computerId,
          agentMode,
        });
      }
    } catch (error: any) {
      hide();
    }
  };

  const handleRecentCardClick = () => {
    // 暂时移除原有的跳转与 mock loading 逻辑
  };

  return (
    <WorkspaceLayout>
      <div className={cx(styles['create-project-wrapper'])}>
        {/* Dynamic User Greetings */}
        <GreetingHeader />

        {/* Modular Prompt Box */}
        <PromptBox onSubmit={handleCreateSubmit} />

        {/* High-Fidelity Recent Projects Card Grid */}
        <RecentProjects onProjectClick={handleRecentCardClick} />
      </div>
    </WorkspaceLayout>
  );
};

export default SpaceCreateProject;
