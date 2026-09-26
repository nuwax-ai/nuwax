import { describe, expect, it } from 'vitest';
import { resolveComputerSelection } from './resolveComputerSelection';

const base = {
  conversationId: 1694776,
  restoreConversationSandbox: true,
  selectedComputerId: '-1',
  agentSandboxId: '-1',
  isSelectionLocked: false,
  hasUserSentMessage: true,
  hasPersistedMessage: true,
};

describe('历史会话选择器状态', () => {
  it('绑定的个人电脑固定显示会话 ID，并在列表缺失时启用个人电脑不可用提示', () => {
    expect(
      resolveComputerSelection({
        ...base,
        conversationInfo: { id: 1694776, sandboxServerId: '366' },
      }),
    ).toEqual({
      agentSandboxId: '366',
      fixedSelection: true,
      isPersonalComputer: true,
    });
  });

  it('云端会话固定云端电脑，但不标为个人电脑', () => {
    expect(
      resolveComputerSelection({
        ...base,
        conversationInfo: { id: 1694776, sandboxServerId: '-1' },
      }),
    ).toEqual({
      agentSandboxId: '-1',
      fixedSelection: true,
      isPersonalComputer: false,
    });
  });

  it('会话未绑定电脑时，即使有历史消息也允许选择', () => {
    expect(
      resolveComputerSelection({
        ...base,
        selectedComputerId: '366',
        agentSandboxId: '377',
        conversationInfo: { id: 1694776, sandboxServerId: '' },
      }),
    ).toEqual({
      agentSandboxId: '366',
      fixedSelection: false,
      isPersonalComputer: false,
    });
  });

  it('旧会话快照不锁定当前会话', () => {
    expect(
      resolveComputerSelection({
        ...base,
        hasPersistedMessage: false,
        hasUserSentMessage: false,
        conversationInfo: { id: 1694775, sandboxServerId: '366' },
      }),
    ).toEqual({
      agentSandboxId: '-1',
      fixedSelection: false,
      isPersonalComputer: false,
    });
  });
});
