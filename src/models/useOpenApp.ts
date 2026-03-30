import { AgentDetailDto } from '@/types/interfaces/agent';
import { useState } from 'react';
import { history } from 'umi';

const useOpenApp = () => {
  // 是否是应用侧边栏模式
  const [isAppSidebarMode, setIsAppSidebarMode] = useState<boolean>(false);
  // 是否显示应用智能体侧边栏
  const [isAppSidebarVisible, setIsAppSidebarVisible] = useState<boolean>(true);
  // 应用智能体详情
  const [appAgentDetail, setAppAgentDetail] = useState<AgentDetailDto | null>();

  // 切换侧边栏显示状态
  const toggleAppSidebarVisible = () => {
    setIsAppSidebarVisible(!isAppSidebarVisible);
  };

  // 设置应用智能体详情
  const handleSetAppAgentDetail = (info: AgentDetailDto) => {
    setAppAgentDetail(info);
  };

  // 创建应用智能体新会话
  const createAppNewConversation = (agentId: number) => {
    history.push(`/app/details/${agentId}`);
  };

  return {
    isAppSidebarMode,
    setIsAppSidebarMode,
    isAppSidebarVisible,
    toggleAppSidebarVisible,
    appAgentDetail,
    handleSetAppAgentDetail,
    createAppNewConversation,
  };
};

export default useOpenApp;
