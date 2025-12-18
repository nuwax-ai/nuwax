import type {
  CreateTimedConversationTaskDto,
  TaskCronInfo,
  TimedConversationTaskInfo,
  TimedConversationTaskParams,
} from '@/types/interfaces/agentTask';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

// 创建定时会话
export function apiAgentTaskCreate(
  data: CreateTimedConversationTaskDto,
): Promise<RequestResponse<TimedConversationTaskInfo>> {
  return request('/api/agent/task/create', {
    method: 'POST',
    data,
  });
}

// 更新定时会话
export function apiAgentTaskUpdate(
  data: CreateTimedConversationTaskDto,
): Promise<RequestResponse<TimedConversationTaskInfo>> {
  return request('/api/agent/task/update', {
    method: 'POST',
    data,
  });
}

// 查询用户定时会话列表
export function apiAgentTaskList(
  data: TimedConversationTaskParams,
): Promise<RequestResponse<TimedConversationTaskInfo[]>> {
  return request('/api/agent/task/list', {
    method: 'POST',
    data,
  });
}

// 取消定时会话
export function apiAgentTaskCancel(
  conversationId: number,
): Promise<RequestResponse<TimedConversationTaskInfo>> {
  return request(`/api/agent/task/cancel/${conversationId}`, {
    method: 'POST',
  });
}

// 可选定时范围
export function apiAgentTaskCronList(): Promise<
  RequestResponse<TaskCronInfo[]>
> {
  return request('/api/agent/task/cron/list', {
    method: 'GET',
  });
}

// 可选定时范围 - 任务
export function apiTaskCronList(): Promise<RequestResponse<TaskCronInfo[]>> {
  return request(`/api/task/cron/list`, {
    method: 'GET',
  });
}
