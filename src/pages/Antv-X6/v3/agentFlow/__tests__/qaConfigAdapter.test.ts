/**
 * qaConfigAdapter 单元测试
 *
 * answerType 为权威字段（TEXT / SELECT / FORM），兼容历史 askConfig 与旧 replyMode。
 */
import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';
import {
  getHitlOptions,
  isHitlOptionsBranchMode,
  normalizeHitlNodeConfig,
  prepareNodeForBackendSerialize,
  serializeHitlNodeConfig,
} from '../adapters/qaConfigAdapter';

describe('qaConfigAdapter', () => {
  it('normalize: 迁移嵌套 askConfig 为扁平 answerType 并删除废弃字段', () => {
    const out = normalizeHitlNodeConfig({
      askConfig: {
        question: '你好？',
        answerType: AnswerTypeEnum.SELECT,
        options: [{ uuid: 'o1', content: 'A', nextNodeIds: [] }],
      },
    });
    expect(out.question).toBe('你好？');
    expect(out.answerType).toBe(AnswerTypeEnum.SELECT);
    expect(out.options).toHaveLength(1);
    expect(out.askConfig).toBeUndefined();
    expect(out.replyMode).toBeUndefined();
  });

  it('normalize: 兼容旧 replyMode 字段映射到 answerType', () => {
    expect(
      normalizeHitlNodeConfig({ replyMode: 'form', formFields: [] }).answerType,
    ).toBe(AnswerTypeEnum.FORM);
    expect(normalizeHitlNodeConfig({ replyMode: 'options' }).answerType).toBe(
      AnswerTypeEnum.SELECT,
    );
  });

  it('normalize: formFields 非空推断为 FORM', () => {
    expect(
      normalizeHitlNodeConfig({
        formFields: [{ label: 'x', type: 'input' }],
      }).answerType,
    ).toBe(AnswerTypeEnum.FORM);
  });

  it('serialize: 清理废弃字段并保留 answerType', () => {
    const out = serializeHitlNodeConfig({
      question: 'q',
      answerType: AnswerTypeEnum.TEXT,
      askConfig: { question: 'old' },
      replyMode: 'text',
    });
    expect(out.askConfig).toBeUndefined();
    expect(out.replyMode).toBeUndefined();
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

  it('getHitlOptions 优先读取扁平 options', () => {
    expect(
      getHitlOptions({
        options: [{ content: 'flat' }],
        askConfig: { options: [{ content: 'nested' }] },
      }),
    ).toEqual([{ content: 'flat' }]);
  });

  it('serialize: 选择类 selectConfig 归一化为 {label,value}[]，其余清空', () => {
    const out = serializeHitlNodeConfig({
      answerType: AnswerTypeEnum.FORM,
      formArgs: [
        {
          name: '类型',
          inputType: 'select',
          require: true,
          selectConfig: { dataSourceType: 'MANUAL', options: '退货\n换货' },
        },
        {
          name: '说明',
          inputType: 'text',
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

  it('normalize: 迁移历史 formFields 为 formArgs (Arg + inputType + selectConfig)', () => {
    const out = normalizeHitlNodeConfig({
      answerType: AnswerTypeEnum.FORM,
      formFields: [
        { label: '类型', type: 'checkbox', required: true, options: 'A\nB' },
      ],
    });
    expect(out.formFields).toBeUndefined();
    expect(out.formArgs).toHaveLength(1);
    expect(out.formArgs[0]).toMatchObject({
      name: '类型',
      inputType: 'checkboxes',
      require: true,
    });
    // edit 态：options 为多行字符串（表单文本框直接编辑，回车/中文 IME 友好）
    expect(out.formArgs[0].selectConfig.options).toBe('A\nB');
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
    // 非 HumanInteraction 节点（如 LLM / 路由决策）也应剥离
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
            inputType: 'select',
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
      // 顶层重复散落的配置字段（应被剥掉，只在 nodeConfig 内）
      intentConfigs: [{ uuid: 'r1', intent: '退货' }],
      inputArgs: [],
      modelId: 5,
      modelConfig: { id: 5, name: 'deepseek' },
    } as any);
    // 节点级字段保留
    expect(out.id).toBe(1);
    expect(out.name).toBe('路由决策');
    expect(out.nextNodeIds).toEqual([2]);
    // 顶层不再有任何配置字段
    expect((out as any).intentConfigs).toBeUndefined();
    expect((out as any).inputArgs).toBeUndefined();
    expect((out as any).modelId).toBeUndefined();
    expect((out as any).modelConfig).toBeUndefined();
    // 配置完整保留在 nodeConfig 内（modelConfig 也已整体去除，只留 modelId）
    expect(out.nodeConfig.intentConfigs).toHaveLength(1);
    expect(out.nodeConfig.modelId).toBe(5);
    expect(out.nodeConfig.modelConfig).toBeUndefined();
  });
});
