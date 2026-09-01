/**
 * V2 渲染器组件合同测试（specs/nuwax-conversation-renderer-v2.md「组件」栏）：
 * 两级折叠与默认态、三档预设、高级覆盖、隐藏恢复入口、运行摘要、终态默认、
 * 手动状态跨流式保持、键盘/ARIA、待回答卡独立（不进轨迹）、回答操作栏与
 * 复制范围、投影/渲染异常回退 V1。
 */
import type { ConversationRenderPreferencesV2 } from '@/features/conversation/presentation-v2';
import ConversationRendererV2 from '@/features/conversation/presentation-v2/react/ConversationRendererV2';
import { AssistantRoleEnum } from '@/types/enums/agent';
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
vi.mock('@/components/MarkdownCustomProcess', () => ({
  default: ({
    executeId,
    name,
  }: {
    executeId: string;
    name: string;
    status?: string;
    type?: string;
  }) => {
    if (name === 'explode') {
      throw new Error('tool detail render explosion');
    }
    return (
      <div
        data-testid="tool-detail"
        data-execute-id={executeId}
        data-name={name}
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
    ...overrides,
  }),
];

const renderV2 = (
  messageList: MessageInfo[],
  preferences = PREFS('balanced'),
) =>
  render(
    <ConversationRendererV2
      messageList={messageList}
      conversationId={1}
      roleInfo={ROLE_INFO}
      messageBottomMode="chat"
      preferences={preferences}
    />,
  );

afterEach(() => {
  unifiedThemeState.antdTheme = 'light';
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

  it('终态 balanced 默认收起：轨迹体不可见，回答仍常显', () => {
    renderV2(buildTurn());
    const toggle = screen.getByTestId('v2-trace-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByTestId('v2-hidden-entry')).toBeNull();
    expect(screen.getByTestId('v2-final-answer')).toBeVisible();
  });

  it('运行轮外层默认展开并显示运行点', () => {
    renderV2(
      buildTurn({ status: MessageStatusEnum.Loading }),
      PREFS('focused'),
    );
    const toggle = screen.getByTestId('v2-trace-toggle');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(
      document.querySelector('[data-trace-running="true"]'),
    ).not.toBeNull();
  });

  it('detailed 终态默认展开且已完成 reasoning 节点详情自动展开', () => {
    renderV2(buildTurn(), PREFS('detailed'));
    expect(
      screen.getByTestId('v2-trace-toggle').getAttribute('aria-expanded'),
    ).toBe('true');
    // think 内容作为已完成节点默认展开（行摘要 + 详情两处可见）
    expect(
      screen.getAllByText('先想想要用哪个工具').length,
    ).toBeGreaterThanOrEqual(2);
  });
});

describe('ConversationRendererV2 · 两级折叠与手动状态保持', () => {
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
    // 终态补齐（FINAL_RESULT）同样不重置
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
    expect(
      screen.getByTestId('v2-trace-toggle').getAttribute('aria-expanded'),
    ).toBe('false');
  });

  it('节点行为原生 button（键盘 Enter/Space 由浏览器语义保证）且点击展开受限详情', async () => {
    const user = userEvent.setup();
    renderV2(buildTurn(), PREFS('detailed'));
    // detailed 下外层已展开；工具节点三档恒为摘要行
    const toolRow = document.querySelector('[data-node-id="e1"] button');
    expect(toolRow).not.toBeNull();
    // 原生 button：Enter/Space 激活由浏览器保证，无需自定义键盘处理
    expect(toolRow!.nodeName).toBe('BUTTON');
    expect(toolRow?.getAttribute('aria-expanded')).toBe('false');
    await user.click(toolRow!);
    expect(toolRow?.getAttribute('aria-expanded')).toBe('true');
    expect(
      screen.getByTestId('tool-detail').getAttribute('data-execute-id'),
    ).toBe('e1');
    await user.click(toolRow!);
    expect(toolRow?.getAttribute('aria-expanded')).toBe('false');
    // 轨迹头同样为原生 button 且带 aria-controls 联动
    const traceToggle = screen.getByTestId('v2-trace-toggle');
    expect(traceToggle.nodeName).toBe('BUTTON');
    expect(traceToggle.getAttribute('aria-controls')).toBe(
      `v2-trace-body-${document
        .querySelector('[data-trace-key]')
        ?.getAttribute('data-trace-key')}`,
    );
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

  it('过程说明直出位于轨迹与最终回答之间；narration-only 终态轮无空轨迹条', () => {
    renderV2(buildTurn());
    const trace = document.querySelector('[data-trace-key]');
    const narration = screen.getByTestId('v2-narration');
    const answer = screen.getByTestId('v2-final-answer');
    // DOM 顺序：轨迹条 → narration 直出 → 最终回答
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

    // narration-only 终态轮：无轨迹条、无节点行，最终回答走空轮提示
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
    // 终态 balanced 外层默认收起，先展开轨迹
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
        }),
      ],
      PREFS('balanced', { tool: 'expanded' }),
    );
    // 终态外层默认收起：展开轨迹触发节点详情渲染抛错 → ErrorBoundary 整份回退 V1
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
    const toolRow = document.querySelector('[data-node-id="e1"] button')!;
    const icons = toolRow.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(1);
    const name =
      toolRow.getAttribute('aria-label') ?? toolRow.textContent ?? '';
    expect(name).not.toMatch(/caret-right|bulb|tool|check-circle/i);
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
