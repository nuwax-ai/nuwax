import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useChatSandbox } from './useChatSandbox';

const conversation = (sandboxServerId: string) =>
  ({ id: 1694776, sandboxServerId } as ConversationInfo);

describe('历史会话电脑恢复', () => {
  it('会话绑定优先于智能体的云端记忆和页面手动状态', () => {
    const info = conversation('366');
    const { result } = renderHook(() =>
      useChatSandbox({
        conversationId: 1694776,
        location: { key: 'history', state: undefined },
        history: { action: 'POP' },
        effectiveAgent: { sandboxId: '-1' },
        conversationInfo: info,
      }),
    );

    expect(result.current.finalSelectedId).toBe('366');
    act(() => result.current.setSelectedComputerId('-1'));
    expect(result.current.finalSelectedId).toBe('366');
  });

  it('详情刚返回时按本会话绑定发送，旧会话快照不参与当前会话', () => {
    const { result } = renderHook(() =>
      useChatSandbox({
        conversationId: 1694776,
        location: { key: 'history', state: undefined },
        history: { action: 'POP' },
        effectiveAgent: { sandboxId: '-1' },
        conversationInfo: undefined,
      }),
    );

    expect(result.current.getEffectiveSandboxId(conversation('366'))).toBe(
      '366',
    );
    expect(
      result.current.getEffectiveSandboxId({
        ...conversation('366'),
        id: 1694775,
      }),
    ).toBe('-1');
  });

  it('会话未绑定电脑时仍可手动选择', () => {
    const { result } = renderHook(() =>
      useChatSandbox({
        conversationId: 1694776,
        location: { key: 'history', state: undefined },
        history: { action: 'POP' },
        effectiveAgent: { sandboxId: '-1' },
        conversationInfo: conversation(''),
      }),
    );

    act(() => result.current.setSelectedComputerId('366'));
    expect(result.current.finalSelectedId).toBe('366');
  });
});
