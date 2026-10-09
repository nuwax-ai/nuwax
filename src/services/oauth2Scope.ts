import type {
  OAuth2ScopeApplyInfo,
  OAuth2ScopeApplyPageParams,
  OAuth2ScopeInfo,
} from '@/types/interfaces/oauth2Scope';
import type { Page, RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 平台支持的 OAuth2 scope 全集（开发者设置页勾选）
export async function apiOAuth2ScopeList(): Promise<
  RequestResponse<OAuth2ScopeInfo[]>
> {
  return request('/api/user-project/oauth2/scopes', {
    method: 'GET',
  });
}

// 管理员：分页查询 scope 变更申请
export async function apiOAuth2ScopeApplyPage(
  data: OAuth2ScopeApplyPageParams,
): Promise<RequestResponse<Page<OAuth2ScopeApplyInfo>>> {
  return request('/api/system/oauth2/page-query', {
    method: 'POST',
    data,
  });
}

// 管理员：审核通过（目标 scope 写回生效）
export async function apiOAuth2ScopeApprove(
  applyId: number,
): Promise<RequestResponse<null>> {
  return request(`/api/system/oauth2/approve/${applyId}`, {
    method: 'POST',
  });
}

// 管理员：审核拒绝（原因回传给申请人）
export async function apiOAuth2ScopeReject(
  applyId: number,
  reason: string,
): Promise<RequestResponse<null>> {
  return request(`/api/system/oauth2/reject/${applyId}`, {
    method: 'POST',
    data: { reason },
  });
}
