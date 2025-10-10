import type { AgentArrangeConfigEnum } from '@/types/enums/space';
import type { ConfigOptionCollapseProps } from '@/types/interfaces/space';
import { Collapse, theme } from 'antd';
import React, { useEffect, useState } from 'react';
import SvgIcon from '../base/SvgIcon';

/**
 * 单个配置项手风琴组件
 */
const ConfigOptionCollapse: React.FC<ConfigOptionCollapseProps> = ({
  items,
  defaultActiveKey,
  onChangeCollapse,
}) => {
  const { token } = theme.useToken();
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
    onChangeCollapse?.(key as AgentArrangeConfigEnum[]);
  };

  return (
    <Collapse
      bordered={false}
      ghost
      expandIcon={({ isActive }) => (
        <SvgIcon
          name="icons-common-caret_right"
          rotate={isActive ? 90 : 0}
          style={{ color: token.colorTextTertiary }}
        />
      )}
      activeKey={activeKey}
      onChange={onChange}
      items={items}
    />
  );
};

export default ConfigOptionCollapse;
