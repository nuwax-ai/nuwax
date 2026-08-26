/**
 * 会话密度设置（Cursor 式 Conversation Density，agent-session-rendering-plan P1-6）：
 * compact / normal / detailed 三档控制工具调用与过程内容在会话里的默认折叠密度。
 * 偏好持久化 localStorage；变更派发全局事件供会话渲染层即时生效。
 */

export type ConversationDensity = 'compact' | 'normal' | 'detailed';

export const CONVERSATION_DENSITY_STORAGE_KEY = 'conversation_density';
export const CONVERSATION_DENSITY_EVENT = 'conversation-density-changed';

/** 密度 → 折叠策略（纯函数，单测覆盖） */
export interface DensityCollapsePolicy {
  /** 流式进行中工具组是否默认收起（compact：只看状态行不看过程） */
  collapseDuringStreaming: boolean;
  /** 终态是否执行「执行过程」聚合（detailed：不聚合，保持逐组+正文平铺） */
  terminalAggregate: boolean;
  /** 终态折叠区默认收起 */
  collapseTerminal: boolean;
  /** 「被超越自动收起」是否启用（detailed：恒展开，禁用 autoCollapse 动画） */
  autoCollapseEnabled: boolean;
}

const POLICIES: Record<ConversationDensity, DensityCollapsePolicy> = {
  compact: {
    collapseDuringStreaming: true,
    terminalAggregate: true,
    collapseTerminal: true,
    autoCollapseEnabled: true,
  },
  normal: {
    collapseDuringStreaming: false,
    terminalAggregate: true,
    collapseTerminal: true,
    autoCollapseEnabled: true,
  },
  detailed: {
    collapseDuringStreaming: false,
    terminalAggregate: false,
    collapseTerminal: false,
    autoCollapseEnabled: false,
  },
};

const isDensity = (value: unknown): value is ConversationDensity =>
  value === 'compact' || value === 'normal' || value === 'detailed';

export const resolveDensityPolicy = (
  density: ConversationDensity,
): DensityCollapsePolicy => POLICIES[density] ?? POLICIES.normal;

export const loadConversationDensity = (): ConversationDensity => {
  try {
    const raw = localStorage.getItem(CONVERSATION_DENSITY_STORAGE_KEY);
    return isDensity(raw) ? raw : 'normal';
  } catch {
    return 'normal';
  }
};

export const saveConversationDensity = (density: ConversationDensity): void => {
  try {
    localStorage.setItem(CONVERSATION_DENSITY_STORAGE_KEY, density);
  } catch {
    // ignore: localStorage 不可用，降级为仅本次会话生效
  }
  window.dispatchEvent(
    new CustomEvent(CONVERSATION_DENSITY_EVENT, { detail: { density } }),
  );
};
