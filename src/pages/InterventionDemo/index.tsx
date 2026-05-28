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

const { Title, Text, Paragraph } = Typography;

// ============================================================
// Mock Data Factories
// ============================================================

function createAcpInteraction(
  overrides: Partial<AcpPermissionInteraction> = {},
): AcpPermissionInteraction {
  return {
    intervention: {
      id: `itv-${Date.now()}`,
      revision: 1,
      kind: 'approval',
      status: 'pending',
      sessionId: 'sess-demo',
      source: 'acp_permission',
      engine: 'claude-code',
      protocol: 'acp',
      callbackTarget: { kind: 'electron', targetId: 'demo-target' },
      schemaRef: 'acp/permission/v1',
      acp: {
        method: 'session/request_permission',
        request: {
          sessionId: 'sess-demo',
          toolCall: {
            toolCallId: 'tc-demo',
            title: '执行 bash 命令: npm install',
            kind: 'execute',
          },
          options: [
            { optionId: 'opt-1', kind: 'allow_once', name: '允许一次' },
            { optionId: 'opt-2', kind: 'allow_always', name: '始终允许' },
            { optionId: 'opt-3', kind: 'reject_once', name: '拒绝一次' },
            { optionId: 'opt-4', kind: 'reject_always', name: '始终拒绝' },
          ],
        },
      },
      createdAt: Date.now(),
    },
    responseStatus: 'pending',
    ...overrides,
  };
}

function createMcpInteraction(
  title: string,
  schema: Record<string, unknown>,
  uiSchema?: Record<string, unknown>,
  description?: string,
): McpAskInteraction {
  return {
    toolCallId: `tc-ask-${Date.now()}`,
    responseStatus: 'pending',
    input: {
      toolName: 'nuwax_ask_question',
      schemaVersion: 'nuwaclaw.mcp_ask.v1',
      requestId: `ask-${Date.now()}`,
      revision: 1,
      sessionId: 'sess-demo',
      title,
      description,
      ui: {
        version: 'nuwaclaw.interaction.v1',
        presentation: 'inline',
        title,
        description,
        schema: {
          type: 'object',
          properties: schema,
          required: Object.keys(schema).slice(0, 1),
        },
        uiSchema,
        submitLabel: '提交',
        cancelLabel: '取消',
      },
    },
  };
}

// ============================================================
// Demo Page
// ============================================================

const InterventionDemoPage: React.FC = () => {
  const [acpList, setAcpList] = useState<AcpPermissionInteraction[]>([
    createAcpInteraction(),
    createAcpInteraction({
      intervention: {
        ...createAcpInteraction().intervention,
        id: 'itv-file-edit',
        acp: {
          method: 'session/request_permission',
          request: {
            sessionId: 'sess-demo',
            toolCall: {
              toolCallId: 'tc-file-edit',
              title: '编辑文件 src/utils/upload.ts',
              kind: 'edit',
            },
            options: [
              { optionId: 'opt-a', kind: 'allow_once', name: '允许一次' },
              { optionId: 'opt-r', kind: 'reject_once', name: '拒绝' },
            ],
          },
        },
      },
    }),
  ]);

  const [mcpList, setMcpList] = useState<McpAskInteraction[]>([
    // 基本表单: radio + text + textarea
    createMcpInteraction(
      '请选择继续方式',
      {
        choice: {
          type: 'string',
          title: '选项',
          enum: ['deploy', 'test', 'cancel'],
        },
        notes: { type: 'string', title: '补充说明' },
        checks: {
          type: 'array',
          title: '检查项',
          items: { type: 'string', enum: ['lint', 'unit', 'e2e'] },
        },
      },
      {
        choice: {
          'ui:widget': 'radio',
          'ui:options': { enumNames: ['直接部署', '先跑测试', '取消任务'] },
        },
        notes: { 'ui:widget': 'textarea' },
        checks: {
          'ui:widget': 'checkboxes',
          'ui:options': { enumNames: ['代码检查', '单元测试', '端到端测试'] },
        },
      },
      'Agent 需要你确认下一步操作。',
    ),
    // 单选列表 (list widget)
    createMcpInteraction(
      '选择技术栈',
      {
        framework: {
          type: 'string',
          title: '前端框架',
          enum: ['react', 'vue', 'angular', 'svelte', 'solid', 'preact', 'qwik', 'astro'],
        },
        language: {
          type: 'string',
          title: '编程语言',
          enum: ['typescript', 'javascript', 'python', 'go', 'rust', 'java'],
        },
      },
      {
        framework: {
          'ui:widget': 'list',
          'ui:options': {
            enumNames: ['React', 'Vue', 'Angular', 'Svelte', 'SolidJS', 'Preact', 'Qwik', 'Astro'],
          },
        },
        language: {
          'ui:widget': 'list',
          'ui:options': {
            enumNames: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java'],
          },
        },
      },
      '请选择项目使用的主要技术栈。',
    ),
    // 文件上传
    createMcpInteraction(
      '提交问题截图',
      {
        description: { type: 'string', title: '问题描述', maxLength: 500 },
        screenshot: { type: 'string', title: '截图', format: 'data-url' },
        attachments: {
          type: 'array',
          title: '相关附件',
          items: { type: 'string', format: 'data-url' },
        },
      },
      {
        description: { 'ui:widget': 'textarea' },
        screenshot: { 'ui:widget': 'file', 'ui:options': { accept: 'image/*' } },
        attachments: { 'ui:widget': 'file', 'ui:options': { multiple: true } },
      },
      '请上传问题的截图或相关文件，帮助 Agent 更好地理解问题。',
    ),
    // Select 下拉
    createMcpInteraction(
      '部署配置',
      {
        environment: {
          type: 'string',
          title: '部署环境',
          enum: ['dev', 'staging', 'production'],
        },
        region: {
          type: 'string',
          title: '服务区域',
          enum: ['cn-east', 'cn-north', 'us-west', 'eu-central'],
        },
      },
      {
        environment: {
          'ui:widget': 'select',
          'ui:options': { enumNames: ['开发环境', '预发布环境', '生产环境'] },
        },
        region: {
          'ui:widget': 'select',
          'ui:options': { enumNames: ['华东', '华北', '美西', '欧洲中部'] },
        },
      },
      '请选择部署目标环境和区域。',
    ),
  ]);

  const handleAcpRespond = (
    interaction: AcpPermissionInteraction,
    response: AcpRequestPermissionResponse,
  ) => {
    console.log('[ACP Respond]', interaction.intervention.id, response);
    const id = interaction.intervention.id;

    // Update to submitting
    setAcpList((prev) =>
      prev.map((item) =>
        item.intervention.id === id
          ? { ...item, responseStatus: 'submitting' as const }
          : item,
      ),
    );

    // Simulate API delay
    setTimeout(() => {
      setAcpList((prev) =>
        prev.map((item) =>
          item.intervention.id === id
            ? { ...item, responseStatus: 'submitted' as const }
            : item,
        ),
      );
      const kind = response.outcome.outcome === 'selected' ? '批准' : '取消';
      message.success(`已${kind}: ${interaction.intervention.acp.request.toolCall.title}`);
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
    setAcpList([
      createAcpInteraction(),
      createAcpInteraction({
        intervention: {
          ...createAcpInteraction().intervention,
          id: `itv-reset-${Date.now()}`,
          acp: {
            method: 'session/request_permission',
            request: {
              sessionId: 'sess-demo',
              toolCall: {
                toolCallId: `tc-reset-${Date.now()}`,
                title: '编辑文件 src/utils/upload.ts',
                kind: 'edit',
              },
              options: [
                { optionId: 'opt-a', kind: 'allow_once', name: '允许一次' },
                { optionId: 'opt-r', kind: 'reject_once', name: '拒绝' },
              ],
            },
          },
        },
      }),
    ]);
    setMcpList((prev) => prev.map((item) => ({ ...item, responseStatus: 'pending', formData: undefined })));
    message.success('已重置所有状态');
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px' }}>
      <Title level={2}>干预交互卡片 Demo</Title>
      <Paragraph type="secondary">
        此页面用于展示 ACP Permission 权限审批和 MCP Ask 结构化提问卡片的渲染效果。
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

export default InterventionDemoPage;
