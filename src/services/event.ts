import { EventTypeEnum } from '@/types/enums/event';
import { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
interface EventList {
  event: object;
  type: EventTypeEnum;
}
export interface ApiCollectEventResponse {
  hasEvent: boolean;
  eventList: EventList[];
  version?: string; // 版本号
}
// 轮询获取事件
export async function apiCollectEvent(): Promise<
  RequestResponse<ApiCollectEventResponse>
> {
  return request('/api/notify/event/collect/batch', {
    method: 'GET',
  });
}

// 清除事件
export async function apiClearEvent(): Promise<RequestResponse<null>> {
  return request('/api/notify/event/clear', {
    method: 'GET',
  });
}
