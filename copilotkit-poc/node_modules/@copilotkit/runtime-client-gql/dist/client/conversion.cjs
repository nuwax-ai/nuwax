const require_runtime = require('../_virtual/_rolldown/runtime.cjs');
const require_graphql = require('../graphql/@generated/graphql.cjs');
const require_types = require('./types.cjs');
let _copilotkit_shared = require("@copilotkit/shared");
let untruncate_json = require("untruncate-json");
untruncate_json = require_runtime.__toESM(untruncate_json);

//#region src/client/conversion.ts
function filterAgentStateMessages(messages) {
	return messages.filter((message) => !message.isAgentStateMessage());
}
function convertMessagesToGqlInput(messages) {
	return messages.map((message) => {
		if (message.isTextMessage()) return {
			id: message.id,
			createdAt: message.createdAt,
			textMessage: {
				content: message.content,
				role: message.role,
				parentMessageId: message.parentMessageId
			}
		};
		else if (message.isActionExecutionMessage()) return {
			id: message.id,
			createdAt: message.createdAt,
			actionExecutionMessage: {
				name: message.name,
				arguments: JSON.stringify(message.arguments),
				parentMessageId: message.parentMessageId
			}
		};
		else if (message.isResultMessage()) return {
			id: message.id,
			createdAt: message.createdAt,
			resultMessage: {
				result: message.result,
				actionExecutionId: message.actionExecutionId,
				actionName: message.actionName
			}
		};
		else if (message.isAgentStateMessage()) return {
			id: message.id,
			createdAt: message.createdAt,
			agentStateMessage: {
				threadId: message.threadId,
				role: message.role,
				agentName: message.agentName,
				nodeName: message.nodeName,
				runId: message.runId,
				active: message.active,
				running: message.running,
				state: JSON.stringify(message.state)
			}
		};
		else if (message.isImageMessage()) return {
			id: message.id,
			createdAt: message.createdAt,
			imageMessage: {
				format: message.format,
				bytes: message.bytes,
				role: message.role,
				parentMessageId: message.parentMessageId
			}
		};
		else throw new Error("Unknown message type");
	});
}
function filterAdjacentAgentStateMessages(messages) {
	const filteredMessages = [];
	messages.forEach((message, i) => {
		if (message.__typename !== "AgentStateMessageOutput") filteredMessages.push(message);
		else {
			const prevAgentStateMessageIndex = filteredMessages.findIndex((m) => m.__typename === "AgentStateMessageOutput" && m.agentName === message.agentName);
			if (prevAgentStateMessageIndex === -1) filteredMessages.push(message);
			else filteredMessages[prevAgentStateMessageIndex] = message;
		}
	});
	return filteredMessages;
}
function convertGqlOutputToMessages(messages) {
	return messages.map((message) => {
		if (message.__typename === "TextMessageOutput") return new require_types.TextMessage({
			id: message.id,
			role: message.role,
			content: message.content.join(""),
			parentMessageId: message.parentMessageId,
			createdAt: /* @__PURE__ */ new Date(),
			status: message.status || { code: require_graphql.MessageStatusCode.Pending }
		});
		else if (message.__typename === "ActionExecutionMessageOutput") return new require_types.ActionExecutionMessage({
			id: message.id,
			name: message.name,
			arguments: getPartialArguments(message.arguments),
			parentMessageId: message.parentMessageId,
			createdAt: /* @__PURE__ */ new Date(),
			status: message.status || { code: require_graphql.MessageStatusCode.Pending }
		});
		else if (message.__typename === "ResultMessageOutput") return new require_types.ResultMessage({
			id: message.id,
			result: message.result,
			actionExecutionId: message.actionExecutionId,
			actionName: message.actionName,
			createdAt: /* @__PURE__ */ new Date(),
			status: message.status || { code: require_graphql.MessageStatusCode.Pending }
		});
		else if (message.__typename === "AgentStateMessageOutput") return new require_types.AgentStateMessage({
			id: message.id,
			threadId: message.threadId,
			role: message.role,
			agentName: message.agentName,
			nodeName: message.nodeName,
			runId: message.runId,
			active: message.active,
			running: message.running,
			state: (0, _copilotkit_shared.parseJson)(message.state, {}),
			createdAt: /* @__PURE__ */ new Date()
		});
		else if (message.__typename === "ImageMessageOutput") return new require_types.ImageMessage({
			id: message.id,
			format: message.format,
			bytes: message.bytes,
			role: message.role,
			parentMessageId: message.parentMessageId,
			createdAt: /* @__PURE__ */ new Date(),
			status: message.status || { code: require_graphql.MessageStatusCode.Pending }
		});
		throw new Error("Unknown message type");
	});
}
function loadMessagesFromJsonRepresentation(json) {
	const result = [];
	for (const item of json) if ("content" in item) result.push(new require_types.TextMessage({
		id: item.id,
		role: item.role,
		content: item.content,
		parentMessageId: item.parentMessageId,
		createdAt: item.createdAt || /* @__PURE__ */ new Date(),
		status: item.status || { code: require_graphql.MessageStatusCode.Success }
	}));
	else if ("arguments" in item) result.push(new require_types.ActionExecutionMessage({
		id: item.id,
		name: item.name,
		arguments: item.arguments,
		parentMessageId: item.parentMessageId,
		createdAt: item.createdAt || /* @__PURE__ */ new Date(),
		status: item.status || { code: require_graphql.MessageStatusCode.Success }
	}));
	else if ("result" in item) result.push(new require_types.ResultMessage({
		id: item.id,
		result: item.result,
		actionExecutionId: item.actionExecutionId,
		actionName: item.actionName,
		createdAt: item.createdAt || /* @__PURE__ */ new Date(),
		status: item.status || { code: require_graphql.MessageStatusCode.Success }
	}));
	else if ("state" in item) result.push(new require_types.AgentStateMessage({
		id: item.id,
		threadId: item.threadId,
		role: item.role,
		agentName: item.agentName,
		nodeName: item.nodeName,
		runId: item.runId,
		active: item.active,
		running: item.running,
		state: item.state,
		createdAt: item.createdAt || /* @__PURE__ */ new Date()
	}));
	else if ("format" in item && "bytes" in item) result.push(new require_types.ImageMessage({
		id: item.id,
		format: item.format,
		bytes: item.bytes,
		role: item.role,
		parentMessageId: item.parentMessageId,
		createdAt: item.createdAt || /* @__PURE__ */ new Date(),
		status: item.status || { code: require_graphql.MessageStatusCode.Success }
	}));
	return result;
}
function getPartialArguments(args) {
	try {
		if (!args.length) return {};
		const parsed = JSON.parse((0, untruncate_json.default)(args.join("")));
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
			console.warn(`[CopilotKit] Tool arguments parsed to non-object (${typeof parsed}), falling back to empty object`);
			return {};
		}
		return parsed;
	} catch (e) {
		return {};
	}
}

//#endregion
exports.convertGqlOutputToMessages = convertGqlOutputToMessages;
exports.convertMessagesToGqlInput = convertMessagesToGqlInput;
exports.filterAdjacentAgentStateMessages = filterAdjacentAgentStateMessages;
exports.filterAgentStateMessages = filterAgentStateMessages;
exports.loadMessagesFromJsonRepresentation = loadMessagesFromJsonRepresentation;
//# sourceMappingURL=conversion.cjs.map