/**
 * 工作流方案切换配置
 *
 * 配置文件，用于在 v1、v2 和 v3 方案之间切换
 * 默认使用 V3 方案
 *
 * 切换方式：
 * 1. 环境变量：设置 USE_WORKFLOW_V2=true 或 USE_WORKFLOW_V3=false
 * 2. localStorage：设置 useWorkflowV2=true 或 useWorkflowV3=false
 * 3. URL 参数：添加 ?v1=true 或 ?v2=true 或 ?v3=true/false
 *
 * V3 优先级高于 V2
 */

import { workflowLogger } from '@/utils/logger';

/**
 * 检查 URL 参数中是否指定了 v1=true
 */
const isV1Requested = (): boolean => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v1') === 'true';
  }
  return false;
};

/**
 * 获取是否使用 V3 方案
 * 优先级：URL 参数 > localStorage > 环境变量 > 默认值
 */
const getUseV3 = (): boolean => {
  // 如果指定了 v1=true，则禁用 V3
  if (isV1Requested()) {
    return false;
  }

  // 方式三：URL 参数控制（最高优先级，便于临时测试）
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    // 如果指定了 v3 参数，则使用该值
    const v3Param = urlParams.get('v3');
    if (v3Param !== null) {
      return v3Param === 'true';
    }
  }

  // 方式二：localStorage 控制（开发调试用）
  if (typeof window !== 'undefined') {
    const localStorageValue = localStorage.getItem('useWorkflowV3');
    if (localStorageValue !== null) {
      return localStorageValue === 'true';
    }
  }

  // 方式一：环境变量控制（部署环境用）
  if (typeof process !== 'undefined' && process.env?.USE_WORKFLOW_V3) {
    return process.env.USE_WORKFLOW_V3 === 'true';
  }

  // 默认使用 v3 方案
  return true;
};

/**
 * 获取是否使用 V2 方案
 * 优先级：URL 参数 > localStorage > 环境变量 > 默认值
 */
const getUseV2 = (): boolean => {
  // 如果指定了 v1=true，则禁用 V2
  if (isV1Requested()) {
    return false;
  }

  // 如果 V3 已启用，则不使用 V2
  if (getUseV3()) {
    return false;
  }

  // 方式三：URL 参数控制（最高优先级，便于临时测试）
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    // 如果指定了 v2 参数，则使用该值
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

  // 默认不使用 v2 方案（V3 已作为默认方案）
  return false;
};

/**
 * 工作流配置
 */
export const WORKFLOW_CONFIG = {
  /**
   * 是否使用 V3 方案
   * - true: 使用 V3 方案（基于 V1，统一代理层、全量更新）
   * - false: 不使用 V3
   */
  useV3: getUseV3(),
  /**
   * 是否使用 V2 方案
   * - true: 使用新方案（前端数据驱动、全量更新、支持撤销重做）
   * - false: 使用旧方案（保持原有逻辑）
   */
  useV2: getUseV2(),
};

/**
 * 切换到 V3 方案（仅用于开发调试）
 */
export const enableV3 = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useWorkflowV3', 'true');
    localStorage.setItem('useWorkflowV2', 'false');
    window.location.reload();
  }
};

/**
 * 关闭 V3 方案（仅用于开发调试）
 */
export const disableV3 = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useWorkflowV3', 'false');
    window.location.reload();
  }
};

/**
 * 切换到 V2 方案（仅用于开发调试）
 */
export const enableV2 = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useWorkflowV2', 'true');
    localStorage.setItem('useWorkflowV3', 'false');
    window.location.reload();
  }
};

/**
 * 切换到 V1 方案（仅用于开发调试）
 */
export const disableV2 = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useWorkflowV2', 'false');
    localStorage.setItem('useWorkflowV3', 'false');
    window.location.reload();
  }
};

/**
 * 获取当前使用的方案版本
 */
export const getCurrentVersion = (): 'v1' | 'v2' | 'v3' => {
  if (WORKFLOW_CONFIG.useV3) return 'v3';
  if (WORKFLOW_CONFIG.useV2) return 'v2';
  return 'v1';
};

// 在开发环境下，将切换函数挂载到 window 上，方便调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__workflowConfig = {
    enableV2,
    disableV2,
    enableV3,
    disableV3,
    getCurrentVersion,
    config: WORKFLOW_CONFIG,
  };
  workflowLogger.log('[Config] 当前使用方案:', getCurrentVersion());
}

export default WORKFLOW_CONFIG;
