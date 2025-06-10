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
  if (window.history.length > 1 || referrer || !url) {
    history.back();
  } else {
    history.push(url);
  }
};
