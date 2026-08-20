import { traceable, isTraceableFunction, withRunTree, } from "../../traceable.js";
import { StreamManager } from "./context.js";
import { convertFromAnthropicMessage, mergeMessagesById } from "./messages.js";
const WRAPPED_TOOL_SYMBOL = Symbol.for("langsmith:claude_agent_sdk:wrapped_tool");
const WRAPPED_TOOL_HANDLER_SYMBOL = Symbol.for("langsmith:claude_agent_sdk:wrapped_tool_handler");
/**
 * Wraps the Claude Agent SDK's query function to add LangSmith tracing.
 * Traces the entire agent interaction including all streaming messages.
 * @internal Use `wrapClaudeAgentSDK` instead.
 */
function wrapClaudeAgentQuery(queryFn, defaultThis, baseConfig) {
    async function* generator(originalGenerator, prompt, streamManager) {
        try {
            let systemCount = 0;
            for await (const message of originalGenerator) {
                if (message.type === "system") {
                    const content = getLatestInput(prompt, systemCount);
                    systemCount += 1;
                    if (content != null)
                        await streamManager.addMessage(content);
                }
                await streamManager.addMessage(message);
                yield message;
            }
        }
        finally {
            await streamManager.finish();
        }
    }
    function getLatestInput(arg, systemCount) {
        const value = (() => {
            if (typeof arg !== "object" || arg == null)
                return arg;
            const toJSON = arg["toJSON"];
            if (typeof toJSON !== "function")
                return undefined;
            const latest = toJSON();
            return latest?.at(systemCount);
        })();
        if (value == null)
            return undefined;
        if (typeof value === "string") {
            return {
                type: "user",
                message: { content: value, role: "user" },
                parent_tool_use_id: null,
                session_id: "",
            };
        }
        return typeof value === "object" && value != null ? value : undefined;
    }
    async function processInputs(rawInputs) {
        const inputs = rawInputs;
        const newInputs = { ...inputs };
        return Object.assign(newInputs, {
            toJSON: () => {
                const toJSON = (value) => {
                    if (typeof value !== "object" || value == null)
                        return value;
                    const fn = value?.toJSON;
                    if (typeof fn === "function")
                        return fn();
                    return value;
                };
                const prompt = toJSON(inputs.prompt);
                const options = inputs.options != null
                    ? { ...inputs.options }
                    : undefined;
                if (options?.mcpServers != null) {
                    options.mcpServers = Object.fromEntries(Object.entries(options.mcpServers ?? {}).map(([key, value]) => [
                        key,
                        { name: value.name, type: value.type },
                    ]));
                }
                return { messages: convertFromAnthropicMessage(prompt), options };
            },
        });
    }
    function addLangSmithHooks(params, streamManager) {
        const options = { ...(params.options ?? {}) };
        const hooks = { ...(options.hooks ?? {}) };
        const addHook = (eventName) => {
            const existing = Array.isArray(hooks[eventName])
                ? hooks[eventName]
                : [];
            hooks[eventName] = [
                ...existing,
                {
                    hooks: [
                        async (input, toolUseId) => {
                            streamManager.addHookEvent(input, toolUseId);
                            return {};
                        },
                    ],
                },
            ];
        };
        addHook("PreToolUse");
        addHook("SubagentStart");
        addHook("SubagentStop");
        addHook("Stop");
        options.hooks = hooks;
        return { ...params, options };
    }
    function processOutputs(rawOutputs) {
        if ("outputs" in rawOutputs && Array.isArray(rawOutputs.outputs)) {
            const sdkMessages = rawOutputs.outputs;
            const messages = sdkMessages
                .filter((message) => {
                if (!("message" in message))
                    return true;
                return message.parent_tool_use_id == null;
            })
                .flatMap(convertFromAnthropicMessage)
                .reduce((acc, message) => mergeMessagesById(acc, [message]), []);
            return { output: { messages } };
        }
        return rawOutputs;
    }
    return traceable((params, ...args) => {
        const streamManager = new StreamManager();
        const paramsWithHooks = addLangSmithHooks(params, streamManager);
        const actualGenerator = queryFn.call(defaultThis, paramsWithHooks, ...args);
        const wrappedGenerator = generator(actualGenerator, params.prompt, streamManager);
        for (const method of Object.getOwnPropertyNames(Object.getPrototypeOf(actualGenerator)).filter((method) => !["constructor", "next", "throw", "return"].includes(method))) {
            Object.defineProperty(wrappedGenerator, method, {
                get() {
                    const getValue = actualGenerator?.[method];
                    if (typeof getValue === "function")
                        return getValue.bind(actualGenerator);
                    return getValue;
                },
            });
        }
        return wrappedGenerator;
    }, {
        name: "claude.conversation",
        run_type: "chain",
        ...baseConfig,
        metadata: {
            ls_integration: "claude-agent-sdk-js",
            ls_agent_type: "root",
            ...baseConfig?.metadata,
        },
        __deferredSerializableArgOptions: { maxDepth: 1 },
        processInputs,
        processOutputs,
    });
}
/**
 * Wraps the Claude Agent SDK with LangSmith tracing. This returns wrapped versions
 * of query and tool that automatically trace all agent interactions.
 *
 * @param sdk - The Claude Agent SDK module
 * @param config - Optional LangSmith configuration
 * @returns Object with wrapped query, tool, and createSdkMcpServer functions
 *
 * @example
 * ```typescript
 * import * as claudeSDK from "@anthropic-ai/claude-agent-sdk";
 * import { wrapClaudeAgentSDK } from "langsmith/experimental/claude_agent_sdk";
 *
 * // Wrap once - returns { query, tool, createSdkMcpServer } with tracing built-in
 * const { query, tool, createSdkMcpServer } = wrapClaudeAgentSDK(claudeSDK);
 *
 * // Use normally - tracing is automatic
 * for await (const message of query({
 *   prompt: "Hello, Claude!",
 *   options: { model: "claude-haiku-4-5-20251001" }
 * })) {
 *   console.log(message);
 * }
 *
 * // Tools created with wrapped tool() are automatically traced
 * const calculator = tool("calculator", "Does math", schema, handler);
 * ```
 */
export function wrapClaudeAgentSDK(sdk, config) {
    const inputSdk = sdk;
    const wrappedSdk = { ...sdk };
    const toolAlreadyWrapped = "tool" in inputSdk &&
        typeof inputSdk.tool === "function" &&
        WRAPPED_TOOL_SYMBOL in inputSdk.tool;
    if (("query" in inputSdk && isTraceableFunction(inputSdk.query)) ||
        toolAlreadyWrapped) {
        throw new Error("This instance of Claude Agent SDK has been already wrapped by `wrapClaudeAgentSDK`.");
    }
    // Wrap the query method if it exists
    if ("query" in inputSdk && typeof inputSdk.query === "function") {
        wrappedSdk.query = wrapClaudeAgentQuery(inputSdk.query, inputSdk, config);
    }
    // Wrap the tool method if it exists. The SDK invokes MCP tool handlers in an
    // async context that may not inherit the query trace context, so bind nested
    // traceable calls back to the active tool run when possible.
    if ("tool" in inputSdk && typeof inputSdk.tool === "function") {
        wrappedSdk.tool = (...args) => {
            const toolName = typeof args[0] === "string" ? args[0] : undefined;
            let handlerIndex = -1;
            for (let index = args.length - 1; index >= 0; index -= 1) {
                if (typeof args[index] === "function") {
                    handlerIndex = index;
                    break;
                }
            }
            if (handlerIndex < 0) {
                return inputSdk.tool?.(...args);
            }
            const originalHandler = args[handlerIndex];
            if (WRAPPED_TOOL_HANDLER_SYMBOL in originalHandler) {
                return inputSdk.tool?.(...args);
            }
            const wrappedHandler = (...handlerArgs) => {
                const activeToolRun = StreamManager.getActiveToolRun(toolName, handlerArgs[0]);
                if (activeToolRun == null) {
                    return originalHandler(...handlerArgs);
                }
                return withRunTree(activeToolRun, () => originalHandler(...handlerArgs));
            };
            Object.defineProperty(wrappedHandler, WRAPPED_TOOL_HANDLER_SYMBOL, {
                value: true,
            });
            const wrappedArgs = [...args];
            wrappedArgs[handlerIndex] = wrappedHandler;
            return inputSdk.tool?.(...wrappedArgs);
        };
        Object.defineProperty(wrappedSdk.tool, WRAPPED_TOOL_SYMBOL, {
            value: true,
        });
    }
    // Keep createSdkMcpServer and other methods as-is (bound to original SDK)
    if ("createSdkMcpServer" in inputSdk &&
        typeof inputSdk.createSdkMcpServer === "function") {
        wrappedSdk.createSdkMcpServer = inputSdk.createSdkMcpServer.bind(inputSdk);
    }
    if ("unstable_v2_createSession" in inputSdk &&
        typeof inputSdk.unstable_v2_createSession === "function") {
        wrappedSdk.unstable_v2_createSession = (...args) => {
            console.warn("Tracing of `unstable_v2_createSession` is not supported by LangSmith. Tracing will not be applied.");
            return inputSdk.unstable_v2_createSession?.(...args);
        };
    }
    if ("unstable_v2_prompt" in inputSdk &&
        typeof inputSdk.unstable_v2_prompt === "function") {
        wrappedSdk.unstable_v2_prompt = (...args) => {
            console.warn("Tracing of `unstable_v2_prompt` is not supported by LangSmith. Tracing will not be applied.");
            return inputSdk.unstable_v2_prompt?.(...args);
        };
    }
    if ("unstable_v2_resumeSession" in inputSdk &&
        typeof inputSdk.unstable_v2_resumeSession === "function") {
        wrappedSdk.unstable_v2_resumeSession = (...args) => {
            console.warn("Tracing of `unstable_v2_resumeSession` is not supported by LangSmith. Tracing will not be applied.");
            return inputSdk.unstable_v2_resumeSession?.(...args);
        };
    }
    return wrappedSdk;
}
