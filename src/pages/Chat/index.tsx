import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'umi';
import styles from './index.less';
import ShowArea from './ShowArea';

const cx = classNames.bind(styles);

/**
 * 主页咨询聊天页面
 */
const Chat: React.FC = () => {
  const [chatTitle, setChatTitle] = useState<string>();
  const location = useLocation();
  const { message, attachments } = location.state;

  useEffect(() => {
    console.log(attachments)
    setChatTitle(message);
  }, []);

  return (
    <div className={cx('flex', 'h-full')}>
      <div className={cx('flex-1', 'flex', 'flex-col', 'items-center')}>
        <h3 className={cx(styles.title)}>{chatTitle}</h3>
      </div>
      {/*展示台区域*/}
      <ShowArea />
    </div>
  );
};

export default Chat;
