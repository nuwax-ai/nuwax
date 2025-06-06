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
