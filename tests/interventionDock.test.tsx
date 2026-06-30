/**
 * Intervention DockPanel 交互逻辑测试（功能维度）
 *
 * 覆盖 ask/question 与权限审批卡片在 DockPanel 中的展示与交互规则：
 * - 单个 intervention 渲染与提交分发
 * - 多个 intervention 堆叠：front 可交互，其余 aria-hidden（一次只处理一个）
 * - FIFO 顺序：最早（sortKey 最小）在 front，先处理
 * - front 提交移除后，下一个顶上
 */
import DockPanel from '@/components/business-component/AgentIntervention/AgentInterventionChatLayer/DockPanel';
import type { InterventionQueueItem } from '@/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// mock 具体卡片为极简按钮，聚焦 DockPanel 的堆叠/分发逻辑
vi.mock(
  '@/components/business-component/AgentIntervention/AcpPermissionCard',
  () => ({
    default: ({ interaction, onRespond }: any) => (
      <button
        type="button"
        data-testid="acp-card"
        onClick={() =>
          onRespond({ outcome: { outcome: 'selected', optionId: 'allow' } })
        }
      >
        acp-{interaction.intervention.id}
      </button>
    ),
  }),
);

vi.mock(
  '@/components/business-component/AgentIntervention/McpAskQuestionCard',
  () => ({
    default: ({ interaction, onRespond }: any) => (
      <button
        type="button"
        data-testid="mcp-card"
        onClick={() => onRespond({ action: 'submit', formData: { x: 1 } })}
      >
        ask-{interaction.input.requestId}
      </button>
    ),
  }),
);

// vitest 不会把 .less 当作 CSS modules 处理，mock 成 className 代理
vi.mock(
  '@/components/business-component/AgentIntervention/AgentInterventionChatLayer/DockPanel.less',
  () => ({
    default: new Proxy({}, { get: () => 'cls' }),
  }),
);
vi.mock(
  '@/components/business-component/AgentIntervention/AgentInterventionChatLayer/intervention-dock-card.module.less',
  () => ({
    default: new Proxy({}, { get: () => 'cls' }),
  }),
);

const acp = (id: string, sortKey = 0): InterventionQueueItem =>
  ({
    kind: 'acp_permission',
    interaction: { intervention: { id }, responseStatus: 'pending' },
    sortKey,
  } as any);

const ask = (id: string, sortKey = 0): InterventionQueueItem =>
  ({
    kind: 'mcp_ask',
    interaction: { input: { requestId: id }, responseStatus: 'pending' },
    sortKey,
  } as any);

describe('intervention DockPanel 交互', () => {
  it('单个权限审批：渲染卡片，提交后回调 onRespondAcpPermission', () => {
    const onRespondAcp = vi.fn();
    render(
      <DockPanel
        items={[acp('itv-1')]}
        onRespondAcpPermission={onRespondAcp}
        onRespondMcpAsk={vi.fn()}
      />,
    );
    const card = screen.getByTestId('acp-card');
    expect(card.textContent).toBe('acp-itv-1');
    fireEvent.click(card);
    expect(onRespondAcp).toHaveBeenCalledWith(
      expect.objectContaining({ intervention: { id: 'itv-1' } }),
      { outcome: { outcome: 'selected', optionId: 'allow' } },
    );
  });

  it('单个 ask/question：渲染卡片，提交后回调 onRespondMcpAsk', () => {
    const onRespondMcpAsk = vi.fn();
    render(
      <DockPanel
        items={[ask('ask-1')]}
        onRespondAcpPermission={vi.fn()}
        onRespondMcpAsk={onRespondMcpAsk}
      />,
    );
    fireEvent.click(screen.getByTestId('mcp-card'));
    expect(onRespondMcpAsk).toHaveBeenCalledWith(
      expect.objectContaining({ input: { requestId: 'ask-1' } }),
      { action: 'submit', formData: { x: 1 } },
    );
  });

  it('多个 intervention 堆叠：front 可交互，其余 aria-hidden（一次只处理一个）', () => {
    const { container } = render(
      <DockPanel
        items={[acp('a1', 1), ask('k1', 2), acp('a2', 3)]}
        onRespondAcpPermission={vi.fn()}
        onRespondMcpAsk={vi.fn()}
      />,
    );
    // stackBadge 显示 stackDepth - 1（front 之外的待处理数量）
    expect(screen.getByText('2')).toBeInTheDocument();
    // 三张卡片都渲染
    expect(screen.getAllByTestId('acp-card')).toHaveLength(2);
    expect(screen.getAllByTestId('mcp-card')).toHaveLength(1);
    // 非 front 的堆叠层 aria-hidden（至少 items.length-1 = 2 个）
    const hiddenLayers = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenLayers.length).toBeGreaterThanOrEqual(2);
  });

  it('FIFO 顺序：最早（sortKey 最小）在 front，先被处理', () => {
    const onRespondAcp = vi.fn();
    // sortKey: a1=1（最早）, a2=3（较晚）→ a1 在 front
    render(
      <DockPanel
        items={[acp('a1', 1), acp('a2', 3)]}
        onRespondAcpPermission={onRespondAcp}
        onRespondMcpAsk={vi.fn()}
      />,
    );
    const cards = screen.getAllByTestId('acp-card');
    // cards[0] 是 front（最早 a1）
    fireEvent.click(cards[0]);
    expect(onRespondAcp).toHaveBeenCalledWith(
      expect.objectContaining({ intervention: { id: 'a1' } }),
      expect.anything(),
    );
  });

  it('front 提交移除后，下一个自动顶上成为新 front', () => {
    const onRespondAcp = vi.fn();
    const { rerender } = render(
      <DockPanel
        items={[acp('a1', 1), acp('a2', 3)]}
        onRespondAcpPermission={onRespondAcp}
        onRespondMcpAsk={vi.fn()}
      />,
    );
    // 模拟 front（a1）被处理 → useActiveInterventionQueue 重新计算后只剩 a2
    rerender(
      <DockPanel
        items={[acp('a2', 3)]}
        onRespondAcpPermission={onRespondAcp}
        onRespondMcpAsk={vi.fn()}
      />,
    );
    const cards = screen.getAllByTestId('acp-card');
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toBe('acp-a2');
  });

  it('审批与 ask 混合时，front 提交按类型分发到正确回调', () => {
    const onRespondAcp = vi.fn();
    const onRespondMcpAsk = vi.fn();
    // sortKey: acp=1, ask=5 → FIFO front = acp
    render(
      <DockPanel
        items={[acp('a1', 1), ask('k1', 5)]}
        onRespondAcpPermission={onRespondAcp}
        onRespondMcpAsk={onRespondMcpAsk}
      />,
    );
    // front 是 acp（sortKey 1 最小），点击应触发 onRespondAcp
    fireEvent.click(screen.getByTestId('acp-card'));
    expect(onRespondAcp).toHaveBeenCalled();
    expect(onRespondMcpAsk).not.toHaveBeenCalled();
  });

  it('无 intervention 时不渲染', () => {
    const { container } = render(
      <DockPanel
        items={[]}
        onRespondAcpPermission={vi.fn()}
        onRespondMcpAsk={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
