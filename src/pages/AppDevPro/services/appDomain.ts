import { request } from "umi";
import { RequestResponse } from "@/types/interfaces/request";

// 查询应用绑定的域名列表
export async function apiUserAppDomainList(
  appId: number,
): Promise<RequestResponse<any>> {
  return request('/api/userapp/domain/list', {
    method: 'GET',
    params: {
      appId,
    },
  });
}