import type { AgentArrangeConfigEnum } from '@/types/enums/space';
import type { ConfigOptionCollapseProps } from '@/types/interfaces/space';
import { Collapse, theme } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import SvgIcon from '../base/SvgIcon';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 单个配置项手风琴组件
 */
const ConfigOptionCollapse: React.FC<ConfigOptionCollapseProps> = ({
  className,
  items,
  defaultActiveKey,
  onChangeCollapse,
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
    onChangeCollapse?.(key as AgentArrangeConfigEnum[]);
  };
  const { token } = theme.useToken();

  return (
    <Collapse
      bordered={false}
      expandIcon={({ isActive }) => (
        <SvgIcon
          name="icons-common-caret_right"
          rotate={isActive ? 90 : 0}
          style={{ color: token.colorTextTertiary }}
        />
      )}
      className={cx(styles.header, className)}
      activeKey={activeKey}
      onChange={onChange}
      items={items}
    />
  );
};

export default ConfigOptionCollapse;
