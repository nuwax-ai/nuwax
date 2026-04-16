import { dict } from '@/services/i18nRuntime';

/**
 * ProComponents 国际化 ID 到项目多语言字典的映射表
 */
const I18N_MAP: Record<string, string> = {
  'form.lightFilter.clear': 'PC.Pages.AppDevIndex.clear',
  'form.lightFilter.confirm': 'PC.Common.Global.confirm',
  'tableForm.submit': 'PC.Common.Global.submit',
  'tableForm.reset': 'PC.Constants.DataTable.reset',
  'tableForm.search': 'PC.Constants.DataTable.search',
  'tableForm.inputPlaceholder': 'PC.Common.Global.pleaseInput',
  'tableForm.selectPlaceholder': 'PC.Common.Global.pleaseSelect',
  'editableTable.action.save': 'PC.Common.Global.save',
  'editableTable.action.delete': 'PC.Common.Global.delete',
  'editableTable.action.cancel': 'PC.Common.Global.cancel',
};

/**
 * XProTable 专用的国际化适配函数
 *
 * 用于 ProConfigProvider 的 getMessage 钩子。
 * 优先从项目本地字典读取翻译，若无对应映射则回退到 ProComponents 默认文案。
 *
 * @param id ProComponents 内部使用的国际化 ID
 * @param defaultMessage ProComponents 提供的默认文案
 * @returns 最终显示的文本
 */
export const getProIntlMessage = (
  id: string,
  defaultMessage: string,
): string => {
  const dictKey = I18N_MAP[id];
  if (dictKey) {
    return dict(dictKey);
  }
  return defaultMessage || id;
};
