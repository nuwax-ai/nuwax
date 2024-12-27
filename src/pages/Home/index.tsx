import { useModel } from '@umijs/max';
import React from 'react';
import styles from './index.less';

const Home: React.FC = () => {
  const { name } = useModel('global');
  return <div className={styles.container}>{name} 主页</div>;
};

export default Home;
