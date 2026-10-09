import {
  getHostVisibility,
  subscribeHostVisibility,
} from '@/services/hostVisibility';
import { useSyncExternalStore } from 'react';

/** UI 查询许可；执行链及必要容器保活不消费此暂停信号。 */
export default function useHostVisibility(): boolean {
  return useSyncExternalStore(
    subscribeHostVisibility,
    getHostVisibility,
    () => true,
  );
}
