/**
 * useAudioStream - 智能体电脑音频流播放Hook
 *
 * 功能说明：
 * 1. 通过WebSocket接收远程桌面的音频流（Opus编码）
 * 2. 使用Opus解码器解码音频数据
 * 3. 通过Web Audio API播放音频
 *
 * 技术细节：
 * - 音频格式：Opus编码，48kHz采样率，双声道
 * - 协议头：0x01表示Opus音频数据
 * - 播放方式：BufferSource调度播放，保证连续性
 */

import { vncLogger } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

/** 音频连接状态 */
export type AudioStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** OpusDecoder 类型定义 */
interface OpusDecoderInstance {
  ready: Promise<void>;
  decodeFrame: (data: Uint8Array) => {
    channelData: Float32Array[];
    samplesDecoded: number;
  };
  free: () => void;
}

interface OpusDecoderConstructor {
  new (options: { sampleRate: number; channels: number }): OpusDecoderInstance;
}

/** Hook 配置参数 */
interface UseAudioStreamOptions {
  /** 服务基础URL */
  serviceUrl?: string;
  /** 容器ID */
  cId: string;
  /** 是否启用音频 */
  enabled?: boolean;
  /** 初始音量 (0-1) */
  initialVolume?: number;
  /** VNC连接状态，只有connected时才尝试连接音频 */
  vncStatus?: string;
}

/** Hook 返回值 */
interface UseAudioStreamReturn {
  /** 音频连接状态 */
  status: AudioStatus;
  /** 当前音量 (0-1) */
  volume: number;
  /** 设置音量 */
  setVolume: (volume: number) => void;
  /** 手动连接 */
  connect: () => Promise<void>;
  /** 手动断开 */
  disconnect: () => void;
  /** 错误信息 */
  errorMessage: string;
}

/**
 * 动态加载 OpusDecoder 库
 * 从 /libs/opus-decoder.min.js 加载
 */
const loadOpusDecoder = (): Promise<OpusDecoderConstructor> => {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    const existingLib = (window as any)['opus-decoder'];
    if (existingLib?.OpusDecoder) {
      vncLogger.log('OpusDecoder 已加载（缓存）');
      resolve(existingLib.OpusDecoder);
      return;
    }

    // 动态加载脚本
    const script = document.createElement('script');
    script.src = '/libs/opus-decoder.min.js';
    script.async = true;

    script.onload = () => {
      const lib = (window as any)['opus-decoder'];
      if (lib?.OpusDecoder) {
        vncLogger.log('✅ OpusDecoder 加载成功');
        resolve(lib.OpusDecoder);
      } else {
        reject(new Error('OpusDecoder 加载失败：库对象不存在'));
      }
    };

    script.onerror = () => {
      reject(new Error('OpusDecoder 脚本加载失败'));
    };

    document.head.appendChild(script);
  });
};

/**
 * 音频流播放Hook
 */
export function useAudioStream(
  options: UseAudioStreamOptions,
): UseAudioStreamReturn {
  const {
    serviceUrl,
    cId,
    enabled = true,
    initialVolume = 0.8,
    vncStatus,
  } = options;

  // 状态
  const [status, setStatus] = useState<AudioStatus>('disconnected');
  const [volume, setVolumeState] = useState(initialVolume);
  const [errorMessage, setErrorMessage] = useState('');

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const decoderRef = useRef<OpusDecoderInstance | null>(null);
  const nextPlayTimeRef = useRef(0);
  const isConnectingRef = useRef(false);

  /**
   * 构建音频WebSocket URL
   */
  const buildAudioWsUrl = useCallback(() => {
    if (!serviceUrl || !cId) return null;

    const cleanBaseUrl = serviceUrl.replace(/\/+$/, '').replace(/^http/, 'ws');
    return `${cleanBaseUrl}/computer/audio/${cId}/ws`;
  }, [serviceUrl, cId]);

  /**
   * 播放解码后的音频数据
   */
  const playAudioChunk = useCallback(async (opusData: Uint8Array) => {
    try {
      const decoder = decoderRef.current;
      const audioContext = audioContextRef.current;
      const gainNode = gainNodeRef.current;

      if (!decoder || !audioContext || !gainNode) {
        return;
      }

      // 解码Opus数据
      const decoded = decoder.decodeFrame(opusData);
      const channels = decoded.channelData;
      const samplesDecoded = decoded.samplesDecoded;

      if (!channels || channels.length < 2 || samplesDecoded === 0) {
        return;
      }

      const leftChannelData = channels[0];
      const rightChannelData = channels[1];

      // 创建AudioBuffer
      const audioBuffer = audioContext.createBuffer(2, samplesDecoded, 48000);

      // 填充声道数据
      audioBuffer.getChannelData(0).set(leftChannelData);
      audioBuffer.getChannelData(1).set(rightChannelData);

      // 调度播放
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNode);

      // 计算播放时间
      const currentTime = audioContext.currentTime;

      // 如果 nextPlayTime 已过期，重新开始
      if (nextPlayTimeRef.current < currentTime) {
        nextPlayTimeRef.current = currentTime + 0.05; // 50ms缓冲
      }

      // 调度播放
      source.start(nextPlayTimeRef.current);

      // 计算下一个播放时间点
      const duration = samplesDecoded / 48000;
      nextPlayTimeRef.current += duration;
    } catch (err) {
      vncLogger.error('解码或播放失败:', err);
      // 解码失败时重置解码器
      if (decoderRef.current) {
        try {
          decoderRef.current.free();
        } catch (e) {
          // ignore
        }
        decoderRef.current = null;
      }
    }
  }, []);

  /**
   * 连接音频流
   */
  const connect = useCallback(async () => {
    if (isConnectingRef.current || status === 'connected') {
      return;
    }

    const wsUrl = buildAudioWsUrl();
    if (!wsUrl) {
      setErrorMessage('缺少必要配置');
      return;
    }

    isConnectingRef.current = true;
    setStatus('connecting');
    setErrorMessage('');

    try {
      // 1. 加载OpusDecoder
      const OpusDecoder = await loadOpusDecoder();

      // 2. 初始化解码器
      if (!decoderRef.current) {
        decoderRef.current = new OpusDecoder({
          sampleRate: 48000,
          channels: 2,
        });
        await decoderRef.current.ready;
        vncLogger.log('OpusDecoder 初始化完成');
      }

      // 3. 初始化Web Audio API
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)({
          sampleRate: 48000,
          latencyHint: 'interactive',
        });

        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = volume;
        gainNodeRef.current.connect(audioContextRef.current.destination);

        nextPlayTimeRef.current = audioContextRef.current.currentTime + 0.1;
      }

      // 恢复AudioContext（浏览器安全策略）
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // 4. 连接WebSocket
      const ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        vncLogger.log('WebSocket 已连接');
        setStatus('connected');
        isConnectingRef.current = false;
      };

      ws.onmessage = async (event) => {
        try {
          const data = new Uint8Array(event.data);
          // 检查协议头 (0x01 表示 Opus 音频)
          if (data[0] === 0x01) {
            const opusData = data.slice(1);
            await playAudioChunk(opusData);
          }
        } catch (err) {
          vncLogger.error('处理音频数据失败:', err);
        }
      };

      ws.onerror = (err) => {
        vncLogger.error('WebSocket 错误:', err);
        setStatus('error');
        setErrorMessage('音频连接失败');
        isConnectingRef.current = false;
      };

      ws.onclose = () => {
        vncLogger.log('WebSocket 已关闭');
        setStatus('disconnected');
        isConnectingRef.current = false;
        wsRef.current = null;
      };
    } catch (err: any) {
      vncLogger.error('连接失败:', err);
      setStatus('error');
      setErrorMessage(err.message || '音频初始化失败');
      isConnectingRef.current = false;
    }
  }, [buildAudioWsUrl, status, volume, playAudioChunk]);

  /**
   * 断开音频流
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // 重置播放时间
    nextPlayTimeRef.current = 0;

    setStatus('disconnected');
    setErrorMessage('');
    isConnectingRef.current = false;
  }, []);

  /**
   * 设置音量
   */
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clampedVolume;
    }
  }, []);

  // VNC连接成功后自动连接音频
  useEffect(() => {
    if (enabled && vncStatus === 'connected' && status === 'disconnected') {
      // 延迟一点连接，确保VNC完全就绪
      const timer = setTimeout(() => {
        connect();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [enabled, vncStatus, status, connect]);

  // VNC断开时断开音频
  useEffect(() => {
    if (vncStatus === 'disconnected' || vncStatus === 'error') {
      disconnect();
    }
  }, [vncStatus, disconnect]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      disconnect();

      // 释放解码器
      if (decoderRef.current) {
        try {
          decoderRef.current.free();
        } catch (e) {
          // ignore
        }
        decoderRef.current = null;
      }

      // 关闭AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [disconnect]);

  return {
    status,
    volume,
    setVolume,
    connect,
    disconnect,
    errorMessage,
  };
}

export default useAudioStream;
