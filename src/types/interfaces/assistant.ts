/**
 * 提示词优化
 * @param {object} params OptimizeDto
 * @param {string} params.requestId 请求ID，必须传，效果不理想时用于多论对话
 * @param {string} params.prompt 提示词
 * @returns
 */

import { BindConfigWithSub } from '@/types/interfaces/common';
import { CodeLangEnum } from '../enums/plugin';

// 类型,可用值:WORKFLOW_LLM_NODE,AGENT
export enum PromptOptimizeTypeEnum {
  WORKFLOW_LLM_NODE = 'WORKFLOW_LLM_NODE',
  AGENT = 'AGENT',
}

// 优化类型: 'prompt' | 'code' | 'sql'
export enum OptimizeTypeEnum {
  prompt = 'prompt',
  code = 'code',
  sql = 'sql',
}

// 提示词优化请求参数
export interface PromptOptimizeParams {
  /*请求ID，必须传，效果不理想时用于多论对话 */
  requestId: string;
  /*提示词 */
  prompt: string;
  // 类型,可用值:WORKFLOW_LLM_NODE,AGENT
  type?: PromptOptimizeTypeEnum;
  // 智能体ID或工作流节点ID，可选
  id?: number;
}

// sql生成请求参数
export interface SqlCreateParams {
  /*请求ID，必须传，效果不理想时用于多论对话 */
  requestId: string;
  /*提示词 */
  prompt: string;
  // 数据表ID，必须传
  tableId: number;
  // 参数
  inputArgs: BindConfigWithSub;
}

// code生成请求参数
export interface CodeCreateParams {
  /*请求ID，必须传，效果不理想时用于多论对话 */
  requestId: string;
  /*提示词 */
  prompt: string;
  // 语言,可用值:Python,JavaScript
  codeLanguage: CodeLangEnum;
}

// 参数接口
// export interface PromptOptimizeParams {
//   /*请求ID，必须传，效果不理想时用于多论对话 */
//   requestId: string;

//   /*提示词 */
//   prompt: string;

//   type?: string;
//   codeLanguage?: string;

//   tableId?: number;
//   id?: number;
//   inputArgs?: InputAndOutConfig[];
// }

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
