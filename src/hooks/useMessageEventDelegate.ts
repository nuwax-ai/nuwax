import { EventBindResponseActionEnum } from '@/types/enums/agent';
import { checkPathParams, fillPathParams } from '@/utils';
import { message as antdMessage } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { useModel } from 'umi';

/**
 * 会话消息事件代理 Hook
 * 用于监听会话输出内容中的点击事件，并根据配置执行相应动作
 */
interface UseMessageEventDelegateProps {
  containerRef: React.RefObject<HTMLElement>;
  eventBindConfig?: {
    eventConfigs: Array<{
      name: string;
      identification: string;
      type: string;
      url?: string;
      pageId?: number;
      basePath?: string;
      pageUri?: string;
      pageUrl?: string;
      args?: any[];
      argJsonSchema?: string;
    }>;
  };
}

export const useMessageEventDelegate = ({
  containerRef,
  eventBindConfig,
}: UseMessageEventDelegateProps) => {
  const { showPagePreview } = useModel('chat');
  const handledEventsRef = useRef<Set<string>>(new Set());

  /**
   * 处理事件点击
   */
  const handleEventClick = useCallback(
    (eventType: string, dataStr: string) => {
      // 防止重复触发
      const eventKey = `${eventType}-${dataStr}`;
      if (handledEventsRef.current.has(eventKey)) {
        return;
      }
      handledEventsRef.current.add(eventKey);

      // 3秒后清除记录，允许再次点击
      setTimeout(() => {
        handledEventsRef.current.delete(eventKey);
      }, 3000);

      console.log('[Event Delegate] 触发事件:', { eventType, data: dataStr });

      // 解析 data
      // let parsedData: Record<string, any> = {};
      // try {
      //   parsedData = JSON.parse(dataStr);
      // } catch (error) {
      //   console.error('[Event Delegate] 数据解析失败:', error);
      // }

      // 查找对应的事件配置
      const eventConfig = eventBindConfig?.eventConfigs?.find(
        (config) => config.identification === eventType,
      );

      if (!eventConfig) {
        console.warn(`[Event Delegate] 未找到事件配置: ${eventType}`);
        return;
      }

      console.log('[Event Delegate] 找到事件配置:', eventConfig);

      // 根据配置类型执行相应动作
      switch (eventConfig.type) {
        case EventBindResponseActionEnum.Page: {
          // 打开页面
          if (!eventConfig.pageUrl) {
            antdMessage.error('页面路径配置错误');
            return;
          }

          // 提取参数（从 data 中获取）
          const pathParams: Record<string, any> = {};
          const params: Record<string, any> = {};
          if (eventConfig.args && Array.isArray(eventConfig.args)) {
            eventConfig.args.forEach((arg: any) => {
              if (arg.inputType === 'Path' && arg.name) {
                pathParams[arg.name] = arg.bindValue;
              }
              if (arg.inputType === 'Query' && arg.name) {
                params[arg.name] = arg.bindValue;
              }
            });
          }

          // 检查路径模板中的变量是否在 data 中存在且值有效
          if (checkPathParams(eventConfig.pageUrl, pathParams)) {
            const pageUrl = fillPathParams(eventConfig.pageUrl, pathParams);

            // 构建完整的页面 URL
            const fullUri = eventConfig.basePath
              ? `${eventConfig.basePath}${pageUrl}`
              : `${process.env.BASE_URL}${pageUrl}`;

            console.log('[Event Delegate] 打开页面:', {
              uri: fullUri,
              params,
              name: eventConfig.name,
            });

            // 调用页面预览
            showPagePreview({
              name: eventConfig.name || '页面',
              uri: fullUri,
              params,
              executeId: `event-${Date.now()}`,
            });
          } else {
            antdMessage.error('页面路径参数配置错误');
          }
          break;
        }

        case EventBindResponseActionEnum.Link: {
          // 打开外链
          if (!eventConfig.url) {
            antdMessage.error('链接地址配置错误');
            return;
          }

          console.log('[Event Delegate] 打开外链:', eventConfig.url);
          window.open(eventConfig.url, '_blank');
          break;
        }

        default:
          console.warn(`[Event Delegate] 未知的事件类型: ${eventConfig.type}`);
      }
    },
    [eventBindConfig, showPagePreview],
  );

  /**
   * 事件代理监听器
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // 查找带有 event 类的元素（支持冒泡）
      const eventElement = target.closest('.event') as HTMLElement;

      if (eventElement) {
        // 阻止默认行为
        e.preventDefault();
        e.stopPropagation();

        // 获取事件类型和数据
        const eventType = eventElement.getAttribute('event-type');
        const dataStr = eventElement.getAttribute('data');

        if (eventType && dataStr) {
          handleEventClick(eventType, dataStr);
        } else {
          console.warn('[Event Delegate] 缺少必要的属性:', {
            eventType,
            dataStr,
          });
        }
      }
    };

    // 添加事件监听器
    container.addEventListener('click', handleClick);

    console.log('[Event Delegate] 事件代理已初始化');

    // 清理函数
    return () => {
      container.removeEventListener('click', handleClick);
      console.log('[Event Delegate] 事件代理已清理');
    };
  }, [containerRef, handleEventClick]);

  return {
    handleEventClick,
  };
};

export default useMessageEventDelegate;
