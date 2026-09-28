import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { createServer, type Server, type ServerResponse } from 'node:http';
import type { Socket } from 'node:net';
import { transferableAbortController } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({ useModel: () => ({}) }));
vi.mock('@/services/appDev', () => ({
  listConversations: async () => ({ code: '0000', data: { records: [] } }),
  cancelAgentTask: vi.fn(),
  stopAgentService: vi.fn(),
}));
vi.mock('@/utils/businessAuth', () => ({
  getBusinessRequestAuth: () => ({ credentials: 'same-origin', headers: {} }),
}));
vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
  dict: (key: string) => key,
}));
vi.mock('@/utils/appDevUtils', () => ({
  debounce: (callback: (...args: unknown[]) => void) => callback,
}));

import { useAppDevChat } from '@/hooks/useAppDevChat';
import {
  AgentSessionUpdateSubType,
  SessionMessageType,
} from '@/types/interfaces/appDev';

describe('AppDev 两阶段真实 HTTP SSE 生命周期', () => {
  let server: Server;
  let sockets: Set<Socket>;
  let responses: Map<string, ServerResponse>;
  let originalFetch: typeof window.fetch;
  let originalBaseUrl: string | undefined;

  beforeEach(async () => {
    sockets = new Set();
    responses = new Map();
    originalFetch = window.fetch;
    window.fetch = globalThis.fetch;
    vi.stubGlobal(
      'AbortController',
      class {
        constructor() {
          return transferableAbortController();
        }
      },
    );
    originalBaseUrl = process.env.BASE_URL;
    server = createServer((request, response) => {
      request.resume();
      const path = request.url!.split('?')[0];
      responses.set(path, response);
      response.writeHead(200, { 'Content-Type': 'text/event-stream' });
      response.flushHeaders();
    });
    server.on('connection', (socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    process.env.BASE_URL = `http://127.0.0.1:${
      typeof address === 'object' && address!.port
    }`;
  });
  afterEach(async () => {
    cleanup();
    sockets.forEach((socket) => socket.destroy());
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
    window.fetch = originalFetch;
    if (originalBaseUrl === undefined) delete process.env.BASE_URL;
    else process.env.BASE_URL = originalBaseUrl;
    vi.unstubAllGlobals();
  });

  const fluxPath = '/api/custom-page/ai-chat-flux';
  const sessionPath = '/api/custom-page/ai-session-sse';
  const send = (path: string, data: object) =>
    responses.get(path)!.write(`data: ${JSON.stringify(data)}\n\n`);
  const mount = () =>
    renderHook(() =>
      useAppDevChat({ projectId: 'project-1', selectedModelId: 1 }),
    );
  const start = async (result: ReturnType<typeof mount>['result']) => {
    await waitFor(() => expect(result.current.isLoadingHistory).toBe(false));
    let completion!: Promise<void>;
    act(() => {
      completion = result.current.sendMessageWithPrompt({
        prompt: 'build',
        requestId: 'r1',
      });
    });
    await waitFor(() => expect(responses.has(fluxPath)).toBe(true));
    return { completion };
  };

  it.each(['cancel', 'unmount'])(
    '前置 ai-chat 流 %s 会真实关闭，迟到 success 不建立第二阶段',
    async (ending) => {
      const { result, unmount } = mount();
      const { completion } = await start(result);
      const response = responses.get(fluxPath)!;
      let closed = false;
      response.on('close', () => {
        closed = true;
      });
      await act(async () => {
        if (ending === 'cancel') await result.current.cancelChat();
        else unmount();
      });
      await act(async () => {
        await completion;
      });
      await waitFor(() => expect(closed).toBe(true));
      expect(responses.has(sessionPath)).toBe(false);
    },
  );

  it('成功接线第二阶段，end_turn 保留正文尾部窗口并完成', async () => {
    const { result } = mount();
    const { completion } = await start(result);
    await act(async () => {
      send(fluxPath, {
        type: 'success',
        data: { data: { session_id: 's1', project_id: 'project-1' } },
      });
      responses.get(fluxPath)!.end();
      await completion;
    });
    await waitFor(() => expect(responses.has(sessionPath)).toBe(true));
    await act(async () => {
      send(sessionPath, {
        messageType: SessionMessageType.AGENT_SESSION_UPDATE,
        subType: AgentSessionUpdateSubType.AGENT_MESSAGE_CHUNK,
        data: { text: 'main', is_final: false },
      });
      send(sessionPath, {
        messageType: SessionMessageType.AGENT_SESSION_UPDATE,
        subType: 'end_turn',
      });
    });
    await waitFor(() =>
      expect(
        result.current.chatMessages.find(
          (message) => message.role === 'ASSISTANT',
        )?.text,
      ).toContain('main'),
    );
    await act(async () => {
      send(sessionPath, {
        messageType: SessionMessageType.AGENT_SESSION_UPDATE,
        subType: AgentSessionUpdateSubType.AGENT_MESSAGE_CHUNK,
        data: { text: '+tail', is_final: true },
      });
    });
    await waitFor(() =>
      expect(
        result.current.chatMessages.find(
          (message) => message.role === 'ASSISTANT',
        )?.text,
      ).toBe('main+tail'),
    );
    await waitFor(() =>
      expect(responses.get(sessionPath)!.destroyed).toBe(true),
    );
    expect(
      result.current.chatMessages.find(
        (message) => message.role === 'ASSISTANT',
      )?.isStreaming,
    ).toBe(false);
    expect(result.current.isChatLoading).toBe(false);
  });

  it('sessionPromptEnd 保留已完成态，窗口内工具/计划尾包仍完整更新', async () => {
    const { result } = mount();
    const { completion } = await start(result);
    await act(async () => {
      send(fluxPath, { type: 'success', data: { session_id: 's1' } });
      responses.get(fluxPath)!.end();
      await completion;
    });
    await waitFor(() => expect(responses.has(sessionPath)).toBe(true));
    await act(async () => {
      send(sessionPath, { messageType: SessionMessageType.SESSION_PROMPT_END });
    });
    await waitFor(() => expect(result.current.isChatLoading).toBe(false));
    await act(async () => {
      send(sessionPath, {
        messageType: SessionMessageType.AGENT_SESSION_UPDATE,
        subType: AgentSessionUpdateSubType.PLAN,
        data: {
          planId: 'tail-plan',
          entries: [{ content: 'tail-step', status: 'completed' }],
        },
      });
    });
    await waitFor(() =>
      expect(
        result.current.chatMessages.find(
          (message) => message.role === 'ASSISTANT',
        )?.text,
      ).toContain('tail-step'),
    );
    await waitFor(() =>
      expect(responses.get(sessionPath)!.destroyed).toBe(true),
    );
    expect(
      result.current.chatMessages.find(
        (message) => message.role === 'ASSISTANT',
      )?.isStreaming,
    ).toBe(false);
  });

  it('取消第二阶段时两条流都关闭，前置流不残留', async () => {
    const { result } = mount();
    const { completion } = await start(result);
    await act(async () => {
      send(fluxPath, { type: 'success', data: { session_id: 's1' } });
    });
    await waitFor(() => expect(responses.has(sessionPath)).toBe(true));
    await act(async () => {
      await result.current.cancelChat();
      await completion;
    });
    await waitFor(() => {
      expect(responses.get(fluxPath)!.destroyed).toBe(true);
      expect(responses.get(sessionPath)!.destroyed).toBe(true);
    });
  });
});
