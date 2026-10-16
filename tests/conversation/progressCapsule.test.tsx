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

const conversationInfoModel = vi.hoisted(() => ({
  openPreviewView: vi.fn(),
  setTaskAgentSelectedFileId: vi.fn(),
  setTaskAgentSelectTrigger: vi.fn(),
}));
vi.mock('umi', () => ({
  useModel: () => conversationInfoModel,
}));
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
  /** 追加 7 条终端命令（验证折叠）与最终输出正文 */
  richContent?: boolean;
  /** 追加新轮（新 user 消息 + 空 assistant），hasContent=false */
  withEmptyNewTurn?: boolean;
  /** 追加的新轮带 plan + 终端，hasContent=true */
  withResumedNewTurn?: boolean;
  /** 终态版错误收场（Error 状态） */
  error?: boolean;
}

const buildMessages = ({
  finished = false,
  richContent = false,
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
        processTag('agent-1', AgentComponentTypeEnum.SubAgent, '检索子代理') +
        (richContent
          ? Array.from({ length: 7 }, (_, index) =>
              processTag(
                `term-${index}`,
                AgentComponentTypeEnum.ToolCall,
                `命令${index}`,
              ),
            ).join('') +
            '已执行全部七个步骤，构建通过。' +
            '<task-result><description>月度报表页面</description><file>999999/report/index.html</file></task-result>' +
            '<task-result><description>数据明细导出</description><file>999999/report/summary.md</file></task-result>'
          : ''),
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
        ...(richContent
          ? Array.from({ length: 7 }, (_, index) => ({
              executeId: `term-${index}`,
              type: AgentComponentTypeEnum.ToolCall,
              name: `命令${index}`,
              status: processingStatus,
              result: { input: { command: `echo step-${index}` } },
            }))
          : []),
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

  it('仅普通工具（无计划/终端/编辑/子代理/产物）时返回 null：currentAction 文案不算内容', () => {
    const build = (finished: boolean) =>
      [
        {
          id: 'user-generic',
          role: AssistantRoleEnum.USER,
          text: '查一下资料',
          time: '2026-09-21 09:00:00',
          status: MessageStatusEnum.Complete,
        },
        {
          id: 'assistant-generic',
          role: AssistantRoleEnum.ASSISTANT,
          text: processTag(
            'search-1',
            AgentComponentTypeEnum.ToolCall,
            '联网搜索',
          ),
          time: '2026-09-21 09:00:01',
          status: finished
            ? MessageStatusEnum.Complete
            : MessageStatusEnum.Loading,
          processingList: [
            {
              executeId: 'search-1',
              type: AgentComponentTypeEnum.ToolCall,
              name: '联网搜索',
              executingMessage: '正在检索相关资料',
              status: finished
                ? ProcessingEnum.FINISHED
                : ProcessingEnum.EXECUTING,
              // 搜索类结果（title/url）：非终端、非文件编辑，六类分区内容全空
              result: {
                data: [{ title: '搜索结果', url: 'https://example.com' }],
              },
            },
          ],
        },
      ] as unknown as MessageInfo[];
    // 运行中：仅 spinner+动作文案、面板无分区 → 隐藏
    expect(selectProgressCapsule(build(false), true)).toBeNull();
    // 终态：仅「✓ 动作文案」空壳 → 同样隐藏
    expect(selectProgressCapsule(build(true), false)).toBeNull();
  });

  it('OpenUI 节点动作文案收敛：currentAction 不外露协议工具名', () => {
    const artifactId = '1219fcb4-a107-4f92-abff-7f8922f1228d';
    const ref = {
      type: 'nuwax.openui-ref',
      schemaVersion: 'nuwax.openui-ref/v1',
      artifactId,
      path: `data/${artifactId}.openui.json`,
      title: '演示看板',
      presentation: { mode: 'inline', autoOpen: false },
      digest: `sha256:${'a'.repeat(64)}`,
      operation: 'created',
    };
    const messages = [
      {
        id: 'user-op',
        role: AssistantRoleEnum.USER,
        text: '生成看板',
        time: '2026-09-19 09:00:00',
        status: MessageStatusEnum.Complete,
      },
      {
        id: 'assistant-op',
        role: AssistantRoleEnum.ASSISTANT,
        text: processTag(
          'op-1',
          AgentComponentTypeEnum.Event,
          'Backend.Sandbox.Event.renderUI',
        ),
        time: '2026-09-19 09:00:01',
        status: MessageStatusEnum.Complete,
        processingList: [
          {
            executeId: 'op-1',
            type: AgentComponentTypeEnum.Event,
            name: 'Backend.Sandbox.Event.renderUI',
            status: ProcessingEnum.FINISHED,
            result: {
              executeId: 'op-1',
              name: 'Backend.Sandbox.Event.renderUI',
              data: ref,
            },
          },
        ],
      },
    ] as unknown as MessageInfo[];
    const model = selectProgressCapsule(messages, false);
    expect(model).not.toBeNull();
    expect(model?.currentAction).not.toContain(
      'Backend.Sandbox.Event.renderUI',
    );
    expect(model?.currentAction).toContain('toolActionOpenUiFinished');
    expect(model?.currentAction).toContain('演示看板');
    // OpenUI 产物行收集：标题 + artifactId（供面板重开预览）
    expect(model?.openuiRenders).toEqual([
      {
        key: 'op-1',
        title: '演示看板',
        artifactId,
        status: 'finished',
      },
    ]);
  });

  it('OpenUI 面板分区：点击产物行走 openui 预览打开口径', async () => {
    const artifactId = '1219fcb4-a107-4f92-abff-7f8922f1228d';
    const messages = [
      {
        id: 'user-op',
        role: AssistantRoleEnum.USER,
        text: '生成看板',
        time: '2026-09-19 09:00:00',
        status: MessageStatusEnum.Complete,
      },
      {
        id: 'assistant-op',
        role: AssistantRoleEnum.ASSISTANT,
        text: processTag(
          'op-1',
          AgentComponentTypeEnum.Event,
          'Backend.Sandbox.Event.renderUI',
        ),
        time: '2026-09-19 09:00:01',
        status: MessageStatusEnum.Complete,
        processingList: [
          {
            executeId: 'op-1',
            type: AgentComponentTypeEnum.Event,
            name: 'Backend.Sandbox.Event.renderUI',
            status: ProcessingEnum.FINISHED,
            result: {
              executeId: 'op-1',
              name: 'Backend.Sandbox.Event.renderUI',
              data: {
                type: 'nuwax.openui-ref',
                schemaVersion: 'nuwax.openui-ref/v1',
                artifactId,
                path: `data/${artifactId}.openui.json`,
                title: '演示看板',
                presentation: { mode: 'inline', autoOpen: false },
                digest: `sha256:${'a'.repeat(64)}`,
                operation: 'created',
              },
            },
          },
        ],
      },
    ] as unknown as MessageInfo[];
    render(
      <ConversationProgressCapsule
        conversationId={999}
        messageList={messages}
        active={false}
        open
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(await screen.findByText('演示看板'));
    await waitFor(() =>
      expect(
        conversationInfoModel.setTaskAgentSelectedFileId,
      ).toHaveBeenCalledWith(`data/${artifactId}.openui.json`),
    );
    expect(conversationInfoModel.openPreviewView).toHaveBeenCalledWith(999, {
      forceRefresh: true,
    });
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

  it('原地终态更新后 active 翻转仍显示新状态并保留展开面板', () => {
    const messages = buildMessages();
    const onClose = vi.fn();
    const { rerender, container } = render(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={messages}
        active
        open
        onClose={onClose}
      />,
    );
    expect(container.querySelector('.spinner')).toBeTruthy();

    // 保持数组与消息身份不变：active 原有依赖仍须触发重新投影状态字段。
    messages[1].status = MessageStatusEnum.Complete;
    messages[1].processingList?.forEach((process) => {
      process.status = ProcessingEnum.FINISHED;
    });
    rerender(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={messages}
        active={false}
        open
        onClose={onClose}
      />,
    );

    expect(container.querySelector('.spinner')).toBeNull();
    expect(container.querySelector('.status-done')).toBeTruthy();
    expect(
      screen.queryByText('PC.Components.ConversationProgressCapsule.running 1'),
    ).toBeNull();
    expect(screen.getByTestId('capsule-panel')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('终态面板常驻；新轮无内容隐藏并收敛展开态，新轮产出内容后恢复', async () => {
    const onClose = vi.fn();
    const { rerender, container } = render(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages()}
        active
        open
        onClose={onClose}
      />,
    );
    // 会话结束（同轮终态）：面板常驻，头部换终态图标，不自动收起
    rerender(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({ finished: true })}
        active={false}
        open
        onClose={onClose}
      />,
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByTestId('conversation-progress-capsule'),
    ).toBeInTheDocument();
    expect(container.querySelector('.status-done')).toBeTruthy();
    expect(container.querySelector('.status-error')).toBeNull();

    // 新消息新轮无内容：组件隐藏，且回调 onClose 收敛外部展开态
    rerender(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({ finished: true, withEmptyNewTurn: true })}
        active
        open
        onClose={onClose}
      />,
    );
    expect(screen.queryByTestId('conversation-progress-capsule')).toBeNull();
    expect(onClose).toHaveBeenCalled();

    // 新轮产出内容：恢复显示；新一轮开跑同样请求自动收起
    onClose.mockClear();
    rerender(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({
          finished: true,
          withResumedNewTurn: true,
        })}
        active
        open
        onClose={onClose}
      />,
    );
    expect(
      screen.getByTestId('conversation-progress-capsule'),
    ).toBeInTheDocument();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('外点与 Esc 收起；页头触发按钮（data-capsule-panel-trigger）不算外点', () => {
    const onClose = vi.fn();
    render(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages()}
        active
        open
        onClose={onClose}
      />,
    );
    // 面板内部交互不触发外点收起
    fireEvent.mouseDown(screen.getByTestId('capsule-panel'));
    expect(onClose).not.toHaveBeenCalled();
    // 页头触发按钮区域：交给按钮自身 toggle
    const triggerMark = document.createElement('div');
    triggerMark.setAttribute('data-capsule-panel-trigger', '');
    document.body.appendChild(triggerMark);
    fireEvent.mouseDown(triggerMark);
    expect(onClose).not.toHaveBeenCalled();
    triggerMark.remove();

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('无可展示内容时组件隐藏并回调 onClose 收敛悬空的展开态', async () => {
    const onClose = vi.fn();
    render(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={[]}
        active
        open
        onClose={onClose}
      />,
    );
    expect(screen.queryByTestId('conversation-progress-capsule')).toBeNull();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
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
        open
        onClose={vi.fn()}
      />,
    );
    rerender(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({ finished: true })}
        active={false}
        enableVersionControl
        open
        onClose={vi.fn()}
      />,
    );
    // 分支行（/api/git/status current）
    expect(
      await screen.findByText('feat-test', {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    // 聚合统计：头部更改胶囊与面板「更改」行各一份
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
        open
        onClose={vi.fn()}
      />,
    );
    // 聚合统计同时出现在头部更改胶囊与面板「更改」行
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

  it('未开启版本管理不请求 git 接口，头部更改胶囊回退 V2 编辑口径', async () => {
    render(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={buildMessages({ finished: true })}
        active={false}
        open
        onClose={vi.fn()}
      />,
    );
    // 头部更改胶囊来自 V2 编辑聚合
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
