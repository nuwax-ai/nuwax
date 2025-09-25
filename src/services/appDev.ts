/**
 * AppDev API服务模块
 * 处理与后端API的通信
 */

// API基础配置 - 使用后端提供的临时地址
const API_BASE_URL = 'http://192.168.31.125:8081';

/**
 * 自定义request函数，绕过UmiJS的request拦截器
 * 直接使用fetch进行API调用
 */
const customRequest = async (url: string, options: any = {}) => {
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    body: options.data ? JSON.stringify(options.data) : options.body,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * 启动开发环境接口
 * @param projectId 项目ID
 * @returns Promise<any> 接口响应
 */
export const startDev = async (projectId: string): Promise<any> => {
  try {
    console.log('🚀 [AppDev API] 正在启动开发环境，项目ID:', projectId);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/start-dev`,
      {
        method: 'POST',
        data: {
          projectId: projectId,
        },
      },
    );

    console.log('✅ [AppDev API] 开发环境启动成功:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 启动开发环境失败:', error);
    throw error;
  }
};

/**
 * 检查开发环境状态
 * @param projectId 项目ID
 * @returns Promise<any> 状态信息
 */
export const checkDevStatus = async (projectId: string): Promise<any> => {
  try {
    console.log('🔍 [AppDev API] 检查开发环境状态，项目ID:', projectId);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/dev-status?projectId=${encodeURIComponent(
        projectId,
      )}`,
      {
        method: 'GET',
      },
    );

    console.log('✅ [AppDev API] 开发环境状态:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 检查开发环境状态失败:', error);
    throw error;
  }
};

/**
 * 停止开发环境
 * @param projectId 项目ID
 * @returns Promise<any> 停止结果
 */
export const stopDev = async (projectId: string): Promise<any> => {
  try {
    console.log('🛑 [AppDev API] 停止开发环境，项目ID:', projectId);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/stop-dev`,
      {
        method: 'POST',
        data: {
          projectId: projectId,
        },
      },
    );

    console.log('✅ [AppDev API] 开发环境已停止:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 停止开发环境失败:', error);
    throw error;
  }
};

/**
 * 重启前端开发服务器
 * @param projectId 项目ID
 * @returns Promise<any> 重启结果
 */
export const restartDev = async (projectId: string): Promise<any> => {
  try {
    console.log('🔄 [AppDev API] 重启前端开发服务器，项目ID:', projectId);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/restart-dev`,
      {
        method: 'POST',
        data: {
          projectId: projectId,
        },
      },
    );

    console.log('✅ [AppDev API] 前端开发服务器重启成功:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 重启前端开发服务器失败:', error);
    throw error;
  }
};

/**
 * 构建并发布前端项目
 * @param projectId 项目ID
 * @returns Promise<any> 构建结果
 */
export const buildProject = async (projectId: string): Promise<any> => {
  try {
    console.log('🏗️ [AppDev API] 构建并发布前端项目，项目ID:', projectId);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/build`,
      {
        method: 'POST',
        data: {
          projectId: projectId,
        },
      },
    );

    console.log('✅ [AppDev API] 前端项目构建成功:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 构建前端项目失败:', error);
    throw error;
  }
};

/**
 * 创建用户前端页面项目
 * @param projectData 项目数据
 * @returns Promise<any> 创建结果
 */
export const createProject = async (projectData: {
  name: string;
  description?: string;
  template?: string;
  framework?: string;
}): Promise<any> => {
  try {
    console.log('📁 [AppDev API] 创建用户前端页面项目:', projectData);

    const response = await customRequest(
      `${API_BASE_URL}/api/custom-page/create`,
      {
        method: 'POST',
        data: projectData,
      },
    );

    console.log('✅ [AppDev API] 前端页面项目创建成功:', response);
    return response;
  } catch (error) {
    console.error('❌ [AppDev API] 创建前端页面项目失败:', error);
    throw error;
  }
};

/**
 * 上传前端项目压缩包并启动开发服务器
 * @param file 项目压缩包文件
 * @param projectName 项目名称
 * @returns Promise<any> 上传和启动结果
 */
export const uploadAndStartProject = async (
  file: File,
  projectName: string,
): Promise<any> => {
  try {
    console.log('📤 [AppDev API] 上传前端项目压缩包并启动开发服务器:', {
      fileName: file.name,
      projectName,
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectName', projectName);

    const response = await fetch(
      `${API_BASE_URL}/api/custom-page/upload-and-start`,
      {
        method: 'POST',
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [AppDev API] 项目上传并启动成功:', result);
    return result;
  } catch (error) {
    console.error('❌ [AppDev API] 上传项目并启动失败:', error);
    throw error;
  }
};
