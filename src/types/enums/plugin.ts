// 发布范围，Space 空间；Tenant 租户全局；Global 系统全局。目前UI上的"全局"指的是租户全局,可用值:Space,Tenant,Global
export enum PluginPublishScopeEnum {
  Space = 'Space',
  Tenant = 'Tenant',
  Global = 'Global',
}

// 插件类型,可用值:HTTP,CODE
export enum PluginTypeEnum {
  HTTP = 'HTTP',
  CODE = 'CODE',
}

// 插件代码语言,可用值:Python,JavaScript
export enum CodeLangEnum {
  Python = 'Python',
  JavaScript = 'JavaScript',
  JSON = 'JSON',
}

// 插件Code模式
export enum PluginCodeModeEnum {
  // 元数据
  Metadata = 'Metadata',
  // 代码
  Code = 'Code',
}

// 卡片绑定样式,可用值:SINGLE,LIST
export enum BindCardStyleEnum {
  // 单张卡片
  SINGLE = 'SINGLE',
  // 竖向列表
  LIST = 'LIST',
}
