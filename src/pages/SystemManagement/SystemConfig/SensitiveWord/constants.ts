import { dict } from '@/services/i18nRuntime';
import {
  SensitiveWordActionEnum,
  SensitiveWordCategoryEnum,
  SensitiveWordMatchTypeEnum,
} from '@/types/interfaces/sensitiveWord';

/** 分类标签颜色（对齐原型：违法红、广告橙、隐私紫、竞品灰） */
export const CATEGORY_COLOR: Record<SensitiveWordCategoryEnum, string> = {
  [SensitiveWordCategoryEnum.Illegal]: 'red',
  [SensitiveWordCategoryEnum.Advertising]: 'orange',
  [SensitiveWordCategoryEnum.PrivacyLeak]: 'purple',
  [SensitiveWordCategoryEnum.Competitor]: 'default',
};

// 文案运行时读取，保证切换语言后生效
export const getCategoryOptions = () => [
  {
    label: dict('PC.Pages.SystemSensitiveWord.categoryIllegal'),
    value: SensitiveWordCategoryEnum.Illegal,
  },
  {
    label: dict('PC.Pages.SystemSensitiveWord.categoryAdvertising'),
    value: SensitiveWordCategoryEnum.Advertising,
  },
  {
    label: dict('PC.Pages.SystemSensitiveWord.categoryPrivacyLeak'),
    value: SensitiveWordCategoryEnum.PrivacyLeak,
  },
  {
    label: dict('PC.Pages.SystemSensitiveWord.categoryCompetitor'),
    value: SensitiveWordCategoryEnum.Competitor,
  },
];

export const getMatchTypeOptions = () => [
  {
    label: dict('PC.Pages.SystemSensitiveWord.matchContain'),
    value: SensitiveWordMatchTypeEnum.Contain,
  },
  {
    label: dict('PC.Pages.SystemSensitiveWord.matchRegex'),
    value: SensitiveWordMatchTypeEnum.Regex,
  },
];

export const getActionOptions = () => [
  {
    label: dict('PC.Pages.SystemSensitiveWord.actionDisconnect'),
    value: SensitiveWordActionEnum.Disconnect,
  },
  {
    label: dict('PC.Pages.SystemSensitiveWord.actionReplace'),
    value: SensitiveWordActionEnum.Replace,
  },
];

/** options → ProTable valueEnum（筛选下拉用） */
export const toValueEnum = (options: { label: string; value: string }[]) =>
  Object.fromEntries(options.map((o) => [o.value, { text: o.label }]));
