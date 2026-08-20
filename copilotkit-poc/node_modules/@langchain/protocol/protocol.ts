// ==========================================================================
// LangGraph Agent Streaming Protocol — Unified CDDL Schema
// Concise Data Definition Language (RFC 8610) specification for the
// LangGraph Agent Streaming Protocol. This file is the single source
// of truth from which TypeScript, Python, and Java types are generated.
// This specification unifies two protocol perspectives:
// 1. In-process protocol — content-block-centric, layered event model
// with typed lifecycle semantics (start/delta/finish) at each
// abstraction level (chat model, tool, graph, agent).
// 2. Streaming protocol — thread-centric design with connection-scoped
// event filtering, hierarchical namespace scoping, and multi-transport
// support (WebSocket, SSE, in-process).
// The result is a single protocol where:
// - Content blocks are the universal carrier for LLM output
// - Content block deltas have explicit append/merge semantics
// - Events have full lifecycle semantics (no inferred boundaries)
// - Namespace-based filtering provides server-side routing
// - Threads are the primary routing key across all transports
// Status: DRAFT
// Version: 0.0.13
// ==========================================================================
// ==========================================================================
// 1. Shared Primitives
// ==========================================================================
// JavaScript safe integer range
export type JsInt = number;

// Hierarchical path identifying a position in the agent tree.
// [] = root agent, ["agent_1"] = direct child, ["agent_1", "researcher"] = nested.
export type JsUint = number;

// Allows additional text-keyed fields for forward compatibility.
export type Namespace = string[];

// Milliseconds since Unix epoch.
export type Extensible = Record<string, any>;

// Flat scalar value used by concise metadata bags.
export type Timestamp = number;

// Author role for a transcript message on the messages channel.
export type MetadataScalar = null | boolean | number | number | string;

// Concise provider/model metadata for a streamed message.
// This is not a general-purpose tracing/debug payload.
// Implementations SHOULD NOT include large nested objects, arrays,
// version maps, or runtime internals here.
export type MessageRole = "ai" | "human" | "system";

// ==========================================================================
// 2. Content Block Types
// LangChain content blocks are the universal carrier for model output.
// The block's `type` field is the discriminant. New content block
// types automatically work with the streaming protocol without protocol
// changes by using BlockDelta for incremental field updates.
// "Chunk" variants (ToolCallChunk, ServerToolCallChunk) carry
// partial/incremental data during streaming. "Standard" variants carry
// finalized data. ContentBlockFinish events upgrade chunks to their
// standard counterparts (e.g. ToolCallChunk -> ToolCall).
// ==========================================================================
export interface MessageMetadata {
  provider?: string;
  model?: string;
  model_type?: string;
  run_id?: string;
  thread_id?: string;
  system_fingerprint?: string;
  service_tier?: string;
  [key: string]: MetadataScalar | undefined;
}

// Union of all multimodal data content block types.
export type ContentBlock = TextContentBlock | InvalidToolCall | ReasoningContentBlock | NonStandardContentBlock | DataContentBlock | ToolContentBlock;

// Union of all tool-related content block types (chunk and finalized).
export type DataContentBlock = ImageContentBlock | VideoContentBlock | AudioContentBlock | FileContentBlock;

// Finalized content blocks (non-chunk types). Used in content-block-finish.
export type ToolContentBlock = ToolCall | ToolCallChunk | ServerToolCall | ServerToolCallChunk | ServerToolResult;

// Index of a block in an aggregate response. Used during streaming.
export type FinalizedContentBlock = TextContentBlock | ReasoningContentBlock | ToolCall | InvalidToolCall | ServerToolCall | ServerToolResult | DataContentBlock | NonStandardContentBlock;

export type BlockIndex = JsInt | string;

export type TextContentBlock = Extensible & {
  type: string;
  text: string;
  id?: string;
  index?: BlockIndex;
  annotations?: Annotation[];
};

export type Annotation = Citation | NonStandardAnnotation;

export type Citation = Extensible & {
  type: "citation";
  id?: string;
  url?: string;
  title?: string;
  start_index?: number;
  end_index?: number;
  cited_text?: string;
};

export type NonStandardAnnotation = Extensible & {
  type: "non_standard_annotation";
  id?: string;
  value: Record<string, any>;
};

export type ReasoningContentBlock = Extensible & {
  type: "reasoning";
  reasoning?: string;
  id?: string;
  index?: BlockIndex;
};

export type ToolCall = Extensible & {
  type: "tool_call";
  id: string | null;
  name: string;
  args: Record<string, any>;
  index?: BlockIndex;
};

export type ToolCallChunk = Extensible & {
  type: "tool_call_chunk";
  id: string | null;
  name: string | null;
  /**
   * Partial JSON string
   */
  args: string | null;
  index?: BlockIndex;
};

export type InvalidToolCall = Extensible & {
  type: "invalid_tool_call";
  id: string | null;
  name: string | null;
  args: string | null;
  error: string | null;
  index?: BlockIndex;
};

export type ServerToolCall = Extensible & {
  type: "server_tool_call";
  id: string;
  name: string;
  args: Record<string, any>;
  index?: BlockIndex;
};

export type ServerToolCallChunk = Extensible & {
  type: "server_tool_call_chunk";
  id?: string;
  name?: string;
  args?: string;
  index?: BlockIndex;
};

export type ServerToolResult = Extensible & {
  type: "server_tool_result";
  tool_call_id: string;
  status: "success" | "error";
  id?: string;
  output?: any;
  index?: BlockIndex;
};

export type ImageContentBlock = Extensible & {
  type: "image";
  id?: string;
  file_id?: string;
  url?: string;
  /**
   * Base64-encoded image data
   */
  base64?: string;
  mime_type?: string;
  index?: BlockIndex;
};

export type AudioContentBlock = Extensible & {
  type: "audio";
  id?: string;
  file_id?: string;
  url?: string;
  /**
   * Base64-encoded audio data
   */
  base64?: string;
  mime_type?: string;
  index?: BlockIndex;
};

export type VideoContentBlock = Extensible & {
  type: "video";
  id?: string;
  file_id?: string;
  url?: string;
  /**
   * Base64-encoded video data
   */
  base64?: string;
  mime_type?: string;
  index?: BlockIndex;
};

// Provider-specific escape hatch for content blocks not modeled above.
export type FileContentBlock = Extensible & {
  type: "file";
  id?: string;
  file_id?: string;
  url?: string;
  /**
   * Base64-encoded file data
   */
  base64?: string;
  mime_type?: string;
  index?: BlockIndex;
};

// Explicit incremental updates for content blocks.
// TextDelta, ReasoningDelta, and DataDelta append to their named fields.
// BlockDelta shallow-merges `fields` onto the accumulated content block.
// Producers should use DataDelta for streamed base64 chunks in image,
// audio, video, or file blocks. Use BlockDelta for tool-call argument
// streaming, provider signatures, citations, compaction markers, and
// future block fields without dedicated append semantics.
export type NonStandardContentBlock = Extensible & {
  type: "non_standard";
  value: Record<string, any>;
  id?: string;
  index?: BlockIndex;
};

export type TextDelta = Extensible & {
  type: "text-delta";
  text: string;
};

export type ReasoningDelta = Extensible & {
  type: "reasoning-delta";
  reasoning: string;
};

// One-layer patch for the currently active content block.
// `type` identifies the content block type whose fields are being
// updated; all other keys are shallow-merged onto the accumulated block.
export type DataDelta = Extensible & {
  type: "data-delta";
  /**
   * Encoded data chunk to append
   */
  data: string;
  /**
   * Defaults to base64 when absent
   */
  encoding?: "base64";
};

export interface BlockDeltaFields {
  type: string;
  [key: string]: any | undefined;
}

export type BlockDelta = Extensible & {
  type: "block-delta";
  fields: BlockDeltaFields;
};

// ==========================================================================
// 3. Top-Level Message Framing
// Three message types flow over the connection:
// Command         — client -> server
// CommandResponse — server -> client (success)
// ErrorResponse   — server -> client (failure)
// Event           — server -> client (unsolicited push)
// ==========================================================================
// --- Client -> Server ---
export type ContentBlockDelta = TextDelta | ReasoningDelta | DataDelta | BlockDelta;

export type Command = CommandData & Extensible & {
  id: JsUint;
};

// --- Server -> Client ---
export type CommandData = RunCommand | SubscriptionCommand | AgentCommand | InputCommand | StateCommand;

export type Message = CommandResponse | ErrorResponse | Event;

export type CommandResponse = Extensible & {
  type: "success";
  id: JsUint;
  result: ResultData;
  meta?: ResponseMeta;
};

export type ErrorResponse = Extensible & {
  type: "error";
  id: JsUint | null;
  error: ErrorCode;
  message: string;
  stacktrace?: string;
  meta?: ResponseMeta;
};

// --- Result / Error enums ---
export type Event = EventData & Extensible & {
  type: "event";
  /**
   * Unique ID for reconnection (maps to SSE id:)
   */
  event_id?: string;
  /**
   * Monotonic sequence number for ordering
   */
  seq?: JsUint;
};

export type ResultData = RunResult | SubscriptionResult | AgentResult | InputResult | StateResult | EmptyResult;
export type EmptyResult = Extensible;
export type ErrorCode = "invalid_argument" | "unknown_command" | "unknown_error" | "no_such_run" | "no_such_subscription" | "no_such_namespace" | "no_such_interrupt" | "no_such_checkpoint" | "permission_denied" | "not_supported";

// ==========================================================================
// 4. Thread-Centric Model
// The protocol is thread-centric: threads are the primary routing key
// for commands, events, and subscriptions. There is no session handshake
// or server-side session state.
// Thread IDs may be client-generated (UUID) or server-assigned. The
// server creates the thread lazily on the first `run.start` if it does
// not already exist.
// Transport endpoints:
// **SSE/HTTP:**
// POST /threads/:thread_id/stream   — filtered SSE event stream
// POST /threads/:thread_id/commands  — JSON command request/response
// **WebSocket:**
// ws://.../threads/:thread_id/stream — full-duplex connection
// Subscription model varies by transport:
// **SSE/HTTP:** Subscriptions are connection-scoped. Each
// `POST .../events` request carries its own filter (channels, namespaces,
// depth) and the server streams matching events for the lifetime of that
// connection. Closing the connection unsubscribes. No subscription state
// is persisted on the server. Event streams can be opened before or after
// `run.start`; streams opened before a run exists stay idle until events
// are produced.
// **WebSocket:** Subscriptions are managed via in-band
// `subscription.subscribe` and `subscription.unsubscribe` commands on
// the single bidirectional connection. Subscriptions persist across run
// boundaries and are removed by explicit `subscription.unsubscribe` or
// when the WebSocket connection is closed.
// Multiple connections may observe the same thread concurrently, each
// with independent event filters. The thread is the durable identity
// (checkpoint, state, run history); each connection is an ephemeral
// transport scope for what a particular consumer sees.
// Cleanup is implicit: when the run completes and all connections close,
// the server drops ephemeral in-memory state (event buffer, run session).
// The thread itself persists in the checkpoint store.
// ==========================================================================
// ==========================================================================
// 4a. Run Module
// `run.start` is the single entry point for all input to the graph.
// The thread manages a state machine:
// - No active run  → starts a new run with the provided input
// - Run interrupted → resumes with the input as the resume value
// - Run active      → injects input into the running graph
// The `assistantId` field identifies which deployed graph or agent to
// run on this thread. It replaces session-level target binding.
// ==========================================================================
export type ResponseMeta = Extensible & {
  applied_through_seq?: JsUint;
};

export type RunCommand = RunStart;

export interface RunStart {
  method: "run.start";
  params: RunStartParams;
}

export interface RunStartParams {
  /**
   * Deployed graph/agent to run
   */
  assistant_id: string;
  /**
   * Graph input, resume value, or injected message
   */
  input: any;
  /**
   * Per-run config overrides
   */
  config?: Record<string, any>;
  /**
   * Per-run metadata
   */
  metadata?: Record<string, any>;
}

// ==========================================================================
// 5. Channels
// Each channel corresponds to a subscribable event stream. Clients
// include channel names in event stream filters or subscription commands
// to select which event types to receive.
// ==========================================================================
export interface RunResult {
  /**
   * ID of the started or resumed run
   */
  run_id?: string;
}

// Namespaced custom channels (e.g. "custom:my-events")
// ==========================================================================
// 6. Subscription & Event Streaming
// The protocol supports two subscription models depending on transport:
// **SSE/HTTP transport (connection-scoped subscriptions):**
// Clients open one or more `POST /threads/:thread_id/stream` requests,
// each carrying an `EventStreamRequest` body with the desired channel
// and namespace filters. The server responds with an SSE stream
// filtered to match. Each connection IS the subscription — closing
// the connection unsubscribes. No subscription state is persisted on
// the server beyond the lifetime of the TCP connection.
// Multiple concurrent event streams are supported. Each stream
// independently filters the same underlying event source. Clients
// may bundle multiple channels into one connection or open dedicated
// connections per channel.
// **WebSocket transport (in-band command subscriptions):**
// WebSocket connections use `subscription.subscribe` and
// `subscription.unsubscribe` as in-band commands on the single
// bidirectional connection. Subscriptions persist across run
// boundaries and are removed by explicit `subscription.unsubscribe`
// or when the connection is closed.
// **Replay / reconnection:**
// For SSE/HTTP, the `EventStreamRequest` includes an optional `since`
// field (sequence number). The server replays matching events from its
// ring buffer starting after that sequence, then switches to live
// delivery. For WebSocket, `subscription.reconnect` serves the same
// purpose.
// ==========================================================================
// --- Event stream request (SSE/HTTP transport only) ---
// Sent as the JSON body of `POST /threads/:thread_id/stream`.
// The server responds with `Content-Type: text/event-stream`.
export type Channel = "values" | "updates" | "messages" | "tools" | "lifecycle" | "input" | "checkpoints" | "tasks" | "custom" | `custom:${string}`;

// --- WebSocket-only subscription commands ---
export type EventStreamRequest = Extensible & {
  channels: Channel[];
  /**
   * Prefix-match these namespace paths
   */
  namespaces?: Namespace[];
  /**
   * Max depth below namespace prefix
   */
  depth?: number;
  /**
   * Replay events after this seq number
   */
  since?: JsUint;
};

export type SubscriptionCommand = SubscriptionSubscribe | SubscriptionUnsubscribe | SubscriptionReconnect;

export interface SubscriptionSubscribe {
  method: "subscription.subscribe";
  params: SubscribeParams;
}

export type SubscribeParams = Extensible & {
  channels: Channel[];
  /**
   * Prefix-match these namespace paths
   */
  namespaces?: Namespace[];
  /**
   * Max depth below namespace prefix
   */
  depth?: number;
};

export type SubscribeResult = Extensible & {
  subscription_id: string;
  /**
   * Events replayed from buffer
   */
  replayed_events?: number;
};

export interface SubscriptionUnsubscribe {
  method: "subscription.unsubscribe";
  params: UnsubscribeParams;
}

export type UnsubscribeParams = Extensible & {
  subscription_id: string;
};

export interface SubscriptionReconnect {
  method: "subscription.reconnect";
  params: ReconnectParams;
}

export type ReconnectParams = Extensible & {
  run_id: string;
  /**
   * Last event the client processed
   */
  last_event_id?: string;
  /**
   * Subscription IDs to restore
   */
  subscriptions?: string[];
};

export type ReconnectResult = Extensible & {
  restored: boolean;
  missed_events?: number;
  current_namespaces?: AgentStatusEntry[];
};

export type AgentStatusEntry = Extensible & {
  namespace: Namespace;
  status: AgentStatus;
};

// ==========================================================================
// 7. Agent / Lifecycle Module
// Hierarchy discovery and lifecycle tracking. The lifecycle channel
// tracks the status of every namespace in the agent tree and provides
// parent→child correlation for subgraph discovery via the `cause`
// field on `started` events.
// See proposal §17 (Channel Architecture) for the design rationale.
// ==========================================================================
export type SubscriptionResult = SubscribeResult | ReconnectResult | EmptyResult;

// --- agent.getTree ---
export type AgentCommand = AgentGetTree;

export interface AgentGetTree {
  method: "agent.getTree";
  params: AgentGetTreeParams;
}

export interface AgentGetTreeParams {
  run_id?: string;
}

export interface AgentTreeNode {
  namespace: Namespace;
  status: AgentStatus;
  graph_name: string;
  children?: AgentTreeNode[];
  metadata?: Record<string, any>;
}

export interface AgentResult {
  tree: AgentTreeNode;
}

// --- Event registry ---
// All server -> client events are registered here as a group choice.
export type AgentStatus = "started" | "running" | "completed" | "failed" | "interrupted";

// --- Lifecycle events (server -> client, channel: "lifecycle") ---
// Lifecycle events track the status of the root run and all subgraphs.
// The optional `cause` field on `started` events correlates a child
// namespace back to whatever on the parent namespace triggered it,
// enabling over-the-wire clients to reconstruct the subgraph tree
// without product-specific knowledge.
export type EventData = LifecycleEvent | MessagesEvent | ToolsEvent | InputEvent | ValuesEvent | UpdatesEvent | CheckpointsEvent | CustomEvent | TasksEvent;

// Causation edge for a subgraph's `started` lifecycle event.
// Identifies what on the parent namespace caused this subgraph to
// start. Populated by product-specific stream transformers (e.g.
// deepagents' SubagentTransformer) before events reach the wire.
// langgraph core and langgraph-api are product-agnostic and do not
// populate this field. Optional — absent for the root graph and
// for subgraphs whose spawning mechanism isn't yet modelled.
// Extensible via new variants; consumers MUST default-case unknown
// `type` values to "unknown cause" rather than erroring, so future
// additions don't break pinned clients.
export interface LifecycleEvent {
  method: "lifecycle";
  params: {
    namespace: Namespace;
    timestamp: Timestamp;
    data: LifecycleData;
  };
}

// A tool call on the parent namespace spawned this subgraph.
// How it's produced in code:
// A tool node's handler body invokes a compiled subgraph — e.g.
// `await subagent.ainvoke(...)` or `subagent.astream(...)` from
// inside a `@tool`-decorated function. Deepagents' `task` tool
// is the canonical example: it calls `subagent.ainvoke(input)`
// to execute a nested agent, and each call becomes one subgraph
// run correlated back to the originating `tool_call_id`.
// Populated by: product-specific stream transformer (e.g.
// deepagents' SubagentTransformer / createSubagentTransformer).
export type LifecycleCause = LifecycleCauseToolCall | LifecycleCauseSend | LifecycleCauseEdge;

// A `Send` dispatched from a parent node spawned this subgraph.
// How it's produced in code:
// A parent node returns/yields one or more `Send(node, state)`
// objects (langgraph's fan-out primitive). Each `Send` creates a
// parallel pregel task; when the target node embeds a compiled
// subgraph, each `Send` instance spawns its own subgraph run.
// Typical in supervisor/worker patterns where the supervisor
// yields `Send("worker", work_item)` once per item.
// Populated by: (no transformer in current releases; declared for
// future supervisor-pattern transformers to emit).
export interface LifecycleCauseToolCall {
  /**
   * The `tool_call_id` from the originating `tool-started` event
   */
  type: "toolCall";
  /**
   * on the parent namespace. Matches the `id` field of the
   * originating `tool_call` content block in the parent AI message.
   */
  tool_call_id: string;
}

// A graph edge transitioned into this subgraph's entry node.
// How it's produced in code:
// A static edge (`graph.add_edge("a", "b")`) or a conditional
// edge (`graph.add_conditional_edges("a", router_fn)`) routes
// control into a node that embeds a compiled subgraph. Unlike
// `Send`, edge transitions are single-successor and do not
// fan out — one edge traversal produces exactly one subgraph run.
// Populated by: (no transformer in current releases; declared for
// future embedded-subgraph transformers to emit).
export interface LifecycleCauseSend {
  /**
   * Name of the parent node that issued the `Send`. Multiple Sends
   */
  type: "send";
  /**
   * from the same node in the same superstep share this value;
   * future protocol versions may add a disambiguating `sendIndex`
   * if per-Send identity is needed on the wire.
   */
  from_node: string;
}

export interface LifecycleCauseEdge {
  /**
   * Name of the parent node the edge originated from.
   */
  type: "edge";
  from_node: string;
}

// ==========================================================================
// 8. Messages Module
// Content-block-centric transcript message streaming. AI-authored messages
// may stream incrementally; human/system messages are typically replayed
// as complete messages. Events follow a strict lifecycle:
// message-start
// -> content-block-start(index=0, contentBlock)
// -> content-block-delta(index=0, delta) ...
// -> content-block-finish(index=0, contentBlock)
// -> content-block-start(index=1, contentBlock)
// -> content-block-delta(index=1, delta) ...
// -> content-block-finish(index=1, contentBlock)
// -> message-finish(reason)
// Content blocks MUST NOT interleave: block N must finish before block
// N+1 starts. This constraint applies within a single message
// (identified by namespace + node) and matches observed behavior of
// all major LLM providers.
// Delta events carry explicit delta variants:
// - text-delta appends to the active block's `text` field
// - reasoning-delta appends to the active block's `reasoning` field
// - data-delta appends to the active block's `base64` field
// - block-delta shallow-merges `fields` onto the active block
// ==========================================================================
export interface LifecycleData {
  event: AgentStatus;
  graph_name?: string;
  /**
   * Causation edge (see LifecycleCause)
   */
  cause?: LifecycleCause;
  error?: string;
  /**
   * Checkpoint reference for time-travel
   */
  checkpoint?: CheckpointRef;
}

export interface MessagesEvent {
  method: "messages";
  params: {
    namespace: Namespace;
    timestamp: Timestamp;
    /**
     * Graph node that produced this event
     */
    node?: string;
    data: MessagesData;
  };
}

// Emitted once at the start of a streamed or replayed transcript message.
export type MessagesData = MessageStartData | ContentBlockStartData | ContentBlockDeltaData | ContentBlockFinishData | MessageFinishData | MessageErrorData;

// Emitted when a new content block begins streaming. The contentBlock
// carries the initial state (e.g. { type: "text", text: "" } or
// { type: "tool_call_chunk", name: "search", args: "" }).
export type MessageStartData = Extensible & {
  event: "message-start";
  /**
   * Author role for this message
   */
  role: MessageRole;
  /**
   * Unique ID for this message
   */
  id: string;
  /**
   * Concise provider/model metadata for AI messages
   */
  metadata?: MessageMetadata;
};

// Emitted for each incremental update within a content block:
// { type: "text-delta", text: "Hello " }                 — append text
// { type: "reasoning-delta", reasoning: "Let me" }       — append reasoning
// { type: "data-delta", data: "UklGR..." }               — append base64 data
// { type: "block-delta", fields: { type: "tool_call_chunk", args: '{"q":' } }
// — shallow merge fields
export type ContentBlockStartData = Extensible & {
  event: "content-block-start";
  /**
   * Positional index within the message
   */
  index: number;
  content: ContentBlock;
};

// Emitted when a content block is complete. The contentBlock carries
// the finalized block. For tool calls, this upgrades ToolCallChunk
// to ToolCall with parsed args.
export type ContentBlockDeltaData = Extensible & {
  event: "content-block-delta";
  index: number;
  delta: ContentBlockDelta;
};

// Emitted once when the message is complete.
export type ContentBlockFinishData = Extensible & {
  event: "content-block-finish";
  index: number;
  content: FinalizedContentBlock;
};

export type MessageFinishData = Extensible & {
  event: "message-finish";
  /**
   * Token usage for AI-authored messages
   */
  usage?: UsageInfo;
};

// Emitted on unrecoverable errors within a model call.
export type UsageInfo = Extensible & {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
};

// ==========================================================================
// 9. Tools Module
// Tool execution lifecycle observability. Events cover the full
// lifecycle of a tool invocation:
// tool-started(toolCallId, toolName)
// -> tool-output-delta(toolCallId, delta) ...  (optional, streaming tools)
// -> tool-finished(toolCallId, output)
// | tool-error(toolCallId, message)
// ==========================================================================
export type MessageErrorData = Extensible & {
  event: "error";
  message: string;
  code?: string;
};

export interface ToolsEvent {
  method: "tools";
  params: {
    namespace: Namespace;
    timestamp: Timestamp;
    /**
     * Graph node executing the tool
     */
    node?: string;
    data: ToolsData;
  };
}

// Emitted when tool execution begins.
export type ToolsData = ToolStartedData | ToolOutputDeltaData | ToolFinishedData | ToolErrorData;

// Emitted for incremental tool output (for tools that stream results).
export type ToolStartedData = Extensible & {
  event: "tool-started";
  tool_call_id: string;
  tool_name: string;
  /**
   * Tool input arguments
   */
  input?: any;
};

// Emitted when tool execution completes successfully.
export type ToolOutputDeltaData = Extensible & {
  event: "tool-output-delta";
  tool_call_id: string;
  delta: string;
};

// Emitted when tool execution fails.
export type ToolFinishedData = Extensible & {
  event: "tool-finished";
  tool_call_id: string;
  output: any;
};

// ==========================================================================
// 10. Input Module
// Human-in-the-loop. Wraps LangGraph's interrupt() / Command({ resume })
// as in-band protocol messages. Also supports unsolicited user input
// injection while the agent is running.
// ==========================================================================
export type ToolErrorData = Extensible & {
  event: "tool-error";
  tool_call_id: string;
  message: string;
  code?: string;
};

// --- input.respond ---
export type InputCommand = InputRespond | InputInject;

// A respond command resolves either a single interrupt or several
// interrupts that are pending at the same checkpoint (e.g. parallel
// tool-authorization prompts). The batch form is required because
// sequential single resumes cannot do this: the first resume starts a
// run, leaving the remaining interrupts with no interrupted run to
// respond to.
export interface InputRespond {
  method: "input.respond";
  params: InputRespondParams;
}

// Single-interrupt resume.
export type InputRespondParams = InputRespondOne | InputRespondMany;

// Batch resume — one entry per interrupt, resumed in a single run.
export interface InputRespondOne {
  namespace: Namespace;
  interrupt_id: string;
  response: any;
  /**
   * Per-run config overrides
   */
  config?: Record<string, any>;
  /**
   * Per-run metadata
   */
  metadata?: Record<string, any>;
}

export interface InputRespondMany {
  responses: InputRespondEntry[];
  /**
   * Per-run config overrides
   */
  config?: Record<string, any>;
  /**
   * Per-run metadata
   */
  metadata?: Record<string, any>;
}

// --- input.inject ---
export interface InputRespondEntry {
  namespace: Namespace;
  interrupt_id: string;
  response: any;
}

export interface InputInject {
  method: "input.inject";
  params: InputInjectParams;
}

export interface InputInjectParams {
  namespace: Namespace;
  message: InputMessage;
}

export type InputMessage = Extensible & {
  role: "user" | "system";
  content: string;
  name?: string;
};

// --- Input events (server -> client, channel: "input") ---
export type InputResult = EmptyResult;

export interface InputEvent {
  method: "input.requested";
  params: {
    namespace: Namespace;
    timestamp: Timestamp;
    data: InputRequestedData;
  };
}

// ==========================================================================
// 11. State Module
// Graph state and checkpoint access. Enables state inspection and
// time-travel debugging (fork from checkpoint).
// Note: Cross-thread store operations (search, put) are accessed via
// the LangGraph REST API and are not part of the streaming protocol.
// ==========================================================================
export type InputRequestedData = Extensible & {
  /**
   * Correlates this request with input.respond
   */
  interrupt_id: string;
  /**
   * Opaque interrupt value from runtime; application-defined shape
   */
  payload: any;
};

// --- state.get ---
export type StateCommand = StateGet | StateListCheckpoints | StateFork;

export interface StateGet {
  method: "state.get";
  params: StateGetParams;
}

export interface StateGetParams {
  namespace: Namespace;
  /**
   * Specific state keys, or omit for all
   */
  keys?: string[];
}

// --- state.listCheckpoints ---
export interface StateGetResult {
  values: Record<string, any>;
  checkpoint?: CheckpointRef;
}

export interface StateListCheckpoints {
  method: "state.listCheckpoints";
  params: ListCheckpointsParams;
}

export interface ListCheckpointsParams {
  namespace?: Namespace;
  limit?: number;
  /**
   * Cursor for pagination
   */
  before?: string;
}

export interface ListCheckpointsResult {
  checkpoints: CheckpointSummary[];
}

export interface CheckpointSummary {
  id: string;
  /**
   * ISO 8601
   */
  timestamp: string;
  step: number;
  /**
   * Node that produced this checkpoint
   */
  node_name?: string;
  metadata?: Record<string, any>;
}

// --- state.fork ---
export interface CheckpointRef {
  id: string;
  ns?: string;
}

export interface StateFork {
  method: "state.fork";
  params: StateForkParams;
}

export interface StateForkParams {
  checkpoint_id: string;
  /**
   * Input for the forked run
   */
  input?: any;
  /**
   * Config overrides
   */
  config?: Record<string, any>;
}

export interface StateForkResult {
  run_id: string;
  thread_id: string;
}

// ==========================================================================
// 12. Passthrough Channels
// These channels carry payloads shaped by the LangGraph runtime and
// user graph schemas. Their data shapes are intentionally open
// because they depend on the user's graph state definition.
// The `values` channel doubles as the "values snapshot" mechanism:
// when a subscription is created, the first event replayed is the
// current full state, giving consumers a consistent baseline to
// apply subsequent deltas against.
// The `checkpoints` channel carries a lightweight envelope (id,
// parentId, step, source) emitted once per persisted checkpoint.
// Clients reconstruct a branching/time-travel history from this
// metadata alone — the envelope provides the fork target (`id`),
// tree linkage (`parentId`), and timeline sort/label (`step`,
// `source`). Full channel state is retrieved lazily via `state.get`
// or bulk via `state.listCheckpoints`, only for the checkpoints the
// client actually inspects. Clients that want state snapshots
// alongside the timeline subscribe to both `values` and
// `checkpoints`; clients that only need timeline metadata pay only
// the envelope cost.
// ==========================================================================
// --- values (channel: "values") ---
// Full graph state after each step or initial snapshot.
export type StateResult = StateGetResult | ListCheckpointsResult | StateForkResult | EmptyResult;

// --- checkpoints (channel: "checkpoints") ---
// Lightweight checkpoint metadata emitted once per persisted
// checkpoint. Carries only the envelope needed to build a
// branching/time-travel UI and to target `state.fork`; full
// channel state is retrieved on demand via `state.get` /
// `state.listCheckpoints`.
// A `checkpoints` event is emitted on the same superstep as the
// corresponding `values` event; clients that subscribe to both can
// correlate the pair by (namespace, step) or by adjacent `seq`
// numbers on the outer event envelope.
export interface ValuesEvent {
  method: "values";
  params: {
    namespace: Namespace;
    timestamp: Timestamp;
    /**
     * Full graph state after step
     */
    data: any;
  };
}

// Lightweight checkpoint envelope. Supplies just enough metadata
// for clients to build a branching/time-travel UI without streaming
// full channel snapshots.
export interface CheckpointsEvent {
  method: "checkpoints";
  params: {
    namespace: Namespace;
    timestamp: Timestamp;
    data: Checkpoint;
  };
}

// Origin tag matching LangGraph's CheckpointMetadata.source.
export type Checkpoint = Extensible & {
  /**
   * Fork target: pass to state.fork / configurable.checkpoint_id
   */
  id: string;
  /**
   * Parent checkpoint id for tree linkage
   */
  parent_id?: string;
  /**
   * Superstep number (-1 for first input, 0 for first loop step, ...)
   */
  step: number;
  /**
   * Origin of the checkpoint
   */
  source: CheckpointSource;
};

// Created as a copy of another checkpoint
// --- updates (channel: "updates") ---
// Per-node state deltas.
export type CheckpointSource = "input" | "loop" | "update" | "fork";

export interface UpdatesEvent {
  method: "updates";
  params: {
    namespace: Namespace;
    timestamp: Timestamp;
    data: UpdatesData;
  };
}

// --- custom (channel: "custom") ---
// User-defined payloads emitted via config.writer / getWriter().
export type UpdatesData = Extensible & {
  /**
   * Graph node that produced this update
   */
  node?: string;
  /**
   * State delta
   */
  values: Record<string, any>;
};

export interface CustomEvent {
  method: "custom";
  params: {
    namespace: Namespace;
    timestamp: Timestamp;
    data: CustomData;
  };
}

// --- tasks (channel: "tasks") ---
// Pregel task creation or result events from the graph runtime.
export type CustomData = Extensible & {
  /**
   * Custom event name for dispatch
   */
  name?: string;
  /**
   * User-defined payload
   */
  payload: any;
};

export interface TasksEvent {
  method: "tasks";
  params: {
    namespace: Namespace;
    timestamp: Timestamp;
    /**
     * Task creation or result
     */
    data: any;
  };
}
