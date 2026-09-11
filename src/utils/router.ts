import { isWeakNumber } from '@/utils/common';
import { isImmersiveShell, nuwaClawHost } from '@/utils/nuwaClawBridge';
import { history } from 'umi';

/**
 * 桌面端（nuwaclaw 主窗口）走独立新窗口打开的路由清单。
 *
 * 2026-09-11 清空：工作台页（工作流/网页应用/设计器/智能体编排/智能体详情/
 * 我的电脑）已全部改为**主窗口内页内承载**（fullscreenWorkbenchPaths：侧栏
 * 常驻 + immersiveShellAvoid 顶部避让）。此前经 jumpTo 的入口会走
 * openWindow 的 same-window 整页导航（webview 级跳转），侧栏随之整页重载
 * ——即「进入/退出详情整体重新渲染」问题的根因。清空后 jumpTo 一律回落
 * history.push（SPA 页内导航，侧栏实例跨跳转存活）。
 * 若后续有页面确需独立窗口，在此追加正则并确认其布局兼容独立窗口形态。
 */
const SHELL_NEW_WINDOW_ROUTES: RegExp[] = [];

/** 桌面主窗口下该路由是否应新开独立窗口（独立窗口内自身不再分流）。 */
function shouldOpenInShellWindow(url: string): boolean {
  if (!isImmersiveShell()) return false;
  return SHELL_NEW_WINDOW_ROUTES.some((re) => re.test(url.split('?')[0]));
}

/**
 * 请求宿主新开独立窗口；失败（旧壳无 handler / 被安全校验拒绝 / 桥异常）
 * 时回落页内导航，保证点击永远有响应。
 */
function openShellWindowOrNavigate(url: string): void {
  void nuwaClawHost.native.openWindow(url).then((res) => {
    if (!res.success) history.push(url);
  });
}

type JumpToProps =
  | {
      url: string | number;
      method?: 'push' | 'replace' | 'go' | 'back';
      state?: Record<string, any>;
    }
  | string
  | number;
/**
 * 跳转页面
 * @param params 跳转参数
 * @returns 无返回值
 */
export const jumpTo = (params: JumpToProps) => {
  if (isWeakNumber(params)) {
    history.go(Number(params));
    return;
  } else if (typeof params === 'string') {
    if (shouldOpenInShellWindow(params)) {
      openShellWindowOrNavigate(params);
      return;
    }
    history.push(params);
    return;
  }
  if (typeof params === 'object' && 'url' in params) {
    const { url, method = 'push', state } = params;
    if (typeof url === 'string' && shouldOpenInShellWindow(url)) {
      // 独立窗口是全新页面加载，SPA 路由 state 无法携带（各目标页均不依赖 state）；
      // 开窗失败回落页内导航（不带 state，目标页均不依赖）
      openShellWindowOrNavigate(url);
      return;
    }
    if (state) return history[method](url, state);
    return history[method](url);
  }
  throw new Error('Invalid jumpTo params');
};

// 跳转到普通插件工具页面
export const jumpToPlugin = (targetSpaceId: number, pluginId: number) => {
  jumpTo(`/space/${targetSpaceId}/plugin/${pluginId}`);
};

// 跳转到代码插件云端工具页面
export const jumpToPluginCloudTool = (
  targetSpaceId: number,
  pluginId: number,
) => {
  jumpTo(`/space/${targetSpaceId}/plugin/${pluginId}/cloud-tool`);
};

type WorkflowRouteQuery = Record<
  string,
  string | number | boolean | null | undefined
>;

export const buildWorkflowRoute = (
  targetSpaceId: number | string,
  workflowId: number | string,
  workflowType?: string,
  query?: WorkflowRouteQuery,
) => {
  const route = `/space/${targetSpaceId}/workflow/${workflowId}`;
  const searchParams = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  });

  const search = searchParams.toString();
  return search ? `${route}?${search}` : route;
};

export const jumpToWorkflow = (
  targetSpaceId: number,
  workflowId: number,
  workflowType?: string,
  query?: WorkflowRouteQuery,
) => {
  jumpTo(buildWorkflowRoute(targetSpaceId, workflowId, workflowType, query));
};

export const jumpToSkill = (targetSpaceId: number, skillId: number) => {
  jumpTo(`/space/${targetSpaceId}/skill-details/${skillId}`);
};

export const jumpToAgent = (targetSpaceId: number, agentId: number) => {
  jumpTo(`/space/${targetSpaceId}/agent/${agentId}`);
};

// 返回上一页，如果没有referrer，则跳转到工作空间（智能体开发）页面
export const jumpBack = (url?: string, payload?: Record<string, any>) => {
  // document.referrer 属性返回一个字符串，该字符串包含了当前文档的来源文档的 URL。可能为空
  const referrer = document.referrer;
  const historyLength = window.history.length;
  // 检查是否是新标签页打开（没有 referrer 且 history 长度为 2）
  const isNewTab = !referrer && historyLength <= 2;
  const location = history.location;

  if (location.key === 'default' && location.state === null) {
    //说明直接进入的是二级页面
    if (url) {
      jumpTo({ url, method: 'replace' }); // 直接跳转到指定页面
    } else {
      jumpTo({ url: '/', method: 'replace' }); // 兜底方案，跳转到首页
    }
    return;
  }

  // 如果从appdev跳转过来，则直接跳转到指定页面
  if (payload?.from === 'appdev' && url) {
    jumpTo({ url, method: 'replace' });
    return;
  }

  let result: string | number;
  if (isNewTab && url) {
    // 新标签页打开，跳转到指定页面
    result = url;
  } else if (historyLength > 1) {
    // 有正常的浏览历史，执行返回
    result = -1;
  } else if (url) {
    // 兜底方案，跳转到指定页面
    result = url;
  } else {
    // 没有指定页面，跳转到首页
    result = '/';
  }

  // console.info('[router] jumpBack', history, location, result);
  jumpTo(result);
};

// 跳转到mcp创建
export const jumpToMcpCreate = (spaceId: number) => {
  jumpTo(`/space/${spaceId}/mcp/create`);
};

// 跳转到页面开发
export const jumpToPageDevelop = (spaceId: number) => {
  jumpTo(`/space/${spaceId}/page-develop`);
};

export const redirectToLogin = (redirect: string | number = '/') => {
  jumpTo(`/login?redirect=${encodeURIComponent(redirect)}`);
};

export const redirectTo = (url: string) => {
  window.location.replace(url);
};

export const isChatTemp = () => {
  return location.pathname.includes('/chat-temp/');
};
