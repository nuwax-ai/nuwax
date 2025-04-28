/**
 * 提示词优化
 * @param {object} params OptimizeDto
 * @param {string} params.requestId 请求ID，必须传，效果不理想时用于多论对话
 * @param {string} params.prompt 提示词
 * @returns
 */

// 参数接口
export interface PromptOptimizeParams {
  /*请求ID，必须传，效果不理想时用于多论对话 */
  requestId: string;

  /*提示词 */
  prompt: string;

  codeLanguage?: string;

  tableId?: number;
}

// 响应接口
export interface PromptOptimizeRes {
  /* */
  id: string;

  /*assistant 模型回复；user 用户消息,可用值:USER,ASSISTANT,SYSTEM,FUNCTION */
  role: string;

  /*可用值:CHAT,THINK,QUESTION,ANSWER */
  type: string;

  /*消息内容 */
  text: string;

  /*消息时间 */
  time: Record<string, unknown>;

  /*消息附件 */
  attachments: {
    /* */
    fileKey: string;

    /*文件URL */
    fileUrl: string;

    /* */
    fileName: string;

    /*文件类型 */
    mimeType: string;
  }[];

  /*思考内容 */
  think: string;

  /* */
  ext: Record<string, unknown>;

  /* */
  finished: boolean;

  /* */
  metadata: Record<string, unknown>;

  /*可用值:USER,ASSISTANT,SYSTEM,TOOL */
  messageType: string;
}
