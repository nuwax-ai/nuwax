import { ActionExecutionMessage, ImageMessage, Message, ResultMessage, TextMessage } from "../client/types.cjs";
import "../client/index.cjs";
import * as agui from "@copilotkit/shared";

//#region src/message-conversion/agui-to-gql.d.ts
declare function aguiToGQL(messages: agui.Message[] | agui.Message, actions?: Record<string, any>, coAgentStateRenders?: Record<string, any>): Message[];
declare function aguiTextMessageToGQLMessage(message: agui.Message): TextMessage;
declare function aguiToolCallToGQLActionExecution(toolCall: agui.ToolCall, parentMessageId: string): ActionExecutionMessage;
declare function aguiToolMessageToGQLResultMessage(message: agui.Message, toolCallNames: Record<string, string>): ResultMessage;
declare function aguiMessageWithRenderToGQL(message: agui.Message, actions?: Record<string, any>, coAgentStateRenders?: Record<string, any>): Message[];
declare function aguiMessageWithImageToGQLMessage(message: agui.Message): ImageMessage;
//#endregion
export { aguiMessageWithImageToGQLMessage, aguiMessageWithRenderToGQL, aguiTextMessageToGQLMessage, aguiToGQL, aguiToolCallToGQLActionExecution, aguiToolMessageToGQLResultMessage };
//# sourceMappingURL=agui-to-gql.d.cts.map