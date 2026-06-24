import { FlowKindEnum } from '@/types/enums/common';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/common', () => ({
  isWeakNumber: (value: unknown) =>
    typeof value === 'number' ||
    (typeof value === 'string' &&
      value.trim() !== '' &&
      !Number.isNaN(Number(value))),
}));

vi.mock('umi', () => ({
  history: {
    go: vi.fn(),
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    location: {},
  },
}));

import { buildWorkflowRoute } from '../router';

describe('buildWorkflowRoute', () => {
  it('should build the default Workflow route', () => {
    expect(buildWorkflowRoute(1, 2)).toBe('/space/1/workflow/2');
  });

  it('should build the AgentFlow route when workflowType is AgentFlow', () => {
    expect(buildWorkflowRoute(1, 2, FlowKindEnum.AgentFlow)).toBe(
      '/space/1/agent-flow/2',
    );
  });

  it('should append query params', () => {
    expect(
      buildWorkflowRoute(1, 2, FlowKindEnum.AgentFlow, { publishId: 9 }),
    ).toBe('/space/1/agent-flow/2?publishId=9');
  });
});
