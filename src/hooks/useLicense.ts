import { licenseProvider } from '@/services/license';
import { createLicenseController } from '@/services/licenseController';
import type { LicenseProvider } from '@/types/interfaces/license';
import { useEffect, useMemo, useSyncExternalStore } from 'react';

export default function useLicense({
  accountKey,
  enabled = true,
  provider = licenseProvider,
}: {
  accountKey: string;
  enabled?: boolean;
  provider?: LicenseProvider;
}) {
  const controller = useMemo(
    () => createLicenseController(provider),
    [provider, accountKey],
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getState,
    controller.getState,
  );
  useEffect(() => {
    if (enabled) void controller.reload();
    else controller.reset();
    // StrictMode 会 cleanup 后复用同一 controller；reset 撤销请求而非永久 dispose。
    return () => controller.reset();
  }, [controller, enabled]);
  return { state, controller };
}
