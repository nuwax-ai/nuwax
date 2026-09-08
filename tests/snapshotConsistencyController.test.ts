import { createSnapshotConsistencyController } from '@/features/conversation/runtime/snapshotConsistencyController';
import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';

describe('snapshotConsistencyController', () => {
  it('本地新 run 使在途旧 generation 快照失效', () => {
    const controller = createSnapshotConsistencyController();
    const token = controller.beginRequest('scheduled', 1001)!;

    controller.invalidateGeneration();
    const decision = controller.consume(
      token,
      { conversationId: 1001, isLocallyStreaming: false },
      { id: 1001, taskStatus: TaskStatus.COMPLETE } as any,
    );

    expect(decision).toMatchObject({
      type: 'snapshot.rejected',
      reason: 'stale-generation',
    });
  });

  it('visibility 请求保持单飞，消费后释放锁', () => {
    const controller = createSnapshotConsistencyController();
    const first = controller.beginRequest('visibility', 1001)!;

    expect(controller.beginRequest('visibility', 1001)).toBeUndefined();

    controller.consume(
      first,
      { conversationId: 1001, isLocallyStreaming: false },
      undefined,
    );
    expect(controller.beginRequest('visibility', 1001)).toBeDefined();
  });

  it('USER 尾拒绝覆盖，但保留 EXECUTING 状态与 sub 恢复消息窗口', () => {
    const controller = createSnapshotConsistencyController();
    const token = controller.beginRequest('scheduled', 1001)!;
    const messageList = [
      {
        id: 'user-1',
        role: AssistantRoleEnum.USER,
        text: 'not persisted yet',
      },
    ] as any[];

    const decision = controller.consume(
      token,
      { conversationId: 1001, isLocallyStreaming: false },
      {
        id: 1001,
        taskStatus: TaskStatus.EXECUTING,
        messageList,
      } as any,
    );

    expect(decision).toMatchObject({
      type: 'snapshot.rejected',
      reason: 'user-tail-not-persisted',
      observedTaskStatus: TaskStatus.EXECUTING,
      resumeMessageList: messageList,
    });
  });

  it('非 USER 尾快照被接受', () => {
    const controller = createSnapshotConsistencyController();
    const token = controller.beginRequest('visibility', 1001)!;
    const snapshot = {
      id: 1001,
      taskStatus: TaskStatus.COMPLETE,
      messageList: [
        {
          id: 'assistant-1',
          role: AssistantRoleEnum.ASSISTANT,
          text: 'done',
        },
      ],
    } as any;

    expect(
      controller.consume(
        token,
        { conversationId: 1001, isLocallyStreaming: false },
        snapshot,
      ),
    ).toMatchObject({ type: 'snapshot.accepted', snapshot });
  });
});
