import { EN_US } from '@/locales/i18n/en-US';
import { JA_JP } from '@/locales/i18n/ja-JP';
import { ZH_CN } from '@/locales/i18n/zh-CN';
import { ZH_HK } from '@/locales/i18n/zh-HK';
import { ZH_TW } from '@/locales/i18n/zh-TW';
import { expect, it } from 'vitest';

const prefix = 'PC.Pages.SystemRecommendManage.';
const traditionalCopy = {
  promptsLabel: '預設提示詞',
  addPrompt: '新增預設提示詞',
  promptNumber: '預設提示詞 {0}',
  removePrompt: '刪除預設提示詞',
  editPrompt: '設定預設提示詞',
  promptSettingsTitle: '預設提示詞設定',
  promptContentPlaceholder: '請輸入預設提示詞內容',
  promptContentRequired: '請輸入預設提示詞內容，不能只輸入空格',
};
const cases = [
  {
    locale: 'zh-CN',
    messages: ZH_CN,
    expected: {
      promptsLabel: '预置提示词',
      addPrompt: '添加预置提示词',
      promptNumber: '预置提示词 {0}',
      removePrompt: '删除预置提示词',
      editPrompt: '设置预置提示词',
      promptSettingsTitle: '预置提示词设置',
      promptContentPlaceholder: '请输入预置提示词内容',
      promptContentRequired: '请输入预置提示词内容，不能只输入空格',
    },
  },
  {
    locale: 'en-US',
    messages: EN_US,
    expected: {
      promptsLabel: 'Preset Prompts',
      addPrompt: 'Add Preset Prompt',
      promptNumber: 'Preset Prompt {0}',
      removePrompt: 'Remove Preset Prompt',
      editPrompt: 'Edit Preset Prompt',
      promptSettingsTitle: 'Preset Prompt Settings',
      promptContentPlaceholder: 'Enter preset prompt content',
      promptContentRequired:
        'Enter preset prompt content; whitespace alone is not allowed',
    },
  },
  { locale: 'zh-HK', messages: ZH_HK, expected: traditionalCopy },
  { locale: 'zh-TW', messages: ZH_TW, expected: traditionalCopy },
  {
    locale: 'ja-JP',
    messages: JA_JP,
    expected: {
      promptsLabel: 'プリセットプロンプト',
      addPrompt: 'プリセットプロンプトを追加',
      promptNumber: 'プリセットプロンプト {0}',
      removePrompt: 'プリセットプロンプトを削除',
      editPrompt: 'プリセットプロンプトを編集',
      promptSettingsTitle: 'プリセットプロンプト設定',
      promptContentPlaceholder: 'プリセットプロンプトの内容を入力',
      promptContentRequired:
        'プリセットプロンプトの内容を入力してください。空白のみは使用できません',
    },
  },
];

it.each(cases)(
  '$locale 标题、占位、tooltip、校验及辅助标签统一使用预置提示词',
  ({ messages, expected }) => {
    for (const [key, value] of Object.entries(expected)) {
      expect(messages[`${prefix}${key}`]).toBe(value);
    }
    for (const [key, value] of Object.entries(messages)) {
      if (key.startsWith(prefix) && /prompt/i.test(key.slice(prefix.length))) {
        expect(value).not.toMatch(/问题|問題|question|質問|开场白|開場白/i);
      }
    }
  },
);
