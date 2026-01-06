/**
 * useImeInput - 智能体电脑输入法透传Hook
 *
 * 功能说明：
 * 1. 通过WebSocket连接到远程IME服务
 * 2. 捕获本地输入法的compositionend事件
 * 3. 将输入的中文文本发送到远程桌面
 *
 * 技术细节：
 * - 使用隐藏的input元素捕获输入法事件
 * - 通过compositionend事件获取完整的中文输入
 * - 发送JSON格式消息: { type: "text", text: "...", method: "xdotool" }
 */

import { vncLogger } from '@/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

/** IME连接状态 */
export type ImeStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Hook 配置参数 */
interface UseImeInputOptions {
  /** 服务基础URL */
  serviceUrl?: string;
  /** 用户ID */
  userId?: string;
  /** 项目ID */
  projectId: string;
  /** 是否启用输入法透传 */
  enabled?: boolean;
  /** VNC连接状态，只有connected时才尝试连接IME */
  vncStatus?: string;
  /** iframe元素引用，用于在VNC区域检测焦点 */
  iframeRef?: React.RefObject<HTMLIFrameElement>;
}

/** Hook 返回值 */
interface UseImeInputReturn {
  /** IME连接状态 */
  status: ImeStatus;
  /** 手动连接 */
  connect: () => void;
  /** 手动断开 */
  disconnect: () => void;
  /** 错误信息 */
  errorMessage: string;
  /** 隐藏输入框的ref，需要挂载到DOM */
  inputRef: React.RefObject<HTMLInputElement>;
  /** 激活输入法输入（聚焦隐藏输入框） */
  activateInput: () => void;
}

/**
 * 输入法透传Hook
 */
export function useImeInput(options: UseImeInputOptions): UseImeInputReturn {
  const {
    serviceUrl,
    userId,
    projectId,
    enabled = true,
    vncStatus,
    iframeRef,
  } = options;

  // 状态
  const [status, setStatus] = useState<ImeStatus>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isConnectingRef = useRef(false);

  /**
   * 构建IME WebSocket URL
   * 格式: /computer/ime/{user_id}/{project_id}/connect
   */
  const buildImeWsUrl = useCallback(() => {
    if (!serviceUrl || !userId || !projectId) return null;

    const cleanBaseUrl = serviceUrl.replace(/\/+$/, '').replace(/^http/, 'ws');
    return `${cleanBaseUrl}/computer/ime/${userId}/${projectId}/connect`;
  }, [serviceUrl, userId, projectId]);

  /**
   * 发送文本到远程桌面
   */
  const sendTextToRemote = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      vncLogger.warn('[IME] 未连接，无法发送文本');
      return;
    }

    const message = JSON.stringify({
      type: 'text',
      text: text,
      method: 'xdotool', // 使用xdotool方式输入
    });

    wsRef.current.send(message);
    vncLogger.log('[IME] 发送文本:', text);
  }, []);

  /**
   * 连接IME服务
   */
  const connect = useCallback(() => {
    if (isConnectingRef.current || status === 'connected') {
      return;
    }

    const wsUrl = buildImeWsUrl();
    if (!wsUrl) {
      setErrorMessage('缺少必要配置');
      return;
    }

    isConnectingRef.current = true;
    setStatus('connecting');
    setErrorMessage('');

    vncLogger.log('[IME] 连接 IME 服务:', wsUrl);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        vncLogger.log('[IME] WebSocket 已连接');
        setStatus('connected');
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (response.status === 'ok') {
            vncLogger.log('[IME] 文本发送成功');
          } else {
            vncLogger.error('[IME] 服务器错误:', response.message);
          }
        } catch (err) {
          vncLogger.error('[IME] 响应解析失败:', err);
        }
      };

      ws.onerror = (err) => {
        vncLogger.error('[IME] WebSocket 错误:', err);
        setStatus('error');
        setErrorMessage('IME连接失败');
        isConnectingRef.current = false;
      };

      ws.onclose = () => {
        vncLogger.log('[IME] WebSocket 已关闭');
        setStatus('disconnected');
        isConnectingRef.current = false;
        wsRef.current = null;
      };
    } catch (err: any) {
      vncLogger.error('[IME] 连接失败:', err);
      setStatus('error');
      setErrorMessage(err.message || 'IME初始化失败');
      isConnectingRef.current = false;
    }
  }, [buildImeWsUrl, status]);

  /**
   * 断开IME服务
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('disconnected');
    setErrorMessage('');
    isConnectingRef.current = false;
  }, []);

  /**
   * 激活输入法输入（聚焦隐藏输入框）
   */
  const activateInput = useCallback(() => {
    if (inputRef.current && status === 'connected') {
      inputRef.current.focus();
    }
  }, [status]);

  // 设置输入法事件监听
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    /**
     * 处理输入法完成事件（compositionend）
     * 当用户完成中文输入（选择候选词）时触发
     */
    const handleCompositionEnd = (event: CompositionEvent) => {
      const text = event.data;

      if (text && text.length > 0 && status === 'connected') {
        vncLogger.log('[IME] 输入完成:', text);
        sendTextToRemote(text);

        // 清空输入框
        if (input) {
          input.value = '';
        }
      }
    };

    /**
     * 处理直接输入事件（非输入法输入）
     * 用于处理英文直接输入的情况
     */
    const handleInput = (event: Event) => {
      const inputEvent = event as InputEvent;
      const target = event.target as HTMLInputElement;
      const text = target.value;

      // 如果不是输入法输入，直接发送
      if (
        text &&
        text.length > 0 &&
        status === 'connected' &&
        !inputEvent.isComposing
      ) {
        vncLogger.log('[IME] 直接输入:', text);
        sendTextToRemote(text);
        target.value = '';
      }
    };

    input.addEventListener('compositionend', handleCompositionEnd);
    input.addEventListener('input', handleInput);

    return () => {
      input.removeEventListener('compositionend', handleCompositionEnd);
      input.removeEventListener('input', handleInput);
    };
  }, [status, sendTextToRemote]);

  // 监听VNC iframe的点击事件，在点击后激活输入法
  useEffect(() => {
    if (!iframeRef?.current || status !== 'connected') return;

    const iframe = iframeRef.current;
    const container = iframe.parentElement;

    if (!container) return;

    /**
     * 当用户点击VNC区域时，激活隐藏的输入框
     * 这样用户可以直接使用输入法输入中文
     */
    const handleContainerClick = () => {
      // 延迟一点激活，避免与VNC的点击事件冲突
      setTimeout(() => {
        activateInput();
      }, 100);
    };

    container.addEventListener('click', handleContainerClick);

    return () => {
      container.removeEventListener('click', handleContainerClick);
    };
  }, [iframeRef, status, activateInput]);

  // VNC连接成功后自动连接IME
  useEffect(() => {
    if (enabled && vncStatus === 'connected' && status === 'disconnected') {
      // 延迟连接，确保VNC完全就绪
      const timer = setTimeout(() => {
        connect();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [enabled, vncStatus, status, connect]);

  // VNC断开时断开IME
  useEffect(() => {
    if (vncStatus === 'disconnected' || vncStatus === 'error') {
      disconnect();
    }
  }, [vncStatus, disconnect]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    connect,
    disconnect,
    errorMessage,
    inputRef,
    activateInput,
  };
}

export default useImeInput;
