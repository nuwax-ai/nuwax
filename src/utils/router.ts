import { history } from 'umi';
export const jumpToPlugin = (targetSpaceId: number, pluginId: number) => {
  history.push(`/space/${targetSpaceId}/plugin/${pluginId}`);
};

export const jumpToWorkflow = (targetSpaceId: number, workflowId: number) => {
  history.push(`/space/${targetSpaceId}/workflow/${workflowId}`);
};

export const jumpToAgent = (targetSpaceId: number, agentId: number) => {
  history.push(`/space/${targetSpaceId}/agent/${agentId}`);
};

// 返回上一页，如果没有referrer，则跳转到工作空间（智能体开发）页面
export const jumpBack = (url?: string) => {
  // document.referrer 属性返回一个字符串，该字符串包含了当前文档的来源文档的 URL。可能为空
  const referrer = document.referrer;
  const historyLength = window.history.length;
  // 检查是否是新标签页打开（没有 referrer 且 history 长度为 2）
  const isNewTab = !referrer && historyLength <= 2;

  if (isNewTab && url) {
    // 新标签页打开，跳转到指定页面
    history.push(url);
  } else if (historyLength > 1) {
    // 有正常的浏览历史，执行返回
    history.back();
  } else if (url) {
    // 兜底方案，跳转到指定页面
    history.push(url);
  } else {
    // 没有指定页面，跳转到首页
    history.push('/');
  }
};

export const jumpToMcpCreate = (spaceId: number) => {
  history.push(`/space/${spaceId}/mcp/create`);
};

export const redirectToLogin = (pathname: string = '/') => {
  //TODO 注意 redirect 的用法 还未实现
  history.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
};

export const redirectTo = (url: string) => {
  window.location.replace(url);
};
