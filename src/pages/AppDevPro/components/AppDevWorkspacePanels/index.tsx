import classNames from 'classnames';
import type React from 'react';
import styles from '../../index.less';
import {
  APP_DEV_WORKSPACE_DEFINITIONS,
  APP_DEV_WORKSPACE_ORDER,
  type AppDevWorkspaceView,
} from '../../workspaceDefinitions';

export interface AppDevWorkspacePanel {
  chrome: React.ReactNode;
  content: React.ReactNode;
}

/**
 * 页面提供各工作区的 chrome/content，容器统一选中、隐藏与顺序。
 * 文件/应用/数据库隐藏只切 class；桌面按静态定义仅在可见时挂载。
 */
export default function AppDevWorkspacePanels({
  workspaceView,
  active = true,
  panels,
  children,
}: {
  workspaceView: AppDevWorkspaceView;
  active?: boolean;
  panels: Record<AppDevWorkspaceView, AppDevWorkspacePanel>;
  children?: React.ReactNode;
}) {
  return (
    <>
      {panels[workspaceView].chrome}
      <div className={styles['right-panel-main']}>
        <div className={styles['right-panel-content']}>
          {APP_DEV_WORKSPACE_ORDER.map((view) => (
            <div
              key={view}
              className={classNames(
                APP_DEV_WORKSPACE_DEFINITIONS[view].paneClasses.map(
                  (name) => styles[name],
                ),
                { [styles['workspace-pane-hidden']]: workspaceView !== view },
              )}
            >
              {APP_DEV_WORKSPACE_DEFINITIONS[view].keepMounted ||
              (active && workspaceView === view)
                ? panels[view].content
                : null}
            </div>
          ))}
        </div>
        {children}
      </div>
    </>
  );
}
