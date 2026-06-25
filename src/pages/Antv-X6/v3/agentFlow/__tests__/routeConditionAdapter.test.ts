/**
 * routeConditionAdapter 单元测试
 */

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
