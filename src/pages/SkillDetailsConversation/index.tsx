import { ChatCore } from '@/pages/Chat';
import React from 'react';
import { useLocation, useParams } from 'umi';
import SkillHeader from './components/SkillHeader';
import SkillPublishAction from './components/SkillPublishAction';

/**
 * 技能详情对话会话页面 - 共享 Chat 页面的核心对话组件，不展示右侧属性栏和分栏拖拽
 */
const SkillDetailsConversation: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = Number(searchParams.get('conversationId'));
  const agentId = Number(searchParams.get('agentId'));
  const skillId = Number(params.skillId) || agentId;

  return (
    <ChatCore
      id={id}
      agentId={agentId}
      locationState={location.state}
      showSidebar={false}
      showPayment={false}
      enableResizable={false}
      showClearContext={false}
      renderTitle={() => <SkillHeader spaceId={spaceId} skillId={skillId} />}
      renderHeaderRight={() => (
        <SkillPublishAction spaceId={spaceId} skillId={skillId} />
      )}
    />
  );
};

export default SkillDetailsConversation;
