import {
  formatDuration,
  getPlanProgress,
  getProcessDurationMs,
  mergeTerminalItems,
  normalizeTerminalItems,
} from '@/utils/terminalOutput';
import { describe, expect, it } from 'vitest';

describe('normalizeTerminalItems', () => {
  it('归一化 result.data 中的 terminal 项', () => {
    const items = normalizeTerminalItems({
      data: [
        { type: 'diff', path: 'a.ts' },
        {
          type: 'terminal',
          command: 'npm test',
          content: 'ok',
          exitCode: 0,
        },
      ],
    });
    expect(items).toEqual([
      { command: 'npm test', content: 'ok', exitCode: 0 },
    ]);
  });

  it('兼容 content/output 字段别名，缺省 exitCode 为 null', () => {
    const items = normalizeTerminalItems({
      data: [{ type: 'terminal', output: 'streaming...' }],
    });
    expect(items).toEqual([
      { command: undefined, content: 'streaming...', exitCode: null },
    ]);
  });

  it('非对象 / 无 data 数组 / 无 terminal 项均返回空数组', () => {
    expect(normalizeTerminalItems(null)).toEqual([]);
    expect(normalizeTerminalItems('text')).toEqual([]);
    expect(normalizeTerminalItems({ data: 'not-array' })).toEqual([]);
    expect(normalizeTerminalItems({ data: [{ type: 'diff' }] })).toEqual([]);
  });

  it('无内容且无退出码的空项被过滤', () => {
    expect(normalizeTerminalItems({ data: [{ type: 'terminal' }] })).toEqual(
      [],
    );
  });
});

describe('mergeTerminalItems', () => {
  it('多块拼接：命令取首项、退出码取末项', () => {
    const merged = mergeTerminalItems([
      { command: 'npm test', content: 'line1', exitCode: null },
      { content: 'line2', exitCode: 1 },
    ]);
    expect(merged).toEqual({
      command: 'npm test',
      content: 'line1\nline2',
      exitCode: 1,
    });
  });

  it('空数组返回 null', () => {
    expect(mergeTerminalItems([])).toBeNull();
  });
});

describe('getProcessDurationMs', () => {
  it('endTime - startTime', () => {
    expect(getProcessDurationMs({ startTime: 1000, endTime: 3400 })).toBe(2400);
  });

  it('流式中（缺 endTime）或字段非法返回 null', () => {
    expect(getProcessDurationMs({ startTime: 1000 })).toBeNull();
    expect(getProcessDurationMs({ endTime: 1000 })).toBeNull();
    expect(getProcessDurationMs({ startTime: 2000, endTime: 1000 })).toBeNull();
    expect(getProcessDurationMs(null)).toBeNull();
  });
});

describe('formatDuration', () => {
  it('毫秒档', () => {
    expect(formatDuration(0)).toBe('0ms');
    expect(formatDuration(320)).toBe('320ms');
    expect(formatDuration(999)).toBe('999ms');
  });

  it('秒档保留一位小数', () => {
    expect(formatDuration(1000)).toBe('1.0s');
    expect(formatDuration(2400)).toBe('2.4s');
    expect(formatDuration(59000)).toBe('59.0s');
  });

  it('分钟档', () => {
    expect(formatDuration(60000)).toBe('1m');
    expect(formatDuration(125000)).toBe('2m5s');
  });
});

describe('getPlanProgress', () => {
  it('统计 completed 并取第一个 in_progress 步骤', () => {
    expect(
      getPlanProgress([
        { status: 'completed', content: '取数' },
        { status: 'in_progress', content: '生成报表' },
        { status: 'pending', content: '发布上线' },
      ]),
    ).toEqual({ completed: 1, total: 3, currentStep: '生成报表' });
  });

  it('全部完成时无 currentStep', () => {
    expect(
      getPlanProgress([
        { status: 'completed', content: 'a' },
        { status: 'completed', content: 'b' },
      ]),
    ).toEqual({ completed: 2, total: 2, currentStep: undefined });
  });

  it('非数组输入返回 null', () => {
    expect(getPlanProgress(null)).toBeNull();
    expect(getPlanProgress('x')).toBeNull();
  });
});
