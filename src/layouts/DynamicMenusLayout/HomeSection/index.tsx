import MenuListItem from '@/components/base/MenuListItem';
import ConditionRender from '@/components/ConditionRender';
// import { EVENT_TYPE } from '@/constants/event.constants';
import { dict } from '@/services/i18nRuntime';
// import { TaskStatus } from '@/types/enums/agent';
import { AgentInfo } from '@/types/interfaces/agent';
import { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { RightOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { history, useLocation, useModel, useParams } from 'umi';
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
  const location = useLocation();
  const { conversationList, usedAgentList, runUsed, runHistory } = useModel(
    'conversationHistory',
  );
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  // 智能体主页
  const handleAgentHome = (agentInfo: AgentInfo) => {
    handleCloseMobileMenu();
    const { agentType, agentId, lastConversationId } = agentInfo;

    // 如果最后一次会话ID存在，则跳转至最后一次会话
    if (!!lastConversationId) {
      const url =
        agentType === 'PageApp' || agentType === 'TaskAgent'
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

  // 查看全部会话
  const handleAllConversation = React.useCallback(() => {
    handleCloseMobileMenu();
    const targetPath = '/history-conversation';
    if (location.pathname === targetPath) {
      history.replace(targetPath, { _t: Date.now() });
    } else {
      history.push(targetPath, { _t: Date.now() });
    }
  }, [location.pathname, handleCloseMobileMenu]);

  useEffect(() => {
    // 最近使用智能体列表
    runUsed({
      size: 5,
    });
    // 查询会话记录
    runHistory({
      agentId: null,
      limit: 5,
    });
  }, []);

  return (
    <div style={style}>
      <ConditionRender condition={usedAgentList !== undefined}>
        <div className={cx(styles['title-row'])}>
          <h3 className={cx(styles.title)} style={{ marginTop: 0 }}>
            {dict('PC.Layouts.DynamicMenusLayout.HomeSection.recentlyUsed')}
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
            <div className={cx(styles['no-used'])}>
              {dict('PC.Layouts.DynamicMenusLayout.HomeSection.noAgentUsed')}
            </div>
            <div className={cx(styles['no-used'])}>
              {dict('PC.Layouts.DynamicMenusLayout.HomeSection.exploreSquare')}
            </div>
          </>
        )}
      </ConditionRender>
      <ConditionRender condition={conversationList !== undefined}>
        <div className={cx(styles['title-row'])}>
          <h3 className={cx(styles.title)}>
            {dict(
              'PC.Layouts.DynamicMenusLayout.HomeSection.conversationHistory',
            )}
          </h3>
          <ConditionRender condition={conversationList?.length}>
            <span
              className={cx(styles['more-conversation'])}
              onClick={handleAllConversation}
            >
              {dict('PC.Layouts.DynamicMenusLayout.HomeSection.viewAll')}{' '}
              <RightOutlined />
            </span>
          </ConditionRender>
        </div>
        <div>
          {conversationList?.length ? (
            conversationList.map((item: ConversationInfo, index: number) => (
              <ConversationItem
                key={item.id}
                isActive={chatId === item.id?.toString()}
                isFirst={index === 0}
                onClick={() => handleLink(item.id, item.agentId)}
                name={item.topic}
                taskStatus={item.taskStatus}
              />
            ))
          ) : (
            <>
              <div className={cx(styles['no-used'])}>
                {dict('PC.Layouts.DynamicMenusLayout.HomeSection.lookRight')}
              </div>
              <div className={cx(styles['no-used'])}>
                {dict(
                  'PC.Layouts.DynamicMenusLayout.HomeSection.startFirstConversation',
                )}
              </div>
            </>
          )}
        </div>
      </ConditionRender>
    </div>
  );
};

export default HomeSection;
