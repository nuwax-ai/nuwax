import { ActionExecutionMessageInput, AgentStateMessageInput, BaseMessageOutput, CopilotKitLangGraphInterruptEvent as CopilotKitLangGraphInterruptEvent$1, ImageMessageInput, LangGraphInterruptEvent as LangGraphInterruptEvent$1, MessageRole, MessageStatus, ResultMessageInput, TextMessageInput } from "../graphql/@generated/graphql.mjs";

//#region src/client/types.d.ts
type MessageType = "TextMessage" | "ActionExecutionMessage" | "ResultMessage" | "AgentStateMessage" | "ImageMessage";
declare class Message {
  type: MessageType;
  id: BaseMessageOutput["id"];
  createdAt: BaseMessageOutput["createdAt"];
  status: MessageStatus;
  constructor(props: any);
  isTextMessage(): this is TextMessage;
  isActionExecutionMessage(): this is ActionExecutionMessage;
  isResultMessage(): this is ResultMessage;
  isAgentStateMessage(): this is AgentStateMessage;
  isImageMessage(): this is ImageMessage;
}
declare const Role: typeof MessageRole;
type MessageConstructorOptions = Partial<Message>;
type TextMessageConstructorOptions = MessageConstructorOptions & TextMessageInput;
declare class TextMessage extends Message implements TextMessageConstructorOptions {
  content: TextMessageInput["content"];
  parentMessageId: TextMessageInput["parentMessageId"];
  role: TextMessageInput["role"];
  type: "TextMessage";
  constructor(props: TextMessageConstructorOptions);
}
type ActionExecutionMessageConstructorOptions = MessageConstructorOptions & Omit<ActionExecutionMessageInput, "arguments"> & {
  arguments: Record<string, any>;
};
declare class ActionExecutionMessage extends Message implements Omit<ActionExecutionMessageInput, "arguments" | "scope"> {
  name: ActionExecutionMessageInput["name"];
  arguments: Record<string, any>;
  parentMessageId: ActionExecutionMessageInput["parentMessageId"];
  constructor(props: ActionExecutionMessageConstructorOptions);
}
type ResultMessageConstructorOptions = MessageConstructorOptions & ResultMessageInput;
declare class ResultMessage extends Message implements ResultMessageConstructorOptions {
  actionExecutionId: ResultMessageInput["actionExecutionId"];
  actionName: ResultMessageInput["actionName"];
  result: ResultMessageInput["result"];
  constructor(props: ResultMessageConstructorOptions);
  static decodeResult(result: string): any;
  static encodeResult(result: any): string;
}
declare class AgentStateMessage extends Message implements Omit<AgentStateMessageInput, "state"> {
  agentName: AgentStateMessageInput["agentName"];
  state: any;
  running: AgentStateMessageInput["running"];
  threadId: AgentStateMessageInput["threadId"];
  role: AgentStateMessageInput["role"];
  nodeName: AgentStateMessageInput["nodeName"];
  runId: AgentStateMessageInput["runId"];
  active: AgentStateMessageInput["active"];
  constructor(props: any);
}
type ImageMessageConstructorOptions = MessageConstructorOptions & ImageMessageInput;
declare class ImageMessage extends Message implements ImageMessageConstructorOptions {
  format: ImageMessageInput["format"];
  bytes: ImageMessageInput["bytes"];
  role: ImageMessageInput["role"];
  parentMessageId: ImageMessageInput["parentMessageId"];
  constructor(props: ImageMessageConstructorOptions);
}
declare function langGraphInterruptEvent(eventProps: Omit<LangGraphInterruptEvent, "name" | "type" | "__typename">): LangGraphInterruptEvent;
type LangGraphInterruptEvent<TValue extends any = any> = LangGraphInterruptEvent$1 & {
  value: TValue;
};
type CopilotKitLangGraphInterruptEvent<TValue extends any = any> = CopilotKitLangGraphInterruptEvent$1 & {
  data: CopilotKitLangGraphInterruptEvent$1["data"] & {
    value: TValue;
  };
};
type MetaEvent = LangGraphInterruptEvent | CopilotKitLangGraphInterruptEvent;
//#endregion
export { ActionExecutionMessage, AgentStateMessage, ImageMessage, LangGraphInterruptEvent, Message, MetaEvent, ResultMessage, Role, TextMessage, langGraphInterruptEvent };
//# sourceMappingURL=types.d.mts.map