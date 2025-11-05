import SvgIcon from '@/components/base/SvgIcon';
import { SANDBOX } from '@/constants/common.constants';
import { apiAgentComponentPageResultUpdate } from '@/services/agentConfig';
import { copyTextToClipboard } from '@/utils';
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
  method?: 'browser_navigate_page' | 'browser_open_page';
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
  /** 是否显示复制按钮 */
  showCopyButton?: boolean;
  /** 是否允许复制（用于条件渲染） */
  allowCopy?: boolean;
  /** 复制按钮点击回调 */
  onCopyClick?: () => void;
  /** 复制按钮文本 */
  copyButtonText?: string;
  /** 复制按钮自定义类名 */
  copyButtonClassName?: string;
}

/**
 * 页面预览 iframe 组件
 * - 负责加载和显示页面内容
 * - 处理 iframe 加载事件
 * - 监听页面内容变化并上报
 * - 显示标题栏和关闭按钮
 * - 支持显示复制按钮（不包含业务逻辑，仅处理显示和点击事件）
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
  showCopyButton = false,
  allowCopy = false,
  onCopyClick,
  copyButtonText = '复制模板',
  copyButtonClassName,
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 历史记录状态管理
  const navigableHistoryRef = useRef<
    Array<{
      url: string;
      pathname: string;
      timestamp: number;
    }>
  >([]);
  const currentIndexRef = useRef<number>(0);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);

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
  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  // iframe 加载失败
  const handleIframeError = () => {
    setIsLoading(false);
  };

  const { previewPageTitle, setPreviewPageTitle } = useModel('chat');

  /**
   * 更新按钮状态
   * 根据当前索引和历史记录长度计算是否可以后退/前进
   */
  const updateButtonStates = useCallback(() => {
    const canBack = currentIndexRef.current > 0;
    const canForward =
      currentIndexRef.current < navigableHistoryRef.current.length - 1;
    setCanGoBack(canBack);
    setCanGoForward(canForward);
  }, []);

  /**
   * 处理来自 dev-monitor 的历史变化消息
   * 参考 AppDev/components/Preview/index.tsx 中的实现
   */
  const handleDevMonitorHistoryChange = useCallback(
    (changeData: {
      historyType: string;
      url: string;
      pathname: string;
      timestamp: number;
      direction?: 'back' | 'forward' | 'unknown'; // ⭐ 方向信息（仅 popstate 时存在）
    }) => {
      // 记录初始 URL
      if (changeData.historyType === 'initial') {
        navigableHistoryRef.current = [
          {
            url: changeData.url,
            pathname: changeData.pathname,
            timestamp: changeData.timestamp,
          },
        ];
        currentIndexRef.current = 0;
        updateButtonStates();
        return;
      }

      // 根据历史变化类型更新历史记录栈和当前索引
      if (
        changeData.historyType === 'pushState' ||
        changeData.historyType === 'hashchange'
      ) {
        // pushState 和 hashchange 会增加历史记录
        // 追加到可导航历史，并移动当前指针
        navigableHistoryRef.current.push({
          url: changeData.url,
          pathname: changeData.pathname,
          timestamp: changeData.timestamp,
        });
        currentIndexRef.current = navigableHistoryRef.current.length - 1;

        // 限制历史记录数量，只保留最近50条
        if (navigableHistoryRef.current.length > 50) {
          navigableHistoryRef.current.shift();
          currentIndexRef.current = Math.max(0, currentIndexRef.current - 1);
        }
      } else if (changeData.historyType === 'replaceState') {
        // replaceState 替换当前位置，不改变索引
        if (navigableHistoryRef.current.length === 0) {
          navigableHistoryRef.current = [
            {
              url: changeData.url,
              pathname: changeData.pathname,
              timestamp: changeData.timestamp,
            },
          ];
          currentIndexRef.current = 0;
        } else {
          navigableHistoryRef.current[currentIndexRef.current] = {
            url: changeData.url,
            pathname: changeData.pathname,
            timestamp: changeData.timestamp,
          };
        }
      } else if (changeData.historyType === 'popstate') {
        // popstate：浏览器前进/后退 → 依据可导航历史计算方向
        const list = navigableHistoryRef.current;
        if (list.length > 0) {
          // 找到目标 URL 在可导航历史中的最近一次出现
          let targetIndex = -1;
          for (let i = list.length - 1; i >= 0; i--) {
            if (list[i].url === changeData.url) {
              targetIndex = i;
              break;
            }
          }

          if (targetIndex !== -1 && targetIndex !== currentIndexRef.current) {
            // 找到目标索引，更新当前索引
            currentIndexRef.current = targetIndex;
          } else if (targetIndex === -1) {
            // 找不到索引时，可能是跳转到了历史记录之外的位置
            // 这种情况可能是历史记录不一致，尝试将当前 URL 添加到历史记录末尾
            // 并更新当前索引为新的位置
            navigableHistoryRef.current.push({
              url: changeData.url,
              pathname: changeData.pathname,
              timestamp: changeData.timestamp,
            });
            currentIndexRef.current = navigableHistoryRef.current.length - 1;

            // 限制历史记录数量
            if (navigableHistoryRef.current.length > 50) {
              navigableHistoryRef.current.shift();
              currentIndexRef.current = Math.max(
                0,
                currentIndexRef.current - 1,
              );
            }

            console.warn(
              '[PagePreviewIframe] popstate 事件：找不到目标 URL，已添加到历史记录',
              changeData.url,
            );
          }
        } else {
          // 如果历史记录为空，初始化历史记录
          navigableHistoryRef.current = [
            {
              url: changeData.url,
              pathname: changeData.pathname,
              timestamp: changeData.timestamp,
            },
          ];
          currentIndexRef.current = 0;
        }
      }

      // 更新按钮状态
      updateButtonStates();
    },
    [updateButtonStates],
  );

  // 处理页面内容变化和上报
  useEffect(() => {
    // 需要调用后端接口返回 iframe 内容的 html/markdown
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.src = pageUrl; // 重新加载同一个地址，会触发 onload
    setIsLoading(true);
    iframe.onload = async () => {
      // ⭐ 处理跨域访问错误
      let iframeDoc: Document | null = null;
      try {
        iframeDoc =
          iframe.contentDocument || iframe.contentWindow?.document || null;
      } catch (error) {
        // 跨域访问被阻止
        console.warn(
          '[PagePreviewIframe] 无法访问 iframe 文档（可能是跨域限制）:',
          error,
        );
        setIsLoading(false);
        return;
      }

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
            console.log('CHART2', params);
            await apiAgentComponentPageResultUpdate(params);
          }
        }, 500);
      });

      observer.observe(iframeDoc.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });
      // 添加一个空的 div，用于触发 observer
      // setTimeout(() => {
      //   iframeDoc.body.appendChild(iframeDoc.createElement('div'));
      // }, 200);

      if (pagePreviewData?.method === 'browser_navigate_page') {
        const nginxWelcomeText =
          iframeDoc.body.querySelector('body>h1')?.textContent;

        if (nginxWelcomeText === 'Welcome to nginx!') {
          // 添加一个空的 div，用于触发 observer
          // iframeDoc.body.appendChild(iframeDoc.createElement('div'));

          const params = {
            requestId: pagePreviewData?.request_id as string,
            html: '无法读取数据',
          };
          console.log('CHART1', params);
          await apiAgentComponentPageResultUpdate(params);
        }
      }

      // 清理
      return () => {
        observer.disconnect();
        clearTimeout(timer);
      };
    };
  }, [pagePreviewData]);

  /**
   * 监听来自 iframe 的 postMessage 消息
   * 处理 dev-monitor-history-change 消息并更新历史记录状态
   * 参考 AppDev/components/Preview/index.tsx 中的实现
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // ⭐ 过滤：只处理来自 iframe 的消息
      // 检查消息是否来自我们的 iframe（通过检查 source 是否是 iframe 的 contentWindow）
      const isFromIframe =
        iframeRef.current &&
        (event.source === iframeRef.current.contentWindow ||
          // 也允许通过 origin 判断（如果 iframe 的 URL 和 origin 匹配）
          (iframeRef.current.src &&
            event.origin === new URL(iframeRef.current.src).origin));

      // ⭐ 调试日志：记录 dev-monitor 相关消息以便排查
      const data = event.data;
      if (
        data &&
        typeof data === 'object' &&
        data.type?.includes('dev-monitor')
      ) {
        console.log('[PagePreviewIframe] 🔍 DevMonitor message detected:', {
          type: data.type,
          origin: event.origin,
          isFromIframe: !!isFromIframe,
          sourceIsWindow: event.source instanceof Window,
          iframeSrc: iframeRef.current?.src,
        });
      }

      // 如果不是来自 iframe，直接返回（避免处理其他来源的消息，如 React DevTools）
      if (!isFromIframe && data?.type?.includes('dev-monitor')) {
        console.warn(
          '[PagePreviewIframe] ⚠️ DevMonitor message ignored (not from iframe):',
          {
            type: data.type,
            origin: event.origin,
            source: event.source,
          },
        );
        return;
      }

      // 处理 dev-monitor-history-change 消息
      if (
        data &&
        typeof data === 'object' &&
        data.type === 'dev-monitor-history-change'
      ) {
        handleDevMonitorHistoryChange({
          historyType: data.historyType,
          url: data.url,
          pathname: data.pathname,
          timestamp: data.timestamp || Date.now(),
          direction: data.direction, // ⭐ 方向信息（仅 popstate 时存在）
        });
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleDevMonitorHistoryChange]);

  // 组件卸载时清理历史记录状态
  useEffect(() => {
    return () => {
      // 清理历史记录状态
      navigableHistoryRef.current = [];
      currentIndexRef.current = 0;
      setCanGoBack(false);
      setCanGoForward(false);
    };
  }, []);

  // // 重置加载状态
  // useEffect(() => {
  //   setIsLoading(!pagePreviewData);
  // }, [pagePreviewData]);

  // 如果没有预览数据，不显示
  if (!pagePreviewData) {
    return null;
  }

  /**
   * 刷新 iframe
   * 参考 AppDev/components/Preview/index.tsx 中的实现
   * 通过更新 iframeKey 来强制 iframe 重新渲染，这样更可靠，特别是对于跨域情况
   */
  function reload() {
    // 更新 iframeKey 来触发 iframe 重新渲染
    setIframeKey(Date.now());
    setIsLoading(true);

    // 同时清理历史记录状态，因为刷新后历史记录会重置
    navigableHistoryRef.current = [];
    currentIndexRef.current = 0;
    setCanGoBack(false);
    setCanGoForward(false);
  }

  /**
   * 后退功能
   * 参考 AppDev/components/Preview/index.tsx 中的实现
   * 添加错误处理，处理跨域限制等情况
   * 注意：跨域时无法操作 iframe 历史，通过操作父窗口历史来实现后退
   */
  function goBack() {
    if (!iframeRef.current) return;

    // 检查是否可以后退
    if (!canGoBack) {
      console.warn('[PagePreviewIframe] 无法后退：已在历史记录开头');
      return;
    }

    try {
      const iframeWindow = iframeRef.current.contentWindow;
      if (iframeWindow && iframeWindow.history) {
        // 在 iframe 内部执行后退
        iframeWindow.history.go(-1);
      }
    } catch (error) {
      // 跨域时无法操作 iframe 历史，通过操作父窗口历史来实现后退
      window.history.go(-1);
    }
  }

  /**
   * 前进功能
   * 参考 AppDev/components/Preview/index.tsx 中的实现
   * 添加错误处理，处理跨域限制等情况
   * 注意：跨域时无法操作 iframe 历史，通过操作父窗口历史来实现前进
   */
  function goForward() {
    if (!iframeRef.current) return;

    // 检查是否可以前进
    if (!canGoForward) {
      console.warn('[PagePreviewIframe] 无法前进：已在历史记录末尾');
      return;
    }

    try {
      const iframeWindow = iframeRef.current.contentWindow;
      if (iframeWindow && iframeWindow.history) {
        // 在 iframe 内部执行前进
        iframeWindow.history.go(1);
      }
    } catch (error) {
      // 跨域时无法操作 iframe 历史，通过操作父窗口历史来实现前进
      window.history.go(1);
    }
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
            <SvgIcon
              name="icons-common-console"
              className={cx(styles['page-icon'])}
            />
            <span className={titleClassName} style={titleStyle}>
              {previewPageTitle}
            </span>
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Tooltip title="刷新">
              <Button
                type="text"
                onClick={reload}
                icon={
                  <SvgIcon
                    name="icons-common-refresh"
                    style={{ fontSize: 16 }}
                  />
                }
              />
            </Tooltip>

            <Tooltip title="后退" open={canGoBack ? undefined : false}>
              <Button
                type="text"
                onClick={goBack}
                icon={
                  <SvgIcon
                    name="icons-common-caret_left"
                    style={{ fontSize: 16 }}
                  />
                }
                disabled={!canGoBack}
              />
            </Tooltip>

            <Tooltip title="前进" open={canGoForward ? undefined : false}>
              <Button
                type="text"
                onClick={goForward}
                icon={
                  <SvgIcon
                    name="icons-common-caret_right"
                    style={{ fontSize: 16 }}
                  />
                }
                disabled={!canGoForward}
              />
            </Tooltip>

            <Tooltip title="复制链接">
              <Button
                type="text"
                onClick={goCopy}
                icon={
                  <SvgIcon name="icons-common-link" style={{ fontSize: 16 }} />
                }
              />
            </Tooltip>
            {/* 复制模板按钮 */}
            {showCopyButton && allowCopy && onCopyClick && (
              <Tooltip title={copyButtonText}>
                <Button
                  type="text"
                  className={copyButtonClassName}
                  icon={
                    <SvgIcon name="icons-chat-copy" style={{ fontSize: 16 }} />
                  }
                  onClick={onCopyClick}
                />
              </Tooltip>
            )}
            {showCloseButton && (
              <Button
                type="text"
                onClick={onClose}
                icon={
                  <SvgIcon
                    name="icons-chat-close_regular"
                    style={{ fontSize: 16 }}
                  />
                }
              />
            )}
          </div>
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
