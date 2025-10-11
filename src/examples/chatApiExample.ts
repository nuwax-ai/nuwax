/**
 * 新 AI 聊天接口使用示例
 * 基于 OpenAPI 规范的完整示例
 */

import { sendChatMessage } from '@/services/appDev';
import type {
  ChatRequest,
  ModelProviderConfig,
} from '@/types/interfaces/appDev';
import {
  createDocumentAttachment,
  createImageAttachment,
  createTextAttachment,
  formatDataSourceAttachments,
  generateAttachmentId,
} from '@/utils/chatUtils';

/**
 * 基础聊天示例
 */
export const basicChatExample = async () => {
  const chatRequest: ChatRequest = {
    prompt: '帮我写一个 React 组件',
    project_id: 'my-project-123',
    session_id: 'session-456',
    request_id: 'req-789',
  };

  try {
    const response = await sendChatMessage(chatRequest);
    console.log('聊天响应:', response);
  } catch (error) {
    console.error('聊天失败:', error);
  }
};

/**
 * 带附件的聊天示例
 */
export const chatWithAttachmentsExample = async () => {
  // 创建文本附件
  const textAttachment = createTextAttachment(
    generateAttachmentId('text'),
    '这是一个代码文件的内容',
    'example.txt',
    '示例文本文件',
  );

  // 创建图像附件
  const imageAttachment = createImageAttachment(
    generateAttachmentId('img'),
    '/path/to/image.png',
    'image/png',
    'screenshot.png',
    '界面截图',
    { width: 1920, height: 1080 },
  );

  const chatRequest: ChatRequest = {
    prompt: '请分析这个代码文件并优化界面设计',
    project_id: 'my-project-123',
    attachments: [textAttachment, imageAttachment],
  };

  try {
    const response = await sendChatMessage(chatRequest);
    console.log('带附件的聊天响应:', response);
  } catch (error) {
    console.error('带附件的聊天失败:', error);
  }
};

/**
 * 带数据源附件的聊天示例
 */
export const chatWithDataSourceExample = async () => {
  // 准备数据源
  const dataSources = [
    {
      type: 'api',
      url: 'https://api.example.com/users',
      method: 'GET',
      description: '用户列表 API',
    },
    {
      type: 'database',
      table: 'users',
      schema: 'public',
      description: '用户表结构',
    },
  ];

  const chatRequest: ChatRequest = {
    prompt: '基于这些数据源创建一个用户管理页面',
    project_id: 'my-project-123',
    data_source_attachments: formatDataSourceAttachments(dataSources),
  };

  try {
    const response = await sendChatMessage(chatRequest);
    console.log('带数据源的聊天响应:', response);
  } catch (error) {
    console.error('带数据源的聊天失败:', error);
  }
};

/**
 * 自定义模型提供商的聊天示例
 */
export const chatWithCustomModelExample = async () => {
  const modelProvider: ModelProviderConfig = {
    id: 'custom-openai',
    name: 'openai',
    api_key: 'sk-...',
    base_url: 'https://api.openai.com/v1',
    default_model: 'gpt-4',
    api_protocol: 'openai',
    requires_openai_auth: true,
  };

  const chatRequest: ChatRequest = {
    prompt: '使用自定义模型生成代码',
    project_id: 'my-project-123',
    model_provider: modelProvider,
  };

  try {
    const response = await sendChatMessage(chatRequest);
    console.log('自定义模型聊天响应:', response);
  } catch (error) {
    console.error('自定义模型聊天失败:', error);
  }
};

/**
 * 完整的聊天示例（包含所有功能）
 */
export const fullChatExample = async () => {
  // 创建多种类型的附件
  const attachments = [
    createTextAttachment(
      generateAttachmentId('code'),
      'function hello() { console.log("Hello World"); }',
      'hello.js',
      'JavaScript 代码文件',
    ),
    createImageAttachment(
      generateAttachmentId('ui'),
      '/path/to/ui-mockup.png',
      'image/png',
      'ui-mockup.png',
      'UI 设计稿',
    ),
    createDocumentAttachment(
      generateAttachmentId('spec'),
      '/path/to/requirements.pdf',
      'application/pdf',
      'requirements.pdf',
      '需求文档',
    ),
  ];

  // 准备数据源
  const dataSources = [
    {
      type: 'api',
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: { Authorization: 'Bearer token' },
      description: '外部数据 API',
    },
  ];

  // 自定义模型配置
  const modelProvider: ModelProviderConfig = {
    id: 'claude-3',
    name: 'anthropic',
    api_key: 'sk-ant-...',
    base_url: 'https://api.anthropic.com',
    default_model: 'claude-3-sonnet-20240229',
    api_protocol: 'anthropic',
    requires_openai_auth: false,
  };

  console.log('📝 [Example] 模型提供商配置:', modelProvider);

  const chatRequest: ChatRequest = {
    prompt: '基于提供的代码、设计稿和需求文档，创建一个完整的 React 应用',
    project_id: 'full-feature-project',
    session_id: 'session-full-123',
    request_id: 'req-full-456',
    attachments,
    data_source_attachments: formatDataSourceAttachments(dataSources),
    model_provider,
  };

  try {
    console.log('发送完整聊天请求:', chatRequest);
    const response = await sendChatMessage(chatRequest);
    console.log('完整聊天响应:', response);

    if (response.success && response.data) {
      console.log('项目ID:', response.data.project_id);
      console.log('会话ID:', response.data.session_id);

      // 这里可以建立 SSE 连接来接收实时更新
      // const sseManager = createSSEManager({
      //   baseUrl: 'http://localhost:3000',
      //   sessionId: response.data.session_id,
      //   onMessage: handleSSEMessage,
      // });
      // sseManager.connect();
    }
  } catch (error) {
    console.error('完整聊天失败:', error);
  }
};
