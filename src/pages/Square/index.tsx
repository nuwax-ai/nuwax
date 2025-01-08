import squareImage from '@/assets/images/square_bg.png';
import SingleAgent from '@/pages/Square/SingleAgent';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const Square: React.FC = () => {
  return (
    <div className={cx(styles.container, 'h-full')}>
      <header className={cx(styles.header, 'relative')}>
        <img className={'absolute'} src={squareImage as string} alt="" />
        <div className={cx(styles['cover-box'], 'h-full', 'relative')}>
          <h3>女娲，人人都是智能设计师</h3>
          <p>新一代AI应用设计、开发、实践平台</p>
          <p>无需代码，轻松创建，适合各类人群，支持多种端发布及API</p>
        </div>
      </header>
      <h6 className={cx(styles['theme-title'])}>智能体</h6>
      {/*todo 滚动加载更多*/}
      <div className={cx(styles['list-section'])}>
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
        <SingleAgent />
      </div>
    </div>
  );
};

export default Square;
