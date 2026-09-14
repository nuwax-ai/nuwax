import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/** 会话框智能体级配置（+ 号弹层内的三个开关） */
export interface ChatboxConfigValue {
  /** 审批模式：yolo 自动 / ask 审批 */
  mode: 'yolo' | 'ask';
  /** 产物版本管理：1 开 / 0 关（未配置过时以 agent 的 enableVersionControl 为默认值） */
  enableVersionControl: number;
  /** 变更自动提交：1 开 / 0 关（未配置过时默认 1） */
  autoCommit: number;
}

/** 组装会话框配置的存储 key：chatbox.config.{agentId} */
export function chatboxConfigKey(agentId: number | string): string {
  return `chatbox.config.${agentId}`;
}

/** 写入用户级配置（偏好类接口，失败静默不弹全局错误提示） */
export async function apiUserConfigSet(data: {
  key: string;
  value: ChatboxConfigValue;
}): Promise<RequestResponse<null>> {
  return request('/api/user/config/set', {
    method: 'POST',
    data,
    skipErrorHandler: true,
  });
}

/** 读取用户级配置（未配置过时 data 为 null，失败静默） */
export async function apiUserConfigGet(
  key: string,
): Promise<RequestResponse<ChatboxConfigValue | null>> {
  return request('/api/user/config/get', {
    method: 'GET',
    params: { key },
    skipErrorHandler: true,
  });
}
