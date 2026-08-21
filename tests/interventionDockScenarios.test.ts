/**
 * Mock 场景脚本与 AgentIntervention applier 的合同测试。
 *
 * /mock-chat 验收页的干预场景（权限审批 / ask-question / OpenUI inline）必须能被
 * processInterventionSsePatch 识别——否则 SSE 回放落入普通 PROCESSING 分支，
 * DockPanel 卡片与 OpenUI 渲染块不会出现。本测试按 conversationInfo model 的
 * 消费方式回放场景事件流，锁定场景载荷与 applier 判别口径的对齐。
 */
import { processInterventionSsePatch } from '@/components/business-component/AgentIntervention/utils/processInterventionSsePatch';
import {
  MOCK_SCENARIOS,
  type MockScenario,
} from '@/mocks/conversationScenarios';
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { extractTaskResult } from '@/utils';
import { normalizeFileDiffItems } from '@/utils/fileChangeDiff';
import { describe, expect, it, vi } from 'vitest';

// reconcile 链经 i18nRuntime → services/i18n → umi request 引入 esbuild 传递依赖，
// 非 umi 测试环境下崩溃；mock 掉字典读取即可（对齐 conversationInfoModel.test 做法）。
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

const getScenario = (id: string): MockScenario => {
  const scenario = MOCK_SCENARIOS.find((s) => s.id === id);
  if (!scenario) throw new Error(`scenario not found: ${id}`);
  return scenario;
};

/** 按 conversationInfo model 的 SSE 处理方式回放场景，返回终态消息。 */
const replayScenario = (id: string): MessageInfo => {
  let current = { id: `msg-${id}` } as MessageInfo;
  for (const event of getScenario(id).events) {
    const patched = processInterventionSsePatch(event as never, current, [
      current,
    ]);
    if (patched) current = patched;
  }
  return current;
};

/**
 * 在 replayScenario 基础上补齐 model 的普通 PROCESSING 分支：
 * 干预 applier 未命中时按 executeId upsert processingList 并写 text 块，
 * 用于校验 Plan / 普通工具类场景的数据演进。
 */
const replayProcessingScenario = (id: string): MessageInfo => {
  let current = {
    id: `msg-${id}`,
    text: '',
    processingList: [],
  } as unknown as MessageInfo;
  for (const event of getScenario(id).events) {
    const res = event as never;
    const patched = processInterventionSsePatch(res, current, [current]);
    if (patched) {
      current = patched;
      continue;
    }
    if ((res as any).eventType !== 'PROCESSING') continue;
    const data = { ...((res as any).data as Record<string, unknown>) };
    const result = (data.result ?? {}) as Record<string, unknown>;
    // model 会把 result.executeId 提升到顶层，否则 upsert 去重失效
    if (!data.executeId && result.executeId) data.executeId = result.executeId;
    const list = [...(current.processingList || [])] as any[];
    const index = list.findIndex((item) => item.executeId === data.executeId);
    if (index > -1) list[index] = data;
    else list.push(data);
    current = {
      ...current,
      processingList: list,
      text: getCustomBlock(current.text || '', data as any),
    } as MessageInfo;
  }
  return current;
};

describe('mock 场景 ↔ 干预 applier 合同', () => {
  it('权限审批场景产出 acpPermissionInteractions（DockPanel 审批卡数据源）', () => {
    for (const id of [
      'PERMISSION_REQUEST',
      'PERMISSION_DENY',
      'PERMISSION_TIMEOUT',
    ]) {
      const message = replayScenario(id);
      const interactions = message.acpPermissionInteractions || [];
      expect(interactions, id).toHaveLength(1);
      expect(
        interactions[0].intervention.acp.request.sessionId,
        id,
      ).toBeTruthy();
      expect(
        interactions[0].intervention.acp.request.toolCall.toolCallId,
        id,
      ).toBeTruthy();
      // 选项须带 optionId/name，否则审批卡无法渲染按钮
      expect(
        interactions[0].intervention.acp.request.options.length,
        id,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it('ask-question 场景产出 mcpAskInteractions（问答表单卡数据源）', () => {
    for (const id of ['ASK_QUESTION', 'ASK_QUESTION_UNANSWERED']) {
      const message = replayScenario(id);
      const interactions = message.mcpAskInteractions || [];
      expect(interactions, id).toHaveLength(1);
      expect(interactions[0].input.schemaVersion, id).toBe('nuwax.mcp_ask.v2');
      // fields 为空会被 parseMcpAskToolInput 拒绝，卡片不出现
      expect(
        (interactions[0].input.ui.fields || []).length,
        id,
      ).toBeGreaterThan(0);
    }
  });

  it('OpenUI inline 场景产出携带 render input 的 processing 项', () => {
    for (const id of ['OPENUI_RENDER', 'OPENUI_INTERACTIVE']) {
      const message = replayScenario(id);
      const openuiItems = (message.processingList || []).filter(
        (item) =>
          (item.result as any)?.input?.schemaVersion === 'nuwax.openui/v1',
      );
      expect(openuiItems, id).toHaveLength(1);
      expect(openuiItems[0].result?.input?.document?.language, id).toBe(
        'openui-lang',
      );
      // markdown-custom-process 块是渲染组件的挂载点
      expect(message.text, id).toContain('markdown-custom-process');
    }
  });

  it('混合干预场景三类产物齐备', () => {
    const message = replayScenario('INTERVENTION_MIXED');
    expect(message.acpPermissionInteractions).toHaveLength(1);
    expect(message.mcpAskInteractions).toHaveLength(1);
    const openuiItems = (message.processingList || []).filter(
      (item) =>
        (item.result as any)?.input?.schemaVersion === 'nuwax.openui/v1',
    );
    expect(openuiItems).toHaveLength(1);
  });

  it('Plan 场景：同 executeId 快照演进，列表收敛到全 completed + FINISHED', () => {
    const message = replayProcessingScenario('PLAN_PROCESSING');
    const planItems = (message.processingList || []).filter(
      (item: any) => item.type === 'Plan',
    );
    // 多次快照必须 upsert 同一项，不能堆积成多个计划块
    expect(planItems).toHaveLength(1);
    expect(planItems[0].status).toBe('FINISHED');
    const steps = (planItems[0].result as any)?.data;
    expect(Array.isArray(steps)).toBe(true);
    // 真实抓包样本：7 步任务全 completed，priority 字段按线上载荷保留
    expect(steps.map((s: any) => s.status)).toEqual(
      Array.from({ length: 7 }, () => 'completed'),
    );
    expect(steps.every((s: any) => s.priority === 'medium')).toBe(true);
    // text 中 markdown-custom-process 块同 executeId 只保留一个（数开标签，
    // 闭标签与开标签同名的匹配会让单块计数翻倍）
    const blockCount = (message.text?.match(/<markdown-custom-process /g) || [])
      .length;
    expect(blockCount).toBe(1);
  });

  it('全景展示场景：Plan + 11 种 process type + diff + OpenUI + 标签组合齐备', () => {
    const message = replayProcessingScenario('RENDER_SHOWCASE');

    // 11 种 AgentComponentTypeEnum + Plan 各成一个块（Event 渲染层返回 null；
    // ToolCall 有多个实例——工具/diff/openui 各一，按类型去重比较）
    const types = (message.processingList || []).map((item: any) => item.type);
    expect([...new Set(types)].sort()).toEqual(
      [
        'ToolCall',
        'Mcp',
        'Skill',
        'SubAgent',
        'Workflow',
        'Knowledge',
        'Table',
        'Model',
        'Plugin',
        'Page',
        'Event',
        'Plan',
      ].sort(),
    );

    // Plan 收敛到全 completed + FINISHED
    const planItem = (message.processingList || []).find(
      (item: any) => item.type === 'Plan',
    ) as any;
    expect(planItem.status).toBe('FINISHED');
    expect(planItem.result.data.map((s: any) => s.status)).toEqual([
      'completed',
      'completed',
      'completed',
    ]);

    // Page 类型携带 uri 预览输入
    const pageItem = (message.processingList || []).find(
      (item: any) => item.type === 'Page',
    ) as any;
    expect(pageItem?.result?.input?.uri).toBe('/home/report');

    // 文件 diff：修改 + 删除 + 新增三类变更
    const diffItems = (message.processingList || []).flatMap(
      (item: any) => normalizeFileDiffItems(item.result) || [],
    );
    expect(diffItems.map((d: any) => d.path)).toEqual([
      'report/index.html',
      'report/styles.css',
      'report/summary.md',
    ]);

    // OpenUI inline render input
    const openuiItems = (message.processingList || []).filter(
      (item: any) =>
        (item.result as any)?.input?.schemaVersion === 'nuwax.openui/v1',
    );
    expect(openuiItems).toHaveLength(1);

    // group 容器 + conversation 链接 + task-result 双卡在流式正文里
    const scenario = getScenario('RENDER_SHOWCASE');
    const allText = scenario.events
      .map((event) => (event.data?.text as string) || '')
      .join('');
    expect(allText).toContain('<markdown-custom-process-group');
    expect(allText).toContain('<conversation ');
    expect(allText.match(/<task-result>/g)?.length).toBe(2);

    // FINAL_RESULT 输出可解析出文件结果卡
    const final = scenario.events.find(
      (event) => event.eventType === 'FINAL_RESULT',
    );
    const taskResult = extractTaskResult(
      (final?.data?.outputText as string) || '',
    );
    expect(taskResult.hasTaskResult).toBe(true);
    expect(taskResult.file).toBe('999999/report/index.html');
  });

  it('会话续接场景：半途快照 + sub 流从断点继续 + 不重复输出', () => {
    const scenario = getScenario('SESSION_RESUME');
    expect(scenario.transport).toBe('sub-only');
    expect(scenario.entry).toBe('resume');

    // 详情快照：用户消息 + 执行中 assistant（带 EXECUTING processing 中间态）
    const [user, assistant] = scenario.initialMessages || [];
    expect(user?.role).toBe('USER');
    expect(assistant?.role).toBe('ASSISTANT');
    expect(assistant?.status).toBe('loading');
    const executing = ((assistant?.processingList as any[]) || []).filter(
      (item) => item.status === 'EXECUTING',
    );
    expect(executing).toHaveLength(1);

    // sub 流首事件补完快照中执行中的工具（同 executeId，model 会把
    // result.executeId 提升到顶层，此处兼容两种位置），再输出剩余分片与终态
    const events = scenario.events;
    const firstData = events[0].data as any;
    expect(firstData?.executeId ?? firstData?.result?.executeId).toBe(
      executing[0].executeId,
    );
    expect(firstData?.status).toBe('FINISHED');
    expect(events[events.length - 1].eventType).toBe('FINAL_RESULT');

    // sub 事件文本与快照文本不重复（续接而非重放）
    const snapshotTexts = new Set(
      (scenario.initialMessages || []).map((m) => String(m.text)),
    );
    const resumedTexts = events
      .filter((event) => event.eventType === 'MESSAGE')
      .map((event) => String((event.data as any)?.text));
    expect(resumedTexts.some((text) => snapshotTexts.has(text))).toBe(false);
  });

  it('重复 ask 场景：真实载荷（result.data 路径）产出两张独立卡', () => {
    const message = replayScenario('ASK_DUPLICATE');
    const interactions = message.mcpAskInteractions || [];
    // 两次同 title 不同 requestId：必须两张卡，不因 title 相同被去重合并
    expect(interactions).toHaveLength(2);
    expect(new Set(interactions.map((item) => item.input.requestId)).size).toBe(
      2,
    );
    // 六种 widget 的富表单全部保留
    const widgets = interactions[0].input.ui.fields?.map(
      (field: any) => field.widget,
    );
    expect(widgets).toEqual(
      expect.arrayContaining([
        'file',
        'text',
        'select',
        'radio',
        'checkboxes',
        'number',
      ]),
    );
  });

  it('多干预堆叠场景：权限（四选项/编辑类）+ ask 三卡齐备', () => {
    const message = replayScenario('INTERVENTION_STACK');
    const acp = message.acpPermissionInteractions || [];
    expect(acp).toHaveLength(2);
    // 第一张：execute 类四选项（吸纳演示页的完整选项集）
    expect(acp[0].intervention.acp.request.options.map((o) => o.kind)).toEqual([
      'allow_once',
      'allow_always',
      'reject_once',
      'reject_always',
    ]);
    expect(acp[0].intervention.acp.request.toolCall.kind).toBe('execute');
    // 第二张：文件编辑类权限
    expect(acp[1].intervention.acp.request.toolCall.kind).toBe('edit');
    expect(acp[1].intervention.acp.request.toolCall.rawInput).toMatchObject({
      file_path: 'src/app.tsx',
    });
    expect(message.mcpAskInteractions || []).toHaveLength(1);
  });

  it('消息队列场景：keep-open 悬挂且无终态事件', () => {
    const scenario = getScenario('MESSAGE_QUEUE_HOLDING');
    expect(scenario.transport).toBe('keep-open');
    const eventTypes = scenario.events.map((event) => event.eventType);
    expect(eventTypes).not.toContain('FINAL_RESULT');
    expect(eventTypes).not.toContain('ERROR');
    expect(eventTypes.filter((type) => type === 'HEART_BEAT').length).toBe(6);
  });

  it('普通场景不被干预 applier 误命中', () => {
    const message = replayScenario('NORMAL_SINGLE');
    expect(message.acpPermissionInteractions ?? []).toHaveLength(0);
    expect(message.mcpAskInteractions ?? []).toHaveLength(0);
  });
});
