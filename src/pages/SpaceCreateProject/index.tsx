import WorkspaceLayout from '@/components/WorkspaceLayout';
import classNames from 'classnames';
import React from 'react';
import { useModel, useParams } from 'umi';
import GreetingHeader from './components/GreetingHeader';
import type { SubmitPayload } from './components/PromptBox';
import PromptBox from './components/PromptBox';
import styles from './index.less';
import { createProjectAndNavigate } from './utils/projectCreateStrategy';

const cx = classNames.bind(styles);

const SpaceCreateProject: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const { setContext } = useModel('pageHandoffContext');

  const handleCreateSubmit = async ({
    type,
    subType,
    prompt,
    files,
    skillIds,
    modelId,
    tools,
    computerId,
    agentMode,
  }: SubmitPayload) => {
    try {
      await createProjectAndNavigate({
        payload: {
          type,
          subType,
          prompt,
          files,
          skillIds,
          modelId,
          tools,
          computerId,
          agentMode,
        },
        spaceId,
        tenantConfigInfo,
        setContext,
      });
    } catch (error: any) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <WorkspaceLayout>
      <div className={cx(styles['create-project-wrapper'])}>
        <GreetingHeader />
        <PromptBox onSubmit={handleCreateSubmit} />
      </div>
    </WorkspaceLayout>
  );
};

export default SpaceCreateProject;
