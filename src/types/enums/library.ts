// 组件库更多操作枚举
export enum ComponentMoreActionEnum {
  Copy,
  Statistics,
  Del,
}

// 插件操作枚举
export enum PluginModeEnum {
  // 新建
  Create,
  // 更新
  Update,
}

// 插件操作枚举
export enum PluginCreateToolEnum {
  // 基于已有服务（http接口）创建
  Existing_Service_Based,
  // 基于云端代码（nodejs、python）创建
  Cloud_Based_Code_Creation,
}

// 请求方法枚举
export enum RequestMethodEnum {
  Post,
  Get,
  Put,
  Delete,
}

// 请求内容格式枚举
export enum RequestContentFormatEnum {
  No,
  Form_Data,
  X_Www_Form_Urlencoded,
  Json,
}

// 传入方法枚举
export enum AfferentModeEnum {
  Body,
  Path,
  Query,
  Header,
}
