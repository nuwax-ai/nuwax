/**
 * AgentIntervention 组件示例页
 *
 * 功能：独立展示 ACP 权限审批卡片与 MCP Ask 结构化提问卡片的 UI 与交互（Mock 数据，不依赖后端）。
 * 访问：/examples/agent-intervention-demo
 * 模块文档：src/components/business-component/AgentIntervention/README.md
 */
import AcpPermissionCard from '@/components/business-component/AgentIntervention/components/AcpPermissionCard';
import McpAskQuestionCard from '@/components/business-component/AgentIntervention/components/McpAskQuestionCard';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
} from '@/components/business-component/AgentIntervention/types/acpIntervention';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '@/components/business-component/AgentIntervention/types/mcpAskIntervention';
import { Button, Card, Divider, message, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { Link } from 'umi';
import { createAcpDemoList, createMcpDemoList } from './mockData';

const { Title, Paragraph } = Typography;

const AgentInterventionDemoPage: React.FC = () => {
  const [acpList, setAcpList] = useState(createAcpDemoList);
  const [mcpList, setMcpList] = useState(createMcpDemoList);

  const handleAcpRespond = (
    interaction: AcpPermissionInteraction,
    response: AcpRequestPermissionResponse,
  ) => {
    console.log('[ACP Respond]', interaction.intervention.id, response);
    const id = interaction.intervention.id;

    setAcpList((prev) =>
      prev.map((item) =>
        item.intervention.id === id
          ? { ...item, responseStatus: 'submitting' as const }
          : item,
      ),
    );

    setTimeout(() => {
      setAcpList((prev) =>
        prev.map((item) =>
          item.intervention.id === id
            ? { ...item, responseStatus: 'submitted' as const }
            : item,
        ),
      );
      const kind = response.outcome.outcome === 'selected' ? '批准' : '取消';
      message.success(
        `已${kind}: ${interaction.intervention.acp.request.toolCall.title}`,
      );
    }, 1000);
  };

  const handleMcpRespond = (
    interaction: McpAskInteraction,
    payload: McpAskRespondPayload,
  ) => {
    console.log('[MCP Respond]', interaction.toolCallId, payload);
    const id = interaction.toolCallId;

    setMcpList((prev) =>
      prev.map((item) => {
        if (item.toolCallId !== id) return item;
        let status: McpAskInteraction['responseStatus'] = 'submitted';
        if (payload.action === 'cancel') status = 'cancelled';
        if (payload.action === 'skip') status = 'skipped';
        return { ...item, responseStatus: status, formData: payload.formData };
      }),
    );
    message.info(`${interaction.input.title}: ${payload.action}`);
  };

  const resetAll = () => {
    setAcpList(createAcpDemoList(true));
    setMcpList(createMcpDemoList());
    message.success('已重置所有状态');
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px' }}>
      <Paragraph type="secondary" style={{ marginBottom: 8 }}>
        <Link to="/examples">← 返回示例中心</Link>
      </Paragraph>
      <Title level={2}>干预交互卡片 Demo</Title>
      <Paragraph type="secondary">
        此页面用于展示 ACP Permission 权限审批和 MCP Ask
        结构化提问卡片的渲染效果。路由：/examples/agent-intervention-demo
      </Paragraph>

      <Space style={{ marginBottom: 24 }}>
        <Button type="primary" onClick={resetAll}>
          重置所有状态
        </Button>
      </Space>

      <Divider orientation="left">
        <Title level={4} style={{ margin: 0 }}>
          ACP Permission 权限审批卡片
        </Title>
      </Divider>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {acpList.map((acp) => (
          <Card key={acp.intervention.id} size="small">
            <AcpPermissionCard
              interaction={acp}
              docked={true}
              keyboardShortcutsEnabled={false}
              onRespond={(response) => handleAcpRespond(acp, response)}
            />
          </Card>
        ))}
      </Space>

      <Divider orientation="left">
        <Title level={4} style={{ margin: 0 }}>
          MCP Ask 结构化提问卡片
        </Title>
      </Divider>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {mcpList.map((mcp) => (
          <Card key={mcp.toolCallId} size="small">
            <McpAskQuestionCard
              interaction={mcp}
              keyboardShortcutsEnabled={false}
              onRespond={(payload) => handleMcpRespond(mcp, payload)}
            />
          </Card>
        ))}
      </Space>
    </div>
  );
};

export default AgentInterventionDemoPage;
