import { saveWorkflow } from '@/services/workflow';
import { request } from 'umi';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('umi', () => ({
  request: vi.fn(),
}));

describe('workflow service', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
    window.history.pushState({}, '', '/');
  });

  it('should short-circuit save in AgentFlow mock mode', async () => {
    window.history.pushState(
      {},
      '',
      '/space/1/agent-flow/1?mockAgentFlow=true',
    );

    const result = await saveWorkflow({
      workflowConfig: {
        editVersion: 7,
      } as any,
    });

    expect(result.code).toBe('0000');
    expect(result.data).toBe(8);
    expect(request).not.toHaveBeenCalled();
  });
});
