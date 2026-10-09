/**
 * appTabKeepAlive model 渲染器双槽单测：
 * - user-app 槽与 agent 槽相互独立、默认 null；
 * - 先注册者优先（路由组件重挂载不覆盖同一实现）。
 */
import appTabKeepAliveModel, {
  type AgentTabRendererPair,
  type AppTabInstanceProps,
} from '@/models/appTabKeepAlive';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

const UserAppStub: React.FC<AppTabInstanceProps> = ({ appId }) => (
  <div>{appId}</div>
);
const AgentTabStub: React.FC<{ agentId: number; active: boolean }> = ({
  agentId,
}) => <div>{agentId}</div>;

describe('appTabKeepAlive model 渲染器双槽', () => {
  it('默认双槽均为 null', () => {
    const { result } = renderHook(() => appTabKeepAliveModel());
    expect(result.current.renderer).toBeNull();
    expect(result.current.agentRenderer).toBeNull();
  });

  it('agent 槽先注册者优先：重复注册不覆盖', () => {
    const { result } = renderHook(() => appTabKeepAliveModel());
    const first: AgentTabRendererPair = {
      tab: AgentTabStub,
      direct: AgentTabStub,
    };
    act(() => {
      result.current.registerAgentTabRenderer(first);
    });
    expect(result.current.agentRenderer).toBe(first);
    const second: AgentTabRendererPair = {
      tab: AgentTabStub,
      direct: AgentTabStub,
    };
    act(() => {
      result.current.registerAgentTabRenderer(second);
    });
    expect(result.current.agentRenderer).toBe(first);
  });

  it('两槽互不影响：各自注册互不干扰', () => {
    const { result } = renderHook(() => appTabKeepAliveModel());
    act(() => {
      result.current.registerRenderer(UserAppStub);
    });
    expect(result.current.renderer).toBe(UserAppStub);
    expect(result.current.agentRenderer).toBeNull();
    const pair: AgentTabRendererPair = {
      tab: AgentTabStub,
      direct: AgentTabStub,
    };
    act(() => {
      result.current.registerAgentTabRenderer(pair);
    });
    expect(result.current.renderer).toBe(UserAppStub);
    expect(result.current.agentRenderer).toBe(pair);
  });
});
