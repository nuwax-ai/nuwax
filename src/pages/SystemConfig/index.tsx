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
  const tabs: TabsProps['items'] = [
    {
      key: '1',
      label: '基础配置',
      children: config?.BaseConfig && <BaseTab config={config.BaseConfig} />,
    },
    {
      key: '2',
      label: '默认模型设置',
      children: config?.ModelSetting && (
        <BaseTab config={config.ModelSetting} />
      ),
    },
    {
      key: '3',
      label: '站点智能体设置',
      children: config?.AgentSetting && (
        <BaseTab config={config.AgentSetting} />
      ),
    },
    {
      key: '4',
      label: '域名绑定',
      children: config?.DomainBind && <BaseTab config={config.DomainBind} />,
    },
  ];
  const onChange = (key: string) => {
    console.log(key);
  };
  useEffect(() => {
    fetchConfig();
  }, []);
  return (
    <div className={cx(styles.container)}>
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
        <Tabs defaultActiveKey="1" items={tabs} onChange={onChange} />
      </ConfigProvider>
    </div>
  );
};

export default SystemConfig;
