import WorkspaceLayout from '@/components/WorkspaceLayout';
import { apiProjectCreate } from '@/services/appDev';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history, useParams } from 'umi';
import GreetingHeader from './components/GreetingHeader';
import PromptBox from './components/PromptBox';
import RecentProjects from './components/RecentProjects';
import styles from './index.less';

const cx = classNames.bind(styles);

const SpaceCreateProject: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  const handleCreateSubmit = async (
    type: string,
    prompt: string,
    files?: any[],
    skillIds?: number[],
    modelId?: number,
    tools?: any[],
    computerId?: string,
  ) => {
    const hide = message.loading({
      content: `正在为您使用 AI 引擎构建 ${
        type === AgentComponentTypeEnum.Agent
          ? '智能体'
          : type === AgentComponentTypeEnum.PageApp
          ? '网页应用'
          : type === AgentComponentTypeEnum.Skill
          ? '技能'
          : '插件'
      } 模版...`,
      key: 'create_project_loading',
      duration: 0,
    });

    try {
      let targetType: AgentComponentTypeEnum = AgentComponentTypeEnum.Agent;
      if (type === AgentComponentTypeEnum.PageApp) {
        targetType = AgentComponentTypeEnum.PageApp;
      } else if (type === AgentComponentTypeEnum.Skill) {
        targetType = AgentComponentTypeEnum.Skill;
      } else if (type === AgentComponentTypeEnum.Plugin) {
        targetType = AgentComponentTypeEnum.Plugin;
      }

      const res = await apiProjectCreate({ targetType });
      hide();

      if (res.success && res.data) {
        const { targetId, conversationId } = res.data;
        message.success({
          content: `构建成功！正在为您跳转到工作台...`,
          key: 'create_project_loading',
          duration: 2,
        });

        const redirectState = {
          prompt,
          files,
          skillIds,
          modelId,
          tools,
          computerId,
        };

        if (targetType === 'PageApp') {
          history.push(`/space/${spaceId}/app-dev/${targetId}`, redirectState);
        } else {
          history.push(
            `/space/${spaceId}/conversation-agent?agentId=${targetId}&conversationId=${conversationId}`,
            redirectState,
          );
        }
      } else {
        message.error(res.message || '项目创建失败，请重试！');
      }
    } catch (error: any) {
      hide();
      message.error(error.message || '项目创建失败，请重试！');
    }
  };

  const handleRecentCardClick = (_type: string, name: string) => {
    message.loading({
      content: `正在打开最近项目: ${name}...`,
      key: 'open_recent_loading',
      duration: 1.0,
    });

    setTimeout(() => {
      message.success({
        content: `项目加载完成！`,
        key: 'open_recent_loading',
        duration: 1.5,
      });
      // Redirect back to develop page
      history.push(`/space/${spaceId}/page-develop`);
    }, 1000);
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
