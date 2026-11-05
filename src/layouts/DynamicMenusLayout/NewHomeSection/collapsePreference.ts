/**
 * 首页会话域的分组收起偏好（NW-149）。
 *
 * <p>项目分组头、任务分组头以及项目行内的展开状态都记在 localStorage：
 * 用户收起后刷新页面或重开客户端仍保持收起。分组权重是「最后一次操作」，
 * 不做过期；读取失败（无痕模式、配额满、历史脏值）一律回退默认展开，
 * 不能因为读偏好把列表渲染打断。
 */

import { COLLAPSED_PROJECT_KEYS_KEY } from '@/constants/homeLayout.constants';

export {
  COLLAPSED_PROJECT_KEYS_KEY,
  PROJECT_SECTION_COLLAPSED_KEY,
  TASK_SECTION_COLLAPSED_KEY,
} from '@/constants/homeLayout.constants';

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 读取分组头收起态；没有记录或读取失败按展开处理 */
export function readCollapsedFlag(key: string): boolean {
  try {
    return storage()?.getItem(key) === '1';
  } catch {
    return false;
  }
}

/** 写入分组头收起态；展开时删除记录，避免无意义残留 */
export function writeCollapsedFlag(key: string, collapsed: boolean): void {
  try {
    const store = storage();
    if (!store) return;
    if (collapsed) store.setItem(key, '1');
    else store.removeItem(key);
  } catch {
    // 持久化失败不影响当前交互，下次进入退化为默认展开
  }
}

/** 读取项目行收起集合；非字符串项与坏 JSON 一律丢弃 */
export function readCollapsedProjectKeys(): Set<string> {
  try {
    const raw = storage()?.getItem(COLLAPSED_PROJECT_KEYS_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((item): item is string => typeof item === 'string'),
    );
  } catch {
    return new Set();
  }
}

/** 保存项目行收起集合；空集合直接删除记录 */
export function writeCollapsedProjectKeys(keys: Iterable<string>): void {
  try {
    const store = storage();
    if (!store) return;
    const list = Array.from(keys);
    if (list.length === 0) store.removeItem(COLLAPSED_PROJECT_KEYS_KEY);
    else store.setItem(COLLAPSED_PROJECT_KEYS_KEY, JSON.stringify(list));
  } catch {
    // 同上：写失败只丢偏好，不影响折叠本身
  }
}
