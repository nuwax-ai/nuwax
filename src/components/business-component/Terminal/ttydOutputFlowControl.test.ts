import { describe, expect, it, vi } from 'vitest';
import { createTtydOutputFlowControl } from './ttydOutputFlowControl';
import { TTYD_CMD_PAUSE, TTYD_CMD_RESUME } from './ttydWire';

const harness = () => {
  const callbacks: Array<() => void> = [];
  const chunks: string[] = [];
  const send = vi.fn();
  const flow = createTtydOutputFlowControl({
    highWaterBytes: 10,
    lowWaterBytes: 4,
    send,
    write: (data, callback) => {
      chunks.push(data);
      callbacks.push(callback);
    },
  });
  return { flow, callbacks, chunks, send };
};

describe('ttyd output flow control', () => {
  it('keeps normal output ordered and releases bytes only after parsing', () => {
    const { flow, chunks, callbacks, send } = harness();
    flow.write('first');
    expect(flow.getPendingBytes()).toBe(5);
    callbacks.shift()!();
    flow.write('second');
    callbacks.shift()!();
    expect(chunks).toEqual(['first', 'second']);
    expect(flow.getPendingBytes()).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('pauses once, retains every chunk, and resumes below the low watermark', () => {
    const { flow, chunks, callbacks, send } = harness();
    flow.write('123456');
    flow.write('abcdef');
    flow.write('tail');
    expect(chunks).toEqual(['123456', 'abcdef', 'tail']);
    expect(flow.getPendingBytes()).toBe(16);
    expect(send.mock.calls).toEqual([[TTYD_CMD_PAUSE]]);
    callbacks.shift()!();
    callbacks.shift()!();
    expect(send.mock.calls).toEqual([[TTYD_CMD_PAUSE]]);
    callbacks.shift()!();
    expect(flow.getPendingBytes()).toBe(0);
    expect(send.mock.calls).toEqual([[TTYD_CMD_PAUSE], [TTYD_CMD_RESUME]]);
  });

  it('counts UTF-8 bytes rather than UTF-16 string length', () => {
    const { flow, send } = harness();
    flow.write('你好世界');
    expect(flow.getPendingBytes()).toBe(12);
    expect(send).toHaveBeenCalledWith(TTYD_CMD_PAUSE);
  });

  it('resumes before disconnect and ignores callbacks from the previous connection', () => {
    const { flow, callbacks, send } = harness();
    flow.write('12345678901');
    const oldCallback = callbacks.shift()!;
    flow.release();
    expect(flow.getPendingBytes()).toBe(0);
    flow.write('new-1234567');
    oldCallback();
    expect(flow.getPendingBytes()).toBe(11);
    expect(send.mock.calls).toEqual([
      [TTYD_CMD_PAUSE],
      [TTYD_CMD_RESUME],
      [TTYD_CMD_PAUSE],
    ]);
  });

  it('handles synchronous parsing callbacks without leaving the peer paused', () => {
    const send = vi.fn();
    const flow = createTtydOutputFlowControl({
      highWaterBytes: 10,
      lowWaterBytes: 4,
      send,
      write: (_, callback) => callback(),
    });
    flow.write('12345678901');
    expect(flow.getPendingBytes()).toBe(0);
    expect(send.mock.calls).toEqual([[TTYD_CMD_PAUSE], [TTYD_CMD_RESUME]]);
  });

  it('preserves output if a PAUSE/RESUME send races with socket closure', () => {
    const chunks: string[] = [];
    const flow = createTtydOutputFlowControl({
      highWaterBytes: 10,
      lowWaterBytes: 4,
      send: () => {
        throw new Error('closed socket');
      },
      write: (data, callback) => {
        chunks.push(data);
        callback();
      },
    });
    expect(() => flow.write('12345678901')).not.toThrow();
    expect(chunks).toEqual(['12345678901']);
    expect(flow.getPendingBytes()).toBe(0);
  });
});
