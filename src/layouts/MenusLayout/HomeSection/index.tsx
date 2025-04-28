import ConditionRender from '@/components/ConditionRender';
import { AgentInfo } from '@/types/interfaces/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { history, useModel } from 'umi';
import UserRelAgent from '../UserRelAgent';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页二级菜单栏
 */
const HomeSection: React.FC = () => {
  const { setOpenHistoryModal } = useModel('layout');
  const { conversationList, usedAgentList, runUsed, runHistory } = useModel(
    'conversationHistory',
  );

  // 智能体主页
  const handleAgentHome = (id: number) => {
    history.push(`/agent/${id}`);
  };

  // 会话跳转
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
          usedAgentList?.map((info: AgentInfo) => (
            <UserRelAgent
              key={info.id}
              onClick={() => handleAgentHome(info.agentId)}
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
            conversationList?.slice(0, 8)?.map((item: ConversationInfo) => (
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
