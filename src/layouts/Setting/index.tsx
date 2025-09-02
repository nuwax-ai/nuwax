import { SETTING_ACTIONS } from '@/constants/menus.constants';
import { getTenantThemeConfig } from '@/services/tenant';
import { SettingActionEnum } from '@/types/enums/menus';
import { TenantThemeConfig } from '@/types/tenant';
import { CloseOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import ResetPassword from './ResetPassword';
import SettingAccount from './SettingAccount';
import SettingEmail from './SettingEmail';
import ThemeSwitchPanel from './ThemeSwitchPanel';

const cx = classNames.bind(styles);

const Setting: React.FC = () => {
  const { openSetting, setOpenSetting } = useModel('layout');
  const [action, setAction] = useState<SettingActionEnum>(
    SettingActionEnum.Account,
  );
  const [tenantThemeConfig, setTenantThemeConfig] =
    useState<TenantThemeConfig | null>(null);
  const [loading, setLoading] = useState(false);

  // 获取租户主题配置
  useEffect(() => {
    const fetchTenantThemeConfig = async () => {
      if (action === SettingActionEnum.Theme_Switch && !tenantThemeConfig) {
        setLoading(true);
        try {
          const config = await getTenantThemeConfig();
          setTenantThemeConfig(config);
        } catch (error) {
          console.error('获取租户主题配置失败:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTenantThemeConfig();
  }, [action, tenantThemeConfig]);

  const handlerClick = (type: SettingActionEnum) => {
    setAction(type);
  };

  const Content: React.FC = () => {
    switch (action) {
      case SettingActionEnum.Account:
        return <SettingAccount />;
      case SettingActionEnum.Email_Bind:
        return <SettingEmail />;
      case SettingActionEnum.Reset_Password:
        return <ResetPassword />;
      case SettingActionEnum.Theme_Switch:
        if (loading) {
          return <div className={cx(styles.loading)}>加载中...</div>;
        }
        if (!tenantThemeConfig) {
          return <div className={cx(styles.error)}>获取主题配置失败</div>;
        }
        return <ThemeSwitchPanel tenantThemeConfig={tenantThemeConfig} />;
      default:
        return <SettingAccount />;
    }
  };

  // 获取当前登录方式是否为手机登录,如果是手机登录,则为true,否则为false
  const authType = localStorage.getItem('AUTH_TYPE') === '1';
  return (
    <Modal
      centered
      open={openSetting}
      footer={null}
      onCancel={() => setOpenSetting(false)}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div className={cx(styles.container, 'flex', 'overflow-hide')}>
          <div className={cx(styles.left)}>
            <h3>设置</h3>
            <ul>
              {SETTING_ACTIONS.map((item) => (
                <li
                  key={item.type}
                  className={cx(styles.item, 'cursor-pointer', {
                    [styles.checked]: action === item.type,
                  })}
                  onClick={() => handlerClick(item.type)}
                >
                  {item.label === '邮箱绑定'
                    ? authType
                      ? '邮箱绑定'
                      : '手机绑定'
                    : item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className={cx('flex-1', styles.right)}>
            <Content />
          </div>
          <CloseOutlined
            className={cx(styles.close, 'cursor-pointer')}
            onClick={() => setOpenSetting(false)}
          />
        </div>
      )}
    ></Modal>
  );
};

export default Setting;
