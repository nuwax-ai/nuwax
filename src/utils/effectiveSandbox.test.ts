import { describe, expect, it } from 'vitest';
import {
  isRealAgentSandboxBinding,
  normalizeSandboxIdValue,
  resolveEffectiveSandboxId,
} from './effectiveSandbox';

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

describe('isRealAgentSandboxBinding 真实绑定判定（bug 2490：云端记忆 -1 不锁选择器）', () => {
  it('云端哨兵 -1（string/number）不算绑定——空会话仍可改选个人电脑', () => {
    expect(isRealAgentSandboxBinding('-1')).toBe(false);
    expect(isRealAgentSandboxBinding(-1)).toBe(false);
  });

  it('空值（undefined/null/空串）不算绑定', () => {
    expect(isRealAgentSandboxBinding(undefined)).toBe(false);
    expect(isRealAgentSandboxBinding(null)).toBe(false);
    expect(isRealAgentSandboxBinding('')).toBe(false);
  });

  it('个人电脑 id（数字串/非数字新沙箱形态）算真绑定，维持固定锁选', () => {
    expect(isRealAgentSandboxBinding('377')).toBe(true);
    expect(isRealAgentSandboxBinding(377)).toBe(true);
    expect(isRealAgentSandboxBinding('sb-a1b2c3')).toBe(true);
  });
});

describe('normalizeSandboxIdValue 报文归一（bug2443：勿 Number 转 NaN）', () => {
  it('数字形态字符串转 number（对齐后端 Long 契约，含云哨兵 -1）', () => {
    expect(normalizeSandboxIdValue('377')).toBe(377);
    expect(normalizeSandboxIdValue('-1')).toBe(-1);
    expect(normalizeSandboxIdValue('0')).toBe(0);
  });

  it('number 原样保留', () => {
    expect(normalizeSandboxIdValue(377)).toBe(377);
    expect(normalizeSandboxIdValue(-1)).toBe(-1);
  });

  it('非数字形态 id（新沙箱）原样透传字符串，绝不转 NaN', () => {
    expect(normalizeSandboxIdValue('sb-a1b2c3')).toBe('sb-a1b2c3');
    expect(normalizeSandboxIdValue('uuid-377-x')).toBe('uuid-377-x');
  });

  it('空值（undefined/null/空串/空白）返回 undefined，由调用方兜底', () => {
    expect(normalizeSandboxIdValue(undefined)).toBeUndefined();
    expect(normalizeSandboxIdValue(null)).toBeUndefined();
    expect(normalizeSandboxIdValue('')).toBeUndefined();
    expect(normalizeSandboxIdValue('   ')).toBeUndefined();
  });

  it('非纯数字或往返无损失败的数字串保持字符串（防前导零/超精度损坏）', () => {
    expect(normalizeSandboxIdValue('0377')).toBe('0377');
    expect(normalizeSandboxIdValue('9007199254740993')).toBe(
      '9007199254740993',
    );
    expect(normalizeSandboxIdValue('37.5')).toBe('37.5');
  });
});
