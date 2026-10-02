import { useCallback, useRef, useState } from 'react';
import { getToolTabId } from '../ConversationAgentFilePreview/hooks/usePreviewTabs';
import {
  APP_DEV_WORKSPACE_DEFINITIONS,
  type AppDevWorkspaceView,
} from '../workspaceDefinitions';

/**
 * 只管理工作区的本地选择与往返，不接管预览页签、容器或网络生命周期。
 * 独立面板的返回规则来自静态定义，后续面板无需再创建一组恢复 ref。
 */
export function useAppDevWorkspace() {
  const [workspaceView, setWorkspaceView] =
    useState<AppDevWorkspaceView>('app-preview');
  const workspaceViewRef = useRef(workspaceView);
  workspaceViewRef.current = workspaceView;
  const previousViewsRef = useRef<
    Partial<Record<AppDevWorkspaceView, AppDevWorkspaceView>>
  >({});
  const [databaseTabId, setDatabaseTabId] = useState(() =>
    getToolTabId('database'),
  );

  /** 强制进入；数据库重置到管理页，与从 Header 或环境切换进入的旧行为一致。 */
  const openWorkspace = useCallback(
    (view: AppDevWorkspaceView) => {
      previousViewsRef.current[view] = workspaceView;
      if (view === 'database') setDatabaseTabId(getToolTabId('database'));
      setWorkspaceView(view);
    },
    [workspaceView],
  );

  /** 返回 true 表示新进入，false 表示收起并返回之前的工作区。 */
  const toggleWorkspace = useCallback(
    (view: AppDevWorkspaceView) => {
      const fallback = APP_DEV_WORKSPACE_DEFINITIONS[view].returnView;
      if (fallback && workspaceView === view) {
        const previous = previousViewsRef.current[view];
        setWorkspaceView(previous && previous !== view ? previous : fallback);
        return false;
      }
      openWorkspace(view);
      return true;
    },
    [openWorkspace, workspaceView],
  );

  return {
    workspaceView,
    setWorkspaceView,
    workspaceViewRef,
    databaseTabId,
    setDatabaseTabId,
    openWorkspace,
    toggleWorkspace,
  };
}
