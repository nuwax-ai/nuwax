import { isWeakNumber } from '@/utils/common';
import { history } from 'umi';

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
    history.push(params);
    return;
  }
  if (typeof params === 'object' && 'url' in params) {
    const { url, method = 'push', state } = params;
    if (state) return history[method](url, state);
    return history[method](url);
  }
  throw new Error('Invalid jumpTo params');
};

export const jumpToPlugin = (targetSpaceId: number, pluginId: number) => {
  jumpTo(`/space/${targetSpaceId}/plugin/${pluginId}`);
};

export const jumpToWorkflow = (targetSpaceId: number, workflowId: number) => {
  jumpTo(`/space/${targetSpaceId}/workflow/${workflowId}`);
};

export const jumpToAgent = (targetSpaceId: number, agentId: number) => {
  jumpTo(`/space/${targetSpaceId}/agent/${agentId}`);
};

// 返回上一页，如果没有referrer，则跳转到工作空间（智能体开发）页面
export const jumpBack = (url?: string) => {
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

  console.info('[router] jumpBack', history, location, result);
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
