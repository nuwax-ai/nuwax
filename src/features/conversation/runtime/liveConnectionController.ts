import {
  createConnectionRunController,
  type AbortConnection,
  type ConnectionRunController,
  type ConnectionRunId,
} from './connectionRunController';

export type LiveRunId = ConnectionRunId;
export type AbortLiveConnection = AbortConnection;
export type LiveConnectionController = ConnectionRunController;

/** live 流的语义化 Adapter；所有权规则由通用 ConnectionRunController 提供。 */
export const createLiveConnectionController = (): LiveConnectionController =>
  createConnectionRunController('live');
