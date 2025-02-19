import type { KnowledgeDataTypeEnum, KnowledgeSegmentTypeEnum, KnowledgePubStatusEnum } from '@/types/enums/library';
import type { Sort } from '@/types/interfaces/request';

// 数据新增输入参数
export interface KnowledgeConfigAddParams {
  spaceId: number;
  // 知识库名称
  name: string;
  // 知识库描述
  description: string;
  // 数据类型,默认文本,1:文本;2:表格
  dataType: KnowledgeDataTypeEnum;
}

// 数据更新输入参数
export interface KnowledgeConfigUpdateParams extends KnowledgeConfigAddParams {
  // 主键id
  id: number;
}

// Table Column
export interface SuperTableColumn {
  serialNumber: number;
  label: string;
  name: string;
  sortable: boolean;
  tips: string;
  ext: {
    fixed: string;
    visible: boolean;
    subLabel: string;
    width: string;
    minWidth: string;
    settable: boolean;
    align: string;
    formatter: string;
    tips: string;
    ellipsis: boolean;
  };
}

// 知识库数据列表请求基础信息
export interface KnowledgeListBaseInfo {
  // 当前页,示例值(1)
  current: number;
  // 分页pageSize,示例值(10)
  pageSize: number;
  // 排序字段信息,可空,一般没有默认为创建时间排序
  orders: Sort[];
  // 列的筛选条件,可空
  filters: {
    column: string;
    operator: string;
    value: object;
  }[];
  // 表格的列信息,可空
  columns: {
    serialNumber: number;
    label: string;
    name: string;
    sortable: boolean;
    tips: string;
    ext: {
      fixed: string;
      visible: boolean;
      subLabel: string;
      width: string;
      minWidth: string;
      settable: boolean;
      align: string;
      formatter: string;
      tips: string;
      ellipsis: boolean;
    };
    children: SuperTableColumn[];
  }[];
}

// 知识库数据列表查询
export interface KnowledgeConfigListParams extends KnowledgeListBaseInfo {
  // 知识库基础配置-列表查询
  queryFilter: {
    spaceId: number;
    // 知识库名称
    name: string;
    // 数据类型,默认文本,1:文本;2:表格
    dataType: KnowledgeDataTypeEnum;
  };
}

// 知识库信息
export interface KnowledgeInfo extends KnowledgeConfigAddParams {
  // 主键id
  id: number;
  // 知识状态,可用值:Waiting,Published
  pubStatus: KnowledgePubStatusEnum;
  // 知识库的嵌入模型ID
  embeddingModelId: number;
  // 知识库的生成Q&A模型ID
  chatModelId: number;
  // 创建时间
  created: string;
  // 创建人id
  creatorId: number;
  // 创建人
  creatorName: string;
  // 更新时间
  modified: string;
  // 最后修改人id
  modifiedId: number;
  // 最后修改人
  modifiedName: string;
}

// 分段配置
export interface SegmentConfigModel {
  // 分段类型，words: 按照词数分段, delimiter: 按照分隔符分段，field: 按照字段分段,可用值:WORDS,DELIMITER
  segment: KnowledgeSegmentTypeEnum;
  // 分段最大字符数，选择words或delimiter时有效
  words: number;
  // 分段重叠字符数，建议设置words的10%-25%
  overlaps: number;
  // 分隔符，仅在选择delimiter时有效
  delimiter: string;
  // 是否去除连续空白、制表符和空行等，默认为True
  isTrim: boolean;
}

// 知识库文档配置 - 数据更新接口
export interface KnowledgeDocumentUpdateParams {
  spaceId: number;
  // 文档ID
  docId: number;
  // 文档名称
  name: string;
  // 文档URL
  docUrl: string;
  // 快速自动分段与清洗,true:无需分段设置,自动使用默认值
  autoSegmentConfigFlag: boolean;
  // 分段配置
  segmentConfig: SegmentConfigModel;
}

// 知识库文档配置 - 数据列表查询
export interface KnowledgeDocumentListParams extends KnowledgeListBaseInfo {
  // 知识库基础配置-列表查询
  queryFilter: {
    spaceId: number;
    // 知识库名称
    name: string;
  };
}

// 知识库文档信息
export interface KnowledgeDocumentInfo {
  // 主键id
  id: number;
  // 文档所属知识库
  kbId: number;
  // 文档名称
  name: string;
  // 文件URL
  docUrl: string;
  // 知识状态,可用值:Waiting,Published
  pubStatus: KnowledgePubStatusEnum;
  // 是否已经生成Q&A
  hasQa: boolean;
  // 是否已经完成嵌入
  hasEmbedding: boolean;
  // 分段配置
  segment: SegmentConfigModel;
  spaceId: number;
  // 创建时间
  created: string;
  // 创建人id
  creatorId: number;
  // 创建人
  creatorName: string;
  // 更新时间
  modified: string;
  // 最后修改人id
  modifiedId: number;
  // 最后修改人
  modifiedName: string;
}

// 知识库文档 - 数据新增接口
export interface KnowledgeDocumentAddParams {
  // 知识库ID
  kbId: number;
  // 文档名称
  name: string;
  // 文档URL
  docUrl: string;
  // 快速自动分段与清洗,true:无需分段设置,自动使用默认值
  autoSegmentConfigFlag: boolean;
  // 分段配置
  segmentConfig: SegmentConfigModel;
}

// 知识库分段配置 - 数据更新接口
export interface KnowledgeRawSegmentUpdateParams {
  spaceId: number;
  // 主键id
  rawSegmentId: number;
  // 文档ID
  docId: number;
  // 原始文本
  rawTxt: string;
  // 排序索引,在归属同一个文档下，段的排序
  sortIndex: number;
}

// 知识库分段配置 - 数据列表查询
export interface KnowledgeRawSegmentListParams extends KnowledgeListBaseInfo {
  // 知识库分段-新增请求参数
  queryFilter: {
    spaceId: number;
  };
}

// 知识库分段配置 - 数据列表查询 分段信息
export interface KnowledgeRawSegmentInfo {
  id: number;
  // 分段所属文档
  docId: number;
  // 原始文本
  rawTxt: string;
  // 知识库ID
  kbId: number;
  // 排序索引,在归属同一个文档下，段的排序
  sortIndex: number;
  // 所属空间ID
  spaceId: number;
  // 创建时间
  created: string;
  // 创建人id
  creatorId: number;
  // 创建人
  creatorName: string;
  // 更新时间
  modified: string;
  // 最后修改人id
  modifiedId: number;
  // 最后修改人
  modifiedName: string;
}

// 知识库分段配置 - 数据新增接口
export interface KnowledgeRawSegmentAddParams {
  spaceId: number;
  // 文档ID
  docId: number;
  // 原始文本
  rawTxt: string;
  // 排序索引,在归属同一个文档下，段的排序
  sortIndex: number;
}

// 知识库问答 - 数据新增接口
export interface KnowledgeQAUpdateParams {
  spaceId: number;
  // 问答ID
  qaId: number;
  // 文档ID
  docId: number;
  // 问题
  question: string;
  // 答案
  answer: string;
}

// 知识库问答 - 知识库内问答查询
export interface KnowledgeQASearchParams {
  // 知识库ID
  kbId: number;
  // 问题
  question: string;
  // top-K值
  topK: number;
  // 是否忽略文档状态
  ignoreDocStatus: boolean;
}

// 知识库问答 - 知识库内问答查询 返回的具体业务数据
export interface KnowledgeQASearchParams {
  // 问答ID
  qaId: number;
  // 所在知识库ID
  kbId: number;
  // 分段问题
  question: string;
  // 分段答案
  answer: string;
  // 归属分段对应的原始分段文本,可能没有
  rawTxt: string;
  // 得分
  score: number;
}

// 知识库问答 - 数据列表查询输入参数
export interface KnowledgeQAListParams extends KnowledgeListBaseInfo {
  // 知识库问答-新增请求参数
  queryFilter: {
    // 当前页,示例值(1)
    current: number;
    // 分页pageSize,示例值(10)
    pageSize: number;
  };
}

// 知识库问答 - 详细信息
export interface KnowledgeQAInfo {
  // 主键id
  id: number;
  // 分段所属文档
  docId: number;
  // 所属原始分段ID
  rawId: number;
  // 问题会进行嵌入（对分段的增删改会走大模型并调用向量数据库）
  question: string;
  // 答案会进行嵌入（对分段的增删改会走大模型并调用向量数据库）
  answer: string;
  // 知识库ID
  kbId: number;
  // 是否已经完成嵌入
  hasEmbedding: boolean;
  // 所属空间ID
  spaceId: number;
  // 创建时间
  created: string;
  // 创建人id
  creatorId: number;
  // 创建人
  creatorName: string;
  // 更新时间
  modified: string;
  // 最后修改人id
  modifiedId: number;
  // 最后修改人
  modifiedName: string;
}

// 知识库问答 - 新增请求参数
export interface KnowledgeQAAddParams {
  spaceId: number;
  // 文档ID
  docId: number;
  // 问题
  question: string;
  // 答案
  answer: string;
}

export interface EmbeddingStatusInfo {
  // Doc ID
  docId: number;
  // QA数量
  qaCount: number;
  // QA Embedding数量
  qaEmbeddingCount: number;
}