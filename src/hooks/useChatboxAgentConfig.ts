import type { AgentMode } from '@/components/business-component/AgentIntervention';
import {
  apiUserConfigGet,
  apiUserConfigSet,
  chatboxConfigKey,
} from '@/services/userConfig';
import { useCallback, useEffect, useRef, useState } from 'react';

/** 会话框 + 号弹层内审批/版本管理/自动提交开关的服务端配置态。
 *
 * mode 的单一真源保持在宿主（agentMode 受控 props），本 hook 只负责：
 * - 按 agentId 拉取服务端 chatbox.config 回填两键开关，并把服务端 mode 同步回宿主；
 * - 任一开关变更时乐观更新本地两键，并将三键全量写入服务端（失败静默，下次进入以 GET 校正）。
 * 未配置过时：enableVersionControl 用 agent 返回的默认值，autoCommit 默认开。
 */
export function useChatboxAgentConfig(options: {
  agentId?: number;
  /** agent 侧 enableVersionControl（Yes→1，其余→0），作为用户未配置过时的默认值 */
  defaultEnableVersionControl: 0 | 1;
  /** 宿主持有的当前模式（写入服务端时携带，保持单一真源） */
  agentMode: AgentMode;
  /** 服务端配置中的 mode 需要同步回宿主时调用 */
  onAgentModeChange?: (mode: AgentMode) => void;
}) {
  const { agentId, defaultEnableVersionControl, agentMode, onAgentModeChange } =
    options;

  const [enableVersionControl, setEnableVersionControlState] = useState(
    defaultEnableVersionControl,
  );
  const [autoCommit, setAutoCommitState] = useState(1);

  // 最新值 ref：POST 全量时取当前值，避免闭包过期
  const evRef = useRef(enableVersionControl);
  evRef.current = enableVersionControl;
  const acRef = useRef(autoCommit);
  acRef.current = autoCommit;
  const modeRef = useRef(agentMode);
  modeRef.current = agentMode;
  const onModeChangeRef = useRef(onAgentModeChange);
  onModeChangeRef.current = onAgentModeChange;
  const defaultEvRef = useRef(defaultEnableVersionControl);
  defaultEvRef.current = defaultEnableVersionControl;

  // 服务端配置是否已回填 / 用户是否已手动改过（改过后 GET 晚到不覆盖用户操作）
  const hydratedRef = useRef(false);
  const userMutatedRef = useRef(false);

  // agent 默认值异步到位（agent 详情晚于挂载）：未回填且用户未操作时跟随默认值
  useEffect(() => {
    if (!hydratedRef.current && !userMutatedRef.current) {
      setEnableVersionControlState(defaultEnableVersionControl);
    }
  }, [defaultEnableVersionControl]);

  // agentId 变化时重新拉取服务端配置
  useEffect(() => {
    hydratedRef.current = false;
    userMutatedRef.current = false;
    if (!agentId) {
      // 无 agentId 无法定位配置：回落默认值，仅内存态不持久化
      setEnableVersionControlState(defaultEvRef.current);
      setAutoCommitState(1);
      return;
    }
    let cancelled = false;
    apiUserConfigGet(chatboxConfigKey(agentId))
      .then((res) => {
        if (cancelled) {
          return;
        }
        const data = res?.data;
        if (!data) {
          return;
        }
        hydratedRef.current = true;
        if (!userMutatedRef.current) {
          setEnableVersionControlState(data.enableVersionControl === 1 ? 1 : 0);
          setAutoCommitState(data.autoCommit === 1 ? 1 : 0);
          if (data.mode === 'ask' || data.mode === 'yolo') {
            onModeChangeRef.current?.(data.mode);
          }
        }
      })
      .catch(() => {
        // 读取失败静默：保持默认值/本地缓存，不影响输入
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  // 三键全量写入服务端（agentId 缺失时跳过）
  const persist = useCallback(
    (next: {
      mode?: 'yolo' | 'ask';
      enableVersionControl?: number;
      autoCommit?: number;
    }) => {
      if (!agentId) {
        return;
      }
      const value = {
        mode:
          next.mode ?? (modeRef.current === 'plan' ? 'yolo' : modeRef.current),
        enableVersionControl: next.enableVersionControl ?? evRef.current,
        autoCommit: next.autoCommit ?? acRef.current,
      };
      apiUserConfigSet({ key: chatboxConfigKey(agentId), value }).catch(() => {
        // 写入失败静默：本地态已乐观更新，下次进入以 GET 校正
      });
    },
    [agentId],
  );

  /** 切换审批模式（ask/yolo）：同步宿主 state 并持久化 */
  const setMode = useCallback(
    (mode: 'yolo' | 'ask') => {
      userMutatedRef.current = true;
      onModeChangeRef.current?.(mode);
      persist({ mode });
    },
    [persist],
  );

  /** 切换产物版本管理 */
  const setEnableVersionControl = useCallback(
    (enabled: boolean) => {
      userMutatedRef.current = true;
      setEnableVersionControlState(enabled ? 1 : 0);
      persist({ enableVersionControl: enabled ? 1 : 0 });
    },
    [persist],
  );

  /** 切换变更自动提交 */
  const setAutoCommit = useCallback(
    (enabled: boolean) => {
      userMutatedRef.current = true;
      setAutoCommitState(enabled ? 1 : 0);
      persist({ autoCommit: enabled ? 1 : 0 });
    },
    [persist],
  );

  return {
    enableVersionControl,
    autoCommit,
    setMode,
    setEnableVersionControl,
    setAutoCommit,
  };
}
