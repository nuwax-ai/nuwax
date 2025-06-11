// MCP安装方式,可用值:NPX,uvx,SSE,COMPONENT
export enum McpInstallTypeEnum {
  NPX = 'NPX',
  UVX = 'uvx',
  SSE = 'SSE',
  COMPONENT = 'COMPONENT',
}

// MCP部署状态,可用值:Initialization,Deploying,Deployed,DeployFailed,Stopped
export enum DeployStatusEnum {
  Initialization = 'Initialization',
  Deploying = 'Deploying',
  Deployed = 'Deployed',
  DeployFailed = 'DeployFailed',
  Stopped = 'Stopped',
}

// 过滤部署状态
export enum FilterDeployEnum {
  // 全部
  All = 'All',
  // 已部署
  Deployed = 'Deployed',
}

// Mcp更多操作枚举
export enum McpMoreActionEnum {
  // 停止服务
  Stop_Service = 'Stop_Service',
  // 服务导出
  Service_Export = 'Service_Export',
  // 删除
  Del = 'Del',
}
