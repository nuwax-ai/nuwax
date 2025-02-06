import {
  ICON_CUSTOM_DOC,
  ICON_LOCAL_DOC,
  ICON_ONLINE_DOC,
  ICON_TABLE_FORMAT,
  ICON_TEXT_FORMAT,
} from '@/constants/images.constants';
import {
  AfferentModeEnum,
  ComponentMoreActionEnum,
  KnowledgeResourceEnum,
  KnowledgeTextImportEnum,
  PluginCreateToolEnum,
  RequestContentFormatEnum,
  RequestMethodEnum,
} from '@/types/enums/library';
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
    value: PluginCreateToolEnum.Existing_Service_Based,
    label: '基于已有服务（http接口）创建',
  },
  {
    value: PluginCreateToolEnum.Cloud_Based_Code_Creation,
    label: '基于云端代码（nodejs、python）创建',
  },
];

// 请求方法
export const REQUEST_METHOD = [
  {
    value: RequestMethodEnum.Post,
    label: 'POST',
  },
  {
    value: RequestMethodEnum.Get,
    label: 'GET',
  },
  {
    value: RequestMethodEnum.Put,
    label: 'PUT',
  },
  {
    value: RequestMethodEnum.Delete,
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
    value: AfferentModeEnum.Body,
    label: 'Body',
  },
  {
    value: AfferentModeEnum.Path,
    label: 'Path',
  },
  {
    value: AfferentModeEnum.Query,
    label: 'Query',
  },
  {
    value: AfferentModeEnum.Header,
    label: 'Header',
  },
];

// 知识库资源格式
export const KNOWLEDGE_RESOURCE_FORMAT = [
  {
    value: KnowledgeResourceEnum.Text,
    label: '文本格式',
    icon: <ICON_TEXT_FORMAT />,
  },
  {
    value: KnowledgeResourceEnum.Table,
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
