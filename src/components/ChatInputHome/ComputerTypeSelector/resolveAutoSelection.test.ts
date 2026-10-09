import { describe, expect, it } from 'vitest';
import { resolveAutoSelection } from './resolveAutoSelection';
import type { ComputerOption } from './types';

const LIST: ComputerOption[] = [
  { id: '-1', name: '云端电脑' },
  { id: '339', name: 'NuwaCLI-MPB128' },
  { id: '307', name: '我的电脑307' },
];

const CLOUD_ONLY: ComputerOption[] = [{ id: '-1', name: '云端电脑' }];

describe('resolveAutoSelection', () => {
  describe('strictAgentMemory（首页：沙箱按 agent 绑定）', () => {
    it('有绑定记忆：显示该 agent 自己的记忆（即使与上一个 agent 的选择不同）', () => {
      const r = resolveAutoSelection({
        strictAgentMemory: true,
        agentId: 3091,
        value: '-1',
        computerList: LIST,
        agentSelectedMap: { 3091: '307' },
      });
      expect(r).toEqual({ selectedId: '307', reason: 'memory' });
    });

    it('记忆与当前值一致：返回记忆但不产生变化（由调用方判断相等）', () => {
      const r = resolveAutoSelection({
        strictAgentMemory: true,
        agentId: 3091,
        value: '307',
        computerList: LIST,
        agentSelectedMap: { 3091: '307' },
      });
      expect(r).toEqual({ selectedId: '307', reason: 'memory' });
    });

    it('未绑定过：回落云端默认（不继承上一个 agent 的选择）', () => {
      const r = resolveAutoSelection({
        strictAgentMemory: true,
        agentId: 4184,
        value: '307',
        computerList: LIST,
        agentSelectedMap: {},
      });
      expect(r).toEqual({ selectedId: '-1', reason: 'default-cloud' });
    });

    it('记忆不在列表内（cloudOnly 过滤/电脑下线）：按未绑定处理，回落云端默认', () => {
      const r = resolveAutoSelection({
        strictAgentMemory: true,
        agentId: 3091,
        value: '-1',
        computerList: CLOUD_ONLY,
        agentSelectedMap: { 3091: '307' },
      });
      expect(r).toEqual({ selectedId: '-1', reason: 'default-cloud' });
    });

    it('绑定记忆就是云端：直接采用（后端某天存储 -1 时同样成立）', () => {
      const r = resolveAutoSelection({
        strictAgentMemory: true,
        agentId: 3091,
        value: '307',
        computerList: LIST,
        agentSelectedMap: { 3091: '-1' },
      });
      expect(r).toEqual({ selectedId: '-1', reason: 'memory' });
    });

    it('详情空档（agentId undefined）：按未绑定回落云端默认，不用脏 agentId 计算', () => {
      const r = resolveAutoSelection({
        strictAgentMemory: true,
        agentId: undefined,
        value: '307',
        computerList: LIST,
        agentSelectedMap: { 3091: '307' },
      });
      expect(r).toEqual({ selectedId: '-1', reason: 'default-cloud' });
    });

    it('异常列表（无云端项）且记忆失效：回落列表第一项', () => {
      const r = resolveAutoSelection({
        strictAgentMemory: true,
        agentId: 3091,
        value: '-1',
        computerList: [{ id: '339', name: 'NuwaCLI-MPB128' }],
        agentSelectedMap: { 3091: '307' },
      });
      expect(r).toEqual({ selectedId: '339', reason: 'fallback-first' });
    });

    it('列表为空：无候选', () => {
      const r = resolveAutoSelection({
        strictAgentMemory: true,
        agentId: 3091,
        value: '',
        computerList: [],
        agentSelectedMap: {},
      });
      expect(r).toEqual({ selectedId: null, reason: 'none' });
    });

    it('字符串/数字 id 混用按 String 口径匹配', () => {
      const r = resolveAutoSelection({
        strictAgentMemory: true,
        agentId: '3091' as unknown as number,
        value: '-1',
        computerList: LIST,
        agentSelectedMap: { 3091: '-1' },
      });
      expect(r).toEqual({ selectedId: '-1', reason: 'memory' });
    });
  });

  describe('legacy（默认，既有行为逐句等价）', () => {
    it('记忆无条件顶替当前值（含在列表内）', () => {
      const r = resolveAutoSelection({
        agentId: 3091,
        value: '-1',
        computerList: LIST,
        agentSelectedMap: { 3091: '307' },
      });
      expect(r).toEqual({ selectedId: '307', reason: 'memory' });
    });

    it('记忆不在列表内也顶替（legacy 不校验列表，脏值由 apply 侧 find 兜住）', () => {
      const r = resolveAutoSelection({
        agentId: 3091,
        value: '-1',
        computerList: CLOUD_ONLY,
        agentSelectedMap: { 3091: '307' },
      });
      expect(r).toEqual({ selectedId: '307', reason: 'memory' });
    });

    it('无记忆 + 当前值有效：不产生变化', () => {
      const r = resolveAutoSelection({
        agentId: 4184,
        value: '-1',
        computerList: LIST,
        agentSelectedMap: {},
      });
      expect(r).toEqual({ selectedId: null, reason: 'none' });
    });

    it('无记忆 + 当前值无效：回落列表第一项', () => {
      const r = resolveAutoSelection({
        agentId: 4184,
        value: '',
        computerList: LIST,
        agentSelectedMap: {},
      });
      expect(r).toEqual({ selectedId: '-1', reason: 'fallback-first' });
    });
  });
});
