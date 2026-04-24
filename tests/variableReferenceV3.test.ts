import type {
  ChildNode,
  InputAndOutConfig,
  WorkflowDataV3,
} from '@/pages/Antv-X6/v3/types';
import { calculateNodePreviousArgs } from '@/pages/Antv-X6/v3/utils/variableReferenceV3';
import { DataTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { describe, expect, test } from 'vitest';

const arg = (
  name: string,
  dataType: DataTypeEnum | string,
  extra?: Partial<InputAndOutConfig>,
): InputAndOutConfig => ({
  name,
  dataType,
  description: '',
  require: false,
  systemVariable: false,
  bindValue: '',
  key: name,
  subArgs: [],
  ...extra,
});

const buildWorkflow = (nodes: ChildNode[]): WorkflowDataV3 => ({
  workflowId: 1,
  nodes,
  edges: [],
});

describe('variableReferenceV3 loop index scope', () => {
  test('loop outer downstream node should not receive INDEX or *_item', () => {
    const start = {
      id: 1,
      name: 'Start',
      type: NodeTypeEnum.Start,
      icon: '',
      nextNodeIds: [2],
      nodeConfig: {
        outputArgs: [arg('safeFromStart', DataTypeEnum.String)],
      },
    } as ChildNode;

    const loop = {
      id: 2,
      name: 'Loop',
      type: NodeTypeEnum.Loop,
      icon: '',
      nextNodeIds: [3],
      nodeConfig: {
        // 模拟历史脏数据：Loop 配置里错误带入 INDEX / *_item
        outputArgs: [
          arg('INDEX', DataTypeEnum.Integer, { systemVariable: true }),
          arg('input_item', DataTypeEnum.Object),
          arg('safeLoopOutput', DataTypeEnum.String),
        ],
      },
    } as ChildNode;

    const outerNode = {
      id: 3,
      name: 'OuterCode',
      type: NodeTypeEnum.Code,
      icon: '',
      nodeConfig: {},
    } as ChildNode;

    const result = calculateNodePreviousArgs(
      3,
      buildWorkflow([start, loop, outerNode]),
    );

    const loopPrev = result.previousNodes.find((node) => Number(node.id) === 2);
    expect(loopPrev).toBeTruthy();

    const loopOutputNames = loopPrev?.outputArgs.map((item) => item.name) ?? [];
    expect(loopOutputNames).toContain('safeLoopOutput');
    expect(loopOutputNames).not.toContain('INDEX');
    expect(loopOutputNames).not.toContain('input_item');

    expect(result.argMap['2-input.INDEX']).toBeUndefined();
    expect(result.argMap['2-input.input_item']).toBeUndefined();
    expect(result.argMap['2.safeLoopOutput']).toBeTruthy();
  });

  test('loop inner node should still receive INDEX from loopNodeId branch', () => {
    const start = {
      id: 1,
      name: 'Start',
      type: NodeTypeEnum.Start,
      icon: '',
      nextNodeIds: [2],
      nodeConfig: {
        outputArgs: [
          arg('items', DataTypeEnum.Array_Object, {
            subArgs: [arg('field', DataTypeEnum.String)],
          }),
        ],
      },
    } as ChildNode;

    const loop = {
      id: 2,
      name: 'Loop',
      type: NodeTypeEnum.Loop,
      icon: '',
      nextNodeIds: [3],
      nodeConfig: {
        inputArgs: [
          arg('items', DataTypeEnum.Array_Object, {
            bindValueType: 'Reference',
            bindValue: '1.items',
          }),
        ],
        outputArgs: [arg('loopResult', DataTypeEnum.String)],
      },
    } as ChildNode;

    const innerNode = {
      id: 3,
      name: 'InnerCode',
      type: NodeTypeEnum.Code,
      icon: '',
      loopNodeId: 2,
      nodeConfig: {},
    } as ChildNode;

    const result = calculateNodePreviousArgs(
      3,
      buildWorkflow([start, loop, innerNode]),
    );
    const loopOutputs = result.previousNodes
      .filter((node) => Number(node.id) === 2)
      .flatMap((node) => node.outputArgs.map((output) => output.key));

    expect(loopOutputs).toContain('2-input.INDEX');
    expect(result.argMap['2-input.INDEX']).toBeTruthy();
  });
});
