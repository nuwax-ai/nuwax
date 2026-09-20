import usePinnedAgentHandoff from '@/hooks/usePinnedAgentHandoff';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { useState } from 'react';
import { history } from 'umi';

// 广场组件列表
const useSpaceSquare = () => {
  // 广场智能体上框通道（bug 2398）：智能体卡片点击改跳 /home 上框
  const { pin: pinAgent } = usePinnedAgentHandoff();

  // 广场组件列表
  const [squareComponentList, setSquareComponentList] = useState<
    SquarePublishedItemInfo[]
  >([]);

  // 点击单项(类型联合:app/list 应用列表口径下条目还可能是
  // UserApp 全栈应用/ThirdApp 三方应用,由调用方前置分流)
  const handleClick = (
    targetId: number,
    targetType: SquareAgentTypeEnum | AgentComponentTypeEnum,
    from: 'space' | 'square' = 'square',
    // 智能体上框所需展示信息（bug 2398：智能体分支必传，其余类型不消费）
    itemInfo?: { name: string; icon?: string },
  ) => {
    // 智能体（bug 2398）：广场卡片点击改为跳 /home 上框该智能体（替代原
    // /agent/:id 详情页与 /home/chat/:cid/:aid 会话页两跳转）；付费拦截在
    // 调用方 interceptAgentClick 包装，订阅放行后进入本分支同样走上框
    if (targetType === SquareAgentTypeEnum.Agent) {
      pinAgent({
        agentId: targetId,
        name: itemInfo?.name ?? '',
        icon: itemInfo?.icon,
      });
      return;
    }
    // 插件
    if (targetType === SquareAgentTypeEnum.Plugin) {
      history.push(`/${from}/publish/plugin/${targetId}`);
    }
    // 工作流
    if (targetType === SquareAgentTypeEnum.Workflow) {
      history.push(`/${from}/publish/workflow/${targetId}`);
    }
    // 技能
    if (targetType === SquareAgentTypeEnum.Skill) {
      history.push(`/${from}/publish/skill/${targetId}`);
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
