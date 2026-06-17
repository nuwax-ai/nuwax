/**
 * 简单的事件发布订阅工具
 * 用于组件间解耦通信
 */

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param callback 回调函数
   */
  on(eventName: string, callback: EventCallback): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)!.push(callback);
  }

  /**
   * 取消订阅事件
   * @param eventName 事件名称
   * @param callback 回调函数
   */
  off(eventName: string, callback: EventCallback): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 发布事件
   * @param eventName 事件名称
   * @param args 参数
   */
  emit(eventName: string, ...args: any[]): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Event callback error for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * 清除指定事件的所有监听器
   * @param eventName 事件名称
   */
  clearEvent(eventName: string): void {
    this.events.delete(eventName);
  }
}

// 创建全局事件总线实例
const eventBus = new EventBus();

export default eventBus;

// 定义常用的事件名称常量
export const EVENT_NAMES = {
  // 发送聊天消息事件
  SEND_CHAT_MESSAGE: 'send_chat_message',
  // 清空聊天输入框事件
  CLEAR_CHAT_INPUT: 'clear_chat_input',
} as const;
