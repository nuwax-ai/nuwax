import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';
import { reconcileFinalMessageState } from './reconcileFinalMessageState';

describe('reconcileFinalMessageState', () => {
  it('hydrates missed ACP permission events from final component results', () => {
    const patched = reconcileFinalMessageState(
      {
        id: 'msg-1',
        status: MessageStatusEnum.Complete,
      } as any,
      {
        componentExecuteResults: [
          {
            id: -1,
            name: 'Backend.Sandbox.Event.RequestPermission',
            type: AgentComponentTypeEnum.Event,
            startTime: 1,
            endTime: 1,
            success: null,
            error: null,
            data: null,
            innerExecuteInfo: null,
            executeId: 'call-write-1',
            kind: null,
            locations: null,
            input: {
              request_permission_request: {
                sessionId: 'sess-final',
                toolCall: {
                  toolCallId: 'call-write-1',
                  kind: 'edit',
                  status: 'pending',
                  title: '写入文件',
                  rawInput: {
                    filepath: '/tmp/demo.txt',
                    diff: '+++ /tmp/demo.txt',
                  },
                },
                options: [
                  {
                    optionId: 'once',
                    kind: 'allow_once',
                    name: 'Allow once',
                  },
                ],
              },
              tool_call_id: 'call-write-1',
            },
          },
        ],
      } as any,
    );

    const interaction = patched.acpPermissionInteractions?.[0];
    expect(interaction?.intervention.acp.request.sessionId).toBe('sess-final');
    expect(interaction?.intervention.acp.request.toolCall.toolCallId).toBe(
      'call-write-1',
    );
    expect(interaction?.responseStatus).toBe('pending');
  });

  it('reconciles final execute results and clears orphan executing processing items', () => {
    const patched = reconcileFinalMessageState(
      {
        id: 'msg-2',
        processingList: [
          {
            executeId: 'call-write-1',
            name: '写入文件',
            type: AgentComponentTypeEnum.ToolCall,
            status: ProcessingEnum.EXECUTING,
            result: null,
            targetId: -1,
            cardBindConfig: null,
            subEventType: null,
          },
          {
            executeId: 'call-stuck-2',
            name: '编辑文件',
            type: AgentComponentTypeEnum.ToolCall,
            status: ProcessingEnum.EXECUTING,
            result: null,
            targetId: -1,
            cardBindConfig: null,
            subEventType: null,
          },
        ],
      } as any,
      {
        componentExecuteResults: [
          {
            id: -1,
            name: '写入文件',
            type: AgentComponentTypeEnum.ToolCall,
            startTime: 1,
            endTime: 2,
            success: true,
            error: null,
            data: null,
            innerExecuteInfo: null,
            executeId: 'call-write-1',
            kind: 'edit',
            locations: [{ path: '/tmp/demo.txt' }],
            input: {
              filePath: '/tmp/demo.txt',
              content: 'hello',
            },
          },
        ],
      } as any,
    );

    expect(patched.processingList?.[0].status).toBe(ProcessingEnum.FINISHED);
    expect(patched.processingList?.[0].result?.input).toEqual({
      filePath: '/tmp/demo.txt',
      content: 'hello',
    });
    expect(patched.processingList?.[1].status).toBe(ProcessingEnum.FAILED);
  });
});
