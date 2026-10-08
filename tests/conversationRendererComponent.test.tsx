/**
 * V2 渲染器组件合同测试（specs/nuwax-conversation-renderer-v2.md「组件」栏）：
 * 三层折叠与默认态、三档预设、高级覆盖、隐藏恢复入口、运行摘要、终态默认、
 * 手动状态跨流式保持、键盘/ARIA、待回答卡独立（不进轨迹）、回答操作栏与
 * 复制范围、投影/渲染异常回退 V1。
 */
import type { ConversationRenderPreferencesV2 } from '@/features/conversation/presentation-v2';
import { __resetThinkTimingAnchorsForTest } from '@/features/conversation/presentation-v2/projectConversation';
import ConversationRendererV2 from '@/features/conversation/presentation-v2/react/ConversationRendererV2';
import { createConversationRuntimeSession } from '@/features/conversation/runtime/createConversationRuntimeSession';
import {
  appendThinkChunk,
  finalizeThinkBlock,
  hasOpenThinkBlock,
} from '@/plugins/ds-markdown-think';
// 行数阈值常量直接从组件取值：常量调参（并行调优）时测试无需跟着改硬编码
import {
  USER_BUBBLE_COLLAPSE_LINES,
  USER_BUBBLE_COLLAPSED_LINES,
  USER_BUBBLE_FALLBACK_LINE_HEIGHT,
} from '@/features/conversation/presentation-v2/react/UserBubbleCollapse';
import { AgentComponentTypeEnum, AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const unifiedThemeState = vi.hoisted(() => ({
  antdTheme: 'light' as 'light' | 'dark',
}));
const mockCreateSSEConnection = vi.hoisted(() => vi.fn());

vi.mock('@/utils/fetchEventSourceConversationInfo', () => ({
  createSSEConnection: (...args: unknown[]) => mockCreateSSEConnection(...args),
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
// SvgIcon 内部读自身 css-modules,vitest 环境未编译——以轻量桩替换
vi.mock('@/components/base/SvgIcon', () => ({
  default: ({ name }: { name: string }) => <span data-svg-icon={name} />,
}));
vi.mock('@/features/conversation/presentation-v2/react/index.less', () => ({
  // 返回真实 key 名：动效 class 等样式断言需要区分类名
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
// mock 结构对齐真实 ChatView 用户消息关键链路：附件区 + 灰底气泡(.ds-markdown)
// 内正文(.ds-markdown-answer)——UserBubbleCollapse 的阈值测量/截断/控件挂载都锚定它们。
// 正文不渲染 messageInfo.text 本身：投影异常用例的 text getter 会抛，fallback 渲染不能连带炸。
vi.mock('@/components/ChatView', () => ({
  default: ({ messageInfo }: { messageInfo: MessageInfo }) => (
    <div data-testid="chat-view" data-message-id={String(messageInfo.id)}>
      {!!messageInfo.attachments?.length && (
        <div data-testid="attach-files" className="attach-file-container" />
      )}
      <div className="ds-markdown">
        <div className="ds-markdown-answer">
          <div className="ds-markdown-paragraph" />
        </div>
      </div>
    </div>
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

beforeEach(() => {
  // 思考时长锚点是模块级会话内存；测试夹具复用同一 node id，用例间须清空
  __resetThinkTimingAnchorsForTest();
  mockCreateSSEConnection.mockReset().mockReturnValue(vi.fn());
});

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
] as NonNullable<MessageInfo['processingList']>;

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
    expect(screen.queryByTestId('v2-narration')).toBeNull();
    expect(screen.getByTestId('v2-final-answer')).toBeVisible();
    // 终态仍允许用户手动展开查看过程。
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('v2-narration')).toHaveTextContent(
      '天气查询完成',
    );
    fireEvent.click(toggle);
    expect(screen.queryByTestId('v2-narration')).toBeNull();
    expect(screen.getByTestId('v2-final-answer')).toHaveTextContent(
      '今天晴，25 度',
    );
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

  it('运行中的思考/工具行文案带扫光动效 class，终态行不带', () => {
    const messages = buildTurn({
      status: MessageStatusEnum.Loading,
      text: [
        thinkTag('thinking', '先想想要用哪个工具'),
        processTag({
          executeId: 'e-done',
          type: 'ToolCall',
          status: 'FINISHED',
          name: '查天气',
        }),
        processTag({
          executeId: 'e-running',
          type: 'ToolCall',
          status: 'EXECUTING',
          name: '运行测试',
        }),
      ].join(''),
      processingList: [
        {
          executeId: 'e-done',
          name: '查天气',
          type: AgentComponentTypeEnum.ToolCall,
          status: 'FINISHED',
        },
        {
          executeId: 'e-running',
          name: '运行测试',
          type: AgentComponentTypeEnum.ToolCall,
          status: 'EXECUTING',
        },
      ] as MessageInfo['processingList'],
    });
    renderV2(messages, PREFS('balanced'));
    // 收起的合并组只挂载摘要，思考也在组内。
    expect(document.querySelector('[data-node-kind="reasoning"]')).toBeNull();
    expect(
      document.querySelector(
        '[data-tool-group-id] > button [class*="shimmer"]',
      ),
    ).not.toBeNull();
    fireEvent.click(document.querySelector('[data-tool-group-id] > button')!);
    // 运行中思考行：标题/摘要挂扫光 class（css-modules 哈希用子串匹配；focused 预设下思考节点隐藏，用 balanced）
    const reasoningRow = document.querySelector('[data-node-kind="reasoning"]');
    expect(reasoningRow).not.toBeNull();
    expect(
      reasoningRow?.querySelectorAll('[class*="shimmer"]').length,
    ).toBeGreaterThan(0);
    expect(reasoningRow?.querySelector('[aria-label="loading"]')).toBeNull();
    // 运行中工具行同样挂扫光
    const runningToolRow = [
      ...document.querySelectorAll('[data-node-kind="tool"]'),
    ].find((row) => row.querySelector('[class*="shimmer"]'));
    expect(runningToolRow).toBeDefined();
    // 终态（finished）行不挂扫光
    const finishedRows = [
      ...document.querySelectorAll('[data-node-kind="tool"]'),
    ].filter((row) => !row.querySelector('[class*="shimmer"]'));
    expect(finishedRows.length).toBeGreaterThan(0);
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
    expect(screen.queryByTestId('v2-narration')).toBeNull();
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
    expect(screen.queryByTestId('v2-narration')).toBeNull();
    // 运行中重新手动展开
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    expect(
      screen.getByTestId('v2-trace-toggle').getAttribute('aria-expanded'),
    ).toBe('true');
    expect(screen.getByTestId('v2-narration')).toHaveTextContent(
      '天气查询完成',
    );
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
    expect(screen.queryByTestId('v2-narration')).toBeNull();
    expect(screen.getByTestId('v2-final-answer')).toHaveTextContent(
      '最终：今天晴',
    );
    // 终态自动收起后仍可由用户再次展开
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    expect(
      screen.getByTestId('v2-trace-toggle').getAttribute('aria-expanded'),
    ).toBe('true');
    expect(screen.getAllByTestId('v2-narration').length).toBeGreaterThan(0);
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
    const traceBodyId = traceToggle.getAttribute('aria-controls');
    expect(traceBodyId).toMatch(/^v2-trace-body-/);
    expect(document.getElementById(traceBodyId!)).toBeInTheDocument();
  });

  it('两个常驻会话的折叠控件指向各自唯一的内容区', () => {
    const messages = buildTurn();
    render(
      <>
        {[1, 2].map((conversationId) => (
          <ConversationRendererV2
            key={conversationId}
            messageList={messages}
            conversationId={conversationId}
            roleInfo={ROLE_INFO}
            preferences={PREFS('balanced')}
          />
        ))}
      </>,
    );
    const toggles = screen.getAllByTestId('v2-trace-toggle');
    const ids = toggles.map((toggle) => toggle.getAttribute('aria-controls'));
    expect(new Set(ids).size).toBe(2);
    ids.forEach((id) => {
      expect(document.getElementById(id!)).toBeInTheDocument();
    });
  });

  it('连续工具压缩为动作摘要组，活动尾组默认收起，首次点击展开且逐条保序', () => {
    renderV2(buildGroupedTurn(false));
    const group = document.querySelector(
      '[data-tool-group-id="tool-group:read-1"]',
    );
    expect(group).not.toBeNull();
    expect(group?.getAttribute('data-tool-group-active')).toBe('true');
    const toggle = group?.querySelector('button');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(group?.querySelector('[data-node-id]')).toBeNull();
    // 终态动作类按组内节点数计数（2026-09-19 组头计数定调）
    expect(toggle?.textContent).toContain('toolGroupCountFileRead');
    expect(toggle?.textContent).toContain('toolGroupCountTerminal');
    fireEvent.click(toggle!);
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(
      Array.from(group?.querySelectorAll('[data-node-id]') ?? []).map((item) =>
        item.getAttribute('data-node-id'),
      ),
    ).toEqual(['read-1', 'run-1']);
  });

  it.each([
    ['balanced', MessageStatusEnum.Loading],
    ['focused', MessageStatusEnum.Loading],
    ['balanced', MessageStatusEnum.Complete],
    ['focused', MessageStatusEnum.Complete],
  ] as const)(
    '%s / %s：交替工具与思考形成收起组，组标题只统计工具，展开后保留原序',
    (preset, status) => {
      const text = [
        thinkTag('finished', '先检查项目'),
        processTag({
          executeId: 'read-1',
          type: 'ToolCall',
          status: 'FINISHED',
        }),
        thinkTag('finished', '读取完成，继续验证'),
        processTag({
          executeId: 'run-1',
          type: 'ToolCall',
          status: 'FINISHED',
        }),
        thinkTag('finished', '验证完成，修改文件'),
        processTag({
          executeId: 'edit-1',
          type: 'ToolCall',
          status: 'FINISHED',
        }),
        thinkTag('finished', '整理修改结果'),
      ].join('');
      renderV2(
        buildTurn({
          status,
          text,
          processingList: groupedProcessingList,
        }),
        PREFS(preset),
      );
      if (status === MessageStatusEnum.Complete) {
        expect(screen.getByTestId('v2-trace-toggle')).toHaveAttribute(
          'aria-expanded',
          'false',
        );
        fireEvent.click(screen.getByTestId('v2-trace-toggle'));
      }
      expect(screen.getByTestId('v2-trace-toggle')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      expect(document.querySelectorAll('[data-tool-group-id]')).toHaveLength(1);
      const group = document.querySelector('[data-tool-group-id]')!;
      const toggle = group.querySelector('button')!;
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(toggle).toHaveTextContent('toolGroupCountFileRead:1');
      expect(toggle).toHaveTextContent('toolGroupCountTerminal:1');
      expect(toggle).toHaveTextContent('toolGroupCountFileEdit:1');
      expect(toggle).not.toHaveTextContent('toolGroupCountGeneric');
      expect(group.querySelector('[data-node-id]')).toBeNull();
      fireEvent.click(toggle);
      const kinds = [...group.querySelectorAll('[data-node-kind]')].map(
        (node) => node.getAttribute('data-node-kind'),
      );
      expect(kinds).toEqual(
        preset === 'focused'
          ? ['tool', 'tool', 'tool']
          : [
              'reasoning',
              'tool',
              'reasoning',
              'tool',
              'reasoning',
              'tool',
              'reasoning',
            ],
      );
      expect(
        [...group.querySelectorAll('[data-node-kind="tool"]')].map((node) =>
          node.getAttribute('data-node-id'),
        ),
      ).toEqual(['read-1', 'run-1', 'edit-1']);
    },
  );

  it('工具被隐藏时保留组内思考，恢复隐藏内容后仍以收起组展示', () => {
    const text = [
      processTag({ executeId: 'read-1', type: 'ToolCall', status: 'FINISHED' }),
      thinkTag('finished', '读取完成，继续验证'),
      processTag({ executeId: 'run-1', type: 'ToolCall', status: 'FINISHED' }),
    ].join('');
    renderV2(
      buildTurn({
        status: MessageStatusEnum.Loading,
        text,
        processingList: groupedProcessingList,
      }),
      PREFS('balanced', { tool: 'hidden' }),
    );
    expect(document.querySelector('[data-tool-group-id]')).toBeNull();
    expect(
      document.querySelectorAll('[data-node-kind="reasoning"]'),
    ).toHaveLength(1);
    fireEvent.click(screen.getByTestId('v2-hidden-entry'));
    expect(document.querySelectorAll('[data-tool-group-id]')).toHaveLength(1);
    expect(
      document.querySelector('[data-tool-group-id] > button'),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('手动展开后追加思考或工具都留在同组，保持展开和原有组 ID', () => {
    const toolText = (executeId: string) =>
      processTag({ executeId, type: 'ToolCall', status: 'FINISHED' });
    const initialText = toolText('read-1') + toolText('run-1');
    const firstThinkText = initialText + thinkTag('finished', '准备修改');
    const view = renderV2(
      buildTurn({
        status: MessageStatusEnum.Loading,
        text: initialText,
        processingList: groupedProcessingList,
      }),
    );
    const toggle = () =>
      document.querySelector(
        '[data-tool-group-id="tool-group:read-1"] > button',
      )!;
    const rerender = (text: string) =>
      view.rerender(
        <ConversationRendererV2
          messageList={buildTurn({
            status: MessageStatusEnum.Loading,
            text,
            processingList: groupedProcessingList,
          })}
          conversationId={1}
          roleInfo={ROLE_INFO}
          preferences={PREFS('balanced')}
        />,
      );
    fireEvent.click(toggle());
    rerender(firstThinkText);
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    const appendedText = firstThinkText + toolText('edit-1');
    rerender(appendedText);
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(
      [
        ...document.querySelectorAll('[data-tool-group-id] [data-node-kind]'),
      ].map((node) => node.getAttribute('data-node-kind')),
    ).toEqual(['tool', 'tool', 'reasoning', 'tool']);
    rerender(appendedText + thinkTag('thinking', '整理结论'));
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
    expect(
      document.querySelector(
        '[data-tool-group-id] > button [class*="shimmer"]',
      ),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-node-kind="reasoning"]:last-child'),
    ).not.toBeNull();
  });

  it('正文开启新工具组时旧活动组自动收起一次，用户重开后保持手动状态', async () => {
    const view = renderV2(buildGroupedTurn(false));
    // 用户主动打开活动组后，被新段超越仍应自动收起一次。
    fireEvent.click(
      document.querySelector(
        '[data-tool-group-id="tool-group:read-1"] > button',
      )!,
    );
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
    const oldSegmentSelector =
      '[data-trace-segment-id="trace-segment:read-1"] > button';
    const activeGroupSelector =
      '[data-tool-group-id="tool-group:edit-1"] > button';
    await waitFor(() => {
      expect(
        document
          .querySelector(oldSegmentSelector)
          ?.getAttribute('aria-expanded'),
      ).toBe('false');
      expect(
        document
          .querySelector(activeGroupSelector)
          ?.getAttribute('aria-expanded'),
      ).toBe('false');
    });
    const activeGroup = document.querySelector(
      '[data-tool-group-id="tool-group:edit-1"]',
    );
    expect(activeGroup?.querySelector('button')?.textContent).toContain(
      'toolActionTerminalRunning',
    );
    expect(activeGroup?.querySelector('[aria-label="loading"]')).toBeNull();

    fireEvent.click(document.querySelector(oldSegmentSelector)!);
    expect(
      document.querySelector(oldGroupSelector)?.getAttribute('aria-expanded'),
    ).toBe('false');
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

  it('live 外层自动展开，仅内部多工具组默认收起，增量只更新组摘要', () => {
    const ids = ['read-1', 'run-1', 'edit-1', 'run-2'];
    const buildMessages = (count: number, lastFinished = false) => {
      const messages = buildGroupedTurn(false);
      messages[1] = {
        ...messages[1],
        text: ids
          .slice(0, count)
          .map((executeId) =>
            processTag({ executeId, type: 'ToolCall', status: 'FINISHED' }),
          )
          .join(''),
        processingList: groupedProcessingList.map((item) =>
          item.executeId === 'run-2' && lastFinished
            ? { ...item, status: 'FINISHED' }
            : item,
        ) as MessageInfo['processingList'],
      };
      return messages;
    };
    const view = renderV2(buildMessages(1));
    const rerender = (count: number, lastFinished = false) =>
      view.rerender(
        <ConversationRendererV2
          messageList={buildMessages(count, lastFinished)}
          conversationId={1}
          roleInfo={ROLE_INFO}
          preferences={PREFS('balanced')}
        />,
      );
    const expectLiveOuterExpanded = () => {
      expect(screen.getByTestId('v2-trace-toggle')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      expect(
        document.querySelector('[data-trace-segment-active="true"]'),
      ).toHaveAttribute('data-trace-segment-expanded', 'true');
    };
    expectLiveOuterExpanded();
    expect(document.querySelector('[data-tool-group-id]')).toBeNull();
    expect(document.querySelector('[data-node-id="read-1"]')).not.toBeNull();
    for (const count of [2, 3, 4]) {
      rerender(count);
      expectLiveOuterExpanded();
      expect(document.querySelectorAll('[data-tool-group-id]')).toHaveLength(1);
      expect(
        document.querySelector('[data-tool-group-id] > button'),
      ).toHaveAttribute('aria-expanded', 'false');
      expect(
        document.querySelector('[data-tool-group-id] [data-node-id]'),
      ).toBeNull();
    }
    expect(
      document.querySelector('[data-tool-group-id] > button'),
    ).toHaveTextContent('toolActionTerminalRunning');
    expect(
      document.querySelector(
        '[data-tool-group-id] > button [class*="shimmer"]',
      ),
    ).not.toBeNull();
    rerender(4, true);
    // 工具已结束但整轮仍在 live，外层不因此收起。
    expectLiveOuterExpanded();
    expect(
      document.querySelector('[data-tool-group-id] > button'),
    ).toHaveTextContent('toolGroupCountTerminal:2');
    expect(
      document.querySelector(
        '[data-tool-group-id] > button [class*="shimmer"]',
      ),
    ).toBeNull();
    expect(
      document.querySelector('[data-tool-group-id] > button'),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      document.querySelector('[data-tool-group-id] [data-node-id]'),
    ).toBeNull();
  });

  it.each([
    ['带用户消息的历史快照', true, false],
    ['没有用户消息的分页半轮', false, false],
    ['含执行中助手消息的半途快照', true, true],
  ] as const)(
    'sub 续接%s：外层自动展开，内部工具组合并后默认折叠',
    (_, hasUser, hasRunningHistory) => {
      let messages = hasUser
        ? [msg({ id: 'sub-user', role: AssistantRoleEnum.USER, index: 42 })]
        : [];
      if (hasRunningHistory) {
        messages.push(
          msg({
            id: 'sub-partial-history',
            role: AssistantRoleEnum.ASSISTANT,
            index: 43,
            status: MessageStatusEnum.Loading,
            text: '恢复前的分析。',
          }),
        );
      }
      const session = createConversationRuntimeSession({
        effectsAdapter: { dispatch: vi.fn() },
        adapters: {
          thinkBlock: {
            appendThinkChunk,
            finalizeThinkBlock,
            hasOpenThinkBlock,
          },
          renderProcessingBlock: (text, processing) =>
            text +
            processTag({
              executeId: processing.executeId,
              type: processing.type,
              status: processing.status,
              name: processing.name,
            }),
          reconcileFinalMessage: (message) => message,
        },
      });
      session.store.update(() => messages);
      const view = renderV2(messages);
      const rerender = () => {
        messages = session.store.getSnapshot();
        view.rerender(
          <ConversationRendererV2
            messageList={messages}
            conversationId={1}
            roleInfo={ROLE_INFO}
            preferences={PREFS('balanced')}
          />,
        );
      };
      session.resumeConversationStream(1, messages);
      const subscription = mockCreateSSEConnection.mock.calls[0][0];
      expect(subscription).toMatchObject({ method: 'GET' });
      expect(subscription.url).toMatch(/\/chat\/sub\/1$/);
      rerender();
      const expectOuterExpanded = () =>
        expect(screen.getByTestId('v2-trace-toggle')).toHaveAttribute(
          'aria-expanded',
          'true',
        );
      expectOuterExpanded();
      const receive = (event: ConversationChatResponse) => {
        subscription.onMessage(event);
        rerender();
      };
      const receiveTool = (index: number) =>
        receive({
          eventType: 'PROCESSING',
          requestId: 'sub-request',
          data: {
            ...groupedProcessingList[index],
            executeId: `sub-tool-${index + 1}`,
            result: {
              ...groupedProcessingList[index].result,
              executeId: `sub-tool-${index + 1}`,
            },
          },
        } as ConversationChatResponse);
      const receiveThink = (text: string) =>
        receive({
          eventType: 'MESSAGE',
          requestId: 'sub-request',
          data: { role: 'ASSISTANT', type: 'THINK', text, finished: true },
        } as ConversationChatResponse);
      receiveThink('恢复后先检查项目');
      receiveTool(0);
      expectOuterExpanded();
      expect(document.querySelector('[data-tool-group-id]')).toBeNull();
      expect(
        document.querySelector('[data-node-id="sub-tool-1"]'),
      ).not.toBeNull();
      receiveThink('续接中继续验证');
      receiveTool(1);
      expectOuterExpanded();
      expect(
        document.querySelector('[data-trace-segment-active="true"]'),
      ).toHaveAttribute('data-trace-segment-expanded', 'true');
      const groupToggle = document.querySelector(
        '[data-tool-group-id] > button',
      )!;
      expect(groupToggle).toHaveAttribute('aria-expanded', 'false');
      expect(
        document.querySelector('[data-tool-group-id] [data-node-id]'),
      ).toBeNull();
      fireEvent.click(groupToggle);
      receiveTool(2);
      receiveThink('准备整理结论');
      expectOuterExpanded();
      expect(groupToggle).toHaveAttribute('aria-expanded', 'true');
      expect(
        [
          ...document.querySelectorAll(
            '[data-tool-group-id] [data-node-kind="tool"]',
          ),
        ].map((node) => node.getAttribute('data-node-id')),
      ).toEqual(['sub-tool-1', 'sub-tool-2', 'sub-tool-3']);
      expect(
        [
          ...document.querySelectorAll('[data-tool-group-id] [data-node-kind]'),
        ].map((node) => node.getAttribute('data-node-kind')),
      ).toEqual([
        'reasoning',
        'tool',
        'reasoning',
        'tool',
        'tool',
        'reasoning',
      ]);
      receive({
        eventType: 'FINAL_RESULT',
        requestId: 'sub-request',
        completed: true,
        data: { success: true, outputText: '续接任务完成。' },
      } as ConversationChatResponse);
      expect(screen.getByTestId('v2-trace-toggle')).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      fireEvent.click(screen.getByTestId('v2-trace-toggle'));
      expect(
        document.querySelector('[data-tool-group-id] > button'),
      ).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getByTestId('v2-final-answer')).toHaveTextContent(
        '续接任务完成。',
      );
      session.abortResumeStream();
    },
  );

  it('手动展开后追加同组工具保持展开，结束后自动收起整轮与工具组', () => {
    const messages = buildGroupedTurn(false);
    const view = renderV2(messages);
    fireEvent.click(document.querySelector('[data-tool-group-id] > button')!);
    const appended = [
      { ...messages[0] },
      {
        ...messages[1],
        text: `${messages[1].text}${processTag({
          executeId: 'edit-1',
          type: 'ToolCall',
          status: 'FINISHED',
        })}`,
      },
    ];
    const rerender = (messageList: MessageInfo[]) =>
      view.rerender(
        <ConversationRendererV2
          messageList={messageList}
          conversationId={1}
          roleInfo={ROLE_INFO}
          preferences={PREFS('balanced')}
        />,
      );
    rerender(appended);
    expect(
      document.querySelector('[data-tool-group-id] > button'),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(
      [...document.querySelectorAll('[data-tool-group-id] [data-node-id]')].map(
        (node) => node.getAttribute('data-node-id'),
      ),
    ).toEqual(['read-1', 'run-1', 'edit-1']);
    rerender([
      appended[0],
      {
        ...appended[1],
        status: MessageStatusEnum.Complete,
        text: `${appended[1].text}任务完成。`,
      },
    ]);
    const traceToggle = screen.getByTestId('v2-trace-toggle');
    expect(traceToggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(traceToggle);
    expect(
      document.querySelector('[data-tool-group-id] > button'),
    ).toHaveAttribute('aria-expanded', 'false');
    expect(
      document.querySelector('[data-tool-group-id] [data-node-id]'),
    ).toBeNull();
  });

  it('普通正文首片立即将交替思考和工具折叠为该段汇总，手动重开跨后续正文和新段保持', () => {
    const processText = [
      processTag({ executeId: 'read-1', type: 'ToolCall', status: 'FINISHED' }),
      thinkTag('finished', '文件已读取，继续验证'),
      processTag({ executeId: 'run-1', type: 'ToolCall', status: 'FINISHED' }),
      thinkTag('finished', '验证完成，整理结论'),
    ].join('');
    const buildMessages = (text: string) =>
      buildTurn({
        status: MessageStatusEnum.Loading,
        text,
        processingList: groupedProcessingList,
      });
    const view = renderV2(buildMessages(processText));
    const rerender = (text: string) =>
      view.rerender(
        <ConversationRendererV2
          messageList={buildMessages(text)}
          conversationId={1}
          roleInfo={ROLE_INFO}
          preferences={PREFS('balanced')}
        />,
      );
    // 同段思考与工具一起合并收起。
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(0);
    expect(screen.queryByTestId('v2-trace-segment-toggle')).toBeNull();

    rerender(`${processText}这一阶段已完成`);
    const summary = screen.getByTestId('v2-trace-segment-toggle');
    expect(summary).toHaveAttribute('aria-expanded', 'false');
    expect(summary).toHaveTextContent('traceMetricTools:2');
    expect(summary).toHaveTextContent('traceMetricMessages:2');
    expect(summary).not.toHaveTextContent('traceMetricRunning');
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(0);
    expect(screen.getByTestId('v2-final-answer')).toHaveTextContent(
      '这一阶段已完成',
    );

    fireEvent.click(summary);
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(0);
    fireEvent.click(document.querySelector('[data-tool-group-id] > button')!);
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(4);
    const thinkToggle = document.querySelector(
      '[data-node-kind="reasoning"] button',
    )!;
    const thinkId = thinkToggle
      .closest('[data-node-id]')!
      .getAttribute('data-node-id');
    fireEvent.click(thinkToggle);
    rerender(`${processText}这一阶段已完成，接下来优化`);
    expect(screen.getByTestId('v2-trace-segment-toggle')).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    const newProcessText =
      processTag({
        executeId: 'edit-1',
        type: 'ToolCall',
        status: 'FINISHED',
      }) + thinkTag('thinking', '现在检查下一阶段');
    rerender(`${processText}这一阶段已完成，接下来优化${newProcessText}`);
    expect(
      document.querySelector(
        '[data-trace-segment-active="true"] [data-node-id="edit-1"]',
      ),
    ).not.toBeNull();
    expect(
      document.querySelector(
        '[data-trace-segment-active="true"] [data-node-kind="reasoning"]',
      ),
    ).not.toBeNull();
    expect(screen.getByTestId('v2-narration')).toHaveTextContent(
      '这一阶段已完成',
    );
    expect(screen.getByTestId('v2-trace-segment-toggle')).toHaveTextContent(
      'traceMetricTools:2',
    );

    fireEvent.click(screen.getByTestId('v2-trace-segment-toggle'));
    fireEvent.click(screen.getByTestId('v2-trace-segment-toggle'));
    expect(
      document.querySelector(`[data-node-id="${thinkId}"] button`),
    ).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    expect(screen.queryByTestId('v2-narration')).toBeNull();
    expect(document.querySelector('[data-trace-segment-id]')).toBeNull();
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    expect(screen.getByTestId('v2-trace-segment-toggle')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('已关闭段初次加载默认收起，focused 隐藏入口可恢复段内思考', () => {
    renderV2(
      buildTurn({ status: MessageStatusEnum.Loading }),
      PREFS('focused'),
    );
    // 过滤后只有一条工具的段直接展示，不给隐藏的思考再套空摘要。
    expect(screen.queryByTestId('v2-trace-segment-toggle')).toBeNull();
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(1);
    fireEvent.click(screen.getByTestId('v2-hidden-entry'));
    expect(
      document.querySelectorAll('[data-node-kind="reasoning"]'),
    ).toHaveLength(2);
    expect(screen.queryByTestId('v2-hidden-entry')).toBeNull();
    expect(screen.getByTestId('v2-narration')).toHaveTextContent(
      '天气查询完成',
    );
  });

  it('快照恢复为活动段时继续展示，正文再次出现后自动收起', () => {
    const processText =
      thinkTag('finished', '恢复后继续工作') +
      processTag({
        executeId: 'restored-tool',
        type: 'ToolCall',
        status: 'FINISHED',
      });
    const buildMessages = (text: string) =>
      buildTurn({
        status: MessageStatusEnum.Loading,
        text,
        processingList: [],
      });
    const view = renderV2(buildMessages(processText));
    const rerender = (text: string) =>
      view.rerender(
        <ConversationRendererV2
          messageList={buildMessages(text)}
          conversationId={1}
          roleInfo={ROLE_INFO}
          preferences={PREFS('balanced')}
        />,
      );
    rerender(`${processText}阶段说明`);
    expect(screen.getByTestId('v2-trace-segment-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    fireEvent.click(screen.getByTestId('v2-trace-segment-toggle'));
    rerender(processText);
    expect(screen.queryByTestId('v2-trace-segment-toggle')).toBeNull();
    expect(
      document.querySelector('[data-node-kind="reasoning"]'),
    ).not.toBeNull();
    rerender(`${processText}新的阶段说明`);
    expect(screen.getByTestId('v2-trace-segment-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(document.querySelector('[data-node-kind="reasoning"]')).toBeNull();
  });

  it('live 单条失败工具直接保留错误行，不套段级消息折叠', () => {
    renderV2(
      buildTurn({
        status: MessageStatusEnum.Loading,
        text:
          processTag({
            executeId: 'failed-tool',
            type: 'ToolCall',
            status: 'FAILED',
          }) + '命令失败，继续排查',
        processingList: [],
      }),
    );
    expect(screen.queryByTestId('v2-trace-segment-toggle')).toBeNull();
    expect(document.querySelector('[data-node-id="failed-tool"]')).toHaveClass(
      'is-failed',
    );
  });

  it.each(['think', 'tool'])(
    'live 单条 %s 被正文超越后保留自身摘要和详情，不套段级折叠',
    (kind) => {
      const processText =
        kind === 'think'
          ? thinkTag('finished', '正在确认结论')
          : processTag({
              executeId: 'single-tool',
              type: 'ToolCall',
              status: 'FINISHED',
              name: '读取文件',
            });
      const buildMessages = (
        text: string,
        status = MessageStatusEnum.Loading,
      ) =>
        buildTurn({
          text,
          status,
          processingList:
            kind === 'tool'
              ? ([
                  {
                    executeId: 'single-tool',
                    name: '读取文件',
                    type: AgentComponentTypeEnum.ToolCall,
                    status: 'FINISHED',
                    result: { input: { path: '/tmp/example.txt' } },
                  },
                ] as MessageInfo['processingList'])
              : [],
        });
      const view = renderV2(buildMessages(processText));
      const rerender = (text: string, status = MessageStatusEnum.Loading) =>
        view.rerender(
          <ConversationRendererV2
            messageList={buildMessages(text, status)}
            conversationId={1}
            roleInfo={ROLE_INFO}
            preferences={PREFS('balanced')}
          />,
        );
      expect(document.querySelectorAll('[data-node-id]')).toHaveLength(1);
      rerender(`${processText}阶段说明`);
      expect(screen.queryByTestId('v2-trace-segment-toggle')).toBeNull();
      expect(document.querySelectorAll('[data-node-id]')).toHaveLength(1);
      const itemToggle = document.querySelector('[data-node-id] button')!;
      fireEvent.click(itemToggle);
      expect(itemToggle).toHaveAttribute('aria-expanded', 'true');
      rerender(`${processText}阶段说明继续流出`);
      expect(document.querySelector('[data-node-id] button')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
      rerender(`${processText}阶段说明继续流出`, MessageStatusEnum.Complete);
      expect(screen.getByTestId('v2-trace-toggle')).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      fireEvent.click(screen.getByTestId('v2-trace-toggle'));
      expect(screen.queryByTestId('v2-trace-segment-toggle')).toBeNull();
      expect(document.querySelector('[data-node-id] button')).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    },
  );

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
  const askCases: Array<{
    label: string;
    name?: string;
    details?: Partial<MessageInfo>;
  }> = [
    ...[
      '问答',
      'nuwax_ask_question',
      'ask-question__nuwax_ask_question',
      'Backend.Sandbox.Event.AskQuestion',
      'AskQuestion',
    ].map((name) => ({ label: name, name })),
    {
      label: '无名称标签，通过交互 ID 识别',
      details: {
        mcpAskInteractions: [
          { toolCallId: 'ask-1', responseStatus: 'pending' },
        ] as MessageInfo['mcpAskInteractions'],
      },
    },
    {
      label: '无名称标签，通过实时元数据识别',
      details: {
        processingList: [
          { executeId: 'ask-1', subEventType: 'ASK_QUESTION' },
        ] as unknown as MessageInfo['processingList'],
      },
    },
    {
      label: '无名称标签，通过历史结果识别',
      details: {
        componentExecutedList: [
          { result: { executeId: 'ask-1', name: 'nuwax_ask_question' } },
        ],
      },
    },
  ];

  describe.each([true, false])(
    '问答正文保留（有终态回答：%s）',
    (hasFinalResult) => {
      it.each(askCases)(
        '$label：收起与复制保留问答前后正文，展开不重复正文',
        ({ name, details }) => {
          const narration = '我先检查同步逻辑。';
          const answer =
            '## 修复方案\n\nA：续拉直到没有更多消息。\n\nB：重连后重新拉取会话。';
          const afterAsk = '（表单已弹出，个人建议 A+B。）';
          const fullAnswer = `${answer}\n\n${afterAsk}`;
          renderV2([
            msg({
              id: 'u1',
              role: AssistantRoleEnum.USER,
              text: '分析同步问题',
            }),
            msg({
              id: 'a1',
              role: AssistantRoleEnum.ASSISTANT,
              text: `${narration}${processTag({
                executeId: 'read-1',
                type: 'ToolCall',
                status: 'FINISHED',
              })}${answer}${processTag({
                executeId: 'ask-1',
                type: 'ToolCall',
                status: 'FINISHED',
                name,
              })}${afterAsk}`,
              ...details,
              finalResult: hasFinalResult
                ? {
                    completionTokens: 0,
                    promptTokens: 0,
                    totalTokens: 0,
                    startTime: 0,
                    endTime: 0,
                    error: '',
                    outputText: `${narration}\n\n${fullAnswer}`,
                    success: true,
                    componentExecuteResults: [],
                  }
                : undefined,
            }),
          ]);
          const toggle = screen.getByTestId('v2-trace-toggle');
          expect(toggle).toHaveAttribute('aria-expanded', 'false');
          expect(screen.getByTestId('markdown-renderer').textContent).toBe(
            fullAnswer,
          );
          expect(screen.getByTestId('copy-button')).toHaveAttribute(
            'data-copy-text',
            fullAnswer,
          );
          expect(screen.queryByTestId('v2-narration')).toBeNull();
          fireEvent.click(toggle);
          expect(screen.getAllByTestId('v2-narration')).toHaveLength(1);
          expect(screen.getByTestId('v2-narration')).toHaveTextContent(
            narration,
          );
          expect(screen.getByTestId('markdown-renderer').textContent).toBe(
            fullAnswer,
          );
          fireEvent.click(toggle);
          expect(screen.getByTestId('markdown-renderer').textContent).toBe(
            fullAnswer,
          );
        },
      );
    },
  );

  it.each([true, false])(
    '问答前后跨助手消息时保留完整回答（有终态回答：%s）',
    (hasFinalResult) => {
      const answer = '## 修复方案\n\n建议同时修复续拉与重连。';
      const afterAsk = '（请在表单中选择方案。）';
      const fullAnswer = `${answer}\n\n${afterAsk}`;
      renderV2([
        msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '分析问题' }),
        msg({
          id: 'a1',
          role: AssistantRoleEnum.ASSISTANT,
          text: `${processTag({
            executeId: 'read-1',
            type: 'ToolCall',
          })}${answer}${processTag({
            executeId: 'ask-1',
            type: 'ToolCall',
            name: 'nuwax_ask_question',
          })}`,
        }),
        msg({
          id: 'a2',
          role: AssistantRoleEnum.ASSISTANT,
          text: afterAsk,
          finalResult: hasFinalResult
            ? {
                completionTokens: 0,
                promptTokens: 0,
                totalTokens: 0,
                startTime: 0,
                endTime: 0,
                error: '',
                outputText: fullAnswer,
                success: true,
                componentExecuteResults: [],
              }
            : undefined,
        }),
      ]);
      expect(screen.getByTestId('markdown-renderer').textContent).toBe(
        fullAnswer,
      );
      expect(screen.getByTestId('copy-button')).toHaveAttribute(
        'data-copy-text',
        fullAnswer,
      );
      fireEvent.click(screen.getByTestId('v2-trace-toggle'));
      expect(screen.queryByTestId('v2-narration')).toBeNull();
    },
  );

  it('问答后继续调用普通工具时，仍以该工具之后的正文作为最终回答', () => {
    const before = '先选择要分析的文件。';
    const after = '文件核对完成。';
    renderV2([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '分析文件' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: `${before}${processTag({
          executeId: 'ask-1',
          type: 'ToolCall',
          name: 'nuwax_ask_question',
        })}${processTag({
          executeId: 'read-1',
          type: 'ToolCall',
          name: 'read_file',
        })}${after}`,
        finalResult: {
          completionTokens: 0,
          promptTokens: 0,
          totalTokens: 0,
          startTime: 0,
          endTime: 0,
          error: '',
          outputText: `${before}\n\n${after}`,
          success: true,
          componentExecuteResults: [],
        },
      }),
    ]);
    expect(screen.getByTestId('markdown-renderer').textContent).toBe(after);
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    expect(screen.getByTestId('v2-narration')).toHaveTextContent(before);
  });

  it('终态汇总文本包含过程说明时，默认收起说明且复制只包含末段回答', () => {
    const narration = '让我再核一遍判据，确认后给你完整链路。';
    const answer = '## 你要的链路\n\n由发消息的人本人撤回。';
    renderV2([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '核对链路' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: `${narration}${processTag({
          executeId: 'read-im',
          type: 'ToolCall',
          status: 'FINISHED',
        })}${answer}`,
        finalResult: {
          completionTokens: 0,
          promptTokens: 0,
          totalTokens: 0,
          startTime: 0,
          endTime: 0,
          error: '',
          outputText: `${narration}\n\n${answer}`,
          success: true,
          componentExecuteResults: [],
        },
      }),
    ]);

    expect(screen.getByTestId('v2-trace-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByTestId('markdown-renderer').textContent).toBe(answer);
    expect(screen.getByTestId('v2-final-answer')).not.toHaveTextContent(
      narration,
    );
    expect(screen.getByTestId('copy-button')).toHaveAttribute(
      'data-copy-text',
      answer,
    );
    expect(screen.queryByTestId('v2-narration')).toBeNull();
    fireEvent.click(screen.getByTestId('v2-trace-toggle'));
    expect(screen.getByTestId('v2-narration')).toHaveTextContent(narration);
  });

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

  it('运行中节点保留类型图标和动态文案，行尾不显示 loading', () => {
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
    // 前导类型图标仍在，运行态由文案和扫光表达。
    expect(row!.querySelector('span[aria-label="tool"]')).not.toBeNull();
    expect(row!.querySelector('[class*="shimmer"]')).not.toBeNull();
    expect(row!.querySelector('span[aria-label="loading"]')).toBeNull();
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
  const restoreScrollHeight = () =>
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return 0;
      },
    });
  const stubScrollHeight = (value: number) => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return value;
      },
    });
    return restoreScrollHeight;
  };
  /** 按节点分流测高：正文(.ds-markdown-answer)取 answerHeight，其余节点取 fallbackHeight */
  const stubScrollHeightByNode = (
    answerHeight: number,
    fallbackHeight: number,
  ) => {
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return this.classList?.contains('ds-markdown-answer')
          ? answerHeight
          : fallbackHeight;
      },
    });
    return restoreScrollHeight;
  };

  it('正文超过阈值行数：默认收起（保留行数整行截断），点击圆形控件展开/收起切换', async () => {
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
    // 阈值与截断都只作用于气泡正文节点（.ds-markdown-answer）：
    // 收起态按保留行数×行高整行截断（截断值随常量调参联动）
    const body = content.querySelector<HTMLElement>('.ds-markdown-answer');
    expect(body).not.toBeNull();
    const collapsedMaxHeight = `${
      USER_BUBBLE_COLLAPSED_LINES * USER_BUBBLE_FALLBACK_LINE_HEIGHT
    }px`;
    expect(content.getAttribute('data-collapsed')).toBe('true');
    expect(body?.style.maxHeight).toBe(collapsedMaxHeight);
    expect(body?.style.overflow).toBe('hidden');
    // 控件经 portal 挂进气泡框（正文所在 .ds-markdown 灰底气泡）内尾部
    expect(toggle.parentElement).toBe(body?.closest('.ds-markdown') ?? null);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    // 圆形 chevron 控件：收起态朝下 caret + 展开语义 aria-label（无可见文案）
    expect(
      toggle.querySelector('[data-svg-icon="icons-common-caret_down"]'),
    ).not.toBeNull();
    expect(toggle.getAttribute('aria-label')).toBe(
      'PC.Components.ConversationRendererV2.userBubbleExpand',
    );
    expect(toggle).not.toHaveTextContent('展开');

    await user.click(toggle);
    expect(content.getAttribute('data-collapsed')).toBeNull();
    expect(body?.style.maxHeight).toBe('');
    expect(body?.style.overflow).toBe('');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe(
      'PC.Components.ConversationRendererV2.userBubbleCollapse',
    );
    expect(
      toggle.querySelector('[data-svg-icon="icons-common-caret_up"]'),
    ).not.toBeNull();

    await user.click(toggle);
    expect(content.getAttribute('data-collapsed')).toBe('true');
    expect(body?.style.maxHeight).toBe(collapsedMaxHeight);
    restore();
  });

  it('正文行数恰等于阈值：不折叠（超过阈值才展示折叠入口）', () => {
    // 正文高 = 阈值行数 × 兜底行高 → 行数恰达阈值，边界上不折叠
    const restore = stubScrollHeightByNode(
      USER_BUBBLE_COLLAPSE_LINES * USER_BUBBLE_FALLBACK_LINE_HEIGHT,
      600,
    );
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

  it('短文案即使整体渲染高超限（高附件）：阈值只测正文，不出现折叠与切换入口', () => {
    // bug 2529 口径①：字数不多（正文矮）一律不展示控件——附件与操作行不计入阈值
    const restore = stubScrollHeightByNode(100, 600);
    renderV2([
      msg({
        id: 'u1',
        role: AssistantRoleEnum.USER,
        text: '短输入',
        attachments: [
          {
            id: 1,
          } as unknown as NonNullable<MessageInfo['attachments']>[number],
        ],
      }),
      msg({ id: 'a1', role: AssistantRoleEnum.ASSISTANT, text: '回答' }),
    ]);
    expect(screen.getByTestId('attach-files')).toBeInTheDocument();
    expect(screen.queryByTestId('v2-user-bubble-toggle')).toBeNull();
    expect(
      screen
        .getByTestId('v2-user-bubble-content')
        .getAttribute('data-collapsed'),
    ).toBeNull();
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
