const require_graphql = require('../graphql/@generated/graphql.cjs');
const require_types = require('../client/types.cjs');

//#region src/message-conversion/gql-to-agui.ts
const VALID_IMAGE_FORMATS = [
	"jpeg",
	"png",
	"webp",
	"gif"
];
function validateImageFormat(format) {
	return VALID_IMAGE_FORMATS.includes(format);
}
function gqlToAGUI(messages, actions, coAgentStateRenders) {
	let aguiMessages = [];
	messages = Array.isArray(messages) ? messages : [messages];
	const actionResults = /* @__PURE__ */ new Map();
	for (const message of messages) if (message.isResultMessage()) actionResults.set(message.actionExecutionId, message.result);
	for (const message of messages) if (message.isTextMessage()) aguiMessages.push(gqlTextMessageToAGUIMessage(message));
	else if (message.isResultMessage()) aguiMessages.push(gqlResultMessageToAGUIMessage(message));
	else if (message.isActionExecutionMessage()) aguiMessages.push(gqlActionExecutionMessageToAGUIMessage(message, actions, actionResults));
	else if (message.isAgentStateMessage()) aguiMessages.push(gqlAgentStateMessageToAGUIMessage(message, coAgentStateRenders));
	else if (message.isImageMessage()) aguiMessages.push(gqlImageMessageToAGUIMessage(message));
	else throw new Error("Unknown message type");
	return aguiMessages;
}
function gqlActionExecutionMessageToAGUIMessage(message, actions, actionResults) {
	const hasSpecificAction = actions && Object.values(actions).some((action) => action.name === message.name);
	const hasWildcardAction = actions && Object.values(actions).some((action) => action.name === "*");
	if (!actions || !hasSpecificAction && !hasWildcardAction) return {
		id: message.id,
		role: "assistant",
		toolCalls: [actionExecutionMessageToAGUIMessage(message)],
		name: message.name
	};
	const action = Object.values(actions).find((action) => action.name === message.name) || Object.values(actions).find((action) => action.name === "*");
	const createRenderWrapper = (originalRender) => {
		if (!originalRender) return void 0;
		return (props) => {
			let actionResult = actionResults?.get(message.id);
			let status = "inProgress";
			if (actionResult !== void 0) status = "complete";
			else if (message.status?.code !== require_graphql.MessageStatusCode.Pending) status = "executing";
			if (typeof props?.result === "string") try {
				props.result = JSON.parse(props.result);
			} catch (e) {}
			if (typeof actionResult === "string") try {
				actionResult = JSON.parse(actionResult);
			} catch (e) {}
			const baseProps = {
				status: props?.status || status,
				args: message.arguments || {},
				result: props?.result || actionResult || void 0,
				messageId: message.id
			};
			if (action.name === "*") return originalRender({
				...baseProps,
				...props,
				name: message.name
			});
			else {
				const respond = props?.respond ?? (() => {});
				return originalRender({
					...baseProps,
					...props,
					respond
				});
			}
		};
	};
	return {
		id: message.id,
		role: "assistant",
		content: "",
		toolCalls: [actionExecutionMessageToAGUIMessage(message)],
		generativeUI: createRenderWrapper(action.render),
		name: message.name
	};
}
function gqlAgentStateMessageToAGUIMessage(message, coAgentStateRenders) {
	if (coAgentStateRenders && Object.values(coAgentStateRenders).some((render) => render.name === message.agentName)) {
		const render = Object.values(coAgentStateRenders).find((render) => render.name === message.agentName);
		const createRenderWrapper = (originalRender) => {
			if (!originalRender) return void 0;
			return (props) => {
				return originalRender({ state: message.state });
			};
		};
		return {
			id: message.id,
			role: "assistant",
			generativeUI: createRenderWrapper(render.render),
			agentName: message.agentName,
			state: message.state
		};
	}
	return {
		id: message.id,
		role: "assistant",
		agentName: message.agentName,
		state: message.state
	};
}
function actionExecutionMessageToAGUIMessage(actionExecutionMessage) {
	return {
		id: actionExecutionMessage.id,
		function: {
			name: actionExecutionMessage.name,
			arguments: JSON.stringify(actionExecutionMessage.arguments)
		},
		type: "function"
	};
}
function gqlTextMessageToAGUIMessage(message) {
	switch (message.role) {
		case require_types.Role.Developer: return {
			id: message.id,
			role: "developer",
			content: message.content
		};
		case require_types.Role.System: return {
			id: message.id,
			role: "system",
			content: message.content
		};
		case require_types.Role.Assistant: return {
			id: message.id,
			role: "assistant",
			content: message.content
		};
		case require_types.Role.User: return {
			id: message.id,
			role: "user",
			content: message.content
		};
		default: throw new Error("Unknown message role");
	}
}
function gqlResultMessageToAGUIMessage(message) {
	return {
		id: message.id,
		role: "tool",
		content: message.result,
		toolCallId: message.actionExecutionId,
		toolName: message.actionName
	};
}
function gqlImageMessageToAGUIMessage(message) {
	if (!validateImageFormat(message.format)) throw new Error(`Invalid image format: ${message.format}. Supported formats are: ${VALID_IMAGE_FORMATS.join(", ")}`);
	if (!message.bytes || typeof message.bytes !== "string" || message.bytes.trim() === "") throw new Error("Image bytes must be a non-empty string");
	const role = message.role === require_types.Role.Assistant ? "assistant" : "user";
	return {
		id: message.id,
		role,
		content: "",
		image: {
			format: message.format,
			bytes: message.bytes
		}
	};
}

//#endregion
exports.gqlActionExecutionMessageToAGUIMessage = gqlActionExecutionMessageToAGUIMessage;
exports.gqlImageMessageToAGUIMessage = gqlImageMessageToAGUIMessage;
exports.gqlResultMessageToAGUIMessage = gqlResultMessageToAGUIMessage;
exports.gqlTextMessageToAGUIMessage = gqlTextMessageToAGUIMessage;
exports.gqlToAGUI = gqlToAGUI;
//# sourceMappingURL=gql-to-agui.cjs.map