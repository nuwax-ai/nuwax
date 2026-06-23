/** 拖入节点时暂存待创建类型的 sessionStorage key（与 tableType 模式一致） */
export const PENDING_TABLE_NODE_TYPE_KEY = 'tableType';
export const PENDING_KNOWLEDGE_NODE_TYPE_KEY = 'knowledgeNodeType';

/**
 * 清理拖入节点弹窗暂存的 sessionStorage。
 * 在取消选择弹窗或节点创建成功后调用，避免残留状态导致误建节点。
 */
export const clearPendingNodeCreateSession = (): void => {
  sessionStorage.removeItem(PENDING_TABLE_NODE_TYPE_KEY);
  sessionStorage.removeItem(PENDING_KNOWLEDGE_NODE_TYPE_KEY);
};
