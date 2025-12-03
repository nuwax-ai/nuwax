import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { SANDBOX, UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { submitFilesUpdate } from '@/services/appDev';
import { apiPageUpdateProject } from '@/services/pageDev';
import { CoverImgSourceTypeEnum } from '@/types/enums/pageDev';
import { FileNode, ProjectDetailData } from '@/types/interfaces/appDev';
import { treeToFlatList } from '@/utils/appDevUtils';
import { jumpTo } from '@/utils/router';
import {
  ExclamationCircleOutlined,
  GlobalOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, message } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useModel, useRequest } from 'umi';
import { applyDesignChanges } from '../DesignViewer/applyDesignChanges';
import styles from './index.less';

const cx = classNames.bind(styles);
interface PreviewProps {
  /** 文件树数据 */
  files?: FileNode[];
  devServerUrl?: string;
  projectInfo?: ProjectDetailData | null;
  className?: string;
  isStarting?: boolean;
  isDeveloping?: boolean;
  isRestarting?: boolean; // 新增
  isProjectUploading?: boolean; // 新增
  startError?: string | null;
  /** 服务器接口返回的消息 */
  serverMessage?: string | null;
  /** 服务器错误码 */
  serverErrorCode?: string | null;
  /** 启动开发服务器回调 */
  onStartDev?: () => void;
  /** 重启开发服务器回调 */
  onRestartDev?: () => void;
  /** 白屏且 iframe 内错误时触发 AI Agent 自动处理回调
   * @param errorMessage 错误消息，为空字符串表示只有白屏没有错误
   * @param errorType 错误类型，用于区分不同的错误场景
   */
  onWhiteScreenOrIframeError?: (
    errorMessage: string,
    errorType?: 'whiteScreen' | 'iframe',
  ) => void;
}

export interface PreviewRef {
  refresh: () => void;
  getIsLoading: () => boolean;
  getLastRefreshed: () => Date | null;
  getHistoryBackCount: () => number;
  backInIframe: (steps: number) => void;
  captureIframeContent: () => void;
}

/**
 * 预览组件
 * 用于显示开发服务器的实时预览
 */
const Preview = React.forwardRef<PreviewRef, PreviewProps>(
  (
    {
      files,
      projectInfo,
      devServerUrl,
      className,
      isStarting,
      isDeveloping,
      isRestarting,
      isProjectUploading,
      startError,
      serverMessage,
      serverErrorCode,
      onStartDev,
      onRestartDev,
      onWhiteScreenOrIframeError,
    },
    ref,
  ) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [retrying, setRetrying] = useState(false);
    /** 是否正在保存文件 */
    const [isSaving, setIsSaving] = useState(false);

    const {
      setIsIframeLoaded,
      setIframeDesignMode,
      pendingChanges,
      setPendingChanges,
      selectedElement,
      setLocalTextContent,
      parseTailwindClassesAndUpdateStates,
    } = useModel('appDevDesign');

    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

    // dev-monitor 错误信息收集
    const devMonitorErrorsRef = useRef<
      Array<{ message: string; details: string | null; timestamp: number }>
    >([]);

    // 路由历史记录
    const historyStackRef = useRef<
      Array<{
        historyType: string;
        url: string;
        pathname: string;
        timestamp: number;
      }>
    >([]);
    const initialUrlRef = useRef<string | null>(null);
    // 简化的回退计数：pushState 和 hashchange 的数量
    const pushCountRef = useRef<number>(0);
    const lastUrlRef = useRef<string | null>(null);
    // 仅记录可导航的历史（initial、pushState、hashchange、replaceState 覆盖当前项）
    const navigableHistoryRef = useRef<
      Array<{
        url: string;
        pathname: string;
        timestamp: number;
      }>
    >([]);
    const currentIndexRef = useRef<number>(0);

    /**
     * 获取错误类型前缀
     */
    const getErrorTypePrefix = useCallback(
      (errorCode: string | null | undefined) => {
        if (!errorCode) return '';

        // 根据错误码判断类型，目前只有三种：RESTART、START、KEEPALIVE
        if (errorCode.includes('RESTART') || errorCode.includes('restart')) {
          return 'RESTART';
        }
        if (errorCode.includes('START') || errorCode.includes('start')) {
          return 'START';
        }
        if (
          errorCode.includes('KEEPALIVE') ||
          errorCode.includes('keepalive')
        ) {
          return 'KEEPALIVE';
        }

        // 如果错误码不包含关键词，根据当前状态判断类型
        if (isRestarting) return 'RESTART';
        if (isStarting) return 'START';
        if (serverMessage) return 'KEEPALIVE';

        return '';
      },
      [isRestarting, isStarting, serverMessage],
    );

    /**
     * 格式化错误码显示
     */
    const formatErrorCode = useCallback(
      (errorCode: string | null | undefined) => {
        if (!errorCode) return '';

        const prefix = getErrorTypePrefix(errorCode);
        return prefix ? `${prefix}: ${errorCode}` : errorCode;
      },
      [getErrorTypePrefix],
    );

    /**
     * 加载开发服务器预览
     */
    const loadDevServerPreview = useCallback(() => {
      // Loading dev server preview...

      if (!devServerUrl) {
        // No dev server URL available
        setLoadError('开发服务器URL不可用');
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      if (iframeRef.current) {
        setLastRefreshed(new Date());
      }
    }, [devServerUrl]);

    /**
     * 重试预览
     */
    const retryPreview = useCallback(async () => {
      setRetrying(true);
      setLoadError(null);

      try {
        if (devServerUrl) {
          // 如果有开发服务器URL，重新加载预览
          loadDevServerPreview();
        } else if (devServerUrl === undefined && onRestartDev) {
          // 如果没有预览地址，调用重启开发服务器接口
          onRestartDev();
        } else if (onStartDev) {
          // 如果没有开发服务器URL，调用启动开发服务器接口
          onStartDev();
        } else {
          setLoadError('开发服务器URL不可用');
        }
      } catch (error) {
        setLoadError('重试失败，请检查网络连接');
      } finally {
        setRetrying(false);
      }
    }, [devServerUrl, loadDevServerPreview, onStartDev, onRestartDev]);

    /**
     * 获取空状态配置
     * 根据当前状态返回 AppDevEmptyState 的配置信息
     */
    const getEmptyStateConfig = useCallback(() => {
      // 判断当前状态类型
      const hasError = loadError || serverMessage;
      const isLoading =
        isProjectUploading || isRestarting || isDeveloping || isStarting;
      const hasStartError = !!startError;
      const noServerUrl = devServerUrl === undefined;

      // 确定状态类型
      let type: 'error' | 'loading' | 'no-data' | 'empty';
      if (hasError) {
        type = 'error';
      } else if (isLoading) {
        type = 'loading';
      } else if (noServerUrl) {
        type = 'no-data';
      } else {
        type = 'empty';
      }

      // 确定图标
      let icon: React.ReactNode;
      if (hasError) {
        icon = <ExclamationCircleOutlined />;
      } else if (isProjectUploading || isRestarting || isStarting) {
        icon = <ThunderboltOutlined />;
      } else if (hasStartError) {
        icon = <ExclamationCircleOutlined />;
      } else {
        icon = <GlobalOutlined />;
      }

      // 确定标题
      let title: string;
      if (loadError) {
        title = '预览加载失败';
      } else if (serverMessage) {
        title = serverErrorCode
          ? `服务器错误 (${formatErrorCode(serverErrorCode)})`
          : '服务器错误';
      } else if (isProjectUploading) {
        title = '导入项目中';
      } else if (isRestarting) {
        title = '重启中';
      } else if (isStarting) {
        title = '启动中';
      } else if (isDeveloping) {
        title = '开发中';
      } else if (hasStartError) {
        title = serverErrorCode
          ? `开发服务器启动失败 (${formatErrorCode(serverErrorCode)})`
          : '开发服务器启动失败';
      } else if (noServerUrl) {
        title = '暂无预览地址';
      } else {
        title = '等待开发服务器启动';
      }

      // 确定描述
      let description: string;
      if (serverMessage) {
        description = serverMessage;
      } else if (loadError) {
        description = '预览页面加载失败，请检查开发服务器状态或网络连接';
      } else if (isProjectUploading) {
        description = '正在导入项目并重启开发服务器，请稍候...';
      } else if (isRestarting) {
        description = '正在重启开发服务器，请稍候...';
      } else if (isStarting) {
        description = '正在启动开发环境，请稍候...';
      } else if (isDeveloping) {
        description = '正在生成，请稍候...';
      } else if (hasStartError) {
        description = startError || '';
      } else if (noServerUrl) {
        description = '当前没有可用的预览地址，请先启动开发服务器';
      } else {
        description = '正在连接开发服务器，请稍候...';
      }

      // 确定按钮配置
      let buttons:
        | Array<{
            text: string;
            icon: React.ReactNode;
            onClick: () => void;
            loading?: boolean;
            disabled?: boolean;
            type?: 'primary';
          }>
        | undefined;

      if (hasError) {
        // 有错误时显示重试按钮
        buttons = [
          {
            text: retrying ? '刷新中...' : '刷新',
            icon: <ReloadOutlined />,
            onClick: retryPreview,
            loading: retrying,
            disabled: retrying,
          },
        ];

        // 如果是服务器错误且有重启回调，添加重启服务器按钮
        if (serverMessage && onRestartDev) {
          buttons.push({
            text: '重启服务器',
            icon: <ThunderboltOutlined />,
            onClick: onRestartDev,
            type: 'primary',
          });
        }
      } else if (isLoading) {
        // 加载中时不显示按钮
        buttons = undefined;
      } else if (onStartDev || onRestartDev) {
        // 其他情况且有启动/重启回调时显示重启服务按钮
        buttons = [
          {
            text: retrying ? '重启中...' : '重启服务',
            icon: <ReloadOutlined />,
            onClick: retryPreview,
            loading: retrying,
            disabled: retrying,
          },
        ];
      } else {
        buttons = undefined;
      }

      return {
        type,
        icon,
        title,
        description,
        buttons,
      };
    }, [
      loadError,
      serverMessage,
      isProjectUploading,
      isRestarting,
      isDeveloping,
      isStarting,
      startError,
      devServerUrl,
      serverErrorCode,
      formatErrorCode,
      retrying,
      retryPreview,
      onRestartDev,
      onStartDev,
    ]);

    /**
     * 刷新预览
     */
    const refreshPreview = useCallback(() => {
      // 关闭设计模式
      setIframeDesignMode(false);
      // 刷新预览
      if (devServerUrl) {
        loadDevServerPreview();
      } else if (iframeRef.current) {
        setLoadError('开发服务器URL不可用');
        setLastRefreshed(new Date());
      } else {
        // iframeRef.current 为空，无法刷新
      }
    }, [devServerUrl, loadDevServerPreview]);

    /**
     * 计算需要回退的历史记录数量
     * 返回从初始页面开始的 pushState 和 hashchange 次数
     * 这表示需要多少次 back() 才能回到初始页面
     */
    const getHistoryBackCount = useCallback(() => {
      return Math.max(0, pushCountRef.current);
    }, []);

    /**
     * 在 iframe 内部执行回退
     * @param steps 回退步数
     */
    const backInIframe = useCallback((steps: number) => {
      if (!iframeRef.current || steps <= 0) return;

      try {
        const iframeWindow = iframeRef.current.contentWindow;
        if (iframeWindow && iframeWindow.history) {
          // 在 iframe 内部执行回退
          // 使用 history.go(-steps) 比循环调用 history.back() 更高效
          iframeWindow.history.go(-steps);
        } else {
          jumpTo(-steps); //直接在父容器中回退
        }
      } catch (error) {
        // console.warn('[Preview] iframe 内部回退失败（可能是跨域限制）:', error);
        jumpTo(-steps); //直接在父容器中回退
      }
    }, []);

    // 上传前端项目压缩包并启动开发服务器
    const { run: runUpdatePage } = useRequest(apiPageUpdateProject, {
      manual: true,
    });

    // 截图 iframe 内容
    const captureIframeContent = async () => {
      const iframeElement = iframeRef.current;
      // console.log('截图 iframe 内容55555', iframeElement, devServerUrl);

      if (!devServerUrl) {
        return;
      }

      // 如果项目封面图片不为空且封面图片来源为USER，则不截图, 以用户上传为准
      if (
        projectInfo?.coverImg &&
        projectInfo?.coverImgSourceType === CoverImgSourceTypeEnum.USER
      ) {
        return;
      }

      // 如果 iframe 不存在，创建一个新的 iframe 元素
      if (!iframeElement) {
        // console.log('[Preview] 创建新的 iframe 元素进行截图');

        // 创建一个新的 iframe 元素
        const createIframe = document.createElement('iframe');
        createIframe.style.position = 'absolute';
        createIframe.style.opacity = '0'; // 移到屏幕外，不可见
        createIframe.style.zIndex = '-99'; // 移到屏幕外，不可见
        // createIframe.style.width = '1280px'; // 设置固定宽度
        // createIframe.style.height = '720px'; // 设置固定高度
        createIframe.style.border = 'none';
        createIframe.src = devServerUrl;

        // 设置加载完成事件
        createIframe.onload = async () => {
          // console.log('[Preview] iframe 加载完成，开始截图');

          try {
            // 等待一小段时间确保内容渲染完成
            await new Promise((resolve) => {
              setTimeout(resolve, 1000);
            });

            const iframeDoc =
              createIframe.contentDocument ||
              createIframe.contentWindow?.document;
            if (!iframeDoc) {
              console.error('[Preview] 无法访问 iframe 文档');
              document.body.removeChild(createIframe);
              return;
            }

            // 获取 iframe 宽度
            const iframeWidth =
              iframeDoc?.body?.scrollWidth ||
              iframeDoc?.documentElement?.offsetWidth ||
              1280;
            // 获取 iframe 高度 16:9比例
            const iframeHeight = iframeWidth * 0.5625;

            const canvas = await html2canvas(iframeDoc.body, {
              useCORS: true,
              allowTaint: true,
              width: iframeWidth,
              // 16:9比例
              height: iframeHeight,
              scrollY: 0, // 从顶部开始
            });

            // 将 canvas 转换为 blob
            canvas.toBlob(async (blob) => {
              if (!blob) {
                console.error('[Preview] 无法生成图片 blob');
                document.body.removeChild(createIframe);
                return;
              }

              try {
                // 创建 FormData 并上传图片
                const formData = new FormData();
                formData.append('file', blob, 'screenshot.png');

                // 上传文件
                const response = await fetch(UPLOAD_FILE_ACTION, {
                  method: 'POST',
                  headers: {
                    Authorization: token ? `Bearer ${token}` : '',
                  },
                  body: formData,
                });

                const result = await response.json();
                const imageUrl = result.data?.url || result.url || '';

                // console.log('[Preview] 图片上传成功:', imageUrl, result);
                // 调用编辑页面接口，更新图标
                const params = {
                  projectId: projectInfo?.projectId,
                  projectName: projectInfo?.name,
                  coverImg: imageUrl,
                  coverImgSourceType: CoverImgSourceTypeEnum.SYSTEM,
                };
                runUpdatePage(params);

                // 移除临时创建的 iframe
                document.body.removeChild(createIframe);
              } catch (uploadError) {
                console.error('[Preview] 图片上传过程中发生错误:', uploadError);

                // 确保移除临时创建的 iframe
                if (document.body.contains(createIframe)) {
                  document.body.removeChild(createIframe);
                }
              }
            }, 'image/png');
          } catch (error) {
            console.error('[Preview] 截图失败:', error);

            // 确保移除临时创建的 iframe
            if (document.body.contains(createIframe)) {
              document.body.removeChild(createIframe);
            }
          }
        };

        // 设置加载错误事件
        createIframe.onerror = () => {
          console.error('[Preview] iframe 加载失败');

          // 确保移除临时创建的 iframe
          if (document.body.contains(createIframe)) {
            document.body.removeChild(createIframe);
          }
        };

        // 将 iframe 添加到页面中
        document.body.appendChild(createIframe);
      } else {
        // 如果 iframe 存在，使用现有 iframe 进行截图
        // console.log('运行到这里了iframeElement', iframeElement);
        try {
          const iframeDoc =
            iframeElement.contentDocument ||
            iframeElement.contentWindow?.document;
          // console.log('iframeDoc', iframeDoc);
          if (!iframeDoc) {
            console.error('[Preview] 无法访问 iframe 文档');
            return;
          }

          // 获取 iframe 宽度
          const iframeWidth =
            iframeDoc?.body?.scrollWidth ||
            iframeDoc?.documentElement?.offsetWidth ||
            1280;
          // 获取 iframe 高度 16:9比例
          const iframeHeight = iframeWidth * 0.5625;

          const canvas = await html2canvas(iframeDoc.body, {
            useCORS: true,
            allowTaint: true,
            width: iframeWidth,
            height: iframeHeight,
            scrollY: 0, // 从顶部开始
          });

          // 将 canvas 转换为 blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              console.error('[Preview] 无法生成图片 blob');
              return;
            }

            try {
              // 创建 FormData 并上传图片
              const formData = new FormData();
              formData.append('file', blob, 'screenshot.png');

              // 上传文件
              const response = await fetch(UPLOAD_FILE_ACTION, {
                method: 'POST',
                headers: {
                  Authorization: token ? `Bearer ${token}` : '',
                },
                body: formData,
              });

              const result = await response.json();
              const imageUrl = result.data?.url || result.url || '';

              // console.log('[Preview] 图片上传成功:', imageUrl, result);
              // 调用编辑页面接口，更新图标
              const params = {
                projectId: projectInfo?.projectId,
                projectName: projectInfo?.name,
                coverImg: imageUrl,
                coverImgSourceType: CoverImgSourceTypeEnum.SYSTEM,
              };
              runUpdatePage(params);
            } catch (uploadError) {
              console.error('[Preview] 图片上传过程中发生错误:', uploadError);
            }
          }, 'image/png');
        } catch (error) {
          console.error('[Preview] 截图失败:', error);
        }
      }
    };

    // 暴露refresh方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        refresh: refreshPreview,
        getIsLoading: () => isLoading,
        getLastRefreshed: () => lastRefreshed,
        getHistoryBackCount,
        backInIframe,
        captureIframeContent,
      }),
      [
        refreshPreview,
        isLoading,
        lastRefreshed,
        getHistoryBackCount,
        backInIframe,
        captureIframeContent,
      ],
    );

    /**
     * iframe加载完成处理
     */
    const handleIframeLoad = useCallback(() => {
      // console.log('iframe加载完成:', iframeDesignMode);
      // // 如果设计模式为开启，则发送消息给 iframe 开启设计模式
      // if (iframeDesignMode) {
      //   const iframe = document.querySelector('iframe');
      //   console.log('iframe', iframe, iframe?.contentWindow);
      //   if (iframe && iframe.contentWindow) {
      //     console.log('发送消息给 iframe 开启设计模式33333333333333333333');
      //     iframe.contentWindow.postMessage(
      //       {
      //         type: 'TOGGLE_DESIGN_MODE',
      //         enabled: true,
      //         timestamp: Date.now(),
      //       },
      //       '*',
      //     );
      //   }
      // }
      setIsLoading(false);
      setLoadError(null);
      // 设置iframe加载完毕
      setIsIframeLoaded(true);

      // 清空之前收集的错误信息
      devMonitorErrorsRef.current = [];
    }, []);

    /**
     * iframe加载错误处理
     */
    const handleIframeError = useCallback(() => {
      setIsLoading(false);
      setLoadError('预览加载失败，请检查开发服务器状态或网络连接');

      // 统一通过 onWhiteScreenWithError 处理，指定错误类型为 iframe
      if (onWhiteScreenOrIframeError) {
        onWhiteScreenOrIframeError(
          dayjs(Date.now()).format('YYYY/MM/DD HH:mm:ss') +
            ' 预览加载失败，请检查开发服务器状态或网络连接',
          'iframe',
        );
      }
    }, [onWhiteScreenOrIframeError]);

    /**
     * 处理来自 dev-monitor 的错误消息
     */
    const handleDevMonitorError = useCallback(
      (
        errorInfo: {
          message: string;
          details: string | null;
          timestamp: number;
        },
        isWhiteScreen: boolean = false,
      ) => {
        // 检查是否已存在相同错误（避免重复）
        const exists = devMonitorErrorsRef.current.some(
          (e) =>
            e.message === errorInfo.message &&
            Math.abs(e.timestamp - errorInfo.timestamp) < 1000, // 1秒内的相同错误视为重复
        );

        if (!exists) {
          devMonitorErrorsRef.current.push(errorInfo);
          // 限制错误数量，只保留最近10条
          if (devMonitorErrorsRef.current.length > 10) {
            devMonitorErrorsRef.current.shift();
          }

          // 格式化错误消息
          const errorMessages = devMonitorErrorsRef.current
            .slice(-3) // 只取最近3条
            .map((e) => {
              let msg = `${dayjs(e.timestamp).format('YYYY/MM/DD HH:mm:ss')} ${
                e.message
              }`;
              if (e.details) {
                try {
                  const details = JSON.parse(e.details);
                  if (typeof details === 'string') {
                    msg += `: ${details}`;
                  } else if (details && typeof details === 'object') {
                    msg += `: ${JSON.stringify(details)}`;
                  }
                } catch {
                  msg += `: ${e.details}`;
                }
              }
              return msg;
            })
            .join('; ');

          // ⭐ 只要有错误就触发自动处理，不限于白屏
          // 白屏时使用 'whiteScreen' 类型，否则使用 'whiteScreen'（因为类型定义只支持 whiteScreen | iframe）
          if (onWhiteScreenOrIframeError) {
            // 即使不是白屏，也触发自动处理（使用 whiteScreen 类型）
            onWhiteScreenOrIframeError(
              errorMessages,
              isWhiteScreen ? 'whiteScreen' : 'iframe',
            );
          }
        }
      },
      [onWhiteScreenOrIframeError],
    );

    /**
     * 处理来自 dev-monitor 的历史变化消息
     */
    const handleDevMonitorHistoryChange = useCallback(
      (changeData: {
        historyType: string;
        url: string;
        pathname: string;
        timestamp: number;
      }) => {
        // 记录初始 URL
        if (changeData.historyType === 'initial') {
          initialUrlRef.current = changeData.url;
          lastUrlRef.current = changeData.url;
          historyStackRef.current = [
            ...(historyStackRef.current || []),
            changeData,
          ];
          // pushCountRef.current = 0;
          navigableHistoryRef.current = [
            ...(navigableHistoryRef.current || []),
            {
              url: changeData.url,
              pathname: changeData.pathname,
              timestamp: changeData.timestamp,
            },
          ];
          // currentIndexRef.current = 0;
          return;
        }

        // 记录历史变化
        historyStackRef.current.push(changeData);

        // 限制历史记录数量，只保留最近50条
        if (historyStackRef.current.length > 50) {
          historyStackRef.current.shift();
        }

        // 根据历史变化类型更新回退计数
        if (
          changeData.historyType === 'pushState' ||
          changeData.historyType === 'hashchange'
        ) {
          // pushState 和 hashchange 会增加历史记录
          pushCountRef.current++;
          // 追加到可导航历史，并移动当前指针
          navigableHistoryRef.current.push({
            url: changeData.url,
            pathname: changeData.pathname,
            timestamp: changeData.timestamp,
          });
          currentIndexRef.current = navigableHistoryRef.current.length - 1;
        } else if (changeData.historyType === 'replaceState') {
          // replaceState 替换当前位置，不改变计数
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
              const delta = targetIndex - currentIndexRef.current;
              if (delta < 0) {
                // 后退
                pushCountRef.current = Math.max(
                  0,
                  pushCountRef.current + delta,
                );
              } else if (delta > 0) {
                // 前进
                pushCountRef.current += delta;
              }
              currentIndexRef.current = targetIndex;
            } else {
              // 找不到索引时，视为打开新页面，计数加一
              pushCountRef.current += 1;
            }
          }
        }

        // 更新最后 URL
        lastUrlRef.current = changeData.url;
      },
      [],
    );

    /**
     * 监听来自 iframe 的 postMessage 消息
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

        // ⭐ 调试日志：记录所有消息以便排查
        const data = event.data;

        // 如果不是来自 iframe，直接返回（避免处理其他来源的消息，如 React DevTools）
        if (!isFromIframe && data?.type?.includes('dev-monitor')) {
          return;
        }

        // 处理 dev-monitor 消息
        if (data && typeof data === 'object' && data.type) {
          switch (data.type) {
            case 'dev-monitor-error':
              // ⭐ 实时错误消息（立即发送）
              if (data.error) {
                const isWhiteScreen = data.isWhiteScreen;
                handleDevMonitorError(data.error, isWhiteScreen);
              }
              break;

            case 'dev-monitor-history-change':
              // 历史记录变化消息
              handleDevMonitorHistoryChange({
                historyType: data.historyType,
                url: data.url,
                pathname: data.pathname,
                timestamp: data.timestamp || Date.now(),
              });
              break;

            default:
              break;
          }
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }, [handleDevMonitorError, handleDevMonitorHistoryChange]);

    // 当开发服务器URL可用时，自动加载预览
    useEffect(() => {
      // Dev server URL changed
      if (devServerUrl) {
        // Dev server URL available, loading preview
        loadDevServerPreview();
      } else {
        // Dev server URL is empty, clearing iframe and resetting states

        setIsLoading(false);
        setLoadError(null);
        setLastRefreshed(new Date());
      }
    }, [devServerUrl, loadDevServerPreview]);

    // 组件卸载时清理
    useEffect(() => {
      return () => {
        if (iframeRef.current) {
          iframeRef.current = null;
        }
        // 退出页面时，重置设计模式状态、清空待保存列表、清空选中元素
        setIframeDesignMode(false);
        setPendingChanges([]);
        setIsIframeLoaded(false);
        // 清理收集的错误信息和路由历史
        devMonitorErrorsRef.current = [];
        historyStackRef.current = [];
        initialUrlRef.current = null;
        lastUrlRef.current = null;
        pushCountRef.current = 0;
        navigableHistoryRef.current = [];
        currentIndexRef.current = 0;
      };
    }, []);

    // 关闭设计模式
    const closeDesignMode = useCallback(() => {
      // 关闭设计模式，防止用户在设计模式下修改元素，导致添加到会话的内容不准确
      setIframeDesignMode(false);
      const iframe = document.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'TOGGLE_DESIGN_MODE',
            enabled: false,
            timestamp: Date.now(),
          },
          '*',
        );
      }
    }, []);

    /**
     * 保存所有更改
     */
    const saveChanges = async () => {
      const projectId = projectInfo?.projectId || '';
      if (!projectId) {
        message.error('缺少项目ID，无法保存');
        return;
      }

      if (pendingChanges.length === 0) {
        message.warning('没有待保存的更改');
        return;
      }

      setIsSaving(true);

      try {
        // 将 pendingChanges 按文件分组
        const fileChangesMap = new Map<
          string,
          Array<{
            type: 'style' | 'content';
            sourceInfo: any;
            newValue: string;
            originalValue?: string;
          }>
        >();

        // 路径清理正则
        const pathCleanRegex = /^\/app\/project_workspace\/[^/]+\//;

        pendingChanges.forEach((change: any) => {
          // 修正文件路径：移除 /app/project_workspace/{projectId}/ 前缀
          let filePath = change.sourceInfo.fileName;
          if (pathCleanRegex.test(filePath)) {
            filePath = filePath.replace(pathCleanRegex, '');
          }

          if (!fileChangesMap.has(filePath)) {
            fileChangesMap.set(filePath, []);
          }
          fileChangesMap.get(filePath)!.push(change);
        });

        // 2. 获取全量文件列表（扁平化）
        // 使用 files 属性作为基准，确保包含未修改的文件
        const allFiles = treeToFlatList(files || []);
        const filesToUpdate: any[] = [];

        // 3. 遍历全量文件列表，应用修改
        for (const file of allFiles) {
          const filePath = file.name; // treeToFlatList 返回的 name 是文件路径(id)

          // 检查该文件是否有待保存的修改
          if (fileChangesMap.has(filePath)) {
            const changes = fileChangesMap.get(filePath)!;
            try {
              const fileContent = file.contents || '';

              // 应用智能替换逻辑
              const updatedContent = applyDesignChanges(fileContent, changes);

              filesToUpdate.push({
                name: filePath,
                contents: updatedContent,
                binary: file.binary || false,
                sizeExceeded: file.sizeExceeded || false,
              });
            } catch (error) {
              console.error(
                `[DesignViewer] Error processing file ${filePath}:`,
                error,
              );
              message.error(`处理文件 ${filePath} 时出错`);
              // 出错时保留原内容，防止文件丢失？或者跳过？
              // 这里选择保留原内容，避免破坏
              filesToUpdate.push(file);
            }
          } else {
            // 没有修改的文件，直接添加到更新列表
            filesToUpdate.push(file);
          }
        }

        // 4. 调用 submitFilesUpdate 接口提交全量列表
        const response = await submitFilesUpdate(
          projectId.toString(),
          filesToUpdate,
        );
        // 保存成功后，关闭保存状态
        setIsSaving(false);

        if (response.code === SUCCESS_CODE) {
          message.success(`成功保存！`);
          // 方案一，保存后关闭设计模式
          closeDesignMode();
          // 清空待保存列表
          setPendingChanges([]);
        } else {
          message.error(response.message || '保存失败，请查看控制台错误信息');
        }
      } catch (error) {
        // 保存失败后，关闭保存状态
        setIsSaving(false);
        console.error('[DesignViewer] Error saving changes:', error);
      }
    };

    // 重置编辑
    const onCancelEdit = () => {
      // 如果有待恢复的更改，先向 iframe 发送恢复消息
      const iframe = iframeRef.current;
      if (pendingChanges.length > 0 && iframe?.contentWindow) {
        // 遍历所有待恢复的更改，使用 originalValue 恢复
        pendingChanges.forEach((change: any) => {
          const { type, sourceInfo, originalValue } = change;

          // 如果没有原始值，跳过（不应该发生，但做防御性检查）
          if (!originalValue && originalValue !== '') {
            return;
          }

          try {
            if (type === 'style') {
              // 恢复样式：使用原始 className
              iframe.contentWindow?.postMessage(
                {
                  type: 'UPDATE_STYLE',
                  payload: {
                    sourceInfo,
                    newClass: originalValue || '', // 使用原始值恢复
                    persist: false,
                  },
                  timestamp: Date.now(),
                },
                '*',
              );
            } else if (type === 'content') {
              // 恢复内容：使用原始文本内容
              iframe.contentWindow?.postMessage(
                {
                  type: 'UPDATE_CONTENT',
                  payload: {
                    sourceInfo,
                    newContent: originalValue || '', // 使用原始值恢复
                    persist: false,
                  },
                  timestamp: Date.now(),
                },
                '*',
              );
            }

            // 根据当前选择的元素的 className和 textContent 解析 Tailwind 类名并更新本地状态
            parseTailwindClassesAndUpdateStates(
              selectedElement?.className || '',
            );
            setLocalTextContent(selectedElement?.textContent || '');
          } catch (error) {
            console.error(
              `[Preview] 恢复更改失败 (${type}):`,
              sourceInfo,
              error,
            );
          }
        });
      }

      // 清空待保存列表和保存状态
      setPendingChanges([]);
      setIsSaving(false);
    };

    return (
      <div className={cx(`relative ${styles.preview} ${className || ''}`)}>
        <div className={styles.previewContainer}>
          {devServerUrl &&
          !loadError &&
          !serverMessage &&
          !isStarting &&
          !isRestarting &&
          !isDeveloping &&
          !isProjectUploading ? (
            <iframe
              ref={iframeRef}
              className={styles.previewIframe}
              data-id={`${+(lastRefreshed || 0)}`}
              key={`${+(lastRefreshed || 0)}`} // 添加key属性，当devServerUrl变化时强制重新渲染iframe
              src={devServerUrl}
              title="Preview"
              sandbox={SANDBOX}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
            />
          ) : (
            <AppDevEmptyState
              {...getEmptyStateConfig()}
              maxDescriptionLength={150} // 限制描述文本长度
              allowDescriptionWrap={true} // 允许换行显示
              maxLines={4} // 最多显示 4 行
              clickableDescription={true} // 启用点击查看完整内容
              viewFullTextButtonText="查看完整错误信息" // 自定义按钮文本
            />
          )}
        </div>
        {/* 未保存更改提示栏 todo 优化 : 还需要根据文件是否已被修改过来决定是否显示*/}
        {pendingChanges?.length > 0 && (
          <div
            className={cx(styles['unsaved-changes-bar'], {
              [styles.show]: pendingChanges?.length > 0,
            })}
          >
            <WarningOutlined className={styles['warning-icon']} />
            <span className={styles['unsaved-text']}>未保存的更改</span>
            <Button
              type="text"
              className={styles['reset-button']}
              onClick={onCancelEdit}
              disabled={isSaving}
            >
              重置
            </Button>
            <Button
              type="primary"
              className={styles['save-button']}
              onClick={saveChanges}
              loading={isSaving}
            >
              保存
            </Button>
          </div>
        )}
      </div>
    );
  },
);

Preview.displayName = 'Preview';

export default Preview;
