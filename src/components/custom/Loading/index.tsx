import { LoadingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface LoadingProps {
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ className }) => {
  return (
    <div
      className={cx(
        'flex',
        'flex-1',
        'items-center',
        'content-center',
        styles.container,
        className,
      )}
    >
      <LoadingOutlined />
      <span>加载中...</span>
    </div>
  );
};

export default Loading;
