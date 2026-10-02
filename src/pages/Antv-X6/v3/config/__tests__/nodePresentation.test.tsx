import { FlowKindEnum, NodeTypeEnum } from '@/types/enums/common';
import type { ChildNode } from '@/types/interfaces/graph';
import type { FormInstance } from 'antd';
import { isValidElement, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import AgentFlowNodes from '../../agentFlow/forms';
import ComplexNode from '../../component/complexNode';
import NodeItem from '../../component/nodeItem';
import {
  NODE_TYPES_WITH_CUSTOM_ICON,
  renderNodeIcon,
  resolveNodeIconUrl,
  returnBackgroundColor,
  returnImg,
} from '../../utils/workflowV3';
import { getNodeComponent } from '../NodeRegistry';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
  t: (key: string) => key,
}));
vi.mock('@/constants/images.constants', () => ({
  ICON_WORKFLOW_AGENT: 'svg-agent',
  ICON_WORKFLOW_ROUTE_DECISION: 'svg-route',
  ICON_WORKFLOW_HUMAN_ASK: 'svg-human',
  ICON_WORKFLOW_WORKFLOW: 'svg-workflow',
  ICON_WORKFLOW_QA: 'svg-qa',
}));
vi.mock('../../utils/graphV3', () => ({
  adjustParentSize: vi.fn(),
  generatePortGroupConfig: vi.fn(),
  showExceptionHandle: vi.fn(),
  showExceptionPort: vi.fn(),
}));
vi.mock('../../extensions/registry', () => ({
  extensionRegistry: { get: vi.fn() },
}));
vi.mock('../../agentFlow/forms', () => ({
  default: {
    AgentFlowStartNode: () => 'agentflow-start',
    AgentFlowEndNode: () => 'agentflow-end',
    AgentFlowWorkflowNode: () => 'agentflow-workflow',
    AgentNode: () => 'agentflow-agent',
    HumanInteractionNode: () => 'agentflow-human',
    RouteDecisionNode: () => 'agentflow-route',
  },
}));
vi.mock('../../component/nodeItem', () => ({
  default: {
    StartNode: () => 'workflow-start',
    EndNode: () => 'workflow-end',
  },
}));
vi.mock('../../component/complexNode', () => ({
  default: {
    ModelNode: () => 'workflow-model',
    QuestionsNode: () => 'workflow-qa',
  },
}));
vi.mock('../../component/condition', () => ({ default: () => 'condition' }));
vi.mock('../../component/database', () => ({ default: () => 'database' }));
vi.mock('../../component/knowledgeInsert', () => ({
  default: () => 'knowledge-insert',
}));
vi.mock('../../component/library', () => ({
  default: { KnowledgeNode: () => 'knowledge' },
}));
vi.mock('../../component/pluginNode', () => ({
  default: { PluginInNode: () => 'plugin' },
}));

describe('node presentation', () => {
  it.each([
    [NodeTypeEnum.Agent, 'svg-agent', '#E8F5E9'],
    [NodeTypeEnum.RouteDecision, 'svg-route', '#FFF3E0'],
    [NodeTypeEnum.HumanInteraction, 'svg-human', '#E3F2FD'],
    [NodeTypeEnum.Workflow, 'svg-workflow', '#D0FFDB'],
    [NodeTypeEnum.QA, 'svg-qa', '#fef9eb'],
  ])('%s 保留本地图标与背景色', (type, icon, color) => {
    const element = returnImg(type as NodeTypeEnum) as ReactElement;
    expect(isValidElement(element)).toBe(true);
    expect(element.type).toBe(icon);
    expect(returnBackgroundColor(type as NodeTypeEnum)).toBe(color);
  });

  it('未知历史节点仍回退智能体 SVG 与默认背景色', () => {
    const type = 'LegacyUnknown' as NodeTypeEnum;
    expect((returnImg(type) as ReactElement).type).toBe('svg-agent');
    expect(returnBackgroundColor(type)).toBe('#EEEEFF');
  });

  it('只有 Agent/Workflow/Plugin 支持自定义 URL，其余仍使用本地图标', () => {
    expect(NODE_TYPES_WITH_CUSTOM_ICON).toEqual([
      NodeTypeEnum.Agent,
      NodeTypeEnum.Workflow,
      NodeTypeEnum.Plugin,
    ]);
    const icon = renderNodeIcon(
      NodeTypeEnum.Agent,
      ' https://example.com/a.svg ',
    ) as ReactElement;
    expect(icon.type).toBe('img');
    expect(icon.props.src).toBe('https://example.com/a.svg');
    expect(resolveNodeIconUrl(NodeTypeEnum.Agent, ' ')).toBeNull();
    expect(
      resolveNodeIconUrl(
        NodeTypeEnum.RouteDecision,
        'https://example.com/a.svg',
      ),
    ).toBeNull();
    expect(
      (
        renderNodeIcon(
          NodeTypeEnum.RouteDecision,
          'https://example.com/a.svg',
        ) as ReactElement
      ).type,
    ).toBe('svg-route');
  });
});

const node = (type: NodeTypeEnum) =>
  ({
    type,
    id: 1,
    nodeConfig: { extension: { x: 0, y: 0 } },
  } as ChildNode);
const form = {} as FormInstance;

describe('node panel selection', () => {
  it.each([
    [NodeTypeEnum.Start, AgentFlowNodes.AgentFlowStartNode],
    [NodeTypeEnum.End, AgentFlowNodes.AgentFlowEndNode],
    [NodeTypeEnum.Output, AgentFlowNodes.AgentFlowEndNode],
    [NodeTypeEnum.Workflow, AgentFlowNodes.AgentFlowWorkflowNode],
    [NodeTypeEnum.Agent, AgentFlowNodes.AgentNode],
    [NodeTypeEnum.RouteDecision, AgentFlowNodes.RouteDecisionNode],
    [NodeTypeEnum.HumanInteraction, AgentFlowNodes.HumanInteractionNode],
  ])('AgentFlow %s 按现有 map 选用属性面板并传递配置', (type, component) => {
    const params = node(type as NodeTypeEnum);
    const panel = getNodeComponent(
      params,
      form,
      FlowKindEnum.AgentFlow,
    ) as ReactElement;
    expect(panel.type).toBe(component);
    expect(panel.props).toMatchObject({
      type,
      id: 1,
      form,
      nodeConfig: params.nodeConfig,
    });
  });

  it('AgentFlow 中无独立面板时继续回退通用面板', () => {
    const panel = getNodeComponent(
      node(NodeTypeEnum.LLM),
      form,
      FlowKindEnum.AgentFlow,
    ) as ReactElement;
    expect(panel.type).toBe(ComplexNode.ModelNode);
  });

  it('Workflow 和缺省 flowKind 保持通用面板', () => {
    expect(
      (
        getNodeComponent(
          node(NodeTypeEnum.Start),
          form,
          FlowKindEnum.Workflow,
        ) as ReactElement
      ).type,
    ).toBe(NodeItem.StartNode);
    expect(
      (getNodeComponent(node(NodeTypeEnum.Start), form) as ReactElement).type,
    ).toBe(NodeItem.StartNode);
  });

  it('未注册的历史类型继续返回空内容', () => {
    const panel = getNodeComponent(
      node('LegacyUnknown' as NodeTypeEnum),
      form,
      FlowKindEnum.AgentFlow,
    ) as ReactElement;
    expect(panel.props.children).toBeUndefined();
  });
});
