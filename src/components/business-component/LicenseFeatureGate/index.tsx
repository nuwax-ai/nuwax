import { dict } from '@/services/i18nRuntime';
import type {
  LicenseControllerState,
  LicenseErrorKind,
} from '@/types/interfaces/license';
import { canExecuteLicenseFeature } from '@/utils/license';
import { Alert, Space, Spin } from 'antd';
import type { ReactNode } from 'react';

// 错误类别包含连字符，翻译键末段使用 camelCase，与 License 管理页一致。
const errorKeys: Record<LicenseErrorKind, string> = {
  unavailable: 'unavailable',
  unauthenticated: 'unauthenticated',
  forbidden: 'forbidden',
  network: 'network',
  'invalid-response': 'invalidResponse',
};

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
          ? `PC.Pages.License.error.${errorKeys[state.error.kind]}`
          : 'PC.Pages.License.featureUnavailable',
      )}
      description={dict('PC.Pages.License.contactAdministrator')}
    />
  );
}
