import { CopilotRuntimeClient, CopilotRuntimeClientOptions } from "./CopilotRuntimeClient.cjs";
import { ActionExecutionMessage, AgentStateMessage, ImageMessage, LangGraphInterruptEvent, Message, MetaEvent, ResultMessage, Role, TextMessage, langGraphInterruptEvent } from "./types.cjs";
import { convertGqlOutputToMessages, convertMessagesToGqlInput, filterAdjacentAgentStateMessages, filterAgentStateMessages, loadMessagesFromJsonRepresentation } from "./conversion.cjs";
import { GraphQLError } from "graphql";
export { type GraphQLError };