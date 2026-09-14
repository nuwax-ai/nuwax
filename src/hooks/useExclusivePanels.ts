import { EditAgentShowType } from '@/types/enums/space';
import { useEffect, useRef } from 'react';

/**
 * 互斥面板控制器 Hook
 * 用于管理 PagePreview、ShowArea 两个组件的互斥展示逻辑
 * （AgentSidebar 已改为悬浮弹窗，不再参与互斥）
 *
 * 互斥规则：
 * 1. 当打开 PagePreview 时，自动关闭 ShowArea
 */

interface UseExclusivePanelsProps {
  // PagePreview 状态
  pagePreviewData: any;
  hidePagePreview: () => void;

  // ShowArea 状态
  showType: EditAgentShowType;
  setShowType: (type: EditAgentShowType) => void;
}

export const useExclusivePanels = ({
  pagePreviewData,
  hidePagePreview,
  showType,
  setShowType,
}: UseExclusivePanelsProps) => {
  // 使用 ref 追踪上一次的状态，避免循环触发
  const prevPagePreviewRef = useRef(pagePreviewData);
  const prevShowTypeRef = useRef(showType);

  useEffect(() => {
    // 检测 PagePreview 是否刚打开（从无到有）
    const pagePreviewJustOpened =
      !prevPagePreviewRef.current && pagePreviewData;

    // 检测 ShowArea 是否刚打开（从 Hide 到 Show_Stand）
    const showAreaJustOpened =
      prevShowTypeRef.current !== EditAgentShowType.Show_Stand &&
      showType === EditAgentShowType.Show_Stand;

    // 规则 1：当 PagePreview 刚打开时，关闭 ShowArea
    if (pagePreviewJustOpened) {
      // 关闭 ShowArea
      if (showType !== EditAgentShowType.Hide) {
        setShowType(EditAgentShowType.Hide);
      }
    }

    // 规则 2：当 ShowArea 刚打开时，关闭 PagePreview
    if (showAreaJustOpened && pagePreviewData) {
      // console.log('[ExclusivePanels] ShowArea opened; closing PagePreview');
      // hidePagePreview();
    }

    // 更新 ref
    prevPagePreviewRef.current = pagePreviewData;
    prevShowTypeRef.current = showType;
  }, [pagePreviewData, showType, hidePagePreview, setShowType]);

  // 返回当前激活的面板类型（用于调试或状态展示）
  const getActivePanelType = () => {
    if (pagePreviewData) return 'PagePreview';
    if (showType === EditAgentShowType.Show_Stand) return 'ShowArea';
    return 'None';
  };

  return {
    activePanelType: getActivePanelType(),
  };
};

export default useExclusivePanels;
