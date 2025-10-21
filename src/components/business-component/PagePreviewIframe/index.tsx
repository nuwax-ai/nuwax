import SvgIcon from '@/components/base/SvgIcon';
import { SANDBOX } from '@/constants/common.constants';
import { apiAgentComponentPageResultUpdate } from '@/services/agentConfig';
import { copyTextToClipboard } from '@/utils';
import {
  CloseOutlined,
  CopyOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Button, Spin, Tooltip } from 'antd';
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
 * 页面预览数据接口
 */
interface PagePreviewData {
  /** 页面名称 */
  name?: string;
  /** 页面 URI */
  uri?: string;
  /** 页面参数 */
  params?: Record<string, string>;
  /** 请求方法 */
  method?: string;
  /** 数据类型 */
  data_type?: 'html' | 'markdown';
  /** 请求 ID */
  request_id?: string;
}

/**
 * PagePreviewIframe 组件的 Props 接口
 */
interface PagePreviewIframeProps {
  /** 页面预览数据 */
  pagePreviewData: PagePreviewData | null;
  /** 是否显示加载状态 */
  showLoading?: boolean;
  /** 是否显示标题栏 */
  showHeader?: boolean;
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 关闭按钮点击回调 */
  onClose?: () => void;
  /** 容器自定义样式 */
  style?: React.CSSProperties;
  /** 容器自定义类名 */
  className?: string;
  /** 标题文本自定义样式 */
  titleStyle?: React.CSSProperties;
  /** 标题文本自定义类名 */
  titleClassName?: string;
}

/**
 * 页面预览 iframe 组件
 * - 负责加载和显示页面内容
 * - 处理 iframe 加载事件
 * - 监听页面内容变化并上报
 * - 显示标题栏和关闭按钮
 */
const PagePreviewIframe: React.FC<PagePreviewIframeProps> = ({
  pagePreviewData,
  showLoading = true,
  showHeader = true,
  showCloseButton = true,
  onClose,
  style,
  className,
  titleStyle,
  titleClassName,
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    //
    setIframeKey(Date.now);
    return `${uri}?${queryString}`;
  }, [pagePreviewData]);

  // iframe 加载完成
  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, [pagePreviewData]);

  // iframe 加载失败
  const handleIframeError = useCallback(() => {
    setIsLoading(false);
  }, []);

  const { previewPageTitle, setPreviewPageTitle } = useModel('chat');

  // 处理页面内容变化和上报
  useEffect(() => {
    // 需要调用后端接口返回 iframe 内容的 html/markdown
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.src = pageUrl; // 重新加载同一个地址，会触发 onload

    iframe.onload = () => {
      const iframeDoc =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      const turndownService = new TurndownService();

      let timer: NodeJS.Timeout;

      // 监听 iframe 内部 DOM 变化
      const observer = new MutationObserver(() => {
        // 每次变化后延迟 500ms 再检测，确保渲染稳定
        clearTimeout(timer);
        timer = setTimeout(async () => {
          // 获取 head 中的 title 内容
          const title =
            iframeDoc.querySelector('head > title')?.textContent || '页面预览';
          setPreviewPageTitle(title);

          const html = iframeDoc.body.innerHTML;

          if (!pagePreviewData?.method) return;
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

          if (pagePreviewData?.method === 'browser_navigate_page') {
            const params = {
              requestId: pagePreviewData.request_id || '',
              html: str,
            };
            await apiAgentComponentPageResultUpdate(params);
          }
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
  }, [pagePreviewData, pageUrl]);

  // 重置加载状态
  useEffect(() => {
    setIsLoading(!pagePreviewData);
  }, [pagePreviewData]);

  // 如果没有预览数据，不显示
  if (!pagePreviewData) {
    return null;
  }

  function getFrameWindow() {
    return iframeRef.current?.contentWindow;
  }

  function reload() {
    const win = getFrameWindow();
    win?.location?.reload();
  }

  function goBack() {
    const win = getFrameWindow();
    win?.history?.back();
  }

  function goForward() {
    const win = getFrameWindow();
    win?.history?.forward();
  }

  function goCopy() {
    let url = pageUrl;
    // 如果不是 http(s) 开头，则加上 BASE_URL
    if (!/^https?:\/\//.test(pageUrl)) {
      url = `${window.location.protocol}//${window.location.host}${pageUrl}`;
    }
    copyTextToClipboard(url, () => {}, true);
  }

  return (
    <div
      className={cx(styles['page-preview-iframe-container'], className)}
      style={style}
    >
      {/* 标题栏 */}
      {showHeader && (
        <div className={cx(styles['page-preview-header'])}>
          <h3 className="text-ellipsis">
            <SvgIcon name="icons-page" className={cx(styles['page-icon'])} />
            <span className={titleClassName} style={titleStyle}>
              {previewPageTitle}
            </span>
          </h3>
          <div style={{ display: 'flex', gap: '10px', marginRight: '20px' }}>
            <Tooltip title="刷新">
              <Button onClick={reload} icon={<ReloadOutlined />} />
            </Tooltip>

            <Tooltip title="后退">
              <Button onClick={goBack} icon={<LeftOutlined />} />
            </Tooltip>

            <Tooltip title="前进">
              <Button onClick={goForward} icon={<RightOutlined />} />
            </Tooltip>

            <Tooltip title="复制">
              <Button onClick={goCopy} icon={<CopyOutlined />} />
            </Tooltip>
          </div>
          {showCloseButton && (
            <CloseOutlined
              className={cx(styles['close-btn'], 'cursor-pointer')}
              onClick={onClose}
            />
          )}
        </div>
      )}

      {/* iframe 预览区域 */}
      <div className={cx(styles['page-preview-body'])}>
        {showLoading && isLoading && (
          <div className={cx(styles['loading-wrapper'])}>
            <Spin size="large" tip="页面加载中..." />
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={iframeKey}
          src={pageUrl}
          sandbox={SANDBOX}
          className={cx(styles['page-iframe'])}
          title={pagePreviewData.name || '页面预览'}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          style={{
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 1.5s ease-in-out',
          }}
        />
      </div>
    </div>
  );
};

export default PagePreviewIframe;
