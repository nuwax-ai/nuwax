import SvgIcon from '@/components/base/SvgIcon';
import { apiAgentComponentPageResultUpdate } from '@/services/agentConfig';
import { CloseOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import TurndownService from 'turndown';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * PagePreview 组件的 Props 接口
 */
interface PagePreviewProps {
  /** 初始宽度（百分比），默认为 66 */
  initialWidth?: number;
  /** 是否显示拖拽分隔条，默认为 true */
  showResizeHandle?: boolean;
  /** 是否显示关闭按钮，默认为 true */
  showCloseButton?: boolean;
}

/**
 * 页面预览组件
 * - 显示在聊天区域右侧
 * - 支持拖拽调整宽度
 * - 使用 iframe 加载页面
 */
const PagePreview: React.FC<PagePreviewProps> = ({
  initialWidth = 66,
  showResizeHandle = true,
  showCloseButton = true,
}) => {
  const chatModel = useModel('chat');
  const { pagePreviewData, hidePagePreview } = chatModel;

  // 预览区域宽度（百分比）
  const [width, setWidth] = useState<number>(initialWidth);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(initialWidth);

  // 构建页面 URL（拼接 query 参数）
  const pageUrl = useMemo(() => {
    if (!pagePreviewData) return '';

    let { uri, params } = pagePreviewData;
    if (!uri) return '';

    // 如果不是 http(s) 开头，则加上 BASE_URL
    if (!/^https?:\/\//.test(uri)) {
      uri = `${process.env.BASE_URL}${uri}`;
    }

    // 如果没有参数，直接返回 uri
    if (!params || Object.keys(params).length === 0) {
      return uri;
    }

    // 拼接 query 参数
    const queryString = new URLSearchParams(params).toString();
    return `${uri}?${queryString}`;
  }, [pagePreviewData]);

  // 处理鼠标按下事件（开始拖拽）
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [width],
  );

  // 处理鼠标移动事件（拖拽中）
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = startXRef.current - e.clientX;
      const windowWidth = window.innerWidth;
      const deltaPercent = (deltaX / windowWidth) * 100;

      // 计算新宽度（百分比）
      let newWidth = startWidthRef.current + deltaPercent;

      // 限制宽度范围：最小 400px（转换为百分比），最大 80%
      const minWidthPercent = (400 / windowWidth) * 100;
      const maxWidthPercent = 80;

      newWidth = Math.max(minWidthPercent, Math.min(maxWidthPercent, newWidth));

      setWidth(newWidth);
    },
    [isDragging],
  );

  // 处理鼠标松开事件（结束拖拽）
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 监听拖拽事件
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // 防止选中文本
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // iframe 加载完成
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, [pagePreviewData]);

  useEffect(() => {
    if (!pagePreviewData?.method) return;
    console.log('pagePreviewData', pagePreviewData);
    console.log('pagePreviewData.method', pagePreviewData?.method);

    // 需要调用后端接口返回 iframe 内容的 html/markdown
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.src = pageUrl; // 重新加载同一个地址，会触发 onload

    iframe.onload = () => {
      if (pagePreviewData?.method !== 'browser_navigate_page') {
        return;
      }
      console.log('iframe onload');

      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) return;

      const turndownService = new TurndownService();

      let timer: NodeJS.Timeout;

      // 监听 iframe 内部 DOM 变化
      const observer = new MutationObserver(() => {
        // 每次变化后延迟 500ms 再检测，确保渲染稳定
        clearTimeout(timer);
        timer = setTimeout(async () => {
          const html = iframeDoc.body.innerHTML;
          // 获取 iframe 内容
          let str = '';
          // 如果是 html
          if (pagePreviewData.data_type === 'html') {
            str = html;
          }
          // 如果是 markdown
          if (pagePreviewData.data_type === 'markdown') {
            str = turndownService.turndown(html);
          }
          if (!str) {
            return;
          }

          const params = {
            requestId: pagePreviewData.request_id,
            html: str,
          };
          console.log('调用接口：apiAgentComponentPageResultUpdate');
          await apiAgentComponentPageResultUpdate(params);
        }, 500);
      });

      observer.observe(iframeDoc.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      // 清理
      return () => {
        observer.disconnect();
        clearTimeout(timer);
      };
    };
  }, [pagePreviewData]);

  // iframe 加载失败
  const handleIframeError = useCallback(() => {
    setIsLoading(false);
  }, []);

  // 关闭预览
  const handleClose = useCallback(() => {
    hidePagePreview();
    setIsLoading(true);
  }, [hidePagePreview]);

  // 重置加载状态
  useEffect(() => {
    setIsLoading(!pagePreviewData);
  }, [pagePreviewData]);

  // 如果没有预览数据，不显示
  if (!pagePreviewData) {
    return null;
  }

  return (
    <>
      {/* 拖拽时的遮罩层 */}
      {isDragging && <div className={cx(styles['drag-overlay'])} />}

      <div
        ref={containerRef}
        className={cx(styles['page-preview-container'])}
        style={{ width: `${width}%`, minWidth: 680 }}
      >
        {/* 拖拽分隔条 */}
        {showResizeHandle && (
          <div
            className={cx(styles['resize-handle'])}
            onMouseDown={handleMouseDown}
          >
            <div className={cx(styles['resize-handle-bar'])} />
          </div>
        )}

        {/* 预览内容区域 */}
        <div className={cx(styles['page-preview-content'])}>
          {/* 标题栏 */}
          <div className={cx(styles['page-preview-header'])}>
            <h3>
              <SvgIcon name="icons-page" className={cx(styles['page-icon'])} />
              <span>{pagePreviewData.name || '页面预览'}</span>
            </h3>
            {showCloseButton && (
              <CloseOutlined
                className={cx(styles['close-btn'], 'cursor-pointer')}
                onClick={handleClose}
              />
            )}
          </div>

          {/* iframe 预览区域 */}
          <div className={cx(styles['page-preview-body'])}>
            {isLoading && (
              <div className={cx(styles['loading-wrapper'])}>
                <Spin size="large" tip="页面加载中..." />
              </div>
            )}
            {pagePreviewData && (
              <iframe
                ref={iframeRef}
                src={pageUrl}
                className={cx(styles['page-iframe'])}
                title={pagePreviewData.name || '页面预览'}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                style={{
                  opacity: isLoading ? 0 : 1,
                  transition: 'opacity 1.5s ease-in-out',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PagePreview;
