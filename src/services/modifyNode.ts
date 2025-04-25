import { NodeConfig } from '@/types/interfaces/node';
import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
interface IUpdateLLMNode {
  nodeId: number | string;
  name: string;
  description: string;
  nodeConfig: NodeConfig;
  innerStartNodeId?: number | null;
  innerEndNodeId?: number | null;
}

// 各个节点不同的路径
const urlList = {
  // Database: '/api/workflow/node/update',
  Knowledge: '/api/workflow/node/knowledge/update',
  HTTPRequest: '/api/workflow/node/http/update',
  QA: '/api/workflow/node/qa/update',
  Code: '/api/workflow/node/code/update',
  Plugin: '/api/workflow/node/plugin/update',
  IntentRecognition: '/api/workflow/node/intent/update',
  LLM: '/api/workflow/node/llm/update',
  Variable: '/api/workflow/node/variable/update',
  LoopBreak: '/api/workflow/node/loop/update',
  LoopContinue: '/api/workflow/node/loop/update',
  Loop: '/api/workflow/node/loop/update',
  Start: '/api/workflow/node/update',
  End: '/api/workflow/node/end/update',
  DocumentExtraction: '/api/workflow/node/update',
  Output: '/api/workflow/node/output/update',
  Workflow: '/api/workflow/node/workflow/update',
  LongTermMemory: '/api/workflow/node/update',
  Condition: '/api/workflow/node/condition/update',
  TextProcessing: '/api/workflow/node/text/update',
  TableDataAdd: '/api/workflow/node/tableDataAdd/update',
  TableDataUpdate: '/api/workflow/node/tableDataUpdate/update',
  TableDataDelete: '/api/workflow/node/tableDataDelete/update',
  TableDataQuery: '/api/workflow/node/tableDataQuery/update',
  TableSQL: '/api/workflow/node/tableCustomSql/update',
};
// 更新节点信息
export async function modifyNode(
  params: IUpdateLLMNode,
  type: keyof typeof urlList,
): Promise<RequestResponse<any>> {
  return request(`${urlList[type]}`, {
    method: 'POST',
    data: params,
  });
}

export default {
  modifyNode,
};
