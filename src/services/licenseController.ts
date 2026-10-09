import type {
  LicenseController,
  LicenseControllerState,
  LicenseProvider,
} from '@/types/interfaces/license';
import {
  classifyLicenseError,
  LicenseRequestError,
  projectLicenseSnapshot,
} from '@/utils/license';

/** 仅编排本地状态与 provider，不依赖 umi，也不定义真实 API 地址。 */
export function createLicenseController(
  provider: LicenseProvider,
): LicenseController {
  const listeners = new Set<() => void>();
  let generation = 0;
  let disposed = false;
  let pending: AbortController | null = null;
  let state: LicenseControllerState = initialState();

  function initialState(): LicenseControllerState {
    const available = provider.available === true;
    return Object.freeze({
      status: available ? 'idle' : 'unavailable',
      snapshot: null,
      error: available ? null : Object.freeze({ kind: 'unavailable' }),
      providerAvailable: available,
      importAvailable:
        available && typeof provider.importLicense === 'function',
      operation: null,
    });
  }

  function publish(next: LicenseControllerState): void {
    state = Object.freeze(next);
    listeners.forEach((listener) => listener());
  }

  function invalidate(): void {
    generation += 1;
    pending?.abort();
    pending = null;
  }

  async function run(
    operation: 'read' | 'import',
    action: (signal: AbortSignal) => Promise<unknown>,
  ): Promise<boolean> {
    if (disposed) return false;
    // 导入中的第二次操作不会重复提交，也不会以迟到 read 覆盖导入结果。
    if (state.operation === 'import') return false;

    invalidate();
    const currentGeneration = generation;
    if (provider.available !== true) {
      publish({
        ...state,
        status: 'unavailable',
        error: Object.freeze({ kind: 'unavailable' }),
        providerAvailable: false,
        importAvailable: false,
        operation: null,
      });
      return false;
    }

    const abortController = new AbortController();
    pending = abortController;
    publish({
      ...state,
      status: 'loading',
      error: null,
      providerAvailable: true,
      importAvailable: typeof provider.importLicense === 'function',
      operation,
    });

    try {
      const result = await action(abortController.signal);
      if (disposed || generation !== currentGeneration) return false;
      if (provider.available !== true) {
        throw new LicenseRequestError('unavailable');
      }
      const snapshot = projectLicenseSnapshot(result);
      pending = null;
      publish({
        ...state,
        status: 'ready',
        snapshot,
        error: null,
        operation: null,
      });
      return true;
    } catch (error) {
      if (disposed || generation !== currentGeneration) return false;
      pending = null;
      const failure = classifyLicenseError(error);
      publish({
        ...state,
        status: failure.kind,
        error: failure,
        providerAvailable: provider.available === true,
        importAvailable:
          provider.available === true &&
          typeof provider.importLicense === 'function',
        operation: null,
      });
      return false;
    }
  }

  return {
    getState: () => state,
    subscribe(listener) {
      if (disposed) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reload: () => run('read', (signal) => provider.read(signal)),
    importLicense(file) {
      if (
        disposed ||
        typeof provider.importLicense !== 'function' ||
        state.snapshot?.canImport !== true
      ) {
        return Promise.resolve(false);
      }
      return run('import', (signal) => provider.importLicense!(file, signal));
    },
    reset() {
      if (disposed) return;
      invalidate();
      publish(initialState());
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      invalidate();
      listeners.clear();
      state = Object.freeze({
        status: 'unavailable',
        snapshot: null,
        error: Object.freeze({ kind: 'unavailable' }),
        providerAvailable: false,
        importAvailable: false,
        operation: null,
      });
    },
  };
}
