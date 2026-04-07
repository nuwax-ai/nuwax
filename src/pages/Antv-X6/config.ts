/**
 * Workflow rollout switch config.
 *
 * This file controls switching between v1, v2 and v3.
 * V3 is enabled by default.
 *
 * Switch methods:
 * 1. Environment variable: USE_WORKFLOW_V2=true or USE_WORKFLOW_V3=false
 * 2. localStorage: useWorkflowV2=true or useWorkflowV3=false
 * 3. URL query: ?v1=true or ?v2=true or ?v3=true/false
 *
 * V3 has higher priority than V2.
 */

import { workflowLogger } from '@/utils/logger';

/**
 * Returns true when URL query explicitly sets v1=true.
 */
const isV1Requested = (): boolean => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v1') === 'true';
  }
  return false;
};

/**
 * Returns whether V3 should be enabled.
 * Priority: URL query > localStorage > env > default.
 */
const getUseV3 = (): boolean => {
  // Explicit v1 flag disables V3.
  if (isV1Requested()) {
    return false;
  }

  // URL query switch (highest priority, useful for temporary testing).
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    // If v3 is specified, follow it.
    const v3Param = urlParams.get('v3');
    if (v3Param !== null) {
      return v3Param === 'true';
    }
  }

  // localStorage switch (for local debugging).
  if (typeof window !== 'undefined') {
    const localStorageValue = localStorage.getItem('useWorkflowV3');
    if (localStorageValue !== null) {
      return localStorageValue === 'true';
    }
  }

  // Environment variable switch (for deployment).
  if (typeof process !== 'undefined' && process.env?.USE_WORKFLOW_V3) {
    return process.env.USE_WORKFLOW_V3 === 'true';
  }

  // Default to v3.
  return true;
};

/**
 * Returns whether V2 should be enabled.
 * Priority: URL query > localStorage > env > default.
 */
const getUseV2 = (): boolean => {
  // Explicit v1 flag disables V2.
  if (isV1Requested()) {
    return false;
  }

  // V2 is disabled when V3 is enabled.
  if (getUseV3()) {
    return false;
  }

  // URL query switch (highest priority, useful for temporary testing).
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    // If v2 is specified, follow it.
    const v2Param = urlParams.get('v2');
    if (v2Param !== null) {
      return v2Param === 'true';
    }
  }

  // localStorage switch (for local debugging).
  if (typeof window !== 'undefined') {
    const localStorageValue = localStorage.getItem('useWorkflowV2');
    if (localStorageValue !== null) {
      return localStorageValue === 'true';
    }
  }

  // Environment variable switch (for deployment).
  if (typeof process !== 'undefined' && process.env?.USE_WORKFLOW_V2) {
    return process.env.USE_WORKFLOW_V2 === 'true';
  }

  // V2 is off by default because V3 is the default mode.
  return false;
};

/**
 * Workflow config snapshot.
 */
export const WORKFLOW_CONFIG = {
  /**
   * V3 toggle.
   * - true: use V3 mode (based on V1 with unified proxy and full update flow)
   * - false: disable V3
   */
  useV3: getUseV3(),
  /**
   * V2 toggle.
   * - true: use V2 mode (frontend-driven data, full updates, undo/redo)
   * - false: use legacy mode
   */
  useV2: getUseV2(),
};

/**
 * Enable V3 (debug usage only).
 */
export const enableV3 = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useWorkflowV3', 'true');
    localStorage.setItem('useWorkflowV2', 'false');
    window.location.reload();
  }
};

/**
 * Disable V3 (debug usage only).
 */
export const disableV3 = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useWorkflowV3', 'false');
    window.location.reload();
  }
};

/**
 * Enable V2 (debug usage only).
 */
export const enableV2 = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useWorkflowV2', 'true');
    localStorage.setItem('useWorkflowV3', 'false');
    window.location.reload();
  }
};

/**
 * Switch to V1 (debug usage only).
 */
export const disableV2 = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('useWorkflowV2', 'false');
    localStorage.setItem('useWorkflowV3', 'false');
    window.location.reload();
  }
};

/**
 * Returns the current active rollout version.
 */
export const getCurrentVersion = (): 'v1' | 'v2' | 'v3' => {
  if (WORKFLOW_CONFIG.useV3) return 'v3';
  if (WORKFLOW_CONFIG.useV2) return 'v2';
  return 'v1';
};

// Expose switch helpers on window in development for easy debugging.
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__workflowConfig = {
    enableV2,
    disableV2,
    enableV3,
    disableV3,
    getCurrentVersion,
    config: WORKFLOW_CONFIG,
  };
  workflowLogger.log('[Config] Active workflow version:', getCurrentVersion());
}

export default WORKFLOW_CONFIG;
