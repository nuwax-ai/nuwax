import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useLocation, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import HostRouter from './overlay/src/HostRouter';
import {
  beginRepoRuntime,
  endRepoRuntime,
  updateRepoRuntime,
} from './overlay/src/hostRuntime';

vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);

let mounted: Root | null = null;
let container: HTMLDivElement | null = null;
function render(children: ReactNode) {
  container = document.createElement('div');
  document.body.appendChild(container);
  mounted = createRoot(container);
  act(() => mounted?.render(children));
}
function currentRoute() {
  return container?.querySelector('[data-testid="route"]')?.textContent;
}

afterEach(() => {
  act(() => mounted?.unmount());
  mounted = null;
  container?.remove();
  container = null;
  endRepoRuntime();
});

function BusinessRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="route">
        {location.pathname}
        {location.search}
        {location.hash}
      </output>
      <button type="button" onClick={() => navigate('/doc/b?nav=0')}>
        打开文档
      </button>
    </>
  );
}

describe('资料库 MemoryRouter 与宿主双向同步', () => {
  it('basename 接受完整入口，业务 absolute route 不会双写 /repo，宿主深链不回传', () => {
    const onNavigate = vi.fn();
    beginRepoRuntime(
      document.createElement('div'),
      { path: '/repo/doc/a', onNavigate },
      true,
    );
    render(
      <HostRouter embedded>
        <BusinessRoute />
      </HostRouter>,
    );
    expect(currentRoute()).toBe('/doc/a');
    act(() => container?.querySelector('button')?.click());
    expect(currentRoute()).toBe('/doc/b?nav=0');
    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith('/repo/doc/b?nav=0', false);
    act(() => updateRepoRuntime({ path: '/repo/doc/c#selection' }));
    expect(currentRoute()).toBe('/doc/c#selection');
    expect(onNavigate).toHaveBeenCalledTimes(1);
    act(() => updateRepoRuntime({ path: '/repo/doc/c#selection' }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('隐藏时其它模块路径不污染，重新激活接收资料库历史路径', () => {
    beginRepoRuntime(
      document.createElement('div'),
      { path: '/repo/doc/a' },
      true,
    );
    render(
      <HostRouter embedded>
        <BusinessRoute />
      </HostRouter>,
    );
    act(() => updateRepoRuntime({ active: false, path: '/home' }));
    expect(currentRoute()).toBe('/doc/a');
    act(() => updateRepoRuntime({ active: true, path: '/repo/doc/previous' }));
    expect(currentRoute()).toBe('/doc/previous');
  });
});
