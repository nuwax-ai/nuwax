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
  // AgentFlow v1 (保留用于向后兼容)
  EvalGatePass = 'eval_gate_pass', // 评估通过端口
  /** @deprecated v2 使用 EvalGateBranch 替代 */
  EvalGateFail = 'eval_gate_fail', // 评估验证失败端口
  /** @deprecated v2 使用 HitlBranch 替代 */
  HitlApprove = 'hitl_approve', // 人类介入审批通过端口
  /** @deprecated v2 使用 HitlBranch 替代 */
  HitlReject = 'hitl_reject', // 人类介入审批拒绝端口
  RouteDecisionDefault = 'route_decision_default', // 路由决策默认端口
  RouteDecisionRoute = 'route_decision_route', // 路由决策路由端口
  // AgentFlow v2 动态分支端口
  HitlBranch = 'hitl_branch', // HITL approve 动态分支端口
  HitlOption = 'hitl_option', // HITL ask 选项端口
  EvalGateBranch = 'eval_gate_branch', // EvalGate 动态分支端口
}
