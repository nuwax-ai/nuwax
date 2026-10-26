import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFileContentSaver } from './fileContentSaver';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
describe('按文件自动保存队列', () => {
  it('替代尚未提交的旧输入，只确认最新内容实际落盘', async () => {
    const write = vi.fn().mockResolvedValue(true);
    const save = createFileContentSaver(write);
    const old = save('a', 'old edit', 'original');
    const latest = save('a', 'latest edit', 'original');
    await expect(old).resolves.toBe(false);
    await vi.advanceTimersByTimeAsync(500);
    await expect(latest).resolves.toBe(true);
    expect(write).toHaveBeenCalledOnce();
    expect(write).toHaveBeenCalledWith('a', 'latest edit', 'original');
  });
  it('在途旧写与最新写串行，不能由较慢的旧请求覆盖最新内容', async () => {
    let complete!: (value: boolean) => void;
    const write = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<boolean>((resolve) => {
            complete = resolve;
          }),
      )
      .mockResolvedValue(true);
    const save = createFileContentSaver(write);
    const first = save('a', 'first', '', { immediate: true });
    const middle = save('a', 'middle', '', { immediate: true });
    const last = save('a', 'last', '', { immediate: true });
    expect(write).toHaveBeenCalledTimes(1);
    await expect(middle).resolves.toBe(false);
    complete(true);
    await expect(first).resolves.toBe(true);
    await expect(last).resolves.toBe(true);
    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenLastCalledWith('a', 'last', '');
  });
  it('显式保存跳过500ms等待', async () => {
    const write = vi.fn().mockResolvedValue(true);
    const save = createFileContentSaver(write);
    const previous = save('a', 'draft', '');
    const manual = save('a', 'draft', '', { immediate: true });
    expect(write).toHaveBeenCalledOnce();
    await expect(previous).resolves.toBe(false);
    await expect(manual).resolves.toBe(true);
  });
  it('失败不泄漏未处理拒绝，允许重试', async () => {
    const write = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(true);
    const save = createFileContentSaver(write);
    await expect(save('a', 'draft', '', { immediate: true })).resolves.toBe(
      false,
    );
    await expect(save('a', 'draft', '', { immediate: true })).resolves.toBe(
      true,
    );
  });
  it('取消只使旧代次失效，后续代次仍能保存', async () => {
    const write = vi.fn().mockResolvedValue(true);
    const save = createFileContentSaver(write);
    const old = save('a', 'draft', '');
    save.cancel();
    await expect(old).resolves.toBe(false);
    await vi.advanceTimersByTimeAsync(500);
    expect(write).not.toHaveBeenCalled();
    await expect(save('b', 'next', '', { immediate: true })).resolves.toBe(
      true,
    );
  });
});
