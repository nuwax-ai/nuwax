/*
 * Portal Manager
 * 用于管理动态创建的 Portal 容器和内容
 */

import React from 'react';

/**
 * Portal 注册信息
 */
export interface PortalRegistration {
  /** 容器元素 */
  container: HTMLElement;
  /** 要渲染的内容 */
  content: React.ReactNode;
  /** 唯一标识符 */
  id: string;
}

/**
 * Portal 管理器
 * 单例模式，用于在扩展和组件之间传递 Portal 信息
 */
class PortalManager {
  private portals: Map<string, PortalRegistration> = new Map();
  private listeners: Set<(portals: Map<string, PortalRegistration>) => void> =
    new Set();

  /**
   * 注册 Portal
   */
  register(id: string, container: HTMLElement, content: React.ReactNode) {
    this.portals.set(id, { container, content, id });
    this.notifyListeners();
  }

  /**
   * 注销 Portal
   */
  unregister(id: string) {
    this.portals.delete(id);
    this.notifyListeners();
  }

  /**
   * 更新 Portal 内容
   */
  updateContent(id: string, content: React.ReactNode) {
    const registration = this.portals.get(id);
    if (registration) {
      registration.content = content;
      this.notifyListeners();
    }
  }

  /**
   * 获取所有 Portal
   */
  getAll(): Map<string, PortalRegistration> {
    return new Map(this.portals);
  }

  /**
   * 添加监听器
   */
  addListener(listener: (portals: Map<string, PortalRegistration>) => void) {
    this.listeners.add(listener);
  }

  /**
   * 移除监听器
   */
  removeListener(listener: (portals: Map<string, PortalRegistration>) => void) {
    this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener(new Map(this.portals));
    });
  }
}

// 导出单例
export const portalManager = new PortalManager();
