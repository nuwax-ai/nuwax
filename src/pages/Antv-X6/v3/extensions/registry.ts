/**
 * 扩展注册表单例
 *
 * 核心文件通过此注册表委托分支节点处理逻辑给扩展 handler，
 * 避免在核心 switch/case 中直接写入 AgentFlow 等特定分支类型的代码。
 */

import type { NodeTypeEnum } from '@/types/enums/common';
import type { BranchNodeHandler } from './types';

class ExtensionRegistry {
  private handlers = new Map<NodeTypeEnum, BranchNodeHandler>();

  register(handler: BranchNodeHandler): void {
    if (this.handlers.has(handler.nodeType)) {
      console.warn(
        `[ExtensionRegistry] Overwriting handler for ${handler.nodeType}`,
      );
    }
    this.handlers.set(handler.nodeType, handler);
  }

  get(nodeType: NodeTypeEnum): BranchNodeHandler | undefined {
    return this.handlers.get(nodeType);
  }
}

/** 全局扩展注册表单例 */
export const extensionRegistry = new ExtensionRegistry();
