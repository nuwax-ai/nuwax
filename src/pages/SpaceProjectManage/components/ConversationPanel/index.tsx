import { dict } from '@/services/i18nRuntime';
import { UserService } from '@/services/userService';
import { TaskStatus } from '@/types/enums/agent';
import type { UserInfo } from '@/types/interfaces/login';
import type { UserProjectConversationInfo } from '@/types/interfaces/userProject';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Spin } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ConversationPanelProps {
  /** 项目下的任务列表 */
  conversations: UserProjectConversationInfo[];
  /** 列表加载中 */
  loading?: boolean;
  /** 点击任务 */
  onSelect: (item: UserProjectConversationInfo) => void;
  /** 新建任务 */
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
    return `${dict('PC.Pages.AppProjectDetail.today')} ${clock}`;
  }
  if (time.isSame(dayjs().subtract(1, 'day'), 'day')) {
    return `${dict('PC.Utils.Common.yesterday')} ${clock}`;
  }
  return `${time.format('MM/DD')} ${clock}`;
};

/**
 * 取任务负责人：会话 userId 等于当前登录用户时显示「我的」，否则显示任务 userName。
 *
 * @param item 任务
 * @returns 名称与是否本人
 */
const getConversationOwner = (
  item: UserProjectConversationInfo,
): { name: string; isMine: boolean } => {
  const currentUser = UserService.getUserInfoFromStorage() as UserInfo | null;
  const isMine = currentUser?.id != null && item.userId === currentUser.id;
  if (isMine) {
    return { name: dict('PC.Pages.AppProjectDetail.mine'), isMine: true };
  }
  return { name: item.userName || '', isMine: false };
};

/**
 * 项目相关任务列表：标题 + 负责人名称标签 + 执行中/相对时间。
 *
 * @param props.conversations 会话列表
 * @param props.loading 是否加载中
 * @param props.onSelect 点击会话
 * @param props.onCreate 新建会话
 * @returns 会话侧栏
 */
const ConversationPanel: React.FC<ConversationPanelProps> = ({
  conversations,
  loading = false,
  onSelect,
  onCreate,
}) => {
  const executingText = useMemo(
    () => dict('PC.Layouts.DynamicMenusLayout.ConversationItem.executing'),
    [],
  );

  const renderList = () => {
    if (loading && conversations.length === 0) {
      return (
        <div className={cx(styles['sidebar-empty'])}>
          <Spin />
        </div>
      );
    }
    if (conversations.length === 0) {
      return (
        <div className={cx(styles['sidebar-empty'])}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={dict('PC.Pages.AppProjectDetail.emptyConversation')}
          />
        </div>
      );
    }
    return (
      <ul className={cx(styles['conversation-list'])}>
        {conversations.map((item) => {
          const owner = getConversationOwner(item);
          const timeText = formatCardTime(item.modified || item.created);
          const executing = item.taskStatus === TaskStatus.EXECUTING;
          const title =
            item.topic ||
            item.agent?.name ||
            dict('PC.Constants.Menus.newChat');
          return (
            <li
              key={item.id}
              className={cx(styles['conversation-item'])}
              onClick={() => onSelect(item)}
            >
              <div className={cx(styles['conversation-top'])}>
                <div className={cx(styles['conversation-name'], 'text-ellipsis')} title={title}>
                  {title}
                </div>
                {owner.name ? (
                  <span
                    className={cx(
                      styles.owner,
                      !owner.isMine && styles['owner-other'],
                    )}
                    title={owner.name}
                  >
                    {owner.name}
                  </span>
                ) : null}
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
    );
  };

  return (
    <aside className={cx(styles.sidebar)}>
      <div className={cx(styles['sidebar-header'])}>
        <h4 className={cx(styles['sidebar-title'])}>
          {dict('PC.Pages.AppProjectDetail.conversationTitle')}
        </h4>
        <Button
          type="link"
          size="small"
          className={cx(styles['create-btn'])}
          icon={<PlusOutlined />}
          onClick={onCreate}
        >
          {dict('PC.Pages.AppProjectDetail.newConversation')}
        </Button>
      </div>
      {renderList()}
    </aside>
  );
};

export default ConversationPanel;
