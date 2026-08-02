import { describe, expect, it } from 'vitest';

import { getAgentIdFromHomePathname } from './utils';

describe('getAgentIdFromHomePathname', () => {
  it('从智能体详情地址中提取智能体 ID', () => {
    expect(getAgentIdFromHomePathname('/agent/1674')).toBe('1674');
  });

  it('从会话地址中提取智能体 ID', () => {
    expect(getAgentIdFromHomePathname('/home/chat/1558066/4029')).toBe('4029');
  });

  it('非首页智能体相关地址不返回 ID', () => {
    expect(getAgentIdFromHomePathname('/home')).toBeUndefined();
  });
});
