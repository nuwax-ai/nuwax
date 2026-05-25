import { CheckOutlined } from '@ant-design/icons';
import React from 'react';
import styles from './index.less';

const AllowAlwaysIcon: React.FC = () => (
  <span className={styles.multiCheck} aria-hidden>
    <CheckOutlined className={styles.multiCheckItem} />
    <CheckOutlined className={styles.multiCheckItem} />
    <CheckOutlined className={styles.multiCheckItem} />
  </span>
);

export default AllowAlwaysIcon;
