import { dict } from '@/services/i18nRuntime';
import {
  readConversationMessageLocation,
  withoutConversationMessageLocation,
} from '@/utils/conversationMessageLocation';
import { lazy, Suspense } from 'react';
import { history, useLocation } from 'umi';

const LocationWindow = lazy(() =>
  import('./ConversationMessageSearchLocation').then((module) => ({
    default: module.ConversationMessageSearchLocation,
  })),
);

/** 常驻壳同时覆盖 Chat、Agent 和 PageApp，避免缓存页各自打开重复定位窗。 */
export function ConversationMessageSearchRoute() {
  const { pathname, search, hash } = useLocation();
  const params = new URLSearchParams(search);
  const chat = pathname.match(/^\/home\/chat\/(\d+)\/[^/]+$/);
  const workbench = /^\/space\/[^/]+\/(agent-dev|app-dev\/[^/]+)$/.test(
    pathname,
  );
  const conversationId =
    chat?.[1] || (workbench ? params.get('conversationId') : undefined);
  if (!readConversationMessageLocation(search, conversationId ?? undefined))
    return null;
  const role = {
    name: dict(
      'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.messageAssistant',
    ),
    avatar: '',
  };
  return (
    <Suspense fallback={null}>
      <LocationWindow
        conversationId={conversationId!}
        search={search}
        roleInfo={{ assistant: role, system: role }}
        onClose={() =>
          history.replace({
            pathname,
            search: withoutConversationMessageLocation(search),
            hash,
          })
        }
      />
    </Suspense>
  );
}
