import SvgIcon from '@/components/base/SvgIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiAuthIdpLoginList,
  apiUserIdentityList,
  apiUserIdentityUnbind,
} from '@/services/authIdp';
import { dict } from '@/services/i18nRuntime';
import type {
  AuthIdpLoginItem,
  UserIdentityInfo,
} from '@/types/interfaces/authIdp';
import { modalConfirm } from '@/utils/ant-custom';
import { filterIdpByUa } from '@/utils/authIdp';
import { startIdpNavigation } from '@/utils/idpNavigation';
import { Alert, Button, Empty, List, message, Spin, Typography } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 绑定完成后回到当前页并自动打开本面板 */
export const ACCOUNT_BIND_QUERY = 'setting=account-bind';

const buildReturnPath = () => {
  const { pathname, search } = window.location;
  const params = new URLSearchParams(search);
  params.delete('setting');
  params.delete('idpError');
  const rest = params.toString();
  return `${pathname}?${rest ? `${rest}&` : ''}${ACCOUNT_BIND_QUERY}`;
};

const formatTime = (value?: string) =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '--';

/**
 * 账号绑定：管理当前用户绑定的三方登录身份（CAS / OAuth2 / 微信）
 */
const AccountBind: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [identities, setIdentities] = useState<UserIdentityInfo[]>([]);
  const [providers, setProviders] = useState<AuthIdpLoginItem[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const loadVersion = useRef(0);
  const mounted = useRef(false);
  const canOperate = useRef(false);
  canOperate.current = hasLoaded && !loading && !loadError;

  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    canOperate.current = false;
    setLoading(true);
    setLoadError(false);
    try {
      const [identityRes, idpRes] = await Promise.all([
        apiUserIdentityList(),
        apiAuthIdpLoginList(),
      ]);
      // 失败或无效响应不能作为“没有绑定”；两份成功数据一起替换旧快照。
      if (
        identityRes?.code !== SUCCESS_CODE ||
        !Array.isArray(identityRes.data) ||
        idpRes?.code !== SUCCESS_CODE ||
        !Array.isArray(idpRes.data?.items)
      )
        throw new Error('Invalid identity list response');
      if (!mounted.current || version !== loadVersion.current) return;
      setIdentities(identityRes.data);
      setProviders(filterIdpByUa(idpRes.data.items, navigator.userAgent));
      setHasLoaded(true);
    } catch {
      if (mounted.current && version === loadVersion.current)
        setLoadError(true);
    } finally {
      if (mounted.current && version === loadVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      canOperate.current = false;
      loadVersion.current += 1;
    };
  }, [load]);

  // 已绑定的登录方式不再出现在「可绑定」里
  const bindable = useMemo(() => {
    const bound = new Set(identities.map((i) => i.idpId));
    return providers.filter((p) => !bound.has(p.id));
  }, [identities, providers]);

  const handleUnbind = (identity: UserIdentityInfo) => {
    modalConfirm(
      dict('PC.Layouts.Setting.AccountBind.unbindConfirm'),
      identity.providerName || identity.externalUserName || '',
      async () => {
        if (!mounted.current || !canOperate.current) return;
        // 唯一登录方式且未设密码时后端拒绝，文案由请求层提示（引导去「重置密码」）
        try {
          await apiUserIdentityUnbind(identity.id);
        } catch {
          // 请求层已显示失败原因；消费拒绝，避免确认框产生未处理异常。
          // 保留已绑定列表，用户可重新确认后重试。
          return;
        }
        if (!mounted.current) return;
        message.success(dict('PC.Layouts.Setting.AccountBind.unbindSuccess'));
        await load();
      },
    );
  };

  const handleBind = (provider: AuthIdpLoginItem) => {
    if (!canOperate.current) return;
    canOperate.current = false;
    void startIdpNavigation({
      providerId: provider.id,
      mode: 'bind',
      redirect: buildReturnPath(),
    })
      .then((result) => {
        if (!mounted.current) return;
        if (result !== 'started') canOperate.current = true;
        if (result === 'failed')
          message.error(dict('PC.Pages.Login.hostSessionSyncFailed'));
      })
      .catch(() => {
        if (mounted.current) canOperate.current = true;
      });
  };

  return (
    <div className={cx(styles.container)}>
      <h3>{dict('PC.Layouts.Setting.AccountBind.title')}</h3>
      <Spin spinning={loading}>
        {loadError && (
          <Alert
            showIcon
            type="error"
            message={dict('PC.Layouts.Setting.AccountBind.loadFailed')}
            action={
              <Button onClick={() => void load()}>
                {dict('PC.Common.Global.refresh')}
              </Button>
            }
          />
        )}
        <section className={cx(styles.section)}>
          <div className={cx(styles['section-title'])}>
            {dict('PC.Layouts.Setting.AccountBind.bound')}
          </div>
          {identities.length ? (
            <List
              dataSource={identities}
              renderItem={(identity) => (
                <List.Item
                  actions={[
                    <Button
                      key="unbind"
                      type="link"
                      danger
                      size="small"
                      disabled={loading || loadError}
                      onClick={() => handleUnbind(identity)}
                    >
                      {dict('PC.Layouts.Setting.AccountBind.unbind')}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      identity.providerName ||
                      dict('PC.Layouts.Setting.AccountBind.providerRemoved')
                    }
                    description={
                      <div className={cx(styles.meta)}>
                        <span>
                          {identity.externalUserName ||
                            identity.externalIdMasked ||
                            '--'}
                        </span>
                        <Typography.Text type="secondary">
                          {dict(
                            'PC.Layouts.Setting.AccountBind.lastLogin',
                            formatTime(identity.lastLoginTime),
                          )}
                        </Typography.Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            !loading &&
            !loadError &&
            hasLoaded && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={dict('PC.Layouts.Setting.AccountBind.empty')}
              />
            )
          )}
        </section>

        {bindable.length > 0 && (
          <section className={cx(styles.section)}>
            <div className={cx(styles['section-title'])}>
              {dict('PC.Layouts.Setting.AccountBind.bindable')}
            </div>
            <div className={cx(styles.providers)}>
              {bindable.map((provider) => (
                <Button
                  key={provider.id}
                  icon={
                    provider.icon ? (
                      <img
                        className={cx(styles.icon)}
                        src={provider.icon}
                        alt=""
                      />
                    ) : (
                      <SvgIcon name="icons-common-link" />
                    )
                  }
                  onClick={() => handleBind(provider)}
                  disabled={loading || loadError}
                >
                  {provider.name}
                </Button>
              ))}
            </div>
          </section>
        )}
      </Spin>
    </div>
  );
};

export default AccountBind;
