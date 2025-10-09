// 页面开发创建类型枚举(项目类型,可用值:REVERSE_PROXY,ONLINE_DEPLOY)
export enum PageDevelopCreateTypeEnum {
  // 全部
  All_Type = 'All_Type',
  // 导入项目
  Import_Project = 'Import_Project',
  // 在线创建
  ONLINE_DEPLOY = 'ONLINE_DEPLOY',
  // 反向代理
  REVERSE_PROXY = 'REVERSE_PROXY',
}

// 反向代理类型（可用值:dev,prod）
export enum ReverseProxyEnum {
  // 开发调试
  Dev = 'dev',
  // 正式环境
  Production = 'prod',
}

// 页面开发更多操作枚举
export enum PageDevelopMoreActionEnum {
  // 反向代理配置
  Reverse_Proxy_Config = 'Reverse_Proxy_Config',
  // 路径参数配置
  Path_Params_Config = 'Path_Params_Config',
  // 页面预览
  Page_Preview = 'Page_Preview',
}
