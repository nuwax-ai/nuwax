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

// 更新模型组件配置 - 模式
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

// 知识库分段标识符枚举
export enum KnowledgeSegmentIdentifierEnum {
  // 换行
  Line_Feed = '\n',
  // 2个换行
  Two_Line_Feed = '\n\n',
  // 中文句号
  Chinese_Sentence = '。',
  // 中文叹号
  Chinese_Exclamation = '！',
  // 英文句号
  English_Sentence = '.',
  // 英文叹号
  English_Exclamation = '!',
  // 中文问号
  Chinese_Question_Mark = '？',
  // 英文问号
  English_Question_Mark = '?',
  // 自定义
  Custom = 'Custom',
}

// 知识库文档状态
export enum DocStatusEnum {
  // 分析中
  ANALYZING = 'ANALYZING',
  // 分析成功
  ANALYZED = 'ANALYZED',
  // 分析中 - 分段生成中
  ANALYZING_RAW = 'ANALYZING_RAW',
  // 分析中 - 问答生成中
  ANALYZED_QA = 'ANALYZED_QA',
  // 分析中 - 向量化中
  ANALYZED_EMBEDDING = 'ANALYZED_QA',
  // 分析失败
  ANALYZE_FAILED = 'ANALYZE_FAILED',
}

/*
  知识库文档状态 ANALYZING(1, "分析中", "分析中"), ANALYZED(2, "分析成功", "分析成功"), ANALYZING_RAW(3, "分析中", "分段生成中"),ANALYZED_QA(4, "分析中", "问答生成中"),ANALYZED_EMBEDDING(5, "分析中", "向量化中"),ANALYZE_FAILED(10, "分析失败", "分析失败");
  细化了下文档状态, 是:2,4,5 状态的任意一个状态,就是分段工作完成的
 */
export enum DocStatusCodeEnum {
  // 分析中
  ANALYZING = 1,
  // 分析成功
  ANALYZED = 2,
  // 分析中 - 分段生成中
  ANALYZING_RAW = 3,
  // 分析中 - 问答生成中
  ANALYZED_QA = 4,
  // 分析中 - 向量化中
  ANALYZED_EMBEDDING = 5,
  // 分析失败
  ANALYZE_FAILED = 10,
}

export enum KnowledgeDocTypeEnum {
  // 文档
  DOC = 1,
  // QA问答
  QA = 2,
}
