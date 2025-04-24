import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const AgentConversation: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <div className={cx('flex', 'items-center', 'content-between')}>
        <h3 className={cx(styles.title)}>相关会话</h3>
        <span className={cx(styles.more, 'cursor-pointer')}>查看更多</span>
      </div>
      <div className={cx(styles['chat-wrapper'])}>
        <div className={cx(styles['chat-item'])}>
          <p className={cx('text-ellipsis')}>关于智能体大赛咨询</p>
          <span className={cx(styles.time)}>昨天</span>
        </div>
        <div className={cx(styles['chat-item'])}>
          <p className={cx('text-ellipsis')}>关于智能体大赛咨询</p>
          <span className={cx(styles.time)}>昨天</span>
        </div>
        <div className={cx(styles['chat-item'])}>
          <p className={cx('text-ellipsis')}>关于智能体大赛咨询</p>
          <span className={cx(styles.time)}>昨天</span>
        </div>
        <div className={cx(styles['chat-item'])}>
          <p className={cx('text-ellipsis')}>关于智能体大赛咨询</p>
          <span className={cx(styles.time)}>昨天</span>
        </div>
        <div className={cx(styles['chat-item'])}>
          <p className={cx('text-ellipsis')}>关于智能体大赛咨询</p>
          <span className={cx(styles.time)}>昨天</span>
        </div>
      </div>
    </div>
  );
};

export default AgentConversation;
