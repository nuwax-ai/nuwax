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
  const { setOpenHistoryModal } = useModel('layout');
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
    const { agentType, agentId } = agentInfo;
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
    runUsed({
      size: 8,
    });
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

  // todo: 会话状态更新
  const handleConversationUpdate = (data: { conversationId: number }) => {
    const { conversationId } = data;
    console.log('会话状态更新:', conversationId);
    const _limitConversationList = limitConversationList.map(
      (item: ConversationInfo) => {
        if (
          item.id === conversationId &&
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
    // 监听会话状态更新事件
    eventBus.on(EVENT_TYPE.ChatFinished, handleConversationUpdate);

    return () => {
      eventBus.off(EVENT_TYPE.ChatFinished, handleConversationUpdate);
    };
  }, []);

  return (
    <div style={style}>
      <ConditionRender condition={usedAgentList !== undefined}>
        <div className={cx(styles['title-row'])}>
          <h3 className={cx(styles.title)} style={{ marginTop: 0 }}>
            最近使用
          </h3>
        </div>
        {usedAgentList?.length ? (
          usedAgentList
            ?.slice(0, 5)
            .map((info: AgentInfo, index: number) => (
              <MenuListItem
                key={info.id}
                onClick={() => handleAgentHome(info)}
                icon={info.icon}
                name={info.name}
                isFirst={index === 0}
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
        <div className={cx(styles['title-row'])}>
          <h3 className={cx(styles.title)}>会话记录</h3>
          <ConditionRender condition={conversationList?.length}>
            <span
              className={cx(styles['more-conversation'])}
              onClick={() => setOpenHistoryModal(true)}
            >
              查看全部 <RightOutlined />
            </span>
          </ConditionRender>
        </div>
        <div>
          {limitConversationList?.length ? (
            limitConversationList?.map(
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
