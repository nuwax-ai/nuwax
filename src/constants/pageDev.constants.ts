import {
  PageDevelopCreateTypeEnum,
  PageDevelopMoreActionEnum,
  ReverseProxyEnum,
} from '@/types/enums/pageDev';

// 页面开发创建类型列表
export const PAGE_DEVELOP_CREATE_TYPE_LIST = [
  {
    value: PageDevelopCreateTypeEnum.Import_Project,
    label: '导入项目',
  },
  {
    value: PageDevelopCreateTypeEnum.ONLINE_DEPLOY,
    label: '在线创建',
  },
  {
    value: PageDevelopCreateTypeEnum.REVERSE_PROXY,
    label: '反向代理',
  },
];

// 页面开发所有类型
export const PAGE_DEVELOP_ALL_TYPE = [
  {
    value: PageDevelopCreateTypeEnum.All_Type,
    label: '所有类型',
  },
  ...PAGE_DEVELOP_CREATE_TYPE_LIST,
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
    value: PageDevelopMoreActionEnum.Page_Preview,
    label: '页面预览',
  },
];
