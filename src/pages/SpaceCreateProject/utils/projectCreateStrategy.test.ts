import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentComponentTypeEnum } from '@/types/enums/agent';

const { historyPushMock, apiProjectCreateMock } = vi.hoisted(() => ({
  historyPushMock: vi.fn(),
  apiProjectCreateMock: vi.fn(),
}));
const { emitProjectChangedMock, emitConversationChangedMock } = vi.hoisted(
  () => ({
    emitProjectChangedMock: vi.fn(),
    emitConversationChangedMock: vi.fn(),
  }),
);

// projectCreateStrategy 传递依赖 umi / services（vitest 不能引入 umi 模块，最小 mock）
vi.mock('umi', () => ({
  history: { push: historyPushMock },
}));
vi.mock('@/services/appDev', () => ({
  apiProjectCreate: apiProjectCreateMock,
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));
vi.mock('@/hooks/useAppDevInitialAutoSend', () => ({
  createAppDevInitialPayloadKey: (id: number) => `app-dev-initial-${id}`,
}));
vi.mock('antd', () => ({
  message: { error: vi.fn() },
}));
// 目录同步事件总线：断言「创建后到底发没发」——bug 2407/2413 的排查起点
vi.mock('@/utils/directorySyncEvents', () => ({
  emitProjectChanged: emitProjectChangedMock,
  emitConversationChanged: emitConversationChangedMock,
}));

import { createProjectAndNavigate } from './projectCreateStrategy';

const setContextMock = vi.fn();

const runCreate = async (type: AgentComponentTypeEnum) => {
  await createProjectAndNavigate({
    payload: { type, prompt: '帮我写个工具', agentId: 7, devAgentId: 7 },
    spaceId: 1,
    setContext: setContextMock,
  });
};

beforeEach(() => {
  historyPushMock.mockClear();
  apiProjectCreateMock.mockReset();
  apiProjectCreateMock.mockResolvedValue({
    data: {
      targetType: 'NormalProject',
      targetId: 92,
      conversationId: 1562257,
    },
  });
  setContextMock.mockClear();
  emitProjectChangedMock.mockClear();
  emitConversationChangedMock.mockClear();
});

describe('createProjectAndNavigate 跳转策略', () => {
  it.each([
    [
      AgentComponentTypeEnum.Agent,
      '/space/1/agent-dev?agentId=92&conversationId=1562257',
    ],
    [AgentComponentTypeEnum.PageApp, '/space/1/app-dev/92'],
    [
      AgentComponentTypeEnum.UserApp,
      '/space/1/app-pro/92/1562257',
    ],
    [AgentComponentTypeEnum.NormalProject, '/home/chat/1562257/7'],
    [
      AgentComponentTypeEnum.Skill,
      '/space/1/skill-details-conversation/92?conversationId=1562257',
    ],
    [
      AgentComponentTypeEnum.Plugin,
      '/space/1/plugin/92/cloud-tool?conversationId=1562257',
    ],
  ])('%s 新建后将工具和首条消息带到详情', async (type, url) => {
    const tools = [{ id: 23, type: AgentComponentTypeEnum.Plugin }];
    await createProjectAndNavigate({
      payload: {
        type,
        prompt: '验收首条消息',
        tools,
        agentId: 7,
        devAgentId: 7,
      },
      spaceId: 1,
      setContext: setContextMock,
    });

    expect(historyPushMock).toHaveBeenCalledWith(
      url,
      expect.objectContaining({ message: '验收首条消息', infos: tools }),
    );
    if (type === AgentComponentTypeEnum.PageApp) {
      expect(setContextMock).toHaveBeenCalledWith(
        'app-dev-initial-92',
        expect.objectContaining({ message: '验收首条消息', infos: tools }),
      );
    }
  });

  it('常规项目 → /home/chat/{conversationId}/{agentId}（不再误跳全栈 app-pro）', async () => {
    await runCreate(AgentComponentTypeEnum.NormalProject);

    expect(historyPushMock).toHaveBeenCalledWith(
      '/home/chat/1562257/7',
      expect.objectContaining({ message: '帮我写个工具' }),
    );
  });

  it('全栈项目 URL 保持不变（app-pro）', async () => {
    await runCreate(AgentComponentTypeEnum.UserApp);

    expect(historyPushMock).toHaveBeenCalledWith(
      '/space/1/app-pro/92/1562257',
      expect.anything(),
    );
  });

  it('智能体 URL 保持不变（agent-dev）', async () => {
    await runCreate(AgentComponentTypeEnum.Agent);

    expect(historyPushMock).toHaveBeenCalledWith(
      '/space/1/agent-dev?agentId=92&conversationId=1562257',
      expect.anything(),
    );
  });

  it('业务失败（响应缺 targetId）不跳转', async () => {
    apiProjectCreateMock.mockResolvedValue({ data: {}, message: '目录被占用' });

    await runCreate(AgentComponentTypeEnum.NormalProject);

    expect(historyPushMock).not.toHaveBeenCalled();
  });
});

// 目录同步事件总线是侧栏项目面板能自动刷新的唯一信号源（bug 2407 / 2413）。
// 校验「哪些项目类型该发、哪些不该发」与回填字段，防止回归成静默不发。
describe('createProjectAndNavigate 目录同步事件', () => {
  it.each([
    AgentComponentTypeEnum.NormalProject,
    AgentComponentTypeEnum.UserApp,
    AgentComponentTypeEnum.PageApp,
  ])(
    '%s 创建后发 ProjectChanged + ConversationChanged 双事件',
    async (type) => {
      await runCreate(type);

      expect(emitProjectChangedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'created',
          project: { projectId: '92', projectType: type, spaceId: '1' },
          reason: 'create',
        }),
      );
      expect(emitConversationChangedMock).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'created',
          conversationId: '1562257',
          project: { projectId: '92', projectType: type, spaceId: '1' },
        }),
      );
    },
  );

  it.each([
    AgentComponentTypeEnum.Agent,
    AgentComponentTypeEnum.Skill,
    AgentComponentTypeEnum.Plugin,
  ])('%s 不属项目目录，不发 ProjectChanged', async (type) => {
    await runCreate(type);

    expect(emitProjectChangedMock).not.toHaveBeenCalled();
  });

  it('项目类但回包缺 conversationId 时只发项目事件', async () => {
    apiProjectCreateMock.mockResolvedValue({
      data: { targetId: 92 },
    });

    await runCreate(AgentComponentTypeEnum.NormalProject);

    expect(emitProjectChangedMock).toHaveBeenCalledTimes(1);
    expect(emitConversationChangedMock).not.toHaveBeenCalled();
  });

  it('策略未登记的类型（无跳转目标）两个事件都不发', async () => {
    await createProjectAndNavigate({
      payload: {
        type: 'NotRegisteredType' as AgentComponentTypeEnum,
        prompt: 'x',
      },
      spaceId: 1,
      setContext: setContextMock,
    });

    expect(historyPushMock).not.toHaveBeenCalled();
    expect(emitProjectChangedMock).not.toHaveBeenCalled();
    expect(emitConversationChangedMock).not.toHaveBeenCalled();
  });
});
