/**
 * V2 投影纯函数合同测试（specs/nuwax-conversation-renderer-v2.md「测试计划」）。
 * 覆盖：轮次边界（requestId/USER 回退）、分页半轮、标签解析容错与顺序、
 * 工具去重、缺失 ID、Plan/Event 排除、最终回答三级选择、指标与耗时、
 * 已完成交互投影、历史消息兜底。
 */
import {
  parseMessageSegments,
  projectConversation,
  stripCustomTags,
} from '@/features/conversation/presentation-v2';
import { AgentComponentTypeEnum, AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  ExecuteResultInfo,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';

type ConversationFinalResultFixture = ExecuteResultInfo;

const msg = (
  overrides: Partial<MessageInfo> & {
    id: string | number;
    role: AssistantRoleEnum;
  },
): MessageInfo =>
  ({
    text: '',
    time: '2026-08-30 00:00:00',
    componentExecutedList: [],
    messageType: 'ASSISTANT',
    index: 0,
    tenantId: 1,
    senderType: 'User',
    senderId: 'u1',
    userId: 1,
    agentId: 1,
    status: MessageStatusEnum.Complete,
    ...overrides,
  } as MessageInfo);

const processTag = (attrs: {
  executeId?: string;
  type?: string;
  status?: string;
  name?: string;
}) => {
  const parts = [
    attrs.executeId && `executeId="${attrs.executeId}"`,
    attrs.type && `type="${attrs.type}"`,
    attrs.status && `status="${attrs.status}"`,
    attrs.name && `name="${encodeURIComponent(attrs.name || '')}"`,
  ].filter(Boolean);
  return `\n\n<div><markdown-custom-process ${parts.join(
    ' ',
  )}></markdown-custom-process></div>\n\n`;
};

const thinkTag = (status: 'thinking' | 'finished', content: string) =>
  `\n\n<div><markdown-custom-think status="${status}" content="${encodeURIComponent(
    content,
  )}"></markdown-custom-think></div>\n\n`;

describe('parseMessageSegments', () => {
  it('无标签文本整体为正文段', () => {
    const segments = parseMessageSegments('你好，这是一段回答');
    expect(segments).toEqual([{ type: 'text', content: '你好，这是一段回答' }]);
  });

  it('按真实顺序切分 think/process/正文', () => {
    const text = [
      '开头说明',
      thinkTag('finished', '第一轮思考'),
      processTag({
        executeId: 'e1',
        type: 'Plugin',
        status: 'FINISHED',
        name: '搜索',
      }),
      '中间说明',
      processTag({
        executeId: 'e2',
        type: 'Mcp',
        status: 'EXECUTING',
        name: '读取文件',
      }),
      '正在总结结果',
    ].join('');
    const types = parseMessageSegments(text).map((s) => s.type);
    expect(types).toEqual([
      'text',
      'think',
      'process',
      'text',
      'process',
      'text',
    ]);
  });

  it('畸形标签碎片产出 unknown 段且不抛异常', () => {
    const text = `正文一段<div><markdown-custom-process executeId="broken`;
    const segments = parseMessageSegments(text);
    expect(segments.some((s) => s.type === 'unknown')).toBe(true);
    expect(segments.some((s) => s.type === 'text')).toBe(true);
  });

  it('SSE 转义引号属性可解析（\\" 包裹）', () => {
    const raw = `<markdown-custom-process executeId=\\"esc1\\" type=\\"Plugin\\" status=\\"FINISHED\\"></markdown-custom-process>`;
    const segments = parseMessageSegments(raw);
    const process = segments.find((s) => s.type === 'process');
    expect(process).toMatchObject({
      executeId: 'esc1',
      componentType: 'Plugin',
    });
  });

  it('stripCustomTags 剥离全部自定义标签保留正文', () => {
    const text = `${thinkTag('finished', '想')}${processTag({
      executeId: 'x',
      type: 'Event',
    })}最终回答内容`;
    expect(stripCustomTags(text)).toBe('最终回答内容');
  });
});

describe('projectConversation · 轮次分组', () => {
  it('USER 消息切轮（requestId 缺失回退）', () => {
    const turns = projectConversation([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务一' }),
      msg({ id: 'a1', role: AssistantRoleEnum.ASSISTANT, text: '回答一' }),
      msg({ id: 'u2', role: AssistantRoleEnum.USER, text: '任务二' }),
      msg({ id: 'a2', role: AssistantRoleEnum.ASSISTANT, text: '回答二' }),
    ]).turns;
    expect(turns).toHaveLength(2);
    expect(turns[0].userMessage?.id).toBe('u1');
    expect(turns[1].userMessage?.id).toBe('u2');
  });

  it('requestId 优先归组：同轮内非空 requestId 变化切分新轮', () => {
    const turns = projectConversation([
      msg({
        id: 'u1',
        role: AssistantRoleEnum.USER,
        text: '任务',
        requestId: 'r1',
      }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '回答A',
        requestId: 'r1',
      }),
      msg({
        id: 'a2',
        role: AssistantRoleEnum.ASSISTANT,
        text: '回答B',
        requestId: 'r2',
      }),
    ]).turns;
    expect(turns).toHaveLength(2);
    expect(turns[0].assistantMessages.map((m) => m.id)).toEqual(['a1']);
    expect(turns[1].assistantMessages.map((m) => m.id)).toEqual(['a2']);
    expect(turns[1].userMessage).toBeUndefined();
  });

  it('分页半轮：列表头部的 assistant 消息自成一轮（无 user）', () => {
    const turns = projectConversation([
      msg({
        id: 'a0',
        role: AssistantRoleEnum.ASSISTANT,
        text: '上一页尾巴',
        index: 3,
      }),
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务', index: 4 }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '回答',
        index: 5,
      }),
    ]).turns;
    expect(turns).toHaveLength(2);
    expect(turns[0].userMessage).toBeUndefined();
    expect(turns[0].assistantMessages[0].id).toBe('a0');
  });
});

describe('projectConversation · 节点与指标', () => {
  it('节点按真实顺序：narration 穿插原位携带正文；工具去重保留最后一次', () => {
    const text = [
      '开场说明',
      thinkTag('finished', '思考内容'),
      processTag({
        executeId: 'e1',
        type: 'Plugin',
        status: 'EXECUTING',
        name: '搜索',
      }),
      processTag({
        executeId: 'e1',
        type: 'Plugin',
        status: 'FINISHED',
        name: '搜索',
      }),
      processTag({
        executeId: 'e2',
        type: 'SubAgent',
        status: 'FINISHED',
        name: '子代理',
      }),
      '收尾正文',
    ].join('');
    const turn = projectConversation([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({ id: 'a1', role: AssistantRoleEnum.ASSISTANT, text }),
    ]).turns[0];
    expect(turn.nodes.map((n) => n.kind)).toEqual([
      'narration',
      'reasoning',
      'tool',
      'subagent',
    ]);
    const tool = turn.nodes.find((n) => n.id === 'e1');
    expect(tool?.status).toBe('finished');
    expect(turn.metrics.toolCount).toBe(2);
    expect(turn.metrics.messageCount).toBe(1); // reasoning（narration 直出不计）
    // narration 节点携带原始 Markdown（渲染层穿插直出为正文）
    expect(
      turn.nodes.filter((n) => n.kind === 'narration').map((n) => n.text),
    ).toEqual(['开场说明']);
    expect(turn.finalAnswer.source).toBe('messageText');
    expect(turn.finalAnswer.text).toBe('收尾正文');
  });

  it('Plan/Event 不计工具数：Plan 为 plan 节点、纯 Event 丢弃', () => {
    const text = [
      processTag({
        executeId: 'p1',
        type: 'Plan',
        status: 'FINISHED',
        name: '计划',
      }),
      processTag({
        executeId: 'ev1',
        type: 'Event',
        status: 'FINISHED',
        name: '普通事件',
      }),
      processTag({
        executeId: 'op1',
        type: 'Event',
        status: 'FINISHED',
        name: 'Backend.Sandbox.Event.renderUI',
      }),
      processTag({
        executeId: 't1',
        type: 'Mcp',
        status: 'FINISHED',
        name: '读取',
      }),
    ].join('');
    const turn = projectConversation([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({ id: 'a1', role: AssistantRoleEnum.ASSISTANT, text }),
    ]).turns[0];
    const kinds = turn.nodes.map((n) => n.kind);
    expect(kinds).toContain('plan');
    expect(kinds).not.toContain('unknown');
    const eventIds = turn.nodes.map((n) => n.id);
    expect(eventIds).not.toContain('ev1');
    expect(eventIds).toContain('op1'); // OpenUI render 例外保留为 tool
    expect(turn.metrics.toolCount).toBe(2); // op1 + t1，Plan/Event 不计
  });

  it('无 executeId 的 process 段丢弃（与 V1 null 分支一致）', () => {
    const text = processTag({ type: 'Plugin', status: 'FINISHED' });
    const turn = projectConversation([
      msg({ id: 'a1', role: AssistantRoleEnum.ASSISTANT, text }),
    ]).turns[0];
    expect(turn.nodes).toHaveLength(0);
  });

  it('processingList 按 executeId 合并工具详情', () => {
    const processing: ProcessingInfo = {
      executeId: 'e1',
      name: '搜索',
      type: AgentComponentTypeEnum.Plugin,
      status: ProcessingEnum.FAILED,
      result: {
        executeId: 'e1',
        name: '搜索',
        type: AgentComponentTypeEnum.Plugin,
        success: false,
        error: 'boom',
        startTime: 1000,
        endTime: 3000,
      },
      targetId: 1,
      cardBindConfig: null,
    } as unknown as ProcessingInfo;
    const text = processTag({
      executeId: 'e1',
      type: 'Plugin',
      status: 'EXECUTING',
      name: '搜索',
    });
    const turn = projectConversation([
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text,
        processingList: [processing],
      }),
    ]).turns[0];
    const node = turn.nodes[0];
    expect(node.status).toBe('failed');
    expect(node.failed).toBe(true);
    expect(node.processing).toBeDefined();
  });

  it('历史消息兜底：think 字段与 componentExecutedList 提升详情', () => {
    const text = processTag({
      executeId: 'h1',
      type: 'Mcp',
      status: 'FINISHED',
      name: '读文件',
    });
    const turn = projectConversation([
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text,
        think: '历史思考',
        componentExecutedList: [
          {
            result: {
              executeId: 'h1',
              name: '读文件（终态）',
              type: 'Mcp',
              success: true,
              startTime: 10,
              endTime: 20,
            },
          },
        ],
      }),
    ]).turns[0];
    const reasoning = turn.nodes.find((n) => n.kind === 'reasoning');
    expect(reasoning?.thinkText).toBe('历史思考');
    const tool = turn.nodes.find((n) => n.id === 'h1');
    expect(tool?.title).toBe('读文件（终态）');
    expect(tool?.status).toBe('finished');
  });

  it('SYSTEM 消息投影为 context 节点并计入消息数', () => {
    const turn = projectConversation([
      msg({ id: 's1', role: AssistantRoleEnum.SYSTEM, text: '系统上下文注入' }),
    ]).turns[0];
    expect(turn.nodes[0].kind).toBe('context');
    expect(turn.metrics.messageCount).toBe(1);
  });

  it('耗时：finalResult 优先；缺失时用 processing 最早开始/最晚结束', () => {
    const withFinal = projectConversation([
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '回答',
        finalResult: {
          outputText: '回答',
          startTime: 1000,
          endTime: 65000,
          success: true,
          componentExecuteResults: [],
        } as MessageInfo['finalResult'],
      }),
    ]).turns[0];
    expect(withFinal.metrics.elapsedMs).toBe(64000);

    const running = projectConversation([
      msg({
        id: 'a2',
        role: AssistantRoleEnum.ASSISTANT,
        text: processTag({
          executeId: 'r1',
          type: 'Plugin',
          status: 'EXECUTING',
        }),
        status: MessageStatusEnum.Loading,
        processingList: [
          {
            executeId: 'r1',
            result: { executeId: 'r1', startTime: 5000, success: false },
            status: ProcessingEnum.EXECUTING,
          } as unknown as ProcessingInfo,
        ],
      }),
    ]).turns[0];
    expect(running.running).toBe(true);
    expect(running.metrics.elapsedAnchor).toBe(5000);
    expect(running.metrics.elapsedMs).toBeUndefined();
  });
});

describe('projectConversation · 最终回答', () => {
  it('优先取最后一条非空 finalResult.outputText（剥内嵌 Event 标签）', () => {
    const turn = projectConversation([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '中间正文',
        finalResult: {
          outputText: '',
          success: true,
          componentExecuteResults: [],
        } as MessageInfo['finalResult'],
      }),
      msg({
        id: 'a2',
        role: AssistantRoleEnum.ASSISTANT,
        text: '尾部正文',
        finalResult: {
          outputText: `最终${processTag({
            executeId: 'ev',
            type: 'Event',
          })}结论`,
          success: true,
          componentExecuteResults: [],
        } as MessageInfo['finalResult'],
      }),
    ]).turns[0];
    expect(turn.finalAnswer.source).toBe('finalResult');
    expect(turn.finalAnswer.text).toBe('最终\n\n结论');
    // outputText 作为回答后，其余正文段为 narration 节点（穿插直出）
    expect(turn.nodes.filter((n) => n.kind === 'narration')).toHaveLength(2);
  });

  it('无 outputText 终态回退最后一条正文段；更早正文段保留为 narration', () => {
    const text = `第一段${processTag({
      executeId: 'e1',
      type: 'Plugin',
      status: 'FINISHED',
    })}第二段${thinkTag('finished', '想')}最后一段`;
    const turn = projectConversation([
      msg({ id: 'a1', role: AssistantRoleEnum.ASSISTANT, text }),
    ]).turns[0];
    expect(turn.finalAnswer.source).toBe('messageText');
    expect(turn.finalAnswer.text).toBe('最后一段');
    expect(
      turn.nodes.filter((n) => n.kind === 'narration').map((n) => n.text),
    ).toEqual(['第一段', '第二段']);
  });

  it('无正文时不冒充回答：source=none（停止轮只显示状态）', () => {
    const text = processTag({
      executeId: 'e1',
      type: 'Plugin',
      status: 'FINISHED',
    });
    const turn = projectConversation([
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text,
        status: MessageStatusEnum.Stopped,
      }),
    ]).turns[0];
    expect(turn.finalAnswer.source).toBe('none');
    expect(turn.finalAnswer.text).toBe('');
    expect(turn.terminalStatus).toBe('stopped');
  });

  it('运行态：末尾正文段为实时回答区，不进轨迹', () => {
    const text = `中间说明${processTag({
      executeId: 'e1',
      type: 'Plugin',
      status: 'EXECUTING',
    })}正在输出…`;
    const turn = projectConversation([
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text,
        status: MessageStatusEnum.Loading,
      }),
    ]).turns[0];
    expect(turn.running).toBe(true);
    expect(turn.finalAnswer.source).toBe('messageText');
    expect(turn.finalAnswer.text).toBe('正在输出…');
    expect(
      turn.nodes.filter((n) => n.kind === 'narration').map((n) => n.text),
    ).toEqual(['中间说明']);
  });
});

describe('projectConversation · 已完成交互', () => {
  it('终态 ask/权限投影为 completed-interaction 节点；待回答的不投影', () => {
    const message = msg({
      id: 'a1',
      role: AssistantRoleEnum.ASSISTANT,
      text: '回答',
      mcpAskInteractions: [
        {
          toolCallId: 'q1',
          responseStatus: 'submitted',
          input: { requestId: 'req-1', title: '选择配色' },
        },
        {
          toolCallId: 'q2',
          responseStatus: 'pending',
          input: { requestId: 'req-2', title: '待回答问题' },
        },
      ] as MessageInfo['mcpAskInteractions'],
    });
    const turn = projectConversation([message]).turns[0];
    const interactions = turn.nodes.filter(
      (n) => n.kind === 'completed-interaction',
    );
    expect(interactions).toHaveLength(1);
    expect(interactions[0].interaction?.title).toBe('选择配色');
    expect(turn.metrics.messageCount).toBe(1);
  });

  it('权限节点按 toolCallId 锚定在对应工具节点之后', () => {
    const text = processTag({
      executeId: 'perm-tool-1',
      type: 'ToolCall',
      status: 'FINISHED',
    });
    const message = msg({
      id: 'a1',
      role: AssistantRoleEnum.ASSISTANT,
      text,
      acpPermissionInteractions: [
        {
          id: 'itv1',
          responseStatus: 'submitted',
          selectedOptionId: 'allow_once',
          intervention: {
            acp: {
              request: {
                toolCall: { toolCallId: 'perm-tool-1', title: '写入文件' },
              },
            },
          },
        },
      ] as unknown as MessageInfo['acpPermissionInteractions'],
    });
    const turn = projectConversation([message]).turns[0];
    expect(turn.nodes.map((n) => n.kind)).toEqual([
      'tool',
      'completed-interaction',
    ]);
  });
});

describe('projectConversation · 最终回答去重（验收返工 P1）', () => {
  it('outputText 与末段正文同源时，该段不再重复直出（去重入 answerRef）', () => {
    const answerText = '竞品分析完成：三家定价与功能矩阵已核对。';
    const text = `第一段说明${processTag({
      executeId: 'e1',
      type: 'Mcp',
      status: 'FINISHED',
    })}${answerText}`;
    const turn = projectConversation([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text,
        finalResult: {
          outputText: answerText,
          success: true,
          componentExecuteResults: [],
        } as MessageInfo['finalResult'],
      }),
    ]).turns[0];
    expect(turn.finalAnswer).toMatchObject({
      source: 'finalResult',
      text: answerText,
    });
    const narrations = turn.nodes.filter((n) => n.kind === 'narration');
    expect(narrations.map((n) => n.text)).toEqual(['第一段说明']);
    expect(
      narrations.some((n) => (n.text ?? '').includes('竞品分析完成')),
    ).toBe(false);
  });

  it('outputText 与正文不同源时，正文段保留直出（不误删中间说明）', () => {
    const turn = projectConversation([
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '中间结论',
        finalResult: {
          outputText: '与正文完全不同的最终结论',
          success: true,
          componentExecuteResults: [],
        } as MessageInfo['finalResult'],
      }),
    ]).turns[0];
    expect(turn.finalAnswer.text).toBe('与正文完全不同的最终结论');
    expect(
      turn.nodes.filter((n) => n.kind === 'narration').map((n) => n.text),
    ).toEqual(['中间结论']);
  });

  it('SYSTEM 消息不得成为最终回答，也不重复产生 narration（验收返工 P1）', () => {
    const turn = projectConversation([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '助手结论',
        finalResult: {
          outputText: '助手结论',
          success: true,
          componentExecuteResults: [],
        } as MessageInfo['finalResult'],
      }),
      msg({
        id: 's1',
        role: AssistantRoleEnum.SYSTEM,
        text: '系统上下文：敏感注入内容',
        index: 2,
      }),
    ]).turns[0];
    expect(turn.finalAnswer.source).toBe('finalResult');
    expect(turn.finalAnswer.text).toBe('助手结论');
    expect(turn.finalAnswer.text).not.toContain('系统上下文');
    // SYSTEM 只产生一个 context 节点，不再重复解析出 narration
    expect(turn.nodes.filter((n) => n.kind === 'context')).toHaveLength(1);
    expect(turn.nodes.filter((n) => n.kind === 'narration')).toHaveLength(0);
  });

  it('SYSTEM-only 轮次无最终回答；QUESTION 类型消息正文不选为回答', () => {
    const systemOnly = projectConversation([
      msg({ id: 's1', role: AssistantRoleEnum.SYSTEM, text: '纯系统内容' }),
    ]).turns[0];
    expect(systemOnly.finalAnswer.source).toBe('none');

    const questionTail = projectConversation([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '中途说明',
        status: null as unknown as MessageStatusEnum,
        finished: true,
      }),
      msg({
        id: 'q1',
        role: AssistantRoleEnum.ASSISTANT,
        type: 'QUESTION' as MessageInfo['type'],
        text: '请选择方案？',
        index: 2,
        status: null as unknown as MessageStatusEnum,
        finished: true,
      }),
    ]).turns[0];
    expect(questionTail.finalAnswer.source).toBe('messageText');
    expect(questionTail.finalAnswer.text).toBe('中途说明');
  });
});

describe('projectConversation · 工具终态合并（验收返工 P2）', () => {
  it('finalResult.componentExecuteResults 覆盖流式 EXECUTING、补齐缺失、残余判失败', () => {
    const text = [
      processTag({
        executeId: 'e1',
        type: 'Mcp',
        status: 'EXECUTING',
        name: '工具一',
      }),
      processTag({
        executeId: 'e2',
        type: 'Mcp',
        status: 'EXECUTING',
        name: '工具二',
      }),
      processTag({
        executeId: 'e3',
        type: 'Plugin',
        status: 'FINISHED',
        name: '工具三',
      }),
    ].join('');
    const turn = projectConversation([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text,
        processingList: [
          {
            executeId: 'e1',
            name: '工具一（流式）',
            type: 'Mcp',
            status: ProcessingEnum.EXECUTING,
            result: {
              executeId: 'e1',
              success: true,
              startTime: 1,
              endTime: 2,
            },
          },
          {
            executeId: 'e3',
            name: '工具三（流式）',
            type: 'Plugin',
            status: ProcessingEnum.EXECUTING,
          },
        ] as unknown as ProcessingInfo[],
        finalResult: {
          outputText: '结论',
          success: true,
          startTime: 1,
          endTime: 100,
          componentExecuteResults: [
            // e1 终态：覆盖流式 EXECUTING
            {
              executeId: 'e1',
              name: '工具一（终态）',
              type: 'Mcp',
              success: true,
              startTime: 1,
              endTime: 50,
            },
            // e2 只在终态出现：补齐
            {
              executeId: 'e2',
              name: '工具二（终态）',
              type: 'Mcp',
              success: false,
              startTime: 10,
              endTime: 60,
            },
            // e3 终态缺位：流式 EXECUTING 残余 → FAILED
          ] as unknown as ConversationFinalResultFixture[],
        } as unknown as MessageInfo['finalResult'],
      }),
    ]).turns[0];
    const byId = new Map(turn.nodes.map((n) => [n.id, n]));
    expect(byId.get('e1')?.status).toBe('finished');
    expect(byId.get('e1')?.title).toBe('工具一（终态）');
    expect(byId.get('e1')?.processing?.result?.endTime).toBe(50);
    expect(byId.get('e2')?.status).toBe('failed');
    expect(byId.get('e2')?.title).toBe('工具二（终态）');
    expect(byId.get('e3')?.status).toBe('failed');
  });

  it('历史消息：componentExecutedList 作为基底与 processingList 共存合并', () => {
    const text = [
      processTag({
        executeId: 'h1',
        type: 'Mcp',
        status: 'FINISHED',
        name: '历史一',
      }),
      processTag({
        executeId: 'h2',
        type: 'Mcp',
        status: 'FINISHED',
        name: '历史二',
      }),
    ].join('');
    const turn = projectConversation([
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text,
        processingList: [
          {
            executeId: 'h2',
            name: '历史二（流式覆盖）',
            type: 'Mcp',
            status: ProcessingEnum.FINISHED,
          },
        ] as unknown as ProcessingInfo[],
        componentExecutedList: [
          {
            result: {
              executeId: 'h1',
              name: '历史一（历史基底）',
              type: 'Mcp',
              success: true,
            },
          },
        ],
      }),
    ]).turns[0];
    const byId = new Map(turn.nodes.map((n) => [n.id, n]));
    expect(byId.get('h1')?.title).toBe('历史一（历史基底）');
    expect(byId.get('h2')?.title).toBe('历史二（流式覆盖）');
  });
});

describe('projectConversation · 终态参考消息（验收返工自查）', () => {
  it('轮末跟随 SYSTEM 消息时不遮蔽 assistant 真实终态', () => {
    const turn = projectConversation([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '出错了',
        status: MessageStatusEnum.Error,
      }),
      msg({
        id: 's1',
        role: AssistantRoleEnum.SYSTEM,
        text: '系统上下文',
        index: 2,
      }),
    ]).turns[0];
    expect(turn.terminalStatus).toBe('error');
  });
});

describe('projectConversation · 运行态轮末非候选消息回退（评审边界）', () => {
  it('运行中轮末瞬时跟随 SYSTEM：实时回答取最后候选正文段而非清空', () => {
    const turn = projectConversation([
      msg({ id: 'u1', role: AssistantRoleEnum.USER, text: '任务' }),
      msg({
        id: 'a1',
        role: AssistantRoleEnum.ASSISTANT,
        text: '流式回答中',
        status: MessageStatusEnum.Loading,
      }),
      msg({
        id: 's1',
        role: AssistantRoleEnum.SYSTEM,
        text: '瞬时系统注入',
        index: 2,
        status: MessageStatusEnum.Loading,
      }),
    ]).turns[0];
    expect(turn.running).toBe(true);
    expect(turn.finalAnswer.source).toBe('messageText');
    expect(turn.finalAnswer.text).toBe('流式回答中');
  });
});
