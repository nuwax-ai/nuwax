/**
 * CopilotKit Runtime Server - nuwax real-model bridge
 *
 * Bridges CopilotKit AG-UI protocol <-> nuwax real SSE backend.
 *
 * Modes:
 *   USE_MOCK=true  (default): simulated streaming responses
 *   USE_MOCK=false: bridges to the real nuwax /api/agent/conversation/chat SSE endpoint
 *
 * AG-UI <-> nuwax General Chat event mapping:
 *   TEXT_MESSAGE_CONTENT   <-> MESSAGE.type=CHAT/ANSWER, data.text
 *   REASONING_MESSAGE_*    <-> MESSAGE.type=THINK, data.text
 *   TOOL_CALL_*            <-> PROCESSING events
 *   RUN_FINISHED           <-> FINAL_RESULT
 */
import express from 'express';
import cors from 'cors';
import { EventType } from '@ag-ui/client';
import { BuiltInAgent, CopilotRuntime, InMemoryAgentRunner } from '@copilotkit/runtime/v2';
import { createCopilotExpressHandler } from '@copilotkit/runtime/v2/express';
import { randomUUID } from 'crypto';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth header extraction middleware: reads nuwax auth from custom headers
// and injects it into the request body so the agent factory can access it
app.use((req, _res, next) => {
  const nuwaxToken = req.headers['x-nuwax-token'] as string;
  const nuwaxConversationId = req.headers['x-nuwax-conversationid'] as string;
  const nuwaxModelId = req.headers['x-nuwax-modelid'] as string;
  const nuwaxAgentMode = req.headers['x-nuwax-agentmode'] as string;

  if (req.url.includes('copilotkit') && req.method === 'POST') {
    console.log(`[Auth] Headers: token=${nuwaxToken ? 'present' : 'MISSING'}, convId=${nuwaxConversationId}, modelId=${nuwaxModelId}, agentMode=${nuwaxAgentMode}`);
  }

 if (nuwaxToken || nuwaxConversationId) {
   // Inject into body.state so the agent factory picks it up via input.state
   if (req.body && typeof req.body === 'object') {
     if (!req.body.state || typeof req.body.state !== 'object') req.body.state = {};
     if (nuwaxToken) req.body.state.authToken = nuwaxToken;
     if (nuwaxConversationId) req.body.state.conversationId = Number(nuwaxConversationId);
     if (nuwaxModelId) req.body.state.selectedModelId = Number(nuwaxModelId);
     if (nuwaxAgentMode) req.body.state.agentMode = nuwaxAgentMode;
   }
 }
  next();
});

// Request logging middleware
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' && req.body) {
    const bodyPreview = JSON.stringify(req.body).slice(0, 500);
    console.log(`  Body: ${bodyPreview}`);
  }
  next();
});

// ---------------------------------------------------------------------------
// Single-route compatibility shim: the CopilotKit v2 client auto-detects
// transport. When REST detection fails it falls back to the single-route JSON
// envelope (POST /api/copilotkit {method:"info",...}). The multi-route express
// handler doesn't register POST /api/copilotkit directly, so this shim rewrites
// those envelope requests into internal multi-route calls.
// ---------------------------------------------------------------------------
app.use(async (req: any, _res: express.Response, next: express.NextFunction) => {
  if (req.method !== 'POST' || req.url !== '/api/copilotkit') return next();
  if (!req.body || typeof req.body !== 'object' || !req.body.method) return next();

  const { method, params, body: innerBody } = req.body;
  console.log(`[SingleRouteShim] Intercepted method="${method}"`);

  if (method === 'info') {
    req.method = 'GET';
    req.url = '/api/copilotkit/info';
    return next();
  }

  if ((method === 'agent/run' || method === 'agent/connect') && params?.agentId) {
    req.url = `/api/copilotkit/agent/${encodeURIComponent(params.agentId)}/${method === 'agent/run' ? 'run' : 'connect'}`;
    if (innerBody !== undefined) req.body = innerBody;
    return next();
  }

  if (method === 'agent/stop' && params?.agentId) {
    req.url = `/api/copilotkit/agent/${encodeURIComponent(params.agentId)}/stop/${encodeURIComponent(params.threadId || '')}`;
    return next();
  }

  next();
});

const NUWAX_BACKEND = process.env.NUWAX_BACKEND || 'https://testagent.xspaceagi.com';
const USE_MOCK = process.env.USE_MOCK !== 'false';

// ---------------------------------------------------------------------------
// SSE stream parser: reads a fetch Response body, yields parsed JSON events
// Handles both fetch-event-source format (data: lines) and raw NDJSON
// ---------------------------------------------------------------------------
async function* sseEventGenerator(
  res: Response,
): AsyncGenerator<{ data: any }> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload);
        yield { data: parsed };
      } catch {
        /* skip malformed */
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Extract last user text from CopilotKit input messages
// ---------------------------------------------------------------------------
function extractUserText(messages: any[]): string {
  const lastMsg = messages[messages.length - 1];
  if (!lastMsg) return '';
  if (Array.isArray(lastMsg.content)) {
    return lastMsg.content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join(' ');
  }
  return typeof lastMsg.content === 'string' ? lastMsg.content : '';
}

// ---------------------------------------------------------------------------
// The agent: chooses mock or real-backend mode
// ---------------------------------------------------------------------------
const agent = new BuiltInAgent({
  type: 'custom',
  factory: ({ input }) => {
  return (async function* () {
      const threadId = input.threadId || 'default';
      const runId = input.runId || randomUUID();
      const tools = input.tools || [];
      const state = input.state || {};
      const userText = extractUserText(input.messages || []);

      // useCopilotReadable data arrives as input.context entries: [{ description, value }]
      // Merge all context values into a single state-like object
      const contextState: Record<string, any> = {};
      if (Array.isArray(input.context)) {
        for (const ctx of input.context) {
          if (ctx?.value && typeof ctx.value === 'object') {
            Object.assign(contextState, ctx.value);
          }
        }
      }
      // Auth headers take priority over context values
      const mergedState = { ...contextState, ...state };

      console.log(`\n=== AGENT INVOKED ===`);
      console.log(`  threadId: ${threadId}`);
      console.log(`  runId: ${runId}`);
      console.log(`  userText: "${userText.slice(0, 200)}"`);
      console.log(`  input.state keys: ${Object.keys(state).join(', ') || '(empty)'}`);
      console.log(`  context count: ${Array.isArray(input.context) ? input.context.length : 0}`);
      console.log(`  contextState keys: ${Object.keys(contextState).join(', ')}`);
      console.log(`  mergedState keys: ${Object.keys(mergedState).join(', ')}`);
      console.log(`  mergedState.conversationId: ${mergedState.conversationId}`);
      console.log(`  mergedState.authToken: ${mergedState.authToken ? '(present, ' + mergedState.authToken.slice(0, 20) + '...)' : '(MISSING)'}`);
      console.log(`  mergedState.selectedModelId: ${mergedState.selectedModelId}`);
      console.log(`  mergedState.agentMode: ${mergedState.agentMode}`);
      console.log(`  USE_MOCK: ${USE_MOCK}`);
      console.log(`  tools count: ${tools.length}`);
      console.log(`===\n`);

      if (USE_MOCK) {
        yield* mockResponse(userText, mergedState, tools, threadId, runId);
      } else {
        yield* nuwaxRealBridge(input, threadId, runId, mergedState);
      }
    })();
  },
});

// ---------------------------------------------------------------------------
// Mock response generator
// ---------------------------------------------------------------------------
async function* mockResponse(
  userText: string,
  state: any,
  _tools: any[],
  _threadId: string,
  _runId: string,
) {
  const reasoningId = randomUUID();
  yield { type: EventType.REASONING_MESSAGE_START, messageId: reasoningId, role: 'reasoning' };
  yield {
    type: EventType.REASONING_MESSAGE_CONTENT,
    messageId: reasoningId,
    delta: `Analyzing: "${userText.slice(0, 80)}"`,
  };
  yield { type: EventType.REASONING_MESSAGE_END, messageId: reasoningId };

  const messageId = randomUUID();
  yield { type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' };

  const responseText =
    `[Mock] Connected to conversation ${state?.conversationId || 'unknown'}, agent ${state?.agentName || 'N/A'}.\n\n` +
    `You said: "${userText}"\n\n` +
    `Set USE_MOCK=false to connect to the real nuwax backend.`;

  for (const word of responseText.split(/(\s+)/)) {
    yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: word };
    await new Promise((r) => setTimeout(r, 20));
  }
  yield { type: EventType.TEXT_MESSAGE_END, messageId };
}

// ---------------------------------------------------------------------------
// Real nuwax backend bridge: POST /api/agent/conversation/chat (SSE)
//
// nuwax returns ConversationChatResponse events:
//   { eventType, data, completed, error, requestId }
//
// MESSAGE.data: { text, type:'CHAT'|'THINK'|'QUESTION'|'ANSWER', finished, id }
// PROCESSING.data: { executeId, type, status, result }
// FINAL_RESULT.data: { success, outputText, error }
// ---------------------------------------------------------------------------
async function* nuwaxRealBridge(
  input: any,
  threadId: string,
  runId: string,
  mergedState?: Record<string, any>,
) {
  const state = mergedState || input.state || {};
  const userText = extractUserText(input.messages || []);
  const token = state?.authToken || process.env.NUWAX_TOKEN || '';
  const conversationId = state?.conversationId;
  const modelId = state?.selectedModelId;
  const agentMode = state?.agentMode || 'yolo';

  // Emit a synthetic reasoning message so the AG-UI reasoning panel is visible
  const synthReasoningId = randomUUID();
  yield { type: EventType.REASONING_MESSAGE_START, messageId: synthReasoningId, role: 'reasoning' };
  yield {
    type: EventType.REASONING_MESSAGE_CONTENT,
    messageId: synthReasoningId,
    delta: `正在连接到 Agent (会话 ${conversationId || '未知'})，准备分析您的请求...`,
  };

  console.log(`[Bridge] Using state: conversationId=${conversationId}, token=${token ? 'present' : 'MISSING'}, modelId=${modelId}, agentMode=${agentMode}`);

  if (!conversationId) {
    const errId = randomUUID();
    yield { type: EventType.REASONING_MESSAGE_END, messageId: synthReasoningId };
    yield { type: EventType.TEXT_MESSAGE_START, messageId: errId, role: 'assistant' };
    yield {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId: errId,
      delta: '[Bridge] No conversationId found in context state. Debug: context=' + JSON.stringify(Array.isArray(input.context) ? input.context.map(c => ({ description: c?.description, valueKeys: c?.value ? Object.keys(c.value) : [] })) : 'none'),
    };
    yield { type: EventType.TEXT_MESSAGE_END, messageId: errId };
    return;
  }

  if (!token) {
    const errId = randomUUID();
    yield { type: EventType.REASONING_MESSAGE_END, messageId: synthReasoningId };
    yield { type: EventType.TEXT_MESSAGE_START, messageId: errId, role: 'assistant' };
    yield {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId: errId,
      delta: 'Error: No auth token available. Please log in to nuwax first.',
    };
    yield { type: EventType.TEXT_MESSAGE_END, messageId: errId };
    return;
  }

  const chatBody = {
    conversationId: Number(conversationId),
    message: userText,
    attachments: [],
    debug: false,
    selectedComponents: [],
    skillIds: [],
    modelId: modelId ? Number(modelId) : undefined,
    agentMode,
  };

  console.log(`[Bridge] Sending to nuwax backend: POST ${NUWAX_BACKEND}/api/agent/conversation/chat`);
  console.log(`[Bridge] conversationId=${conversationId}, modelId=${modelId}, agentMode=${agentMode}`);
  console.log(`[Bridge] token present: ${!!token}`);
  console.log(`[Bridge] message: "${userText.slice(0, 200)}"`);

  const res = await fetch(`${NUWAX_BACKEND}/api/agent/conversation/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(chatBody),
  });

  // Close the synthetic reasoning and start a second one for real thinking
  yield { type: EventType.REASONING_MESSAGE_END, messageId: synthReasoningId };

  console.log(`[Bridge] Backend response: ${res.status} ${res.statusText}`);

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    const errId = randomUUID();
    yield { type: EventType.TEXT_MESSAGE_START, messageId: errId, role: 'assistant' };
    yield {
      type: EventType.TEXT_MESSAGE_CONTENT,
      messageId: errId,
      delta: `[Bridge error] Backend returned ${res.status} ${res.statusText}: ${errText.slice(0, 200)}`,
    };
    yield { type: EventType.TEXT_MESSAGE_END, messageId: errId };
    return;
  }

  let textMessageId: string | null = null;
  let reasoningId: string | null = null;

  let eventCount = 0;
  for await (const evt of sseEventGenerator(res)) {
    eventCount++;
    if (eventCount <= 10) {
      console.log(`[Bridge] SSE event #${eventCount}: ${JSON.stringify(evt.data).slice(0, 300)}`);
    }
    const res_data = evt.data;
    const eventType = res_data?.eventType;
    const msgData = res_data?.data;

    // MESSAGE event: streaming text/think chunks
    if (eventType === 'MESSAGE') {
      const { text, type, think, finished, id } = msgData || {};

      // THINK -> reasoning
      if (type === 'THINK' || think) {
        if (!reasoningId) {
          reasoningId = randomUUID();
          yield { type: EventType.REASONING_MESSAGE_START, messageId: reasoningId, role: 'reasoning' };
        }
        if (text || think) {
          yield {
            type: EventType.REASONING_MESSAGE_CONTENT,
            messageId: reasoningId,
            delta: text || think,
          };
        }
        if (finished) {
          yield { type: EventType.REASONING_MESSAGE_END, messageId: reasoningId };
          reasoningId = null;
        }
      }

      // CHAT/ANSWER -> text
      if (type !== 'THINK' && text) {
        if (!textMessageId) {
          textMessageId = id || randomUUID();
          console.log(`[Bridge] Emitting TEXT_MESSAGE_START id=${textMessageId}`);
          yield { type: EventType.TEXT_MESSAGE_START, messageId: textMessageId, role: 'assistant' };
        }
        console.log(`[Bridge] Emitting TEXT_MESSAGE_CONTENT: "${(text || '').slice(0, 100)}"`);
        yield {
          type: EventType.TEXT_MESSAGE_CONTENT,
          messageId: textMessageId,
          delta: text,
        };
        if (finished) {
          console.log(`[Bridge] Emitting TEXT_MESSAGE_END (finished=true)`);
          yield { type: EventType.TEXT_MESSAGE_END, messageId: textMessageId };
          textMessageId = null;
        }
      }
    }

    // PROCESSING event: tool calls
    if (eventType === 'PROCESSING') {
      const procData = msgData || {};
      const toolCallId = procData.executeId || randomUUID();
      const toolName = procData.type || procData.title || 'tool';

      yield {
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: toolName,
        parentMessageId: textMessageId || undefined,
      };

      if (procData.result?.input) {
        yield {
          type: EventType.TOOL_CALL_ARGS,
          toolCallId,
          delta: JSON.stringify(procData.result.input),
        };
      }

      if (procData.status === 'FINISHED' || procData.status === 'FAILED') {
        if (procData.result?.output) {
          yield {
            type: EventType.TOOL_CALL_RESULT,
            messageId: randomUUID(),
            toolCallId,
            content: JSON.stringify(procData.result.output),
          };
        }
        yield { type: EventType.TOOL_CALL_END, toolCallId };
      }
    }

    // FINAL_RESULT: done
    if (eventType === 'FINAL_RESULT') {
      console.log(`[Bridge] FINAL_RESULT received, textMessageId=${textMessageId}, reasoningId=${reasoningId}`);
      if (textMessageId) {
        yield { type: EventType.TEXT_MESSAGE_END, messageId: textMessageId };
        textMessageId = null;
      }
      if (reasoningId) {
        yield { type: EventType.REASONING_MESSAGE_END, messageId: reasoningId };
        reasoningId = null;
      }
    }

    // ERROR event
    if (eventType === 'ERROR') {
      if (textMessageId) {
        yield { type: EventType.TEXT_MESSAGE_END, messageId: textMessageId };
        textMessageId = null;
      }
      const errId = randomUUID();
      yield { type: EventType.TEXT_MESSAGE_START, messageId: errId, role: 'assistant' };
      yield {
        type: EventType.TEXT_MESSAGE_CONTENT,
        messageId: errId,
        delta: `[Error] ${res_data?.error || 'Unknown error'}`,
      };
      yield { type: EventType.TEXT_MESSAGE_END, messageId: errId };
    }
  }

  // Ensure messages are closed
  if (textMessageId) {
    yield { type: EventType.TEXT_MESSAGE_END, messageId: textMessageId };
  }
  if (reasoningId) {
    yield { type: EventType.REASONING_MESSAGE_END, messageId: reasoningId };
  }
  console.log(`[Bridge] Done. Total SSE events processed: ${eventCount}`);
}

// ---------------------------------------------------------------------------
// Runtime setup
// ---------------------------------------------------------------------------
const runtime = new CopilotRuntime({
  agents: { default: agent },
  runner: new InMemoryAgentRunner(),
});

const router = createCopilotExpressHandler({
  runtime,
  basePath: '/api/copilotkit',
  mode: 'multi-route',
  cors: true,
});

app.use(router);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Runtime error:', err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mode: USE_MOCK ? 'mock' : 'nuwax-real-bridge',
    backend: NUWAX_BACKEND,
    endpoint: USE_MOCK ? 'N/A (mock)' : '/api/agent/conversation/chat',
  });
});

const PORT = 4001;
app.listen(PORT, () => {
  console.log(`CopilotKit runtime running on http://localhost:${PORT}`);
  console.log(`Mode: ${USE_MOCK ? 'MOCK (simulated)' : `NUWAX REAL BRIDGE -> ${NUWAX_BACKEND}`}`);
  console.log(`Endpoint: ${USE_MOCK ? 'N/A' : 'POST /api/agent/conversation/chat'}`);
});
