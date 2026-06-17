import {
  DataTypeEnumV2,
  NodeTypeEnumV2,
  type ChildNodeV2,
  type InputAndOutConfigV2,
  type WorkflowDataV2,
} from '@/pages/Antv-X6/v2/types';
import {
  calculateNodePreviousArgs,
  findReferencesToNode,
  getReferencedArg,
  isValidReference,
} from '@/pages/Antv-X6/v2/utils/variableReferenceV2';
import { describe, expect, test } from 'vitest';

const arg = (
  name: string,
  dataType: DataTypeEnumV2 | string,
  extra?: Partial<InputAndOutConfigV2>,
): InputAndOutConfigV2 => ({
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

const buildWorkflow = (nodeList: ChildNodeV2[]): WorkflowDataV2 => ({
  nodeList,
  edgeList: [],
  lastSavedVersion: '',
  isDirty: false,
});

describe('variableReferenceV2', () => {
  test('Start exposes input args and SYS_* variables', () => {
    const start: ChildNodeV2 = {
      id: 1,
      name: 'Start',
      type: NodeTypeEnumV2.Start,
      icon: '',
      nextNodeIds: [2],
      nodeConfig: { inputArgs: [arg('userInput', DataTypeEnumV2.String)] },
    };
    const current: ChildNodeV2 = {
      id: 2,
      name: 'Code',
      type: NodeTypeEnumV2.Code,
      icon: '',
      nodeConfig: {},
    };
    const result = calculateNodePreviousArgs(
      2,
      buildWorkflow([start, current]),
    );

    const startNode = result.previousNodes.find((n) => n.id === 1);
    expect(startNode).toBeTruthy();
    expect(startNode?.outputArgs.some((o) => o.name === 'userInput')).toBe(
      true,
    );
    // SYS_* 被追加
    expect(startNode?.outputArgs.some((o) => o.name.startsWith('SYS_'))).toBe(
      true,
    );
    expect(result.argMap['1.userInput']).toBeTruthy();
  });

  test('Loop node exposes INDEX and <name>_item when inside loop', () => {
    const start: ChildNodeV2 = {
      id: 1,
      name: 'Start',
      type: NodeTypeEnumV2.Start,
      icon: '',
      nextNodeIds: [2, 3],
      nodeConfig: {
        outputArgs: [
          arg('arr', DataTypeEnumV2.Array_Object, {
            subArgs: [arg('field', DataTypeEnumV2.String)],
          }),
        ],
      },
    };
    const loop: ChildNodeV2 = {
      id: 2,
      name: 'Loop',
      type: NodeTypeEnumV2.Loop,
      icon: '',
      nextNodeIds: [3],
      nodeConfig: {
        inputArgs: [
          arg('arr', DataTypeEnumV2.Array_Object, {
            bindValueType: 'Reference',
            bindValue: '1.arr',
          }),
        ],
        innerNodes: [],
      },
    };
    const inner: ChildNodeV2 = {
      id: 3,
      name: 'InnerCode',
      type: NodeTypeEnumV2.Code,
      icon: '',
      nodeConfig: {},
      loopNodeId: 2,
    };
    loop.innerNodes?.push(inner);

    const result = calculateNodePreviousArgs(
      3,
      buildWorkflow([start, loop, inner]),
    );

    const loopOutputs = result.previousNodes
      .filter((n) => n.id === 2)
      .flatMap((n) => n.outputArgs || []);
    expect(loopOutputs.some((o) => o.name === 'arr_item')).toBe(true);
    expect(loopOutputs.some((o) => o.name === 'INDEX')).toBe(true);
    expect(result.argMap['2.arr_item']).toBeTruthy();
    expect(result.argMap['2.INDEX']).toBeTruthy();
  });

  test('Condition / parallel branches keep topological order (A before B)', () => {
    const start: ChildNodeV2 = {
      id: 1,
      name: 'Start',
      type: NodeTypeEnumV2.Start,
      icon: '',
      nextNodeIds: [2, 4],
      nodeConfig: { outputArgs: [arg('sOut', DataTypeEnumV2.String)] },
    };
    const a: ChildNodeV2 = {
      id: 2,
      name: 'A',
      type: NodeTypeEnumV2.Code,
      icon: '',
      nextNodeIds: [3],
      nodeConfig: { outputArgs: [arg('aOut', DataTypeEnumV2.String)] },
    };
    const b: ChildNodeV2 = {
      id: 4,
      name: 'B',
      type: NodeTypeEnumV2.Code,
      icon: '',
      nextNodeIds: [3],
      nodeConfig: { outputArgs: [arg('bOut', DataTypeEnumV2.String)] },
    };
    const current: ChildNodeV2 = {
      id: 3,
      name: 'C',
      type: NodeTypeEnumV2.Code,
      icon: '',
      nodeConfig: {},
    };

    const result = calculateNodePreviousArgs(
      3,
      buildWorkflow([start, a, b, current]),
    );
    const ids = result.previousNodes.map((n) => n.id);
    expect(ids).toEqual([1, 2, 4]); // Start 在前，A 在 B 前
  });

  test('Exception flow is included when EXECUTE_EXCEPTION_FLOW', () => {
    const source: ChildNodeV2 = {
      id: 5,
      name: 'LLM',
      type: NodeTypeEnumV2.LLM,
      icon: '',
      nodeConfig: {
        outputArgs: [arg('llmOut', DataTypeEnumV2.String)],
        exceptionHandleConfig: {
          exceptionHandleType: 'EXECUTE_EXCEPTION_FLOW' as any,
          timeout: 0,
          retryCount: 0,
          exceptionHandleNodeIds: [6],
        },
      },
    };
    const target: ChildNodeV2 = {
      id: 6,
      name: 'AfterException',
      type: NodeTypeEnumV2.Code,
      icon: '',
      nodeConfig: {},
    };

    const result = calculateNodePreviousArgs(
      6,
      buildWorkflow([source, target]),
    );
    expect(result.argMap['5.llmOut']).toBeTruthy();
  });

  test('reference helpers validate and return referenced args', () => {
    const argMap = {
      '1.userInput': arg('userInput', DataTypeEnumV2.String),
    };
    expect(isValidReference('1.userInput', argMap)).toBe(true);
    expect(isValidReference('1.missing', argMap)).toBe(false);
    expect(getReferencedArg('1.userInput', argMap)?.name).toBe('userInput');
  });

  test('findReferencesToNode detects inputArgs and prompt references', () => {
    const target: ChildNodeV2 = {
      id: 10,
      name: 'LLM',
      type: NodeTypeEnumV2.LLM,
      icon: '',
      nodeConfig: {
        inputArgs: [
          {
            name: 'question',
            dataType: DataTypeEnumV2.String,
            bindValueType: 'Reference',
            bindValue: '1.userInput',
            description: '',
            require: false,
            systemVariable: false,
            key: 'question',
            subArgs: [],
          },
        ],
        systemPrompt: '{{1.userInput}}',
      },
    };

    const refs = findReferencesToNode(1, target);
    const fields = refs.map((r) => r.field);
    expect(fields).toContain('inputArgs[0].question');
    expect(fields).toContain('systemPrompt');
  });
});
