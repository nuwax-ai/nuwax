import ConversationDetails from '@/components/business-component/ConversationDetails';
import type {
  AgentDirectInstanceProps,
  AgentTabInstanceProps,
} from '@/models/appTabKeepAlive';
import React, { useEffect } from 'react';
import { useModel } from 'umi';
import useSkillInfo from './useSkillInfo';

/**
 * 标签缓存实例:女娲应用页入口的标签从不带 skill query,不接 skillInfo;
 * active 由保活容器下发(激活可见/其余保活隐藏),驱动实例内激活沿副作用
 */
const AgentTabInstance: React.FC<AgentTabInstanceProps> = ({
  agentId,
  active,
}) => <ConversationDetails agentId={agentId} active={active} instanceScoped />;

/**
 * 无标签直开实例(广场技能/历史回跳/刷新等入口):skill query 由 useSkillInfo
 * 响应式消化(与原路由形态一致);也可能与同名标签实例并存,同样实例自持
 */
const AgentDirectInstance: React.FC<AgentDirectInstanceProps> = ({
  agentId,
}) => {
  const { skillInfo } = useSkillInfo();
  return (
    <ConversationDetails
      agentId={agentId}
      skillInfo={skillInfo}
      instanceScoped
    />
  );
};

/**
 * 主页咨询聊天页面(路由层空壳):渲染上移 OpenedAppTabsKeepAlive 保活容器,
 * 本组件仅注册渲染器(照 UserApp 模式——防路由出口与容器双实例双请求)。
 * 注册后渲染器常驻 model,路由卸载不清除,重进无需再注册。
 */
const AgentDetails: React.FC = () => {
  const { registerAgentTabRenderer } = useModel('appTabKeepAlive');
  useEffect(() => {
    registerAgentTabRenderer({
      tab: AgentTabInstance,
      direct: AgentDirectInstance,
    });
  }, [registerAgentTabRenderer]);
  return null;
};

export default AgentDetails;
