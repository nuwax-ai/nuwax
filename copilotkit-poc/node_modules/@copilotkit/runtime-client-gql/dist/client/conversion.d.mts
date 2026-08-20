import { GenerateCopilotResponseMutation, MessageInput } from "../graphql/@generated/graphql.mjs";
import { Message } from "./types.mjs";

//#region src/client/conversion.d.ts
declare function filterAgentStateMessages(messages: Message[]): Message[];
declare function convertMessagesToGqlInput(messages: Message[]): MessageInput[];
declare function filterAdjacentAgentStateMessages(messages: GenerateCopilotResponseMutation["generateCopilotResponse"]["messages"]): GenerateCopilotResponseMutation["generateCopilotResponse"]["messages"];
declare function convertGqlOutputToMessages(messages: GenerateCopilotResponseMutation["generateCopilotResponse"]["messages"]): Message[];
declare function loadMessagesFromJsonRepresentation(json: any[]): Message[];
//#endregion
export { convertGqlOutputToMessages, convertMessagesToGqlInput, filterAdjacentAgentStateMessages, filterAgentStateMessages, loadMessagesFromJsonRepresentation };
//# sourceMappingURL=conversion.d.mts.map