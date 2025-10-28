import { Divider } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface NoMoreDividerProps {
  /** 自定义文本，默认为"没有更多了" */
  text?: string;
}

const NoMoreDivider: React.FC<NoMoreDividerProps> = ({
  text = '没有更多了',
}) => {
  return (
    <div className={cx(styles['no-more-divider'])}>
      <Divider plain className={cx(styles['divider'])}>
        {text}
      </Divider>
    </div>
  );
};

export default NoMoreDivider;
