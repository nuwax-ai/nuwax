/**
 * #2486 行为探针：真实消息仓、V2 投影/渲染器、Markdown memo 和增量 hook。
 * 仅替换 Markdown 引擎及无关重组件，直接记录 clear/push/挂载，不能以 DOM
 * 身份未变代替「没有重放旧正文」。此处不替代真实后端请求频率验收。
 */
import ConversationRendererV2 from '@/features/conversation/presentation-v2/react/ConversationRendererV2';
import { createConversationMessageStore } from '@/features/conversation/runtime/conversationMessageStore';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { act, cleanup, render } from '@testing-library/react';
import React, { useSyncExternalStore } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const probe = vi.hoisted(() => ({
  push: vi.fn(),
  clear: vi.fn(),
  mount: vi.fn(),
  unmount: vi.fn(),
  render: vi.fn(),
}));

vi.mock('umi', () => ({ useModel: () => ({}) }));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));
vi.mock('@/hooks/useUnifiedTheme', () => ({
  useUnifiedTheme: () => ({ data: { antdTheme: 'light' } }),
}));
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/MarkdownRenderer/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('@/components/base/SvgIcon', () => ({ default: () => null }));
vi.mock('@/components/base/CopyButton', () => ({ default: () => null }));
vi.mock('@/components/ChatView', () => ({ default: () => null }));
vi.mock('@/components/ChatView/RunOver', () => ({ default: () => null }));
vi.mock('@/components/ChatView/ChatBottomDebug', () => ({
  default: () => null,
}));
vi.mock('@/features/conversation/presentation-v2/react/ProcessNodeRow', () => ({
  default: () => null,
}));
vi.mock(
  '@/features/conversation/presentation-v2/react/ToolGroupDisclosure',
  () => ({
    default: () => null,
  }),
);
vi.mock('@/features/conversation/presentation-v2/react/TodoTraceNode', () => ({
  default: () => null,
}));
vi.mock(
  '@/features/conversation/presentation-v2/react/OpenUiTraceNode',
  () => ({
    default: () => null,
  }),
);
vi.mock('@/plugins/ds-markdown-mermaid-plugin', () => ({
  default: {},
  mermaidConfig: {},
}));
vi.mock('@/components/MarkdownRenderer/genCustomPlugin', () => ({
  default: () => ({}),
}));
vi.mock('ds-markdown/plugins', () => ({ katexPlugin: {} }));
vi.mock('ds-markdown', async () => {
  const ReactModule = await import('react');
  return {
    default: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    ConfigProvider: ({ children }: { children: React.ReactNode }) => children,
    MarkdownCMD: ReactModule.forwardRef((_props, ref) => {
      const node = ReactModule.useRef<HTMLDivElement>(null);
      const id = () =>
        node.current?.closest('[data-key]')?.getAttribute('data-key');
      ReactModule.useImperativeHandle(ref, () => ({
        push(text: string, kind: string) {
          probe.push(id(), text, kind);
          if (node.current) node.current.textContent += text;
        },
        clear() {
          probe.clear(id());
          if (node.current) node.current.textContent = '';
        },
      }));
      ReactModule.useLayoutEffect(() => {
        probe.render(id());
      });
      ReactModule.useEffect(() => {
        const mountedId = id();
        probe.mount(mountedId);
        return () => probe.unmount(mountedId);
      }, []);
      return <div ref={node} data-testid="markdown-command" />;
    }),
  };
});

const messages = (): MessageInfo[] =>
  [
    { id: 'u1', role: AssistantRoleEnum.USER, text: '旧问题', index: 1 },
    {
      id: 'a1',
      role: AssistantRoleEnum.ASSISTANT,
      text: '旧回答',
      index: 2,
      status: MessageStatusEnum.Complete,
    },
    { id: 'u2', role: AssistantRoleEnum.USER, text: '继续执行', index: 3 },
    {
      id: 'a2',
      role: AssistantRoleEnum.ASSISTANT,
      text: '执行中',
      index: 4,
      status: MessageStatusEnum.Incomplete,
    },
  ] as MessageInfo[];

const roleInfo = { assistant: { name: 'Agent', avatar: '' } } as RoleInfo;
const preferences = { preset: 'balanced', nodeOverrides: {} } as const;

const Harness = ({
  store,
}: {
  store: ReturnType<typeof createConversationMessageStore>;
}) => {
  const messageList = useSyncExternalStore(store.subscribe, store.getSnapshot);
  return (
    <ConversationRendererV2
      messageList={messageList}
      conversationId={2486}
      roleInfo={roleInfo}
      preferences={preferences}
      messageBottomMode="none"
    />
  );
};

async function flushMarkdown() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(20);
  });
}

describe('#2486 快照渲染稳定性', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('重复 12 轮相同快照不通知消息订阅、不清空/重放正文、不重新挂载', async () => {
    const store = createConversationMessageStore(messages());
    const changed = vi.fn();
    store.subscribe(changed);
    render(<Harness store={store} />);
    await flushMarkdown();
    expect(probe.mount).toHaveBeenCalledTimes(2);
    expect(probe.push).toHaveBeenCalledTimes(2);
    const renderCount = probe.render.mock.calls.length;
    for (let cycle = 0; cycle < 12; cycle += 1) {
      await act(async () => {
        expect(store.mergeSnapshot(messages())).toBe(false);
      });
      await flushMarkdown();
    }
    expect(changed).not.toHaveBeenCalled();
    expect(probe.render).toHaveBeenCalledTimes(renderCount);
    expect(probe.push).toHaveBeenCalledTimes(2);
    expect(probe.clear).not.toHaveBeenCalled();
    expect(probe.mount).toHaveBeenCalledTimes(2);
    expect(probe.unmount).not.toHaveBeenCalled();
  });

  it('12 轮尾部增长只追加新片段，旧回答不重新渲染/解析，节点与引用保持', async () => {
    const initial = messages();
    const store = createConversationMessageStore(initial);
    const { container } = render(<Harness store={store} />);
    await flushMarkdown();
    const oldAnswer = container.querySelector('[data-key="v2-answer-turn-u1"]');
    expect(oldAnswer).not.toBeNull();
    const oldRenders = probe.render.mock.calls.filter(
      ([id]) => id === 'v2-answer-turn-u1',
    ).length;
    for (let cycle = 1; cycle <= 12; cycle += 1) {
      const incoming = messages();
      incoming[3].text += '+新片段'.repeat(cycle);
      await act(async () => {
        store.mergeSnapshot(incoming);
      });
      await flushMarkdown();
      expect(store.getSnapshot()[1]).toBe(initial[1]);
      expect(container.querySelector('[data-key="v2-answer-turn-u1"]')).toBe(
        oldAnswer,
      );
    }
    expect(
      probe.render.mock.calls.filter(([id]) => id === 'v2-answer-turn-u1'),
    ).toHaveLength(oldRenders);
    expect(
      probe.push.mock.calls.filter(([id]) => id === 'v2-answer-turn-u1'),
    ).toEqual([['v2-answer-turn-u1', '旧回答', 'answer']]);
    expect(
      probe.push.mock.calls
        .filter(([id]) => id === 'v2-answer-turn-u2')
        .slice(1),
    ).toEqual(
      Array.from({ length: 12 }, () => [
        'v2-answer-turn-u2',
        '+新片段',
        'answer',
      ]),
    );
    expect(probe.clear).not.toHaveBeenCalled();
    expect(probe.mount).toHaveBeenCalledTimes(2);
    expect(probe.unmount).not.toHaveBeenCalled();
  });
});
