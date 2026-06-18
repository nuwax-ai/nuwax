/**
 * 消息队列功能测试
 *
 * 以「功能维度」组织：验证会话活跃期间消息队列的完整行为，
 * 包括入队、自动消费、intervention 协调、消费节流与队列操作。
 */
import { useChatMessageQueue } from '@/components/business-component/MessageQueue/useChatMessageQueue';
import { MessageStatusEnum } from '@/types/enums/common';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('消息队列功能', () => {
  let sendMessage: ReturnType<typeof vi.fn>;
  let runStopConversation: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendMessage = vi.fn();
    runStopConversation = vi.fn();
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** 以一组 props 渲染消息队列能力，返回可控句柄 */
  const setup = (initialProps: any = {}) => {
    return renderHook(
      ({
        isConversationActive,
        isEnqueueBlocked,
        isTaskExecuting,
        isSuggestLoading,
        hasPendingIntervention,
        minConsumeInterval,
        messageList,
      }: any) =>
        useChatMessageQueue({
          isConversationActive,
          isEnqueueBlocked,
          isTaskExecuting,
          isSuggestLoading,
          messageList,
          conversationId: 'conv-1',
          sendMessage,
          runStopConversation,
          hasPendingIntervention,
          minConsumeInterval,
        }),
      {
        initialProps: {
          isConversationActive: false,
          isEnqueueBlocked: undefined,
          isTaskExecuting: false,
          isSuggestLoading: false,
          hasPendingIntervention: false,
          minConsumeInterval: 500,
          messageList: [],
          ...initialProps,
        },
      },
    );
  };

  // ============ 功能1：会话活跃时发送的消息进入队列等待 ============
  describe('会话活跃时发送的消息进入队列等待', () => {
    it('会话活跃期间发送的消息被加入队列，不立即发出', () => {
      const { result } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('你好');
      });
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].text).toBe('你好');
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('会话空闲时发送的消息直接发出，不进队列', () => {
      const { result } = setup({ isConversationActive: false });
      act(() => {
        result.current.trySend('你好');
      });
      expect(result.current.queue).toHaveLength(0);
      expect(sendMessage).toHaveBeenCalledWith(
        '你好',
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('直接发送时透传附件与技能/模型等参数', () => {
      const { result } = setup({ isConversationActive: false });
      act(() => {
        result.current.trySend('hi', [{ name: 'f' } as any], [1], 2, 'ask');
      });
      expect(sendMessage).toHaveBeenCalledWith(
        'hi',
        [{ name: 'f' }],
        [1],
        2,
        'ask',
      );
    });

    it('流式空闲但 taskExecuting 时仍入队（isEnqueueBlocked）', () => {
      const { result } = setup({
        isConversationActive: false,
        isEnqueueBlocked: true,
      });
      act(() => {
        result.current.trySend('排队');
      });
      expect(result.current.queue).toHaveLength(1);
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('isEnqueueBlocked 为 false 时流式活跃也不入队（仅当未传 isEnqueueBlocked 才随流式）', () => {
      const { result } = setup({
        isConversationActive: true,
        isEnqueueBlocked: false,
      });
      act(() => {
        result.current.trySend('直发');
      });
      expect(result.current.queue).toHaveLength(0);
      expect(sendMessage).toHaveBeenCalledWith(
        '直发',
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });
  });

  // ============ 功能2：会话空闲后自动逐条发送队列 ============
  describe('会话空闲后自动逐条发送队列', () => {
    it('入队消息在消费时回放 skillIds/modelId/agentMode 快照', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('带技能', [{ name: 'f' } as any], [7], 3, 'ask');
      });
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledWith(
        '带技能',
        [{ name: 'f' }],
        [7],
        3,
        'ask',
      );
    });

    it('会话由活跃转为空闲后，延迟发送队首消息', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
      });

      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 延迟未到，不发送
      expect(sendMessage).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(sendMessage).toHaveBeenCalledWith(
        'm1',
        [],
        undefined,
        undefined,
        undefined,
      );
    });

    it('延迟期内会话再次进入活跃，则取消本轮消费', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
      });
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      // 延迟期内重新活跃
      rerender({
        isConversationActive: true,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('最近一条消息出错时暂停自动消费，等待用户处理', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
      });
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [{ id: 'x', status: 'error' } as any],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('流式结束但后台任务仍执行时不自动消费', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
      });
      rerender({
        isConversationActive: false,
        isTaskExecuting: true,
        isEnqueueBlocked: true,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('model 流式 false 但 messageList 仍 Incomplete 时不自动消费', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
      });
      rerender({
        isConversationActive: false,
        isTaskExecuting: false,
        isEnqueueBlocked: true,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [{ id: 'a', status: MessageStatusEnum.Incomplete } as any],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('后台任务结束后自动消费队首', () => {
      const { result, rerender } = setup({
        isConversationActive: true,
        isTaskExecuting: true,
        isEnqueueBlocked: true,
      });
      act(() => {
        result.current.trySend('m1');
      });
      rerender({
        isConversationActive: false,
        isTaskExecuting: true,
        isEnqueueBlocked: true,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).not.toHaveBeenCalled();

      rerender({
        isConversationActive: false,
        isTaskExecuting: false,
        isEnqueueBlocked: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledWith(
        'm1',
        [],
        undefined,
        undefined,
        undefined,
      );
    });

    it('流式结束但 suggest 接口仍加载时不自动消费', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
      });
      rerender({
        isConversationActive: false,
        isTaskExecuting: false,
        isEnqueueBlocked: true,
        isSuggestLoading: true,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('suggest 接口结束后自动消费队首', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
      });
      rerender({
        isConversationActive: false,
        isTaskExecuting: false,
        isEnqueueBlocked: true,
        isSuggestLoading: true,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).not.toHaveBeenCalled();

      rerender({
        isConversationActive: false,
        isTaskExecuting: false,
        isEnqueueBlocked: false,
        isSuggestLoading: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledWith(
        'm1',
        [],
        undefined,
        undefined,
        undefined,
      );
    });

    it('流式刚结束、suggest 在消费定时器触发前开始时，取消待发消费', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
      });
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      rerender({
        isConversationActive: false,
        isEnqueueBlocked: true,
        isSuggestLoading: true,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).not.toHaveBeenCalled();

      rerender({
        isConversationActive: false,
        isEnqueueBlocked: false,
        isSuggestLoading: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledTimes(1);
    });

    it('未传 isEnqueueBlocked 时 isSuggestLoading 单独阻塞入队与消费', () => {
      const { result, rerender } = setup({
        isConversationActive: false,
        isSuggestLoading: true,
      });
      act(() => {
        result.current.trySend('排队');
      });
      expect(result.current.queue).toHaveLength(1);
      expect(sendMessage).not.toHaveBeenCalled();

      rerender({
        isConversationActive: false,
        isSuggestLoading: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledWith(
        '排队',
        [],
        undefined,
        undefined,
        undefined,
      );
    });
  });

  // ============ 功能3：ask/question / 审批出现时暂停队列消费 ============
  describe('ask/question / 审批出现时暂停队列消费', () => {
    it('有待处理 intervention 时，不会话空闲也不消费队列', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
      });
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('intervention 提交完成（pending 解除）后恢复队列消费', () => {
      const { result, rerender } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
      });
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).not.toHaveBeenCalled();

      // intervention 解除
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledWith(
        'm1',
        [],
        undefined,
        undefined,
        undefined,
      );
    });
  });

  // ============ 功能4：多条队列消息按最小间隔逐条发送 ============
  describe('多条队列消息按最小间隔逐条发送', () => {
    it('两次实际发送之间至少间隔 minConsumeInterval，避免「一出溜」', () => {
      const { result, rerender } = setup({
        isConversationActive: true,
        minConsumeInterval: 1000,
      });
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
      });

      // 消费 m1
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 1000,
        messageList: [],
      });
      // 首次消费 lastConsumeAt 初始为 0，elapsed 很大 → setTimeout(0)，推进 1ms 即触发 m1
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(sendMessage).toHaveBeenCalledTimes(1);

      // 模拟 m1 处理周期：active 释放锁 → idle 触发 m2
      rerender({
        isConversationActive: true,
        hasPendingIntervention: false,
        minConsumeInterval: 1000,
        messageList: [],
      });
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 1000,
        messageList: [],
      });

      // m2 的 wait ≈ minConsumeInterval - elapsed（距 m1 消费仅 1ms → wait≈999）。
      // 推进 500ms 不到 wait，m2 不应发送
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledTimes(1);

      // 推进到 wait 满，m2 发送
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledTimes(2);
      expect(sendMessage).toHaveBeenLastCalledWith(
        'm2',
        [],
        undefined,
        undefined,
        undefined,
      );
    });
  });

  // ============ 功能5：队列操作 ============
  describe('队列操作：立即发送 / 编辑 / 删除 / 清空', () => {
    it('立即发送：把目标消息移到队首并停止当前会话', () => {
      const { result } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
      });
      const m2 = result.current.queue[1];
      act(() => {
        result.current.sendNow(m2);
      });
      expect(runStopConversation).toHaveBeenCalledWith('conv-1');
      expect(result.current.queue[0].text).toBe('m2');
      expect(result.current.queue).toHaveLength(2);
    });

    it('编辑：把消息移出队列以回填输入框', () => {
      const { result } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
      });
      const m1 = result.current.queue[0];
      let item: any;
      act(() => {
        item = result.current.editQueued(m1);
      });
      expect(item?.text).toBe('m1');
      expect(result.current.queue).toHaveLength(0);
    });

    it('删除：按 id 移除单条队列消息', () => {
      const { result } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
      });
      const m1 = result.current.queue[0];
      act(() => {
        result.current.deleteQueued(m1.id);
      });
      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].text).toBe('m2');
    });

    it('清空：移除全部队列消息', () => {
      const { result } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
      });
      act(() => {
        result.current.clearQueue();
      });
      expect(result.current.queue).toHaveLength(0);
    });

    it('拖拽排序：把指定位置的消息移动到新位置', () => {
      const { result } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
        result.current.trySend('m3');
      });
      act(() => {
        result.current.reorder(0, 2); // m1 移到末尾 → m2, m3, m1
      });
      expect(result.current.queue.map((q) => q.text)).toEqual([
        'm2',
        'm3',
        'm1',
      ]);
    });

    it('拖拽排序：相同位置或越界时队列不变', () => {
      const { result } = setup({ isConversationActive: true });
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
      });
      act(() => {
        result.current.reorder(0, 0);
      });
      expect(result.current.queue.map((q) => q.text)).toEqual(['m1', 'm2']);
      act(() => {
        result.current.reorder(0, 99);
      });
      expect(result.current.queue.map((q) => q.text)).toEqual(['m1', 'm2']);
    });
  });

  // ============ 功能6：localStorage 按会话持久化 ============
  describe('队列按会话持久化到 localStorage', () => {
    it('入队后卸载，重新挂载同会话从 localStorage 恢复队列（含 skillIds 快照）', () => {
      const first = setup({ isConversationActive: true });
      act(() => {
        first.result.current.trySend('persisted', undefined, [9], 5, 'ask');
      });
      expect(first.result.current.queue).toHaveLength(1);
      first.unmount();

      const second = setup({ isConversationActive: true });
      expect(second.result.current.queue).toHaveLength(1);
      expect(second.result.current.queue[0].text).toBe('persisted');
      expect(second.result.current.queue[0].skillIds).toEqual([9]);
      expect(second.result.current.queue[0].queuedAt).toBeInstanceOf(Date);
    });

    it('清空队列后重新挂载不再恢复', () => {
      const first = setup({ isConversationActive: true });
      act(() => {
        first.result.current.trySend('m1');
      });
      act(() => {
        first.result.current.clearQueue();
      });
      first.unmount();

      const second = setup({ isConversationActive: true });
      expect(second.result.current.queue).toHaveLength(0);
    });

    it('持久化恢复后会话空闲时自动消费队首', () => {
      const first = setup({ isConversationActive: true });
      act(() => {
        first.result.current.trySend('persisted');
      });
      first.unmount();

      const second = setup({
        isConversationActive: false,
        minConsumeInterval: 500,
      });
      expect(second.result.current.queue).toHaveLength(1);
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledWith(
        'persisted',
        [],
        undefined,
        undefined,
        undefined,
      );
    });

    it('切换 conversationId 加载对应会话队列并消费', () => {
      localStorage.setItem(
        'msg_queue:conv-2',
        JSON.stringify([
          {
            id: 'q1',
            text: 'from-b',
            queuedAt: new Date().toISOString(),
          },
        ]),
      );

      const { result, rerender } = renderHook(
        (props: any) =>
          useChatMessageQueue({
            ...props,
            conversationId: props.conversationId,
            sendMessage,
            runStopConversation,
          }),
        {
          initialProps: {
            isConversationActive: false,
            messageList: [],
            conversationId: 'conv-1',
            minConsumeInterval: 500,
            hasPendingIntervention: false,
          },
        },
      );

      rerender({
        isConversationActive: false,
        messageList: [],
        conversationId: 'conv-2',
        minConsumeInterval: 500,
        hasPendingIntervention: false,
      });

      expect(result.current.queue).toHaveLength(1);
      expect(result.current.queue[0].text).toBe('from-b');

      act(() => {
        vi.advanceTimersByTime(0);
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledWith(
        'from-b',
        [],
        undefined,
        undefined,
        undefined,
      );
    });
  });
});
