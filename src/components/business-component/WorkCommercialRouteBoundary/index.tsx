import useWorkCommercialRoute from '@/hooks/useWorkCommercialRoute';
import { dict } from '@/services/i18nRuntime';
import { Spin } from 'antd';
import type { PropsWithChildren } from 'react';

/** 内容挂载前拦截；侧栏保留，路由跳转与菜单点击采用同一展示。 */
export default function WorkCommercialRouteBoundary({
  children,
}: PropsWithChildren) {
  const { blocked, pending } = useWorkCommercialRoute();
  if (!blocked) return <>{children}</>;
  return (
    <div
      role={pending ? 'status' : 'alert'}
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '100%',
        padding: 24,
      }}
    >
      {pending ? (
        <Spin />
      ) : (
        dict('PC.Components.CommercialLicense.authorizationRequired')
      )}
    </div>
  );
}
