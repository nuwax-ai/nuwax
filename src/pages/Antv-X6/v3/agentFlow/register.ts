/**
 * AgentFlow 分支处理器注册入口
 *
 * 在 AgentFlow 页面入口调用，将 EvalGate / HumanInteraction
 * 的分支处理逻辑注册到扩展注册表。
 */

import { extensionRegistry } from '../extensions/registry';
import { evalGateHandler } from './handlers/evalGate';
import { humanInteractionHandler } from './handlers/humanInteraction';

let registered = false;

export function registerAgentFlowHandlers(): void {
  if (registered) return;
  extensionRegistry.register(evalGateHandler);
  extensionRegistry.register(humanInteractionHandler);
  registered = true;
}
