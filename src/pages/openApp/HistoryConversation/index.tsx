import HistoryConversationList from '@/components/business-component/HistoryConversationList';
import React from 'react';
import { history, useParams } from 'umi';

/**
 * 历史会话页面（用于无菜单layouts的页面，单个智能体推荐使用，类似kimi的history页面）
 */
const HistoryConversation: React.FC = () => {
  const params = useParams();
  const agentId = Number(params.agentId);

  const handleLink = (id: number, agentId: number) => {
    history.push(`/app/chat/${id}/${agentId}`);
  };

  return <HistoryConversationList agentId={agentId} onClickLink={handleLink} />;
};

export default HistoryConversation;
