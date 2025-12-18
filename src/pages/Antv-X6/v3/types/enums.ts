/**
 * V3 工作流枚举定义
 * 优先使用全局枚举，减少专属类型设置
 */

export {
  AnswerTypeEnum,
  CompareTypeEnum,
  DataTypeEnum,
  ExceptionHandleTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
  RunResultStatusEnum,
} from '@/types/enums/common';
export {
  ConditionBranchTypeEnum,
  FoldFormIdEnum,
  NodeSizeGetTypeEnum,
  NodeUpdateEnum,
  PortGroupEnum,
  UpdateEdgeType,
} from '@/types/enums/node';

/**
 * 历史操作类型 (特定于 X6 撤销重做，保留专属定义)
 */
export enum HistoryActionTypeV3 {
  ADD_NODE = 'ADD_NODE',
  DELETE_NODE = 'DELETE_NODE',
  UPDATE_NODE = 'UPDATE_NODE',
  ADD_EDGE = 'ADD_EDGE',
  DELETE_EDGE = 'DELETE_EDGE',
  MOVE_NODE = 'MOVE_NODE',
  BATCH = 'BATCH',
}
