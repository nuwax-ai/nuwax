import { BASE_URL } from '@/constants/common.constants';
import classNames from 'classnames';
import { useEffect } from 'react';
import { Outlet } from 'umi';
import HistoryConversation from './HistoryConversation';
import styles from './index.less';
import MenusLayout from './MenusLayout';
import Message from './Message';
import Setting from './Setting';

const cx = classNames.bind(styles);

export default function Layout() {
  useEffect(() => {
    console.log('process.env.BASE_URL: ' + BASE_URL);
  }, []);
  return (
    <div className={cx('flex', 'h-full', styles.container)}>
      {/*菜单栏*/}
      <MenusLayout />
      {/*历史记录弹窗*/}
      <HistoryConversation />
      {/*消息弹窗*/}
      <Message />
      {/*设置弹窗*/}
      <Setting />
      <div className={cx('flex-1', 'overflow-y')}>
        <Outlet />
      </div>
    </div>
  );
}
