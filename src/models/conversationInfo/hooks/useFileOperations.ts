/**
 * 文件操作聚合 Hook
 * 聚合 useFileTree 和 useVncDesktop，管理文件预览、远程桌面等操作
 */

import { useFileTree } from './useFileTree';
import { useVncDesktop } from './useVncDesktop';

export const useFileOperations = () => {
  // 文件树
  const fileTreeState = useFileTree();
  const { openPreviewChangeState, ...fileTreeRest } = fileTreeState;

  // 远程桌面
  // useVncDesktop 可以在这里直接使用 openPreviewChangeState
  const vncDesktopState = useVncDesktop({
    openPreviewChangeState,
  });

  return {
    fileTreeState: {
      openPreviewChangeState,
      ...fileTreeRest,
    },
    vncDesktopState,
    // 扁平化导出常用方法，供 Core 层使用
    openDesktopView: vncDesktopState.openDesktopView,
    openPreviewView: fileTreeState.openPreviewView,
    handleRefreshFileList: fileTreeState.handleRefreshFileList,
    isFileTreeVisibleRef: fileTreeState.isFileTreeVisibleRef,
    viewModeRef: fileTreeState.viewModeRef,
    setTaskAgentSelectedFileId: fileTreeState.setTaskAgentSelectedFileId,
    setTaskAgentSelectTrigger: fileTreeState.setTaskAgentSelectTrigger,
  };
};
