// 引入的数据的名称
export enum InputItemNameEnum {
  inputArgs = 'inputArgs',
  outputArgs = 'outputArgs',
  variableArgs = 'variableArgs',
  conditionBranchConfigs = 'conditionBranchConfigs',
  body = 'body',
  queries = 'queries',
  options = 'options',
  intentConfigs = 'intentConfigs',
  headers = 'headers',
  tableFields = 'tableFields',
}

export enum PortGroupEnum {
  in = 'in',
  out = 'out',
  special = 'special',
  exception = 'exception',
}

export enum ConditionBranchTypeEnum {
  IF = 'IF',
  ELSE_IF = 'ELSE_IF',
  ELSE = 'ELSE',
}

export enum NodeUpdateEnum {
  moved = 'moved',
}

export enum FoldFormIdEnum {
  empty = 0,
}

export enum VariableConfigTypeEnum {
  SET_VARIABLE = 'SET_VARIABLE',
  GET_VARIABLE = 'GET_VARIABLE',
}

export enum UpdateEdgeType {
  created = 'created',
  deleted = 'deleted',
}

export enum NodeSizeGetTypeEnum {
  create = 'create',
  update = 'update',
}
