import { Link, Outlet } from 'umi';
import styles from './index.less';
import { useEffect } from 'react';
import { BASE_URL } from '@/constants/common.constants';

export default function Layout() {
  useEffect(() => {
    console.log("process.env.BASE_URL: " + BASE_URL)
  }, []);
  return (
    <div className={styles['layout-container']}>
      <div>左侧导航栏</div>
      <div>
        <Link to={'/'}>主页</Link>
        <br/>
        <Link to={'/space'}>工作空间</Link>
        <br/>
        <Link to={'/404'}>404</Link>
      </div>
      <div className={styles['main-container']}>
        <Outlet />
      </div>
    </div>
  );
}
