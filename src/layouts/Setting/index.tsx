import { SETTING_ACTIONS } from '@/constants/menus.constants';
import { dict } from '@/services/i18nRuntime';
import { getTenantThemeConfig } from '@/services/tenant';
import { SettingActionEnum } from '@/types/enums/menus';
import { TenantThemeConfig } from '@/types/tenant';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import LanguageSwitchPanel from './LanguageSwitchPanel';
import ResetPassword from './ResetPassword';
import SettingAccount from './SettingAccount';
import SettingEmail from './SettingEmail';
import ThemeSwitchPanel from './ThemeSwitchPanel';
import UsageStatistics from './UsageStatistics';

const cx = classNames.bind(styles);

const Setting: React.FC = () => {
  const { openSetting, setOpenSetting, isMobile } = useModel('layout');
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
          console.error('Failed to load tenant theme config:', error);
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
          return (
            <div className={cx(styles.loading)}>
              {dict('PC.Common.Global.loading')}
            </div>
          );
        }
        if (!tenantThemeConfig) {
          return (
            <div className={cx(styles.error)}>
              {dict('PC.Pages.Setting.themeLoadFailed')}
            </div>
          );
        }
        return <ThemeSwitchPanel tenantThemeConfig={tenantThemeConfig} />;
      case SettingActionEnum.Language_Switch:
        return <LanguageSwitchPanel />;
      case SettingActionEnum.Usage_Statistics:
        return <UsageStatistics />;
      default:
        return <SettingAccount />;
    }
  };

  // 获取当前登录方式是否为手机登录,如果是手机登录,则为true,否则为false
  const authType = localStorage.getItem('AUTH_TYPE') === '1';
  const getActionLabel = (type: SettingActionEnum) => {
    switch (type) {
      case SettingActionEnum.Account:
        return dict('PC.Pages.Setting.accountTitle');
      case SettingActionEnum.Email_Bind:
        return authType
          ? dict('PC.Pages.Setting.emailBind')
          : dict('PC.Pages.Setting.phoneBind');
      case SettingActionEnum.Reset_Password:
        return dict('PC.Pages.Setting.resetPassword');
      case SettingActionEnum.Theme_Switch:
        return dict('PC.Pages.Setting.themeSwitch');
      case SettingActionEnum.Language_Switch:
        return dict('PC.Pages.Setting.language');
      case SettingActionEnum.Usage_Statistics:
        return dict('PC.Pages.Setting.usageStatistics');
      default:
        return '';
    }
  };
  return (
    <Modal
      centered
      open={openSetting}
      footer={null}
      onCancel={() => setOpenSetting(false)}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div
          className={cx(styles.container, 'flex', 'overflow-hide', {
            [styles['container-mobile']]: isMobile,
          })}
        >
          <div className={cx(styles.left)}>
            <h3>{dict('PC.Pages.Setting.profileTitle')}</h3>
            <ul>
              {SETTING_ACTIONS.map((item) => (
                <li
                  key={item.type}
                  className={cx(styles.item, 'cursor-pointer', {
                    [styles.checked]: action === item.type,
                  })}
                  onClick={() => handlerClick(item.type)}
                >
                  {getActionLabel(item.type)}
                </li>
              ))}
            </ul>
          </div>
          <Button
            type="text"
            className={cx(styles.close, 'cursor-pointer')}
            icon={<CloseOutlined />}
            onClick={() => setOpenSetting(false)}
          />
          <div className={cx('flex-1', 'overflow-hide', styles.right)}>
            <Content />
          </div>
        </div>
      )}
    ></Modal>
  );
};

export default Setting;
