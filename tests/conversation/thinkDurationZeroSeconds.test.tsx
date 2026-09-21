/**
 * 思考行耗时缺时间戳兜底（禅道bug2492）：
 *
 * 思考段没有任何后端时间戳，V2 轨迹行时长由投影层内存锚点
 * （首见 running 打点 → 翻 finished 收口）推得。0 秒显示的根因分支：
 * 1. 后端把整段思考一次性突发落盘：观测窗口不足 1 秒，秒级取整后显示「0 秒」；
 * 2. 陈旧锚点复用（跨会话切换/无 id 消息位置兜底键漂移致同 nodeId 复用）：
 *    旧锚点已带 end，新行首见 running 不重开锚点，套用上一任起止；
 * 3. Math.max(0,·) 把时钟回拨的负差值钳成 0。
 *
 * 契约：窗口 ≥ THINK_DURATION_MIN_MS 才产出 durationMs（展示「持续了」），
 * 否则一律 undefined（回落首行摘要），任何路径都不得显示「持续了 0 秒」。
 */
import { projectConversation } from '@/features/conversation/presentation-v2';
import { __resetThinkTimingAnchorsForTest } from '@/features/conversation/presentation-v2/projectConversation';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const thinkTag = (status: 'thinking' | 'finished', content: string) =>
  `\n\n<div><markdown-custom-think status="${status}" content="${encodeURIComponent(
    content,
  )}"></markdown-custom-think></div>\n\n`;

const assistantMessage = (text: string): MessageInfo =>
  ({
    id: 'a1',
    role: AssistantRoleEnum.ASSISTANT,
    text,
    time: '',
    think: '',
    componentExecutedList: [],
    messageType: 'ASSISTANT',
    index: 0,
  }) as unknown as MessageInfo;

/** 投影后唯一的 reasoning 节点（本组用例每轮只放一个思考段） */
const onlyReasoningNode = (list: MessageInfo[]) => {
  const nodes = projectConversation(list).turns[0]?.nodes ?? [];
  return nodes.find((node) => node.kind === 'reasoning');
};

describe('思考行耗时锚点（bug2492：缺时间戳不显示 0 秒）', () => {
  beforeEach(() => {
    __resetThinkTimingAnchorsForTest();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    __resetThinkTimingAnchorsForTest();
  });

  it('正常窗口（≥1s）：运行→完成产出真实时长', () => {
    vi.setSystemTime(0);
    onlyReasoningNode([assistantMessage(thinkTag('thinking', '想一想'))]);
    vi.setSystemTime(1500);
    const node = onlyReasoningNode([
      assistantMessage(thinkTag('finished', '想一想')),
    ]);
    // 勿影响正常耗时显示：1.5s 观测窗口原样产出
    expect(node?.durationMs).toBe(1500);
  });

  it('突发落盘（<1s 观测窗口）：不产出时长，绝不显示 0 秒', () => {
    vi.setSystemTime(0);
    onlyReasoningNode([assistantMessage(thinkTag('thinking', '想一想'))]);
    vi.setSystemTime(300);
    const node = onlyReasoningNode([
      assistantMessage(thinkTag('finished', '想一想')),
    ]);
    // 后端一次性落盘时首尾分片间隔常在百毫秒级——秒级粒度下不可推断
    expect(node?.durationMs).toBeUndefined();
  });

  it('首见即终态（历史消息/整轮单次提交）：不臆造时长', () => {
    vi.setSystemTime(0);
    const node = onlyReasoningNode([
      assistantMessage(thinkTag('finished', '历史思考')),
    ]);
    expect(node?.durationMs).toBeUndefined();
  });

  it('陈旧锚点复用：同 nodeId 重新出现 running 时重开锚点，不套用上一任起止', () => {
    vi.setSystemTime(1000);
    onlyReasoningNode([assistantMessage(thinkTag('thinking', '第一任'))]);
    vi.setSystemTime(3000);
    onlyReasoningNode([assistantMessage(thinkTag('finished', '第一任'))]);
    // 同一 nodeId 的「新一行」：首见 running 必须重开锚点（旧锚点已带 end）
    vi.setSystemTime(5000);
    onlyReasoningNode([assistantMessage(thinkTag('thinking', '复用行'))]);
    vi.setSystemTime(6200);
    const node = onlyReasoningNode([
      assistantMessage(thinkTag('finished', '复用行')),
    ]);
    // 取新窗口 1200ms，而不是旧锚点的 2000ms
    expect(node?.durationMs).toBe(1200);
  });

  it('时钟回拨产生负差值：按不可推断处理，不钳制成 0', () => {
    vi.setSystemTime(10_000);
    onlyReasoningNode([assistantMessage(thinkTag('thinking', '回拨前'))]);
    vi.setSystemTime(9000);
    const node = onlyReasoningNode([
      assistantMessage(thinkTag('finished', '回拨后')),
    ]);
    // end - start = -1000：修复前 Math.max(0,·) 会显示「持续了 0 秒」
    expect(node?.durationMs).toBeUndefined();
  });
});
