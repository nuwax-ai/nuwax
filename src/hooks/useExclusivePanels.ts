import { EditAgentShowType } from '@/types/enums/space';
import { useEffect, useRef } from 'react';

/**
 * 互斥面板控制器 Hook
 * 用于管理 PagePreview、AgentSidebar、ShowArea 三个组件的互斥展示逻辑
 *
 * 互斥规则：
 * 1. 当打开 PagePreview 时，自动关闭 AgentSidebar 和 ShowArea
 * 2. 当打开 AgentSidebar 时，自动关闭 PagePreview
 * 3. 当打开 ShowArea 时，自动关闭 PagePreview
 */

interface UseExclusivePanelsProps {
  // PagePreview 状态
  pagePreviewData: any;
  hidePagePreview: () => void;

  // AgentSidebar 状态
  isSidebarVisible: boolean;
  sidebarRef: React.RefObject<{ close: () => void }>;

  // ShowArea 状态
  showType: EditAgentShowType;
  setShowType: (type: EditAgentShowType) => void;
}

export const useExclusivePanels = ({
  pagePreviewData,
  hidePagePreview,
  isSidebarVisible,
  sidebarRef,
  showType,
  setShowType,
}: UseExclusivePanelsProps) => {
  // 使用 ref 追踪上一次的状态，避免循环触发
  const prevPagePreviewRef = useRef(pagePreviewData);
  const prevSidebarVisibleRef = useRef(isSidebarVisible);
  const prevShowTypeRef = useRef(showType);

  useEffect(() => {
    // 检测 PagePreview 是否刚打开（从无到有）
    const pagePreviewJustOpened =
      !prevPagePreviewRef.current && pagePreviewData;

    // 检测 AgentSidebar 是否刚打开（从 false 到 true）
    const sidebarJustOpened =
      !prevSidebarVisibleRef.current && isSidebarVisible;

    // 检测 ShowArea 是否刚打开（从 Hide 到 Show_Stand）
    const showAreaJustOpened =
      prevShowTypeRef.current !== EditAgentShowType.Show_Stand &&
      showType === EditAgentShowType.Show_Stand;

    // 规则 1：当 PagePreview 刚打开时，关闭其他面板
    if (pagePreviewJustOpened) {
      console.log('[ExclusivePanels] PagePreview 打开，关闭其他面板');

      // 关闭 AgentSidebar
      if (isSidebarVisible) {
        sidebarRef.current?.close();
      }

      // 关闭 ShowArea
      if (showType !== EditAgentShowType.Hide) {
        setShowType(EditAgentShowType.Hide);
      }
    }

    // 规则 2：当 AgentSidebar 刚打开时，关闭 PagePreview
    if (sidebarJustOpened && pagePreviewData) {
      console.log('[ExclusivePanels] AgentSidebar 打开，关闭 PagePreview');
      hidePagePreview();
    }

    // 规则 3：当 ShowArea 刚打开时，关闭 PagePreview
    if (showAreaJustOpened && pagePreviewData) {
      console.log('[ExclusivePanels] ShowArea 打开，关闭 PagePreview');
      hidePagePreview();
    }

    // 更新 ref
    prevPagePreviewRef.current = pagePreviewData;
    prevSidebarVisibleRef.current = isSidebarVisible;
    prevShowTypeRef.current = showType;
  }, [
    pagePreviewData,
    isSidebarVisible,
    showType,
    hidePagePreview,
    sidebarRef,
    setShowType,
  ]);

  // 返回当前激活的面板类型（用于调试或状态展示）
  const getActivePanelType = () => {
    if (pagePreviewData) return 'PagePreview';
    if (isSidebarVisible) return 'AgentSidebar';
    if (showType === EditAgentShowType.Show_Stand) return 'ShowArea';
    return 'None';
  };

  return {
    activePanelType: getActivePanelType(),
  };
};

export default useExclusivePanels;
