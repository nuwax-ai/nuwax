import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { RequestResponse, TablePageRequest } from '@/types/interfaces/request';
import {
  UserProjectConversationInfo,
  UserProjectPageResult,
} from '@/types/interfaces/userProject';
import { request } from 'umi';

/** 用户项目（包括常规项目、全栈应用、网页应用）分页查询请求参数 */
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

/** 查询项目会话列表（返回所有用户在该项目的会话，附带会话所属用户名） */
export async function apiUserProjectConversations(
  projectId: number,
  projectType: AgentComponentTypeEnum,
): Promise<RequestResponse<UserProjectConversationInfo[]>> {
  return request(`/api/user-project/conversations/${projectId}`, {
    method: 'GET',
    params: {
      projectType,
    },
  });
}
