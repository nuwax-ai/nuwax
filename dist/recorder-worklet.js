/* eslint-disable */
/**
 * AudioWorklet 录音处理器（桌面端语音输入用）
 *
 * 采集单声道 PCM Float32 帧并通过 port.postMessage 传给主线程，
 * 主线程累加后在停止时编码为 WAV。该文件作为静态资源由 umi 以 publicPath 服务，
 * 故放在 public/ 下，运行时由 audioWorklet.addModule() 加载。
 */
class RecorderProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    const channel = input && input[0];
    if (channel && channel.length) {
      // 拷贝当前帧，避免 AudioWorklet 内部 buffer 复用导致数据被覆盖
      const frame = new Float32Array(channel.length);
      frame.set(channel);
      // 以 transferable 方式移交 buffer 所有权，零拷贝传给主线程
      this.port.postMessage(frame, [frame.buffer]);
    }
    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);
