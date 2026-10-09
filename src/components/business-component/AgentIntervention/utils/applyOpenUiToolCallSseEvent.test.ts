import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';
import {
  applyOpenUiToolCallSseEvent,
  isRenderUiSseEvent,
} from './applyOpenUiToolCallSseEvent';

const artifactId = '8c83aa50-6371-41a3-8921-ebb85c2ba934';
const openUiRef = {
  type: 'nuwax.openui-ref',
  schemaVersion: 'nuwax.openui-ref/v1',
  artifactId,
  path: `data/${artifactId}.openui.json`,
  title: 'OpenUI 组件演示看板',
  presentation: { mode: 'sidecar', autoOpen: true },
  digest: `sha256:${'a'.repeat(64)}`,
  operation: 'created',
};
const openUiRefUpdated = { ...openUiRef, operation: 'updated' };

/** RENDER_UI 事件携带的 render input（openui-lang 源），无 artifactId/path。 */
const renderInput = {
  schemaVersion: 'nuwax.openui/v1',
  title: 'Nuwax OpenUI 演示',
  presentation: { mode: 'inline', preferredWidth: 'wide' },
  document: {
    language: 'openui-lang',
    specVersion: '0.5',
    source: 'root = TextContent("demo", "large-heavy")',
  },
  bindings: { tools: [] },
  fallback: { markdown: '' },
};

/** 构造一条 RENDER_UI PROCESSING 事件：subEventType=RENDER_UI，openui-ref 在 result.data。 */
function renderUiEvent(overrides: Record<string, unknown> = {}) {
  return {
    eventType: ConversationEventTypeEnum.PROCESSING,
    data: {
      subEventType: 'RENDER_UI',
      result: {
        executeId: 'call_openui_1',
        status: 'completed',
        data: openUiRef,
      },
    },
    ...overrides,
  } as any;
}

describe('isRenderUiSseEvent', () => {
  it('matches PROCESSING + subEventType=RENDER_UI', () => {
    expect(
      isRenderUiSseEvent(renderUiEvent(), { subEventType: 'RENDER_UI' }),
    ).toBe(true);
  });

  it('matches Backend.Sandbox.Event.RenderUi eventName variants', () => {
    for (const name of [
      'RenderUi',
      'RenderUI',
      'Backend.Sandbox.Event.RenderUi',
    ]) {
      expect(
        isRenderUiSseEvent(
          {
            eventType: ConversationEventTypeEnum.PROCESSING,
            data: { name, result: { name } },
          } as any,
          { name, result: { name } },
        ),
      ).toBe(true);
    }
  });

  it('rejects non-PROCESSING events', () => {
    expect(
      isRenderUiSseEvent(
        { eventType: ConversationEventTypeEnum.MESSAGE, data: {} } as any,
        { subEventType: 'RENDER_UI' },
      ),
    ).toBe(false);
  });

  it('does not swallow ASK_QUESTION / REQUEST_PERMISSION', () => {
    expect(
      isRenderUiSseEvent(
        {
          eventType: ConversationEventTypeEnum.PROCESSING,
          data: { subEventType: 'ASK_QUESTION' },
        } as any,
        { subEventType: 'ASK_QUESTION' },
      ),
    ).toBe(false);
    expect(
      isRenderUiSseEvent(
        {
          eventType: ConversationEventTypeEnum.PROCESSING,
          data: { subEventType: 'REQUEST_PERMISSION' },
        } as any,
        { subEventType: 'REQUEST_PERMISSION' },
      ),
    ).toBe(false);
  });
});

describe('applyOpenUiToolCallSseEvent', () => {
  it('maps a completed RENDER_UI event (result.data=openui-ref) into processingList', () => {
    const patched = applyOpenUiToolCallSseEvent(renderUiEvent(), {
      id: 'msg-1',
      text: '',
      processingList: [],
    } as any);

    expect(patched?.processingList).toHaveLength(1);
    expect(patched?.processingList?.[0]).toMatchObject({
      executeId: 'call_openui_1',
      status: ProcessingEnum.FINISHED,
      type: 'ToolCall',
    });
    expect(patched?.processingList?.[0]?.result).toMatchObject({
      structuredContent: openUiRef,
      executeId: 'call_openui_1',
    });
    expect(patched?.text).toContain('markdown-custom-process');
    expect(patched?.text).toContain('executeId="call_openui_1"');
  });

  it('maps a RENDER_UI event carrying render input (no ref) for inline source render', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          subEventType: 'RENDER_UI',
          status: 'completed',
          result: {
            executeId: 'call_input_1',
            name: 'Backend.Sandbox.Event.renderUI',
            status: 'completed',
            data: null,
            input: renderInput,
          },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );

    // 无 ref 但有 render input：不丢弃，建 processing 项并把 input 透传给下游
    // MarkdownCustomProcess → resolveOpenUiDisplayState（'input-only' inline 源渲染）。
    expect(patched).not.toBeNull();
    expect(patched?.processingList?.[0]?.result).toMatchObject({
      executeId: 'call_input_1',
      input: renderInput,
    });
  });

  // 对齐后端实际报文：openui-ref 作为 JSON 字符串放在 result.data.output，
  // render input 放在 result.input。BFS 应从 output 字符串里解析出 ref。
  it('extracts openui-ref from result.data.output JSON string', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          subEventType: 'RENDER_UI',
          status: 'completed',
          result: {
            executeId: 'call_output_1',
            name: 'Backend.Sandbox.Event.renderUI',
            status: 'completed',
            data: {
              output: JSON.stringify(openUiRef),
              metadata: { truncated: false },
            },
            input: renderInput,
          },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );

    expect(patched).not.toBeNull();
    expect(patched?.processingList?.[0]?.status).toBe(ProcessingEnum.FINISHED);
    expect(patched?.processingList?.[0]?.result).toMatchObject({
      structuredContent: openUiRef,
      executeId: 'call_output_1',
    });
  });

  it('reads status from eventData.status when result.status is absent', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          subEventType: 'RENDER_UI',
          status: 'completed',
          executeId: 'call_top_status',
          result: { executeId: 'call_top_status', data: openUiRef },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );
    expect(patched?.processingList?.[0]?.status).toBe(ProcessingEnum.FINISHED);
  });

  it('updates an existing EXECUTING process when FINISHED arrives (created→updated)', () => {
    const currentMessage = {
      id: 'msg-1',
      text: '',
      processingList: [
        {
          executeId: 'call_openui_2',
          name: 'nuwax_render_openui',
          type: 'ToolCall',
          status: ProcessingEnum.EXECUTING,
          result: { executeId: 'call_openui_2', input: {} },
          targetId: -1,
          cardBindConfig: null,
          subEventType: null,
        },
      ],
    };

    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          subEventType: 'RENDER_UI',
          result: {
            executeId: 'call_openui_2',
            status: 'completed',
            data: openUiRefUpdated,
          },
        },
      } as any,
      currentMessage as any,
    );

    expect(patched?.processingList).toHaveLength(1);
    expect(patched?.processingList?.[0]?.status).toBe(ProcessingEnum.FINISHED);
    expect(patched?.processingList?.[0]?.result).toMatchObject({
      structuredContent: openUiRefUpdated,
    });
    expect(patched?.text).toContain('status="FINISHED"');
  });

  it('creates an EXECUTING placeholder when render is in_progress without a ref', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          subEventType: 'RENDER_UI',
          result: { executeId: 'call_executing', status: 'in_progress' },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );

    expect(patched?.processingList?.[0]?.status).toBe(ProcessingEnum.EXECUTING);
    expect(patched?.text).toContain('executeId="call_executing"');
  });

  it('maps failed status to FAILED', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          subEventType: 'RENDER_UI',
          result: { executeId: 'call_failed', status: 'failed' },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );
    expect(patched?.processingList?.[0]?.status).toBe(ProcessingEnum.FAILED);
  });

  it('drops finished events whose result.data is not an openui-ref', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          subEventType: 'RENDER_UI',
          result: {
            executeId: 'call_prose',
            status: 'completed',
            data: 'created',
          },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );
    expect(patched).toBeNull();
  });

  it('falls back to artifactId as executeId when none is provided', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          subEventType: 'RENDER_UI',
          result: { status: 'completed', data: openUiRef },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );
    expect(patched?.processingList?.[0]?.executeId).toBe(artifactId);
  });

  // —— 直接替换：旧的通用 tool_call 形态不再被识别 ——
  it('ignores legacy tool_call_update carrying nuwax_render_openui name + structuredContent', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          messageType: 'agentSessionUpdate',
          subType: 'tool_call_update',
          data: {
            toolCallId: 'call_legacy',
            title: 'nuwax-openui_nuwax_render_openui_v0_3_6',
            status: 'completed',
            rawOutput: { structuredContent: openUiRef },
          },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );
    expect(patched).toBeNull();
  });

  it('ignores a generic PROCESSING tool_call whose name happens to be nuwax_render_openui', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          executeId: 'call_plain',
          name: 'nuwax_render_openui',
          result: {
            executeId: 'call_plain',
            name: 'nuwax_render_openui',
            input: { schemaVersion: 'nuwax.openui/v1' },
          },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );
    expect(patched).toBeNull();
  });
});
