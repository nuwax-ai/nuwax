import { dict } from '@/services/i18nRuntime';
import { apiOAuth2ScopeList } from '@/services/oauth2Scope';
import {
  OAuth2ScopeApplyStatusEnum,
  type OAuth2ScopeInfo,
} from '@/types/interfaces/oauth2Scope';
import { DEFAULT_OAUTH2_SCOPE } from '@/utils/oauth2Scope';
import { Alert, Checkbox, Spin, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface OAuthScopeSettingProps {
  /** 当前勾选（受控；由页面随「保存」一并提交） */
  value: string[];
  onChange: (scopes: string[]) => void;
  /** 最近一条申请的审核状态 */
  applyStatus?: OAuth2ScopeApplyStatusEnum | null;
  rejectReason?: string;
  disabled?: boolean;
}

/**
 * OAuth2 授权范围（scope）勾选：三方应用、全栈应用详情共用。
 * 变更提交后需管理员审核，通过前仍按原范围生效。
 */
const OAuthScopeSetting: React.FC<OAuthScopeSettingProps> = ({
  value,
  onChange,
  applyStatus,
  rejectReason,
  disabled,
}) => {
  const [scopes, setScopes] = useState<OAuth2ScopeInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiOAuth2ScopeList()
      .then((res) => setScopes(res.data ?? []))
      .catch(() => setScopes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles.header)}>
        <span className={cx(styles.label)}>
          {dict('PC.Components.OAuthScopeSetting.title')}
        </span>
        {applyStatus === OAuth2ScopeApplyStatusEnum.Pending && (
          <Tag color="processing">
            {dict('PC.Components.OAuthScopeSetting.pending')}
          </Tag>
        )}
      </div>
      <div className={cx(styles.desc)}>
        {dict('PC.Components.OAuthScopeSetting.desc')}
      </div>
      {applyStatus === OAuth2ScopeApplyStatusEnum.Rejected && (
        <Alert
          type="warning"
          showIcon
          className={cx(styles.alert)}
          message={dict('PC.Components.OAuthScopeSetting.rejected')}
          description={rejectReason || undefined}
        />
      )}
      <Spin spinning={loading}>
        <Checkbox.Group
          className={cx(styles.list)}
          value={value}
          disabled={disabled}
          onChange={(checked) => onChange(checked as string[])}
        >
          {scopes.map((item) => (
            <Checkbox
              key={item.scope}
              value={item.scope}
              // profile 为平台默认能力，始终保留
              disabled={item.scope === DEFAULT_OAUTH2_SCOPE}
              className={cx(styles.item)}
            >
              <span className={cx(styles.scope)}>{item.scope}</span>
              {item.sensitive && (
                <Tooltip
                  title={dict('PC.Components.OAuthScopeSetting.sensitiveTip')}
                >
                  <Tag color="warning" className={cx(styles.sensitive)}>
                    {dict('PC.Components.OAuthScopeSetting.sensitive')}
                  </Tag>
                </Tooltip>
              )}
              <span className={cx(styles.description)}>{item.description}</span>
            </Checkbox>
          ))}
        </Checkbox.Group>
      </Spin>
    </div>
  );
};

export default OAuthScopeSetting;
