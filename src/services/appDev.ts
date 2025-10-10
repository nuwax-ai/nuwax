/**
 * AppDev API服务模块
 * 处理与后端API的通信
 */

import type {
  CancelResponse,
  ChatRequest,
  ChatResponse,
  CreateProjectParams,
  DevServerInfo,
  GetProjectContentResponse,
  PageFileInfo,
  StopAgentResponse,
  SubmitFilesResponse,
  UploadAndStartProjectParams,
} from '@/types/interfaces/appDev';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';

/**
 * 启动开发环境接口
 * @param projectId 项目ID
 * @returns Promise<RequestResponse<DevServerInfo>> 接口响应
 */
export const startDev = async (
  projectId: string,
): Promise<RequestResponse<DevServerInfo>> => {
  return request('/api/custom-page/start-dev', {
    method: 'POST',
    data: {
      projectId: projectId,
    },
  });
};

/**
 * 检查开发环境状态
 * @param projectId 项目ID
 * @returns Promise<any> 状态信息
 */
export const checkDevStatus = async (projectId: string): Promise<any> => {
  return request(
    `/api/custom-page/dev-status?projectId=${encodeURIComponent(projectId)}`,
    {
      method: 'GET',
    },
  );
};

/**
 * 停止开发环境
 * @param projectId 项目ID
 * @returns Promise<any> 停止结果
 */
export const stopDev = async (projectId: string): Promise<any> => {
  return request('/api/custom-page/stop-dev', {
    method: 'POST',
    data: {
      projectId: projectId,
    },
  });
};

/**
 * 重启前端开发服务器
 * @param projectId 项目ID
 * @returns Promise<any> 重启结果
 */
export const restartDev = async (projectId: string): Promise<any> => {
  return request('/api/custom-page/restart-dev', {
    method: 'POST',
    data: {
      projectId: projectId,
    },
  });
};

/**
 * 构建并发布前端项目
 * @param projectId 项目ID
 * @returns Promise<any> 构建结果
 */
export const buildProject = async (projectId: string): Promise<any> => {
  return request('/api/custom-page/build', {
    method: 'POST',
    data: {
      projectId: projectId,
    },
  });
};

/**
 * 创建用户前端页面项目
 * @param projectData 项目数据
 * @returns Promise<any> 创建结果
 */
export const createProject = async (
  projectData: CreateProjectParams,
): Promise<any> => {
  return request('/api/custom-page/create', {
    method: 'POST',
    data: projectData,
  });
};

/**
 * 上传前端项目压缩包并启动开发服务器
 * @param params 参数对象，包含文件和项目名称
 * @returns Promise<any> 上传和启动结果
 */
export const uploadAndStartProject = async (
  params: UploadAndStartProjectParams,
): Promise<any> => {
  const { file, projectName } = params;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectName', projectName);

  return request('/api/custom-page/upload-and-start', {
    method: 'POST',
    data: formData,
  });
};

/**
 * 获取项目内容（文件树）- 根据OpenAPI规范实现
 * @param projectId 项目ID
 * @returns Promise<GetProjectContentResponse> 项目文件树数据
 */
export const getProjectContent = async (
  projectId: number | string,
): Promise<GetProjectContentResponse> => {
  return request(
    `/api/custom-page/get-project-content?projectId=${encodeURIComponent(
      projectId.toString(),
    )}`,
    {
      method: 'GET',
    },
  );
};

/**
 * 获取文件内容
 * @param projectId 项目ID
 * @param filePath 文件路径
 * @returns Promise<string> 文件内容
 */
export const getFileContent = async (
  projectId: string,
  filePath: string,
): Promise<string> => {
  return request('/api/custom-page/file-content', {
    method: 'POST',
    data: {
      projectId,
      filePath,
    },
  });
};

/**
 * 开发服务器保活接口
 * @param projectId 项目ID
 * @returns Promise<any> 保活结果
 */
export const keepAlive = async (projectId: string): Promise<any> => {
  return request('/api/custom-page/keepalive', {
    method: 'POST',
    data: {
      projectId,
    },
  });
};

/**
 * 提交项目修改接口
 * @param projectId 项目ID
 * @param files 文件列表
 * @returns Promise<SubmitFilesResponse> 提交结果
 */
export const submitFiles = async (
  projectId: number,
  files: PageFileInfo[],
): Promise<SubmitFilesResponse> => {
  return request('/api/custom-page/submit-files', {
    method: 'POST',
    data: {
      projectId,
      files,
    },
  });
};

// ==================== AI聊天API服务 ====================

/**
 * 发送聊天消息
 * @param chatRequest 聊天请求参数
 * @returns Promise<ChatResponse> 聊天响应
 */
export const sendChatMessage = async (
  chatRequest: ChatRequest,
): Promise<ChatResponse> => {
  // 生成请求ID（如果未提供）
  const requestData = {
    ...chatRequest,
    request_id:
      chatRequest.request_id ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };

  return request('/api/chat', {
    method: 'POST',
    data: requestData,
  });
};

/**
 * 取消Agent任务
 * @param projectId 项目ID
 * @param sessionId 会话ID
 * @returns Promise<CancelResponse> 取消结果
 */
export const cancelAgentTask = async (
  projectId: string,
  sessionId: string,
): Promise<CancelResponse> => {
  return request(
    `/api/agent/session/cancel?project_id=${encodeURIComponent(
      projectId,
    )}&session_id=${encodeURIComponent(sessionId)}`,
    {
      method: 'POST',
    },
  );
};

/**
 * 停止Agent服务
 * @param projectId 项目ID
 * @returns Promise<StopAgentResponse> 停止结果
 */
export const stopAgentService = async (
  projectId: string,
): Promise<StopAgentResponse> => {
  return request(
    `/api/agent/stop?project_id=${encodeURIComponent(projectId)}`,
    {
      method: 'POST',
    },
  );
};
