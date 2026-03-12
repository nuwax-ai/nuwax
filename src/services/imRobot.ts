import type {
  AddIMRobotParams,
  IMRobotInfo,
  UpdateIMRobotParams,
} from '@/types/interfaces/imRobot';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/**
 * 添加 IM 机器人
 */
export async function apiAddIMRobot(
  data: AddIMRobotParams,
): Promise<RequestResponse<null>> {
  return request('/api/im-robot/add', {
    method: 'POST',
    data,
  });
}

/**
 * 更新 IM 机器人
 */
export async function apiUpdateIMRobot(
  data: UpdateIMRobotParams,
): Promise<RequestResponse<null>> {
  return request('/api/im-robot/update', {
    method: 'POST',
    data,
  });
}

/**
 * 删除 IM 机器人
 */
export async function apiDeleteIMRobot(
  id: number,
): Promise<RequestResponse<null>> {
  return request(`/api/im-robot/delete/${id}`, {
    method: 'POST',
  });
}

/**
 * 查询 IM 机器人列表
 */
export async function apiIMRobotList(
  spaceId: number,
): Promise<RequestResponse<IMRobotInfo[]>> {
  return request(`/api/im-robot/list/${spaceId}`, {
    method: 'GET',
  });
}

/**
 * 启用/停用 IM 机器人
 */
export async function apiIMRobotToggleStatus(
  id: number,
  status: number,
): Promise<RequestResponse<null>> {
  return request(`/api/im-robot/status/${id}/${status}`, {
    method: 'POST',
  });
}
