import databaseImage from '@/assets/images/database_image.png';
import knowledgeImage from '@/assets/images/knowledge_image.png';
import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import {
  ICON_CUSTOM_DOC,
  ICON_DATABASE,
  ICON_KNOWLEDGE,
  ICON_LOCAL_DOC,
  ICON_MODEL,
  ICON_ONLINE_DOC,
  ICON_PLUGIN,
  ICON_TABLE_FORMAT,
  ICON_TEXT_FORMAT,
  ICON_WORKFLOW,
} from '@/constants/images.constants';
import { InputTypeType } from '@/types/enums/agent';
import { HttpMethodEnum } from '@/types/enums/common';
import {
  ComponentMoreActionEnum,
  KnowledgeDataTypeEnum,
  KnowledgeTextImportEnum,
  RequestContentFormatEnum,
} from '@/types/enums/library';
import { CodeLangEnum, PluginTypeEnum } from '@/types/enums/plugin';
import { ComponentTypeEnum } from '@/types/enums/space';
import type { CustomPopoverItem } from '@/types/interfaces/common';

// 组件库更多操作
export const COMPONENT_MORE_ACTION: CustomPopoverItem[] = [
  { type: ComponentMoreActionEnum.Copy, label: '复制' },
  { type: ComponentMoreActionEnum.Statistics, label: '统计' },
  { type: ComponentMoreActionEnum.Del, label: '删除', isDel: true },
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
    value: RequestContentFormatEnum.No,
    label: '无',
  },
  {
    value: RequestContentFormatEnum.Form_Data,
    label: 'form-data',
  },
  {
    value: RequestContentFormatEnum.X_Www_Form_Urlencoded,
    label: 'x-www-form-urlencoded',
  },
  {
    value: RequestContentFormatEnum.Json,
    label: 'json',
  },
];

// 传入方法
export const AFFERENT_MODE_LIST = [
  {
    value: InputTypeType.Body,
    label: 'Body',
  },
  {
    value: InputTypeType.Path,
    label: 'Path',
  },
  {
    value: InputTypeType.Query,
    label: 'Query',
  },
  {
    value: InputTypeType.Header,
    label: 'Header',
  },
];

// 知识库资源格式
export const KNOWLEDGE_RESOURCE_FORMAT = [
  {
    value: KnowledgeDataTypeEnum.Text,
    label: '文本格式',
    icon: <ICON_TEXT_FORMAT />,
  },
  {
    value: KnowledgeDataTypeEnum.Table,
    label: '表格格式',
    icon: <ICON_TABLE_FORMAT />,
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
  {
    value: KnowledgeTextImportEnum.Online_Doc,
    label: '在线文档',
    icon: <ICON_ONLINE_DOC />,
    desc: '获取在线网页内容',
  },
  {
    value: KnowledgeTextImportEnum.Custom,
    label: '自定义',
    icon: <ICON_CUSTOM_DOC />,
    desc: '自定义',
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
    type: ComponentTypeEnum.Database,
    defaultImage: databaseImage,
    icon: <ICON_DATABASE />,
    text: '数据库',
  },
  {
    type: ComponentTypeEnum.Model,
    defaultImage: databaseImage,
    icon: <ICON_MODEL />,
    text: '模型',
  },
];
