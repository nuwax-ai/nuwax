import { resolveRepoDocEmbedUrl } from '@/pages/Chat/utils/repoDocLink';
import { useEffect, type RefObject } from 'react';

interface UseRepoDocLinkPreviewOptions {
  /** 当前会话实例是否在前台；后台缓存实例不拦截点击。 */
  active: boolean;
  /** 会话消息滚动容器。只有点在这里面的资料库链接才改为页内预览。 */
  containerRef: RefObject<HTMLElement | null>;
  /** 打开预览。参数是资料库文档的绝对地址。 */
  onOpen: (url: string) => void;
}

/**
 * 拦截会话消息里的资料库链接点击，改为当前页预览，而不是新开浏览器页签。
 *
 * 聊天页会给 document 加 `<base target="_blank">`，普通链接点击都会新开页签。
 * 这里在捕获阶段拦住路径包含 `/repo/doc/` 的左键点击。
 * 按住 Ctrl / Command / Shift / Alt 的点击仍交给浏览器，方便用户手动新开页签。
 */
export const useRepoDocLinkPreview = ({
  active,
  containerRef,
  onOpen,
}: UseRepoDocLinkPreviewOptions) => {
  useEffect(() => {
    if (!active) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const container = containerRef.current;
      const eventTarget = event.target;
      const element =
        eventTarget instanceof Element
          ? eventTarget
          : eventTarget instanceof Node
          ? eventTarget.parentElement
          : null;
      if (!container || !element || !container.contains(element)) {
        return;
      }

      const anchor = element.closest('a');
      if (!anchor || !container.contains(anchor)) {
        return;
      }

      const embedUrl = resolveRepoDocEmbedUrl(anchor.href);
      if (!embedUrl) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onOpen(embedUrl);
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [active, containerRef, onOpen]);
};
