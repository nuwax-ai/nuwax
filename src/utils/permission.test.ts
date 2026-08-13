import { describe, expect, it } from 'vitest';
import { getFilteredHiddenRoutePaths, isRoutePathHidden } from './permission';

describe('subscription route filtering', () => {
  const subscriptionDisabledConfig = { enableSubscription: 0 };

  it.each([
    '/more-page/api-key',
    '/more-page/usage-stats',
    '/more-page/model-permissions',
    '/more-page/history-conversation',
  ])('keeps %s available when subscription is disabled', (path) => {
    expect(isRoutePathHidden(path, subscriptionDisabledConfig)).toBe(false);
  });

  it('continues hiding subscription-dependent pages', () => {
    const hiddenPaths = getFilteredHiddenRoutePaths(subscriptionDisabledConfig);

    expect(hiddenPaths).toContain('/more-page/my-subscriptions');
    expect(hiddenPaths).toContain('/more-page/my-orders');
    expect(hiddenPaths).not.toContain('/more-page/usage-stats');
    expect(hiddenPaths).not.toContain('/more-page/model-permissions');
  });
});
