import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';
import {
  applyOpenUiToolCallSseEvent,
  isOpenUiRenderToolCallEvent,
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

const renderInput = {
  schemaVersion: 'nuwax.openui/v1',
  title: 'OpenUI 组件演示看板',
  presentation: { mode: 'sidecar', autoOpen: true },
  document: {
    language: 'openui-lang',
    specVersion: '0.5',
    source: 'root = TextContent("demo", "large-heavy")',
  },
};

describe('applyOpenUiToolCallSseEvent', () => {
  it('identifies render tool by title and by openui input schema', () => {
    expect(
      isOpenUiRenderToolCallEvent({
        title: 'nuwax-openui_nuwax_render_openui',
      }),
    ).toBe(true);
    expect(
      isOpenUiRenderToolCallEvent({
        title: 'nuwax-openui_nuwax_render_openui_v0_3_6',
      }),
    ).toBe(true);
    expect(
      isOpenUiRenderToolCallEvent({
        title: 'mcp__nuwax-openui__nuwax_render_openui_v0_3_6',
      }),
    ).toBe(true);
    expect(
      isOpenUiRenderToolCallEvent({}, { schemaVersion: 'nuwax.openui/v1' }),
    ).toBe(true);
    // Claude 完成态：无 title/rawInput，仅 rawOutput 字符串为 openui-ref
    expect(
      isOpenUiRenderToolCallEvent({}, undefined, JSON.stringify(openUiRef)),
    ).toBe(true);
    expect(
      isOpenUiRenderToolCallEvent({
        title: 'nuwax-ask_nuwax_ask_question',
      }),
    ).toBe(false);
  });

  it('maps completed ACP tool_call_update rawOutput into processingList', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          messageType: 'agentSessionUpdate',
          subType: 'tool_call_update',
          data: {
            toolCallId: 'call_openui_1',
            title: 'nuwax-openui_nuwax_render_openui',
            status: 'completed',
            rawInput: renderInput,
            rawOutput: {
              output: `OpenUI sidecar artifact created: data/${artifactId}.openui.json`,
              structuredContent: openUiRef,
              metadata: { structuredContent: openUiRef, truncated: false },
            },
          },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );

    expect(patched?.processingList).toHaveLength(1);
    expect(patched?.processingList?.[0]).toMatchObject({
      executeId: 'call_openui_1',
      name: 'nuwax-openui_nuwax_render_openui',
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

  it('updates an existing EXECUTING process when completed arrives', () => {
    const currentMessage = {
      id: 'msg-1',
      text: '<div><markdown-custom-process executeId="call_openui_2" type="ToolCall" status="EXECUTING" name="nuwax-openui_nuwax_render_openui"></markdown-custom-process></div>',
      processingList: [
        {
          executeId: 'call_openui_2',
          name: 'nuwax-openui_nuwax_render_openui',
          type: 'ToolCall',
          status: ProcessingEnum.EXECUTING,
          result: { executeId: 'call_openui_2', input: renderInput },
          targetId: -1,
          cardBindConfig: null,
          subEventType: null,
        },
      ],
    };

    const patched = applyOpenUiToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call_update',
        data: {
          toolCallId: 'call_openui_2',
          title: 'nuwax-openui_nuwax_render_openui',
          status: 'completed',
          rawInput: renderInput,
          rawOutput: {
            output: 'created',
            structuredContent: openUiRef,
          },
        },
      } as any,
      currentMessage as any,
    );

    expect(patched?.processingList).toHaveLength(1);
    expect(patched?.processingList?.[0]?.status).toBe(ProcessingEnum.FINISHED);
    expect(patched?.processingList?.[0]?.result).toMatchObject({
      structuredContent: openUiRef,
    });
    expect(patched?.text).toContain('status="FINISHED"');
  });

  it('ignores non-openui tool calls', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call_update',
        data: {
          toolCallId: 'call_ask',
          title: 'nuwax-ask_nuwax_ask_question',
          status: 'completed',
          rawInput: { schemaVersion: 'nuwax.mcp_ask.v2' },
        },
      } as any,
      { id: 'msg-1' } as any,
    );
    expect(patched).toBeNull();
  });

  it('creates EXECUTING process on in_progress without structuredContent', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call_update',
        data: {
          toolCallId: 'call_openui_3',
          title: 'nuwax-openui_nuwax_render_openui',
          status: 'in_progress',
          rawInput: renderInput,
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );

    expect(patched?.processingList?.[0]?.status).toBe(ProcessingEnum.EXECUTING);
    expect(patched?.text).toContain('executeId="call_openui_3"');
  });

  // 对齐 ~/.nuwaclaw/logs 中 nuwaxcode 完成态：版本化工具名 + structuredContent 对象
  it('maps nuwaxcode completed payload with versioned tool name and structuredContent', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call_update',
        data: {
          toolCallId: 'call_e2d8bfdaaa5947388538adf6',
          title: 'nuwax-openui_nuwax_render_openui_v0_3_6',
          status: 'completed',
          rawInput: renderInput,
          rawOutput: {
            output: `OpenUI sidecar artifact created: data/${artifactId}.openui.json`,
            structuredContent: openUiRef,
            metadata: { structuredContent: openUiRef, truncated: false },
          },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );

    expect(patched?.processingList?.[0]).toMatchObject({
      executeId: 'call_e2d8bfdaaa5947388538adf6',
      name: 'nuwax-openui_nuwax_render_openui_v0_3_6',
      status: ProcessingEnum.FINISHED,
    });
    expect(patched?.processingList?.[0]?.result).toMatchObject({
      structuredContent: openUiRef,
    });
  });

  // 对齐 Claude 完成态：无 title/rawInput，rawOutput 为 openui-ref JSON 字符串
  it('maps claude-code completed payload with string rawOutput and no title', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call_update',
        data: {
          toolCallId: 'call_b2a39a1b2187441d9522b281',
          status: 'completed',
          rawOutput: JSON.stringify(openUiRef),
          content: [
            {
              type: 'content',
              content: { type: 'text', text: JSON.stringify(openUiRef) },
            },
          ],
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );

    expect(patched?.processingList?.[0]?.status).toBe(ProcessingEnum.FINISHED);
    expect(patched?.processingList?.[0]?.result).toMatchObject({
      structuredContent: openUiRef,
    });
  });

  it('continues an existing OpenUI process when completed lacks title and rawInput', () => {
    const currentMessage = {
      id: 'msg-1',
      text: '<div><markdown-custom-process executeId="call_resume" type="ToolCall" status="EXECUTING" name="mcp__nuwax-openui__nuwax_render_openui_v0_3_6"></markdown-custom-process></div>',
      processingList: [
        {
          executeId: 'call_resume',
          name: 'mcp__nuwax-openui__nuwax_render_openui_v0_3_6',
          type: 'ToolCall',
          status: ProcessingEnum.EXECUTING,
          result: { executeId: 'call_resume', input: renderInput },
          targetId: -1,
          cardBindConfig: null,
          subEventType: null,
        },
      ],
    };

    const patched = applyOpenUiToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call_update',
        data: {
          toolCallId: 'call_resume',
          status: 'completed',
          rawOutput: JSON.stringify(openUiRef),
        },
      } as any,
      currentMessage as any,
    );

    expect(patched?.processingList).toHaveLength(1);
    expect(patched?.processingList?.[0]).toMatchObject({
      name: 'mcp__nuwax-openui__nuwax_render_openui_v0_3_6',
      status: ProcessingEnum.FINISHED,
    });
    expect(patched?.processingList?.[0]?.result).toMatchObject({
      structuredContent: openUiRef,
      input: renderInput,
    });
  });

  it('reads openui-ref from eventData.output when rawOutput key is absent', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call_update',
        data: {
          toolCallId: 'call_output_alias',
          title: 'nuwax-openui_nuwax_render_openui_v0_3_6',
          status: 'completed',
          rawInput: renderInput,
          output: {
            output: 'created',
            structuredContent: openUiRef,
          },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );

    expect(patched?.processingList?.[0]?.result).toMatchObject({
      structuredContent: openUiRef,
    });
  });

  it('drops finished events that only have prose output without openui-ref', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call_update',
        data: {
          toolCallId: 'call_prose_only',
          title: 'nuwax-openui_nuwax_render_openui_v0_3_6',
          status: 'completed',
          rawInput: renderInput,
          rawOutput: {
            output: `OpenUI sidecar artifact created: data/${artifactId}.openui.json`,
          },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );
    expect(patched).toBeNull();
  });

  it('does not treat unrelated tool output as OpenUI via full eventData scan', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        messageType: 'agentSessionUpdate',
        subType: 'tool_call_update',
        data: {
          toolCallId: 'call_bash',
          title: 'bash',
          status: 'completed',
          // 巨大无关入参；识别兜底不得对整包 eventData 做 BFS 误命中
          rawInput: {
            command: 'echo hello',
            note: 'x'.repeat(50_000),
          },
          rawOutput: { output: 'hello\n' },
        },
      } as any,
      { id: 'msg-1', text: '', processingList: [] } as any,
    );
    expect(patched).toBeNull();
  });
});
