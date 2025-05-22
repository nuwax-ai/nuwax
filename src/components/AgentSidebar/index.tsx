import foldImage from '@/assets/images/fold_image.png';
import Loading from '@/components/Loading';
import { OpenCloseEnum } from '@/types/enums/space';
import { AgentSidebarProps } from '@/types/interfaces/agentTask';
import classNames from 'classnames';
import React, { useState } from 'react';
import AgentContent from './AgentContent';
import AgentConversation from './AgentConversation';
import styles from './index.less';
import StatisticsInfo from './StatisticsInfo';
import TimedTask from './TimedTask';

const cx = classNames.bind(styles);

// 智能体详情页侧边栏
const AgentSidebar: React.FC<AgentSidebarProps> = ({
  className,
  agentId,
  loading,
  agentDetail,
  onToggleCollectSuccess,
}) => {
  const [visible, setVisible] = useState<boolean>(true);
  const [foldVisible, setFoldVisible] = useState<boolean>(false);

  const handleClose = () => {
    setVisible(!visible);
    setTimeout(() => {
      setFoldVisible(!foldVisible);
    }, 300);
  };

  return (
    <>
      <div
        className={cx(styles.container, 'flex', 'flex-col', className, {
          [styles.hide]: !visible,
        })}
      >
        {loading ? (
          <Loading />
        ) : (
          <>
            {/* 统计信息 */}
            <StatisticsInfo
              statistics={agentDetail?.statistics}
              onClose={handleClose}
            />
            {/* 智能体内容 */}
            <AgentContent
              agentDetail={agentDetail}
              onToggleCollectSuccess={onToggleCollectSuccess}
            />
            {/* 智能体相关会话 */}
            <AgentConversation agentId={agentId} />
            {/* 定时任务 */}
            {agentDetail?.openScheduledTask === OpenCloseEnum.Open && (
              <TimedTask agentId={agentId} />
            )}
          </>
        )}
      </div>
      <img
        className={cx(styles.fold, 'cursor-pointer', {
          [styles.show]: foldVisible,
        })}
        src={foldImage}
        onClick={handleClose}
        alt=""
      />
    </>
  );
};

export default AgentSidebar;
