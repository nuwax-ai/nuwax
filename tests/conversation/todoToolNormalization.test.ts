/**
 * deepagents TodoWrite 归一为 V2 待办卡（2026-09-22，会话 1694270 实证）：
 *
 * 全栈 agent 的 TodoWrite 调用下发 type=ToolCall、name="N todos"、清单在
 * result.input.todos、result.data 为 content 包裹 JSON 文本——三重不满足
 * Plan 组件契约（type=Plan + result.data=[{status,content}]），此前只能
 * 回落「已更新计划」普通轨迹行。归一口径三层：
 * 1) readPlanSteps 按优先级提取三载体（Plan data / input.todos / content 文本）；
 * 2) isTodoTraceNode 放宽到名称命中 todo 启发式的工具节点；
 * 3) 投影层相邻「计划呈现」段去重（TodoWrite 连续更新只留最新清单）。
 */
import { projectConversation } from '@/features/conversation/presentation-v2';
import {
  isTodoTraceNode,
  readPlanSteps,
} from '@/features/conversation/presentation-v2/traceItems';
import type { ConversationProcessNode } from '@/features/conversation/presentation-v2/types';
import { AssistantRoleEnum } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';

const node = (
  id: string,
  kind: ConversationProcessNode['kind'],
  overrides: Partial<ConversationProcessNode> = {},
): ConversationProcessNode => ({
  id,
  kind,
  title: id,
  summary: '',
  status: 'finished',
  failed: false,
  ...overrides,
});

const toolNode = (
  id: string,
  name: string,
  result: Record<string, unknown>,
  overrides: Partial<ConversationProcessNode> = {},
): ConversationProcessNode =>
  node(id, 'tool', {
    executeId: id,
    componentType: 'ToolCall',
    processing: {
      executeId: id,
      name,
      type: 'ToolCall',
      status: 'FINISHED',
      result: { executeId: id, name, ...result },
    } as ConversationProcessNode['processing'],
    ...overrides,
  });

/** 09-21 对 1694206 直连后端实测的 TodoWrite 线上形态 */
const TODO_WIRE_RESULT = {
  input: {
    todos: [
      { content: '初始化项目', status: 'completed', priority: 'high' },
      { content: '编写页面', status: 'in_progress' },
      { content: '联调验证' },
    ],
  },
  data: [
    {
      type: 'content',
      content: {
        type: 'text',
        text: JSON.stringify([
          { content: '初始化项目', status: 'completed', priority: 'high' },
          { content: '编写页面', status: 'in_progress' },
          { content: '联调验证' },
        ]),
      },
    },
  ],
};

describe('readPlanSteps：三载体提取', () => {
  it('Plan 组件契约直读（回归）：result.data = [{status, content}]', () => {
    expect(
      readPlanSteps({
        data: [
          { status: 'completed', content: '第一步' },
          { status: 'in_progress', content: '第二步' },
        ],
      }),
    ).toEqual([
      { status: 'completed', content: '第一步' },
      { status: 'in_progress', content: '第二步' },
    ]);
  });

  it('TodoWrite 线上形态：input.todos 对象载体，status 非法回落 pending', () => {
    expect(readPlanSteps(TODO_WIRE_RESULT)).toEqual([
      { status: 'completed', content: '初始化项目' },
      { status: 'in_progress', content: '编写页面' },
      { status: 'pending', content: '联调验证' },
    ]);
  });

  it('input 为 JSON 字符串时解析后提取 todos', () => {
    expect(
      readPlanSteps({
        input: JSON.stringify({
          todos: [{ content: '唯一步骤', status: 'completed' }],
        }),
      }),
    ).toEqual([{ status: 'completed', content: '唯一步骤' }]);
  });

  it('兜底载体：data[0].content.text 为清单 JSON 文本（数组或 {todos}）', () => {
    expect(
      readPlanSteps({
        data: [
          {
            type: 'content',
            content: {
              type: 'text',
              text: JSON.stringify([
                { content: '文本步骤', status: 'pending' },
              ]),
            },
          },
        ],
      }),
    ).toEqual([{ status: 'pending', content: '文本步骤' }]);
    expect(
      readPlanSteps({
        data: [
          {
            type: 'content',
            content: {
              type: 'text',
              text: JSON.stringify({
                todos: [{ content: '包裹步骤', status: 'completed' }],
              }),
            },
          },
        ],
      }),
    ).toEqual([{ status: 'completed', content: '包裹步骤' }]);
  });

  it('全部载体无有效项返回 null（调用方回落普通轨迹行）', () => {
    expect(readPlanSteps(null)).toBeNull();
    expect(readPlanSteps({})).toBeNull();
    expect(readPlanSteps({ input: { todos: '不是数组' } })).toBeNull();
    expect(
      readPlanSteps({ input: { todos: [{ status: 'pending' }] } }),
    ).toBeNull();
    expect(
      readPlanSteps({
        data: [
          {
            type: 'content',
            content: { type: 'text', text: '不是 JSON 的文本' },
          },
        ],
      }),
    ).toBeNull();
  });
});

describe('isTodoTraceNode：接管判定放宽到 todo 名称工具节点', () => {
  it('TodoWrite 形态（ToolCall + todo 名称 + input.todos）接管为待办卡', () => {
    const todoWrite = toolNode('todo-1', '6 todos', TODO_WIRE_RESULT);
    expect(isTodoTraceNode(todoWrite)).toBe(true);
  });

  it('中文名称启发式同样接管', () => {
    const todoWrite = toolNode('todo-2', '更新任务清单', TODO_WIRE_RESULT);
    expect(isTodoTraceNode(todoWrite)).toBe(true);
  });

  it('非 todo 名称的工具不因 input.todos 接管（防误伤）', () => {
    const generic = toolNode('gen-1', 'generate_report', TODO_WIRE_RESULT);
    expect(isTodoTraceNode(generic)).toBe(false);
  });

  it('todo 名称但无可提取清单仍回落普通轨迹行', () => {
    const empty = toolNode('todo-3', '6 todos', {
      input: { todos: [] },
      data: [],
    });
    expect(isTodoTraceNode(empty)).toBe(false);
  });

  it('Plan 节点 + 结构化 data 的原契约不受影响（回归）', () => {
    const plan = node('plan-1', 'plan', {
      componentType: 'Plan',
      processing: {
        name: 'Plan',
        type: 'Plan',
        status: 'FINISHED',
        result: {
          data: [{ status: 'completed', content: '计划步骤' }],
        },
      } as ConversationProcessNode['processing'],
    });
    expect(isTodoTraceNode(plan)).toBe(true);
  });
});

const processTag = (attrs: {
  executeId: string;
  name: string;
  type?: string;
  status?: string;
}) =>
  `<div><markdown-custom-process executeId="${attrs.executeId}" type="${
    attrs.type ?? 'ToolCall'
  }" status="${attrs.status ?? 'FINISHED'}" name="${encodeURIComponent(
    attrs.name,
  )}"></markdown-custom-process></div>`;

const executedEntry = (attrs: { executeId: string; name: string }) => ({
  result: {
    executeId: attrs.executeId,
    name: attrs.name,
    type: 'ToolCall',
    success: true,
    startTime: 1,
    endTime: 2,
    ...TODO_WIRE_RESULT,
  },
});

const assistantMessage = (
  text: string,
  componentExecutedList: unknown[] = [],
): MessageInfo =>
  ({
    id: 'a1',
    role: AssistantRoleEnum.ASSISTANT,
    text,
    time: '',
    think: '',
    componentExecutedList,
    messageType: 'ASSISTANT',
    index: 0,
  } as unknown as MessageInfo);

const turnNodes = (messages: MessageInfo[]): ConversationProcessNode[] =>
  projectConversation(messages).turns[0]?.nodes ?? [];

describe('投影层：TodoWrite 段归一与相邻去重', () => {
  it('TodoWrite 段投影为可接管的待办卡节点', () => {
    const nodes = turnNodes([
      assistantMessage(processTag({ executeId: 'ex-1', name: '6 todos' }), [
        executedEntry({ executeId: 'ex-1', name: '6 todos' }),
      ]),
    ]);
    const todoNode = nodes.find((item) => item.executeId === 'ex-1');
    expect(todoNode).toBeDefined();
    expect(todoNode?.kind).toBe('tool');
    expect(isTodoTraceNode(todoNode as ConversationProcessNode)).toBe(true);
  });

  it('相邻两次 TodoWrite 去重只留最新清单', () => {
    const nodes = turnNodes([
      assistantMessage(
        processTag({ executeId: 'ex-1', name: '5 todos' }) +
          processTag({ executeId: 'ex-2', name: '6 todos' }),
        [
          executedEntry({ executeId: 'ex-1', name: '5 todos' }),
          executedEntry({ executeId: 'ex-2', name: '6 todos' }),
        ],
      ),
    ]);
    expect(nodes.some((item) => item.executeId === 'ex-1')).toBe(false);
    expect(nodes.some((item) => item.executeId === 'ex-2')).toBe(true);
  });

  it('Plan 段后紧跟 TodoWrite 段同样去重留后者（规则混合覆盖）', () => {
    const nodes = turnNodes([
      assistantMessage(
        processTag({ executeId: 'plan-1', name: 'Plan', type: 'Plan' }) +
          processTag({ executeId: 'ex-2', name: '6 todos' }),
        [
          {
            result: {
              executeId: 'plan-1',
              name: 'Plan',
              type: 'Plan',
              success: true,
              startTime: 1,
              endTime: 2,
              data: [{ status: 'completed', content: '计划步骤' }],
            },
          },
          executedEntry({ executeId: 'ex-2', name: '6 todos' }),
        ],
      ),
    ]);
    expect(nodes.some((item) => item.executeId === 'plan-1')).toBe(false);
    expect(nodes.some((item) => item.executeId === 'ex-2')).toBe(true);
  });

  it('两次 TodoWrite 中间夹普通工具段：各自保留（与 Plan 语义一致，只去相邻）', () => {
    const nodes = turnNodes([
      assistantMessage(
        processTag({ executeId: 'ex-1', name: '5 todos' }) +
          processTag({ executeId: 'read-1', name: '读取文件' }) +
          processTag({ executeId: 'ex-2', name: '6 todos' }),
        [
          executedEntry({ executeId: 'ex-1', name: '5 todos' }),
          {
            result: {
              executeId: 'read-1',
              name: '读取文件',
              type: 'ToolCall',
              success: true,
              startTime: 1,
              endTime: 2,
              input: { file_path: 'a.ts' },
            },
          },
          executedEntry({ executeId: 'ex-2', name: '6 todos' }),
        ],
      ),
    ]);
    expect(nodes.some((item) => item.executeId === 'ex-1')).toBe(true);
    expect(nodes.some((item) => item.executeId === 'ex-2')).toBe(true);
  });
});
