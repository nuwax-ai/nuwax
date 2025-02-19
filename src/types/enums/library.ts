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

// 请求内容格式枚举
export enum RequestContentFormatEnum {
  No,
  Form_Data,
  X_Www_Form_Urlencoded,
  Json,
}

// 知识库资源文件格式枚举 数据类型,默认文本,1:文本;2:表格
export enum KnowledgeDataTypeEnum {
  // 文本格式
  Text = 1,
  // 表格格式
  Table = 2,
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

// 知识状态,可用值:Waiting,Published
export enum KnowledgePubStatusEnum {
  Waiting = 'Waiting',
  Published = 'Published',
}

// 分段类型，words: 按照词数分段, delimiter: 按照分隔符分段，field: 按照字段分段,可用值:WORDS,DELIMITER
export enum KnowledgeSegmentTypeEnum {
  WORDS = 'WORDS',
  DELIMITER = 'DELIMITER',
}
