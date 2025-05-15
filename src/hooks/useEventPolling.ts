import {
  apiClearEvent,
  apiCollectEvent,
  ApiCollectEventResponse,
} from '@/services/event';
import eventBus from '@/utils/eventBus';
import { useRef } from 'react';
import { useRequest } from 'umi';

export default function useEventPolling(): void {
  // 使用ref记录当前是否正在处理事件，避免并发处理
  const isProcessingRef = useRef<boolean>(false);

  const { run: startPolling, cancel: stopPolling } = useRequest(
    apiCollectEvent,
    {
      loading: false,
      pollingInterval: 5000, // 轮询间隔，单位ms
      // 在屏幕不可见时，暂时暂停定时任务。
      pollingWhenHidden: false,
      // 轮询错误重试次数。如果设置为 -1，则无限次
      pollingErrorRetryCount: -1,
      onSuccess: async (data: ApiCollectEventResponse) => {
        // 如果已经在处理事件，则跳过本次回调
        if (isProcessingRef.current) {
          console.log('跳过重复的事件处理');
          return;
        }

        if (data?.hasEvent) {
          try {
            // 标记开始处理事件
            isProcessingRef.current = true;

            // 停止轮询，避免在处理过程中重复调用
            stopPolling();

            // 遍历所有事件，发布到 eventBus
            for (const event of data.eventList) {
              eventBus.emit(event.type, event.event);
            }

            // 事件处理完后清除
            await apiClearEvent();
          } catch (error) {
            console.error('处理事件时出错:', error);
          } finally {
            // 重新开始轮询
            startPolling();
            // 处理完成，重置标记
            isProcessingRef.current = false;
          }
        }
      },
    },
  );
}
