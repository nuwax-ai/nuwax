import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const McpItem: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <h1>Hello World</h1>
    </div>
  );
};

export default McpItem;
