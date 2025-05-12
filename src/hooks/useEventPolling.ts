import {
  apiClearEvent,
  apiCollectEvent,
  ApiCollectEventResponse,
} from '@/services/event';
import eventBus from '@/utils/eventBus';
import { useRequest } from 'umi';

export default function useEventPolling(): void {
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
        if (data?.hasEvent) {
          // 遍历所有事件，发布到 eventBus
          for (const event of data.eventList) {
            eventBus.emit(event.type, event.event);
          }
          stopPolling();
          // 事件处理完后清除
          await apiClearEvent();
          // 重新开始轮询
          startPolling();
        }
      },
    },
  );
}
