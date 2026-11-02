import { unifiedThemeService } from '@/services/unifiedThemeService';
import { setActiveThemeSnapshot } from './activeTheme';
import './base.less';
import { createThemeApplicator } from './dom';
import { migrateLegacyTheme } from './migration';
import { themeRuntime } from './runtime';

let initialization: Promise<void> | undefined;
/** 应用生命周期安装一次；路由和认证变化不重新创建主题或业务根。 */
export function initializeApplicationThemes(): Promise<void> {
  if (initialization) return initialization;
  const applicator = createThemeApplicator(document.documentElement, 'web');
  const apply = () => {
    const { snapshot } = themeRuntime.getState();
    if (!applicator.apply(snapshot)) return;
    setActiveThemeSnapshot(snapshot);
    void unifiedThemeService
      .updateData(null, { saveToStorage: false })
      .catch((error) => {
        console.error('[themes] Preference synchronization failed', error);
      });
    window.dispatchEvent(
      new CustomEvent('nuwax-theme-changed', { detail: snapshot }),
    );
  };
  apply();
  themeRuntime.subscribe(apply);
  initialization = themeRuntime
    .initialize()
    .then(async () => {
      apply();
      await migrateLegacyTheme();
    })
    .catch((error) => {
      console.error('[themes] Initialization failed', error);
      apply();
    });
  return initialization;
}
