import { createTerminalConsistencyController } from '@/features/conversation/runtime/terminalConsistencyController';
import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import { describe, expect, it, vi } from 'vitest';

describe('terminalConsistencyController', () => {
  it('本地 FINAL_RESULT 可确认终态时不读取持久化快照', async () => {
    const fetchTaskStatus = vi.fn();
    const controller = createTerminalConsistencyController({ fetchTaskStatus });

    await expect(
      controller.confirmAfterStreamClose(1001, [
        {
          id: 'assistant-1',
          role: AssistantRoleEnum.ASSISTANT,
          finalResult: { success: true, outputText: 'done' },
        } as any,
      ]),
    ).resolves.toMatchObject({
      type: 'terminal.confirmed',
      status: TaskStatus.COMPLETE,
      source: 'local-message',
    });
    expect(fetchTaskStatus).not.toHaveBeenCalled();
  });

  it('本地无法解析时用持久化 taskStatus fallback 确认', async () => {
    const fetchTaskStatus = vi.fn().mockResolvedValue(TaskStatus.FAILED);
    const controller = createTerminalConsistencyController({ fetchTaskStatus });

    await expect(
      controller.confirmAfterStreamClose(1001, []),
    ).resolves.toMatchObject({
      type: 'terminal.confirmed',
      status: TaskStatus.FAILED,
      source: 'snapshot-fallback',
    });
    expect(fetchTaskStatus).toHaveBeenCalledWith(1001);
  });

  it('fallback 仍为 EXECUTING 时保持 unresolved', async () => {
    const controller = createTerminalConsistencyController({
      fetchTaskStatus: vi.fn().mockResolvedValue(TaskStatus.EXECUTING),
    });

    await expect(controller.confirmAfterStreamClose(1001, [])).resolves.toEqual(
      {
        type: 'terminal.unresolved',
        conversationId: 1001,
        observedStatus: TaskStatus.EXECUTING,
      },
    );
  });
});
