/**
 * AppDev API服务模块
 * 处理与后端API的通信
 */

import type {
  BuildResponse,
  CancelResponse,
  ChatRequest,
  ChatResponse,
  CreateProjectParams,
  DevServerInfo,
  GetProjectContentResponse,
  PageFileInfo,
  ProjectDetailResponse,
  SubmitFilesResponse,
  UploadAndStartProjectParams,
  UploadAndStartProjectResponse,
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
 * @returns Promise<BuildResponse> 构建结果
 */
export const buildProject = async (
  projectId: string,
): Promise<BuildResponse> => {
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
 * @returns Promise<RequestResponse<UploadAndStartProjectResponse>> 上传和启动结果
 */
export const uploadAndStartProject = async (
  params: UploadAndStartProjectParams,
): Promise<RequestResponse<UploadAndStartProjectResponse>> => {
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
 * 上传单个文件
 * @param params 参数对象，包含文件、项目ID和文件路径
 * @returns Promise<any> 上传结果
 */
export const uploadSingleFile = async (params: {
  file: File;
  projectId: string;
  filePath: string;
}): Promise<any> => {
  const { file, projectId, filePath } = params;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', projectId);
  formData.append('filePath', filePath);

  return request('/api/custom-page/upload-single-file', {
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
  projectId: string,
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
  projectId: string,
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

/**
 * 提交文件修改接口
 * @param projectId 项目ID
 * @param files 文件列表
 * @returns Promise<SubmitFilesResponse> 提交结果
 */
export const submitFilesUpdate = async (
  projectId: string,
  files: PageFileInfo[],
): Promise<SubmitFilesResponse> => {
  return request('/api/custom-page/submit-files-update', {
    method: 'POST',
    data: {
      projectId,
      files,
    },
  });
};

// ==================== AI聊天API服务 ====================

/**
 * 发送聊天消息 - 基于新的 OpenAPI 规范
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
    // 添加 user_id 字段，因为服务器可能需要这个字段来生成 session_id
    user_id: 'app-dev-user',
  };

  console.log('📤 [Service] 发送聊天请求:', requestData);

  // 使用新的 /chat 接口
  return request('/api/custom-page/ai-chat', {
    method: 'POST',
    data: requestData,
  });
};

/**
 * 取消Agent任务 - 基于新的 OpenAPI 规范
 * @param projectId 项目ID
 * @param sessionId 会话ID
 * @returns Promise<CancelResponse> 取消结果
 */
export const cancelAgentTask = async (
  projectId: string,
  sessionId: string,
): Promise<CancelResponse> => {
  return request(`/api/custom-page/ai-session-cancel`, {
    method: 'POST',
    data: {
      project_id: projectId,
      session_id: sessionId,
    },
  });
};

/**
 * 删除文件或文件夹
 * @param projectId 项目ID
 * @param filePath 文件路径
 * @returns Promise<any> 删除结果
 */
export const deleteFile = async (
  projectId: string,
  filePath: string,
): Promise<any> => {
  return request('/api/custom-page/delete-file', {
    method: 'POST',
    data: {
      projectId,
      filePath,
    },
  });
};

/**
 * 重命名文件或文件夹
 * @param projectId 项目ID
 * @param oldPath 原文件路径
 * @param newPath 新文件路径
 * @returns Promise<any> 重命名结果
 */
export const renameFile = async (
  projectId: string,
  oldPath: string,
  newPath: string,
): Promise<any> => {
  return request('/api/custom-page/rename-file', {
    method: 'POST',
    data: {
      projectId,
      oldPath,
      newPath,
    },
  });
};

/**
 * 获取项目详情信息
 * @param projectId 项目ID
 * @returns Promise<ProjectDetailResponse> 项目详情信息
 */
export const getProjectInfo = async (
  projectId: string,
): Promise<ProjectDetailResponse> => {
  return request(
    `/api/custom-page/get-project-info?projectId=${encodeURIComponent(
      projectId,
    )}`,
    {
      method: 'GET',
    },
  );
};

/**
 * 导出用户前端项目为zip文件
 * @param projectId 项目ID
 * @returns Promise<{ data: Blob; headers: any }> 导出结果，包含zip文件数据
 */
export const exportProject = async (
  projectId: string,
): Promise<{
  data: Blob;
  headers: {
    'content-disposition': string;
    'content-length': string;
    'content-type': string;
  };
}> => {
  return request(
    `/api/custom-page/export-project?projectId=${encodeURIComponent(
      projectId,
    )}`,
    {
      method: 'GET',
      responseType: 'blob', // 指定响应类型为blob
      getResponse: true, // 获取完整响应对象
    },
  );
};

// ==================== 会话管理相关API服务 ====================

/**
 * 保存会话记录接口
 * @param params 保存会话参数
 * @returns Promise<any> 保存结果
 */
export const saveConversation = async (params: {
  projectId: string;
  sessionId: string;
  content: string;
  topic: string;
  summary?: string;
}): Promise<any> => {
  console.log('📤 [API] 调用保存会话接口:', {
    url: '/api/custom-page/save-conversation',
    method: 'POST',
    params,
  });

  const result = await request('/api/custom-page/save-conversation', {
    method: 'POST',
    data: params,
  });

  console.log('📥 [API] 保存会话接口响应:', result);
  return result;
};

/**
 * 查询会话记录列表接口
 * @param params 查询参数
 * @returns Promise<any> 会话列表
 */
export const listConversations = async (params: {
  projectId: string;
  sessionId?: string;
}): Promise<any> => {
  return request('/api/custom-page/list-conversations', {
    method: 'GET',
    params,
  });
};
