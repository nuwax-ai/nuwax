import SessionRenderingDemo from '@/examples/SessionRenderingDemo';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/business-component', () => ({
  UnifiedChatSession: () => <div data-testid="unified-chat-session" />,
}));

vi.mock('umi', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

describe('SessionRenderingDemo', () => {
  it('渲染会话交互处理及渲染演示入口', () => {
    render(<SessionRenderingDemo />);

    expect(screen.getByText('会话交互处理及渲染演示')).toBeInTheDocument();
    expect(screen.getByText('Agent 会话渲染')).toBeInTheDocument();
    expect(screen.getByText('AppDev 首条透传 payload')).toBeInTheDocument();
    expect(screen.getByTestId('unified-chat-session')).toBeInTheDocument();
  });
});
