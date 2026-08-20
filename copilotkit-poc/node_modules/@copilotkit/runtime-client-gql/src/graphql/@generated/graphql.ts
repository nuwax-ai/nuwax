/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: any; output: any; }
};

export type ActionExecutionMessageInput = {
  arguments: Scalars['String']['input'];
  name: Scalars['String']['input'];
  parentMessageId?: InputMaybe<Scalars['String']['input']>;
  /** @deprecated This field will be removed in a future version */
  scope?: InputMaybe<Scalars['String']['input']>;
};

export type ActionExecutionMessageOutput = BaseMessageOutput & {
  __typename?: 'ActionExecutionMessageOutput';
  arguments: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  parentMessageId?: Maybe<Scalars['String']['output']>;
  /** @deprecated This field will be removed in a future version */
  scope?: Maybe<Scalars['String']['output']>;
  status: MessageStatus;
};

export type ActionInput = {
  available?: InputMaybe<ActionInputAvailability>;
  description: Scalars['String']['input'];
  jsonSchema: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

/** The availability of the frontend action */
export enum ActionInputAvailability {
  Disabled = 'disabled',
  Enabled = 'enabled',
  Remote = 'remote'
}

export type Agent = {
  __typename?: 'Agent';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type AgentSessionInput = {
  agentName: Scalars['String']['input'];
  nodeName?: InputMaybe<Scalars['String']['input']>;
  threadId?: InputMaybe<Scalars['String']['input']>;
};

export type AgentStateInput = {
  agentName: Scalars['String']['input'];
  config?: InputMaybe<Scalars['String']['input']>;
  state: Scalars['String']['input'];
};

export type AgentStateMessageInput = {
  active: Scalars['Boolean']['input'];
  agentName: Scalars['String']['input'];
  nodeName: Scalars['String']['input'];
  role: MessageRole;
  runId: Scalars['String']['input'];
  running: Scalars['Boolean']['input'];
  state: Scalars['String']['input'];
  threadId: Scalars['String']['input'];
};

export type AgentStateMessageOutput = BaseMessageOutput & {
  __typename?: 'AgentStateMessageOutput';
  active: Scalars['Boolean']['output'];
  agentName: Scalars['String']['output'];
  createdAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  nodeName: Scalars['String']['output'];
  role: MessageRole;
  runId: Scalars['String']['output'];
  running: Scalars['Boolean']['output'];
  state: Scalars['String']['output'];
  status: MessageStatus;
  threadId: Scalars['String']['output'];
};

export type AgentsResponse = {
  __typename?: 'AgentsResponse';
  agents: Array<Agent>;
};

export type BaseMessageOutput = {
  createdAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  status: MessageStatus;
};

export type BaseMetaEvent = {
  name: MetaEventName;
  type: Scalars['String']['output'];
};

export type BaseResponseStatus = {
  code: ResponseStatusCode;
};

export type CloudInput = {
  guardrails?: InputMaybe<GuardrailsInput>;
};

export type CopilotContextInput = {
  description: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type CopilotKitLangGraphInterruptEvent = BaseMetaEvent & {
  __typename?: 'CopilotKitLangGraphInterruptEvent';
  data: CopilotKitLangGraphInterruptEventData;
  name: MetaEventName;
  response?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};

export type CopilotKitLangGraphInterruptEventData = {
  __typename?: 'CopilotKitLangGraphInterruptEventData';
  messages: Array<BaseMessageOutput>;
  value: Scalars['String']['output'];
};

/** The type of Copilot request */
export enum CopilotRequestType {
  Chat = 'Chat',
  Suggestion = 'Suggestion',
  Task = 'Task',
  TextareaCompletion = 'TextareaCompletion',
  TextareaPopover = 'TextareaPopover'
}

export type CopilotResponse = {
  __typename?: 'CopilotResponse';
  extensions?: Maybe<ExtensionsResponse>;
  messages: Array<BaseMessageOutput>;
  metaEvents?: Maybe<Array<BaseMetaEvent>>;
  runId?: Maybe<Scalars['String']['output']>;
  status: ResponseStatus;
  threadId: Scalars['String']['output'];
};

export type ExtensionsInput = {
  openaiAssistantAPI?: InputMaybe<OpenAiApiAssistantApiInput>;
};

export type ExtensionsResponse = {
  __typename?: 'ExtensionsResponse';
  openaiAssistantAPI?: Maybe<OpenAiApiAssistantApiResponse>;
};

export type FailedMessageStatus = {
  __typename?: 'FailedMessageStatus';
  code: MessageStatusCode;
  reason: Scalars['String']['output'];
};

export type FailedResponseStatus = BaseResponseStatus & {
  __typename?: 'FailedResponseStatus';
  code: ResponseStatusCode;
  details?: Maybe<Scalars['JSON']['output']>;
  reason: FailedResponseStatusReason;
};

export enum FailedResponseStatusReason {
  GuardrailsValidationFailed = 'GUARDRAILS_VALIDATION_FAILED',
  MessageStreamInterrupted = 'MESSAGE_STREAM_INTERRUPTED',
  UnknownError = 'UNKNOWN_ERROR'
}

export type ForwardedParametersInput = {
  maxTokens?: InputMaybe<Scalars['Float']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  stop?: InputMaybe<Array<Scalars['String']['input']>>;
  temperature?: InputMaybe<Scalars['Float']['input']>;
  toolChoice?: InputMaybe<Scalars['String']['input']>;
  toolChoiceFunctionName?: InputMaybe<Scalars['String']['input']>;
};

export type FrontendInput = {
  actions: Array<ActionInput>;
  toDeprecate_fullContext?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};

export type GenerateCopilotResponseInput = {
  agentSession?: InputMaybe<AgentSessionInput>;
  agentState?: InputMaybe<AgentStateInput>;
  agentStates?: InputMaybe<Array<AgentStateInput>>;
  cloud?: InputMaybe<CloudInput>;
  context?: InputMaybe<Array<CopilotContextInput>>;
  extensions?: InputMaybe<ExtensionsInput>;
  forwardedParameters?: InputMaybe<ForwardedParametersInput>;
  frontend: FrontendInput;
  messages: Array<MessageInput>;
  metaEvents?: InputMaybe<Array<MetaEventInput>>;
  metadata: GenerateCopilotResponseMetadataInput;
  runId?: InputMaybe<Scalars['String']['input']>;
  threadId?: InputMaybe<Scalars['String']['input']>;
};

export type GenerateCopilotResponseMetadataInput = {
  requestType?: InputMaybe<CopilotRequestType>;
};

export type GuardrailsInput = {
  inputValidationRules: GuardrailsRuleInput;
};

export type GuardrailsRuleInput = {
  allowList?: InputMaybe<Array<Scalars['String']['input']>>;
  denyList?: InputMaybe<Array<Scalars['String']['input']>>;
};

export type ImageMessageInput = {
  bytes: Scalars['String']['input'];
  format: Scalars['String']['input'];
  parentMessageId?: InputMaybe<Scalars['String']['input']>;
  role: MessageRole;
};

export type ImageMessageOutput = BaseMessageOutput & {
  __typename?: 'ImageMessageOutput';
  bytes: Scalars['String']['output'];
  createdAt: Scalars['DateTimeISO']['output'];
  format: Scalars['String']['output'];
  id: Scalars['String']['output'];
  parentMessageId?: Maybe<Scalars['String']['output']>;
  role: MessageRole;
  status: MessageStatus;
};

export type LangGraphInterruptEvent = BaseMetaEvent & {
  __typename?: 'LangGraphInterruptEvent';
  name: MetaEventName;
  response?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type LoadAgentStateInput = {
  agentName: Scalars['String']['input'];
  threadId: Scalars['String']['input'];
};

export type LoadAgentStateResponse = {
  __typename?: 'LoadAgentStateResponse';
  messages: Scalars['String']['output'];
  state: Scalars['String']['output'];
  threadExists: Scalars['Boolean']['output'];
  threadId: Scalars['String']['output'];
};

export type MessageInput = {
  actionExecutionMessage?: InputMaybe<ActionExecutionMessageInput>;
  agentStateMessage?: InputMaybe<AgentStateMessageInput>;
  createdAt: Scalars['DateTimeISO']['input'];
  id: Scalars['String']['input'];
  imageMessage?: InputMaybe<ImageMessageInput>;
  resultMessage?: InputMaybe<ResultMessageInput>;
  textMessage?: InputMaybe<TextMessageInput>;
};

/** The role of the message */
export enum MessageRole {
  Assistant = 'assistant',
  Developer = 'developer',
  System = 'system',
  Tool = 'tool',
  User = 'user'
}

export type MessageStatus = FailedMessageStatus | PendingMessageStatus | SuccessMessageStatus;

export enum MessageStatusCode {
  Failed = 'Failed',
  Pending = 'Pending',
  Success = 'Success'
}

export type MetaEventInput = {
  messages?: InputMaybe<Array<MessageInput>>;
  name: MetaEventName;
  response?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['String']['input'];
};

/** Meta event types */
export enum MetaEventName {
  CopilotKitLangGraphInterruptEvent = 'CopilotKitLangGraphInterruptEvent',
  LangGraphInterruptEvent = 'LangGraphInterruptEvent'
}

export type Mutation = {
  __typename?: 'Mutation';
  generateCopilotResponse: CopilotResponse;
};


export type MutationGenerateCopilotResponseArgs = {
  data: GenerateCopilotResponseInput;
  properties?: InputMaybe<Scalars['JSONObject']['input']>;
};

export type OpenAiApiAssistantApiInput = {
  runId?: InputMaybe<Scalars['String']['input']>;
  threadId?: InputMaybe<Scalars['String']['input']>;
};

export type OpenAiApiAssistantApiResponse = {
  __typename?: 'OpenAIApiAssistantAPIResponse';
  runId?: Maybe<Scalars['String']['output']>;
  threadId?: Maybe<Scalars['String']['output']>;
};

export type PendingMessageStatus = {
  __typename?: 'PendingMessageStatus';
  code: MessageStatusCode;
};

export type PendingResponseStatus = BaseResponseStatus & {
  __typename?: 'PendingResponseStatus';
  code: ResponseStatusCode;
};

export type Query = {
  __typename?: 'Query';
  availableAgents: AgentsResponse;
  hello: Scalars['String']['output'];
  loadAgentState: LoadAgentStateResponse;
};


export type QueryLoadAgentStateArgs = {
  data: LoadAgentStateInput;
};

export type ResponseStatus = FailedResponseStatus | PendingResponseStatus | SuccessResponseStatus;

export enum ResponseStatusCode {
  Failed = 'Failed',
  Pending = 'Pending',
  Success = 'Success'
}

export type ResultMessageInput = {
  actionExecutionId: Scalars['String']['input'];
  actionName: Scalars['String']['input'];
  parentMessageId?: InputMaybe<Scalars['String']['input']>;
  result: Scalars['String']['input'];
};

export type ResultMessageOutput = BaseMessageOutput & {
  __typename?: 'ResultMessageOutput';
  actionExecutionId: Scalars['String']['output'];
  actionName: Scalars['String']['output'];
  createdAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  result: Scalars['String']['output'];
  status: MessageStatus;
};

export type SuccessMessageStatus = {
  __typename?: 'SuccessMessageStatus';
  code: MessageStatusCode;
};

export type SuccessResponseStatus = BaseResponseStatus & {
  __typename?: 'SuccessResponseStatus';
  code: ResponseStatusCode;
};

export type TextMessageInput = {
  content: Scalars['String']['input'];
  parentMessageId?: InputMaybe<Scalars['String']['input']>;
  role: MessageRole;
};

export type TextMessageOutput = BaseMessageOutput & {
  __typename?: 'TextMessageOutput';
  content: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  parentMessageId?: Maybe<Scalars['String']['output']>;
  role: MessageRole;
  status: MessageStatus;
};

export type GenerateCopilotResponseMutationVariables = Exact<{
  data: GenerateCopilotResponseInput;
  properties?: InputMaybe<Scalars['JSONObject']['input']>;
}>;


export type GenerateCopilotResponseMutation = { __typename?: 'Mutation', generateCopilotResponse: { __typename?: 'CopilotResponse', threadId: string, runId?: string | null, extensions?: { __typename?: 'ExtensionsResponse', openaiAssistantAPI?: { __typename?: 'OpenAIApiAssistantAPIResponse', runId?: string | null, threadId?: string | null } | null } | null, messages: Array<{ __typename: 'ActionExecutionMessageOutput', id: string, createdAt: any, name: string, arguments: Array<string>, parentMessageId?: string | null, status: { __typename?: 'FailedMessageStatus', code: MessageStatusCode, reason: string } | { __typename?: 'PendingMessageStatus', code: MessageStatusCode } | { __typename?: 'SuccessMessageStatus', code: MessageStatusCode } } | { __typename: 'AgentStateMessageOutput', id: string, createdAt: any, threadId: string, state: string, running: boolean, agentName: string, nodeName: string, runId: string, active: boolean, role: MessageRole, status: { __typename?: 'FailedMessageStatus', code: MessageStatusCode, reason: string } | { __typename?: 'PendingMessageStatus', code: MessageStatusCode } | { __typename?: 'SuccessMessageStatus', code: MessageStatusCode } } | { __typename: 'ImageMessageOutput', id: string, createdAt: any, format: string, bytes: string, role: MessageRole, parentMessageId?: string | null, status: { __typename?: 'FailedMessageStatus', code: MessageStatusCode, reason: string } | { __typename?: 'PendingMessageStatus', code: MessageStatusCode } | { __typename?: 'SuccessMessageStatus', code: MessageStatusCode } } | { __typename: 'ResultMessageOutput', id: string, createdAt: any, result: string, actionExecutionId: string, actionName: string, status: { __typename?: 'FailedMessageStatus', code: MessageStatusCode, reason: string } | { __typename?: 'PendingMessageStatus', code: MessageStatusCode } | { __typename?: 'SuccessMessageStatus', code: MessageStatusCode } } | { __typename: 'TextMessageOutput', id: string, createdAt: any, content: Array<string>, role: MessageRole, parentMessageId?: string | null, status: { __typename?: 'FailedMessageStatus', code: MessageStatusCode, reason: string } | { __typename?: 'PendingMessageStatus', code: MessageStatusCode } | { __typename?: 'SuccessMessageStatus', code: MessageStatusCode } }>, metaEvents?: Array<{ __typename?: 'CopilotKitLangGraphInterruptEvent', type: string, name: MetaEventName, data: { __typename?: 'CopilotKitLangGraphInterruptEventData', value: string, messages: Array<{ __typename: 'ActionExecutionMessageOutput', id: string, createdAt: any, name: string, arguments: Array<string>, parentMessageId?: string | null, status: { __typename?: 'FailedMessageStatus', code: MessageStatusCode, reason: string } | { __typename?: 'PendingMessageStatus', code: MessageStatusCode } | { __typename?: 'SuccessMessageStatus', code: MessageStatusCode } } | { __typename: 'AgentStateMessageOutput', id: string, createdAt: any, status: { __typename?: 'FailedMessageStatus', code: MessageStatusCode, reason: string } | { __typename?: 'PendingMessageStatus', code: MessageStatusCode } | { __typename?: 'SuccessMessageStatus', code: MessageStatusCode } } | { __typename: 'ImageMessageOutput', id: string, createdAt: any, status: { __typename?: 'FailedMessageStatus', code: MessageStatusCode, reason: string } | { __typename?: 'PendingMessageStatus', code: MessageStatusCode } | { __typename?: 'SuccessMessageStatus', code: MessageStatusCode } } | { __typename: 'ResultMessageOutput', id: string, createdAt: any, result: string, actionExecutionId: string, actionName: string, status: { __typename?: 'FailedMessageStatus', code: MessageStatusCode, reason: string } | { __typename?: 'PendingMessageStatus', code: MessageStatusCode } | { __typename?: 'SuccessMessageStatus', code: MessageStatusCode } } | { __typename: 'TextMessageOutput', id: string, createdAt: any, content: Array<string>, role: MessageRole, parentMessageId?: string | null, status: { __typename?: 'FailedMessageStatus', code: MessageStatusCode, reason: string } | { __typename?: 'PendingMessageStatus', code: MessageStatusCode } | { __typename?: 'SuccessMessageStatus', code: MessageStatusCode } }> } } | { __typename?: 'LangGraphInterruptEvent', type: string, name: MetaEventName, value: string }> | null } & ({ __typename?: 'CopilotResponse', status: { __typename?: 'FailedResponseStatus', code: ResponseStatusCode, reason: FailedResponseStatusReason, details?: any | null } | { __typename?: 'PendingResponseStatus', code: ResponseStatusCode } | { __typename?: 'SuccessResponseStatus', code: ResponseStatusCode } } | { __typename?: 'CopilotResponse', status?: never }) };

export type AvailableAgentsQueryVariables = Exact<{ [key: string]: never; }>;


export type AvailableAgentsQuery = { __typename?: 'Query', availableAgents: { __typename?: 'AgentsResponse', agents: Array<{ __typename?: 'Agent', name: string, id: string, description: string }> } };

export type LoadAgentStateQueryVariables = Exact<{
  data: LoadAgentStateInput;
}>;


export type LoadAgentStateQuery = { __typename?: 'Query', loadAgentState: { __typename?: 'LoadAgentStateResponse', threadId: string, threadExists: boolean, state: string, messages: string } };


export const GenerateCopilotResponseDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"generateCopilotResponse"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GenerateCopilotResponseInput"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"properties"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"JSONObject"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"generateCopilotResponse"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}},{"kind":"Argument","name":{"kind":"Name","value":"properties"},"value":{"kind":"Variable","name":{"kind":"Name","value":"properties"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"extensions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"openaiAssistantAPI"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"threadId"}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CopilotResponse"}},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"defer"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseResponseStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FailedResponseStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"reason"}},{"kind":"Field","name":{"kind":"Name","value":"details"}}]}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"messages"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"stream"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseMessageOutput"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseMessageOutput"}},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"defer"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SuccessMessageStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FailedMessageStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingMessageStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TextMessageOutput"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"stream"}}]},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"parentMessageId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ImageMessageOutput"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"format"}},{"kind":"Field","name":{"kind":"Name","value":"bytes"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"parentMessageId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActionExecutionMessageOutput"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"arguments"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"stream"}}]},{"kind":"Field","name":{"kind":"Name","value":"parentMessageId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ResultMessageOutput"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"result"}},{"kind":"Field","name":{"kind":"Name","value":"actionExecutionId"}},{"kind":"Field","name":{"kind":"Name","value":"actionName"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AgentStateMessageOutput"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"running"}},{"kind":"Field","name":{"kind":"Name","value":"agentName"}},{"kind":"Field","name":{"kind":"Name","value":"nodeName"}},{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"role"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"metaEvents"},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"stream"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LangGraphInterruptEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CopilotKitLangGraphInterruptEvent"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"messages"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"__typename"}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseMessageOutput"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"BaseMessageOutput"}},"directives":[{"kind":"Directive","name":{"kind":"Name","value":"defer"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SuccessMessageStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FailedMessageStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}},{"kind":"Field","name":{"kind":"Name","value":"reason"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"PendingMessageStatus"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"code"}}]}}]}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TextMessageOutput"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"content"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"parentMessageId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ActionExecutionMessageOutput"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"arguments"}},{"kind":"Field","name":{"kind":"Name","value":"parentMessageId"}}]}},{"kind":"InlineFragment","typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ResultMessageOutput"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"result"}},{"kind":"Field","name":{"kind":"Name","value":"actionExecutionId"}},{"kind":"Field","name":{"kind":"Name","value":"actionName"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"value"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GenerateCopilotResponseMutation, GenerateCopilotResponseMutationVariables>;
export const AvailableAgentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"availableAgents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"availableAgents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"agents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]}}]}}]} as unknown as DocumentNode<AvailableAgentsQuery, AvailableAgentsQueryVariables>;
export const LoadAgentStateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"loadAgentState"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"data"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LoadAgentStateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"loadAgentState"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"data"},"value":{"kind":"Variable","name":{"kind":"Name","value":"data"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"threadId"}},{"kind":"Field","name":{"kind":"Name","value":"threadExists"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"messages"}}]}}]}}]} as unknown as DocumentNode<LoadAgentStateQuery, LoadAgentStateQueryVariables>;