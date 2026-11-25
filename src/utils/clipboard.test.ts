import { message } from 'antd';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyTextToClipboard } from './clipboard';

vi.mock('antd', () => ({
  message: { success: vi.fn(), error: vi.fn() },
}));
vi.mock('@/services/i18nRuntime', () => ({ dict: (k: string) => k }));
vi.mock('@/utils/hostBridge', () => ({
  hostBridge: { auth: { getContext: vi.fn(async () => null) } },
}));

// 跨域 iframe 未授权剪贴板时浏览器抛的错误
const notAllowed = () =>
  new DOMException('The Clipboard API has been blocked', 'NotAllowedError');

describe('copyTextToClipboard', () => {
  let writeText: ReturnType<typeof vi.fn>;
  let execCommand: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeText = vi.fn();
    execCommand = vi.fn(() => true);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
    document.execCommand = execCommand;
    vi.mocked(message.error).mockReset();
    vi.mocked(message.success).mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (navigator as { clipboard?: unknown }).clipboard;
    delete (document as { execCommand?: unknown }).execCommand;
  });

  it('Clipboard API 可用时直接复制成功', async () => {
    writeText.mockResolvedValue(undefined);
    const onCopy = vi.fn();

    await copyTextToClipboard('hello', onCopy, true);

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(execCommand).not.toHaveBeenCalled();
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledWith('hello', true);
    expect(message.success).toHaveBeenCalledTimes(1);
    expect(message.error).not.toHaveBeenCalled();
  });

  it('Clipboard API 被拦截时转传统复制，降级成功不提示失败', async () => {
    writeText.mockRejectedValue(notAllowed());
    const onCopy = vi.fn();

    await copyTextToClipboard('hello', onCopy, true);

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledWith('hello', true);
    expect(message.success).toHaveBeenCalledTimes(1);
    expect(message.error).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('降级也失败才提示失败，并保留 Clipboard API 的报错原因', async () => {
    const cause = notAllowed();
    writeText.mockRejectedValue(cause);
    execCommand.mockReturnValue(false);
    const onCopy = vi.fn();

    await copyTextToClipboard('hello', onCopy, true);

    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledWith('hello', false);
    expect(message.error).toHaveBeenCalledTimes(1);
    expect(message.error).toHaveBeenCalledWith('PC.Utils.Clipboard.copyFailed');
    expect(message.success).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'PC.Utils.Clipboard.copyFailed',
      cause,
    );
  });
});
