import ConversationProgressCapsule from '@/components/business-component/UnifiedChatSession/components/ConversationProgressCapsule';
import { selectProgressCapsule } from '@/components/business-component/UnifiedChatSession/components/ConversationProgressCapsule/selectProgressCapsule';
import { AgentComponentTypeEnum, AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string, value?: number) =>
    value === undefined ? key : `${key}:${value}`,
}));
vi.mock(
  '@/components/business-component/UnifiedChatSession/components/ConversationProgressCapsule/index.less',
  () => ({ default: new Proxy({}, { get: (_, key) => String(key) }) }),
);

const processTag = (executeId: string, type: string, name: string) =>
  `<markdown-custom-process executeId="${executeId}" type="${type}" status="EXECUTING" name="${encodeURIComponent(
    name,
  )}"></markdown-custom-process>`;

const activeMessages = (): MessageInfo[] =>
  [
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
        processTag('tool-1', AgentComponentTypeEnum.ToolCall, '运行测试'),
      time: '2026-09-16 09:00:01',
      status: MessageStatusEnum.Loading,
      processingList: [
        {
          executeId: 'plan-1',
          type: AgentComponentTypeEnum.Plan,
          name: '执行计划',
          status: ProcessingEnum.EXECUTING,
          result: {
            data: [
              { status: 'completed', content: '检查分支' },
              { status: 'in_progress', content: '运行验收' },
              { status: 'pending', content: '生成交付说明' },
            ],
          },
        },
        {
          executeId: 'tool-1',
          type: AgentComponentTypeEnum.ToolCall,
          name: '运行测试',
          executingMessage: '正在运行会话合同测试',
          status: ProcessingEnum.EXECUTING,
          result: { input: { command: 'npm run test:conversation' } },
        },
      ],
    },
  ] as MessageInfo[];

describe('会话进度胶囊', () => {
  it('从最新活跃轮提取计划分组与当前动作', () => {
    const model = selectProgressCapsule(activeMessages(), true);
    expect(model).toMatchObject({
      currentAction: '正在运行会话合同测试',
      completedCount: 1,
      totalCount: 3,
    });
    expect(model?.steps.map((step) => step.status)).toEqual([
      'completed',
      'active',
      'pending',
    ]);
  });

  it('无运行中动作与计划时兜底留空，不泄漏硬编码文案', () => {
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
    const model = selectProgressCapsule(messages, true);
    expect(model).not.toBeNull();
    expect(model?.currentAction).toBe('');
  });

  it('默认折叠，点击展开详情，终态立即卸载', () => {
    const { rerender } = render(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={activeMessages()}
        active
      />,
    );
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('检查分支')).toBeNull();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('检查分支')).toBeInTheDocument();
    expect(screen.getByText('运行验收')).toBeInTheDocument();

    rerender(
      <ConversationProgressCapsule
        conversationId={1}
        messageList={activeMessages()}
        active={false}
      />,
    );
    expect(screen.queryByTestId('conversation-progress-capsule')).toBeNull();
  });
});
