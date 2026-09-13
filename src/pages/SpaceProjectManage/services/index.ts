import { request } from "umi";
import { AgentComponentTypeEnum } from "@/types/enums/agent";
import { RequestResponse, TablePageRequest } from "@/types/interfaces/request";
import { UserProjectPageResult } from "@/types/interfaces/userProject";

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
