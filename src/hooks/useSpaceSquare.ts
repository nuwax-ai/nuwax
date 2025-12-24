import { SquareAgentTypeEnum } from '@/types/enums/square';
import { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { useState } from 'react';
import { history } from 'umi';

// 广场组件列表
const useSpaceSquare = () => {
  // 广场组件列表
  const [squareComponentList, setSquareComponentList] = useState<
    SquarePublishedItemInfo[]
  >([]);

  // 点击单项
  const handleClick = (
    targetId: number,
    targetType: SquareAgentTypeEnum,
    info?: SquarePublishedItemInfo,
  ) => {
    // 智能体
    if (targetType === SquareAgentTypeEnum.Agent) {
      if (info && info.agentType === 'PageApp') {
        history.push(`/agent/${targetId}?hideMenu=true`);
      } else {
        history.push(`/agent/${targetId}`);
      }
    }
    // 插件
    if (targetType === SquareAgentTypeEnum.Plugin) {
      history.push(`/square/publish/plugin/${targetId}`);
    }
    // 工作流
    if (targetType === SquareAgentTypeEnum.Workflow) {
      history.push(`/square/publish/workflow/${targetId}`);
    }
    // 技能
    if (targetType === SquareAgentTypeEnum.Skill) {
      history.push(`/square/publish/skill/${targetId}`);
    }
  };

  // 切换收藏与取消收藏
  const handleToggleCollectSuccess = (id: number, isCollect: boolean) => {
    const list = squareComponentList.map((item) => {
      if (item.targetId === id) {
        item.collect = isCollect;
        const count = item?.statistics?.collectCount || 0;
        if (!item.statistics) {
          item.statistics = {
            targetId: id,
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
        item.statistics.collectCount = isCollect ? count + 1 : count - 1;
      }
      return item;
    });
    setSquareComponentList(list);
  };

  return {
    squareComponentList,
    setSquareComponentList,
    handleClick,
    handleToggleCollectSuccess,
  };
};

export default useSpaceSquare;
