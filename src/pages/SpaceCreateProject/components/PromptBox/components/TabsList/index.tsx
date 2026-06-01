import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface TabItem {
  key: string;
  label: string;
  placeholder: string;
}

interface TabsListProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (key: string) => void;
}

const TabsList: React.FC<TabsListProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className={cx(styles['tabs-list'])}>
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className={cx(styles['tab-item'], {
            [styles['tab-active']]: activeTab === tab.key,
          })}
          onClick={() => {
            onChange(tab.key);
          }}
        >
          {tab.label}
        </div>
      ))}
    </div>
  );
};

export default TabsList;
