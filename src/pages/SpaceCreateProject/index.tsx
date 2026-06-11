import WorkspaceLayout from '@/components/WorkspaceLayout';
import { apiProjectCreate } from '@/services/appDev';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history, useParams } from 'umi';
import GreetingHeader from './components/GreetingHeader';
import PromptBox from './components/PromptBox';
import RecentProjects from './components/RecentProjects';
import styles from './index.less';

const cx = classNames.bind(styles);

import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { SubmitPayload } from './components/PromptBox';

const SpaceCreateProject: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  const handleCreateSubmit = async ({
    type: targetType,
    prompt,
    files,
    skillIds,
    modelId,
    tools,
    computerId,
  }: SubmitPayload) => {
    if (targetType === AgentComponentTypeEnum.PageApp) return;

    const hide = message.loading({
      content: `正在为您使用 AI 引擎构建项目...`,
      key: 'create_project_loading',
      duration: 0,
    });

    try {
      const res = await apiProjectCreate({ targetType });
      hide();

      const { targetId, conversationId } = res.data;
      message.success({
        content: `构建成功！正在为您跳转到工作台...`,
        key: 'create_project_loading',
        duration: 2,
      });

      const redirectState = {
        message: prompt,
        files,
        skillIds,
        modelId,
        infos: tools,
        selectedComputerId: computerId,
      };

      // 构建完成，跳转到工作台
      let url = '';
      // 智能体
      if (targetType === AgentComponentTypeEnum.Agent) {
        url = `/space/${spaceId}/conversation-agent?agentId=${targetId}&conversationId=${conversationId}`;
      }

      // 网页应用
      // if (targetType === AgentComponentTypeEnum.PageApp) {
      //   url = `/space/${spaceId}/app-dev/${targetId}`;
      // }

      // 技能
      if (targetType === AgentComponentTypeEnum.Skill) {
        url = `/space/${spaceId}/skill-details/${targetId}`;
      }

      // 插件 1/2
      if (targetType === AgentComponentTypeEnum.Plugin) {
        url = `/space/${spaceId}/plugin/${targetId}?conversationId=${conversationId}`;
      }

      // 跳转
      if (url) {
        history.push(url, redirectState);
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
