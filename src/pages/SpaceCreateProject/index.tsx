import WorkspaceLayout from '@/components/WorkspaceLayout';
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

  const handleCreateSubmit = (type: string, prompt: string) => {
    message.loading({
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
      duration: 1.5,
    });

    setTimeout(() => {
      message.success({
        content: `“${prompt.slice(
          0,
          15,
        )}...” 构建成功！正在为您跳转到工作台...`,
        key: 'create_project_loading',
        duration: 2,
      });
      // Redirect back to develop page after creation
      history.push(`/space/${spaceId}/page-develop`);
    }, 1500);
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
