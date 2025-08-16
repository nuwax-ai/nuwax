import MenuListItem from '@/components/base/MenuListItem';
import ConditionRender from '@/components/ConditionRender';
import { AgentInfo } from '@/types/interfaces/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { history, useModel, useParams } from 'umi';
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

  // 智能体主页
  const handleAgentHome = (id: number) => {
    handleCloseMobileMenu();
    history.push(`/agent/${id}`);
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
    });
  }, []);

  return (
    <div style={style}>
      <ConditionRender condition={usedAgentList !== undefined}>
        <h3 className={cx(styles.title)} style={{ marginTop: 0 }}>
          最近使用
        </h3>
        {usedAgentList?.length ? (
          usedAgentList?.map((info: AgentInfo, index: number) => (
            <MenuListItem
              key={info.id}
              onClick={() => handleAgentHome(info.agentId)}
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
        <h3 className={cx(styles.title)}>会话记录</h3>
        <div>
          {conversationList?.length ? (
            conversationList
              ?.slice(0, 5)
              ?.map((item: ConversationInfo, index: number) => (
                <MenuListItem
                  key={item.id}
                  isActive={chatId === item.id?.toString()}
                  isFirst={index === 0}
                  onClick={() => handleLink(item.id, item.agentId)}
                  name={item.topic}
                />
              ))
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
