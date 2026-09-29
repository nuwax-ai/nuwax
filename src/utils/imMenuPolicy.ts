import type { MenuItemDto } from '@/types/interfaces/menu';
import { findMicroAppRoute, resolveMicroAppMenuPath } from './microAppRoutes';

/** 与实际消息微应用接管策略同源，避免给通知中心或外链显示 IM 角标。 */
export function isImMenu(menu: MenuItemDto): boolean {
  const path = resolveMicroAppMenuPath(menu);
  return path !== null && findMicroAppRoute(path)?.name === 'nuwax-im-web';
}
