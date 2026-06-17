import { parseLogEntry } from '@/pages/AppDev/utils/devLogParser';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

export interface GetAgentDevLogParams {
  cId: number;
  tailLines: number;
}

/** 沙盒日志接口响应（兼容多种后端字段） */
export interface GetAgentDevLogResponse {
  logs?: Array<string | (Partial<DevLogEntry> & { content?: string })>;
  content?: string;
  totalLines?: number;
}

const DEFAULT_TAIL_LINES = 1000;

/**
 * 将接口返回数据规范化为 DevLogEntry 列表
 */
export const normalizeAgentDevLogEntries = (data: unknown): DevLogEntry[] => {
  if (!data) {
    return [];
  }

  if (typeof data === 'string') {
    return data
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line, index) => parseLogEntry(line, index + 1));
  }

  const payload = data as GetAgentDevLogResponse;

  if (typeof payload.content === 'string') {
    return payload.content
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line, index) => parseLogEntry(line, index + 1));
  }

  if (!Array.isArray(payload.logs) || payload.logs.length === 0) {
    return [];
  }

  return payload.logs.map((log, index) => {
    if (typeof log === 'string') {
      return parseLogEntry(log, index + 1);
    }

    const lineNumber = log.line ?? index + 1;
    const content = log.content ?? '';
    if (!log.level || log.isError === undefined) {
      return parseLogEntry(content, lineNumber);
    }

    return {
      line: lineNumber,
      timestamp: log.timestamp,
      level: log.level,
      content,
      isError: log.isError,
      errorFingerprint: log.errorFingerprint,
    } as DevLogEntry;
  });
};

/**
 * 获取沙盒日志
 */
export async function apiGetAgentDevLog(
  params: GetAgentDevLogParams,
): Promise<RequestResponse<GetAgentDevLogResponse | string>> {
  return request('/api/computer/logs', {
    method: 'GET',
    params,
  });
}

/**
 * 拉取并解析沙盒日志
 */
export async function fetchAgentDevLogs(
  cId: number,
  tailLines: number = DEFAULT_TAIL_LINES,
): Promise<DevLogEntry[]> {
  const response = await apiGetAgentDevLog({ cId, tailLines });
  const isSuccess = response?.code === '0000' || response?.success === true;
  if (!isSuccess) {
    return [];
  }
  return normalizeAgentDevLogEntries(response.data);
}
