import { dict } from '@/services/i18nRuntime';
import type { LicenseControllerState } from '@/types/interfaces/license';
import { canExecuteLicenseFeature } from '@/utils/license';
import { Alert, Space, Spin } from 'antd';
import type { ReactNode } from 'react';

/** 已注册功能才使用此 gate；角色/资源权限仍由原业务页检查。 */
export default function LicenseFeatureGate({
  state,
  code,
  children,
}: {
  state: LicenseControllerState;
  code: string;
  children: ReactNode;
}) {
  if (canExecuteLicenseFeature(state, code)) return <>{children}</>;
  if (state.status === 'idle' || state.status === 'loading')
    return (
      <Space role="status">
        <Spin />
        <span>{dict('PC.Pages.License.loading')}</span>
      </Space>
    );
  return (
    <Alert
      showIcon
      type="warning"
      message={dict(
        state.error
          ? `PC.Pages.License.error.${state.error.kind}`
          : 'PC.Pages.License.featureUnavailable',
      )}
      description={dict('PC.Pages.License.contactAdministrator')}
    />
  );
}
