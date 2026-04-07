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
import { dict } from '@/services/i18nRuntime';
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
  ModelUsageScenarioEnum,
} from '@/types/enums/modelConfig';
import { TaskCenterMoreActionEnum } from '@/types/enums/pageDev';
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

// 任务中心更多操作
export const TASK_CENTER_MORE_ACTION: CustomPopoverItem[] = [
  {
    action: TaskCenterMoreActionEnum.Record,
    label: dict('PC.Constants.Library.execRecord'),
    type: TaskCenterMoreActionEnum.Record,
  },
  {
    action: TaskCenterMoreActionEnum.Edit,
    label: dict('PC.Common.Global.edit'),
    type: TaskCenterMoreActionEnum.Edit,
  },
  {
    action: TaskCenterMoreActionEnum.Enable,
    label: dict('PC.Common.Global.enable'),
    type: TaskCenterMoreActionEnum.Enable,
  },
  {
    action: TaskCenterMoreActionEnum.Disable,
    label: dict('PC.Common.Global.disable'),
    type: TaskCenterMoreActionEnum.Disable,
  },
  {
    action: TaskCenterMoreActionEnum.Execute,
    label: dict('PC.Constants.Library.manualExec'),
    type: TaskCenterMoreActionEnum.Execute,
  },
  {
    action: TaskCenterMoreActionEnum.Delete,
    label: dict('PC.Common.Global.delete'),
    isDel: true,
    type: TaskCenterMoreActionEnum.Delete,
  },
];

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
  // 工作流
  {
    action: ApplicationMoreActionEnum.Copy_To_Space,
    label: dict('PC.Constants.Space.copyToSpace'),
    type: ComponentTypeEnum.Workflow,
  },
  {
    action: ApplicationMoreActionEnum.Export_Config,
    label: dict('PC.Constants.Space.exportConfig'),
    type: ComponentTypeEnum.Workflow,
  },
  {
    action: ApplicationMoreActionEnum.Log,
    label: dict('PC.Common.Global.log'),
    type: ComponentTypeEnum.Workflow,
  },
  {
    action: ApplicationMoreActionEnum.Del,
    label: dict('PC.Common.Global.delete'),
    isDel: true,
    type: ComponentTypeEnum.Workflow,
  },
  // 插件
  {
    action: ApplicationMoreActionEnum.Copy_To_Space,
    label: dict('PC.Constants.Space.copyToSpace'),
    type: ComponentTypeEnum.Plugin,
  },
  {
    action: ApplicationMoreActionEnum.Export_Config,
    label: dict('PC.Constants.Space.exportConfig'),
    type: ComponentTypeEnum.Plugin,
  },
  {
    action: ApplicationMoreActionEnum.Log,
    label: dict('PC.Common.Global.log'),
    type: ComponentTypeEnum.Plugin,
  },
  {
    action: ApplicationMoreActionEnum.Del,
    label: dict('PC.Common.Global.delete'),
    isDel: true,
    type: ComponentTypeEnum.Plugin,
  },

  // 知识库
  // { type: ApplicationMoreActionEnum.Statistics, label: '统计' },
  {
    action: ApplicationMoreActionEnum.Del,
    label: dict('PC.Common.Global.delete'),
    isDel: true,
    type: ComponentTypeEnum.Knowledge,
  },
  // 数据表
  {
    action: ApplicationMoreActionEnum.Copy,
    label: dict('PC.Common.Global.copy'),
    type: ComponentTypeEnum.Table,
  },
  {
    action: ApplicationMoreActionEnum.Export_Config,
    label: dict('PC.Constants.Space.exportConfig'),
    type: ComponentTypeEnum.Table,
  },
  {
    action: ApplicationMoreActionEnum.Del,
    label: dict('PC.Common.Global.delete'),
    isDel: true,
    type: ComponentTypeEnum.Table,
  },
  // 模型
  {
    action: ApplicationMoreActionEnum.Del,
    label: dict('PC.Common.Global.delete'),
    isDel: true,
    type: ComponentTypeEnum.Model,
  },
];

// 插件工具创建方式
export const PLUGIN_CREATE_TOOL = [
  {
    value: PluginTypeEnum.HTTP,
    label: dict('PC.Constants.Library.createByHttp'),
  },
  {
    value: PluginTypeEnum.CODE,
    label: dict('PC.Constants.Library.createByCloudCode'),
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
    label: dict('PC.Constants.Library.none'),
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
    value: InputTypeEnum.Query,
    label: 'Query',
  },
  {
    value: InputTypeEnum.Body,
    label: 'Body',
  },
  {
    value: InputTypeEnum.Path,
    label: 'Path',
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
    label: dict('PC.Constants.Library.localDoc'),
    icon: <ICON_LOCAL_DOC />,
    desc: dict('PC.Constants.Library.localDocDesc'),
  },
  // {
  //   value: KnowledgeTextImportEnum.Online_Doc,
  //   label: '在线文档',
  //   icon: <ICON_ONLINE_DOC />,
  //   desc: '获取在线网页内容',
  // },
  {
    value: KnowledgeTextImportEnum.Custom,
    label: dict('PC.Common.Global.custom'),
    icon: <ICON_CUSTOM_DOC />,
    desc: dict('PC.Common.Global.custom'),
  },
];

// 知识库QA问答格式导入类型
export const KNOWLEDGE_QA_IMPORT_TYPE = [
  {
    value: KnowledgeTextImportEnum.Custom,
    label: dict('PC.Constants.Library.manualAdd'),
    icon: <ICON_CUSTOM_DOC />,
    desc: dict('PC.Constants.Library.manualAdd'),
  },
  {
    value: KnowledgeTextImportEnum.Local_Doc,
    label: dict('PC.Constants.Library.batchImport'),
    icon: <ICON_LOCAL_DOC />,
    desc: dict('PC.Constants.Library.batchImportDesc'),
  },
];
// 知识库-本地文档添加内容-步骤列表
export const KNOWLEDGE_LOCAL_DOC_LIST = [
  {
    title: dict('PC.Constants.Library.upload'),
  },
  {
    title: dict('PC.Constants.Library.createSettings'),
  },
  {
    title: dict('PC.Constants.Library.dataProcess'),
  },
];

// 知识库-自定义文档添加内容-步骤列表
export const KNOWLEDGE_CUSTOM_DOC_LIST = [
  {
    title: dict('PC.Constants.Library.textFill'),
  },
  {
    title: dict('PC.Constants.Library.segmentSettings'),
  },
  {
    title: dict('PC.Constants.Library.dataProcess'),
  },
];

// 组件列表常量数据
export const COMPONENT_LIST = [
  {
    type: ComponentTypeEnum.Plugin,
    defaultImage: pluginImage,
    icon: <ICON_PLUGIN />,
    text: dict('PC.Common.Global.plugin'),
  },
  {
    type: ComponentTypeEnum.Knowledge,
    defaultImage: knowledgeImage,
    icon: <ICON_KNOWLEDGE />,
    text: dict('PC.Common.Global.knowledge'),
  },
  {
    type: ComponentTypeEnum.Workflow,
    defaultImage: workflowImage,
    icon: <ICON_WORKFLOW />,
    text: dict('PC.Common.Global.workflow'),
  },
  {
    type: ComponentTypeEnum.Table,
    defaultImage: databaseImage,
    icon: <ICON_DATABASE />,
    text: dict('PC.Common.Global.dataTable'),
  },
  {
    type: ComponentTypeEnum.Model,
    defaultImage: modelImage,
    icon: <ICON_MODEL />,
    text: dict('PC.Common.Global.model'),
  },
];

// 模型联网类型
export const MODEL_NETWORK_TYPE_LIST = [
  {
    value: ModelNetworkTypeEnum.Internet,
    label: dict('PC.Constants.Library.publicModel'),
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
    label: dict('PC.Constants.Library.roundRobin'),
  },
  {
    value: ModelStrategyEnum.WeightedRoundRobin,
    label: dict('PC.Constants.Library.weightedRoundRobin'),
  },
  {
    value: ModelStrategyEnum.LeastConnections,
    label: dict('PC.Constants.Library.weightedLeastConn'),
  },
  {
    value: ModelStrategyEnum.Random,
    label: dict('PC.Constants.Library.random'),
  },
  {
    value: ModelStrategyEnum.ResponseTime,
    label: dict('PC.Constants.Library.responseTime'),
  },
];
// 模型类型
export const MODEL_TYPE_LIST = [
  {
    value: ModelTypeEnum.Completions,
    label: dict('PC.Constants.Library.textCompletion'),
  },
  {
    value: ModelTypeEnum.Chat,
    label: dict('PC.Constants.Library.chatText'),
  },
  {
    value: ModelTypeEnum.Edits,
    label: dict('PC.Constants.Library.textEdit'),
  },
  {
    value: ModelTypeEnum.Images,
    label: dict('PC.Constants.Library.imageProcess'),
  },
  {
    value: ModelTypeEnum.Multi,
    label: dict('PC.Constants.Library.chatMultimodal'),
  },
  {
    value: ModelTypeEnum.Embeddings,
    label: dict('PC.Constants.Library.vectorEmbedding'),
  },
  {
    value: ModelTypeEnum.Audio,
    label: dict('PC.Constants.Library.audioProcess'),
  },
  {
    value: ModelTypeEnum.Other,
    label: dict('PC.Common.Global.other'),
  },
];
// 函数调用支持
export const MODEL_FUNCTION_CALL_LIST = [
  {
    value: ModelFunctionCallEnum.CallSupported,
    label: dict('PC.Constants.Library.supportFuncCall'),
  },
  {
    value: ModelFunctionCallEnum.StreamCallSupported,
    label: dict('PC.Constants.Library.supportStreamFuncCall'),
  },
  {
    value: ModelFunctionCallEnum.Unsupported,
    label: dict('PC.Constants.Library.unsupportFuncCall'),
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

// 模型可用场景列表
export const MODEL_USAGE_SCENARIO_LIST = [
  {
    value: ModelUsageScenarioEnum.PageApp,
    label: '网页应用',
  },
  {
    value: ModelUsageScenarioEnum.TaskAgent,
    label: '通用智能体',
  },
  {
    value: ModelUsageScenarioEnum.ChatBot,
    label: '问答智能体',
  },
  {
    value: ModelUsageScenarioEnum.Workflow,
    label: '工作流',
  },
  {
    value: ModelUsageScenarioEnum.OpenApi,
    label: '外部API调用',
  },
];

// 插件
export const PLUGIN_CODE_SEGMENTED_LIST = [
  {
    label: dict('PC.Constants.Library.metadata'),
    value: PluginCodeModeEnum.Metadata,
    icon: <BarsOutlined />,
  },
  {
    label: dict('PC.Constants.Library.code'),
    value: PluginCodeModeEnum.Code,
    icon: <ICON_CODE />,
  },
];

// 知识库分段标识符列表
export const KNOWLEDGE_SEGMENT_IDENTIFIER_LIST = [
  {
    label: dict('PC.Constants.Library.segNewline'),
    value: KnowledgeSegmentIdentifierEnum.Line_Feed,
  },
  {
    label: dict('PC.Constants.Library.segTwoNewline'),
    value: KnowledgeSegmentIdentifierEnum.Two_Line_Feed,
  },
  {
    label: dict('PC.Constants.Library.segChinesePeriod'),
    value: KnowledgeSegmentIdentifierEnum.Chinese_Sentence,
  },
  {
    label: dict('PC.Constants.Library.segChineseExclamation'),
    value: KnowledgeSegmentIdentifierEnum.Chinese_Exclamation,
  },
  {
    label: dict('PC.Constants.Library.segEnglishPeriod'),
    value: KnowledgeSegmentIdentifierEnum.English_Sentence,
  },
  {
    label: dict('PC.Constants.Library.segEnglishExclamation'),
    value: KnowledgeSegmentIdentifierEnum.English_Exclamation,
  },
  {
    label: dict('PC.Constants.Library.segChineseQuestion'),
    value: KnowledgeSegmentIdentifierEnum.Chinese_Question_Mark,
  },
  {
    label: dict('PC.Constants.Library.segEnglishQuestion'),
    value: KnowledgeSegmentIdentifierEnum.English_Question_Mark,
  },
  {
    label: dict('PC.Common.Global.custom'),
    value: KnowledgeSegmentIdentifierEnum.Custom,
  },
];
