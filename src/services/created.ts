import { PluginAndLibraryEnum } from '@/types/enums/common';
import customRequest from '@/utils/customRequest';
const itemList = {
  Plugin: '/api/published/plugin/list',
  Workflow: '/api/published/workflow/list',
  KnowledgeBase: '/api/published/knowledge/list',
  Database: '/api/published/dataBase/list',
};

export interface IgetList {
  page?: number;
  pageSize?: number;
  category?: string;
  kw?: string;
  spaceId?: number;
}

// 获取工作流的列表
const getList = (type: PluginAndLibraryEnum, params?: IgetList) => {
  return customRequest({
    url: itemList[type],
    method: 'POST',
    data: params,
  });
};

export default { getList };
