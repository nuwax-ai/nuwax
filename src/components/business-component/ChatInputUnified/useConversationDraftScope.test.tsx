import { ConversationPagePathnameContext } from '@/hooks/ConversationPagePathnameContext';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useConversationDraftScope } from './useConversationDraftScope';

const mockLocation = vi.hoisted(() => ({ pathname: '/home/chat/100/200' }));

vi.mock('umi', () => ({
  useLocation: () => mockLocation,
}));

const DraftScope: React.FC<{
  id: number;
  name: string;
  draftKey?: string;
}> = ({ id, name, draftKey }) => (
  <span data-testid={name}>{useConversationDraftScope(draftKey, id)}</span>
);

describe('缓存会话的草稿作用域', () => {
  it('A 切到 IDE、菜单或 B 时仍使用各实例创建时的 pathname', () => {
    const view = () => (
      <>
        <ConversationPagePathnameContext.Provider value="/home/chat/100/200">
          <DraftScope name="A" id={100} />
        </ConversationPagePathnameContext.Provider>
        <ConversationPagePathnameContext.Provider value="/space/2/app-pro">
          <DraftScope name="B" id={101} />
        </ConversationPagePathnameContext.Provider>
        <DraftScope name="ordinary" id={102} />
      </>
    );
    const { rerender } = render(view());
    expect(screen.getByTestId('A')).toHaveTextContent('chat:100');
    expect(screen.getByTestId('B')).toHaveTextContent('apppro:101');

    mockLocation.pathname = '/agent/300';
    rerender(view());
    expect(screen.getByTestId('A')).toHaveTextContent('chat:100');
    expect(screen.getByTestId('B')).toHaveTextContent('apppro:101');
    expect(screen.getByTestId('ordinary')).toHaveTextContent('agent:102');

    mockLocation.pathname = '/home';
    rerender(view());
    expect(screen.getByTestId('A')).toHaveTextContent('chat:100');
    expect(screen.getByTestId('B')).toHaveTextContent('apppro:101');
    expect(screen.getByTestId('ordinary')).toHaveTextContent('page:102');
  });

  it('显式 draftKey 保持原优先级', () => {
    render(
      <ConversationPagePathnameContext.Provider value="/home/chat/100/200">
        <DraftScope name="explicit" id={100} draftKey="home" />
      </ConversationPagePathnameContext.Provider>,
    );
    expect(screen.getByTestId('explicit')).toHaveTextContent('home');
  });
});
