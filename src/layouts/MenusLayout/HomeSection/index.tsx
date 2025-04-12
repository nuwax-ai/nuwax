import ConditionRender from '@/components/ConditionRender';
import {
  apiAgentConversationCreate,
  apiAgentConversationList,
} from '@/services/agentConfig';
import { apiUserUsedAgentList } from '@/services/agentDev';
import type { AgentInfo } from '@/types/interfaces/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { useModel } from '@@/exports';
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
  const [usedAgentList, setUsedAgentList] = useState<AgentInfo[]>();
  // 历史会话列表
  const [conversationList, setConversationList] =
    useState<ConversationInfo[]>();
  const { setOpenHistoryModal } = useModel('layout');
  // 查询用户最近使用过的智能体列表
  const { run: runUsed } = useRequest(apiUserUsedAgentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentInfo[]) => {
      setUsedAgentList(result);
    },
  });

  // 查询历史会话记录
  const { run: runHistory } = useRequest(apiAgentConversationList, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (result: ConversationInfo[]) => {
      setConversationList(result);
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

  const handleLink = (id: number) => {
    history.push(`/home/chat/${id}`);
  };

  useEffect(() => {
    runUsed({
      size: 8,
    });
    runHistory({
      agentId: null,
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
      <ConditionRender condition={usedAgentList !== undefined}>
        <h3 className={cx(styles.title)}>最近使用</h3>
        {usedAgentList?.length ? (
          usedAgentList?.map((item) => (
            <UserRelAgent
              key={item.id}
              onClick={() => handleToChat(item)}
              icon={item.icon}
              name={item.name}
            />
          ))
        ) : (
          <>
            <div className={cx(styles['no-used'])}>你还没有使用任何智能体</div>
            <div className={cx(styles['no-used'])}>
              现在去广场开启你的探索之旅吧～
            </div>
          </>
        )}
      </ConditionRender>
      <ConditionRender condition={conversationList !== undefined}>
        <h3 className={cx(styles.title, 'mt-16')}>会话记录</h3>
        <ul>
          {conversationList?.length ? (
            conversationList?.slice(0, 5)?.map((item) => (
              <li
                key={item.id}
                className={cx(
                  'cursor-pointer',
                  'hover-deep',
                  'text-ellipsis',
                  styles.row,
                )}
                onClick={() => handleLink(item.id)}
              >
                {item.topic}
              </li>
            ))
          ) : (
            <>
              <div className={cx(styles['no-used'])}>右边看👉</div>
              <div className={cx(styles['no-used'])}>
                在会话框中输入指令开始你的第一次会话吧～
              </div>
            </>
          )}
        </ul>
      </ConditionRender>
      <ConditionRender condition={conversationList?.length}>
        <span
          className={cx(styles['more-conversation'])}
          onClick={() => setOpenHistoryModal(true)}
        >
          查看全部
        </span>
      </ConditionRender>
    </div>
  );
};

export default HomeSection;
