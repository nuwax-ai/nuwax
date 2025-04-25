import Loading from '@/components/Loading';
import { OpenCloseEnum } from '@/types/enums/space';
import { AgentSidebarProps } from '@/types/interfaces/agentTask';
import classNames from 'classnames';
import React from 'react';
import { useParams } from 'umi';
import AgentContent from './AgentContent';
import AgentConversation from './AgentConversation';
import styles from './index.less';
import StatisticsInfo from './StatisticsInfo';
import TimedTask from './TimedTask';

const cx = classNames.bind(styles);

// 智能体详情页侧边栏
const AgentSidebar: React.FC<AgentSidebarProps> = ({
  loading,
  agentDetail,
  onToggleCollectSuccess,
}) => {
  const { agentId } = useParams();

  const handleClose = () => {
    console.log('close');
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      {loading ? (
        <Loading />
      ) : (
        <>
          <StatisticsInfo
            statistics={agentDetail?.statistics}
            onClose={handleClose}
          />
          <AgentContent
            agentDetail={agentDetail}
            onToggleCollectSuccess={onToggleCollectSuccess}
          />
          <AgentConversation agentId={agentId} />
          {agentDetail?.openScheduledTask === OpenCloseEnum.Open && (
            <TimedTask agentId={agentId} />
          )}
        </>
      )}
    </div>
  );
};

export default AgentSidebar;
