import type { TaskCronInfo } from '@/types/interfaces/agentTask';
import { describe, expect, it } from 'vitest';
import { CUSTOM_CRON_TYPE, resolveTimedPeriod } from './timedPeriod';

const presets = [
  { typeName: '每月', items: [{ desc: '1号', cron: '0 0 0 1 * ?' }] },
  { typeName: '每天', items: [{ desc: '9点', cron: '0 0 9 * * ?' }] },
] as TaskCronInfo[];
describe('定时周期回显', () => {
  it('原预设回显，空值才取默认', () => {
    expect(resolveTimedPeriod(presets, '0 0 9 * * ?').typeName).toBe('每天');
    expect(resolveTimedPeriod(presets).cron).toBe('0 0 0 1 * ?');
  });
  it('加载前后都保留分钟级表达式，不默认改成每月1号', () => {
    for (const data of [[], presets]) {
      expect(resolveTimedPeriod(data, '0 3/10 * * * ?')).toMatchObject({
        typeName: CUSTOM_CRON_TYPE,
        cron: '0 3/10 * * * ?',
      });
    }
  });
  it('指定时间仍按原协议回显', () => {
    expect(resolveTimedPeriod(presets, 'SpecificTime').typeName).toBe(
      'SpecificTime',
    );
  });
});
