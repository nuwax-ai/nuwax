import { apiSystemConfigList } from '@/services/systemManage';
import { SystemUserConfig } from '@/types/interfaces/systemManage';
import { ConfigProvider, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import BaseTab from './BaseTab';
import styles from './index.less';

const cx = classNames.bind(styles);

type ConfigObj = {
  [K in SystemUserConfig['category']]?: SystemUserConfig[];
};
/**
 * 系统配置页面
 */
const SystemConfig: React.FC = () => {
  const [config, setConfig] = useState<ConfigObj>();
  const fetchConfig = async () => {
    const res = await apiSystemConfigList();
    const _config: ConfigObj = {};
    res.data.forEach((item) => {
      if (!_config[item.category]) {
        _config[item.category] = [];
      }
      const key = item.category;
      if (!_config[key]) return;
      const last = _config[key][_config[key].length - 1];
      const method = last && last.sort > item.sort ? 'unshift' : 'push';
      _config[key][method](item);
    });
    setConfig(_config);
  };
  const [tab, setTab] = useState<TabKey>('BaseConfig');
  const tabs: TabsProps['items'] = [
    {
      key: 'BaseConfig',
      label: '基础配置',
      children: config?.BaseConfig && (
        <BaseTab
          currentTab={tab}
          config={config.BaseConfig}
          refresh={fetchConfig}
        />
      ),
    },
    {
      key: 'ModelSetting',
      label: '默认模型设置',
      children: config?.ModelSetting && (
        <BaseTab
          currentTab={tab}
          config={config.ModelSetting}
          refresh={fetchConfig}
        />
      ),
    },
    {
      key: 'AgentSetting',
      label: '站点智能体设置',
      children: config?.AgentSetting && (
        <BaseTab
          currentTab={tab}
          config={config.AgentSetting}
          refresh={fetchConfig}
        />
      ),
    },
    {
      key: 'DomainBind',
      label: '域名绑定',
      children: config?.DomainBind && (
        <BaseTab
          currentTab={tab}
          config={config.DomainBind}
          refresh={fetchConfig}
        />
      ),
    },
  ];
  const onChange = (key: TabKey) => {
    setTab(key);
  };
  useEffect(() => {
    fetchConfig();
  }, []);
  return (
    <div className={cx(styles.container, 'overflow-y')}>
      <div className={cx(styles.title)}>系统配置页面</div>
      <ConfigProvider
        theme={{
          components: {
            Tabs: {
              itemActiveColor: '#5147FF',
              inkBarColor: '#5147FF',
              itemSelectedColor: '#5147FF',
              itemHoverColor: '#5147FF',
            },
          },
        }}
      >
        <Tabs
          defaultActiveKey="BaseConfig"
          items={tabs}
          onChange={(key) => onChange(key as TabKey)}
        />
      </ConfigProvider>
    </div>
  );
};
export type TabKey =
  | 'BaseConfig'
  | 'ModelSetting'
  | 'AgentSetting'
  | 'DomainBind';
export default SystemConfig;
