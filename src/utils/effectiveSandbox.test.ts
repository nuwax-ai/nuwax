import { describe, expect, it } from 'vitest';
import { resolveEffectiveSandboxId } from './effectiveSandbox';

describe('resolveEffectiveSandboxId 四级取值链（bug 2451 单源）', () => {
  it('手动选择最优先，压过 PUSH 携带/智能体绑定/共享电脑', () => {
    expect(
      resolveEffectiveSandboxId({
        selectedComputerId: '66',
        pushStateComputerId: '77',
        agentSandboxId: '88',
        sandboxServerId: '99',
      }),
    ).toBe('66');
  });

  it('PUSH 携带次优先，压过智能体绑定/共享电脑', () => {
    expect(
      resolveEffectiveSandboxId({
        pushStateComputerId: '77',
        agentSandboxId: '88',
        sandboxServerId: '99',
      }),
    ).toBe('77');
  });

  it('智能体绑定第三，压过共享电脑（与 OPEN_DESKTOP gate 64db47a9d 同序）', () => {
    expect(
      resolveEffectiveSandboxId({
        agentSandboxId: '88',
        sandboxServerId: '99',
      }),
    ).toBe('88');
  });

  it('仅共享电脑时取共享电脑', () => {
    expect(resolveEffectiveSandboxId({ sandboxServerId: '99' })).toBe('99');
  });

  it('全空返回空串，由调用方兜底云电脑哨兵', () => {
    expect(resolveEffectiveSandboxId({})).toBe('');
    expect(
      resolveEffectiveSandboxId({
        selectedComputerId: '',
        pushStateComputerId: null,
        agentSandboxId: undefined,
        sandboxServerId: 0,
      }),
    ).toBe('');
  });

  it('number 归一为 string（云哨兵/个人沙箱 id 均可数字形态传入）', () => {
    expect(resolveEffectiveSandboxId({ selectedComputerId: 66 })).toBe('66');
    expect(resolveEffectiveSandboxId({ agentSandboxId: 88 })).toBe('88');
    expect(resolveEffectiveSandboxId({ sandboxServerId: 99 })).toBe('99');
    expect(resolveEffectiveSandboxId({ selectedComputerId: -1 })).toBe('-1');
  });
});
