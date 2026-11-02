import { native } from '@/utils/hostBridge';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRepoDocLinkPreview } from './useRepoDocLinkPreview';

afterEach(() => {
  cleanup();
  delete window.NuwaClawBridge;
  vi.restoreAllMocks();
});
function Messages({ onOpen }: { onOpen: (url: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useRepoDocLinkPreview({ active: true, containerRef, onOpen });
  return (
    <div ref={containerRef}>
      <a href="/repo/doc/saved#section">已保存文档</a>
    </div>
  );
}
describe('authenticated library reader entry', () => {
  it.each(['modern', 'legacy'])(
    'uses confirmed native business window on %s host, never window.open',
    async (mode) => {
      const open = vi.fn(async () => ({ success: true }));
      const probe = vi.fn(async () => true);
      window.NuwaClawBridge = {
        host: { getProduct: () => 'nuwax' },
        native: { openWindow: open },
        ...(mode === 'modern' ? { canUse: probe } : {}),
      } as unknown as Window['NuwaClawBridge'];
      const external = vi.spyOn(window, 'open').mockReturnValue(null);
      const onOpen = vi.fn();
      const view = render(<Messages onOpen={onOpen} />);
      fireEvent.click(view.getByText('已保存文档'));
      await waitFor(() =>
        expect(open).toHaveBeenCalledWith(
          `${window.location.origin}/repo/doc/saved?just_show_content=true&hide_sheet=true#section`,
          { purpose: 'page' },
        ),
      );
      expect(onOpen).not.toHaveBeenCalled();
      expect(external).not.toHaveBeenCalled();
    },
  );
  it.each(['denied', 'rejected', 'missing'])(
    'falls back to inline preview when native is %s',
    async (mode) => {
      window.NuwaClawBridge = {
        host: { getProduct: () => 'nuwax' },
        native:
          mode === 'missing'
            ? {}
            : {
                openWindow: vi.fn(async () => {
                  if (mode === 'rejected') throw new Error('unavailable');
                  return { success: false };
                }),
              },
      } as unknown as Window['NuwaClawBridge'];
      const onOpen = vi.fn();
      const view = render(<Messages onOpen={onOpen} />);
      fireEvent.click(view.getByText('已保存文档'));
      await waitFor(() => expect(onOpen).toHaveBeenCalledOnce());
    },
  );
  it('only admits current business/gateway origins; no BASE_URL-only trust or credentials', async () => {
    const open = vi.fn(async () => ({ success: true }));
    window.NuwaClawBridge = {
      host: { getProduct: () => 'nuwax' },
      native: { openWindow: open },
      auth: {
        getContext: async () => ({
          businessOrigin: 'https://business.example',
          gatewayOrigin: window.location.origin,
          loadMode: 'gateway',
        }),
      },
    } as unknown as Window['NuwaClawBridge'];
    expect(
      (await native.openReadingWindow('https://business.example/repo/doc/one'))
        .success,
    ).toBe(true);
    expect(
      (await native.openReadingWindow('https://external.example/repo/doc/one'))
        .success,
    ).toBe(false);
    expect(
      (
        await native.openReadingWindow(
          'https://user:secret@business.example/repo/doc/one',
        )
      ).success,
    ).toBe(false);
    expect(open).toHaveBeenCalledTimes(1);
  });
  it('does not reopen an inactive instance after an asynchronous failure', async () => {
    let resolve!: (value: { success: boolean }) => void;
    window.NuwaClawBridge = {
      host: { getProduct: () => 'nuwax' },
      native: {
        openWindow: () =>
          new Promise((r) => {
            resolve = r;
          }),
      },
    } as unknown as Window['NuwaClawBridge'];
    const onOpen = vi.fn();
    const view = render(<Messages onOpen={onOpen} />);
    fireEvent.click(view.getByText('已保存文档'));
    await waitFor(() => expect(resolve).toBeTypeOf('function'));
    view.unmount();
    resolve({ success: false });
    await Promise.resolve();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
