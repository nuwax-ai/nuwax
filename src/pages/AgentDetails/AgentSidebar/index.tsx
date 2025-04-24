import Loading from '@/components/Loading';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { OpenCloseEnum } from '@/types/enums/space';
import { AgentDetailDto } from '@/types/interfaces/agent';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import AgentContent from './AgentContent';
import AgentConversation from './AgentConversation';
import styles from './index.less';
import StatisticsInfo from './StatisticsInfo';
import TimedTask from './TimedTask';

const cx = classNames.bind(styles);

const AgentSidebar: React.FC = () => {
  const { agentId } = useParams();
  const [collect, setCollect] = useState<boolean>(false);
  const [agentDetail, setAgentDetail] = useState<AgentDetailDto>();

  const { run: runDetail, loading } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentDetailDto) => {
      setAgentDetail(result);
    },
  });

  useEffect(() => {
    runDetail(agentId);
  }, []);

  const handleClose = () => {
    setCollect(!collect);
  };

  // 切换收藏与取消收藏
  const handleToggleCollectSuccess = (isCollect: boolean) => {
    const _agentDetail = cloneDeep(agentDetail);
    if (!_agentDetail) {
      return;
    }
    const count = _agentDetail?.statistics?.collectCount || 0;
    _agentDetail.statistics.collectCount = isCollect ? count + 1 : count - 1;
    _agentDetail.collect = isCollect;
    setAgentDetail(_agentDetail);
  };

  return (
    <div className={cx(styles.container)}>
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
            onToggleCollectSuccess={handleToggleCollectSuccess}
          />
          <AgentConversation />
          {agentDetail?.openScheduledTask === OpenCloseEnum.Open && (
            <TimedTask agentId={agentId} />
          )}
        </>
      )}
    </div>
  );
};

export default AgentSidebar;
