import MenusLayout from '@/components/MenusLayout';
import { BASE_URL } from '@/constants/common.constants';
import classNames from 'classnames';
import { useEffect } from 'react';
import { Outlet } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

export default function Layout() {
  useEffect(() => {
    console.log('process.env.BASE_URL: ' + BASE_URL);
  }, []);
  return (
    <div className={cx('flex', 'h-full', styles.container)}>
      <MenusLayout />
      <div className={cx(styles['main-container'])}>
        <Outlet />
      </div>
    </div>
  );
}
