import { CopilotRuntimeClient, CopilotRuntimeClientOptions } from "./CopilotRuntimeClient.mjs";
import { ActionExecutionMessage, AgentStateMessage, ImageMessage, LangGraphInterruptEvent, Message, MetaEvent, ResultMessage, Role, TextMessage, langGraphInterruptEvent } from "./types.mjs";
import { convertGqlOutputToMessages, convertMessagesToGqlInput, filterAdjacentAgentStateMessages, filterAgentStateMessages, loadMessagesFromJsonRepresentation } from "./conversion.mjs";
import { GraphQLError } from "graphql";
export { type GraphQLError };