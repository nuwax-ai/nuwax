import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AgentComponentTypeEnum } from '@/types/enums/agent';

const { historyPushMock, apiProjectCreateMock } = vi.hoisted(() => ({
  historyPushMock: vi.fn(),
  apiProjectCreateMock: vi.fn(),
}));

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
    data: { targetType: 'NormalProject', targetId: 92, conversationId: 1562257 },
  });
  setContextMock.mockClear();
});

describe('createProjectAndNavigate 跳转策略', () => {
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
      '/space/1/app-pro?appId=92&conversationId=1562257',
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
