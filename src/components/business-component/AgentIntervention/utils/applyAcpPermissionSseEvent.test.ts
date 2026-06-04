import { ConversationEventTypeEnum } from '@/types/enums/agent';
import { describe, expect, it } from 'vitest';
import { applyAcpPermissionSseEvent } from './applyAcpPermissionSseEvent';

describe('applyAcpPermissionSseEvent', () => {
  it('accepts documented snake_case ACP request_permission events', () => {
    const patched = applyAcpPermissionSseEvent(
      {
        session_id: 'session-snake',
        message_type: 'acpRequestPermission',
        sub_type: 'request_permission',
        data: {
          request_permission_request: {
            session_id: 'session-snake',
            tool_call: {
              tool_call_id: 'tool-call-snake',
              title: 'Write file',
              kind: 'edit',
              status: 'pending',
              raw_input: {
                command: 'touch approval-test.txt',
              },
            },
            options: [
              {
                option_id: 'allow-once',
                kind: 'allow_once',
                name: 'Allow once',
              },
              {
                option_id: 'reject-once',
                kind: 'reject_once',
                name: 'Reject',
              },
            ],
          },
          tool_call_id: 'tool-call-snake',
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    const request =
      patched?.acpPermissionInteractions?.[0]?.intervention.acp.request;
    expect(request?.sessionId).toBe('session-snake');
    expect(request?.toolCall.toolCallId).toBe('tool-call-snake');
    expect(request?.toolCall.rawInput).toEqual({
      command: 'touch approval-test.txt',
    });
    expect(request?.options.map((option) => option.optionId)).toEqual([
      'allow-once',
      'reject-once',
    ]);
  });

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

  it('accepts PROCESSING request permission component events', () => {
    const patched = applyAcpPermissionSseEvent(
      {
        requestId: 'request-1',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          targetId: -1,
          name: 'Backend.Sandbox.Event.RequestPermission',
          type: 'Event',
          status: 'FINISHED',
          result: {
            id: -1,
            name: 'Backend.Sandbox.Event.RequestPermission',
            type: 'Event',
            startTime: 1780479903686,
            endTime: 1780479903686,
            input: {
              request_permission_request: {
                session_id: 'session-processing',
                tool_call: {
                  tool_call_id: 'tool-call-processing',
                  kind: 'other',
                  status: 'pending',
                  title: 'external_directory',
                  raw_input: {
                    filepath: '/Users/apple/Desktop/acp-verify-test.txt',
                    parentDir: '/Users/apple/Desktop',
                  },
                },
                options: [
                  {
                    option_id: 'once',
                    name: 'Allow once',
                    kind: 'allow_once',
                  },
                  {
                    option_id: 'reject',
                    name: 'Reject',
                    kind: 'reject_once',
                  },
                ],
              },
              tool_call_id: 'tool-call-processing',
              _meta: {
                nuwaclaw_intervention_id: 'itv-processing',
                nuwaclaw_revision: 2,
              },
            },
            executeId: 'tool-call-processing',
          },
          subEventType: 'REQUEST_PERMISSION',
        },
        completed: false,
      } as any,
      { id: 'msg-1' } as any,
    );

    const interaction = patched?.acpPermissionInteractions?.[0];
    expect(interaction?.intervention.id).toBe('itv-processing');
    expect(interaction?.intervention.revision).toBe(2);
    expect(interaction?.intervention.createdAt).toBe(1780479903686);
    expect(interaction?.intervention.acp.request.sessionId).toBe(
      'session-processing',
    );
    expect(interaction?.intervention.acp.request.toolCall.toolCallId).toBe(
      'tool-call-processing',
    );
    expect(interaction?.intervention.acp.request.toolCall.rawInput).toEqual({
      filepath: '/Users/apple/Desktop/acp-verify-test.txt',
      parentDir: '/Users/apple/Desktop',
    });
    expect(
      interaction?.intervention.acp.request.options.map(
        (option) => option.optionId,
      ),
    ).toEqual(['once', 'reject']);
  });

  it('accepts camelCase ACP request_permission events (ACP standard)', () => {
    const patched = applyAcpPermissionSseEvent(
      {
        requestId: 'req-camel',
        eventType: ConversationEventTypeEnum.PROCESSING,
        data: {
          targetId: -1,
          name: 'Backend.Sandbox.Event.RequestPermission',
          type: 'Event',
          status: 'FINISHED',
          result: {
            id: -1,
            name: 'Backend.Sandbox.Event.RequestPermission',
            type: 'Event',
            startTime: 1780574185241,
            endTime: 1780574185241,
            input: {
              request_permission_request: {
                sessionId: 'session-camel',
                toolCall: {
                  toolCallId: 'tool-call-camel',
                  title: 'Read /etc/hosts',
                  kind: 'read',
                  status: 'pending',
                  rawInput: { file_path: '/etc/hosts' },
                  locations: [{ path: '/etc/hosts', line: 1 }],
                  content: [],
                },
                options: [
                  {
                    optionId: 'allow_always',
                    kind: 'allow_always',
                    name: 'Always Allow Read(//etc/**)',
                  },
                  {
                    optionId: 'allow',
                    kind: 'allow_once',
                    name: 'Allow',
                  },
                  {
                    optionId: 'reject',
                    kind: 'reject_once',
                    name: 'Reject',
                  },
                ],
              },
              tool_call_id: 'tool-call-camel',
            },
            executeId: 'tool-call-camel',
          },
          subEventType: 'REQUEST_PERMISSION',
        },
        completed: false,
      } as any,
      { id: 'msg-camel' } as any,
    );

    const request =
      patched?.acpPermissionInteractions?.[0]?.intervention.acp.request;
    expect(request?.sessionId).toBe('session-camel');
    expect(request?.toolCall.toolCallId).toBe('tool-call-camel');
    expect(request?.toolCall.rawInput).toEqual({ file_path: '/etc/hosts' });
    expect(request?.toolCall.locations).toEqual([
      { path: '/etc/hosts', line: 1 },
    ]);
    expect(request?.options.map((o) => o.optionId)).toEqual([
      'allow_always',
      'allow',
      'reject',
    ]);
  });

  it('normalizes codex-cli engine aliases to codex', () => {
    const patched = applyAcpPermissionSseEvent(
      {
        messageType: 'acpRequestPermission',
        subType: 'request_permission',
        data: {
          request_permission_request: {
            session_id: 'session-engine',
            tool_call: {
              tool_call_id: 'tool-call-engine',
              title: 'Run',
              kind: 'execute',
              status: 'pending',
            },
            options: [],
          },
          tool_call_id: 'tool-call-engine',
          _engine: 'codex-cli',
        },
      } as any,
      { id: 'msg-1' } as any,
    );

    expect(patched?.acpPermissionInteractions?.[0]?.intervention.engine).toBe(
      'codex',
    );
  });
});
