import { MessageRole, MessageStatusCode, MetaEventName } from "../graphql/@generated/graphql.mjs";
import { parseJson, randomId } from "@copilotkit/shared";

//#region src/client/types.ts
var Message = class {
	constructor(props) {
		props.id ??= randomId();
		props.status ??= { code: MessageStatusCode.Success };
		props.createdAt ??= /* @__PURE__ */ new Date();
		Object.assign(this, props);
	}
	isTextMessage() {
		return this.type === "TextMessage";
	}
	isActionExecutionMessage() {
		return this.type === "ActionExecutionMessage";
	}
	isResultMessage() {
		return this.type === "ResultMessage";
	}
	isAgentStateMessage() {
		return this.type === "AgentStateMessage";
	}
	isImageMessage() {
		return this.type === "ImageMessage";
	}
};
const Role = MessageRole;
var TextMessage = class extends Message {
	constructor(props) {
		super(props);
		this.type = "TextMessage";
		this.type = "TextMessage";
	}
};
var ActionExecutionMessage = class extends Message {
	constructor(props) {
		super(props);
		this.type = "ActionExecutionMessage";
	}
};
var ResultMessage = class extends Message {
	constructor(props) {
		super(props);
		this.type = "ResultMessage";
	}
	static decodeResult(result) {
		return parseJson(result, result);
	}
	static encodeResult(result) {
		if (result === void 0) return "";
		else if (typeof result === "string") return result;
		else return JSON.stringify(result);
	}
};
var AgentStateMessage = class extends Message {
	constructor(props) {
		super(props);
		this.type = "AgentStateMessage";
	}
};
var ImageMessage = class extends Message {
	constructor(props) {
		super(props);
		this.type = "ImageMessage";
	}
};
function langGraphInterruptEvent(eventProps) {
	return {
		...eventProps,
		name: MetaEventName.LangGraphInterruptEvent,
		type: "MetaEvent"
	};
}

//#endregion
export { ActionExecutionMessage, AgentStateMessage, ImageMessage, Message, ResultMessage, Role, TextMessage, langGraphInterruptEvent };
//# sourceMappingURL=types.mjs.map