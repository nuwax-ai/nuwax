import {
  createConnectionRunController,
  type AbortConnection,
  type ConnectionRunController,
  type ConnectionRunId,
} from './connectionRunController';

export type ResumeRunId = ConnectionRunId;
export type AbortResumeConnection = AbortConnection;
export type ResumeConnectionController = ConnectionRunController;

/** sub 恢复流的语义化 Adapter；所有权规则由通用 ConnectionRunController 提供。 */
export const createResumeConnectionController =
  (): ResumeConnectionController => createConnectionRunController('resume');
