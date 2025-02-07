import { PluginAndLibraryEnum } from '@/types/enums/common';
import customRequest from '@/utils/customRequest';
const itemList = {
  Plugin: '/api/published/plugin/list',
  Workflow: '/api/published/workflow/list',
  KnowledgeBase: '/api/published/knowledge/list',
  Database: '/api/published/dataBase/list',
};

export interface IGetList {
  page?: number;
  pageSize?: number;
  category?: string;
  kw?: string;
  spaceId?: number;
}

// 获取插件、工作流、知识库、数据库的列表
const getList = (type: PluginAndLibraryEnum, params?: IGetList) => {
  return customRequest({
    url: itemList[type],
    method: 'POST',
    data: params,
  });
};

// 已收藏插件、工作流、知识库、数据库列表
const collectList = (type: string, params: IGetList) => {
  return customRequest({
    url: `/api/published/${type}/collect/list`,
    method: 'POST',
    data: params,
  });
};

// 收藏当前的插件、工作流、知识库、数据库
const collect = (type: string, id: number) => {
  return customRequest({
    url: `/api/published/${type}/collect/${id}`,
    method: 'POST',
    data: { [`${type}Id`]: id },
  });
};

// 取消收藏当前的插件、工作流、知识库、数据库
const unCollect = (type: string, id: number) => {
  return customRequest({
    url: `/api/published/${type}/unCollect/${id}`,
    method: 'POST',
    data: { [`${type}Id`]: id },
  });
};

export default { getList, collectList, collect, unCollect };
