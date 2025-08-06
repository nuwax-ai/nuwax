import Loading from '@/components/custom/Loading';
import { SYSTEM_SETTING_TABS } from '@/constants/system.constants';
import { apiSystemConfigList } from '@/services/systemManage';
import { ConfigObj, TabKey } from '@/types/interfaces/systemManage';
import { ConfigProvider, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';
import BaseTab from './BaseTab';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 系统配置页面
 */
const SystemConfig: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ConfigObj>();
  const [tab, setTab] = useState<TabKey>('BaseConfig');
  // 租户配置信息查询接口
  const { runTenantConfig } = useModel('tenantConfigInfo');

  const fetchConfig = async () => {
    const res = await apiSystemConfigList();
    setLoading(false);
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

  useEffect(() => {
    setLoading(true);
    fetchConfig();
  }, []);

  const tabConfig = useMemo(() => {
    return config?.[tab] || [];
  }, [config, tab]);
  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
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
          items={SYSTEM_SETTING_TABS}
          onChange={(key) => setTab(key as TabKey)}
        />
        {loading ? (
          <Loading />
        ) : (
          <BaseTab
            currentTab={tab}
            config={tabConfig}
            refresh={runTenantConfig}
          />
        )}
      </ConfigProvider>
    </div>
  );
};

export default SystemConfig;
