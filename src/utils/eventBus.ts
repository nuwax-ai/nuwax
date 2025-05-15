type EventHandler = (payload: any) => void;

class EventBus {
  private events: Record<string, EventHandler[]> = {};

  // 订阅事件
  on(event: string, handler: EventHandler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
  }

  // 取消订阅
  off(event: string, handler: EventHandler) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((h) => h !== handler);
  }

  // 发布事件
  emit(event: string, payload?: any) {
    if (!this.events[event]) return;
    this.events[event].forEach((handler) => handler(payload));
  }
}

const eventBus = new EventBus();
export default eventBus;
