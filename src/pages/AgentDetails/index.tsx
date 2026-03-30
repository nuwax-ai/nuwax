import ConversationDetails from '@/components/business-component/ConversationDetails';
import React from 'react';
import { useParams } from 'umi';
import useSkillInfo from './useSkillInfo';

/**
 * 主页咨询聊天页面
 */
const AgentDetails: React.FC = () => {
  // 智能体ID
  const params = useParams();
  const agentId = Number(params.agentId);

  // 技能信息
  const { skillInfo } = useSkillInfo();

  return <ConversationDetails agentId={agentId} skillInfo={skillInfo} />;
};

export default AgentDetails;
