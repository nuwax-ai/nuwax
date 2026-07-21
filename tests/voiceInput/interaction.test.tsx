import { useVoiceFooter } from '@/components/business-component/VoiceInput/chatInputFooter/context';
import {
  mergeVoiceTranscript,
  VoiceFooterProvider,
} from '@/components/business-component/VoiceInput/chatInputFooter/Provider';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

const ResultTrigger: React.FC = () => {
  const { handleVoiceResult } = useVoiceFooter();
  return (
    <button type="button" onClick={() => handleVoiceResult('转写文本', 'send')}>
      提交转写
    </button>
  );
};

const ResultCapture: React.FC<{
  triggerRef: React.MutableRefObject<(() => void) | null>;
}> = ({ triggerRef }) => {
  const { handleVoiceResult } = useVoiceFooter();
  triggerRef.current = () => handleVoiceResult('迟到的转写文本', 'send');
  return null;
};

describe('语音结果交互', () => {
  it('直接发送时将转写文本追加到已有草稿', () => {
    expect(mergeVoiceTranscript('已有草稿', '转写文本')).toBe(
      '已有草稿\n转写文本',
    );
    expect(mergeVoiceTranscript('', '转写文本')).toBe('转写文本');
  });

  it('结果返回时已禁用则降级为回填，不继续发送', () => {
    const onFill = vi.fn();
    const onSend = vi.fn();

    render(
      <VoiceFooterProvider disabled onFill={onFill} onSend={onSend}>
        <ResultTrigger />
      </VoiceFooterProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: '提交转写' }));

    expect(onSend).not.toHaveBeenCalled();
    expect(onFill).toHaveBeenCalledWith('转写文本');
  });

  it('未禁用时按原模式直接发送', () => {
    const onFill = vi.fn();
    const onSend = vi.fn();

    render(
      <VoiceFooterProvider onFill={onFill} onSend={onSend}>
        <ResultTrigger />
      </VoiceFooterProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: '提交转写' }));

    expect(onFill).not.toHaveBeenCalled();
    expect(onSend).toHaveBeenCalledWith('转写文本');
  });

  it('异步转写使用最新禁用状态与回调', () => {
    const initialFill = vi.fn();
    const initialSend = vi.fn();
    const latestFill = vi.fn();
    const latestSend = vi.fn();
    const triggerRef = { current: null } as React.MutableRefObject<
      (() => void) | null
    >;

    const { rerender } = render(
      <VoiceFooterProvider onFill={initialFill} onSend={initialSend}>
        <ResultCapture triggerRef={triggerRef} />
      </VoiceFooterProvider>,
    );
    const pendingResult = triggerRef.current;

    rerender(
      <VoiceFooterProvider disabled onFill={latestFill} onSend={latestSend}>
        <ResultCapture triggerRef={triggerRef} />
      </VoiceFooterProvider>,
    );
    act(() => pendingResult?.());

    expect(initialFill).not.toHaveBeenCalled();
    expect(initialSend).not.toHaveBeenCalled();
    expect(latestSend).not.toHaveBeenCalled();
    expect(latestFill).toHaveBeenCalledWith('迟到的转写文本');
  });
});
