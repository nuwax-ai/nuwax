import {
  AgentDetailDto,
  AgentSelectedComponentInfo,
} from '@/types/interfaces/agent';
import cloneDeep from 'lodash/cloneDeep';
import { useState } from 'react';

// 智能体详情
const useAgentDetails = () => {
  const [agentDetail, setAgentDetail] = useState<AgentDetailDto | null>();
  const [selectedComponentList, setSelectedComponentList] = useState<
    AgentSelectedComponentInfo[]
  >([]);

  // 选中配置组件
  const handleSelectComponent = (item: AgentSelectedComponentInfo) => {
    const _selectedComponentList = [...selectedComponentList];
    // 已存在则删除
    if (_selectedComponentList.some((c) => c.id === item.id)) {
      const index = _selectedComponentList.findIndex((c) => c.id === item.id);
      _selectedComponentList.splice(index, 1);
    } else {
      _selectedComponentList.push({
        id: item.id,
        type: item.type,
      });
    }

    setSelectedComponentList(_selectedComponentList);
  };

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
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    handleToggleCollectSuccess,
  };
};

export default useAgentDetails;
