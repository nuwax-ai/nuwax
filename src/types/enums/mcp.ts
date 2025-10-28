// MCP安装方式,可用值:NPX,UVX,SSE,COMPONENT
export enum McpInstallTypeEnum {
  NPX = 'NPX',
  UVX = 'UVX',
  SSE = 'SSE',
  COMPONENT = 'COMPONENT',
}

// MCP部署状态,可用值:Initialization,Deploying,Deployed,DeployFailed,Stopped
export enum DeployStatusEnum {
  // 待部署
  Initialization = 'Initialization',
  // 部署中
  Deploying = 'Deploying',
  // 已部署
  Deployed = 'Deployed',
  // 部署失败
  DeployFailed = 'DeployFailed',
  // 已停止
  Stopped = 'Stopped',
}

// mcp权限列表枚举
export enum McpPermissionsEnum {
  EditOrDeploy = 'EditOrDeploy',
  // 删除
  Delete = 'Delete',
  // 停止服务
  Stop = 'Stop',
  // 导出
  Export = 'Export',
}

// 过滤部署状态
export enum FilterDeployEnum {
  // 全部
  All = 'All',
  // 已部署
  Deployed = 'Deployed',
}

// Mcp更多操作枚举(自定义)
export enum McpMoreActionEnum {
  // 停止服务
  Stop_Service = 'Stop_Service',
  // 服务导出
  Service_Export = 'Service_Export',
  // 删除
  Del = 'Del',
}

// Mcp编辑head菜单枚举(自定义)
export enum McpEditHeadMenusEnum {
  Overview, // 概览
  Tool, // 工具
  Resource, // 资源
  Prompt, // 提示词
}

// 执行类型,可用值:TOOL,RESOURCE,PROMPT
export enum McpExecuteTypeEnum {
  // 工具
  TOOL = 'TOOL',
  // 资源
  RESOURCE = 'RESOURCE',
  // 提示词
  PROMPT = 'PROMPT',
}

// MCP管理分段器枚举(自定义)
export enum McpManageSegmentedEnum {
  // 自定义服务
  Custom = 'Custom',
  // 官方服务
  Official = 'Official',
}
