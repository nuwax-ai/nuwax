import { AvailableAgentsQuery, Exact, GenerateCopilotResponseInput, GenerateCopilotResponseMutation, GenerateCopilotResponseMutationVariables, InputMaybe, LoadAgentStateQuery, Scalars } from "../graphql/@generated/graphql.mjs";
import { Client } from "@urql/core";
import * as urql from "urql";
import { OperationResult, OperationResultSource } from "urql";

//#region src/client/CopilotRuntimeClient.d.ts
interface CopilotRuntimeClientOptions {
  url: string;
  publicApiKey?: string;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  handleGQLErrors?: (error: Error) => void;
  handleGQLWarning?: (warning: string) => void;
}
declare class CopilotRuntimeClient {
  client: Client;
  handleGQLErrors?: (error: Error) => void;
  handleGQLWarning?: (warning: string) => void;
  constructor(options: CopilotRuntimeClientOptions);
  generateCopilotResponse({
    data,
    properties,
    signal
  }: {
    data: GenerateCopilotResponseMutationVariables["data"];
    properties?: GenerateCopilotResponseMutationVariables["properties"];
    signal?: AbortSignal;
  }): OperationResultSource<OperationResult<GenerateCopilotResponseMutation, Exact<{
    data: GenerateCopilotResponseInput;
    properties?: InputMaybe<Scalars["JSONObject"]["input"]>;
  }>>>;
  asStream<S, T>(source: OperationResultSource<OperationResult<S, {
    data: T;
  }>>): ReadableStream<S>;
  availableAgents(): OperationResultSource<OperationResult<AvailableAgentsQuery, urql.AnyVariables>>;
  loadAgentState(data: {
    threadId: string;
    agentName: string;
  }): OperationResultSource<OperationResult<LoadAgentStateQuery, urql.AnyVariables>>;
  static removeGraphQLTypename(data: any): any;
}
//#endregion
export { CopilotRuntimeClient, CopilotRuntimeClientOptions };
//# sourceMappingURL=CopilotRuntimeClient.d.mts.map