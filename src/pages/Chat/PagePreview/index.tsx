import SvgIcon from '@/components/base/SvgIcon';
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
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 页面预览组件
 * - 显示在聊天区域右侧
 * - 支持拖拽调整宽度
 * - 使用 iframe 加载页面
 */
const PagePreview: React.FC = () => {
  const { pagePreviewData, hidePagePreview } = useModel('chat');

  // 预览区域宽度（百分比）
  const [width, setWidth] = useState<number>(50); // 初始宽度 50%
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(50);

  // 构建页面 URL（拼接 query 参数）
  const pageUrl = useMemo(() => {
    if (!pagePreviewData) return '';

    const { uri, params } = pagePreviewData;
    if (!uri) return '';

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

  // iframe 加载完成
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

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
    if (pagePreviewData) {
      setIsLoading(true);
    }
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
        style={{ width: `${width}%` }}
      >
        {/* 拖拽分隔条 */}
        <div
          className={cx(styles['resize-handle'])}
          onMouseDown={handleMouseDown}
        >
          <div className={cx(styles['resize-handle-bar'])} />
        </div>

        {/* 预览内容区域 */}
        <div className={cx(styles['page-preview-content'])}>
          {/* 标题栏 */}
          <div className={cx(styles['page-preview-header'])}>
            <h3>
              <SvgIcon name="icons-page" className={cx(styles['page-icon'])} />
              <span>{pagePreviewData.name || '页面预览'}</span>
            </h3>
            <CloseOutlined
              className={cx(styles['close-btn'], 'cursor-pointer')}
              onClick={handleClose}
            />
          </div>

          {/* iframe 预览区域 */}
          <div className={cx(styles['page-preview-body'])}>
            {isLoading && (
              <div className={cx(styles['loading-wrapper'])}>
                <Spin size="large" tip="页面加载中..." />
              </div>
            )}
            <iframe
              src={pageUrl}
              className={cx(styles['page-iframe'])}
              title={pagePreviewData.name || '页面预览'}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              style={{ opacity: isLoading ? 0 : 1 }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PagePreview;
