import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import modelImage from '@/assets/images/model_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import {
  ICON_CODE,
  ICON_CUSTOM_DOC,
  ICON_DATABASE,
  ICON_KNOWLEDGE,
  ICON_LOCAL_DOC,
  ICON_MODEL,
  ICON_PLUGIN,
  ICON_WORKFLOW,
} from '@/constants/images.constants';
import { InputTypeEnum } from '@/types/enums/agent';
import { HttpContentTypeEnum, HttpMethodEnum } from '@/types/enums/common';
import {
  KnowledgeSegmentIdentifierEnum,
  KnowledgeTextImportEnum,
} from '@/types/enums/library';
import {
  ModelApiProtocolEnum,
  ModelFunctionCallEnum,
  ModelNetworkTypeEnum,
  ModelStrategyEnum,
  ModelTypeEnum,
} from '@/types/enums/modelConfig';
import {
  CodeLangEnum,
  PluginCodeModeEnum,
  PluginTypeEnum,
} from '@/types/enums/plugin';
import {
  ApplicationMoreActionEnum,
  ComponentTypeEnum,
} from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { BarsOutlined } from '@ant-design/icons';

/**
 * 组件库更多操作
 * 插件： 创建副本、导出配置、删除
 * 模型：删除
 * 工作流：创建副本、导出配置、删除
 * 知识库： 删除
 * 数据表： 复制、导出配置、删除
 * 导出配置接口，支持Agent、Workflow、Plugin、Table
 */
export const COMPONENT_MORE_ACTION: CustomPopoverItem[] = [
  // 插件
  {
    action: ApplicationMoreActionEnum.Copy_To_Space,
    label: '复制到空间',
    type: ComponentTypeEnum.Plugin,
  },
  {
    action: ApplicationMoreActionEnum.Export_Config,
    label: '导出配置',
    type: ComponentTypeEnum.Plugin,
  },
  {
    action: ApplicationMoreActionEnum.Del,
    label: '删除',
    isDel: true,
    type: ComponentTypeEnum.Plugin,
  },
  {
    action: ApplicationMoreActionEnum.Del,
    label: '删除',
    isDel: true,
    type: ComponentTypeEnum.Model,
  },
  // 工作流
  {
    action: ApplicationMoreActionEnum.Copy_To_Space,
    label: '复制到空间',
    type: ComponentTypeEnum.Workflow,
  },
  {
    action: ApplicationMoreActionEnum.Export_Config,
    label: '导出配置',
    type: ComponentTypeEnum.Workflow,
  },
  {
    action: ApplicationMoreActionEnum.Del,
    label: '删除',
    isDel: true,
    type: ComponentTypeEnum.Workflow,
  },
  // 知识库
  // { type: ApplicationMoreActionEnum.Statistics, label: '统计' },
  {
    action: ApplicationMoreActionEnum.Del,
    label: '删除',
    isDel: true,
    type: ComponentTypeEnum.Knowledge,
  },
  // 数据表
  {
    action: ApplicationMoreActionEnum.Copy,
    label: '复制',
    type: ComponentTypeEnum.Table,
  },
  {
    action: ApplicationMoreActionEnum.Export_Config,
    label: '导出配置',
    type: ComponentTypeEnum.Table,
  },
  {
    action: ApplicationMoreActionEnum.Del,
    label: '删除',
    isDel: true,
    type: ComponentTypeEnum.Table,
  },
];

// 插件工具创建方式
export const PLUGIN_CREATE_TOOL = [
  {
    value: PluginTypeEnum.HTTP,
    label: '基于已有服务（http接口）创建',
  },
  {
    value: PluginTypeEnum.CODE,
    label: '基于云端代码（nodejs、python）创建',
  },
];

// 基于云端代码（nodejs、python）创建下拉选择项
export const CLOUD_BASE_CODE_OPTIONS = [
  {
    value: CodeLangEnum.JavaScript,
    label: 'JavaScript',
  },
  {
    value: CodeLangEnum.Python,
    label: 'Python3',
  },
];

// 请求方法
export const REQUEST_METHOD = [
  {
    value: HttpMethodEnum.POST,
    label: 'POST',
  },
  {
    value: HttpMethodEnum.GET,
    label: 'GET',
  },
  {
    value: HttpMethodEnum.PUT,
    label: 'PUT',
  },
  {
    value: HttpMethodEnum.DELETE,
    label: 'DELETE',
  },
];

// 请求内容格式
export const REQUEST_CONTENT_FORMAT = [
  {
    value: HttpContentTypeEnum.OTHER,
    label: '无',
  },
  {
    value: HttpContentTypeEnum.FORM_DATA,
    label: 'form-data',
  },
  {
    value: HttpContentTypeEnum.X_WWW_FORM_URLENCODED,
    label: 'x-www-form-urlencoded',
  },
  {
    value: HttpContentTypeEnum.JSON,
    label: 'json',
  },
];

// 传入方法
export const AFFERENT_MODE_LIST = [
  {
    value: InputTypeEnum.Body,
    label: 'Body',
  },
  {
    value: InputTypeEnum.Path,
    label: 'Path',
  },
  {
    value: InputTypeEnum.Query,
    label: 'Query',
  },
  {
    value: InputTypeEnum.Header,
    label: 'Header',
  },
];

// 知识库文本格式导入类型
export const KNOWLEDGE_TEXT_IMPORT_TYPE = [
  {
    value: KnowledgeTextImportEnum.Local_Doc,
    label: '本地文档',
    icon: <ICON_LOCAL_DOC />,
    desc: '上传 PDF, TXT, MD, DOC, DOCX 格式的本地文件',
  },
  // {
  //   value: KnowledgeTextImportEnum.Online_Doc,
  //   label: '在线文档',
  //   icon: <ICON_ONLINE_DOC />,
  //   desc: '获取在线网页内容',
  // },
  {
    value: KnowledgeTextImportEnum.Custom,
    label: '自定义',
    icon: <ICON_CUSTOM_DOC />,
    desc: '自定义',
  },
];

// 知识库QA问答格式导入类型
export const KNOWLEDGE_QA_IMPORT_TYPE = [
  {
    value: KnowledgeTextImportEnum.Custom,
    label: '手动添加',
    icon: <ICON_CUSTOM_DOC />,
    desc: '手动添加',
  },
  {
    value: KnowledgeTextImportEnum.Local_Doc,
    label: '批量导入',
    icon: <ICON_LOCAL_DOC />,
    desc: '上传 Excel 格式的本地文件',
  },
];
// 知识库-本地文档添加内容-步骤列表
export const KNOWLEDGE_LOCAL_DOC_LIST = [
  {
    title: '上传',
  },
  {
    title: '创建设置',
  },
  {
    title: '数据处理',
  },
];

// 知识库-自定义文档添加内容-步骤列表
export const KNOWLEDGE_CUSTOM_DOC_LIST = [
  {
    title: '文本填写',
  },
  {
    title: '分段设置',
  },
  {
    title: '数据处理',
  },
];

// 组件列表常量数据
export const COMPONENT_LIST = [
  {
    type: ComponentTypeEnum.Plugin,
    defaultImage: pluginImage,
    icon: <ICON_PLUGIN />,
    text: '插件',
  },
  {
    type: ComponentTypeEnum.Knowledge,
    defaultImage: knowledgeImage,
    icon: <ICON_KNOWLEDGE />,
    text: '知识库',
  },
  {
    type: ComponentTypeEnum.Workflow,
    defaultImage: workflowImage,
    icon: <ICON_WORKFLOW />,
    text: '工作流',
  },
  {
    type: ComponentTypeEnum.Table,
    defaultImage: databaseImage,
    icon: <ICON_DATABASE />,
    text: '数据表',
  },
  {
    type: ComponentTypeEnum.Model,
    defaultImage: modelImage,
    icon: <ICON_MODEL />,
    text: '模型',
  },
];

// 模型联网类型
export const MODEL_NETWORK_TYPE_LIST = [
  {
    value: ModelNetworkTypeEnum.Internet,
    label: '公网模型',
  },
  // {
  //   value: ModelNetworkTypeEnum.Intranet,
  //   label: '内网模型',
  // },
];

// 模型调用策略
export const MODEL_STRATEGY_LIST = [
  {
    value: ModelStrategyEnum.RoundRobin,
    label: '轮询',
  },
  {
    value: ModelStrategyEnum.WeightedRoundRobin,
    label: '加权轮询',
  },
  {
    value: ModelStrategyEnum.LeastConnections,
    label: '加权最少连接',
  },
  {
    value: ModelStrategyEnum.Random,
    label: '随机',
  },
  {
    value: ModelStrategyEnum.ResponseTime,
    label: '响应时间',
  },
];
// 模型类型
export const MODEL_TYPE_LIST = [
  {
    value: ModelTypeEnum.Completions,
    label: '文本补全',
  },
  {
    value: ModelTypeEnum.Chat,
    label: '聊天对话-纯文本',
  },
  {
    value: ModelTypeEnum.Edits,
    label: '文本编辑',
  },
  {
    value: ModelTypeEnum.Images,
    label: '图像处理',
  },
  {
    value: ModelTypeEnum.Multi,
    label: '聊天对话-多模态',
  },
  {
    value: ModelTypeEnum.Embeddings,
    label: '向量嵌入',
  },
  {
    value: ModelTypeEnum.Audio,
    label: '语音处理',
  },
  {
    value: ModelTypeEnum.Other,
    label: '其他',
  },
];
// 函数调用支持
export const MODEL_FUNCTION_CALL_LIST = [
  {
    value: ModelFunctionCallEnum.CallSupported,
    label: '支持普通函数调用',
  },
  {
    value: ModelFunctionCallEnum.StreamCallSupported,
    label: '支持流式函数调用',
  },
  {
    value: ModelFunctionCallEnum.Unsupported,
    label: '不支持函数调用',
  },
];
// 模型接口协议
export const MODEL_API_PROTOCOL_LIST = [
  {
    value: ModelApiProtocolEnum.OpenAI,
    label: 'OpenAI',
  },
  {
    value: ModelApiProtocolEnum.Ollama,
    label: 'Ollama',
  },
  // {
  //   value: ModelApiProtocolEnum.Zhipu,
  //   label: 'Zhipu',
  // },
  {
    value: ModelApiProtocolEnum.Anthropic,
    label: 'Anthropic',
  },
];

// 插件
export const PLUGIN_CODE_SEGMENTED_LIST = [
  {
    label: '元数据',
    value: PluginCodeModeEnum.Metadata,
    icon: <BarsOutlined />,
  },
  { label: '代码', value: PluginCodeModeEnum.Code, icon: <ICON_CODE /> },
];

// 知识库分段标识符列表
export const KNOWLEDGE_SEGMENT_IDENTIFIER_LIST = [
  {
    label: '换行（\\n）',
    value: KnowledgeSegmentIdentifierEnum.Line_Feed,
  },
  {
    label: '2个换行（\\n\\n）',
    value: KnowledgeSegmentIdentifierEnum.Two_Line_Feed,
  },
  {
    label: '中文句号（。）',
    value: KnowledgeSegmentIdentifierEnum.Chinese_Sentence,
  },
  {
    label: '中文叹号(！)',
    value: KnowledgeSegmentIdentifierEnum.Chinese_Exclamation,
  },
  {
    label: '英文句号（.）',
    value: KnowledgeSegmentIdentifierEnum.English_Sentence,
  },
  {
    label: '英文叹号（!）',
    value: KnowledgeSegmentIdentifierEnum.English_Exclamation,
  },
  {
    label: '中文问号（？）',
    value: KnowledgeSegmentIdentifierEnum.Chinese_Question_Mark,
  },
  {
    label: '英文问号（?）',
    value: KnowledgeSegmentIdentifierEnum.English_Question_Mark,
  },
  {
    label: '自定义',
    value: KnowledgeSegmentIdentifierEnum.Custom,
  },
];
