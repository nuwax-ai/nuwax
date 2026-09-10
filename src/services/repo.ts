/**
 * 资料库（空间文档仓库 Repo）服务
 */
import type { RepoPageTreeNode } from '@/types/interfaces/repo';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/**
 * 查询空间完整页面树（GET /api/repo/spaces/{spaceId}/tree）
 *
 * - 返回当前空间资料库的完整页面树（目录与页面同构，节点 children 递归）
 * - 无分页/关键字参数：全量返回，调用方按需平铺与内存筛选
 */
export async function apiRepoSpaceTree(
  spaceId: number,
): Promise<RequestResponse<RepoPageTreeNode[]>> {
  return request(`/api/repo/spaces/${spaceId}/tree`, {
    method: 'GET',
  });
}
