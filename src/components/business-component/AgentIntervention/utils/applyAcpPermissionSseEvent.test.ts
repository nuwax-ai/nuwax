import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';
import { applyAcpPermissionSseEvent } from './applyAcpPermissionSseEvent';

describe('applyAcpPermissionSseEvent', () => {
  it('accepts raw ACP request_permission progress events', () => {
    const patched = applyAcpPermissionSseEvent(
      {
        messageType: 'acpRequestPermission',
        subType: 'request_permission',
        data: {
          request_permission_request: {
            session_id: 'session-1',
            tool_call: {
              tool_call_id: 'tool-call-1',
              title: 'Write file',
              kind: 'edit',
              status: 'pending',
            },
            options: [
              {
                option_id: 'allow_once',
                kind: 'allow_once',
                name: 'Allow once',
              },
            ],
          },
          tool_call_id: 'tool-call-1',
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.acpPermissionInteractions?.[0]?.intervention.id).toBe(
      'itv_session-1_tool-call-1',
    );
    expect(
      patched?.acpPermissionInteractions?.[0]?.intervention.acp.request.options
        .length,
    ).toBe(1);
  });

  it('accepts backend-wrapped ACP request_permission progress events', () => {
    const patched = applyAcpPermissionSseEvent(
      {
        eventType: ConversationEventTypeEnum.MESSAGE,
        data: {
          messageType: 'acpRequestPermission',
          subType: 'request_permission',
          data: {
            request_permission_request: {
              session_id: 'session-2',
              tool_call: {
                tool_call_id: 'tool-call-2',
                title: 'Run command',
                kind: 'execute',
                status: 'pending',
              },
              options: [
                {
                  option_id: 'approved',
                  kind: 'allow_once',
                  name: 'Yes, proceed',
                },
              ],
            },
            tool_call_id: 'tool-call-2',
          },
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.acpPermissionInteractions?.[0]?.intervention.id).toBe(
      'itv_session-2_tool-call-2',
    );
    expect(
      patched?.acpPermissionInteractions?.[0]?.intervention.acp.request.toolCall
        .toolCallId,
    ).toBe('tool-call-2');
  });
});
