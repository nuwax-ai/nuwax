import HistoryConversationList from '@/components/business-component/HistoryConversationList';
import React from 'react';
import { history, useSearchParams } from 'umi';

/**
 * 历史会话页面 (用于带菜单layouts的页面)
 */
const HistoryConversation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const agentIdParam = searchParams.get('agentId');
  const agentId =
    agentIdParam && !isNaN(Number(agentIdParam)) ? Number(agentIdParam) : null;

  const handleLink = (id: number, agentId: number) => {
    history.push(`/home/chat/${id}/${agentId}`);
  };

  return <HistoryConversationList agentId={agentId} onClickLink={handleLink} />;
};

export default HistoryConversation;
