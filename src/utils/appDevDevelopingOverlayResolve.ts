import {
  APP_DEV_AGENT_PREVIEW_OVERLAY_QUERY_PARAM,
  LEGACY_APP_DEV_AGENT_PREVIEW_OVERLAY_QUERY_PARAM,
} from '@/constants/appDevConstants';

/**
 * 从 location.search 样式字符串解析遮罩参数。
 * 优先读取新参数 `developingOverlay`，同时兼容历史参数 `agentDevelopingOverlay`。
 * 未传或无法识别为布尔则返回 undefined。
 */
export function parseAgentDevelopingOverlayFromSearch(
  search: string,
): boolean | undefined {
  const q = search.startsWith('?') ? search.slice(1) : search;
  if (!q) {
    return undefined;
  }
  const params = new URLSearchParams(q);
  const raw =
    params.get(APP_DEV_AGENT_PREVIEW_OVERLAY_QUERY_PARAM) ??
    params.get(LEGACY_APP_DEV_AGENT_PREVIEW_OVERLAY_QUERY_PARAM);
  if (raw === null || raw.trim() === '') {
    return undefined;
  }
  const v = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(v)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(v)) {
    return false;
  }
  return undefined;
}

export interface ResolveDevelopingOverlayOptions {
  /** 通常为 `location.search` */
  search: string;
}

export interface ResolveDevelopingOverlayResult {
  /**
   * 传给 ContentViewer.showDevelopingOverlayDuringAgent；undefined 表示使用组件缺省 true。
   */
  valueForContentViewer: boolean | undefined;
  overriddenByUrl: boolean;
}

/**
 * 合并「URL 入参 > 不传（组件默认 true）」。
 * 仅做状态透传控制，不涉及页面 UI 开关偏好。
 */
export function resolveShowDevelopingOverlayDuringAgent(
  opts: ResolveDevelopingOverlayOptions,
): ResolveDevelopingOverlayResult {
  const fromUrl = parseAgentDevelopingOverlayFromSearch(opts.search);
  if (fromUrl !== undefined) {
    return {
      valueForContentViewer: fromUrl,
      overriddenByUrl: true,
    };
  }
  return {
    valueForContentViewer: undefined,
    overriddenByUrl: false,
  };
}
