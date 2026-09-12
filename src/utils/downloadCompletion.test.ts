import { describe, expect, it, vi } from 'vitest';
const host = vi.hoisted(() => ({ getProduct: vi.fn<() => string | null>(() => 'nuwax'), save: vi.fn() }));
vi.mock('./nuwaClawBridge', () => ({ nuwaClawHost: { host: { getProduct: host.getProduct }, native: { saveImage: host.save } } }));
import { saveWithDesktopHost } from './downloadCompletion';
describe('desktop download completion', () => {
  it('waits for native write before success', async () => {
    let resolve!: (value: { success: boolean }) => void;
    host.save.mockReturnValueOnce(new Promise(r => { resolve = r; }));
    let completed = false;
    const task = saveWithDesktopHost('/export', 'project.zip').then(r => { completed = !!r; });
    await Promise.resolve(); expect(completed).toBe(false);
    resolve({ success: true }); await task; expect(completed).toBe(true);
  });
  it('keeps cancellation distinct from browser fallback', async () => {
    host.save.mockResolvedValueOnce({ success: false, canceled: true });
    expect(await saveWithDesktopHost('/export', 'project.zip')).toBe(false);
  });
  it('propagates network or write failure', async () => {
    host.save.mockResolvedValueOnce({ success: false, error: 'disk full' });
    await expect(saveWithDesktopHost('/export', 'project.zip')).rejects.toThrow('disk full');
  });
  it('does not claim a browser download completed', async () => {
    host.getProduct.mockReturnValueOnce(null);
    expect(await saveWithDesktopHost('/export', 'project.zip')).toBeUndefined();
  });
});
