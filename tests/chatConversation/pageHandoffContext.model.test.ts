/**
 * pageHandoffContext model 契约测试：
 * 真机排查结论（2026-09-11，专家召唤第二次失效）——umi useModel 首帧返回
 * dispatcher.data 旧快照，消费方挂载 effect 拿到的 consumeContext 可能停留在
 * 写入前的渲染。契约要求：过期的读取闭包也必须读到活数据（经 contextMapRef），
 * 否则「读旧值 + 函数式清除误杀新载荷」会让透传偶发丢失。
 * model 是纯 React hook（不依赖 umi），直接 renderHook 验证。
 */
import pageHandoffContext from '@/models/pageHandoffContext';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const useModel = pageHandoffContext;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('pageHandoffContext model', () => {
  it('基础契约：写入 / 读取 / 读取即清 / 显式清理', () => {
    const { result } = renderHook(() => useModel());
    act(() => {
      result.current.setContext('k1', { a: 1 });
    });
    expect(result.current.getContext('k1')).toEqual({ a: 1 });
    act(() => {
      expect(result.current.consumeContext('k1')).toEqual({ a: 1 });
    });
    expect(result.current.getContext('k1')).toBeUndefined();

    act(() => {
      result.current.setContext('k2', 2);
      result.current.clearContext('k2');
    });
    expect(result.current.getContext('k2')).toBeUndefined();
  });

  it('过期读取闭包仍读到活数据：写入后不重取回调，旧 consumeContext 也能读到新载荷', () => {
    const { result } = renderHook(() => useModel());
    // 模拟 umi useModel 旧快照：先捕获「写入前」的回调引用
    const staleConsume = result.current.consumeContext;
    const staleGet = result.current.getContext;

    act(() => {
      result.current.setContext('homeSummonedExpert', {
        agentId: 2503,
        name: '智慧校园助手',
      });
    });

    // 旧闭包必须读到写入后的活数据（回归：旧实现读渲染闭包返回 undefined，
    // 且其函数式 clear 会把刚写入的载荷一并清掉，透传就此丢失）
    let consumed: { agentId: number } | undefined;
    act(() => {
      expect(staleGet<{ agentId: number }>('homeSummonedExpert')?.agentId).toBe(
        2503,
      );
      consumed = staleConsume<{ agentId: number }>('homeSummonedExpert');
    });
    expect(consumed?.agentId).toBe(2503);
    expect(result.current.getContext('homeSummonedExpert')).toBeUndefined();
  });

  it('过期清除只清目标 key：不清掉同批次写入的其他载荷', () => {
    const { result } = renderHook(() => useModel());
    const staleClear = result.current.clearContext;
    act(() => {
      result.current.setContext('homeSummonedExpert', { agentId: 1 });
      result.current.setContext('homeSelectedSkill', { skillId: 2 });
    });
    act(() => {
      staleClear('homeSummonedExpert');
    });
    expect(result.current.getContext('homeSummonedExpert')).toBeUndefined();
    expect(result.current.getContext('homeSelectedSkill')).toEqual({
      skillId: 2,
    });
  });
});
