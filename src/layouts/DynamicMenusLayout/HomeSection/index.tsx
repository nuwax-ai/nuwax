import MenuListItem from '@/components/base/MenuListItem';
import ConditionRender from '@/components/ConditionRender';
import { EVENT_TYPE } from '@/constants/event.constants';
import { TaskStatus } from '@/types/enums/agent';
import { AgentInfo } from '@/types/interfaces/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import eventBus from '@/utils/eventBus';
import { RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel, useParams } from 'umi';
import ConversationItem from './ConversationItem';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页二级菜单栏
 */
const HomeSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const { id: chatId } = useParams();
  const { conversationList, usedAgentList, runUsed, runHistory } = useModel(
    'conversationHistory',
  );
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  // 限制会话记录列表为5条
  const [limitConversationList, setLimitConversationList] = useState<
    ConversationInfo[]
  >([]);

  // 智能体主页
  const handleAgentHome = (agentInfo: AgentInfo) => {
    handleCloseMobileMenu();
    const { agentType, agentId, lastConversationId } = agentInfo;

    // 如果最后一次会话ID存在，则跳转至最后一次会话
    if (!!lastConversationId) {
      const url =
        agentType === 'TaskAgent'
          ? `/home/chat/${lastConversationId}/${agentId}?hideMenu=true`
          : `/home/chat/${lastConversationId}/${agentId}`;
      history.push(url);
      return;
    }

    if (agentType === 'PageApp' || agentType === 'TaskAgent') {
      history.push(`/agent/${agentId}?hideMenu=true`);
      return;
    }
    history.push(`/agent/${agentId}`);
  };

  // 会话跳转
  const handleLink = (id: number, agentId: number) => {
    handleCloseMobileMenu();
    history.push(`/home/chat/${id}/${agentId}`);
  };

  useEffect(() => {
    // 最近使用智能体列表
    runUsed({
      size: 5,
    });
    // 查询会话记录
    runHistory({
      agentId: null,
      limit: 20,
    });
  }, []);

  useEffect(() => {
    if (conversationList?.length > 0) {
      // 限制会话记录列表为5条
      const _limitConversationList = conversationList?.slice(0, 5) || [];
      setLimitConversationList(_limitConversationList);
    }
  }, [conversationList]);

  // 会话状态更新
  const handleConversationUpdate = (data: { conversationId: string }) => {
    const { conversationId } = data;
    const _limitConversationList = limitConversationList.map(
      (item: ConversationInfo) => {
        if (
          item.id?.toString() === conversationId &&
          item.taskStatus === TaskStatus.EXECUTING
        ) {
          return {
            ...item,
            taskStatus: TaskStatus.COMPLETE,
          };
        }
        return item;
      },
    );
    setLimitConversationList(_limitConversationList);
  };

  useEffect(() => {
    // 如果会话列表中存在执行中的会话，则监听会话状态更新事件
    const _limitConversationList = limitConversationList.find(
      (item) => item.taskStatus === TaskStatus.EXECUTING,
    );
    if (_limitConversationList) {
      // 监听会话状态更新事件
      eventBus.on(EVENT_TYPE.ChatFinished, handleConversationUpdate);
    }

    return () => {
      eventBus.off(EVENT_TYPE.ChatFinished, handleConversationUpdate);
    };
  }, [limitConversationList]);

  console.log('最近使用usedAgentList', usedAgentList);

  return (
    <div style={style}>
      <ConditionRender condition={usedAgentList !== undefined}>
        <div className={cx(styles['title-row'])}>
          <h3 className={cx(styles.title)} style={{ marginTop: 0 }}>
            最近使用
          </h3>
        </div>
        {usedAgentList?.length ? (
          <div className="flex flex-col gap-4">
            {usedAgentList.map((info: AgentInfo) => (
              <MenuListItem
                key={info.id}
                onClick={() => handleAgentHome(info)}
                icon={info.icon}
                name={info.name}
              />
            ))}
          </div>
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
        <div className={cx(styles['title-row'])}>
          <h3 className={cx(styles.title)}>会话记录</h3>
          <ConditionRender condition={conversationList?.length}>
            <span
              className={cx(styles['more-conversation'])}
              onClick={() => {
                history.push('/history-conversation');
              }}
            >
              查看全部 <RightOutlined />
            </span>
          </ConditionRender>
        </div>
        <div>
          {limitConversationList?.length ? (
            limitConversationList.map(
              (item: ConversationInfo, index: number) => (
                <ConversationItem
                  key={item.id}
                  isActive={chatId === item.id?.toString()}
                  isFirst={index === 0}
                  onClick={() => handleLink(item.id, item.agentId)}
                  name={item.topic}
                  taskStatus={item.taskStatus}
                />
              ),
            )
          ) : (
            <>
              <div className={cx(styles['no-used'])}>右边看👉</div>
              <div className={cx(styles['no-used'])}>
                在会话框中输入指令开始你的第一次会话吧～
              </div>
            </>
          )}
        </div>
      </ConditionRender>
    </div>
  );
};

export default HomeSection;
