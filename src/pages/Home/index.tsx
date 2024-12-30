import { useModel } from '@umijs/max';
import React from 'react';
import styles from './index.less';
import classNames from 'classnames';

const cx = classNames.bind(styles);

const Home: React.FC = () => {
  const { name } = useModel('global');
  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'items-center')}>
      <h2 className={cx(styles.title)}>嗨，我能帮什么忙吗？</h2>
      <p className={cx(styles.tips)}>请输入您的问题，我会尽力为您解答。</p>
      <textarea className={cx(styles.textarea)} placeholder={'待替换'} name="" id="" cols="30" rows="10"></textarea>
      <div className={cx(styles.recommend)}>

      </div>
    </div>
  );
};

export default Home;
