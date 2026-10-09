import { ConversationPagePathnameContext } from '@/hooks/ConversationPagePathnameContext';
import { useContext } from 'react';
import { useLocation } from 'umi';
import { resolveDraftSurface } from './draftStorage';

/** 缓存会话按创建时的页面路径保存草稿，避免切走后跟随全局路由改键。 */
export const useConversationDraftScope = (
  draftKey: string | undefined,
  conversationId: number | null,
): string | null => {
  const fixedPathname = useContext(ConversationPagePathnameContext);
  const location = useLocation();
  if (draftKey !== undefined) return draftKey;
  if (conversationId === null) return null;
  return `${resolveDraftSurface(
    fixedPathname ?? location.pathname,
  )}:${conversationId}`;
};
