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
  logFileName: string;
  logs?: Array<{
    line?: number;
    content: string;
  }>;
  message: string;
  startIndex: number;
  success: boolean;
  totalLines?: number;
}

/**
 * 将日志内容按纯文本解析为 DevLogEntry
 * 当前接口返回的 logs[].content 是普通文本，不需要再 JSON.parse。
 */
const parseContentToEntry = (
  rawContent: string,
  lineNumber: number,
): DevLogEntry => {
  return parseLogEntry(rawContent ?? '', lineNumber);
};

/**
 * 将接口返回数据规范化为 DevLogEntry 列表
 */
export const normalizeAgentDevLogEntries = (
  data: GetAgentDevLogResponse | string,
): DevLogEntry[] => {
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

  if (!Array.isArray(payload.logs) || payload.logs.length === 0) {
    return [];
  }

  return payload.logs.map((log, index) => {
    if (typeof log === 'string') {
      return parseContentToEntry(log, index + 1);
    }

    const lineNumber = log.line ?? index + 1;
    const content = log.content ?? '';
    return parseContentToEntry(content, lineNumber);
  });
};

/**
 * 获取沙盒日志
 */
export async function apiGetAgentDevLog(
  params: GetAgentDevLogParams,
): Promise<RequestResponse<GetAgentDevLogResponse>> {
  return request('/api/computer/logs', {
    method: 'GET',
    params,
  });
}

/**
 * 安装项目依赖参数接口
 */
export interface InstallProjectParams {
  /*用户ID */
  userId?: number;

  /*编程语言,可用值:typescript,python */
  programmingLanguage: string;

  /*会话ID */
  cId: number;
}

/**
 * 安装项目依赖
 */
export async function apiInstallAgentProjectDependencies(
  data: InstallProjectParams,
): Promise<RequestResponse<null>> {
  return request('/api/agent/workspace/install-project', {
    method: 'POST',
    data,
  });
}
