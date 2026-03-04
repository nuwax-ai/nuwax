import WorkspaceLayout from '@/components/WorkspaceLayout';
import Loading from '@/components/custom/Loading';
import { SYSTEM_SETTING_TABS } from '@/constants/system.constants';
import { apiSystemConfigList } from '@/services/systemManage';
import { ConfigObj, TabKey } from '@/types/interfaces/systemManage';
import { Button, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useModel } from 'umi';
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
  const tabRef = useRef<any>();
  const location = useLocation();

  // 租户配置信息查询接口
  const { runTenantConfig } = useModel('tenantConfigInfo');
  const { hasPermission } = useModel('menuModel');

  const fetchConfig = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // 监听 location.state 变化
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      setTab('BaseConfig');
      setLoading(true);
      fetchConfig();
    }
  }, [location.state]);

  const tabConfig = useMemo(() => {
    return config?.[tab] || [];
  }, [config, tab]);

  const handleSave = () => {
    tabRef.current?.submit?.();
  };

  return (
    <WorkspaceLayout
      title="系统设置"
      hideScroll
      extraContent={
        <div style={{ padding: '0 24px 24px' }}>
          {hasPermission('system_setting_save') && (
            <Button type="primary" onClick={handleSave}>
              保存
            </Button>
          )}
        </div>
      }
    >
      <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
        <Tabs
          activeKey={tab}
          items={SYSTEM_SETTING_TABS}
          onChange={(key) => setTab(key as TabKey)}
        />
        {loading ? (
          <Loading />
        ) : (
          <BaseTab
            key={tab}
            ref={tabRef}
            currentTab={tab}
            config={tabConfig}
            refresh={runTenantConfig}
          />
        )}
      </div>
    </WorkspaceLayout>
  );
};

export default SystemConfig;
