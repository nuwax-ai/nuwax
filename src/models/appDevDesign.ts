import { ElementInfo } from '@/pages/AppDev/components/DesignViewer/messages';
import { useState } from 'react';

export default () => {
  // 是否开启design模式
  const [iframeDesignMode, setIframeDesignMode] = useState<boolean>(false);
  // iframe是否加载完毕
  const [isIframeLoaded, setIsIframeLoaded] = useState<boolean>(false);
  /** 选中的元素, 用于标识当前选中的元素, 包含className, sourceInfo, tagName, textContent等信息*/
  const [selectedElement, setSelectedElement] = useState<ElementInfo | null>(
    null,
  );
  // 待处理的变更
  const [pendingChanges, setPendingChanges] = useState<
    Array<{
      type: 'style' | 'content';
      sourceInfo: any;
      newValue: string;
      originalValue?: string;
    }>
  >([]);

  return {
    iframeDesignMode,
    setIframeDesignMode,
    isIframeLoaded,
    setIsIframeLoaded,
    selectedElement,
    setSelectedElement,
    pendingChanges,
    setPendingChanges,
  };
};
