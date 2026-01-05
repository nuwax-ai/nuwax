import { Segmented } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export type LeftPanelTabType = 'chat' | 'design' | 'data';

interface LeftPanelTabsProps {
  /** 当前激活的标签 */
  activeTab: LeftPanelTabType;
  /** 切换标签回调 */
  onTabChange: (tab: LeftPanelTabType) => void;
  /** 自定义类名 */
  className?: string;
}

const TAB_OPTIONS = [
  { label: '对话', value: 'chat' as LeftPanelTabType },
  { label: '设计', value: 'design' as LeftPanelTabType },
  { label: '数据', value: 'data' as LeftPanelTabType },
];

/**
 * 左侧面板标签切换组件
 * 用于在对话、设计、数据三个视图间切换
 */
const LeftPanelTabs: React.FC<LeftPanelTabsProps> = ({
  activeTab,
  onTabChange,
  className,
}) => {
  return (
    <div className={cx(styles.tabsContainer, className)}>
      <Segmented
        value={activeTab}
        onChange={(value) => onTabChange(value as LeftPanelTabType)}
        options={TAB_OPTIONS}
        className={styles.segmented}
      />
    </div>
  );
};

export default LeftPanelTabs;
