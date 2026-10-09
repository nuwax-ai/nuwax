import WorkCommercialRouteBoundary from '@/components/business-component/WorkCommercialRouteBoundary';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  pathname: '/repo',
  config: undefined as any,
  loadEnd: true,
  mounted: vi.fn(),
  disposed: vi.fn(),
}));
vi.mock('umi', () => ({
  useLocation: () => state,
  useModel: (name: string) =>
    name === 'tenantConfigInfo'
      ? { tenantConfigInfo: state.config, loadEnd: state.loadEnd }
      : { menuTree: [] },
}));
vi.mock('@/services/i18nRuntime', () => ({
  dict: () => '请联系官方获取试用授权或商业授权',
}));
const Content = () => {
  useEffect(() => {
    state.mounted();
    return () => state.disposed();
  }, []);
  return <div>应用内容</div>;
};
beforeEach(() => {
  state.pathname = '/repo';
  state.config = undefined;
  state.loadEnd = true;
  vi.clearAllMocks();
});
afterEach(cleanup);
it('页面内切换伙伴/资料库路由均拦截，普通页正常挂载', () => {
  state.config = { aiOSCommercialEdition: true, workCommercialEdition: false };
  const view = render(
    <WorkCommercialRouteBoundary>
      <Content />
    </WorkCommercialRouteBoundary>,
  );
  expect(screen.getByRole('alert').textContent).toContain(
    '请联系官方获取试用授权或商业授权',
  );
  expect(state.mounted).not.toHaveBeenCalled();
  state.pathname = '/instant-message/conversation/4';
  view.rerender(
    <WorkCommercialRouteBoundary>
      <Content />
    </WorkCommercialRouteBoundary>,
  );
  expect(state.mounted).not.toHaveBeenCalled();
  state.pathname = '/home';
  view.rerender(
    <WorkCommercialRouteBoundary>
      <Content />
    </WorkCommercialRouteBoundary>,
  );
  expect(state.mounted).toHaveBeenCalledOnce();
});
it('读取中的受控页不提前挂载，授权恢复可进入，撤销后卸载内容', () => {
  state.loadEnd = false;
  const view = render(
    <WorkCommercialRouteBoundary>
      <Content />
    </WorkCommercialRouteBoundary>,
  );
  expect(screen.getByRole('status')).toBeTruthy();
  expect(state.mounted).not.toHaveBeenCalled();
  act(() => {
    state.config = {
      aiOSCommercialEdition: false,
      workCommercialEdition: true,
    };
    state.loadEnd = true;
    view.rerender(
      <WorkCommercialRouteBoundary>
        <Content />
      </WorkCommercialRouteBoundary>,
    );
  });
  expect(screen.getByText('应用内容')).toBeTruthy();
  act(() => {
    state.config.workCommercialEdition = false;
    view.rerender(
      <WorkCommercialRouteBoundary>
        <Content />
      </WorkCommercialRouteBoundary>,
    );
  });
  expect(state.disposed).toHaveBeenCalledOnce();
  expect(screen.queryByText('应用内容')).toBeNull();
});
