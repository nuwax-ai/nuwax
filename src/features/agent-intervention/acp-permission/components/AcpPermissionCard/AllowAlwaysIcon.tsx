import { CheckOutlined } from '@ant-design/icons';
import React from 'react';
import styles from './index.less';

/**
 * 「始终允许」专用图标：叠放多个打勾，与「允许一次」单勾区分
 */
const AllowAlwaysIcon: React.FC = () => (
  <span className={styles.multiCheck} aria-hidden>
    <CheckOutlined className={styles.multiCheckItem} />
    <CheckOutlined className={styles.multiCheckItem} />
    <CheckOutlined className={styles.multiCheckItem} />
  </span>
);

export default AllowAlwaysIcon;
