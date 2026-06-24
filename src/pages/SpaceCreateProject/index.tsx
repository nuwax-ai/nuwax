import WorkspaceLayout from '@/components/WorkspaceLayout';
import { createAppDevInitialPayloadKey } from '@/hooks/useAppDevInitialAutoSend';
import { apiProjectCreate } from '@/services/appDev';
import classNames from 'classnames';
import React from 'react';
import { history, useModel, useParams } from 'umi';
import GreetingHeader from './components/GreetingHeader';
import PromptBox from './components/PromptBox';
import styles from './index.less';

const cx = classNames.bind(styles);

import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { SubmitPayload } from './components/PromptBox';

/**
 * 项目构建与跳转策略接口定义
 * 用于解耦不同项目类型在新建阶段独特的初始化元数据与路由配置
 */
interface ProjectStrategy {
  /** 生成跳转的目标路由 URL */
  getUrl: (params: {
    spaceId: number;
    targetId: number;
    conversationId: number;
    tenantConfigInfo?: any;
  }) => string;
}

/**
 * 各种项目构建跳转的行为策略映射表
 * 后续若接入新的 Tab 类型，在此处横向扩展配置即可，核心流程完全无需修改
 */
const PROJECT_STRATEGIES: Partial<
  Record<AgentComponentTypeEnum, ProjectStrategy>
> = {
  // 智能体策略
  [AgentComponentTypeEnum.Agent]: {
    getUrl: ({ spaceId, targetId, conversationId }) =>
      `/space/${spaceId}/conversation-agent?agentId=${targetId}&conversationId=${conversationId}`,
  },
  // 技能策略
  [AgentComponentTypeEnum.Skill]: {
    getUrl: ({ spaceId, targetId, conversationId, tenantConfigInfo }) =>
      `/space/${spaceId}/skill-details-conversation/${targetId}?agentId=${tenantConfigInfo?.skillDevAgentId}&conversationId=${conversationId}`,
  },
  // 插件策略
  [AgentComponentTypeEnum.Plugin]: {
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
      const res = await apiProjectCreate({ spaceId, targetType });
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

    try {
      // 2. 调用 API 创建基础项目记录以获取 ID
      const res = await apiProjectCreate({ spaceId, targetType });
      const { targetId, conversationId } = res.data;

      // 3. 调用策略计算出对应的路由 URL
      const url = strategy.getUrl({
        spaceId,
        targetId,
        conversationId,
        tenantConfigInfo,
      });

      // 5. 携带初始状态跳转到工作台详情会话中
      if (url) {
        history.push(url, {
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
      console.error('Failed to create project:', error);
    }
  };

  return (
    <WorkspaceLayout>
      <div className={cx(styles['create-project-wrapper'])}>
        {/* Dynamic User Greetings */}
        <GreetingHeader />

        {/* Modular Prompt Box */}
        <PromptBox onSubmit={handleCreateSubmit} />
      </div>
    </WorkspaceLayout>
  );
};

export default SpaceCreateProject;
