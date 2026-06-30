/**
 * 前端节点类型 ↔ 后端 NodeType 映射单测
 *
 * 模型：前端 AgentFlow 节点 = 后端类型 + 自己的扩展，nodeConfig 原样透传，仅翻转 type。
 *   RouteDecision    ↔ IntentRecognition
 *   HumanInteraction ↔ QA
 * - 出参：前端类型 → 后端类型。
 * - 入参：AgentFlow 下后端类型 → 前端类型（按 flow 上下文，不存标记字段）；
 *   Workflow 下保持后端类型不变。
 */

import { NodeTypeEnum } from '@/types/enums/common';
import { describe, expect, it } from 'vitest';
import {
  isFrontendMappedType,
  normalizeLoadedNode,
  normalizeLoadedNodes,
  serializeNodeForBackend,
  toBackendNodeType,
  type NormalizeDefaultsOpts,
} from '../nodeTypeMapping';

const AGENTFLOW = true;
const WORKFLOW = false;

describe('nodeTypeMapping', () => {
  describe('isFrontendMappedType', () => {
    it('RouteDecision / HumanInteraction 需要映射', () => {
      expect(isFrontendMappedType(NodeTypeEnum.RouteDecision)).toBe(true);
      expect(isFrontendMappedType(NodeTypeEnum.HumanInteraction)).toBe(true);
    });

    it('其它类型不需要映射', () => {
      expect(isFrontendMappedType(NodeTypeEnum.Agent)).toBe(false);
      expect(isFrontendMappedType(NodeTypeEnum.Workflow)).toBe(false);
      expect(isFrontendMappedType(NodeTypeEnum.QA)).toBe(false);
      expect(isFrontendMappedType(undefined)).toBe(false);
    });
  });

  describe('toBackendNodeType', () => {
    it('RouteDecision → IntentRecognition', () => {
      expect(toBackendNodeType(NodeTypeEnum.RouteDecision)).toBe(
        NodeTypeEnum.IntentRecognition,
      );
    });

    it('HumanInteraction → QA', () => {
      expect(toBackendNodeType(NodeTypeEnum.HumanInteraction)).toBe(
        NodeTypeEnum.QA,
      );
    });

    it('其它类型原样返回', () => {
      expect(toBackendNodeType(NodeTypeEnum.Agent)).toBe(NodeTypeEnum.Agent);
      expect(toBackendNodeType(NodeTypeEnum.Workflow)).toBe(
        NodeTypeEnum.Workflow,
      );
    });

    it('null/undefined 返回空串', () => {
      expect(toBackendNodeType(undefined)).toBe('');
      expect(toBackendNodeType(null)).toBe('');
    });
  });

  describe('serializeNodeForBackend (出参)', () => {
    it('RouteDecision 节点改写为 IntentRecognition，保留 nodeConfig', () => {
      const out = serializeNodeForBackend({
        type: NodeTypeEnum.RouteDecision,
        nodeConfig: { intentConfigs: [], extraPrompt: 'sys' },
      });
      expect(out.type).toBe(NodeTypeEnum.IntentRecognition);
      expect(out.nodeConfig.extraPrompt).toBe('sys');
    });

    it('HumanInteraction 节点改写为 QA，保留 nodeConfig', () => {
      const out = serializeNodeForBackend({
        type: NodeTypeEnum.HumanInteraction,
        nodeConfig: { hitlMode: 'ask', askConfig: { question: 'q' } },
      });
      expect(out.type).toBe(NodeTypeEnum.QA);
      expect(out.nodeConfig.hitlMode).toBe('ask');
      expect(out.nodeConfig.askConfig.question).toBe('q');
    });

    it('非映射节点不变（保持引用相等）', () => {
      const node = { type: NodeTypeEnum.Agent, nodeConfig: {} };
      expect(serializeNodeForBackend(node)).toBe(node);
    });
  });

  describe('normalizeLoadedNode (入参·按 flow 上下文)', () => {
    it('AgentFlow：IntentRecognition → RouteDecision', () => {
      const node = { type: NodeTypeEnum.IntentRecognition, nodeConfig: {} };
      expect(normalizeLoadedNode(node, AGENTFLOW).type).toBe(
        NodeTypeEnum.RouteDecision,
      );
    });

    it('AgentFlow：QA → HumanInteraction', () => {
      const node = {
        type: NodeTypeEnum.QA,
        nodeConfig: { hitlMode: 'ask', askConfig: { question: 'q' } },
      };
      const out = normalizeLoadedNode(node, AGENTFLOW);
      expect(out.type).toBe(NodeTypeEnum.HumanInteraction);
      // nodeConfig 原样保留
      expect(out.nodeConfig.hitlMode).toBe('ask');
    });

    it('Workflow：IntentRecognition / QA 保持不变', () => {
      const intent = {
        type: NodeTypeEnum.IntentRecognition,
        nodeConfig: { intentConfigs: [{ intent: 'x', uuid: 'u' }] },
      };
      expect(normalizeLoadedNode(intent, WORKFLOW).type).toBe(
        NodeTypeEnum.IntentRecognition,
      );
      const qa = {
        type: NodeTypeEnum.QA,
        nodeConfig: { answerType: 'SELECT' },
      };
      expect(normalizeLoadedNode(qa, WORKFLOW).type).toBe(NodeTypeEnum.QA);
    });

    it('非映射后端类型在任何 flow 下都不变', () => {
      const agent = { type: NodeTypeEnum.Agent, nodeConfig: {} };
      expect(normalizeLoadedNode(agent, AGENTFLOW).type).toBe(
        NodeTypeEnum.Agent,
      );
      const start = { type: NodeTypeEnum.Start, nodeConfig: {} };
      expect(normalizeLoadedNode(start, AGENTFLOW).type).toBe(
        NodeTypeEnum.Start,
      );
    });
  });

  describe('normalizeLoadedNodes (批量)', () => {
    it('AgentFlow：IntentRecognition/QA 分别还原为 RouteDecision/HumanInteraction', () => {
      const out = normalizeLoadedNodes(
        [
          { type: NodeTypeEnum.Start, nodeConfig: {} },
          { type: NodeTypeEnum.IntentRecognition, nodeConfig: {} },
          { type: NodeTypeEnum.QA, nodeConfig: {} },
          { type: NodeTypeEnum.Agent, nodeConfig: {} },
        ],
        AGENTFLOW,
      );
      expect(out.map((n) => n.type)).toEqual([
        NodeTypeEnum.Start,
        NodeTypeEnum.RouteDecision,
        NodeTypeEnum.HumanInteraction,
        NodeTypeEnum.Agent,
      ]);
    });

    it('Workflow：IntentRecognition / QA 全部保持', () => {
      const out = normalizeLoadedNodes(
        [
          { type: NodeTypeEnum.IntentRecognition, nodeConfig: {} },
          { type: NodeTypeEnum.QA, nodeConfig: {} },
        ],
        WORKFLOW,
      );
      expect(out.map((n) => n.type)).toEqual([
        NodeTypeEnum.IntentRecognition,
        NodeTypeEnum.QA,
      ]);
    });

    it('null/undefined 入参返回空数组', () => {
      expect(normalizeLoadedNodes(null, AGENTFLOW)).toEqual([]);
      expect(normalizeLoadedNodes(undefined, WORKFLOW)).toEqual([]);
    });
  });

  describe('遗留默认文案修正 (defaults)', () => {
    const defaults: NormalizeDefaultsOpts = {
      [NodeTypeEnum.IntentRecognition]: {
        frontendDefaultName: '路由决策',
        frontendDefaultDescription: 'AI 决策走哪条分支',
        backendDefaultName: '意图识别',
        backendDefaultDescription: '意图识别描述',
      },
      [NodeTypeEnum.QA]: {
        frontendDefaultName: '询问用户',
        frontendDefaultDescription: '向用户提问并获取回复',
        backendDefaultName: '问答',
        backendDefaultDescription: '问答描述',
      },
    };

    it('AgentFlow：意图识别默认文案 → 路由决策默认文案', () => {
      const node = {
        type: NodeTypeEnum.IntentRecognition,
        name: '意图识别',
        description: '意图识别描述',
      };
      const out = normalizeLoadedNode(node, AGENTFLOW, defaults);
      expect(out.type).toBe(NodeTypeEnum.RouteDecision);
      expect(out.name).toBe('路由决策');
      expect(out.description).toBe('AI 决策走哪条分支');
    });

    it('AgentFlow：问答默认文案 → 询问用户默认文案', () => {
      const node = {
        type: NodeTypeEnum.QA,
        name: '问答',
        description: '问答描述',
      };
      const out = normalizeLoadedNode(node, AGENTFLOW, defaults);
      expect(out.type).toBe(NodeTypeEnum.HumanInteraction);
      expect(out.name).toBe('询问用户');
      expect(out.description).toBe('向用户提问并获取回复');
    });

    it('AgentFlow：空名 → 前端默认名', () => {
      const intent = { type: NodeTypeEnum.IntentRecognition, name: '' };
      expect(normalizeLoadedNode(intent, AGENTFLOW, defaults).name).toBe(
        '路由决策',
      );
      const qa = { type: NodeTypeEnum.QA, name: '' };
      expect(normalizeLoadedNode(qa, AGENTFLOW, defaults).name).toBe(
        '询问用户',
      );
    });

    it('AgentFlow：用户自定义名/描述不被覆盖', () => {
      const node = {
        type: NodeTypeEnum.QA,
        name: '我的提问',
        description: '自定义说明',
      };
      const out = normalizeLoadedNode(node, AGENTFLOW, defaults);
      expect(out.name).toBe('我的提问');
      expect(out.description).toBe('自定义说明');
    });

    it('不传 defaults 时只改 type，不动文案', () => {
      const node = {
        type: NodeTypeEnum.QA,
        name: '问答',
        description: '问答描述',
      };
      const out = normalizeLoadedNode(node, AGENTFLOW);
      expect(out.type).toBe(NodeTypeEnum.HumanInteraction);
      expect(out.name).toBe('问答');
      expect(out.description).toBe('问答描述');
    });
  });

  describe('往返一致性', () => {
    it('RouteDecision: 出参序列化 → AgentFlow 入参还原 → 类型一致', () => {
      const local = {
        type: NodeTypeEnum.RouteDecision,
        nodeConfig: { extraPrompt: 'sys', intentConfigs: [] },
      };
      const backend = serializeNodeForBackend(local); // 保存到后端
      expect(backend.type).toBe(NodeTypeEnum.IntentRecognition);
      const reloaded = normalizeLoadedNode(backend, AGENTFLOW); // AgentFlow 加载
      expect(reloaded.type).toBe(NodeTypeEnum.RouteDecision);
      expect(reloaded.nodeConfig.extraPrompt).toBe('sys');
    });

    it('HumanInteraction: 出参序列化 → AgentFlow 入参还原 → 类型一致', () => {
      const local = {
        type: NodeTypeEnum.HumanInteraction,
        nodeConfig: { hitlMode: 'ask', askConfig: { question: '订单号?' } },
      };
      const backend = serializeNodeForBackend(local); // 保存到后端
      expect(backend.type).toBe(NodeTypeEnum.QA);
      const reloaded = normalizeLoadedNode(backend, AGENTFLOW); // AgentFlow 加载
      expect(reloaded.type).toBe(NodeTypeEnum.HumanInteraction);
      expect(reloaded.nodeConfig.askConfig.question).toBe('订单号?');
    });
  });
});
