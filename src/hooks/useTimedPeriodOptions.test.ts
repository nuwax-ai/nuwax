import { act, renderHook, waitFor } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useTimedPeriodOptions } from './useTimedPeriodOptions';

vi.mock('@/services/i18nRuntime', () => ({ t: (key: string) => key }));
vi.mock('umi', () => ({
  useRequest: (
    load: () => Promise<unknown>,
    options: { onSuccess: (data: unknown) => void },
  ) => {
    const callbacks = useRef(options);
    callbacks.current = options;
    const mounted = useRef(true);
    useEffect(
      () => () => {
        mounted.current = false;
      },
      [],
    );
    return {
      run: () => {
        void load().then((data) => {
          if (mounted.current) callbacks.current.onSuccess(data);
        });
      },
    };
  },
}));
const presets = [
  { typeName: '每天', items: [{ desc: '早上', cron: '0 0 9 * * ?' }] },
];

describe('异步周期选项回显', () => {
  it('加载期间切换任务，完成后保留新任务的原 cron，改内容不触发周期变更', async () => {
    let resolve!: (data: unknown) => void;
    const load = vi.fn(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const onChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useTimedPeriodOptions(load, value, onChange),
      { initialProps: { value: '0 3/10 * * * ?' } },
    );
    rerender({ value: '0 7/15 * * * ?' });
    await act(async () => {
      resolve(presets);
    });
    expect(result.current.isCustomCron).toBe(true);
    expect(result.current.typeCron).toBe('0 7/15 * * * ?');
    expect(onChange).not.toHaveBeenCalled();
    act(() => result.current.handleChangeTypeName('每天'));
    expect(onChange).toHaveBeenCalledWith('0 0 9 * * ?');
  });
  it('新建默认值仅为空时产生，编辑和指定时间不被预设覆盖', async () => {
    const onChange = vi.fn();
    const load = vi.fn().mockResolvedValue(presets);
    const { result, rerender } = renderHook(
      ({ value }: { value?: string }) =>
        useTimedPeriodOptions(load, value, onChange),
      { initialProps: { value: undefined as string | undefined } },
    );
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('0 0 9 * * ?'));
    onChange.mockClear();
    rerender({ value: 'SpecificTime' });
    expect(result.current.typeName).toBe('SpecificTime');
    expect(onChange).not.toHaveBeenCalled();
    rerender({ value: '0 0 9 * * ?' });
    expect(result.current.typeName).toBe('每天');
    expect(onChange).not.toHaveBeenCalled();
  });
});
