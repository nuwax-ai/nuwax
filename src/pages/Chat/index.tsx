import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'umi';
import styles from './index.less';
import ShowArea from './ShowArea';

const cx = classNames.bind(styles);

/**
 * 主页咨询聊天页面
 * @constructor
 */
const Chat: React.FC = () => {
  const [chatTitle, setChatTitle] = useState<string>();
  const location = useLocation();
  const { question } = location.state;

  useEffect(() => {
    setChatTitle(question);
  }, []);

  return (
    <div className={cx('flex', 'h-full')}>
      <div className={cx('flex-1', 'flex', 'flex-col', 'items-center')}>
        <h3 className={cx(styles.title)}>{chatTitle}</h3>
      </div>
      <ShowArea />
    </div>
  );
};

export default Chat;
