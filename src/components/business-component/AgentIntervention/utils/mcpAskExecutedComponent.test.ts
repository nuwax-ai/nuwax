import { describe, expect, it } from 'vitest';
import {
  isMcpAskCompletedComponent,
  isMcpAskFailedComponent,
  resolveMcpAskHydratedResponseStatus,
} from './mcpAskExecutedComponent';

describe('mcpAskExecutedComponent', () => {
  it('treats SUCCESS components as completed', () => {
    expect(
      isMcpAskCompletedComponent({
        status: 'SUCCESS',
        result: { success: true },
      }),
    ).toBe(true);
    expect(
      resolveMcpAskHydratedResponseStatus({
        status: 'SUCCESS',
        result: { success: true },
      }),
    ).toBe('submitted');
  });

  it('treats EXECUTING components as pending', () => {
    expect(
      isMcpAskCompletedComponent({
        status: 'EXECUTING',
      }),
    ).toBe(false);
    expect(
      resolveMcpAskHydratedResponseStatus({
        status: 'EXECUTING',
      }),
    ).toBe('pending');
  });

  it('treats FAILED components as failed', () => {
    expect(
      isMcpAskFailedComponent({
        status: 'FAILED',
        result: { success: false },
      }),
    ).toBe(true);
  });
});
