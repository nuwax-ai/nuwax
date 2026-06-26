/**
 * qaConfigAdapter 单元测试
 *
 * answerType 为权威字段（TEXT / SELECT / FORM），兼容历史 askConfig 与旧 replyMode。
 */
import { AnswerTypeEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';
import {
  getHitlOptions,
  isHitlOptionsBranchMode,
  normalizeHitlNodeConfig,
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
    expect(out.formArgs[0].selectConfig.options).toEqual([
      { label: 'A', value: 'A' },
      { label: 'B', value: 'B' },
    ]);
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
});
