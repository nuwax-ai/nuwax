import { AgentDetailDto } from '@/types/interfaces/agent';
import cloneDeep from 'lodash/cloneDeep';
import { useState } from 'react';

// 智能体详情
const useAgentDetails = () => {
  // 智能体详情
  const [agentDetail, setAgentDetail] = useState<AgentDetailDto | null>();

  // 切换收藏与取消收藏
  const handleToggleCollectSuccess = (isCollect: boolean) => {
    const _agentDetail = cloneDeep(agentDetail);
    if (!_agentDetail) {
      return;
    }
    const count = _agentDetail?.statistics?.collectCount || 0;
    if (!_agentDetail.statistics) {
      _agentDetail.statistics = {
        targetId: _agentDetail.agentId,
        userCount: 0,
        convCount: 0,
        collectCount: 0,
        likeCount: 0,
        referenceCount: 0,
        callCount: 0,
        failCallCount: 0,
        totalCallDuration: 0,
      };
    }
    _agentDetail.statistics.collectCount = isCollect ? count + 1 : count - 1;
    _agentDetail.collect = isCollect;
    setAgentDetail(_agentDetail);
  };

  return {
    agentDetail,
    setAgentDetail,
    handleToggleCollectSuccess,
  };
};

export default useAgentDetails;
