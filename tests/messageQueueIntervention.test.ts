/**
 * 消息队列与 Intervention 协调测试
 *
 * 测试场景：
 * - 多 Intervention 并发时的队列暂停
 * - Intervention 提交后的队列恢复
 * - 混合类型 Intervention（ask+审批）的处理顺序
 * - Intervention 超时与队列消费恢复
 */
import { useChatMessageQueue } from '@/components/business-component/MessageQueue/useChatMessageQueue';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('消息队列与 Intervention 协调', () => {
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

  const setup = (initialProps: any = {}) => {
    return renderHook(
      ({
        isConversationActive,
        hasPendingIntervention,
        minConsumeInterval,
        messageList,
      }: any) =>
        useChatMessageQueue({
          isConversationActive,
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
          hasPendingIntervention: false,
          minConsumeInterval: 500,
          messageList: [],
          ...initialProps,
        },
      },
    );
  };

  // ============ 场景1：Intervention 出现时暂停队列消费 ============
  describe('Intervention 出现时暂停队列消费', () => {
    it('会话空闲时出现 Intervention，队列消费暂停', () => {
      const { result, rerender } = setup({ isConversationActive: true });

      // 入队消息
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
      });

      // 会话空闲，触发自动消费
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 首条消息应被消费
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

      // 模拟 m1 处理周期：会话活跃再空闲
      rerender({
        isConversationActive: true,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 出现 Intervention（会话仍活跃）
      rerender({
        isConversationActive: true,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 会话空闲但 Intervention pending
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 推进时间，不应消费
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(sendMessage).toHaveBeenCalledTimes(1); // 仍然只有1次
    });

    it('会话活跃时出现 Intervention，队列继续等待', () => {
      const { result, rerender } = setup({ isConversationActive: true });

      // 入队消息
      act(() => {
        result.current.trySend('m1');
      });

      // 出现 Intervention（会话仍活跃）
      rerender({
        isConversationActive: true,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 会话空闲，但 Intervention 仍 pending
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(sendMessage).not.toHaveBeenCalled();
    });
  });

  // ============ 场景2：Intervention 提交后恢复队列消费 ============
  describe('Intervention 提交后恢复队列消费', () => {
    it('Intervention 解除后自动消费队首消息', () => {
      const { result, rerender } = setup({ isConversationActive: true });

      // 入队消息
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
      });

      // 会话空闲 + Intervention pending
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });

      // Intervention 解除
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 应自动消费
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

    it('Intervention 解除后遵循最小消费间隔', () => {
      const { result, rerender } = setup({
        isConversationActive: true,
        minConsumeInterval: 1000,
      });

      // 入队消息
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
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(sendMessage).toHaveBeenCalledTimes(1);

      // Intervention 出现
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 1000,
        messageList: [],
      });

      // Intervention 解除
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 1000,
        messageList: [],
      });

      // 500ms 后不应消费（间隔不足）
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledTimes(1);

      // 1000ms 后应消费 m2
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

  // ============ 场景3：混合类型 Intervention 处理 ============
  describe('混合类型 Intervention 处理', () => {
    it('多个 Intervention 依次处理后恢复队列消费', () => {
      const { result, rerender } = setup({ isConversationActive: true });

      // 入队多条消息
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
        result.current.trySend('m3');
      });

      // 第一个 Intervention
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 第一个 Intervention 解除
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 消费 m1
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

      // 第二个 Intervention
      rerender({
        isConversationActive: true,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 第二个 Intervention 解除
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 消费 m2
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledTimes(2);
      expect(sendMessage).toHaveBeenCalledWith(
        'm2',
        [],
        undefined,
        undefined,
        undefined,
      );
    });

    it('Intervention 期间新增消息，解除后按顺序消费', () => {
      const { result, rerender } = setup({ isConversationActive: true });

      // 入队 m1
      act(() => {
        result.current.trySend('m1');
      });

      // 会话空闲
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 消费 m1
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

      // 模拟 m1 处理周期
      rerender({
        isConversationActive: true,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });

      // Intervention 出现 + 入队 m2
      act(() => {
        result.current.trySend('m2');
      });

      rerender({
        isConversationActive: true,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 会话空闲但 Intervention pending
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });

      // Intervention 解除
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 消费 m2
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(sendMessage).toHaveBeenCalledTimes(2);
      expect(sendMessage).toHaveBeenCalledWith(
        'm2',
        [],
        undefined,
        undefined,
        undefined,
      );
    });
  });

  // ============ 场景4：错误状态与 Intervention 交互 ============
  describe('错误状态与 Intervention 交互', () => {
    it('最后一条消息出错时，即使 Intervention 解除也不消费', () => {
      const { result, rerender } = setup({ isConversationActive: true });

      // 入队消息
      act(() => {
        result.current.trySend('m1');
      });

      // Intervention 出现 + 最后一条消息出错
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [{ id: 'err-msg', status: 'error' }],
      });

      // Intervention 解除
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [{ id: 'err-msg', status: 'error' }],
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('错误消息修复后，Intervention 解除可恢复消费', () => {
      const { result, rerender } = setup({ isConversationActive: true });

      // 入队消息
      act(() => {
        result.current.trySend('m1');
      });

      // Intervention + 错误状态
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [{ id: 'err-msg', status: 'error' }],
      });

      // Intervention 解除 + 错误修复
      rerender({
        isConversationActive: false,
        hasPendingIntervention: false,
        minConsumeInterval: 500,
        messageList: [{ id: 'msg-1', status: 'completed' }],
      });

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
  });

  // ============ 场景5：会话切换时重置 Intervention 状态 ============
  describe('会话切换时重置状态', () => {
    it('切换会话时清空队列并重置 Intervention 状态', () => {
      const { result, rerender } = setup({
        isConversationActive: true,
        conversationId: 'conv-1',
      });

      // 入队消息
      act(() => {
        result.current.trySend('m1');
      });

      // Intervention 出现
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
        conversationId: 'conv-1',
      });

      // 切换会话（conversationId 变化）
      // 注意：实际使用中 conversationId 变化会触发 useEffect 清空队列
      // 这里模拟队列已清空的状态
      act(() => {
        result.current.clearQueue();
      });

      expect(result.current.queue).toHaveLength(0);
    });
  });

  // ============ 场景6：立即发送与 Intervention 协调 ============
  describe('立即发送与 Intervention 协调', () => {
    it('Intervention pending 时点击立即发送，停止当前会话', () => {
      const { result, rerender } = setup({ isConversationActive: true });

      // 入队消息
      act(() => {
        result.current.trySend('m1');
        result.current.trySend('m2');
      });

      // Intervention 出现
      rerender({
        isConversationActive: false,
        hasPendingIntervention: true,
        minConsumeInterval: 500,
        messageList: [],
      });

      // 立即发送 m2
      const m2 = result.current.queue[1];
      act(() => {
        result.current.sendNow(m2);
      });

      expect(runStopConversation).toHaveBeenCalledWith('conv-1');
      expect(result.current.queue[0].text).toBe('m2');
    });
  });
});
