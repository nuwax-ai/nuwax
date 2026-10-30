import { t } from '@/services/i18nRuntime';
import { getCaptureBridge } from '@/utils/hostBridge';
import { message } from 'antd';
import { useEffect, useRef, type RefObject } from 'react';

const CHUNK_BYTES = 4 * 1024 * 1024;
const MAX_CAPTURE_BYTES = 100 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

/** 复用 IM 的认领协议；仅发起时聚焦的草稿接收结果，不监听剪贴板。 */
export function useNativeCapture(options: {
  editorRef: RefObject<{ hasFocus?: () => boolean }>;
  scope: string;
  disabled: boolean;
  onFiles(files: File[]): Promise<void>;
}) {
  const current = useRef(options);
  current.current = options;
  const generation = useRef(0);
  const previous = useRef({ scope: options.scope, disabled: options.disabled });
  if (
    previous.current.scope !== options.scope ||
    previous.current.disabled !== options.disabled
  ) {
    previous.current = { scope: options.scope, disabled: options.disabled };
    generation.current++;
  }

  useEffect(() => {
    const capture = getCaptureBridge();
    if (!capture) return;
    const {
      onShortcut,
      interactive,
      screenshot,
      record,
      readChunk,
      release,
      copy,
    } = capture;
    if (!onShortcut || !screenshot || !record || !readChunk || !release) return;
    let alive = true;
    let busy = false;
    let claimedGeneration: number | undefined;
    const isCurrent = (epoch: number) =>
      alive && generation.current === epoch && !current.current.disabled;

    const run = async (action: 'screenshot' | 'mp4' | 'gif') => {
      const epoch = claimedGeneration;
      if (busy || epoch === undefined || !isCurrent(epoch)) return;
      busy = true;
      let resultId: string | undefined;
      try {
        const result = interactive
          ? await interactive({ action })
          : action === 'screenshot'
          ? await screenshot()
          : await record({ output: action });
        if (!result.success) {
          if (
            result.code !== 'canceled' &&
            result.code !== 'permission-denied'
          ) {
            throw new Error(`Capture failed: ${result.code}`);
          }
          return;
        }
        resultId = result.resultId;
        // 先复制，保证切走或附件读取失败时仍可手动粘贴截图。
        if (copy) await copy(resultId).catch(() => undefined);
        if (!isCurrent(epoch)) return;
        const ext = Object.prototype.hasOwnProperty.call(
          EXTENSIONS,
          result.mime,
        )
          ? EXTENSIONS[result.mime]
          : undefined;
        if (
          !ext ||
          !Number.isSafeInteger(result.bytes) ||
          result.bytes < 1 ||
          result.bytes > MAX_CAPTURE_BYTES ||
          result.exceedsMaxBytes
        ) {
          throw new Error('Invalid capture result');
        }
        const parts: ArrayBuffer[] = [];
        for (let offset = 0; offset < result.bytes; offset += CHUNK_BYTES) {
          const length = Math.min(CHUNK_BYTES, result.bytes - offset);
          const bytes = await readChunk(resultId, offset, length);
          if (!isCurrent(epoch)) return;
          if (!bytes || bytes.byteLength !== length)
            throw new Error('Capture result expired');
          parts.push(bytes);
        }
        await current.current.onFiles([
          new File(parts, `capture-${Date.now()}.${ext}`, {
            type: result.mime,
          }),
        ]);
      } catch (error) {
        if (isCurrent(epoch)) {
          console.error('Capture attachment failed:', error);
          message.error(t('PC.Common.Global.operationFailed'));
        }
      } finally {
        if (resultId) await release(resultId).catch(() => undefined);
        busy = false;
      }
    };

    const off = onShortcut({
      canHandle: () => {
        const focused =
          !current.current.disabled &&
          current.current.editorRef.current?.hasFocus?.() === true;
        claimedGeneration = focused ? generation.current : undefined;
        return focused;
      },
      run: (action) => {
        void run(action);
      },
    });
    return () => {
      alive = false;
      off();
    };
  }, []);
}
