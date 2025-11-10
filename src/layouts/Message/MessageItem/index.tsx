import avatar from '@/assets/images/avatar.png';
import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import type { MessageItemProps } from '@/types/interfaces/layouts';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// const md = markdown({
//   html: true,
//   breaks: true,
//   linkify: true,
// });

// 消息模块
const MessageItem: React.FC<MessageItemProps> = ({ info }) => {
  return (
    <div className={cx('flex', styles.container)}>
      <img
        className={cx(styles.avatar)}
        src={info?.sender?.avatar || (avatar as string)}
        alt=""
      />
      <div className={cx('flex-1', 'flex', 'flex-col')}>
        <h6 className={cx(styles.name)}>
          {info?.sender?.nickName || info?.sender?.userName}
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
