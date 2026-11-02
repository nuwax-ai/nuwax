import { withoutConversationMessageLocation } from '@/utils/conversationMessageLocation';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ConversationMessageSearchLocation as Location } from './ConversationMessageSearchLocation';
const { route, locate, replace } = vi.hoisted(() => ({
  route: { pathname: '/home/chat/7/9', search: '', hash: '' },
  locate: vi.fn(),
  replace: vi.fn(),
}));
vi.mock('umi', () => ({ useLocation: () => route, history: { replace } }));
vi.mock('@/services/conversationSearch', () => ({
  apiLocateConversationMessage: locate,
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (k: string) => k }));
vi.mock('@/components/ChatView', () => ({
  default: ({ messageInfo }: any) => <div>{messageInfo.text}</div>,
}));
vi.mock('./ConversationMessageSearchLocation.less', () => ({
  default: { window: 'window', target: 'target' },
}));
vi.mock('antd', () => ({
  Modal: ({ open, children, onCancel }: any) =>
    open ? (
      <div>
        <button onClick={onCancel}>关闭</button>
        {children}
      </div>
    ) : null,
  Spin: () => <span>loading</span>,
  Alert: ({ message, action }: any) => (
    <div role="alert">
      {message}
      {action}
    </div>
  ),
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
}));
function ConversationMessageSearchLocation(props: any) {
  return (
    <Location
      {...props}
      search={route.search}
      onClose={() =>
        replace({
          pathname: route.pathname,
          search: withoutConversationMessageLocation(route.search),
          hash: route.hash,
        })
      }
    />
  );
}
const target = (id: number, message: string, index: number) =>
  `?keep=yes&searchConversationId=${id}&searchMessageId=${message}&searchMessageIndex=${index}`;
const ok = (id: number, message: string, index: number, text: string) => ({
  code: '0000',
  data: {
    conversationId: id,
    messageId: message,
    messageIndex: index,
    messages: [{ id: message, index, text }],
  },
});
beforeEach(() => {
  locate.mockReset();
  replace.mockReset();
  route.search = target(7, 'm42', 42);
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
});
it('有界读取目标窗口并在实际消息包装锚点定位，关闭保留其他参数', async () => {
  locate.mockResolvedValue(ok(7, 'm42', 42, '旧消息正文'));
  render(
    <ConversationMessageSearchLocation
      conversationId={7}
      roleInfo={{} as any}
    />,
  );
  expect(await screen.findByText('旧消息正文')).toBeTruthy();
  expect(locate).toHaveBeenCalledWith({
    conversationId: 7,
    messageId: 'm42',
    messageIndex: 42,
  });
  const anchor = document.querySelector('[data-search-target="true"]')!;
  expect(anchor.getAttribute('data-search-message-id')).toBe('m42');
  await waitFor(() => expect(anchor.scrollIntoView).toHaveBeenCalled());
  fireEvent.click(screen.getByText('关闭'));
  expect(replace).toHaveBeenCalledWith({
    pathname: route.pathname,
    search: '?keep=yes',
    hash: '',
  });
});
it('切换会话后丢弃先前定位的迟到回包，不显示错误会话正文', async () => {
  let late!: (value: any) => void;
  locate.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        late = resolve;
      }),
  );
  const view = render(
    <ConversationMessageSearchLocation
      conversationId={7}
      roleInfo={{} as any}
    />,
  );
  route.search = target(8, 'm80', 80);
  locate.mockResolvedValueOnce(ok(8, 'm80', 80, '新会话正文'));
  view.rerender(
    <ConversationMessageSearchLocation
      conversationId={8}
      roleInfo={{} as any}
    />,
  );
  await screen.findByText('新会话正文');
  await act(async () => {
    late(ok(7, 'm42', 42, '迟到正文'));
  });
  expect(screen.queryByText('迟到正文')).toBeNull();
  expect(screen.getByText('新会话正文')).toBeTruthy();
});
it('失权或失败显示可重试状态，重试后可恢复', async () => {
  locate.mockRejectedValueOnce(new Error('403'));
  render(
    <ConversationMessageSearchLocation
      conversationId={7}
      roleInfo={{} as any}
    />,
  );
  await screen.findByRole('alert');
  locate.mockResolvedValueOnce(ok(7, 'm42', 42, '重试正文'));
  fireEvent.click(
    screen.getByText(
      'PC.Layouts.DynamicMenusLayout.SidebarSearchModal.messageRetry',
    ),
  );
  await screen.findByText('重试正文');
  expect(screen.queryByRole('alert')).toBeNull();
});
it('定位参数属于别的会话时不发请求', () => {
  render(
    <ConversationMessageSearchLocation
      conversationId={8}
      roleInfo={{} as any}
    />,
  );
  expect(locate).not.toHaveBeenCalled();
});
