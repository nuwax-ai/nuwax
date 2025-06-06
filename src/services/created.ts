import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
const itemList = {
  [AgentComponentTypeEnum.Plugin]: '/api/published/plugin/list',
  [AgentComponentTypeEnum.Workflow]: '/api/published/workflow/list',
  [AgentComponentTypeEnum.Knowledge]: '/api/published/knowledge/list',
  [AgentComponentTypeEnum.Table]: '/api/published/composeTable/list',
  [AgentComponentTypeEnum.Variable]: '/api/published/dataBase/list',
  [AgentComponentTypeEnum.Model]: '/api/published/dataBase/list',
  [AgentComponentTypeEnum.Trigger]: '/api/published/dataBase/list',
  [AgentComponentTypeEnum.Agent]: '/api/published/agent/list',
} as {
  [key in AgentComponentTypeEnum]: string;
};

export interface IGetList {
  page: number;
  pageSize: number;
  category?: string;
  kw?: string;
  spaceId?: number;
  dataType?: string;
  justReturnSpaceData?: boolean;
  allowCopy?: number; // 模板库 是否允许复制
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

// 参数接口
export interface IAddTask {
  /*表名称 */
  tableName: string;
  /*表描述 */
  tableDescription?: string;
  /*空间ID */
  spaceId: number;
}

async function addTask(data: IAddTask): Promise<RequestResponse<number>> {
  return request(`/api/compose/db/table/add`, {
    method: 'POST',
    data,
  });
}
export default { getList, collectList, collect, unCollect, addTask };
