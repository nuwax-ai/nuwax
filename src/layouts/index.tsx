import { BASE_URL } from '@/constants/common.constants';
import classNames from 'classnames';
import { useEffect } from 'react';
import { Outlet } from 'umi';
import HistoryConversation from './HistoryConversation';
import styles from './index.less';
import MenusLayout from './MenusLayout';

const cx = classNames.bind(styles);

export default function Layout() {
  useEffect(() => {
    console.log('process.env.BASE_URL: ' + BASE_URL);
  }, []);
  return (
    <div className={cx('flex', 'h-full', styles.container)}>
      <MenusLayout />
      <HistoryConversation />
      <div className={cx('flex-1')}>
        <Outlet />
      </div>
    </div>
  );
}
