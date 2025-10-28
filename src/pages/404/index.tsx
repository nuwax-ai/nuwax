import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const Index: React.FC = () => {
  return <div className={cx(styles.container)}>404页面</div>;
};

export default Index;
