import { NodeConfig } from '@/types/interfaces/node';
import customRequest from '@/utils/customRequest';
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
  Database: '/api/workflow/node/update',
  LLM: '/api/workflow/node/llm/update',
  Plugin: '/api/workflow/node/plugin/update',
  Variable: '/api/workflow/node/variable/update',
  KnowledgeBase: '/api/workflow/node/knowledge/update',
  HTTPRequest: '/api/workflow/node/http/update',
  QA: '/api/workflow/node/qa/update',
  Code: '/api/workflow/node/code/update',
  IntentRecognition: '/api/workflow/node/intent/update',
  Loop: '/api/workflow/node/loop/update',
  Start: '/api/workflow/node/start/update',
  End: '/api/workflow/node/end/update',
  DocumentExtraction: '/api/workflow/node/update',
  Output: '/api/workflow/node/output/update',
  Workflow: '/api/workflow/node/update',
  LongTermMemory: '/api/workflow/node/update',
  Condition: '/api/workflow/node/condition/update',
  TextProcessing: '/api/workflow/node/text/update',
};
// 根据接单的type 来更新节点
const modifyNode = async (
  params: IUpdateLLMNode,
  type: keyof typeof urlList,
) => {
  // 发送GET请求，使用相对路径
  return customRequest({
    url: urlList[type],
    method: 'POST',
    data: params,
  })
    .then((response) => {
      return response;
    })
    .catch((error) => {
      console.error('Failed to get modellist:', error);
    });
};

export default {
  modifyNode,
};
