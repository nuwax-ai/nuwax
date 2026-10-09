import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AppDevRemoteDesktopPanel from './index';
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));
vi.mock('../../services/appDevPro', () => ({
  getUserAppVncProxyUrl: (appId: number) =>
    `/api/userapp/proxy/vnc/dev/${appId}/`,
}));
vi.mock('../AppDevDatabasePanel/index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));
vi.mock('../AppDevStatusHero', () => ({
  default: ({ failed }: any) => (
    <div data-testid="startup" data-failed={String(failed)} />
  ),
}));
vi.mock('@/components/business-component/VncPreview', () => ({
  default: (props: any) => (
    <div
      data-testid="vnc"
      data-cid={props.cId}
      data-stage={props.appStage}
      data-source={props.sourceUrl}
    />
  ),
}));
afterEach(cleanup);
describe('AppDev shared desktop adapter', () => {
  it('waits for the container and passes real conversation identity with app proxy', () => {
    const { rerender } = render(
      <AppDevRemoteDesktopPanel
        appId={9}
        conversationId={123}
        containerStatus="starting"
      />,
    );
    expect(screen.queryByTestId('vnc')).toBeNull();
    rerender(
      <AppDevRemoteDesktopPanel
        appId={9}
        conversationId={123}
        containerStatus="running"
      />,
    );
    const vnc = screen.getByTestId('vnc');
    expect(vnc.dataset.cid).toBe('123');
    expect(vnc.dataset.stage).toBe('dev');
    expect(vnc.dataset.source).toBe('/api/userapp/proxy/vnc/dev/9/');
  });
  it('never uses application id as a fallback conversation id', () => {
    render(<AppDevRemoteDesktopPanel appId={9} containerStatus="running" />);
    expect(screen.queryByTestId('vnc')).toBeNull();
  });
});
