import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';
import {
  applyOpenUiToolCallSseEvent,
  hydrateOpenUiArtifactsFromExecutedComponents,
} from './applyOpenUiToolCallSseEvent';

const inlineInput = {
  schemaVersion: 'nuwax.openui.v1',
  artifactId: 'order-card-1',
  title: '订单状态',
  openuiLang: 'root = Card(children: [])',
  isStreaming: false,
  revision: 1,
};

describe('applyOpenUiToolCallSseEvent', () => {
  it('adds inline artifacts from an MCP tool-call raw input', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          messageType: 'agentSessionUpdate',
          subType: 'tool_call',
          data: {
            toolName: 'render_openui_inline',
            rawInput: inlineInput,
          },
        },
      } as any,
      { id: 'message-1' } as any,
    );

    expect(patched?.openUiArtifacts).toEqual([
      { ...inlineInput, renderTarget: 'inline' },
    ]);
  });

  it('updates an artifact with the same id when its revision increases', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          result: {
            toolName: 'render_openui_page',
            input: {
              schemaVersion: 'nuwax.openui.v1',
              artifactId: 'dashboard-1',
              title: '销售看板',
              workspaceUrl: 'https://workspace.example/dashboard-1',
              revision: 2,
            },
          },
        },
      } as any,
      {
        id: 'message-1',
        openUiArtifacts: [
          {
            schemaVersion: 'nuwax.openui.v1',
            artifactId: 'dashboard-1',
            title: '旧页面',
            workspaceUrl: 'https://workspace.example/old',
            revision: 1,
            renderTarget: 'iframe',
          },
        ],
      } as any,
    );

    expect(patched?.openUiArtifacts?.[0]).toMatchObject({
      title: '销售看板',
      revision: 2,
      renderTarget: 'iframe',
    });
  });

  it('rejects workspace URLs using an unsafe protocol', () => {
    const patched = applyOpenUiToolCallSseEvent(
      {
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          result: {
            toolName: 'render_openui_page',
            input: {
              schemaVersion: 'nuwax.openui.v1',
              artifactId: 'unsafe-page',
              title: '不安全页面',
              workspaceUrl: 'javascript:alert(1)',
              revision: 1,
            },
          },
        },
      } as any,
      { id: 'message-1' } as any,
    );

    expect(patched).toBeNull();
  });

  it('hydrates the persisted structured result shape returned by the backend', () => {
    const hydrated = hydrateOpenUiArtifactsFromExecutedComponents({
      id: 'message-1',
      componentExecutedList: [
        {
          name: 'nuwax-openui-mcp__render_openui_inline',
          result: {
            data: [
              {
                content: {
                  type: 'text',
                  text: JSON.stringify({
                    renderTarget: 'inline',
                    artifact: inlineInput,
                  }),
                },
              },
            ],
            input: {
              artifactId: inlineInput.artifactId,
              title: inlineInput.title,
              openuiLang: inlineInput.openuiLang,
            },
          },
        },
      ],
    } as any);

    expect(hydrated.openUiArtifacts).toEqual([
      { ...inlineInput, renderTarget: 'inline' },
    ]);
  });
});
