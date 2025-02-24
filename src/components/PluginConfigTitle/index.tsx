import type { PluginConfigTitleProps } from '@/types/interfaces/common';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const PluginConfigTitle: React.FC<PluginConfigTitleProps> = ({
  title,
  onClick,
}) => {
  return (
    <div className={cx('flex', 'content-between', 'items-center', 'mb-12')}>
      <h3 className={cx(styles.title)}>{title}</h3>
      <Button icon={<PlusOutlined />} onClick={onClick}>
        新增参数
      </Button>
    </div>
  );
};

export default PluginConfigTitle;
