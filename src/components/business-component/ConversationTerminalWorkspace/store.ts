import type { ConversationBottomConsoleProps } from '../ConversationBottomConsole';

export interface ConversationTerminalWorkspaceProps
  extends Pick<
    ConversationBottomConsoleProps,
    | 'visible'
    | 'wsUrl'
    | 'conversationId'
    | 'className'
    | 'wireProtocol'
    | 'wsSubprotocols'
    | 'defaultActiveTab'
    | 'defaultLayoutMode'
    | 'expandSignal'
    | 'collapseSignal'
    | 'onLayoutModeChange'
    | 'onActiveTabChange'
    | 'showLogsTab'
  > {
  workspaceConversationId: number;
  sandboxId: string;
}

export interface TerminalWorkspaceEntry {
  key: string;
  conversationId: number;
  container: HTMLDivElement;
  owner: symbol | null;
  props: ConversationTerminalWorkspaceProps;
}

/** 只保存本次登录内的终端资源；与会话任务终态、页面 LRU 分开。 */
class ConversationTerminalStore {
  private entries = new Map<number, TerminalWorkspaceEntry>();
  private listeners = new Set<() => void>();
  private snapshot: TerminalWorkspaceEntry[] = [];
  private generation = 0;

  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private emit() {
    this.snapshot = [...this.entries.values()];
    this.listeners.forEach((listener) => listener());
  }

  attach(
    props: ConversationTerminalWorkspaceProps,
    mount: HTMLElement,
    owner: symbol,
  ) {
    const id = props.workspaceConversationId;
    let entry = this.entries.get(id);
    // 同一会话切换沙箱或终端业务目录，不得继续使用旧 shell。
    if (
      entry &&
      (entry.props.sandboxId !== props.sandboxId ||
        entry.props.wsUrl !== props.wsUrl)
    ) {
      entry.container.remove();
      this.entries.delete(id);
      entry = undefined;
    }
    if (!entry) {
      entry = {
        key: `${id}:${++this.generation}`,
        conversationId: id,
        container: document.createElement('div'),
        owner,
        props,
      };
      entry.container.style.display = 'contents';
      this.entries.set(id, entry);
    }
    entry.owner = owner;
    entry.props = props;
    mount.appendChild(entry.container);
    this.emit();
  }

  update(id: number, owner: symbol, props: ConversationTerminalWorkspaceProps) {
    const entry = this.entries.get(id);
    if (entry?.owner !== owner) return;
    entry.props = props;
    this.emit();
  }

  detach(id: number, owner: symbol) {
    const entry = this.entries.get(id);
    if (entry?.owner !== owner) return;
    entry.owner = null;
    entry.container.remove();
    // 不保留已卸载页面的回调，也不在后台打开新 shell；已有连接仍由宿主管理。
    entry.props = {
      ...entry.props,
      visible: false,
      onLayoutModeChange: undefined,
      onActiveTabChange: undefined,
    };
    this.emit();
  }

  remove(id: number) {
    this.entries.get(id)?.container.remove();
    this.entries.delete(id);
    this.emit();
  }

  clear = () => {
    this.entries.forEach((entry) => entry.container.remove());
    this.entries.clear();
    this.emit();
  };
}

export const conversationTerminalStore = new ConversationTerminalStore();
