import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  __resetForTest,
  getHostVisibility,
  handleHostActivityPayload,
  subscribeHostVisibility,
} from './hostVisibility';

/**
 * hostVisibility 为纯 TS 模块（无 umi 传递依赖），vitest 直接 import 运行。
 * 聚焦：host-activity 沿的消费语义（翻转/幂等/订阅）与「默认可见」兜底。
 */
describe('hostVisibility · 宿主可见性状态（休眠控制消费端）', () => {
  beforeEach(() => {
    __resetForTest();
  });

  it('默认可见——无桥/未收到事件时轮询行为不被卡死', () => {
    expect(getHostVisibility()).toBe(true);
  });

  it('host-activity visible=false/true → 状态翻转并通知订阅者', () => {
    const listener = vi.fn();
    subscribeHostVisibility(listener);

    handleHostActivityPayload({ visible: false });
    expect(getHostVisibility()).toBe(false);
    expect(listener).toHaveBeenLastCalledWith(false);

    handleHostActivityPayload({ visible: true });
    expect(getHostVisibility()).toBe(true);
    expect(listener).toHaveBeenLastCalledWith(true);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('同值事件幂等：壳侧变化沿语义下不重复通知', () => {
    const listener = vi.fn();
    subscribeHostVisibility(listener);

    handleHostActivityPayload({ visible: false });
    handleHostActivityPayload({ visible: false });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('畸形 payload 收敛：visible 缺失按 false，truthy 非布尔按 true', () => {
    const listener = vi.fn();
    subscribeHostVisibility(listener);

    handleHostActivityPayload({});
    expect(getHostVisibility()).toBe(false);

    handleHostActivityPayload({ visible: 'yes' });
    expect(getHostVisibility()).toBe(true);
  });

  it('subscribe 不做注册即回调——避免与 useRequest 自动首跑叠加双请求', () => {
    const listener = vi.fn();
    subscribeHostVisibility(listener);
    expect(listener).not.toHaveBeenCalled();
  });

  it('注销函数生效：翻转不再触达已注销订阅者', () => {
    const listener = vi.fn();
    const dispose = subscribeHostVisibility(listener);

    dispose();
    handleHostActivityPayload({ visible: false });
    expect(listener).not.toHaveBeenCalled();
  });
});
