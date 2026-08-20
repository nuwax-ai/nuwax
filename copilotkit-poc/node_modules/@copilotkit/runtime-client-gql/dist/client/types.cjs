const require_runtime = require('../_virtual/_rolldown/runtime.cjs');
const require_graphql = require('../graphql/@generated/graphql.cjs');
let _copilotkit_shared = require("@copilotkit/shared");

//#region src/client/types.ts
var Message = class {
	constructor(props) {
		props.id ??= (0, _copilotkit_shared.randomId)();
		props.status ??= { code: require_graphql.MessageStatusCode.Success };
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
const Role = require_graphql.MessageRole;
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
		return (0, _copilotkit_shared.parseJson)(result, result);
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
		name: require_graphql.MetaEventName.LangGraphInterruptEvent,
		type: "MetaEvent"
	};
}

//#endregion
exports.ActionExecutionMessage = ActionExecutionMessage;
exports.AgentStateMessage = AgentStateMessage;
exports.ImageMessage = ImageMessage;
exports.Message = Message;
exports.ResultMessage = ResultMessage;
exports.Role = Role;
exports.TextMessage = TextMessage;
exports.langGraphInterruptEvent = langGraphInterruptEvent;
//# sourceMappingURL=types.cjs.map