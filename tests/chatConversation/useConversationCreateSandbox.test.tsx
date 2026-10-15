/**
 * useConversation 创建会话 sandboxId 报文归一测试（禅道 bug2443）。
 *
 * 首页链 create 携带的沙箱 id 历史上经 `Number(personalComputerId ?? -1)` 转换：
 * 非数字形态（新沙箱）id 被转成 NaN（JSON 序列化为 null），会话被后端静默按
 * 「未选沙箱」创建，随后 chat 携带原始字符串又被后端 Long 字段拒（400）。
 * 本用例锁定归一语义：数字形态转 number、非数字透传字符串，未选容器不传。
 */
import useConversation from '@/hooks/useConversation';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { buildHomeSendPlan } from '@/utils/homeSendPlan';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockCreate, mockHistoryPush, mockMessageError } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockHistoryPush: vi.fn(),
  mockMessageError: vi.fn(),
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationCreate: (...args: unknown[]) => mockCreate(...args),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('antd', () => ({
  message: { error: (...args: unknown[]) => mockMessageError(...args) },
}));

vi.mock('umi', () => ({
  history: { push: (...args: unknown[]) => mockHistoryPush(...args) },
}));

vi.mock('@/utils/directorySyncEvents', () => ({
  emitConversationChanged: vi.fn(),
}));

const SUCCESS_CREATE = { success: true, data: { id: 9527, agentId: 3091 } };

describe('useConversation.handleCreateConversation sandboxId 归一（bug2443）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(SUCCESS_CREATE);
  });

  const create = async (attach?: Record<string, unknown>) => {
    const { result } = renderHook(() => useConversation());
    await act(async () => {
      await result.current.handleCreateConversation(3091, attach as never);
    });
    expect(mockCreate).toHaveBeenCalledTimes(1);
    return mockCreate.mock.calls[0][0] as Record<string, unknown>;
  };

  it('未选容器：请求不带 sandboxId 或工作目录', async () => {
    const payload = await create({
      message: 'hi',
      workspacePath: '/tmp/stale',
    });
    expect(payload).not.toHaveProperty('sandboxId');
    expect(payload).not.toHaveProperty('workspacePath');
  });

  it('不带 attach 的空会话：请求不补 sandboxId', async () => {
    expect(await create()).not.toHaveProperty('sandboxId');
  });

  it('选中云端电脑：携带云电脑哨兵 -1（number）', async () => {
    const payload = await create({ message: 'hi', selectedComputerId: '-1' });
    expect(payload.sandboxId).toBe(-1);
    expect(payload.workspacePath).toBeUndefined();
  });

  it('数字形态个人电脑：转 number 携带并随带工作目录', async () => {
    const payload = await create({
      message: 'hi',
      selectedComputerId: '377',
      workspacePath: '/tmp/proj',
    });
    expect(payload.sandboxId).toBe(377);
    expect(payload.workspacePath).toBe('/tmp/proj');
  });

  it('非数字形态个人电脑（新沙箱 id）：透传字符串，勿转 NaN/null', async () => {
    const payload = await create({
      message: 'hi',
      selectedComputerId: 'sb-a1b2c3',
      workspacePath: '/tmp/proj',
    });
    // 历史行为断点：Number('sb-a1b2c3') = NaN → JSON null（会话静默失去所选沙箱）
    expect(payload.sandboxId).toBe('sb-a1b2c3');
    expect(payload.workspacePath).toBe('/tmp/proj');
  });

  it('项目上框链路：attach.sandboxId（含字符串形态）原样透传', async () => {
    const payload = await create({
      message: 'hi',
      projectId: 100,
      projectType: 5,
      sandboxId: 'sb-a1b2c3',
    });
    expect(payload.projectId).toBe(100);
    expect(payload.sandboxId).toBe('sb-a1b2c3');
  });

  it('全栈项目上框未开放容器选择：创建请求绑定项目，不带项目原有沙箱', async () => {
    const plan = buildHomeSendPlan({
      currentAgentId: 3091,
      message: 'hi',
      pinnedProject: {
        projectId: 261,
        spaceId: 8,
        projectType: AgentComponentTypeEnum.UserApp,
        name: 'xxxx',
        sandboxId: 333,
      },
      selectedComputerId: '377',
      workspacePath: '/tmp/stale',
    });
    expect(plan.kind).toBe('createConversation');
    if (plan.kind !== 'createConversation') return;
    const payload = await create({ ...plan.attach });
    expect(payload).toMatchObject({
      projectId: 261,
      projectType: 'UserApp',
      devAgentId: 3091,
    });
    expect(payload).not.toHaveProperty('sandboxId');
    expect(payload).not.toHaveProperty('workspacePath');
    expect(mockHistoryPush).toHaveBeenCalledWith(
      '/space/8/app-pro/261/9527',
      expect.not.objectContaining({ selectedComputerId: expect.anything() }),
    );
  });
});
