/**
 * routeConditionAdapter 单元测试
 */

import { describe, expect, it } from 'vitest';
import {
  createEmptyConditionArg,
  parseConditionToConditionArgs,
  serializeConditionArg,
} from '../adapters/routeConditionAdapter';

describe('routeConditionAdapter', () => {
  it('serialize EQUAL with literal value', () => {
    const args = [
      {
        compareType: 'EQUAL',
        firstArg: {
          bindValue: 'k1',
          bindValueType: 'Reference',
          name: 'userQuery',
        },
        secondArg: { bindValue: 'foo', bindValueType: 'Input', name: '' },
      },
    ];
    expect(serializeConditionArg(args as any)).toBe('{{userQuery}} == foo');
  });

  it('serialize CONTAINS', () => {
    const args = [
      {
        compareType: 'CONTAINS',
        firstArg: { bindValue: 'k1', name: 'userQuery' },
        secondArg: { bindValue: '退货', bindValueType: 'Input' },
      },
    ];
    expect(serializeConditionArg(args as any)).toBe(
      '{{userQuery}} contains 退货',
    );
  });

  it('serialize 多条件默认 AND 连接', () => {
    const args = [
      {
        compareType: 'CONTAINS',
        firstArg: { bindValue: 'k1', name: 'userQuery' },
        secondArg: { bindValue: '退货', bindValueType: 'Input' },
      },
      {
        compareType: 'GREATER_THAN_OR_EQUAL',
        firstArg: { bindValue: 'k2', name: 'score' },
        secondArg: { bindValue: '60', bindValueType: 'Input' },
      },
    ];
    expect(serializeConditionArg(args as any)).toBe(
      '{{userQuery}} contains 退货 AND {{score}} >= 60',
    );
  });

  it('serialize 多条件 OR 连接', () => {
    const args = [
      {
        compareType: 'EQUAL',
        firstArg: { bindValue: 'k1', name: 'a' },
        secondArg: { bindValue: '1', bindValueType: 'Input' },
      },
      {
        compareType: 'EQUAL',
        firstArg: { bindValue: 'k2', name: 'b' },
        secondArg: { bindValue: '2', bindValueType: 'Input' },
      },
    ];
    expect(serializeConditionArg(args as any, undefined, 'OR')).toBe(
      '{{a}} == 1 OR {{b}} == 2',
    );
  });

  it('serialize 过滤未填写的空条件', () => {
    const args = [
      {
        compareType: 'EQUAL',
        firstArg: { bindValue: 'k1', name: 'a' },
        secondArg: { bindValue: '1', bindValueType: 'Input' },
      },
      createEmptyConditionArg(),
    ];
    expect(serializeConditionArg(args as any)).toBe('{{a}} == 1');
  });

  it('parse contains expression', () => {
    const parsed = parseConditionToConditionArgs('{{userQuery}} contains 退货');
    expect(parsed[0].compareType).toBe('CONTAINS');
    expect(parsed[0].firstArg?.name).toBe('userQuery');
    expect(parsed[0].secondArg?.bindValue).toBe('退货');
  });

  it('empty condition returns default arg', () => {
    expect(parseConditionToConditionArgs('')[0]).toEqual(
      createEmptyConditionArg(),
    );
  });
});
