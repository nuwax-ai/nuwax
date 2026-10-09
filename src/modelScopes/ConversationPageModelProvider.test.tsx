import { fireEvent, render, screen } from '@testing-library/react';
import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConversationPageModelProvider } from './ConversationPageModelProvider';
import { usePageModel } from './usePageModel';

vi.mock('umi', () => ({
  useModel: (namespace: string) =>
    namespace === 'chat' ? { count: 99 } : { count: 99 },
}));

vi.mock('@/models/chat', () => {
  const ChatModel = () => {
    const [count, setCount] = useState(0);
    return { count, setCount };
  };
  return { default: ChatModel };
});

vi.mock('@/models/conversationInfo', async () => {
  const { usePageModel } = await import('./usePageModel');
  const ConversationInfoModel = () => {
    const chat = usePageModel('chat') as { count: number };
    const [count, setCount] = useState(0);
    return { count, setCount, chatCount: chat.count };
  };
  return {
    default: ConversationInfoModel,
  };
});

vi.mock('@/models/conversationAgent', () => ({
  default: () => ({ count: 0 }),
}));

const Probe: React.FC<{ name: string }> = ({ name }) => {
  const chat = usePageModel('chat') as {
    count: number;
    setCount?: (count: number) => void;
  };
  const conversationInfo = usePageModel('conversationInfo') as {
    count: number;
    chatCount?: number;
    setCount?: (count: number) => void;
  };
  return (
    <div>
      <span data-testid={`${name}-value`}>
        {chat.count}/{conversationInfo.count}/
        {conversationInfo.chatCount ?? '-'}
      </span>
      <button type="button" onClick={() => chat.setCount?.(chat.count + 1)}>
        {name} chat
      </button>
      <button
        type="button"
        onClick={() => conversationInfo.setCount?.(conversationInfo.count + 1)}
      >
        {name} conversation
      </button>
    </div>
  );
};

describe('页面局部会话 model', () => {
  it('两个常驻页面相互隔离，未包裹页面仍取 Umi 全局值', () => {
    render(
      <>
        <ConversationPageModelProvider>
          <Probe name="A" />
        </ConversationPageModelProvider>
        <ConversationPageModelProvider>
          <Probe name="B" />
        </ConversationPageModelProvider>
        <Probe name="global" />
      </>,
    );

    expect(screen.getByTestId('A-value').textContent).toBe('0/0/0');
    expect(screen.getByTestId('B-value').textContent).toBe('0/0/0');
    expect(screen.getByTestId('global-value').textContent).toBe('99/99/-');

    fireEvent.click(screen.getByText('A chat'));
    fireEvent.click(screen.getByText('A conversation'));
    expect(screen.getByTestId('A-value').textContent).toBe('1/1/1');
    expect(screen.getByTestId('B-value').textContent).toBe('0/0/0');
    expect(screen.getByTestId('global-value').textContent).toBe('99/99/-');
  });
});
