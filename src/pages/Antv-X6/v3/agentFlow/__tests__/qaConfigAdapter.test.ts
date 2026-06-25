/**
 * qaConfigAdapter 单元测试
 */
import { AnswerTypeEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';
import {
  getHitlOptions,
  getHitlReplyMode,
  normalizeHitlNodeConfig,
  serializeHitlNodeConfig,
} from '../adapters/qaConfigAdapter';

describe('qaConfigAdapter', () => {
  it('should migrate nested askConfig to flat fields on normalize', () => {
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
    expect(out.replyMode).toBe('options');
  });

  it('should serialize flat fields and remove askConfig', () => {
    const out = serializeHitlNodeConfig({
      question: 'q',
      replyMode: 'text',
      askConfig: { question: 'old' },
    });
    expect(out.askConfig).toBeUndefined();
    expect(out.answerType).toBe(AnswerTypeEnum.TEXT);
  });

  it('getHitlOptions prefers flat options', () => {
    expect(
      getHitlOptions({
        options: [{ content: 'flat' }],
        askConfig: { options: [{ content: 'nested' }] },
      }),
    ).toEqual([{ content: 'flat' }]);
  });

  it('getHitlReplyMode detects form mode', () => {
    expect(getHitlReplyMode({ replyMode: 'form', formFields: [] })).toBe(
      'form',
    );
  });

  it('explicit replyMode wins over leftover formFields (form→options switch)', () => {
    // 用户从 form 切到 options 后 formFields 未清空，replyMode 仍应判定为 options
    expect(
      getHitlReplyMode({
        replyMode: 'options',
        formFields: [{ label: 'x', type: 'input' }],
      }),
    ).toBe('options');
  });
});
