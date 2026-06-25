import { dict, getCurrentLang } from '@/services/i18nRuntime';
import dayjs from 'dayjs';

/**
 * 格式化会话更新时间，符合设计图逻辑
 * @param timeStr ISO格式时间字符串
 */
export const formatModifiedTime = (timeStr?: string) => {
  if (!timeStr) return '';
  const d = dayjs(timeStr);
  if (!d.isValid()) return '';

  const now = dayjs();
  if (d.isSame(now, 'day')) {
    return d.format('HH:mm');
  }
  if (d.isSame(now.subtract(1, 'day'), 'day')) {
    return dict('PC.Utils.Common.yesterday');
  }

  const lang = getCurrentLang();
  if (lang.startsWith('zh')) {
    return d.format('M月D日');
  }
  return d.format('MMM D');
};
