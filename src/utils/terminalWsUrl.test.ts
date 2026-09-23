/**
 * terminalWsUrl 单元测试（vitest/jsdom）。
 *
 * 锁定：终端契约 query 参数（service_type/cwd）拼接与 form 编码语义、
 * normalizeTerminalWsUrl 保留 query（本轮修复点）、无 opts 存量行为不回归。
 * 语义基准：服务端 rcoder ttyd_params.rs（+/ %20 均为空格，URLSearchParams 对齐）。
 */
import {
  buildTtydTerminalWsUrl,
  normalizeTerminalWsUrl,
} from '@/utils/terminalWsUrl';
import { describe, expect, it } from 'vitest';

/** 从 URL 解回 query 参数（解码回合断言用，比断言具体转义形态更稳） */
function queryOf(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

describe('buildTtydTerminalWsUrl', () => {
  it('无 opts → 无 query（存量行为回归锁）', () => {
    const url = buildTtydTerminalWsUrl(42);
    expect(url).toContain('/computer/terminal/42/ws');
    expect(url).not.toContain('?');
  });

  it('conversationId 缺省 → 空串', () => {
    expect(buildTtydTerminalWsUrl(undefined)).toBe('');
    expect(buildTtydTerminalWsUrl(0)).toBe('');
  });

  it('serviceType → ?service_type=computer-normal-project', () => {
    const url = buildTtydTerminalWsUrl(42, {
      serviceType: 'computer-normal-project',
    });
    expect(queryOf(url).get('service_type')).toBe('computer-normal-project');
  });

  it('cwd 含空格 → form 编码且解码回合还原（+ 即空格）', () => {
    const url = buildTtydTerminalWsUrl(42, { cwd: '/home/user/my dir' });
    expect(queryOf(url).get('cwd')).toBe('/home/user/my dir');
  });

  it('cwd 中文 → 解码回合还原', () => {
    const url = buildTtydTerminalWsUrl(42, { cwd: '/home/user/我的项目' });
    expect(queryOf(url).get('cwd')).toBe('/home/user/我的项目');
  });

  it('cwd 含字面 + → 编码为 %2B（具体形态断言，防被当普通字符编码丢语义）', () => {
    const url = buildTtydTerminalWsUrl(42, { cwd: '/a+b' });
    // form 语义下裸 + 会被解码端当空格——必须 %2B；同时解码回合仍还原原值
    expect(url).toContain('cwd=%2Fa%2Bb');
    expect(queryOf(url).get('cwd')).toBe('/a+b');
  });

  it('serviceType + cwd 同传 → 两参数齐', () => {
    const url = buildTtydTerminalWsUrl(42, {
      serviceType: 'computer-normal-project',
      cwd: '/tmp/x',
    });
    const q = queryOf(url);
    expect(q.get('service_type')).toBe('computer-normal-project');
    expect(q.get('cwd')).toBe('/tmp/x');
  });

  it('空串/undefined opts → 对应参数省略', () => {
    expect(queryOf(buildTtydTerminalWsUrl(42, { cwd: '' })).has('cwd')).toBe(
      false,
    );
    expect(queryOf(buildTtydTerminalWsUrl(42, {})).toString()).toBe('');
  });
});

describe('normalizeTerminalWsUrl（保留 query 修复锁定）', () => {
  it('保留 query string', () => {
    expect(
      normalizeTerminalWsUrl('wss://h.example.com/computer/terminal/1/ws?a=1'),
    ).toBe('wss://h.example.com/computer/terminal/1/ws?a=1');
  });

  it('无 query 的行为不变（回归锁）', () => {
    expect(normalizeTerminalWsUrl('https://h.example.com/x/y')).toBe(
      'wss://h.example.com/x/y',
    );
    expect(normalizeTerminalWsUrl('http://h:3000/')).toBe('ws://h:3000/ws');
    expect(normalizeTerminalWsUrl('not a url')).toBe('not a url');
  });

  it('根 path 兜底与 query 保留交叉：/?a=1 → /ws?a=1', () => {
    expect(normalizeTerminalWsUrl('https://h.example.com/?a=1')).toBe(
      'wss://h.example.com/ws?a=1',
    );
  });
});
