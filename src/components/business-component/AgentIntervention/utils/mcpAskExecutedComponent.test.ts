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
    // component status(SUCCESS/FINISHED)只代表「问」完成,不代表用户已回答;
    // hydrate 默认 pending(交给 reconcile 按 resume 消息判 submitted),让历史最后一条 ASK_QUESTION 能恢复渲染
    expect(
      resolveMcpAskHydratedResponseStatus({
        status: 'SUCCESS',
        result: { success: true },
      }),
    ).toBe('pending');
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
