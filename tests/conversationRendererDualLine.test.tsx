/**
 * 数据线 × 渲染线四组合合同测试（V2 双线重构核心矩阵）：
 *   legacy 数据 + V1 / legacy 数据 + V2 / runtime 数据 + V1 / runtime 数据 + V2。
 *
 * 两条数据线产出同构 MessageInfo[]（由 tests/conversationDualTrackParity.test.ts
 * 的 trace 契约保证）；本测试用「legacy 单消息整轮」与「runtime 多步输出」两种
 * 真实形态的 fixture 驱动投影与渲染，断言：
 * - V1 侧：两种数据都按消息数渲染 ChatView（行为不变）；
 * - V2 侧：两种数据投影出等价的轨迹结构与最终回答。
 */
import ChatContentArea from '@/components/business-component/UnifiedChatSession/components/ChatContentArea';
import { projectConversation } from '@/features/conversation/presentation-v2';
import ConversationRendererV2 from '@/features/conversation/presentation-v2/react/ConversationRendererV2';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...values: (string | number)[]) =>
    values.length ? `${key}:${values.join(',')}` : key,
  t: (key: string) => key,
}));
vi.mock(
  '@/components/business-component/UnifiedChatSession/components/ChatContentArea/index.less',
  () => ({ default: new Proxy({}, { get: () => 'cls' }) }),
);
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));
vi.mock('umi', () => ({ useModel: () => ({}) }));
vi.mock('@/components/ChatView', () => ({
  default: ({ messageInfo }: { messageInfo: MessageInfo }) => (
    <div data-testid="chat-view" data-message-id={String(messageInfo.id)} />
  ),
}));
vi.mock('@/components/ChatView/RunOver', () => ({
  default: () => <span data-testid="run-over" />,
}));
vi.mock('@/components/ChatView/ChatBottomDebug', () => ({
  default: () => <span data-testid="chat-debug" />,
}));
vi.mock('@/components/base/CopyButton', () => ({
  default: ({ text }: { text?: string }) => (
    <button type="button" data-testid="copy-button" data-copy-text={text} />
  ),
}));
vi.mock('@/components/MarkdownRenderer', () => ({
  default: ({ answer }: { answer: string }) => (
    <div data-testid="markdown-renderer">{answer}</div>
  ),
  PureMarkdownRenderer: ({ children }: { children: string }) => (
    <div data-testid="pure-markdown">{children}</div>
  ),
}));
vi.mock('@/hooks/useMarkdownRender', () => ({
  default: ({ id }: { id: string | number }) => ({
    markdownRef: { current: null },
    messageIdRef: { current: `rendered-${id}` },
  }),
}));
vi.mock('@/hooks/useUnifiedTheme', () => ({
  useUnifiedTheme: () => ({ data: { antdTheme: 'light' } }),
}));
vi.mock('@/components/MarkdownCustomProcess', () => ({
  default: ({ executeId }: { executeId: string }) => (
    <div data-testid="tool-detail" data-execute-id={executeId} />
  ),
}));

const thinkTag = (status: 'thinking' | 'finished', content: string) =>
  `\n\n<div><markdown-custom-think status="${status}" content="${encodeURIComponent(
    content,
  )}"></markdown-custom-think></div>\n\n`;
const processTag = (executeId: string, name: string) =>
  `\n\n<div><markdown-custom-process executeId="${executeId}" type="Mcp" status="FINISHED" name="${encodeURIComponent(
    name,
  )}"></markdown-custom-process></div>\n\n`;

const msg = (
  overrides: Partial<MessageInfo> & { id: string; role: AssistantRoleEnum },
): MessageInfo =>
  ({
    text: '',
    time: '',
    componentExecutedList: [],
    messageType: 'ASSISTANT',
    index: 0,
    tenantId: 1,
    senderType: 'User',
    senderId: 'u',
    userId: 1,
    agentId: 1,
    status: MessageStatusEnum.Complete,
    ...overrides,
  } as MessageInfo);

const ROLE_INFO = {
  assistant: { name: 'Assistant', avatar: '' },
  system: { name: 'System', avatar: '' },
} as never;

/** legacy 线形态：单条 assistant 消息承载整轮（think 标签 + 工具 + 正文 + finalResult） */
const legacyMessageList: MessageInfo[] = [
  msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
  msg({
    id: 'a1',
    role: AssistantRoleEnum.ASSISTANT,
    index: 1,
    text: `${thinkTag('finished', '想一想')}${processTag(
      'e1',
      '查资料',
    )}结论正文`,
    finalResult: {
      outputText: '最终结论（legacy）',
      success: true,
      startTime: 1000,
      endTime: 61000,
      componentExecuteResults: [],
    } as unknown as MessageInfo['finalResult'],
  }),
];

/** runtime 线形态：多步输出 = 多条 assistant 消息，末条带 finalResult */
const runtimeMessageList: MessageInfo[] = [
  msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
  msg({
    id: 'a1',
    role: AssistantRoleEnum.ASSISTANT,
    index: 1,
    status: null as unknown as MessageStatusEnum,
    finished: true,
    text: `${thinkTag('finished', '想一想')}${processTag(
      'e1',
      '查资料',
    )}第一步小结`,
  }),
  msg({
    id: 'a2',
    role: AssistantRoleEnum.ASSISTANT,
    index: 2,
    text: '',
    finalResult: {
      outputText: '最终结论（runtime）',
      success: true,
      startTime: 1000,
      endTime: 61000,
      componentExecuteResults: [],
    } as unknown as MessageInfo['finalResult'],
  }),
];

const baseContentAreaProps = {
  messageViewRef: { current: null } as React.RefObject<HTMLDivElement>,
  handleMouseEnter: () => {},
  handleMouseLeave: () => {},
  isLoading: false,
  effectiveRoleInfo: ROLE_INFO,
  shouldShowSessionSuggest: false,
  handleMessageSend: () => {},
  showTaskExecutingWait: false,
  loadMoreRef: { current: null },
};

describe('数据线 × 渲染线四组合', () => {
  it.each([
    ['legacy', legacyMessageList],
    ['runtime', runtimeMessageList],
  ] as const)('%s 数据 + V1：按消息数渲染 ChatView', (_line, list) => {
    render(<ChatContentArea {...baseContentAreaProps} messageList={list} />);
    expect(screen.getAllByTestId('chat-view')).toHaveLength(list.length);
  });

  it.each([
    ['legacy', legacyMessageList],
    ['runtime', runtimeMessageList],
  ] as const)('%s 数据 + V2：轨迹 + 最终回答常显', (_line, list) => {
    render(
      <ConversationRendererV2
        messageList={list}
        conversationId={1}
        roleInfo={ROLE_INFO}
        messageBottomMode="chat"
        preferences={{ preset: 'balanced', nodeOverrides: {} }}
      />,
    );
    expect(screen.getByTestId('v2-trace-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('v2-final-answer')).toBeInTheDocument();
    expect(
      screen.getByTestId('chat-view').getAttribute('data-message-id'),
    ).toBe('u1');
  });

  it('两线投影等价：节点类型序列、工具数、耗时一致，最终回答各自取自 outputText', () => {
    const legacyTurns = projectConversation(legacyMessageList).turns;
    const runtimeTurns = projectConversation(runtimeMessageList).turns;
    expect(legacyTurns).toHaveLength(1);
    expect(runtimeTurns).toHaveLength(1);

    const kinds = (turns: typeof legacyTurns) =>
      turns[0].nodes.map((node) => node.kind);
    // 两线均：reasoning + tool；正文段因 outputText 已作回答，穿插原位为 narration
    expect(kinds(legacyTurns)).toEqual(['reasoning', 'tool', 'narration']);
    expect(kinds(runtimeTurns)).toEqual(['reasoning', 'tool', 'narration']);

    expect(legacyTurns[0].metrics.toolCount).toBe(1);
    expect(runtimeTurns[0].metrics.toolCount).toBe(1);
    expect(legacyTurns[0].metrics.elapsedMs).toBe(60000);
    expect(runtimeTurns[0].metrics.elapsedMs).toBe(60000);

    expect(legacyTurns[0].finalAnswer).toMatchObject({
      source: 'finalResult',
      text: '最终结论（legacy）',
    });
    expect(runtimeTurns[0].finalAnswer).toMatchObject({
      source: 'finalResult',
      text: '最终结论（runtime）',
    });
    // 正文段为 narration 节点（outputText 已作为回答，不重复）
    expect(
      legacyTurns[0].nodes.filter((n) => n.kind === 'narration'),
    ).toHaveLength(1);
    expect(
      runtimeTurns[0].nodes.filter((n) => n.kind === 'narration'),
    ).toHaveLength(1);
  });
});
