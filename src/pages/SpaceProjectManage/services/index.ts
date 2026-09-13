import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { RequestResponse, TablePageRequest } from '@/types/interfaces/request';
import { UserProjectPageResult } from '@/types/interfaces/userProject';
import { request } from 'umi';

/** 应用域名类型 */
export enum UserAppDomainTypeEnum {
  Dev = 'Dev',
  Prod = 'Prod',
  Custom = 'Custom',
}

/** 应用绑定的域名 */
export interface UserAppDomainInfo {
  id: number;
  tenantId: number;
  appId: number;
  domain: string;
  domainType: UserAppDomainTypeEnum;
  created: string;
  modified: string;
}

/** 查询应用绑定的域名列表 */
export async function apiUserAppDomainList(
  appId: number,
): Promise<RequestResponse<UserAppDomainInfo[]>> {
  return request('/api/userapp/domain/list', {
    method: 'GET',
    params: { appId },
  });
}

/** 绑定自有域名 */
export async function apiUserAppDomainCreate(data: {
  appId: number;
  domain: string;
}): Promise<RequestResponse<UserAppDomainInfo>> {
  return request('/api/userapp/domain/create', {
    method: 'POST',
    data,
  });
}

/** 解绑域名 */
export async function apiUserAppDomainDelete(
  id: number,
): Promise<RequestResponse<null>> {
  return request('/api/userapp/domain/delete', {
    method: 'POST',
    data: { id },
  });
}

/** 用户项目（包括常规项目、全栈应用、网页应用）分页查询 */
export type UserProjectPageQueryParams = TablePageRequest<
  Partial<{
    spaceId: number;
    creatorId: number;
    // 项目类型：NormalProject/UserApp/PageApp,可用值:Agent,Plugin,Skill,PageApp,UserApp,NormalProject,Workflow,Knowledge,Table,Model,Mcp
    projectType: AgentComponentTypeEnum;
    // 项目名称（模糊匹配）
    name: string;
  }>
>;

/** 用户项目（包括常规项目、全栈应用、网页应用）分页查询 */
export async function apiUserProjectPageQuery(
  data: UserProjectPageQueryParams,
): Promise<RequestResponse<UserProjectPageResult>> {
  return request('/api/user-project/page-query', {
    method: 'POST',
    data,
  });
}
