import SvgIcon from '@/components/base/SvgIcon';
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
import {
  buildIdentityBindUrl,
  filterIdpByUa,
  getBusinessBase,
} from '@/utils/authIdp';
import { Button, Empty, List, message, Spin, Typography } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [identityRes, idpRes] = await Promise.all([
        apiUserIdentityList(),
        apiAuthIdpLoginList().catch(() => null),
      ]);
      setIdentities(identityRes?.data ?? []);
      setProviders(
        filterIdpByUa(idpRes?.data?.items ?? [], navigator.userAgent),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
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
        // 唯一登录方式且未设密码时后端拒绝，文案由请求层提示（引导去「重置密码」）
        await apiUserIdentityUnbind(identity.id);
        message.success(dict('PC.Layouts.Setting.AccountBind.unbindSuccess'));
        load();
      },
    );
  };

  const handleBind = (provider: AuthIdpLoginItem) => {
    window.location.assign(
      buildIdentityBindUrl(getBusinessBase(), provider.id, buildReturnPath()),
    );
  };

  return (
    <div className={cx(styles.container)}>
      <h3>{dict('PC.Layouts.Setting.AccountBind.title')}</h3>
      <Spin spinning={loading}>
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
            !loading && (
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
