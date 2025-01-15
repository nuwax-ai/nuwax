import type { ConfigOptionCollapseProps } from '@/types/interfaces/space';
import { RightOutlined } from '@ant-design/icons';
import { Collapse } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个配置项手风琴组件
 */
const ConfigOptionCollapse: React.FC<ConfigOptionCollapseProps> = ({
  items,
}) => {
  return (
    <Collapse
      bordered={false}
      expandIcon={({ isActive }) => (
        <RightOutlined rotate={isActive ? 90 : 0} />
      )}
      className={cx(styles.header)}
      items={items}
    />
  );
};

export default ConfigOptionCollapse;
