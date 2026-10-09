import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TaskStatus } from '@/types/enums/agent';
import {
  formatRelativeTime,
  getAgentIdFromHomePathname,
  getExecutingConversationCount,
} from './utils';

// utils 依赖 i18nRuntime,其真实模块经 services 链透传 umi request,
// vitest(jsdom) 下触发 esbuild 基线错误(同 useWorkspaceDirectoryFiles 存量问题),统一 mock 斩断依赖链;
// dict 恒等映射便于断言命中的分支与参数
vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...values: (string | number)[]) =>
    values.length ? `${key}:${values.join(',')}` : key,
  getCurrentLang: () => 'zh-CN',
}));

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

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-08T12:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // dict 被 mock 为「key 或 key:参数」,断言走到的分支与传参;日期回退按 zh-CN
  it('一分钟内显示「刚刚」', () => {
    expect(formatRelativeTime('2026-09-08T11:59:40')).toBe(
      'PC.Utils.Common.justNow',
    );
  });

  it('一小时内显示「x分」', () => {
    expect(formatRelativeTime('2026-09-08T11:55:00')).toBe(
      'PC.Utils.Common.relativeMinutes:5',
    );
  });

  it('一天内显示「x小时」', () => {
    expect(formatRelativeTime('2026-09-08T08:00:00')).toBe(
      'PC.Utils.Common.relativeHours:4',
    );
  });

  it('昨天不再特殊化为「昨天」，显示「1天」', () => {
    expect(formatRelativeTime('2026-09-07T12:00:00')).toBe(
      'PC.Utils.Common.relativeDays:1',
    );
  });

  it('三十天内显示「x天」', () => {
    expect(formatRelativeTime('2026-09-06T12:00:00')).toBe(
      'PC.Utils.Common.relativeDays:2',
    );
  });

  it('超过三十天回退具体日期', () => {
    expect(formatRelativeTime('2026-07-30T12:00:00')).toBe('7月30日');
  });

  it('空值或非法时间返回空串', () => {
    expect(formatRelativeTime()).toBe('');
    expect(formatRelativeTime('not-a-date')).toBe('');
  });
});
