import { usePageModel } from '@/modelScopes/usePageModel';
import type { PagePreviewData } from '@/models/chat';
import React, { useCallback, useState } from 'react';

/**
 * 页面预览控制器:统一「全局单槽」与「实例自持」两种来源的读写面。
 * @description chat model 的 pagePreviewData 是全局唯一预览槽(消息内打开
 * 页面、会话页预览等大量消费方共用,不可实例化)。但 ConversationDetails
 * 纳入多开保活后会有多个实例并存:后挂载实例一旦写全局槽,先挂载实例受控
 * 的 PagePreviewIframe 会收到新 uri 而 iframe.src 重赋——预览整页重载成
 * 别人的页面。instanceScoped 模式下本 hook 改用组件局部 state,实例间互
 * 不串扰;默认模式取值来源与直接 useModel('chat') 完全一致。
 * 注意:无条件调用 useModel(禁条件 hook),在取值层三元选取——两端 setter
 * (useCallback / useState setter)引用均恒稳,下游 effect deps 不会抖。
 */
export interface PagePreviewController {
  pagePreviewData: PagePreviewData | null;
  showPagePreview: (data: PagePreviewData | null) => void;
  hidePagePreview: () => void;
}

export const usePagePreviewController = (
  instanceScoped: boolean,
): PagePreviewController => {
  const {
    pagePreviewData: globalData,
    showPagePreview: globalShow,
    hidePagePreview: globalHide,
  } = usePageModel('chat');
  const [localData, setLocalData] = useState<PagePreviewData | null>(null);
  const showLocal = useCallback((data: PagePreviewData | null) => {
    setLocalData(data);
  }, []);
  const hideLocal = useCallback(() => {
    setLocalData(null);
  }, []);
  const controller = React.useMemo<PagePreviewController>(
    () =>
      instanceScoped
        ? {
            pagePreviewData: localData,
            showPagePreview: showLocal,
            hidePagePreview: hideLocal,
          }
        : {
            pagePreviewData: globalData,
            showPagePreview: globalShow,
            hidePagePreview: globalHide,
          },
    [
      instanceScoped,
      localData,
      showLocal,
      hideLocal,
      globalData,
      globalShow,
      globalHide,
    ],
  );
  return controller;
};

export default usePagePreviewController;
