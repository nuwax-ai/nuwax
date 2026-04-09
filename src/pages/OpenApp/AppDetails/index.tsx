import ConversationDetails from '@/components/business-component/ConversationDetails';
import React from 'react';
import { useParams } from 'umi';

/**
 * 开放授权应用详情页面
 */
const AppDetails: React.FC = () => {
  // 智能体ID
  const params = useParams();
  const agentId = Number(params.agentId);

  // 会话发起后跳转的页面URL
  const conversationUrl = '/app/chat/:agentId/:id';

  return (
    <ConversationDetails agentId={agentId} conversationUrl={conversationUrl} />
  );
};

export default AppDetails;
