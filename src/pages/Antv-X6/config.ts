/**
 * 工作流方案切换配置
 * 
 * 临时配置文件，用于在 v1 和 v2 方案之间切换
 * v2 上线后可删除此文件，直接使用 v2
 * 
 * 切换方式：
 * 1. 环境变量：设置 USE_WORKFLOW_V2=true
 * 2. localStorage：设置 useWorkflowV2=true
 * 3. URL 参数：添加 ?v2=true
 */

/**
 * 获取是否使用 V2 方案
 * 优先级：URL 参数 > localStorage > 环境变量 > 默认值
 */
const getUseV2 = (): boolean => {
  // 方式三：URL 参数控制（最高优先级，便于临时测试）
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const v2Param = urlParams.get('v2');
    if (v2Param !== null) {
      return v2Param === 'true';
    }
  }

  // 方式二：localStorage 控制（开发调试用）
  if (typeof window !== 'undefined') {
    const localStorageValue = localStorage.getItem('useWorkflowV2');
    if (localStorageValue !== null) {
      return localStorageValue === 'true';
    }
  }

  // 方式一：环境变量控制（部署环境用）
  if (typeof process !== 'undefined' && process.env?.USE_WORKFLOW_V2) {
    return process.env.USE_WORKFLOW_V2 === 'true';
  }

  // 默认使用 v1 方案，确保向后兼容
  return false;
};

/**
 * 工作流配置
 */
export const WORKFLOW_CONFIG = {
  /**
   * 是否使用 V2 方案
   * - true: 使用新方案（前端数据驱动、全量更新、支持撤销重做）
   * - false: 使用旧方案（保持原有逻辑）
   */
  useV2: getUseV2(),
};

/**
 * 切换到 V2 方案（仅用于开发调试）
 */
export const enableV2 = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useWorkflowV2', 'true');
    window.location.reload();
  }
};

/**
 * 切换到 V1 方案（仅用于开发调试）
 */
export const disableV2 = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useWorkflowV2', 'false');
    window.location.reload();
  }
};

/**
 * 获取当前使用的方案版本
 */
export const getCurrentVersion = (): 'v1' | 'v2' => {
  return WORKFLOW_CONFIG.useV2 ? 'v2' : 'v1';
};

// 在开发环境下，将切换函数挂载到 window 上，方便调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__workflowConfig = {
    enableV2,
    disableV2,
    getCurrentVersion,
    config: WORKFLOW_CONFIG,
  };
  console.log('[Workflow] 当前使用方案:', getCurrentVersion());
  console.log('[Workflow] 切换方案方法: window.__workflowConfig.enableV2() / disableV2()');
}

export default WORKFLOW_CONFIG;
