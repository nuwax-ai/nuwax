// 组件库更多操作枚举
export enum ComponentMoreActionEnum {
  Copy,
  Statistics,
  Del,
}

// 工作流操作枚举
export enum WorkflowModeEnum {
  // 新建
  Create,
  // 更新
  Update,
}

// 插件操作枚举
export enum PluginModeEnum {
  // 新建
  Create,
  // 更新
  Update,
}

// 创建、编辑知识库枚举
export enum KnowledgeModeEnum {
  // 创建
  Create,
  // 编辑
  Edit,
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

// 知识库资源文件格式枚举
export enum KnowledgeResourceEnum {
  // 文本格式
  Text,
  // 表格格式
  Table,
}

// 知识库资源-文本格式导入类型枚举
export enum KnowledgeTextImportEnum {
  // 本地文档
  Local_Doc,
  // 在线文档
  Online_Doc,
  // 自定义
  Custom,
}

// 知识库资源-文本格式-添加内容-本地文档或自定义步骤枚举
export enum KnowledgeTextStepEnum {
  // 上传或者文本填写
  Upload_Or_Text_Fill,
  // 创建设置或分段设置
  Create_Segmented_Set,
  // 数据处理
  Data_Processing,
}

// 知识库资源-文本格式添加内容-创建设置步骤枚举
export enum KnowledgeTextCreateSetEnum {
  // 自动分段与预处理规则
  Auto_Segmentation_Cleaning,
  Custom,
}

// 更新模型组件配置
export enum UpdateModeComponentEnum {
  // 精确模式
  Precision = 'Precision',
  // 平衡模式
  Balanced = 'Balanced',
  // 创意模式
  Creative = 'Creative',
  // 自定义
  Customization = 'Customization',
}
