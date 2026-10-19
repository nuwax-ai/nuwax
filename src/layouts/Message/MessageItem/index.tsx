import avatar from '@/assets/images/avatar.png';
import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import type { MessageItemProps } from '@/types/interfaces/layouts';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import styles from './index.less';
import { resolveNotifySenderName } from '../senderDisplayName';

const cx = classNames.bind(styles);

// const md = markdown({
//   html: true,
//   breaks: true,
//   linkify: true,
// });

// 消息模块
const MessageItem: React.FC<MessageItemProps> = ({ info, contactNames }) => {
  return (
    <div className={cx('flex', styles.container)}>
      <img
        className={cx(styles.avatar)}
        src={info?.sender?.avatar || (avatar as string)}
        alt=""
      />
      <div className={cx('flex-1', 'flex', 'flex-col')}>
        {/* NW-094：备注名优先（IM 通讯录 displayName），回退昵称/账号名 */}
        <h6 className={cx(styles.name)}>
          {resolveNotifySenderName(info?.sender, contactNames)}
        </h6>
        {!!info?.content && (
          <PureMarkdownRenderer
            id={`${info?.id}`}
            disableTyping={true}
            className={cx(styles.content)}
          >
            {info.content}
          </PureMarkdownRenderer>
        )}
        <span className={cx(styles.time)}>
          {dayjs(info?.created).format('YYYY-MM-DD HH:mm')}
        </span>
      </div>
    </div>
  );
};

export default MessageItem;
