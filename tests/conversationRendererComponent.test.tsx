/**
 * V2 渲染器组件合同测试（specs/nuwax-conversation-renderer-v2.md「组件」栏）：
 * 三层折叠与默认态、三档预设、高级覆盖、隐藏恢复入口、运行摘要、终态默认、
 * 手动状态跨流式保持、键盘/ARIA、待回答卡独立（不进轨迹）、回答操作栏与
 * 复制范围、投影/渲染异常回退 V1。
 */
import type { ConversationRenderPreferencesV2 } from '@/features/conversation/presentation-v2';
import ConversationRendererV2 from '@/features/conversation/presentation-v2/react/ConversationRendererV2';
import { AgentComponentTypeEnum, AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const unifiedThemeState = vi.hoisted(() => ({
  antdTheme: 'light' as 'light' | 'dark',
}));

// ---- mock 重依赖（照 tests/interventionDock.test.tsx 的模板） ----
vi.mock('umi', () => ({
  useModel: () => ({}),
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...values: (string | number)[]) =>
    values.length ? `${key}:${values.join(',')}` : key,
  t: (key: string) => key,
}));
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  default: new Proxy({}, { get: () => 'cls' }),
}));
vi.mock('@/components/ChatView', () => ({
  default: ({ messageInfo }: { messageInfo: MessageInfo }) => (
    <div data-testid="chat-view" data-message-id={String(messageInfo.id)} />
  ),
}));
vi.mock('@/components/ChatView/RunOver', () => ({
  default: ({ messageInfo }: { messageInfo: MessageInfo }) => (
    <span data-testid="run-over" data-status={messageInfo.status ?? ''} />
  ),
}));
vi.mock('@/components/ChatView/ChatBottomDebug', () => ({
  default: ({ messageInfo }: { messageInfo: MessageInfo }) => (
    <span data-testid="chat-debug" data-message-id={String(messageInfo.id)} />
  ),
}));
vi.mock('@/components/base/CopyButton', () => ({
  default: ({
    text,
    children,
  }: {
    text?: string;
    children?: React.ReactNode;
  }) => (
    <button type="button" data-testid="copy-button" data-copy-text={text}>
      {children}
    </button>
  ),
}));
// 消息分享入口(useModel/services 传递依赖较重,测试中以占位替换)
vi.mock(
  '@/components/business-component/ConversationShareModal/ShareMessageButton',
  () => ({
    default: ({ text }: { text: string }) => (
      <span data-testid="share-message-btn" data-share-text={text} />
    ),
  }),
);
vi.mock('@/components/MarkdownRenderer', () => ({
  default: ({
    answer,
    theme,
  }: {
    answer: string;
    theme?: 'light' | 'dark';
  }) => (
    <div data-testid="markdown-renderer" data-theme={theme}>
      {answer}
    </div>
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
  useUnifiedTheme: () => ({
    data: { antdTheme: unifiedThemeState.antdTheme },
  }),
}));
vi.mock('@/features/conversation/presentation-v2/react/ToolNodeDetail', () => ({
  default: ({ node }: { node: { id: string; title: string } }) => {
    if (node.title === 'explode') {
      throw new Error('tool detail render explosion');
    }
    return (
      <div
        data-testid="tool-detail"
        data-execute-id={node.id}
        data-name={node.title}
      />
    );
  },
}));

const processTag = (attrs: {
  executeId?: string;
  type?: string;
  status?: string;
  name?: string;
}) => {
  const parts = [
    attrs.executeId && `executeId="${attrs.executeId}"`,
    attrs.type && `type="${attrs.type}"`,
    attrs.status && `status="${attrs.status}"`,
    attrs.name && `name="${encodeURIComponent(attrs.name || '')}"`,
  ].filter(Boolean);
  return `\n\n<div><markdown-custom-process ${parts.join(
    ' ',
  )}></markdown-custom-process></div>\n\n`;
};

const thinkTag = (status: 'thinking' | 'finished', content: string) =>
  `\n\n<div><markdown-custom-think status="${status}" content="${encodeURIComponent(
    content,
  )}"></markdown-custom-think></div>\n\n`;

const msg = (
  overrides: Partial<MessageInfo> & {
    id: string | number;
    role: AssistantRoleEnum;
  },
): MessageInfo =>
  ({
    text: '',
    time: '2026-08-30 00:00:00',
    componentExecutedList: [],
    messageType: 'ASSISTANT',
    index: 0,
    tenantId: 1,
    senderType: 'User',
    senderId: 'u1',
    userId: 1,
    agentId: 1,
    status: MessageStatusEnum.Complete,
    ...overrides,
  } as MessageInfo);

const ROLE_INFO: RoleInfo = {
  assistant: { name: 'Assistant', avatar: '' },
  system: { name: 'System', avatar: '' },
} as unknown as RoleInfo;

const PREFS = (
  preset: ConversationRenderPreferencesV2['preset'],
  nodeOverrides: ConversationRenderPreferencesV2['nodeOverrides'] = {},
): ConversationRenderPreferencesV2 => ({ preset, nodeOverrides });

/** 通用整轮：用户 + 思考 + 工具 + 中间说明 + 最终回答 */
const buildTurn = (overrides: Partial<MessageInfo> = {}): MessageInfo[] => [
  msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '帮我查一下天气' }),
  msg({
    id: 'a1',
    role: AssistantRoleEnum.ASSISTANT,
    text: [
      thinkTag('finished', '先想想要用哪个工具'),
      processTag({
        executeId: 'e1',
        type: 'Mcp',
        status: 'FINISHED',
        name: '查天气',
      }),
      '天气查询完成',
      thinkTag('finished', '整理最终结论'),
      '今天晴，25 度',
    ].join(''),
    processingList: [
      {
        executeId: 'e1',
        name: '查天气',
        type: AgentComponentTypeEnum.ToolCall,
        status: 'FINISHED',
        result: {
          executeId: 'e1',
          success: true,
          input: { city: '杭州' },
          data: '晴，25 度',
        },
      },
    ] as MessageInfo['processingList'],
    ...overrides,
  }),
];

const groupedToolText = (withSecondGroup = false) =>
  [
    processTag({
      executeId: 'read-1',
      type: 'ToolCall',
      status: 'FINISHED',
      name: '读取 package.json',
    }),
    processTag({
      executeId: 'run-1',
      type: 'ToolCall',
      status: 'FINISHED',
      name: '运行 npm test',
    }),
    ...(withSecondGroup
      ? [
          '第一阶段完成',
          processTag({
            executeId: 'edit-1',
            type: 'ToolCall',
            status: 'FINISHED',
            name: '编辑 index.tsx',
          }),
          processTag({
            executeId: 'run-2',
            type: 'ToolCall',
            status: 'EXECUTING',
            name: '运行 npm run test:conversation',
          }),
        ]
      : []),
  ].join('');

const groupedProcessingList = [
  {
    executeId: 'read-1',
    name: '读取 package.json',
    type: AgentComponentTypeEnum.ToolCall,
    status: 'FINISHED',
    result: {
      executeId: 'read-1',
      kind: 'read',
      success: true,
      input: { file_path: 'package.json', line_start: 1, line_end: 20 },
      data: '{ "scripts": {} }',
    },
  },
  {
    executeId: 'run-1',
    name: '运行 npm test',
    type: AgentComponentTypeEnum.ToolCall,
    status: 'FINISHED',
    result: {
      executeId: 'run-1',
      kind: 'execute',
      success: true,
      input: { command: 'npm test' },
      data: 'all tests passed',
    },
  },
  {
    executeId: 'edit-1',
    name: '编辑 index.tsx',
    type: AgentComponentTypeEnum.ToolCall,
    status: 'FINISHED',
    result: {
      executeId: 'edit-1',
      kind: 'edit',
      success: true,
      input: { file_path: 'src/index.tsx' },
      data: 'updated',
    },
  },
  {
    executeId: 'run-2',
    name: '运行 npm run test:conversation',
    type: AgentComponentTypeEnum.ToolCall,
    status: 'EXECUTING',
    result: {
      executeId: 'run-2',
      kind: 'execute',
      input: { command: 'npm run test:conversation' },
    },
  },
] as MessageInfo['processingList'];

const buildGroupedTurn = (
  withSecondGroup: boolean,
  status = MessageStatusEnum.Loading,
): MessageInfo[] => [
  msg({ id: 'u-group', role: AssistantRoleEnum.USER, text: '分组执行任务' }),
  msg({
    id: 'a-group',
    role: AssistantRoleEnum.ASSISTANT,
    status,
    text: groupedToolText(withSecondGroup),
    processingList: groupedProcessingList,
  }),
];

const renderV2 = (
  messageList: MessageInfo[],
  preferences = PREFS('balanced'),
  showDebug?: boolean,
) =>
  render(
    <ConversationRendererV2
      messageList={messageList}
      conversationId={1}
      roleInfo={ROLE_INFO}
      messageBottomMode="chat"
      preferences={preferences}
      showDebug={showDebug}
    />,
  );

afterEach(() => {
  unifiedThemeState.antdTheme = 'light';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('ConversationRendererV2 · 三层结构', () => {
  it('USER 独立气泡 + 轨迹 + 最终回答常显', () => {
    renderV2(buildTurn());
    // USER 走 ChatView（视觉零差异）
    expect(
      screen.getByTestId('chat-view').getAttribute('data-message-id'),
    ).toBe('u1');
    // 轨迹头与最终回答
    expect(screen.getByTestId('v2-trace-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('v2-final-answer')).toHaveTextContent(
      '今天晴，25 度',
    );
  });

  it('历史轮（首挂载即终态）默认收起，回答仍常显且可手动展开', () => {
    renderV2(buildTurn());
    const toggle = screen.getByTestId('v2-trace-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('v2-hidden-entry')).toBeNull();
    expect(screen.getByTestId('v2-final-answer')).toBeVisible();
    // 终态仍允许用户手动展开查看过程。
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('运行轮默认展开，工作时长沿用会话状态栏的用户消息起点与 MM:SS 格式', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-09T12:03:14+08:00'));
    const messages = buildTurn({ status: MessageStatusEnum.Loading });
    messages[0] = {
      ...messages[0],
      time: '2026-09-09T12:00:00+08:00',
    };
    renderV2(messages, PREFS('focused'));
    const toggle = screen.getByTestId('v2-trace-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(
      document.querySelector('[data-trace-running="true"]'),
    ).not.toBeNull();
    expect(toggle.textContent).toContain('traceMetricRunning:03:14');
    expect(toggle.textContent).not.toContain('traceMetricElapsed');
    expect(toggle.textContent).not.toContain('traceMetricTools');
    expect(toggle.textContent).not.toContain('traceMetricMessages');
    expect(toggle.lastElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('终态保留工具、消息与工作时长全量指标', () => {
    renderV2(
      buildTurn({
        finalResult: {
          outputText: '今天晴，25 度',
          success: true,
          startTime: 1000,
          endTime: 61_000,
          componentExecuteResults: [],
        } as unknown as MessageInfo['finalResult'],
      }),
    );
    const text = screen.getByTestId('v2-trace-toggle').textContent ?? '';
    expect(text).toContain('traceMetricTools');
    expect(text).toContain('traceMetricMessages');
    expect(text).toContain('traceMetricElapsed');
  });

  it('终态回答操作栏复用 V1 消息相对时间规则并固定在最右侧', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-04T12:00:00+08:00'));
    renderV2(
      buildTurn({
        time: '2026-09-03T08:00:00+08:00',
        finalResult: {
          outputText: '今天晴，25 度',
          success: true,
          startTime: 1000,
          endTime: 61_000,
          componentExecuteResults: [],
        } as unknown as MessageInfo['finalResult'],
      }),
    );
    const answerTime = screen.getByTestId('v2-answer-time');
    expect(answerTime).toHaveTextContent('PC.Utils.Common.yesterday');
    expect(answerTime.parentElement?.lastElementChild).toBe(answerTime);
  });

  it('普通会话默认不展示终态调试信息', () => {
    renderV2(buildTurn());

    expect(screen.queryByTestId('chat-debug')).toBeNull();
  });

  it('智能体开发调试场景可显式开启终态调试信息', () => {
    renderV2(buildTurn(), PREFS('balanced'), true);

    expect(screen.getByTestId('chat-debug')).toBeInTheDocument();
  });

  it('home 模式（默认入口）终态操作栏也显示：V1 由 ChatSampleBottom 提供复制+时间，V2 对齐', () => {
    // 不传 messageBottomMode，模拟 /home/chat 入口的默认渲染
    render(
      <ConversationRendererV2
        messageList={buildTurn({
          finalResult: {
            outputText: '今天晴，25 度',
            success: true,
            startTime: 1000,
            endTime: 61_000,
            componentExecuteResults: [],
          } as unknown as MessageInfo['finalResult'],
        })}
        conversationId={1}
        roleInfo={ROLE_INFO}
        preferences={PREFS('balanced')}
      />,
    );
    expect(screen.getByTestId('copy-button')).toBeInTheDocument();
    expect(screen.getByTestId('v2-answer-time')).toBeInTheDocument();
  });

  it('detailed 不改变历史轮收起规则，手动展开后已完成 reasoning 详情自动展开', () => {
    renderV2(buildTurn(), PREFS('detailed'));
    const traceToggle = screen.getByTestId('v2-trace-toggle');
    expect(traceToggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(traceToggle);
    // think 内容作为已完成节点默认展开（行摘要 + 详情两处可见）
    expect(
      screen.getAllByText('先想想要用哪个工具').length,
    ).toBeGreaterThanOrEqual(2);
  });
});

describe('ConversationRendererV2 · 三层折叠与手动状态保持', () => {
  it('点击轨迹头切换；流式增量不重置手动收起状态', async () => {
    const { rerender } = renderV2(
      buildTurn({ status: MessageStatusEnum.Loading }),
    );
    // 运行中默认展开
    expect(
      screen.getByTestId('v2-trace-toggle').getAttribute('aria-expanded'),
    ).toBe('true');
    // 用户手动收起
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    expect(
      screen.getByTestId('v2-trace-toggle').getAttribute('aria-expanded'),
    ).toBe('false');
    // 流式增量（新工具 + 更长正文）
    const streamed = buildTurn({
      status: MessageStatusEnum.Loading,
      text: [
        thinkTag('finished', '先想想要用哪个工具'),
        processTag({
          executeId: 'e1',
          type: 'Mcp',
          status: 'FINISHED',
          name: '查天气',
        }),
        '天气查询完成',
        thinkTag('finished', '整理最终结论'),
        processTag({
          executeId: 'e2',
          type: 'Plugin',
          status: 'EXECUTING',
          name: '画图',
        }),
        '今天晴，25 度，正在画图',
      ].join(''),
    });
    rerender(
      <ConversationRendererV2
        messageList={streamed}
        conversationId={1}
        roleInfo={ROLE_INFO}
        messageBottomMode="chat"
        preferences={PREFS('balanced')}
      />,
    );
    // 手动收起不被流式增量重置
    expect(
      screen.getByTestId('v2-trace-toggle').getAttribute('aria-expanded'),
    ).toBe('false');
    // 运行中重新手动展开
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    expect(
      screen.getByTestId('v2-trace-toggle').getAttribute('aria-expanded'),
    ).toBe('true');
    // 终态补齐（FINAL_RESULT）强制回到收起态
    const terminal = streamed.map((m) =>
      m.role === AssistantRoleEnum.ASSISTANT
        ? ({
            ...m,
            status: MessageStatusEnum.Complete,
            finalResult: {
              outputText: '最终：今天晴',
              success: true,
              componentExecuteResults: [],
            },
          } as unknown as MessageInfo)
        : m,
    );
    rerender(
      <ConversationRendererV2
        messageList={terminal}
        conversationId={1}
        roleInfo={ROLE_INFO}
        messageBottomMode="chat"
        preferences={PREFS('balanced')}
      />,
    );
    await waitFor(() => {
      expect(
        screen.getByTestId('v2-trace-toggle').getAttribute('aria-expanded'),
      ).toBe('false');
    });
    // 终态自动收起后仍可由用户再次展开
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    expect(
      screen.getByTestId('v2-trace-toggle').getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('节点行为原生 button（键盘 Enter/Space 由浏览器语义保证）且点击展开受限详情', async () => {
    const user = userEvent.setup();
    renderV2(buildTurn(), PREFS('detailed'));
    await user.click(screen.getByTestId('v2-trace-toggle'));
    const toolRow = document.querySelector('[data-node-id="e1"] button');
    expect(toolRow).not.toBeNull();
    // 原生 button：Enter/Space 激活由浏览器保证，无需自定义键盘处理
    expect(toolRow!.nodeName).toBe('BUTTON');
    expect(toolRow?.getAttribute('aria-expanded')).toBe('true');
    await user.click(toolRow!);
    expect(
      document
        .querySelector('[data-node-id="e1"] button')
        ?.getAttribute('aria-expanded'),
    ).toBe('false');
    await user.click(document.querySelector('[data-node-id="e1"] button')!);
    expect(
      document
        .querySelector('[data-node-id="e1"] button')
        ?.getAttribute('aria-expanded'),
    ).toBe('true');
    expect(
      screen.getByTestId('tool-detail').getAttribute('data-execute-id'),
    ).toBe('e1');
    // 轨迹头同样为原生 button 且带 aria-controls 联动
    const traceToggle = screen.getByTestId('v2-trace-toggle');
    expect(traceToggle.nodeName).toBe('BUTTON');
    expect(traceToggle.getAttribute('aria-controls')).toBe(
      `v2-trace-body-${document
        .querySelector('[data-trace-key]')
        ?.getAttribute('data-trace-key')}`,
    );
  });

  it('连续工具压缩为动作摘要组，活动尾组默认展开并逐条保序', () => {
    renderV2(buildGroupedTurn(false));
    const group = document.querySelector(
      '[data-tool-group-id="tool-group:read-1"]',
    );
    expect(group).not.toBeNull();
    expect(group?.getAttribute('data-tool-group-active')).toBe('true');
    const toggle = group?.querySelector('button');
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(toggle?.textContent).toContain('toolActionFileReadFinished');
    expect(toggle?.textContent).toContain('toolActionTerminalFinished');
    expect(
      Array.from(group?.querySelectorAll('[data-node-id]') ?? []).map((item) =>
        item.getAttribute('data-node-id'),
      ),
    ).toEqual(['read-1', 'run-1']);
  });

  it('正文开启新工具组时旧活动组自动收起一次，用户重开后保持手动状态', async () => {
    const view = renderV2(buildGroupedTurn(false));
    view.rerender(
      <ConversationRendererV2
        messageList={buildGroupedTurn(true)}
        conversationId={1}
        roleInfo={ROLE_INFO}
        messageBottomMode="chat"
        preferences={PREFS('balanced')}
      />,
    );

    const oldGroupSelector =
      '[data-tool-group-id="tool-group:read-1"] > button';
    const activeGroupSelector =
      '[data-tool-group-id="tool-group:edit-1"] > button';
    await waitFor(() => {
      expect(
        document.querySelector(oldGroupSelector)?.getAttribute('aria-expanded'),
      ).toBe('false');
      expect(
        document
          .querySelector(activeGroupSelector)
          ?.getAttribute('aria-expanded'),
      ).toBe('true');
    });

    fireEvent.click(document.querySelector(oldGroupSelector)!);
    expect(
      document.querySelector(oldGroupSelector)?.getAttribute('aria-expanded'),
    ).toBe('true');

    // 外层收起再打开不会卸掉组级手动状态。
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    expect(
      document.querySelector(oldGroupSelector)?.getAttribute('aria-expanded'),
    ).toBe('true');
  });

  it('终态历史组默认收起，打开整轮后组内详情仍由第三层独立控制', () => {
    renderV2(buildGroupedTurn(false, MessageStatusEnum.Complete));
    const traceToggle = screen.getByTestId('v2-trace-toggle');
    expect(traceToggle.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(traceToggle);
    const groupToggle = document.querySelector(
      '[data-tool-group-id="tool-group:read-1"] > button',
    );
    expect(groupToggle?.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(groupToggle!);
    const itemToggle = document.querySelector('[data-node-id="read-1"] button');
    expect(itemToggle?.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(itemToggle!);
    expect(
      document
        .querySelector('[data-node-id="read-1"] button')
        ?.getAttribute('aria-expanded'),
    ).toBe('true');
    fireEvent.click(traceToggle);
    fireEvent.click(traceToggle);
    expect(
      document
        .querySelector('[data-tool-group-id="tool-group:read-1"] > button')
        ?.getAttribute('aria-expanded'),
    ).toBe('true');
    expect(
      document
        .querySelector('[data-node-id="read-1"] button')
        ?.getAttribute('aria-expanded'),
    ).toBe('true');
  });
});

describe('ConversationRendererV2 · 预设与高级覆盖', () => {
  it('focused 隐藏思考：隐藏入口「另有 N 项已隐藏」可恢复；narration 不受预设影响', async () => {
    renderV2(buildTurn(), PREFS('focused'));
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    const entry = screen.getByTestId('v2-hidden-entry');
    // 仅 reasoning 两项被隐藏（narration 已直出，不再是可隐藏节点）
    expect(entry).toHaveTextContent(
      'PC.Components.ConversationRendererV2.hiddenEntry:2',
    );
    expect(screen.queryByText('先想要用哪个工具')).toBeNull();
    fireEvent.click(entry);
    // 恢复后节点全部可见
    expect(screen.queryByTestId('v2-hidden-entry')).toBeNull();
    expect(
      document.querySelector('[data-node-kind="reasoning"]'),
    ).not.toBeNull();
    // 过程说明直出：不是节点行，focused 预设下依然可见
    expect(document.querySelector('[data-node-kind="narration"]')).toBeNull();
    expect(screen.getByTestId('v2-narration').textContent).toContain(
      '天气查询完成',
    );
  });

  it('过程说明穿插直出在轨迹体原位（工具之间），展开即见正文；narration-only 终态轮无空轨迹条', () => {
    renderV2(buildTurn());
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    const trace = document.querySelector('[data-trace-key]');
    const narration = screen.getByTestId('v2-narration');
    const answer = screen.getByTestId('v2-final-answer');
    // DOM 顺序：轨迹条 → narration（体内穿插）→ 最终回答
    expect(
      Boolean(
        trace &&
          narration.compareDocumentPosition(trace) &
            Node.DOCUMENT_POSITION_PRECEDING,
      ),
    ).toBe(true);
    expect(
      narration.compareDocumentPosition(answer) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    // 穿插位置：narration 在轨迹体内（trace-body 的后代），且不再是节点行
    expect(narration.closest('[data-trace-key]')).not.toBeNull();
    expect(document.querySelector('[data-node-kind="narration"]')).toBeNull();

    // narration-only 终态轮：无轨迹条、无节点行，正文直接展示
    renderV2([
      msg({ id: 'u2', role: AssistantRoleEnum.USER, text: '只说话' }),
      msg({
        id: 'a2',
        role: AssistantRoleEnum.ASSISTANT,
        text: '只有中间说明',
      }),
    ]);
    expect(document.querySelectorAll('[data-trace-key]').length).toBe(1); // 仅首轮有轨迹
    expect(screen.getAllByTestId('v2-narration').length).toBeGreaterThan(0);
  });

  it('高级覆盖：tool=expanded 使已完成工具节点详情默认展开', () => {
    renderV2(buildTurn(), PREFS('balanced', { tool: 'expanded' }));
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    const toolRow = document.querySelector('[data-node-id="e1"] button');
    expect(toolRow?.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('tool-detail')).toBeInTheDocument();
  });

  it('失败节点即使配置隐藏也至少恢复为错误摘要行', () => {
    const failed = [
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: processTag({
          executeId: 'bad',
          type: 'Mcp',
          status: 'FAILED',
          name: '坏工具',
        }),
        processingList: [
          {
            executeId: 'bad',
            name: '坏工具',
            type: 'Mcp',
            status: 'FAILED',
            result: { executeId: 'bad', success: false },
          },
        ] as MessageInfo['processingList'],
      }),
    ];
    renderV2(failed, PREFS('focused', { tool: 'hidden' }));
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    const row = document.querySelector('[data-node-id="bad"]');
    expect(row).not.toBeNull();
  });
});

describe('ConversationRendererV2 · 回答与异常', () => {
  it('停止轮无正文：只显示停止状态，不冒充回答；操作栏不出现', () => {
    renderV2([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: processTag({
          executeId: 'e1',
          type: 'Plugin',
          status: 'FINISHED',
        }),
        status: MessageStatusEnum.Stopped,
      }),
    ]);
    expect(screen.getByTestId('v2-final-answer')).toHaveTextContent(
      'PC.Components.ConversationRendererV2.answerStopped',
    );
    expect(screen.queryByTestId('copy-button')).toBeNull();
  });

  it('正常完成但空回答（0/0/0 空轮）：显示空回答提示，不留无声空白', () => {
    renderV2([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({ id: 'a1', role: AssistantRoleEnum.ASSISTANT, text: '' }),
    ]);
    expect(screen.getByTestId('v2-final-answer')).toHaveTextContent(
      'PC.Components.ConversationRendererV2.answerEmpty',
    );
    // 无正文无操作栏
    expect(screen.queryByTestId('copy-button')).toBeNull();
  });

  it('运行中空回答：不显示空回答提示（等待流式填充实时回答）', () => {
    renderV2([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '',
        status: MessageStatusEnum.Loading,
      }),
    ]);
    expect(screen.getByTestId('v2-final-answer')).not.toHaveTextContent(
      'PC.Components.ConversationRendererV2.answerEmpty',
    );
  });

  it('运行中节点保留类型图标：行尾 spinner 指示活动，不吞类型语义', () => {
    renderV2(
      buildTurn({
        status: MessageStatusEnum.Loading,
        text: [
          processTag({
            executeId: 'r1',
            type: 'Mcp',
            status: 'EXECUTING',
            name: '跑着的工具',
          }),
        ].join(''),
      }),
    );
    const row = document.querySelector('[data-node-id="r1"]');
    expect(row).not.toBeNull();
    // 前导仍为类型图标（tool），活动指示由行尾 loading spinner 承担
    expect(row!.querySelector('span[aria-label="tool"]')).not.toBeNull();
    expect(row!.querySelector('span[aria-label="loading"]')).not.toBeNull();
  });

  it('操作栏只归属最终回答：复制内容不含隐藏过程', () => {
    renderV2(buildTurn());
    const copy = screen.getByTestId('copy-button');
    expect(copy.getAttribute('data-copy-text')).toBe('今天晴，25 度');
  });

  it('最终回答 Markdown 跟随统一深色主题', () => {
    unifiedThemeState.antdTheme = 'dark';
    renderV2(buildTurn());
    expect(screen.getByTestId('markdown-renderer')).toHaveAttribute(
      'data-theme',
      'dark',
    );
  });

  it('投影异常时整份回退 V1（data-v2-fallback 且 ChatView 列表可见）', () => {
    const explosive = {
      ...msg({ id: 'a1', role: AssistantRoleEnum.ASSISTANT }),
      get text() {
        throw new Error('projection boom');
      },
    } as unknown as MessageInfo;
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    renderV2([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      explosive,
    ]);
    expect(document.querySelector('[data-v2-fallback="v1"]')).not.toBeNull();
    expect(screen.getAllByTestId('chat-view')).toHaveLength(2);
    expect(consoleError).toHaveBeenCalled();
  });

  it('渲染异常（节点详情抛错）触发 ErrorBoundary 整份回退 V1', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    renderV2(
      [
        msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
        msg({
          id: 'a1',
          role: AssistantRoleEnum.ASSISTANT,
          text: processTag({
            executeId: 'boom',
            type: 'Mcp',
            status: 'FINISHED',
            name: 'explode',
          }),
          processingList: [
            {
              executeId: 'boom',
              name: 'explode',
              type: AgentComponentTypeEnum.ToolCall,
              status: 'FINISHED',
              result: {
                executeId: 'boom',
                success: true,
                input: { description: '触发详情渲染' },
                data: 'boom',
              },
            },
          ] as MessageInfo['processingList'],
        }),
      ],
      PREFS('balanced', { tool: 'expanded' }),
    );
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    await waitFor(() => {
      expect(document.querySelector('[data-v2-fallback="v1"]')).not.toBeNull();
    });
    expect(consoleError).toHaveBeenCalled();
  });

  it('渲染异常回退只影响当前会话，切换会话后重新尝试 V2', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const broken = [
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: processTag({
          executeId: 'boom',
          type: 'Mcp',
          status: 'FINISHED',
          name: 'explode',
        }),
        processingList: [
          {
            executeId: 'boom',
            name: 'explode',
            type: AgentComponentTypeEnum.ToolCall,
            status: 'FINISHED',
            result: {
              executeId: 'boom',
              success: true,
              input: { description: '触发详情渲染' },
              data: 'boom',
            },
          },
        ] as MessageInfo['processingList'],
      }),
    ];
    const view = render(
      <ConversationRendererV2
        messageList={broken}
        conversationId={1}
        roleInfo={ROLE_INFO}
        preferences={PREFS('balanced', { tool: 'expanded' })}
      />,
    );
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    await waitFor(() => {
      expect(document.querySelector('[data-v2-fallback="v1"]')).not.toBeNull();
    });

    view.rerender(
      <ConversationRendererV2
        messageList={buildTurn()}
        conversationId={2}
        roleInfo={ROLE_INFO}
        preferences={PREFS('balanced')}
      />,
    );
    await waitFor(() => {
      expect(document.querySelector('[data-v2-fallback="v1"]')).toBeNull();
      expect(screen.getByTestId('v2-trace-toggle')).toBeInTheDocument();
    });
    expect(consoleError).toHaveBeenCalled();
  });
});

describe('ConversationRendererV2 · 无障碍（验收返工 P2）', () => {
  it('节点行装饰图标对读屏隐藏（aria-hidden），按钮名称只含标题与摘要', () => {
    renderV2(buildTurn(), PREFS('detailed'));
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    const toolRow = document.querySelector('[data-node-id="e1"] button')!;
    const icons = toolRow.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(1);
    const name =
      toolRow.getAttribute('aria-label') ?? toolRow.textContent ?? '';
    expect(name).not.toMatch(/caret-right|bulb|check-circle/i);
  });

  it('轨迹折叠头图标隐藏，名称为指标文本', () => {
    renderV2(buildTurn());
    const toggle = screen.getByTestId('v2-trace-toggle');
    expect(toggle.querySelector('[aria-hidden="true"]')).not.toBeNull();
    expect(toggle.textContent).toContain('traceMetricTools');
    const trace = toggle.closest('[data-trace-key]') as HTMLElement;
    expect(trace.style.getPropertyValue('--v2-color-text-secondary')).not.toBe(
      '',
    );
  });

  it('可展开节点有独立 disclosure 箭头并跟随状态旋转', () => {
    renderV2(buildTurn(), PREFS('detailed'));
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    const toolRow = document.querySelector('[data-node-id="e1"] button')!;
    const disclosure = toolRow.querySelector(
      '[data-testid="v2-node-disclosure"]',
    );
    expect(disclosure).not.toBeNull();
    expect(disclosure?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('ConversationRendererV2 · 用户气泡超限折叠', () => {
  const stubScrollHeight = (value: number) => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return value;
      },
    });
    return () =>
      Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
        configurable: true,
        get() {
          return 0;
        },
      });
  };

  it('内容高超 200px：默认收起（clamped），点击展开/收起切换', async () => {
    const restore = stubScrollHeight(600);
    const user = userEvent.setup();
    renderV2([
      msg({
        id: 'u1',
        role: AssistantRoleEnum.USER,
        text: '很长很长的用户输入'.repeat(60),
      }),
      msg({ id: 'a1', role: AssistantRoleEnum.ASSISTANT, text: '回答' }),
    ]);
    const content = screen.getByTestId('v2-user-bubble-content');
    const toggle = screen.getByTestId('v2-user-bubble-toggle');
    expect(content.getAttribute('data-collapsed')).toBe('true');
    expect(content.style.maxHeight).toBe('200px');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle).toHaveTextContent(
      'PC.Components.ConversationRendererV2.userBubbleExpand',
    );

    await user.click(toggle);
    expect(content.getAttribute('data-collapsed')).toBeNull();
    expect(content.style.maxHeight).toBe('');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle).toHaveTextContent(
      'PC.Components.ConversationRendererV2.userBubbleCollapse',
    );

    await user.click(toggle);
    expect(content.getAttribute('data-collapsed')).toBe('true');
    restore();
  });

  it('内容未超限：不出现折叠与切换入口', () => {
    const restore = stubScrollHeight(120);
    renderV2([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '短输入' }),
      msg({ id: 'a1', role: AssistantRoleEnum.ASSISTANT, text: '回答' }),
    ]);
    expect(screen.queryByTestId('v2-user-bubble-toggle')).toBeNull();
    expect(
      screen
        .getByTestId('v2-user-bubble-content')
        .getAttribute('data-collapsed'),
    ).toBeNull();
    restore();
  });
});
