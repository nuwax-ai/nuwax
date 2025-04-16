import ConditionRender from '@/components/ConditionRender';
import useConversation from '@/hooks/useConversation';
import { apiUserUsedAgentList } from '@/services/agentDev';
import type { AgentInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel, useRequest } from 'umi';
import UserRelAgent from '../UserRelAgent';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页二级菜单栏
 */
const HomeSection: React.FC = () => {
  const [usedAgentList, setUsedAgentList] = useState<AgentInfo[]>();
  const { setOpenHistoryModal } = useModel('layout');
  const { conversationList, runHistory } = useModel('conversationHistory');
  // 创建智能体会话
  const { handleCreateConversation } = useConversation();

  // 查询用户最近使用过的智能体列表
  const { run: runUsed } = useRequest(apiUserUsedAgentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentInfo[]) => {
      setUsedAgentList(result);
    },
  });

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

  return (
    <div className={cx('px-6', 'py-16')}>
      <ConditionRender condition={usedAgentList !== undefined}>
        <h3 className={cx(styles.title)}>最近使用</h3>
        {usedAgentList?.length ? (
          usedAgentList?.map((info) => (
            <UserRelAgent
              key={info.id}
              onClick={() => handleCreateConversation(info.agentId)}
              icon={info.icon}
              name={info.name}
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
            conversationList?.slice(0, 8)?.map((item) => (
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
