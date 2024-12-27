import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Space: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      工作空间
    </div>
  );
};

export default Space;