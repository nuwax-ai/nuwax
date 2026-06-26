/**
 * qaConfigAdapter 单元测试
 *
 * answerType 为权威字段（TEXT / SELECT / FORM）
 */
import {
  AnswerTypeEnum,
  FormArgInputTypeEnum,
  NodeTypeEnum,
} from '@/types/enums/common';
import { describe, expect, it } from 'vitest';
import {
  coerceFormArgInputType,
  getHitlOptions,
  isFormArgChoiceInputType,
  isHitlOptionsBranchMode,
  normalizeHitlNodeConfig,
  prepareNodeForBackendSerialize,
  serializeHitlNodeConfig,
} from '../adapters/qaConfigAdapter';

describe('qaConfigAdapter', () => {
  it('normalize: 补全 answerType 与 formArgs 默认值', () => {
    const out = normalizeHitlNodeConfig({
      question: '你好？',
      answerType: AnswerTypeEnum.SELECT,
      options: [{ uuid: 'o1', content: 'A', nextNodeIds: [] }],
    });
    expect(out.question).toBe('你好？');
    expect(out.answerType).toBe(AnswerTypeEnum.SELECT);
    expect(out.options).toHaveLength(1);
    expect(out.inputArgs).toEqual([]);
    expect(out.formArgs).toEqual([]);
  });

  it('normalize: formArgs 非空推断为 FORM', () => {
    expect(
      normalizeHitlNodeConfig({
        formArgs: [{ name: 'x', inputType: FormArgInputTypeEnum.Text }],
      }).answerType,
    ).toBe(AnswerTypeEnum.FORM);
  });

  it('serialize: 保留 answerType', () => {
    const out = serializeHitlNodeConfig({
      question: 'q',
      answerType: AnswerTypeEnum.TEXT,
    });
    expect(out.answerType).toBe(AnswerTypeEnum.TEXT);
  });

  it('serialize: SELECT 保留 options 连线，FORM/TEXT 清空', () => {
    const sel = serializeHitlNodeConfig({
      answerType: AnswerTypeEnum.SELECT,
      options: [{ uuid: 'o1', nextNodeIds: [5] }],
    });
    expect(sel.options[0].nextNodeIds).toEqual([5]);

    const form = serializeHitlNodeConfig({
      answerType: AnswerTypeEnum.FORM,
      options: [{ uuid: 'o1', nextNodeIds: [5] }],
    });
    expect(form.options[0].nextNodeIds).toEqual([]);
  });

  it('getHitlOptions 读取扁平 options', () => {
    expect(
      getHitlOptions({
        options: [{ content: 'flat' }],
      }),
    ).toEqual([{ content: 'flat' }]);
  });

  it('serialize: 选择类 selectConfig 归一化为 {label,value}[]，其余清空', () => {
    const out = serializeHitlNodeConfig({
      answerType: AnswerTypeEnum.FORM,
      formArgs: [
        {
          name: '类型',
          inputType: FormArgInputTypeEnum.Select,
          require: true,
          selectConfig: { dataSourceType: 'MANUAL', options: '退货\n换货' },
        },
        {
          name: '说明',
          inputType: FormArgInputTypeEnum.Text,
          require: false,
          selectConfig: { dataSourceType: 'MANUAL', options: '脏数据' },
        },
      ],
    });
    expect(out.formArgs[0].selectConfig.options).toEqual([
      { label: '退货', value: '退货' },
      { label: '换货', value: '换货' },
    ]);
    expect(out.formArgs[1].selectConfig).toBeNull();
  });

  it('normalize: formArgs 补全 inputType 与 selectConfig 编辑态', () => {
    const out = normalizeHitlNodeConfig({
      answerType: AnswerTypeEnum.FORM,
      formArgs: [
        {
          name: '类型',
          inputType: FormArgInputTypeEnum.MultipleSelect,
          require: true,
          selectConfig: { options: 'A\nB' },
        },
      ],
    });
    expect(out.formArgs[0]).toMatchObject({
      name: '类型',
      inputType: FormArgInputTypeEnum.MultipleSelect,
      require: true,
    });
    expect(out.formArgs[0].selectConfig.options).toBe('A\nB');
  });

  it('coerceFormArgInputType: 非法值兜底 Text', () => {
    expect(coerceFormArgInputType('radio')).toBe(FormArgInputTypeEnum.Text);
    expect(coerceFormArgInputType(FormArgInputTypeEnum.Radio)).toBe(
      FormArgInputTypeEnum.Radio,
    );
  });

  it('isFormArgChoiceInputType: Select/Radio/MultipleSelect 为真', () => {
    expect(isFormArgChoiceInputType(FormArgInputTypeEnum.Radio)).toBe(true);
    expect(isFormArgChoiceInputType(FormArgInputTypeEnum.Text)).toBe(false);
  });

  it('isHitlOptionsBranchMode 仅 SELECT 为真', () => {
    expect(isHitlOptionsBranchMode({ answerType: AnswerTypeEnum.SELECT })).toBe(
      true,
    );
    expect(isHitlOptionsBranchMode({ answerType: AnswerTypeEnum.FORM })).toBe(
      false,
    );
    expect(isHitlOptionsBranchMode({ answerType: AnswerTypeEnum.TEXT })).toBe(
      false,
    );
  });

  it('prepareNodeForBackendSerialize: 剥离后端解析的完整 modelConfig（仅保留顶层 modelId）', () => {
    const llm = prepareNodeForBackendSerialize({
      id: 1,
      type: NodeTypeEnum.LLM,
      nodeConfig: {
        modelId: 5,
        modelConfig: {
          id: 5,
          name: 'deepseek',
          creator: { userId: 1 },
          tenantId: 1,
        },
        temperature: 0.7,
      },
    });
    expect(llm.nodeConfig.modelConfig).toBeUndefined();
    expect(llm.nodeConfig.modelId).toBe(5);
    expect(llm.nodeConfig.temperature).toBe(0.7);
  });

  it('prepareNodeForBackendSerialize: HumanInteraction 同时扁平化并剥离 modelConfig', () => {
    const out = prepareNodeForBackendSerialize({
      id: 2,
      type: NodeTypeEnum.HumanInteraction,
      nodeConfig: {
        answerType: AnswerTypeEnum.FORM,
        modelId: 5,
        modelConfig: { id: 5, name: 'deepseek', creator: {} },
        formArgs: [
          {
            name: '类型',
            inputType: FormArgInputTypeEnum.Select,
            selectConfig: { options: 'a\nb' },
          },
        ],
      },
    });
    expect(out.nodeConfig.modelConfig).toBeUndefined();
    expect(out.nodeConfig.modelId).toBe(5);
    expect(out.nodeConfig.formArgs[0].selectConfig.options).toEqual([
      { label: 'a', value: 'a' },
      { label: 'b', value: 'b' },
    ]);
  });

  it('prepareNodeForBackendSerialize: 节点顶层不重复 nodeConfig 字段（配置只在 nodeConfig）', () => {
    const out = prepareNodeForBackendSerialize({
      id: 1,
      name: '路由决策',
      type: NodeTypeEnum.IntentRecognition,
      nextNodeIds: [2],
      nodeConfig: {
        modelId: 5,
        intentConfigs: [{ uuid: 'r1', intent: '退货' }],
        inputArgs: [],
        outputArgs: [],
      },
      intentConfigs: [{ uuid: 'r1', intent: '退货' }],
      inputArgs: [],
      modelId: 5,
      modelConfig: { id: 5, name: 'deepseek' },
    } as any);
    expect(out.id).toBe(1);
    expect(out.name).toBe('路由决策');
    expect(out.nextNodeIds).toEqual([2]);
    expect((out as any).intentConfigs).toBeUndefined();
    expect((out as any).inputArgs).toBeUndefined();
    expect((out as any).modelId).toBeUndefined();
    expect((out as any).modelConfig).toBeUndefined();
    expect(out.nodeConfig.intentConfigs).toHaveLength(1);
    expect(out.nodeConfig.modelId).toBe(5);
    expect(out.nodeConfig.modelConfig).toBeUndefined();
  });
});
