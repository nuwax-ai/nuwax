import { conversationPageCacheManager } from '@/features/conversation/runtime/conversationPageCacheManager';
import ConversationInstanceCacheSlot from '@/pages/Chat/components/ConversationInstanceCacheSlot';
import { act, cleanup, render } from '@testing-library/react';
import React, { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const Probe: React.FC<{ name: string; onUnmount: (name: string) => void }> = ({
  name,
  onUnmount,
}) => {
  useEffect(() => () => onUnmount(name), [name, onUnmount]);
  return <div data-testid={`probe-${name}`}>{name}</div>;
};

describe('ConversationInstanceCacheSlot', () => {
  afterEach(() => {
    cleanup();
    conversationPageCacheManager.invalidateAll('test-cleanup');
    localStorage.clear();
  });

  it('切换会话只隐藏旧实例，LRU 淘汰后才卸载', () => {
    const onUnmount = vi.fn();
    act(() => {
      conversationPageCacheManager.activate({
        surface: 'chat',
        conversationId: 1,
      });
    });
    const view = render(
      <ConversationInstanceCacheSlot activeKey="chat:1" active retain>
        <Probe name="one" onUnmount={onUnmount} />
      </ConversationInstanceCacheSlot>,
    );

    act(() => {
      conversationPageCacheManager.activate({
        surface: 'chat',
        conversationId: 2,
      });
    });
    view.rerender(
      <ConversationInstanceCacheSlot activeKey="chat:2" active retain>
        <Probe name="two" onUnmount={onUnmount} />
      </ConversationInstanceCacheSlot>,
    );

    expect(onUnmount).not.toHaveBeenCalledWith('one');
    expect(
      view.container.querySelector('[data-cache-key="chat:1"]'),
    ).toHaveStyle({ display: 'none' });

    act(() => {
      for (let conversationId = 3; conversationId <= 6; conversationId += 1) {
        conversationPageCacheManager.activate({
          surface: 'chat',
          conversationId,
        });
      }
    });
    view.rerender(
      <ConversationInstanceCacheSlot activeKey="chat:6" active retain>
        <Probe name="six" onUnmount={onUnmount} />
      </ConversationInstanceCacheSlot>,
    );

    expect(onUnmount).toHaveBeenCalledWith('one');
    expect(
      view.container.querySelector('[data-cache-key="chat:1"]'),
    ).toBeNull();
  });

  it('exclusive 实例切换 owner 时卸载旧实例，保证 VNC 全局唯一', () => {
    const onUnmount = vi.fn();
    act(() => {
      conversationPageCacheManager.activate({
        surface: 'chat',
        conversationId: 1,
      });
    });
    const view = render(
      <ConversationInstanceCacheSlot activeKey="chat:1" active retain exclusive>
        <Probe name="vnc-one" onUnmount={onUnmount} />
      </ConversationInstanceCacheSlot>,
    );

    act(() => {
      conversationPageCacheManager.activate({
        surface: 'chat',
        conversationId: 2,
      });
    });
    view.rerender(
      <ConversationInstanceCacheSlot activeKey="chat:2" active retain exclusive>
        <Probe name="vnc-two" onUnmount={onUnmount} />
      </ConversationInstanceCacheSlot>,
    );

    expect(onUnmount).toHaveBeenCalledWith('vnc-one');
    expect(
      view.container.querySelector('[data-cache-key="chat:1"]'),
    ).toBeNull();
  });
});
