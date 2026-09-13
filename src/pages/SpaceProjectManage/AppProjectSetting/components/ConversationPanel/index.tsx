import { dict } from '@/services/i18nRuntime';
import { UserService } from '@/services/userService';
import { TaskStatus } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { PlusOutlined } from '@ant-design/icons';
import { Avatar, Button, Empty } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** tab 行可能附带 creator，类型先行防御 */
type ConversationOwner = {
  nickName?: string;
  userName?: string;
  avatar?: string;
};

export interface ConversationPanelProps {
  /** 项目下的会话列表 */
  conversations: ConversationInfo[];
  /** 点击会话 */
  onSelect: (item: ConversationInfo) => void;
  /** 新建会话 */
  onCreate: () => void;
}

/**
 * 会话卡片时间：今天 HH:mm / 昨天 HH:mm / MM/DD HH:mm。
 *
 * @param timeStr 会话更新或创建时间
 * @returns 展示文案
 */
const formatCardTime = (timeStr?: string): string => {
  if (!timeStr) {
    return '';
  }
  const time = dayjs(timeStr);
  if (!time.isValid()) {
    return '';
  }
  const clock = time.format('HH:mm');
  if (time.isSame(dayjs(), 'day')) {
    return `${dict('PC.Pages.AppProjectSetting.today')} ${clock}`;
  }
  if (time.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return `${dict('PC.Utils.Common.yesterday')} ${clock}`;
  }
  return `${time.format('MM/DD')} ${clock}`;
};

/**
 * 取会话负责人：接口 creator > 智能体发布者 > 当前登录用户。
 *
 * @param item 会话
 * @returns 名称与头像
 */
const getConversationOwner = (
  item: ConversationInfo,
): { name: string; avatar: string } => {
  const extra = item as ConversationInfo & { creator?: ConversationOwner };
  const currentUser = UserService.getUserInfoFromStorage() as
    | ConversationOwner
    | undefined;
  const owner =
    extra.creator || item.agent?.publishUser || currentUser || undefined;
  return {
    name: owner?.nickName || owner?.userName || '',
    avatar: owner?.avatar || item.icon || item.agent?.icon || '',
  };
};

/**
 * 应用设置页右侧会话列表，卡片布局对齐设计稿。
 *
 * @param props.conversations 会话列表
 * @param props.onSelect 点击会话
 * @param props.onCreate 新建会话
 * @returns 会话侧栏
 */
const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversations,
  onSelect,
  onCreate,
}) => {
  const executingText = useMemo(
    () => dict('PC.Layouts.DynamicMenusLayout.ConversationItem.executing'),
    [],
  );

  return (
    <aside className={cx(styles.sidebar)}>
      <div className={cx(styles['sidebar-header'])}>
        <h4 className={cx(styles['sidebar-title'])}>
          {dict('PC.Pages.AppProjectSetting.conversationTitle')}
        </h4>
        <Button
          type="link"
          size="small"
          className={cx(styles['create-btn'])}
          icon={<PlusOutlined />}
          onClick={onCreate}
        >
          {dict('PC.Pages.AppProjectSetting.newConversation')}
        </Button>
      </div>
      {conversations.length > 0 ? (
        <ul className={cx(styles['conversation-list'])}>
          {conversations.map((item) => {
            const owner = getConversationOwner(item);
            const timeText = formatCardTime(item.modified || item.created);
            const executing = item.taskStatus === TaskStatus.EXECUTING;
            return (
              <li
                key={item.id}
                className={cx(styles['conversation-item'])}
                onClick={() => onSelect(item)}
              >
                <div className={cx(styles['conversation-top'])}>
                  <div
                    className={cx(styles['conversation-name'])}
                    title={
                      item.topic ||
                      item.agent?.name ||
                      dict('PC.Constants.Menus.newChat')
                    }
                  >
                    {item.topic ||
                      item.agent?.name ||
                      dict('PC.Constants.Menus.newChat')}
                  </div>
                  <Avatar
                    size={28}
                    src={owner.avatar || undefined}
                    className={cx(styles.avatar)}
                  >
                    {owner.name.slice(0, 1) || 'U'}
                  </Avatar>
                </div>
                <div className={cx(styles['conversation-meta'])}>
                  {executing ? (
                    <>
                      <span>{executingText}</span>
                      {timeText ? <span>·</span> : null}
                    </>
                  ) : null}
                  {timeText ? <span>{timeText}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className={cx(styles['sidebar-empty'])}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={dict('PC.Pages.AppProjectSetting.emptyConversation')}
          />
        </div>
      )}
    </aside>
  );
};

export default ConversationPanel;
