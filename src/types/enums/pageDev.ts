// 封面图片来源,可用值:SYSTEM,USER
export enum CoverImgSourceTypeEnum {
  // 系统
  SYSTEM = 'SYSTEM',
  // 用户
  USER = 'USER',
}

// 页面开发创建类型枚举(自定义)
export enum PageDevelopCreateTypeEnum {
  // 导入项目
  Import_Project = 'Import_Project',
  // 在线开发
  Online_Develop = 'Online_Develop',
  // 反向代理
  Reverse_Proxy = 'Reverse_Proxy',
}

// 页面项目类型,可用值:Agent,Page (自定义)
export enum PageDevelopSelectTypeEnum {
  // 全部
  All_Type = 'All_Type',
  // 智能应用
  AGENT = 'AGENT',
  // 页面组件
  PAGE = 'PAGE',
}

// 项目类型,可用值:REVERSE_PROXY,ONLINE_DEPLOY
export enum PageProjectTypeEnum {
  // 在线开发
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
  // 认证配置
  Auth_Config = 'Auth_Config',
  // 页面预览
  Page_Preview = 'Page_Preview',
  // 复制到空间
  Copy_To_Space = 'Copy_To_Space',
  // 删除
  Delete = 'Delete',
}

// 发布状态,true:已发布;false:未发布
export enum BuildRunningEnum {
  // 已发布
  Published = 1,
  // 未发布
  Unpublished = 0,
}

// 页面开发发布类型枚举(发布类型,可用值:AGENT,PAGE)
export enum PageDevelopPublishTypeEnum {
  // 发布成组件
  PAGE = 'PAGE',
  // 发布成应用
  AGENT = 'AGENT',
}

// 复制类型枚举(可用值:DEVELOP,SQUARE)
export enum PageCopyTypeEnum {
  // 开发
  DEVELOP = 'DEVELOP',
  // 广场
  SQUARE = 'SQUARE',
}
