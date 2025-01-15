import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const PreviewAndDebug: React.FC = () => {
  return <div className={cx(styles.container)}></div>;
};

export default PreviewAndDebug;
