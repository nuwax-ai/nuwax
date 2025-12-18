/**
 * V3 工作流枚举定义
 * 优先使用全局枚举，减少专属类型设置
 */

import {
  AnswerTypeEnum,
  CompareTypeEnum,
  DataTypeEnum,
  ExceptionHandleTypeEnum,
  NodeShapeEnum,
  NodeTypeEnum,
  RunResultStatusEnum,
} from '@/types/enums/common';
import {
  ConditionBranchTypeEnum,
  FoldFormIdEnum,
  NodeSizeGetTypeEnum,
  NodeUpdateEnum,
  PortGroupEnum,
  UpdateEdgeType,
} from '@/types/enums/node';

/**
 * 节点类型枚举
 */
export { NodeTypeEnum as NodeTypeEnumV3 };

/**
 * 节点形状枚举
 */
export { NodeShapeEnum as NodeShapeEnumV3 };

/**
 * 数据类型枚举
 */
export { DataTypeEnum as DataTypeEnumV3 };

/**
 * 端口组枚举
 */
export { PortGroupEnum as PortGroupEnumV3 };

/**
 * 条件分支类型枚举
 */
export { ConditionBranchTypeEnum as ConditionBranchTypeEnumV3 };

/**
 * 节点更新类型枚举
 */
export { NodeUpdateEnum as NodeUpdateEnumV3 };

/**
 * 边更新类型枚举
 */
export { UpdateEdgeType as UpdateEdgeTypeV3 };

/**
 * 节点尺寸获取类型枚举
 */
export { NodeSizeGetTypeEnum as NodeSizeGetTypeEnumV3 };

/**
 * 答案类型枚举
 */
export { AnswerTypeEnum as AnswerTypeEnumV3 };

/**
 * 异常处理类型枚举
 */
export { ExceptionHandleTypeEnum as ExceptionHandleTypeEnumV3 };

/**
 * 运行结果状态枚举
 */
export { RunResultStatusEnum as RunResultStatusEnumV3 };

/**
 * 表单ID枚举
 */
export { FoldFormIdEnum as FoldFormIdEnumV3 };

/**
 * 比较类型枚举
 */
export { CompareTypeEnum as CompareTypeEnumV3 };

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
