import {
  PageDevelopCreateTypeEnum,
  PageDevelopMoreActionEnum,
  PageDevelopPublishTypeEnum,
  PageDevelopSelectTypeEnum,
  ReverseProxyEnum,
} from '@/types/enums/pageDev';

// 页面开发创建类型列表
export const PAGE_DEVELOP_CREATE_TYPE_LIST = [
  {
    value: PageDevelopCreateTypeEnum.Online_Develop,
    label: '在线创建',
  },
  {
    value: PageDevelopCreateTypeEnum.Import_Project,
    label: '本地导入',
  },
  // {
  //   value: PageDevelopCreateTypeEnum.Reverse_Proxy,
  //   label: '反向代理',
  // },
];

// 页面开发所有类型
export const PAGE_DEVELOP_ALL_TYPE = [
  {
    value: PageDevelopSelectTypeEnum.All_Type,
    label: '所有类型',
  },
  {
    value: PageDevelopSelectTypeEnum.AGENT,
    label: '智能应用',
  },
  {
    value: PageDevelopSelectTypeEnum.PAGE,
    label: '页面组件',
  },
];

// 反向代理列表
export const REVERSE_PROXY_ACTIONS = [
  {
    type: ReverseProxyEnum.Dev,
    label: '开发调试',
  },
  {
    type: ReverseProxyEnum.Production,
    label: '正式环境',
  },
];

// 页面开发创建类型列表
export const PAGE_DEVELOP_MORE_ACTIONS = [
  {
    value: PageDevelopMoreActionEnum.Reverse_Proxy_Config,
    label: '反向代理配置',
  },
  {
    value: PageDevelopMoreActionEnum.Path_Params_Config,
    label: '路径参数配置',
  },
  {
    value: PageDevelopMoreActionEnum.Auth_Config,
    label: '认证配置',
  },
  {
    value: PageDevelopMoreActionEnum.Domain_Binding,
    label: '域名绑定',
  },
  {
    value: PageDevelopMoreActionEnum.Page_Preview,
    label: '页面预览',
  },
  {
    value: PageDevelopMoreActionEnum.Copy_To_Space,
    label: '复制到空间',
  },
  {
    value: PageDevelopMoreActionEnum.Export_Project,
    label: '导出项目',
  },
  {
    value: PageDevelopMoreActionEnum.Delete,
    label: '删除',
  },
];

// 页面开发发布类型列表
export const PAGE_DEVELOP_PUBLISH_TYPE_LIST = [
  {
    value: PageDevelopPublishTypeEnum.PAGE,
    label: '发布成组件',
  },
  {
    value: PageDevelopPublishTypeEnum.AGENT,
    label: '发布成应用',
  },
];
