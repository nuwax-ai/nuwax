import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { DisplayRecommendFunctionTypeEnum } from '@/types/interfaces/displayRecommend';
import { describe, expect, it } from 'vitest';
import {
  buildHomeSendPlan,
  resolvePersonalWorkspaceDir,
  type HomeSendPlanInput,
} from './homeSendPlan';

const BASE_INPUT: HomeSendPlanInput = {
  currentAgentId: 42,
  message: 'hello',
};

describe('resolvePersonalWorkspaceDir', () => {
  it('个人电脑 + 目录 → 带目录', () => {
    expect(resolvePersonalWorkspaceDir('5', '/home/x')).toBe('/home/x');
  });

  it('个人电脑未选目录 / 云电脑 / 未选电脑 → 不带', () => {
    expect(resolvePersonalWorkspaceDir('5', '')).toBeUndefined();
    expect(resolvePersonalWorkspaceDir('5', undefined)).toBeUndefined();
    expect(resolvePersonalWorkspaceDir('-1', '/home/x')).toBeUndefined();
    expect(resolvePersonalWorkspaceDir(undefined, '/home/x')).toBeUndefined();
  });
});

describe('buildHomeSendPlan 分支决策', () => {
  it('纯对话：无上框 + 对话型推荐 → 建会话分支', () => {
    const plan = buildHomeSendPlan({
      ...BASE_INPUT,
      selectedFunctionType: DisplayRecommendFunctionTypeEnum.Chat,
      files: undefined,
    });
    expect(plan.kind).toBe('createConversation');
    if (plan.kind !== 'createConversation') return;
    expect(plan.agentId).toBe(42);
    expect(plan.attach.message).toBe('hello');
    expect(plan.attach.messageSourceType).toBe('home');
    expect(plan.attach.projectId).toBeUndefined();
  });

  it('纯对话：workspaceDir 仅个人电脑时携带', () => {
    const cloud = buildHomeSendPlan({
      ...BASE_INPUT,
      selectedComputerId: '-1',
      workspaceDir: '/tmp/a',
    });
    expect(
      cloud.kind === 'createConversation' && cloud.attach.workspaceDir,
    ).toBeUndefined();

    const personal = buildHomeSendPlan({
      ...BASE_INPUT,
      selectedComputerId: '9',
      workspaceDir: '/tmp/a',
    });
    expect(
      personal.kind === 'createConversation' && personal.attach.workspaceDir,
    ).toBe('/tmp/a');
  });

  it('项目类推荐 → 建项目分支：payload/spaceId/devAgentId 口径不变', () => {
    const plan = buildHomeSendPlan({
      ...BASE_INPUT,
      selectedFunctionType: DisplayRecommendFunctionTypeEnum.UserAppDev,
      selectedSpaceId: 7,
      fallbackSpaceId: 3,
      infos: [{ componentId: 1 } as never],
      selectedComputerId: '9',
      workspaceDir: '/tmp/a',
    });
    expect(plan.kind).toBe('createProject');
    if (plan.kind !== 'createProject') return;
    expect(plan.spaceId).toBe(7); // UserAppDev 需要空间选择器 → 选中空间
    expect(plan.payload.type).toBe(AgentComponentTypeEnum.UserApp);
    expect(plan.payload.prompt).toBe('hello');
    expect(plan.payload.tools).toHaveLength(1);
    expect(plan.payload.computerId).toBe('9');
    expect(plan.payload.workspaceDir).toBe('/tmp/a');
    expect(plan.payload.agentId).toBe(42);
    expect(plan.payload.devAgentId).toBe(42);
  });

  it('项目类推荐（PageAppDev 同样需要空间选择器）→ 取选中空间', () => {
    // 六个项目类功能类型均在空间选择器集合内（与原 Home 行为一致），
    // fallbackSpaceId 仅作缺省兜底保留
    const plan = buildHomeSendPlan({
      ...BASE_INPUT,
      selectedFunctionType: DisplayRecommendFunctionTypeEnum.PageAppDev,
      selectedSpaceId: 7,
      fallbackSpaceId: 3,
    });
    expect(plan.kind === 'createProject' ? plan.spaceId : undefined).toBe(7);
  });

  it('项目类推荐未选空间 → spaceId 缺失由执行侧提示', () => {
    const plan = buildHomeSendPlan({
      ...BASE_INPUT,
      selectedFunctionType: DisplayRecommendFunctionTypeEnum.UserAppDev,
      selectedSpaceId: undefined,
      fallbackSpaceId: undefined,
    });
    expect(
      plan.kind === 'createProject' ? plan.spaceId : undefined,
    ).toBeUndefined();
  });

  it('上框（常规项目）优先于项目类推荐：直接建会话绑定项目', () => {
    const plan = buildHomeSendPlan({
      ...BASE_INPUT,
      selectedFunctionType: DisplayRecommendFunctionTypeEnum.NormalProjectDev,
      pinnedProject: {
        projectId: 100,
        spaceId: 8,
        projectType: AgentComponentTypeEnum.NormalProject,
        name: '常规项目A',
        sandboxId: 66,
      },
      selectedComputerId: '9',
      workspaceDir: '/tmp/a',
    });
    expect(plan.kind).toBe('createConversation');
    if (plan.kind !== 'createConversation') return;
    expect(plan.attach.projectId).toBe(100);
    expect(plan.attach.sandboxId).toBe(66);
    // 常规项目上框：不默认命中智能体语义 → 不带 devAgentId、不跳 IDE
    expect(plan.attach.devAgentId).toBeUndefined();
    expect(plan.attach.redirectUrl).toBeUndefined();
    // 上框期间工作区由项目隐含，不携带电脑选择与目录
    expect(plan.attach.selectedComputerId).toBeUndefined();
    expect(plan.attach.workspaceDir).toBeUndefined();
  });

  it('上框（全栈项目）：带 devAgentId + redirectUrl 前缀 + 项目沙箱', () => {
    const plan = buildHomeSendPlan({
      ...BASE_INPUT,
      pinnedProject: {
        projectId: 200,
        spaceId: 8,
        projectType: AgentComponentTypeEnum.UserApp,
        name: '全栈B',
        sandboxId: 88,
        devAgentId: 42,
      },
    });
    expect(plan.kind).toBe('createConversation');
    if (plan.kind !== 'createConversation') return;
    expect(plan.attach.projectId).toBe(200);
    expect(plan.attach.devAgentId).toBe(42);
    expect(plan.attach.sandboxId).toBe(88);
    expect(plan.attach.redirectUrl).toBe(
      '/space/8/app-pro?appId=200&conversationId=',
    );
  });

  it('上框（全栈项目）缺 spaceId：降级不带 redirectUrl', () => {
    const plan = buildHomeSendPlan({
      ...BASE_INPUT,
      pinnedProject: {
        projectId: 200,
        projectType: AgentComponentTypeEnum.UserApp,
        name: '全栈C',
      },
    });
    expect(
      plan.kind === 'createConversation' && plan.attach.redirectUrl,
    ).toBeUndefined();
  });

  it('上框项目无 sandboxId：不携带 sandboxId 字段', () => {
    const plan = buildHomeSendPlan({
      ...BASE_INPUT,
      pinnedProject: {
        projectId: 300,
        projectType: AgentComponentTypeEnum.NormalProject,
        name: '常规D',
      },
    });
    expect(
      plan.kind === 'createConversation' && plan.attach.sandboxId,
    ).toBeUndefined();
  });
});
