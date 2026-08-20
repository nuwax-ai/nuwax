/**
 * LangSmith integration for OpenAI Agents SDK.
 *
 * This module provides tracing support for the OpenAI Agents SDK.
 */
import { Client } from "../client.js";
import type { Span as SDKSpan, SpanData, Trace as SDKTrace } from "@openai/agents";
type Span<TData extends SpanData = SpanData> = Pick<SDKSpan<TData>, "traceId" | "spanData" | "spanId" | "parentId" | "error" | "startedAt" | "endedAt" | "toJSON">;
type Trace = Pick<SDKTrace, "traceId" | "name" | "groupId" | "metadata" | "toJSON">;
interface TracingProcessor {
    start?(): void;
    onTraceStart(trace: Trace): Promise<void>;
    onTraceEnd(trace: Trace): Promise<void>;
    onSpanStart(span: Span): Promise<void>;
    onSpanEnd(span: Span): Promise<void>;
    shutdown(timeout?: number): Promise<void>;
    forceFlush(): Promise<void>;
}
/**
 * Tracing processor for the [OpenAI Agents SDK](https://openai.github.io/openai-agents-js/).
 *
 * Traces all intermediate steps of your OpenAI Agent to LangSmith.
 *
 * Requirements: Make sure to install `npm install @openai/agents`.
 *
 * Installing this processor is itself an explicit opt-in to tracing,
 * so traces will be posted regardless of the `LANGSMITH_TRACING` env
 * variable. Any nested `traceable()` calls made from within an agent
 * run (e.g. inside a tool handler) will inherit this and also post,
 * even if `LANGSMITH_TRACING` is not set.
 *
 * @param client - An instance of `langsmith.Client`. If not provided, a default client is created.
 * @param metadata - Metadata to associate with all traces.
 * @param tags - Tags to associate with all traces.
 * @param projectName - LangSmith project to trace to.
 * @param name - Name of the root trace.
 *
 * @example
 * ```typescript
 * import { Agent, Runner, function_tool, setTraceProcessors } from "@openai/agents";
 * import { OpenAIAgentsTracingProcessor } from "langsmith/wrappers/openai_agents";
 *
 * setTraceProcessors([new OpenAIAgentsTracingProcessor()]);
 *
 * const getWeather = function_tool({
 *   name: "get_weather",
 *   description: "Get the weather for a city",
 *   parameters: { type: "object", properties: { city: { type: "string" } } },
 *   run: async ({ city }: { city: string }) => `The weather in ${city} is sunny`,
 * });
 *
 * const agent = new Agent({
 *   name: "Assistant",
 *   instructions: "You are a helpful assistant",
 *   model: "gpt-4.1-mini",
 *   tools: [getWeather],
 * });
 *
 * const result = await Runner.run(agent, "What's the weather in New York?");
 * console.log(result.finalOutput);
 * ```
 */
export declare class OpenAIAgentsTracingProcessor implements TracingProcessor {
    private client;
    private _metadata?;
    private _tags?;
    private _projectName?;
    private _name?;
    private _firstResponseInputs;
    private _lastResponseOutputs;
    private _runs;
    private _spanDataTypes;
    private _unpostedTraces;
    private _unpostedSpans;
    private _previousStoreByTrace;
    private _previousStoreBySpan;
    constructor(options?: {
        client?: Client;
        metadata?: Record<string, unknown>;
        tags?: string[];
        projectName?: string;
        name?: string;
    });
    onTraceStart(trace: Trace): Promise<void>;
    onTraceEnd(trace: Trace): Promise<void>;
    onSpanStart(span: Span): Promise<void>;
    onSpanEnd(span: Span): Promise<void>;
    private _maybePostTrace;
    shutdown(): Promise<void>;
    forceFlush(): Promise<void>;
}
export {};
