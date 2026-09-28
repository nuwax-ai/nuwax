interface PreviewDocumentObserverOptions {
  visible: boolean;
  onTitle: () => void;
  /** 仅 browser_navigate_page 的业务内容上报需要观察正文。 */
  onContent?: () => void | Promise<void>;
}

const PREVIEW_UPDATE_DELAY_MS = 500;

/** 观察当前 iframe 文档；标题是 UI 工作，正文上报独立于可见性。 */
export function observePreviewDocument(
  doc: Document,
  options: PreviewDocumentObserverOptions,
) {
  let disposed = false;
  let visible = false;
  let titleTimer: ReturnType<typeof setTimeout> | undefined;
  let contentTimer: ReturnType<typeof setTimeout> | undefined;
  let titleObserver: MutationObserver | undefined;

  const scheduleTitle = () => {
    if (disposed || !visible) return;
    clearTimeout(titleTimer);
    titleTimer = setTimeout(() => {
      titleTimer = undefined;
      if (!disposed && visible) options.onTitle();
    }, PREVIEW_UPDATE_DELAY_MS);
  };

  const scheduleContent = () => {
    if (disposed) return;
    clearTimeout(contentTimer);
    contentTimer = setTimeout(() => {
      contentTimer = undefined;
      if (!disposed) void options.onContent?.();
    }, PREVIEW_UPDATE_DELAY_MS);
    scheduleTitle();
  };

  let contentObserver: MutationObserver | undefined;
  if (options.onContent && doc.body) {
    contentObserver = new MutationObserver(scheduleContent);
    contentObserver.observe(doc.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    scheduleContent();
  }

  const setVisible = (next: boolean) => {
    if (disposed || next === visible) return;
    visible = next;
    titleObserver?.disconnect();
    titleObserver = undefined;
    clearTimeout(titleTimer);
    titleTimer = undefined;
    if (!visible) return;
    // 标题替换、标题文本变化以及 head 整体替换均需继续更新标题栏。
    const observeTitle = () => {
      titleObserver?.disconnect();
      if (doc.documentElement) {
        titleObserver?.observe(doc.documentElement, { childList: true });
      }
      if (doc.head) {
        titleObserver?.observe(doc.head, {
          childList: true,
          subtree: true,
          characterData: true,
        });
      }
    };
    titleObserver = new MutationObserver(() => {
      observeTitle();
      scheduleTitle();
    });
    observeTitle();
    scheduleTitle();
  };

  setVisible(options.visible);
  return {
    setVisible,
    disconnect() {
      disposed = true;
      contentObserver?.disconnect();
      titleObserver?.disconnect();
      clearTimeout(contentTimer);
      clearTimeout(titleTimer);
    },
  };
}
