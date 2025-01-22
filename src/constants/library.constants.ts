import {
  ComponentMoreActionEnum,
  PluginCreateToolEnum, RequestContentFormatEnum, RequestMethodEnum,
} from '@/types/enums/library';
import { CustomPopoverItem } from '@/types/interfaces/common';

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
export const REQUEST_METHOD = [{
  value: RequestMethodEnum.Post,
  label: 'POST',
}, {
  value: RequestMethodEnum.Get,
  label: 'GET',
}, {
  value: RequestMethodEnum.Put,
  label: 'PUT',
}, {
  value: RequestMethodEnum.Delete,
  label: 'DELETE',
}];

// 请求内容格式
export const REQUEST_CONTENT_FORMAT = [{
  value: RequestContentFormatEnum.No,
  label: '无',
}, {
  value: RequestContentFormatEnum.Form_Data,
  label: 'form-data',
}, {
  value: RequestContentFormatEnum.X_Www_Form_Urlencoded,
  label: 'x-www-form-urlencoded',
}, {
  value: RequestContentFormatEnum.Json,
  label: 'json',
}];
