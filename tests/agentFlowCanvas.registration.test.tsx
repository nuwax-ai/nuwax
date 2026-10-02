import type { BranchNodeHandler } from '@/pages/Antv-X6/v3/extensions/types';
import { NodeTypeEnum } from '@/types/enums/common';
import { cleanup, render } from '@testing-library/react';
import { StrictMode, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/base', () => ({ SvgIcon: () => <span /> }));
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));

type HandlerSnapshot = {
  route: BranchNodeHandler | undefined;
  human: BranchNodeHandler | undefined;
};

const renderSnapshots: HandlerSnapshot[] = [];
const effectSnapshots: HandlerSnapshot[] = [];

beforeEach(() => {
  // 重建 registry 和 register 模块，避免既有用例的全局注册掩盖首次渲染时序。
  vi.resetModules();
  renderSnapshots.length = 0;
  effectSnapshots.length = 0;
  // doMock 每次重新绑定同一轮的 registry，避免 mock factory 持有旧模块单例。
  vi.doMock('@/pages/Antv-X6/v3/indexV3', async () => {
    const { extensionRegistry } = await import(
      '@/pages/Antv-X6/v3/extensions/registry'
    );
    const snapshot = (): HandlerSnapshot => ({
      route: extensionRegistry.get(NodeTypeEnum.RouteDecision),
      human: extensionRegistry.get(NodeTypeEnum.HumanInteraction),
    });
    return {
      default: function WorkflowV3FirstRenderProbe() {
        renderSnapshots.push(snapshot());
        useEffect(() => {
          effectSnapshots.push(snapshot());
        }, []);
        return <div data-testid="workflow-first-render" />;
      },
    };
  });
});

afterEach(() => {
  cleanup();
  vi.doUnmock('@/pages/Antv-X6/v3/indexV3');
  vi.resetModules();
});

describe('AgentFlowCanvas 首次注册', () => {
  it('首次子组件 render 和 effect 已可读取 Route/Human handler', async () => {
    const { extensionRegistry } = await import(
      '@/pages/Antv-X6/v3/extensions/registry'
    );
    expect(extensionRegistry.get(NodeTypeEnum.RouteDecision)).toBeUndefined();
    expect(
      extensionRegistry.get(NodeTypeEnum.HumanInteraction),
    ).toBeUndefined();

    const { default: AgentFlowCanvas } = await import(
      '@/pages/EditAgent/AgentFlowCanvas'
    );
    render(
      <StrictMode>
        <AgentFlowCanvas workflowId={1} spaceId={2} />
      </StrictMode>,
    );

    expect(renderSnapshots.length).toBeGreaterThan(0);
    expect(effectSnapshots.length).toBeGreaterThan(0);
    const route = extensionRegistry.get(NodeTypeEnum.RouteDecision);
    const human = extensionRegistry.get(NodeTypeEnum.HumanInteraction);
    expect(route?.generateEdges).toBeTypeOf('function');
    expect(human?.generateEdges).toBeTypeOf('function');
    // 即使 StrictMode 复用与重放 render/effect，每个观察点都必须已注册。
    for (const observed of [...renderSnapshots, ...effectSnapshots]) {
      expect(observed.route).toBe(route);
      expect(observed.human).toBe(human);
    }
  });
});
