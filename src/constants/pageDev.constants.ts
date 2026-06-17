import { dict } from '@/services/i18nRuntime';
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
    label: dict('PC.Constants.PageDev.onlineCreate'),
  },
  {
    value: PageDevelopCreateTypeEnum.Import_Project,
    label: dict('PC.Constants.PageDev.localImport'),
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
    label: dict('PC.Constants.Space.allTypes'),
  },
  {
    value: PageDevelopSelectTypeEnum.AGENT,
    label: dict('PC.Constants.PageDev.smartApp'),
  },
  {
    value: PageDevelopSelectTypeEnum.PAGE,
    label: dict('PC.Constants.PageDev.pageComponent'),
  },
];

// 反向代理列表
export const REVERSE_PROXY_ACTIONS = [
  {
    type: ReverseProxyEnum.Dev,
    label: dict('PC.Constants.PageDev.devDebug'),
  },
  {
    type: ReverseProxyEnum.Production,
    label: dict('PC.Constants.PageDev.production'),
  },
];

// 页面开发创建类型列表
export const PAGE_DEVELOP_MORE_ACTIONS = [
  // {
  //   value: PageDevelopMoreActionEnum.Reverse_Proxy_Config,
  //   label: '反向代理配置',
  // },
  {
    value: PageDevelopMoreActionEnum.Path_Params_Config,
    label: dict('PC.Constants.PageDev.pathParamsConfig'),
  },
  {
    value: PageDevelopMoreActionEnum.Auth_Config,
    label: dict('PC.Constants.PageDev.authConfig'),
  },
  {
    value: PageDevelopMoreActionEnum.Domain_Binding,
    label: dict('PC.Constants.PageDev.domainBinding'),
  },
  {
    value: PageDevelopMoreActionEnum.Page_Preview,
    label: dict('PC.Constants.PageDev.pagePreview'),
  },
  {
    value: PageDevelopMoreActionEnum.Copy_To_Space,
    label: dict('PC.Constants.Space.copyToSpace'),
  },
  {
    value: PageDevelopMoreActionEnum.Export_Project,
    label: dict('PC.Constants.PageDev.exportProject'),
  },
  {
    value: PageDevelopMoreActionEnum.Delete,
    label: dict('PC.Common.Global.delete'),
  },
];

// 页面开发发布类型列表
export const PAGE_DEVELOP_PUBLISH_TYPE_LIST = [
  {
    value: PageDevelopPublishTypeEnum.PAGE,
    label: dict('PC.Constants.PageDev.publishAsComponent'),
  },
  {
    value: PageDevelopPublishTypeEnum.AGENT,
    label: dict('PC.Constants.PageDev.publishAsApp'),
  },
];
