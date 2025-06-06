import foldImage from '@/assets/images/fold_image.png';
import Loading from '@/components/Loading';
import useDrawerScroll from '@/hooks/useDrawerScroll';
import { EditAgentShowType, OpenCloseEnum } from '@/types/enums/space';
import { AgentSidebarProps } from '@/types/interfaces/agentTask';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
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
  const { showType } = useModel('conversationInfo');

  const handleClose = () => {
    setVisible(!visible);
    setTimeout(() => {
      setFoldVisible(!foldVisible);
    }, 300);
  };

  useEffect(() => {
    if (showType === EditAgentShowType.Show_Stand) {
      setVisible(false);
      setFoldVisible(true);
    }
  }, [showType]);

  useDrawerScroll(visible);

  return (
    <>
      <div
        className={cx(styles.container, 'flex', 'flex-col', className, {
          [styles.hide]: !visible,
        })}
        style={{
          overflowY: 'scroll',
        }}
      >
        {loading ? (
          <Loading />
        ) : (
          <>
            {/* 统计信息 */}
            <StatisticsInfo
              statistics={agentDetail?.statistics}
              visible={visible}
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
          [styles.show]: !visible,
        })}
        src={foldImage}
        onClick={handleClose}
      />
    </>
  );
};

export default AgentSidebar;
