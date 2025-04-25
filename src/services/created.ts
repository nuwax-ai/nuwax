import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
const itemList = {
  [AgentComponentTypeEnum.Plugin]: '/api/published/plugin/list',
  [AgentComponentTypeEnum.Workflow]: '/api/published/workflow/list',
  [AgentComponentTypeEnum.Knowledge]: '/api/published/knowledge/list',
  [AgentComponentTypeEnum.Table]: '/api/published/dataBase/list',
  [AgentComponentTypeEnum.Variable]: '/api/published/dataBase/list',
  [AgentComponentTypeEnum.Model]: '/api/published/dataBase/list',
  [AgentComponentTypeEnum.Trigger]: '/api/published/dataBase/list',
  [AgentComponentTypeEnum.Agent]: '/api/published/dataBase/list',
};

export interface IGetList {
  page: number;
  pageSize: number;
  category?: string;
  kw?: string;
  spaceId?: number;
  dataType?: string;
  justReturnSpaceData?: boolean;
}

export async function getList(
  type: AgentComponentTypeEnum,
  data?: IGetList,
): Promise<RequestResponse<any>> {
  return request(`${itemList[type]}`, {
    method: 'POST',
    data,
  });
}

// 已收藏插件、工作流、知识库、数据库列表
export async function collectList(
  type: string,
  data?: IGetList,
): Promise<RequestResponse<any>> {
  return request(`/api/published/${type}/collect/list`, {
    method: 'POST',
    data,
  });
}

// 收藏当前的插件、工作流、知识库、数据库

export async function collect(
  type: string,
  id: number,
): Promise<RequestResponse<any>> {
  return request(`/api/published/${type}/collect/${id}`, {
    method: 'POST',
    data: { [`${type}Id`]: id },
  });
}

// 取消收藏当前的插件、工作流、知识库、数据库
export async function unCollect(
  type: string,
  id: number,
): Promise<RequestResponse<any>> {
  return request(`/api/published/${type}/unCollect/${id}`, {
    method: 'POST',
    data: { [`${type}Id`]: id },
  });
}

export default { getList, collectList, collect, unCollect };
