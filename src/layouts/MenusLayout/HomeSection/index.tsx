import ConditionRender from '@/components/ConditionRender';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import {
  apiUnCollectAgent,
  apiUserCollectAgentList,
  apiUserUsedAgentList,
} from '@/services/agentDev';
import type { AgentInfo } from '@/types/interfaces/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import UserRelAgent from '../UserRelAgent';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页二级菜单栏
 */
const HomeSection: React.FC = () => {
  const [usedAgentList, setUsedAgentList] = useState<AgentInfo[]>([]);
  const [collectAgentList, setCollectAgentList] = useState<AgentInfo[]>([]);

  // 查询用户最近使用过的智能体列表
  const { run: runUsed } = useRequest(apiUserUsedAgentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentInfo[]) => {
      setUsedAgentList(result);
    },
  });

  // 查询用户收藏的智能体列表
  const { run: runCollect } = useRequest(apiUserCollectAgentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentInfo[]) => {
      setCollectAgentList(result);
    },
  });

  // 创建会话
  const { run: runConversationCreate } = useRequest(
    apiAgentConversationCreate,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (result: ConversationInfo) => {
        history.push(`/home/chat/${result.id}`);
      },
    },
  );

  // 智能体取消收藏
  const { run: runUnCollectAgent } = useRequest(apiUnCollectAgent, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_, params) => {
      const agentId = params[0];
      const list =
        collectAgentList?.filter((item) => item.agentId !== agentId) || [];
      setCollectAgentList(list);
    },
  });

  useEffect(() => {
    runUsed({
      size: 8,
    });
    runCollect({
      page: 1,
      size: 8,
    });
  }, []);

  const handleToChat = (info: AgentInfo) => {
    runConversationCreate({
      agentId: info.agentId,
      devMode: false,
    });
  };

  return (
    <div className={cx('px-6', 'py-16')}>
      <h3 className={cx(styles.title)}>最近使用</h3>
      {usedAgentList?.map((item) => (
        <UserRelAgent
          key={item.id}
          onClick={() => handleToChat(item)}
          icon={item.icon}
          name={item.name}
        />
      ))}
      <ConditionRender condition={collectAgentList?.length}>
        <h3 className={cx(styles.title, 'mt-16')}>我的收藏</h3>
        {collectAgentList?.map((item) => (
          <UserRelAgent
            key={item.id}
            onClick={() => handleToChat(item)}
            icon={item.icon}
            name={item.name}
            onCancelCollect={() => runUnCollectAgent(item.agentId)}
          />
        ))}
      </ConditionRender>
    </div>
  );
};

export default HomeSection;
