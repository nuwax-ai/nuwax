import type { UserAppLogSourceItem } from '@/types/interfaces/userProject';

const isLogSourceItem = (value: unknown): value is UserAppLogSourceItem => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Partial<UserAppLogSourceItem>;
  return (
    typeof item.service_id === 'string' && typeof item.source_id === 'string'
  );
};

/**
 * 把 /api/userapp/logs/sources/query 的返回收成来源列表。
 * useRequest 可能直接给出 data 数组，也可能仍包着 { data }。
 *
 * @param result 接口回调或响应体
 * @returns 可渲染的日志来源；无法识别时为空列表
 */
export function normalizeUserAppLogSources(
  result: unknown,
): UserAppLogSourceItem[] {
  const list = Array.isArray(result)
    ? result
    : result &&
      typeof result === 'object' &&
      Array.isArray((result as { data?: unknown }).data)
    ? (result as { data: unknown[] }).data
    : [];

  return list.filter(isLogSourceItem).map((item) => ({
    service_id: item.service_id,
    source_id: item.source_id,
    format: typeof item.format === 'string' ? item.format : '',
    matched_files: Array.isArray(item.matched_files)
      ? item.matched_files.filter((file) => typeof file === 'string')
      : [],
  }));
}
