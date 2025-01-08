import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const cx = classNames.bind(styles);

const Space: React.FC = () => {
  return <div className={cx(styles.container, 'h-full')}>
    <div className={cx('flex', 'content-between')}>
      <h3 className={cx(styles.title)}>应用开发</h3>
      <Button type="primary" icon={<PlusOutlined />}>
        Search
      </Button>
    </div>
    <div className={cx('flex')}>

    </div>
  </div>;
};

export default Space;
