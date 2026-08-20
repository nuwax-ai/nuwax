import { TypedDocumentNode } from "@graphql-typed-document-node/core";

//#region src/graphql/@generated/graphql.d.ts
type Maybe<T> = T | null;
type InputMaybe<T> = Maybe<T>;
type Exact<T extends {
  [key: string]: unknown;
}> = { [K in keyof T]: T[K] };
type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
type MakeEmpty<T extends {
  [key: string]: unknown;
}, K extends keyof T> = { [_ in K]?: never };
type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
type Scalars = {
  ID: {
    input: string;
    output: string;
  };
  String: {
    input: string;
    output: string;
  };
  Boolean: {
    input: boolean;
    output: boolean;
  };
  Int: {
    input: number;
    output: number;
  };
  Float: {
    input: number;
    output: number;
  }; /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: {
    input: any;
    output: any;
  }; /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: {
    input: any;
    output: any;
  }; /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: {
    input: any;
    output: any;
  };
};
type ActionExecutionMessageInput = {
  arguments: Scalars['String']['input'];
  name: Scalars['String']['input'];
  parentMessageId?: InputMaybe<Scalars['String']['input']>; /** @deprecated This field will be removed in a future version */
  scope?: InputMaybe<Scalars['String']['input']>;
};
type ActionExecutionMessageOutput = BaseMessageOutput & {
  __typename?: 'ActionExecutionMessageOutput';
  arguments: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  parentMessageId?: Maybe<Scalars['String']['output']>; /** @deprecated This field will be removed in a future version */
  scope?: Maybe<Scalars['String']['output']>;
  status: MessageStatus;
};
type ActionInput = {
  available?: InputMaybe<ActionInputAvailability>;
  description: Scalars['String']['input'];
  jsonSchema: Scalars['String']['input'];
  name: Scalars['String']['input'];
};
/** The availability of the frontend action */
declare enum ActionInputAvailability {
  Disabled = "disabled",
  Enabled = "enabled",
  Remote = "remote"
}
type Agent = {
  __typename?: 'Agent';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
};
type AgentSessionInput = {
  agentName: Scalars['String']['input'];
  nodeName?: InputMaybe<Scalars['String']['input']>;
  threadId?: InputMaybe<Scalars['String']['input']>;
};
type AgentStateInput = {
  agentName: Scalars['String']['input'];
  config?: InputMaybe<Scalars['String']['input']>;
  state: Scalars['String']['input'];
};
type AgentStateMessageInput = {
  active: Scalars['Boolean']['input'];
  agentName: Scalars['String']['input'];
  nodeName: Scalars['String']['input'];
  role: MessageRole;
  runId: Scalars['String']['input'];
  running: Scalars['Boolean']['input'];
  state: Scalars['String']['input'];
  threadId: Scalars['String']['input'];
};
type AgentStateMessageOutput = BaseMessageOutput & {
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
type AgentsResponse = {
  __typename?: 'AgentsResponse';
  agents: Array<Agent>;
};
type BaseMessageOutput = {
  createdAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  status: MessageStatus;
};
type BaseMetaEvent = {
  name: MetaEventName;
  type: Scalars['String']['output'];
};
type BaseResponseStatus = {
  code: ResponseStatusCode;
};
type CloudInput = {
  guardrails?: InputMaybe<GuardrailsInput>;
};
type CopilotContextInput = {
  description: Scalars['String']['input'];
  value: Scalars['String']['input'];
};
type CopilotKitLangGraphInterruptEvent = BaseMetaEvent & {
  __typename?: 'CopilotKitLangGraphInterruptEvent';
  data: CopilotKitLangGraphInterruptEventData;
  name: MetaEventName;
  response?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
};
type CopilotKitLangGraphInterruptEventData = {
  __typename?: 'CopilotKitLangGraphInterruptEventData';
  messages: Array<BaseMessageOutput>;
  value: Scalars['String']['output'];
};
/** The type of Copilot request */
declare enum CopilotRequestType {
  Chat = "Chat",
  Suggestion = "Suggestion",
  Task = "Task",
  TextareaCompletion = "TextareaCompletion",
  TextareaPopover = "TextareaPopover"
}
type CopilotResponse = {
  __typename?: 'CopilotResponse';
  extensions?: Maybe<ExtensionsResponse>;
  messages: Array<BaseMessageOutput>;
  metaEvents?: Maybe<Array<BaseMetaEvent>>;
  runId?: Maybe<Scalars['String']['output']>;
  status: ResponseStatus;
  threadId: Scalars['String']['output'];
};
type ExtensionsInput = {
  openaiAssistantAPI?: InputMaybe<OpenAiApiAssistantApiInput>;
};
type ExtensionsResponse = {
  __typename?: 'ExtensionsResponse';
  openaiAssistantAPI?: Maybe<OpenAiApiAssistantApiResponse>;
};
type FailedMessageStatus = {
  __typename?: 'FailedMessageStatus';
  code: MessageStatusCode;
  reason: Scalars['String']['output'];
};
type FailedResponseStatus = BaseResponseStatus & {
  __typename?: 'FailedResponseStatus';
  code: ResponseStatusCode;
  details?: Maybe<Scalars['JSON']['output']>;
  reason: FailedResponseStatusReason;
};
declare enum FailedResponseStatusReason {
  GuardrailsValidationFailed = "GUARDRAILS_VALIDATION_FAILED",
  MessageStreamInterrupted = "MESSAGE_STREAM_INTERRUPTED",
  UnknownError = "UNKNOWN_ERROR"
}
type ForwardedParametersInput = {
  maxTokens?: InputMaybe<Scalars['Float']['input']>;
  model?: InputMaybe<Scalars['String']['input']>;
  stop?: InputMaybe<Array<Scalars['String']['input']>>;
  temperature?: InputMaybe<Scalars['Float']['input']>;
  toolChoice?: InputMaybe<Scalars['String']['input']>;
  toolChoiceFunctionName?: InputMaybe<Scalars['String']['input']>;
};
type FrontendInput = {
  actions: Array<ActionInput>;
  toDeprecate_fullContext?: InputMaybe<Scalars['String']['input']>;
  url?: InputMaybe<Scalars['String']['input']>;
};
type GenerateCopilotResponseInput = {
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
type GenerateCopilotResponseMetadataInput = {
  requestType?: InputMaybe<CopilotRequestType>;
};
type GuardrailsInput = {
  inputValidationRules: GuardrailsRuleInput;
};
type GuardrailsRuleInput = {
  allowList?: InputMaybe<Array<Scalars['String']['input']>>;
  denyList?: InputMaybe<Array<Scalars['String']['input']>>;
};
type ImageMessageInput = {
  bytes: Scalars['String']['input'];
  format: Scalars['String']['input'];
  parentMessageId?: InputMaybe<Scalars['String']['input']>;
  role: MessageRole;
};
type ImageMessageOutput = BaseMessageOutput & {
  __typename?: 'ImageMessageOutput';
  bytes: Scalars['String']['output'];
  createdAt: Scalars['DateTimeISO']['output'];
  format: Scalars['String']['output'];
  id: Scalars['String']['output'];
  parentMessageId?: Maybe<Scalars['String']['output']>;
  role: MessageRole;
  status: MessageStatus;
};
type LangGraphInterruptEvent = BaseMetaEvent & {
  __typename?: 'LangGraphInterruptEvent';
  name: MetaEventName;
  response?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  value: Scalars['String']['output'];
};
type LoadAgentStateInput = {
  agentName: Scalars['String']['input'];
  threadId: Scalars['String']['input'];
};
type LoadAgentStateResponse = {
  __typename?: 'LoadAgentStateResponse';
  messages: Scalars['String']['output'];
  state: Scalars['String']['output'];
  threadExists: Scalars['Boolean']['output'];
  threadId: Scalars['String']['output'];
};
type MessageInput = {
  actionExecutionMessage?: InputMaybe<ActionExecutionMessageInput>;
  agentStateMessage?: InputMaybe<AgentStateMessageInput>;
  createdAt: Scalars['DateTimeISO']['input'];
  id: Scalars['String']['input'];
  imageMessage?: InputMaybe<ImageMessageInput>;
  resultMessage?: InputMaybe<ResultMessageInput>;
  textMessage?: InputMaybe<TextMessageInput>;
};
/** The role of the message */
declare enum MessageRole {
  Assistant = "assistant",
  Developer = "developer",
  System = "system",
  Tool = "tool",
  User = "user"
}
type MessageStatus = FailedMessageStatus | PendingMessageStatus | SuccessMessageStatus;
declare enum MessageStatusCode {
  Failed = "Failed",
  Pending = "Pending",
  Success = "Success"
}
type MetaEventInput = {
  messages?: InputMaybe<Array<MessageInput>>;
  name: MetaEventName;
  response?: InputMaybe<Scalars['String']['input']>;
  value: Scalars['String']['input'];
};
/** Meta event types */
declare enum MetaEventName {
  CopilotKitLangGraphInterruptEvent = "CopilotKitLangGraphInterruptEvent",
  LangGraphInterruptEvent = "LangGraphInterruptEvent"
}
type Mutation = {
  __typename?: 'Mutation';
  generateCopilotResponse: CopilotResponse;
};
type MutationGenerateCopilotResponseArgs = {
  data: GenerateCopilotResponseInput;
  properties?: InputMaybe<Scalars['JSONObject']['input']>;
};
type OpenAiApiAssistantApiInput = {
  runId?: InputMaybe<Scalars['String']['input']>;
  threadId?: InputMaybe<Scalars['String']['input']>;
};
type OpenAiApiAssistantApiResponse = {
  __typename?: 'OpenAIApiAssistantAPIResponse';
  runId?: Maybe<Scalars['String']['output']>;
  threadId?: Maybe<Scalars['String']['output']>;
};
type PendingMessageStatus = {
  __typename?: 'PendingMessageStatus';
  code: MessageStatusCode;
};
type PendingResponseStatus = BaseResponseStatus & {
  __typename?: 'PendingResponseStatus';
  code: ResponseStatusCode;
};
type Query = {
  __typename?: 'Query';
  availableAgents: AgentsResponse;
  hello: Scalars['String']['output'];
  loadAgentState: LoadAgentStateResponse;
};
type QueryLoadAgentStateArgs = {
  data: LoadAgentStateInput;
};
type ResponseStatus = FailedResponseStatus | PendingResponseStatus | SuccessResponseStatus;
declare enum ResponseStatusCode {
  Failed = "Failed",
  Pending = "Pending",
  Success = "Success"
}
type ResultMessageInput = {
  actionExecutionId: Scalars['String']['input'];
  actionName: Scalars['String']['input'];
  parentMessageId?: InputMaybe<Scalars['String']['input']>;
  result: Scalars['String']['input'];
};
type ResultMessageOutput = BaseMessageOutput & {
  __typename?: 'ResultMessageOutput';
  actionExecutionId: Scalars['String']['output'];
  actionName: Scalars['String']['output'];
  createdAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  result: Scalars['String']['output'];
  status: MessageStatus;
};
type SuccessMessageStatus = {
  __typename?: 'SuccessMessageStatus';
  code: MessageStatusCode;
};
type SuccessResponseStatus = BaseResponseStatus & {
  __typename?: 'SuccessResponseStatus';
  code: ResponseStatusCode;
};
type TextMessageInput = {
  content: Scalars['String']['input'];
  parentMessageId?: InputMaybe<Scalars['String']['input']>;
  role: MessageRole;
};
type TextMessageOutput = BaseMessageOutput & {
  __typename?: 'TextMessageOutput';
  content: Array<Scalars['String']['output']>;
  createdAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  parentMessageId?: Maybe<Scalars['String']['output']>;
  role: MessageRole;
  status: MessageStatus;
};
type GenerateCopilotResponseMutationVariables = Exact<{
  data: GenerateCopilotResponseInput;
  properties?: InputMaybe<Scalars['JSONObject']['input']>;
}>;
type GenerateCopilotResponseMutation = {
  __typename?: 'Mutation';
  generateCopilotResponse: {
    __typename?: 'CopilotResponse';
    threadId: string;
    runId?: string | null;
    extensions?: {
      __typename?: 'ExtensionsResponse';
      openaiAssistantAPI?: {
        __typename?: 'OpenAIApiAssistantAPIResponse';
        runId?: string | null;
        threadId?: string | null;
      } | null;
    } | null;
    messages: Array<{
      __typename: 'ActionExecutionMessageOutput';
      id: string;
      createdAt: any;
      name: string;
      arguments: Array<string>;
      parentMessageId?: string | null;
      status: {
        __typename?: 'FailedMessageStatus';
        code: MessageStatusCode;
        reason: string;
      } | {
        __typename?: 'PendingMessageStatus';
        code: MessageStatusCode;
      } | {
        __typename?: 'SuccessMessageStatus';
        code: MessageStatusCode;
      };
    } | {
      __typename: 'AgentStateMessageOutput';
      id: string;
      createdAt: any;
      threadId: string;
      state: string;
      running: boolean;
      agentName: string;
      nodeName: string;
      runId: string;
      active: boolean;
      role: MessageRole;
      status: {
        __typename?: 'FailedMessageStatus';
        code: MessageStatusCode;
        reason: string;
      } | {
        __typename?: 'PendingMessageStatus';
        code: MessageStatusCode;
      } | {
        __typename?: 'SuccessMessageStatus';
        code: MessageStatusCode;
      };
    } | {
      __typename: 'ImageMessageOutput';
      id: string;
      createdAt: any;
      format: string;
      bytes: string;
      role: MessageRole;
      parentMessageId?: string | null;
      status: {
        __typename?: 'FailedMessageStatus';
        code: MessageStatusCode;
        reason: string;
      } | {
        __typename?: 'PendingMessageStatus';
        code: MessageStatusCode;
      } | {
        __typename?: 'SuccessMessageStatus';
        code: MessageStatusCode;
      };
    } | {
      __typename: 'ResultMessageOutput';
      id: string;
      createdAt: any;
      result: string;
      actionExecutionId: string;
      actionName: string;
      status: {
        __typename?: 'FailedMessageStatus';
        code: MessageStatusCode;
        reason: string;
      } | {
        __typename?: 'PendingMessageStatus';
        code: MessageStatusCode;
      } | {
        __typename?: 'SuccessMessageStatus';
        code: MessageStatusCode;
      };
    } | {
      __typename: 'TextMessageOutput';
      id: string;
      createdAt: any;
      content: Array<string>;
      role: MessageRole;
      parentMessageId?: string | null;
      status: {
        __typename?: 'FailedMessageStatus';
        code: MessageStatusCode;
        reason: string;
      } | {
        __typename?: 'PendingMessageStatus';
        code: MessageStatusCode;
      } | {
        __typename?: 'SuccessMessageStatus';
        code: MessageStatusCode;
      };
    }>;
    metaEvents?: Array<{
      __typename?: 'CopilotKitLangGraphInterruptEvent';
      type: string;
      name: MetaEventName;
      data: {
        __typename?: 'CopilotKitLangGraphInterruptEventData';
        value: string;
        messages: Array<{
          __typename: 'ActionExecutionMessageOutput';
          id: string;
          createdAt: any;
          name: string;
          arguments: Array<string>;
          parentMessageId?: string | null;
          status: {
            __typename?: 'FailedMessageStatus';
            code: MessageStatusCode;
            reason: string;
          } | {
            __typename?: 'PendingMessageStatus';
            code: MessageStatusCode;
          } | {
            __typename?: 'SuccessMessageStatus';
            code: MessageStatusCode;
          };
        } | {
          __typename: 'AgentStateMessageOutput';
          id: string;
          createdAt: any;
          status: {
            __typename?: 'FailedMessageStatus';
            code: MessageStatusCode;
            reason: string;
          } | {
            __typename?: 'PendingMessageStatus';
            code: MessageStatusCode;
          } | {
            __typename?: 'SuccessMessageStatus';
            code: MessageStatusCode;
          };
        } | {
          __typename: 'ImageMessageOutput';
          id: string;
          createdAt: any;
          status: {
            __typename?: 'FailedMessageStatus';
            code: MessageStatusCode;
            reason: string;
          } | {
            __typename?: 'PendingMessageStatus';
            code: MessageStatusCode;
          } | {
            __typename?: 'SuccessMessageStatus';
            code: MessageStatusCode;
          };
        } | {
          __typename: 'ResultMessageOutput';
          id: string;
          createdAt: any;
          result: string;
          actionExecutionId: string;
          actionName: string;
          status: {
            __typename?: 'FailedMessageStatus';
            code: MessageStatusCode;
            reason: string;
          } | {
            __typename?: 'PendingMessageStatus';
            code: MessageStatusCode;
          } | {
            __typename?: 'SuccessMessageStatus';
            code: MessageStatusCode;
          };
        } | {
          __typename: 'TextMessageOutput';
          id: string;
          createdAt: any;
          content: Array<string>;
          role: MessageRole;
          parentMessageId?: string | null;
          status: {
            __typename?: 'FailedMessageStatus';
            code: MessageStatusCode;
            reason: string;
          } | {
            __typename?: 'PendingMessageStatus';
            code: MessageStatusCode;
          } | {
            __typename?: 'SuccessMessageStatus';
            code: MessageStatusCode;
          };
        }>;
      };
    } | {
      __typename?: 'LangGraphInterruptEvent';
      type: string;
      name: MetaEventName;
      value: string;
    }> | null;
  } & ({
    __typename?: 'CopilotResponse';
    status: {
      __typename?: 'FailedResponseStatus';
      code: ResponseStatusCode;
      reason: FailedResponseStatusReason;
      details?: any | null;
    } | {
      __typename?: 'PendingResponseStatus';
      code: ResponseStatusCode;
    } | {
      __typename?: 'SuccessResponseStatus';
      code: ResponseStatusCode;
    };
  } | {
    __typename?: 'CopilotResponse';
    status?: never;
  });
};
type AvailableAgentsQueryVariables = Exact<{
  [key: string]: never;
}>;
type AvailableAgentsQuery = {
  __typename?: 'Query';
  availableAgents: {
    __typename?: 'AgentsResponse';
    agents: Array<{
      __typename?: 'Agent';
      name: string;
      id: string;
      description: string;
    }>;
  };
};
type LoadAgentStateQueryVariables = Exact<{
  data: LoadAgentStateInput;
}>;
type LoadAgentStateQuery = {
  __typename?: 'Query';
  loadAgentState: {
    __typename?: 'LoadAgentStateResponse';
    threadId: string;
    threadExists: boolean;
    state: string;
    messages: string;
  };
};
declare const GenerateCopilotResponseDocument: TypedDocumentNode<GenerateCopilotResponseMutation, GenerateCopilotResponseMutationVariables>;
declare const AvailableAgentsDocument: TypedDocumentNode<AvailableAgentsQuery, AvailableAgentsQueryVariables>;
declare const LoadAgentStateDocument: TypedDocumentNode<LoadAgentStateQuery, LoadAgentStateQueryVariables>;
//#endregion
export { ActionExecutionMessageInput, ActionExecutionMessageOutput, ActionInput, ActionInputAvailability, Agent, AgentSessionInput, AgentStateInput, AgentStateMessageInput, AgentStateMessageOutput, AgentsResponse, AvailableAgentsDocument, AvailableAgentsQuery, AvailableAgentsQueryVariables, BaseMessageOutput, BaseMetaEvent, BaseResponseStatus, CloudInput, CopilotContextInput, CopilotKitLangGraphInterruptEvent, CopilotKitLangGraphInterruptEventData, CopilotRequestType, CopilotResponse, Exact, ExtensionsInput, ExtensionsResponse, FailedMessageStatus, FailedResponseStatus, FailedResponseStatusReason, ForwardedParametersInput, FrontendInput, GenerateCopilotResponseDocument, GenerateCopilotResponseInput, GenerateCopilotResponseMetadataInput, GenerateCopilotResponseMutation, GenerateCopilotResponseMutationVariables, GuardrailsInput, GuardrailsRuleInput, ImageMessageInput, ImageMessageOutput, Incremental, InputMaybe, LangGraphInterruptEvent, LoadAgentStateDocument, LoadAgentStateInput, LoadAgentStateQuery, LoadAgentStateQueryVariables, LoadAgentStateResponse, MakeEmpty, MakeMaybe, MakeOptional, Maybe, MessageInput, MessageRole, MessageStatus, MessageStatusCode, MetaEventInput, MetaEventName, Mutation, MutationGenerateCopilotResponseArgs, OpenAiApiAssistantApiInput, OpenAiApiAssistantApiResponse, PendingMessageStatus, PendingResponseStatus, Query, QueryLoadAgentStateArgs, ResponseStatus, ResponseStatusCode, ResultMessageInput, ResultMessageOutput, Scalars, SuccessMessageStatus, SuccessResponseStatus, TextMessageInput, TextMessageOutput };
//# sourceMappingURL=graphql.d.cts.map