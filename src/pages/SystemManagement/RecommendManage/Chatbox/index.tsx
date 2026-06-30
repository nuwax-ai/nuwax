import React from 'react';
import RecommendListPage from '../components/RecommendListPage';
import { CHATBOX_RECOMMEND_CONFIG } from '../constants';

/**
 * 对话框智能体（智能体，类型 ChatBoxNav，按 functionType 分 Tab）
 */
const ChatboxRecommend: React.FC = () => {
  return (
    <RecommendListPage
      titleKey="PC.Routes.chatboxRecommend"
      config={CHATBOX_RECOMMEND_CONFIG}
    />
  );
};

export default ChatboxRecommend;
