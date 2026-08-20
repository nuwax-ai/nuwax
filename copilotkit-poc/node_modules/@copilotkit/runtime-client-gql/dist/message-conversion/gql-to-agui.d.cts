import { ActionExecutionMessage, ImageMessage, Message, ResultMessage, TextMessage } from "../client/types.cjs";
import "../client/index.cjs";
import * as agui from "@copilotkit/shared";

//#region src/message-conversion/gql-to-agui.d.ts
declare function gqlToAGUI(messages: Message[] | Message, actions?: Record<string, any>, coAgentStateRenders?: Record<string, any>): agui.Message[];
declare function gqlActionExecutionMessageToAGUIMessage(message: ActionExecutionMessage, actions?: Record<string, any>, actionResults?: Map<string, string>): agui.Message;
declare function gqlTextMessageToAGUIMessage(message: TextMessage): agui.Message;
declare function gqlResultMessageToAGUIMessage(message: ResultMessage): agui.Message;
declare function gqlImageMessageToAGUIMessage(message: ImageMessage): agui.Message;
//#endregion
export { gqlActionExecutionMessageToAGUIMessage, gqlImageMessageToAGUIMessage, gqlResultMessageToAGUIMessage, gqlTextMessageToAGUIMessage, gqlToAGUI };
//# sourceMappingURL=gql-to-agui.d.cts.map