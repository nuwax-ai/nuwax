import type { AgentArrangeConfigEnum } from '@/types/enums/space';
import type { ConfigOptionCollapseProps } from '@/types/interfaces/space';
import { RightOutlined } from '@ant-design/icons';
import { Collapse } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个配置项手风琴组件
 */
const ConfigOptionCollapse: React.FC<ConfigOptionCollapseProps> = ({
  items,
  defaultActiveKey,
}) => {
  // 当前激活 tab 面板的 key
  const [activeKey, setActiveKey] = useState<AgentArrangeConfigEnum[]>([]);

  useEffect(() => {
    if (defaultActiveKey?.length > 0) {
      setActiveKey(defaultActiveKey as AgentArrangeConfigEnum[]);
    }
  }, [defaultActiveKey]);

  // 切换面板的回调
  const onChange = (key: string | string[]) => {
    setActiveKey(key as AgentArrangeConfigEnum[]);
  };

  return (
    <Collapse
      bordered={false}
      expandIcon={({ isActive }) => (
        <RightOutlined rotate={isActive ? 90 : 0} />
      )}
      className={cx(styles.header)}
      activeKey={activeKey}
      onChange={onChange}
      items={items}
    />
  );
};

export default ConfigOptionCollapse;
