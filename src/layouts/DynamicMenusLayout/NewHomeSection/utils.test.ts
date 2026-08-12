import { describe, expect, it } from 'vitest';

import { TaskStatus } from '@/types/enums/agent';
import {
  getAgentIdFromHomePathname,
  getExecutingConversationCount,
} from './utils';

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

describe('getExecutingConversationCount', () => {
  it('统计 EXECUTING 状态的会话数量', () => {
    expect(
      getExecutingConversationCount([
        { taskStatus: TaskStatus.EXECUTING },
        { taskStatus: TaskStatus.COMPLETE },
        { taskStatus: TaskStatus.EXECUTING },
      ]),
    ).toBe(2);
  });

  it('conversationList 为 null 时返回 0', () => {
    expect(getExecutingConversationCount(null)).toBe(0);
  });
});
