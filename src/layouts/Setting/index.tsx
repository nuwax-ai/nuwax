import { SETTING_ACTIONS } from '@/constants/menus.constants';
import useScrollbarScrollShow from '@/hooks/useScrollbarScrollShow';
import { apiAuthIdpLoginList, apiUserIdentityList } from '@/services/authIdp';
import { dict } from '@/services/i18nRuntime';
import { getTenantThemeConfig } from '@/services/tenant';
import { SettingActionEnum } from '@/types/enums/menus';
import { TenantThemeConfig } from '@/types/tenant';
import { CloseOutlined } from '@ant-design/icons';
import { Button, message, Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel } from 'umi';
import AccountBind from './AccountBind';
import DeveloperProfile from './DeveloperProfile';
import styles from './index.less';
import LanguageSwitchPanel from './LanguageSwitchPanel';
import ResetPassword from './ResetPassword';
import SettingAccount from './SettingAccount';
import SettingEmail from './SettingEmail';
import SystemVersionPanel from './SystemVersionPanel';
import ThemeSwitchPanel from './ThemeSwitchPanel';
import UsageStatistics from './UsageStatistics';

const cx = classNames.bind(styles);

const Setting: React.FC = () => {
  const { openSetting, setOpenSetting, isMobile } = useModel('layout');
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const isEnableSubscription = tenantConfigInfo?.enableSubscription !== 0;
  const [action, setAction] = useState<SettingActionEnum>(
    SettingActionEnum.Account,
  );
  const [tenantThemeConfig, setTenantThemeConfig] =
    useState<TenantThemeConfig | null>(null);
  const [loading, setLoading] = useState(false);
  // 账号绑定入口：租户配置了三方登录或用户已有绑定时才显示（桌面客户端本期不接）
  const [showAccountBind, setShowAccountBind] = useState(false);
  // 左侧菜单 / 右侧内容区滚动条「仅滚动时显示」
  const menuScrollShowRef = useScrollbarScrollShow<HTMLUListElement>();
  const contentScrollShowRef = useScrollbarScrollShow<HTMLDivElement>();

  // 三方绑定整页跳转回来（?setting=account-bind[&idpError=]）：打开弹窗并定位到账号绑定
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('setting') !== 'account-bind') return;
    const idpError = params.get('idpError');
    params.delete('setting');
    params.delete('idpError');
    const rest = params.toString();
    history.replace(
      `${window.location.pathname}${rest ? `?${rest}` : ''}${
        window.location.hash
      }`,
    );
    setAction(SettingActionEnum.Account_Bind);
    setOpenSetting(true);
    if (idpError) message.error(idpError);
  }, []);

  useEffect(() => {
    if (!openSetting) return;
    let cancelled = false;
    Promise.all([
      apiAuthIdpLoginList().catch(() => null),
      apiUserIdentityList().catch(() => null),
    ]).then(([idpRes, identityRes]) => {
      if (cancelled) return;
      setShowAccountBind(
        !!idpRes?.data?.items?.length || !!identityRes?.data?.length,
      );
    });
    return () => {
      cancelled = true;
    };
  }, [openSetting]);

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

  /** 渲染内容 */
  const renderContent = () => {
    switch (action) {
      case SettingActionEnum.Account:
        return <SettingAccount />;
      case SettingActionEnum.Email_Bind:
        return <SettingEmail />;
      case SettingActionEnum.Reset_Password:
        return <ResetPassword />;
      case SettingActionEnum.Account_Bind:
        return <AccountBind />;
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
      case SettingActionEnum.Developer_Profile:
        return <DeveloperProfile />;
      case SettingActionEnum.System_Version:
        return <SystemVersionPanel version={tenantConfigInfo?.version} />;
      default:
        return <SettingAccount />;
    }
  };

  // 获取当前登录方式是否为手机登录,如果是手机登录,则为true,否则为false
  const authType = localStorage.getItem('AUTH_TYPE') === '1';

  /** 获取操作标签 */
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
      case SettingActionEnum.Account_Bind:
        return dict('PC.Layouts.Setting.AccountBind.title');
      case SettingActionEnum.Theme_Switch:
        return dict('PC.Pages.Setting.themeSwitch');
      case SettingActionEnum.Language_Switch:
        return dict('PC.Pages.Setting.language');
      case SettingActionEnum.Usage_Statistics:
        return dict('PC.Pages.Setting.usageStatistics');
      case SettingActionEnum.Developer_Profile:
        return dict('PC.Pages.Setting.DeveloperProfile.title');

      /** 系统版本 */
      case SettingActionEnum.System_Version:
        return dict('PC.Constants.Menus.systemVersion');
      /** 默认返回空字符串 */
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
      // 钉死基础层级（bug 2439）：antd 弹层 zIndex 会随打开次数爬升，客户端壳的
      // 顶行/拖拽热区固定在 1099–1101 层——爬升越过后遮罩盖住工具栏（不可点）。
      // 固定 1000=antd 默认基线，PC web 无壳层不受影响；内部下拉等次级弹层
      // 相对爬升仍在 1000+ 区间，低于壳层。
      zIndex={1000}
      modalRender={() => (
        <div
          className={cx(styles.container, 'flex', 'overflow-hide', {
            [styles['container-mobile']]: isMobile,
          })}
        >
          <div className={cx(styles.left)}>
            <h3>{dict('PC.Pages.Setting.profileTitle')}</h3>
            <ul ref={menuScrollShowRef}>
              {SETTING_ACTIONS.filter((item) => {
                if (item.type === SettingActionEnum.Developer_Profile) {
                  return isEnableSubscription;
                }
                if (item.type === SettingActionEnum.Account_Bind) {
                  return showAccountBind;
                }
                return true;
              }).map((item) => (
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
          <div
            ref={contentScrollShowRef}
            className={cx('flex-1', 'overflow-hide', styles.right)}
          >
            {renderContent()}
          </div>
        </div>
      )}
    ></Modal>
  );
};

export default Setting;
