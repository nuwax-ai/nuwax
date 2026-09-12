/**
 * 资料库（空间文档仓库 Repo）服务
 */
import type {
  RepoPageSearchItem,
  RepoPageTreeNode,
  RepoRecentlyAccessedItem,
} from '@/types/interfaces/repo';
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

/**
 * 资料库全库搜索（GET /api/repo/search）
 *
 * - ES 关键字搜索；不传 spaceId 即跨全部空间
 * - 分页参数为 from（偏移量）+ size
 */
export async function apiRepoSearch(params: {
  spaceId?: number;
  keyword: string;
  from: number;
  size: number;
}): Promise<RequestResponse<RepoPageSearchItem[]>> {
  return request('/api/repo/search', {
    method: 'GET',
    params,
  });
}

/**
 * 资料库最近访问列表（GET /api/repo/pages/recently-accessed）
 *
 * - 门户「最近访问」数据源，from（偏移量）+ size 分页
 */
export async function apiRepoRecentlyAccessed(
  from: number,
  size: number,
): Promise<RequestResponse<RepoRecentlyAccessedItem[]>> {
  return request('/api/repo/pages/recently-accessed', {
    method: 'GET',
    params: { from, size },
  });
}
