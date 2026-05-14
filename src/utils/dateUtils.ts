/**
 * Locale-aware date formatting utilities.
 *
 * dayjs locale is already set by syncAllLocaleSystems() / applyDayjsLocale()
 * when the application language changes.  This module provides thin wrappers
 * that delegate to dayjs with localized format tokens, so that date strings
 * automatically follow the current locale.
 *
 * Empty / falsy values fall back to dict('PC.Common.Global.emptyPlaceholder').
 */

import { dict } from '@/services/i18nRuntime';
import dayjs from 'dayjs';

/**
 * Locale-aware date formatting (e.g. "2025/03/15" in zh-CN, "03/15/2025" in en-US).
 * Returns the empty placeholder string when `date` is falsy.
 */
export function formatDate(date?: string | number | Date | null): string {
  if (!date) return dict('PC.Common.Global.emptyPlaceholder');
  return dayjs(date).format('L');
}

/**
 * Locale-aware date-time formatting (e.g. "2025/03/15 14:30" in zh-CN,
 * "03/15/2025 2:30 PM" in en-US).
 * Returns the empty placeholder string when `date` is falsy.
 */
export function formatDateTime(date?: string | number | Date | null): string {
  if (!date) return dict('PC.Common.Global.emptyPlaceholder');
  return dayjs(date).format('L LT');
}
