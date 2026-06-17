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

/**
 * 特殊端口类型枚举
 */
export enum SpecialPortType {
  Normal = 'normal', // 普通节点的 out 端口
  Condition = 'condition', // 条件分支端口
  Intent = 'intent', // 意图识别端口
  QAOption = 'qa_option', // 问答选项端口
  Exception = 'exception', // 异常处理端口
  Loop = 'loop', // 循环节点特殊端口
}
