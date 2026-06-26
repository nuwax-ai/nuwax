/**
 * routeConditionAdapter 单元测试
 *
 * RouteDecision 用结构化 conditionArgs（多条件 AND/OR）；末尾固定一条
 * 「其他意图」兜底分支（intentType:OTHER），用户分支 intentType:NORMAL。
 */

import { describe, expect, it } from 'vitest';
import {
  createEmptyConditionArg,
  createOtherIntentBranch,
  hydrateIntentConfigs,
} from '../adapters/routeConditionAdapter';

describe('routeConditionAdapter', () => {
  it('createEmptyConditionArg: 左值=变量、右值=字面值', () => {
    const arg = createEmptyConditionArg();
    expect(arg.compareType).toBe('EQUAL');
    expect(arg.firstArg?.bindValueType).toBe('Reference');
    expect(arg.secondArg?.bindValueType).toBe('Input');
  });

  it('createOtherIntentBranch: intentType=OTHER、name=其他意图、无条件', () => {
    const b = createOtherIntentBranch();
    expect(b.intentType).toBe('OTHER');
    expect(b.name).toBe('其他意图');
    expect(b.conditionArgs).toEqual([]);
  });

  it('hydrateIntentConfigs: 旧字段对齐 intent→name / description→intent，用户分支标 NORMAL，末尾补 OTHER', () => {
    const out = hydrateIntentConfigs([
      {
        uuid: 'r-1',
        intent: '退货',
        description: '退货描述',
        condition: '{{x}} == 1', // 废弃，应去除
        expression: null, // 废弃
        conditionArgs: [{ compareType: 'EQUAL' }],
        nextNodeIds: [2],
      },
    ]);
    expect(out).toHaveLength(2); // 用户分支 + 末尾兜底
    expect(out[0]).toMatchObject({
      uuid: 'r-1',
      name: '退货',
      intent: '退货描述',
      intentType: 'NORMAL',
      nextNodeIds: [2],
    });
    expect(out[0].condition).toBeUndefined();
    expect(out[0].expression).toBeUndefined();
    expect(out[0].conditionArgs).toHaveLength(1);
    expect(out[1].intentType).toBe('OTHER');
    expect(out[1].name).toBe('其他意图');
  });

  it('hydrateIntentConfigs: OTHER 兜底分支挪到末尾，仅保留一条', () => {
    const out = hydrateIntentConfigs([
      { uuid: 'a', intentType: 'OTHER', name: '兜底', nextNodeIds: [9] },
      { uuid: 'b', name: '用户分支', conditionArgs: [] },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0].uuid).toBe('b');
    expect(out[0].intentType).toBe('NORMAL');
    expect(out[1].uuid).toBe('a');
    expect(out[1].intentType).toBe('OTHER');
  });

  it('hydrateIntentConfigs: 无数据时返回单条 OTHER 兜底分支', () => {
    const out = hydrateIntentConfigs([]);
    expect(out).toHaveLength(1);
    expect(out[0].intentType).toBe('OTHER');
  });
});
