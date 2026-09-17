import {
  apiGitDiff,
  apiGitLogList,
  apiGitStatus,
} from '@/components/business-component/FileTreeGitSourcePanel/services/git-version-management';
import ConversationProgressCapsule from '@/components/business-component/UnifiedChatSession/components/ConversationProgressCapsule';
import { selectProgressCapsule } from '@/components/business-component/UnifiedChatSession/components/ConversationProgressCapsule/selectProgressCapsule';
import { AgentComponentTypeEnum, AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string, value?: number) =>
    value === undefined ? key : `${key}:${value}`,
}));
vi.mock(
  '@/components/business-component/UnifiedChatSession/components/ConversationProgressCapsule/index.less',
  () => ({ default: new Proxy({}, { get: (_, key) => String(key) }) }),
);
vi.mock(
  '@/components/business-component/FileTreeGitSourcePanel/services/git-version-management',
  () => ({
    apiGitDiff: vi.fn(),
    apiGitLogList: vi.fn(),
    apiGitStatus: vi.fn(),
  }),
);

const processTag = (executeId: string, type: string, name: string) =>
  `<markdown-custom-process executeId="${executeId}" type="${type}" status="EXECUTING" name="${encodeURIComponent(
    name,
  )}"></markdown-custom-process>`;

const planResult = (done: number) => ({
  data: [
    ...Array.from({ length: done }, (_, index) => ({
      status: 'completed',
      content: `步骤${index + 1}`,
    })),
    { status: 'in_progress', content: '运行验收' },
    { status: 'pending', content: '生成交付说明' },
  ],
});

interface BuildMessagesOptions {
  /** 终态版：消息与 processing 均落 FINISHED/Complete */
  finished?: boolean;
  /** 追加新轮（新 user 消息 + 空 assistant），hasContent=false */
  withEmptyNewTurn?: boolean;
  /** 追加的新轮带 plan + 终端，hasContent=true */
  withResumedNewTurn?: boolean;
  /** 终态版错误收场（Error 状态） */
  error?: boolean;
}

const buildMessages = ({
  finished = false,
  withEmptyNewTurn = false,
  withResumedNewTurn = false,
  error = false,
}: BuildMessagesOptions = {}): MessageInfo[] => {
  const processingStatus = finished
    ? ProcessingEnum.FINISHED
    : ProcessingEnum.EXECUTING;
  // fixture 只填投影层消费的字段，走宽松收集 + 整体断言，与原测试写法同款
  const messages: Record<string, unknown>[] = [
    {
      id: 'user-1',
      role: AssistantRoleEnum.USER,
      text: '完成发布准备',
      time: '2026-09-16 09:00:00',
      status: MessageStatusEnum.Complete,
    },
    {
      id: 'assistant-1',
      role: AssistantRoleEnum.ASSISTANT,
      text:
        processTag('plan-1', AgentComponentTypeEnum.Plan, '执行计划') +
        processTag('tool-1', AgentComponentTypeEnum.ToolCall, '运行测试') +
        processTag('edit-1', AgentComponentTypeEnum.ToolCall, '编辑文件') +
        processTag('agent-1', AgentComponentTypeEnum.SubAgent, '检索子代理'),
      time: '2026-09-16 09:00:01',
      status: finished
        ? error
          ? MessageStatusEnum.Error
          : MessageStatusEnum.Complete
        : MessageStatusEnum.Loading,
      processingList: [
        {
          executeId: 'plan-1',
          type: AgentComponentTypeEnum.Plan,
          name: '执行计划',
          status: processingStatus,
          result: planResult(1),
        },
        {
          executeId: 'tool-1',
          type: AgentComponentTypeEnum.ToolCall,
          name: '运行测试',
          executingMessage: '正在运行会话合同测试',
          status: processingStatus,
          result: { input: { command: 'npm run test:conversation' } },
        },
        {
          executeId: 'edit-1',
          type: AgentComponentTypeEnum.ToolCall,
          name: '编辑文件',
          status: processingStatus,
          result: {
            data: [
              {
                type: 'diff',
                path: 'src/edited.ts',
                oldText: 'a',
                newText: 'b\nc',
              },
            ],
          },
        },
        {
          executeId: 'agent-1',
          type: AgentComponentTypeEnum.SubAgent,
          name: '检索子代理',
          status: processingStatus,
        },
      ],
    },
  ];

  if (withEmptyNewTurn) {
    messages.push(
      {
        id: 'user-2',
        role: AssistantRoleEnum.USER,
        text: '再检查一遍',
        time: '2026-09-16 09:01:00',
        status: MessageStatusEnum.Complete,
      },
      {
        id: 'assistant-2',
        role: AssistantRoleEnum.ASSISTANT,
        text: '',
        time: '2026-09-16 09:01:01',
        status: MessageStatusEnum.Loading,
      },
    );
  }

  if (withResumedNewTurn) {
    messages.push(
      {
        id: 'user-3',
        role: AssistantRoleEnum.USER,
        text: '补一份报告',
        time: '2026-09-16 09:02:00',
        status: MessageStatusEnum.Complete,
      },
      {
        id: 'assistant-3',
        role: AssistantRoleEnum.ASSISTANT,
        text:
          processTag('plan-2', AgentComponentTypeEnum.Plan, '补充计划') +
          processTag('tool-2', AgentComponentTypeEnum.ToolCall, '生成报告'),
        time: '2026-09-16 09:02:01',
        status: MessageStatusEnum.Loading,
        processingList: [
          {
            executeId: 'plan-2',
            type: AgentComponentTypeEnum.Plan,
            name: '补充计划',
            status: ProcessingEnum.EXECUTING,
            result: planResult(2),
          },
          {
            executeId: 'tool-2',
            type: AgentComponentTypeEnum.ToolCall,
            name: '生成报告',
            status: ProcessingEnum.EXECUTING,
            result: { input: { command: 'npm run build' } },
          },
        ],
      },
    );
  }

  return messages as unknown as MessageInfo[];
};

describe('会话进度胶囊', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认安全实现：单跑用例时无残留 mock，接口返回空数据而非 undefined
    vi.mocked(apiGitDiff).mockResolvedValue({
      code: '0000',
      data: { summary: { files: [], insertions: 0, deletions: 0 } },
    } as never);
    vi.mocked(apiGitLogList).mockResolvedValue({
      code: '0000',
      data: { commits: [], total: 0 },
    } as never);
    vi.mocked(apiGitStatus).mockResolvedValue({
      code: '0000',
      data: {},
    } as never);
  });

  it('从最新活跃轮提取计划分组、终端与子智能体', () => {
    const model = selectProgressCapsule(buildMessages(), true);
    expect(model).toMatchObject({
      running: true,
      // 最新运行动作优先：SubAgent 在 tool 之后运行，currentAction 取子代理
      currentAction: '检索子代理',
      completedCount: 1,
      totalCount: 3,
    });
    expect(model?.steps.map((step) => step.status)).toEqual([
      'completed',
      'active',
      'pending',
    ]);
    expect(model?.terminals).toHaveLength(1);
    expect(model?.terminals[0]).toMatchObject({
      command: 'npm run test:conversation',
      status: 'running',
    });
    expect(model?.subagents).toHaveLength(1);
    expect(model?.subagents[0]).toMatchObject({
      title: '检索子代理',
      status: 'running',
    });
    expect(model?.fileEdits).toHaveLength(1);
    expect(model?.fileEdits[0]).toMatchObject({
      path: 'src/edited.ts',
      fileCount: 1,
      status: 'running',
    });
  });

  it('无可展示内容时返回 null（执行早期空转 / 新消息新轮）', () => {
    const messages = [
      {
        id: 'user-1',
        role: AssistantRoleEnum.USER,
        text: '开始',
        time: '2026-09-16 09:00:00',
        status: MessageStatusEnum.Complete,
      },
      {
        id: 'assistant-1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '',
        time: '2026-09-16 09:00:01',
        status: MessageStatusEnum.Loading,
      },
    ] as MessageInfo[];
    expect(selectProgressCapsule(messages, true)).toBeNull();
  });

  it('终态常驻：会话结束后仍显示最后一轮内容并带终态标记', () => {
    const model = selectProgressCapsule(
      buildMessages({ finished: true }),
      false,
    );
    expect(model).not.toBeNull();
    expect(model).toMatchObject({
      running: false,
      terminalStatus: 'complete',
    });
    expect(model?.terminals[0]).toMatchObject({
      command: 'npm run test:conversation',
      status: 'finished',
    });
    expect(model?.subagents[0]).toMatchObject({
      title: '检索子代理',
      status: 'finished',
    });
  });

  it('终态出错时投影 error 终态', () => {
    const model = selectProgressCapsule(
      buildMessages({ finished: true, error: true }),
      false,
    );
    expect(model).toMatchObject({ running: false, terminalStatus: 'error' });
  });

  it('新消息开出的新轮无内容时隐藏，新轮产出内容后恢复', () => {
    expect(
      selectProgressCapsule(
        buildMessages({ finished: true, withEmptyNewTurn: true }),
        true,
      ),
    ).toBeNull();

    const resumed = selectProgressCapsule(
      buildMessages({ finished: true, withResumedNewTurn: true }),
      true,
    );
    expect(resumed).not.toBeNull();
    expect(resumed).toMatchObject({
      running: true,
      completedCount: 2,
      totalCount: 4,
    });
    expect(resumed?.terminals[0]).toMatchObject({ command: 'npm run build' });
  });

  it('默认折叠，展开后按分区展示（计划/进程/终端/智能体摘要），终态不卸载', () => {
    const { rerender, container } = render(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages()}
        active
      />,
    );
    const trigger = screen.getByTestId('capsule-trigger');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // 面板常驻 DOM（双向开合过渡），收起态整组 aria-hidden
    expect(
      screen.getByTestId('capsule-panel-wrap').getAttribute('aria-hidden'),
    ).toBe('true');

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    // 计划：活跃 + 待处理步骤（单行截断）
    expect(screen.getByText('运行验收')).toBeInTheDocument();
    expect(screen.getByText('生成交付说明')).toBeInTheDocument();
    // 进程：n/n 计数，已完成默认展开且带删除线
    expect(screen.getByText('1/3')).toBeInTheDocument();
    expect(screen.getByText('步骤1')).toBeInTheDocument();
    // 终端
    expect(screen.getByText('npm run test:conversation')).toBeInTheDocument();
    // 智能体默认折叠：显示运行中摘要（fixture 子代理 running）
    expect(
      screen.getByText('PC.Components.ConversationProgressCapsule.running 1'),
    ).toBeInTheDocument();
    // 点分区头展开子代理行
    fireEvent.click(
      screen.getByText('PC.Components.ConversationProgressCapsule.agents'),
    );
    expect(screen.getByText('检索子代理')).toBeInTheDocument();

    // 会话结束：胶囊常驻，触发器换终态图标
    rerender(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({ finished: true })}
        active={false}
      />,
    );
    expect(
      screen.getByTestId('conversation-progress-capsule'),
    ).toBeInTheDocument();
    expect(container.querySelector('.status-done')).toBeTruthy();
    expect(container.querySelector('.status-error')).toBeNull();

    // 新消息新轮无内容：胶囊隐藏
    rerender(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({ finished: true, withEmptyNewTurn: true })}
        active
      />,
    );
    expect(screen.queryByTestId('conversation-progress-capsule')).toBeNull();

    // 新轮产出内容：恢复显示，面板自动收起
    rerender(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({
          finished: true,
          withResumedNewTurn: true,
        })}
        active
      />,
    );
    expect(
      screen.getByTestId('conversation-progress-capsule'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('capsule-trigger')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('开启版本管理：终态后 Git 工具区展示更改聚合与分支（worktree 口径优先）', async () => {
    vi.mocked(apiGitDiff).mockResolvedValue({
      code: '0000',
      data: {
        summary: {
          files: [
            {
              file: 'src/app.tsx',
              changes: 12,
              insertions: 10,
              deletions: 2,
              binary: false,
            },
            {
              file: 'README.md',
              changes: 1,
              insertions: 1,
              deletions: 0,
              binary: false,
            },
          ],
          insertions: 11,
          deletions: 2,
        },
      },
    } as never);
    vi.mocked(apiGitStatus).mockResolvedValue({
      code: '0000',
      data: { current: 'feat-test' },
    } as never);
    const { rerender } = render(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages()}
        active
        enableVersionControl
      />,
    );
    fireEvent.click(screen.getByTestId('capsule-trigger'));
    rerender(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({ finished: true })}
        active={false}
        enableVersionControl
      />,
    );
    // 分支行（/api/git/status current）
    expect(
      await screen.findByText('feat-test', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    // 聚合统计：触发器胶囊与面板「更改」行各一份
    expect(screen.getAllByText('+11').length).toBeGreaterThan(0);
    expect(screen.getAllByText('−2').length).toBeGreaterThan(0);
    expect(apiGitDiff).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceType: 'taskAgent',
        cid: 1,
        source: 'worktree',
      }),
    );
  });

  it('worktree 干净时兜底最新一次 commit 的 diff', async () => {
    vi.mocked(apiGitDiff).mockImplementation(async ({ source }) =>
      source === 'worktree'
        ? ({
            code: '0000',
            data: { summary: { files: [], insertions: 0, deletions: 0 } },
          } as never)
        : ({
            code: '0000',
            data: {
              summary: {
                files: [
                  {
                    file: 'src/lib.ts',
                    changes: 4,
                    insertions: 3,
                    deletions: 1,
                    binary: false,
                  },
                ],
                insertions: 3,
                deletions: 1,
              },
            },
          } as never),
    );
    vi.mocked(apiGitLogList).mockResolvedValue({
      code: '0000',
      data: { commits: [{ hash: 'abc123' }], total: 1 },
    } as never);
    render(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({ finished: true })}
        active={false}
        enableVersionControl
      />,
    );
    fireEvent.click(screen.getByTestId('capsule-trigger'));
    // 聚合统计同时出现在触发器胶囊与面板「更改」行
    await waitFor(
      () => {
        expect(screen.getAllByText('+3').length).toBeGreaterThan(0);
      },
      { timeout: 2000 },
    );
    expect(screen.getAllByText('−1').length).toBeGreaterThan(0);
    expect(apiGitLogList).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceType: 'taskAgent', cid: 1 }),
    );
  });

  it('未开启版本管理不请求 git 接口，触发器更改胶囊回退 V2 编辑口径', async () => {
    render(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({ finished: true })}
        active={false}
      />,
    );
    fireEvent.click(screen.getByTestId('capsule-trigger'));
    // 收起态更改胶囊来自 V2 编辑聚合
    expect(
      screen.getAllByText('PC.Components.ConversationProgressCapsule.changes')
        .length,
    ).toBeGreaterThan(0);
    await waitFor(() => {
      expect(
        screen.getByTestId('conversation-progress-capsule'),
      ).toBeInTheDocument();
    });
    expect(apiGitDiff).not.toHaveBeenCalled();
    expect(apiGitStatus).not.toHaveBeenCalled();
  });
});
