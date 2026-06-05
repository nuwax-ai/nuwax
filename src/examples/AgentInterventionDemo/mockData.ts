/**
 * AgentIntervention 示例页 Mock 数据工厂
 */
import type { AcpPermissionInteraction } from '@/components/business-component/AgentIntervention/types/acpIntervention';
import type { McpAskInteraction } from '@/components/business-component/AgentIntervention/types/mcpAskIntervention';

/** 创建 ACP 权限审批 Mock 交互数据 */
export function createAcpInteraction(
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

/** 文件编辑类 ACP 权限场景 */
function createAcpFileEditInteraction(
  interventionId: string,
  toolCallId: string,
): AcpPermissionInteraction {
  const base = createAcpInteraction();
  return {
    ...base,
    intervention: {
      ...base.intervention,
      id: interventionId,
      acp: {
        method: 'session/request_permission',
        request: {
          sessionId: 'sess-demo',
          toolCall: {
            toolCallId,
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
  };
}

/** 示例页初始 / 重置用的 ACP 列表 */
export function createAcpDemoList(reset = false): AcpPermissionInteraction[] {
  const stamp = reset ? `-${Date.now()}` : '';
  return [
    createAcpInteraction(),
    createAcpFileEditInteraction(
      reset ? `itv-reset${stamp}` : 'itv-file-edit',
      reset ? `tc-reset${stamp}` : 'tc-file-edit',
    ),
  ];
}

/** 创建 MCP Ask 结构化提问 Mock 交互数据 */
export function createMcpInteraction(
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

/** Wizard 分步表单场景 */
function createMcpWizardInteraction(): McpAskInteraction {
  const stamp = Date.now();
  return {
    toolCallId: `tc-ask-wizard-${stamp}`,
    responseStatus: 'pending',
    input: {
      toolName: 'nuwax_ask_question',
      schemaVersion: 'nuwaclaw.mcp_ask.v1',
      requestId: `ask-wizard-${stamp}`,
      revision: 1,
      sessionId: 'sess-demo',
      title: '项目初始化向导',
      description: '请按步骤填写项目配置信息。',
      ui: {
        version: 'nuwaclaw.interaction.v1',
        presentation: 'wizard',
        title: '项目初始化向导',
        description: '请按步骤填写项目配置信息。',
        schema: {
          type: 'object',
          properties: {
            projectName: { type: 'string', title: '项目名称' },
            description: {
              type: 'string',
              title: '项目描述',
              maxLength: 500,
            },
            framework: {
              type: 'string',
              title: '前端框架',
              enum: ['react', 'vue', 'angular', 'svelte'],
            },
            features: {
              type: 'array',
              title: '功能模块',
              items: {
                type: 'string',
                enum: ['auth', 'api', 'database', 'testing', 'ci'],
              },
            },
            deployTarget: {
              type: 'string',
              title: '部署目标',
              enum: ['vercel', 'netlify', 'docker', 'aws', 'gcp'],
            },
            notes: { type: 'string', title: '备注' },
          },
          required: ['projectName', 'framework', 'deployTarget'],
        },
        uiSchema: {
          description: { 'ui:widget': 'textarea' },
          framework: {
            'ui:widget': 'list',
            'ui:options': {
              enumNames: ['React', 'Vue', 'Angular', 'Svelte'],
            },
          },
          features: {
            'ui:widget': 'checkboxes',
            'ui:options': {
              enumNames: [
                '用户认证',
                'API 接口',
                '数据库',
                '自动化测试',
                'CI/CD',
              ],
            },
          },
          deployTarget: {
            'ui:widget': 'list',
            'ui:options': {
              enumNames: ['Vercel', 'Netlify', 'Docker', 'AWS', 'GCP'],
            },
          },
          notes: { 'ui:widget': 'textarea' },
        },
        steps: [
          {
            id: 'basic',
            title: '基本信息',
            description: '填写项目名称和描述',
            fields: ['projectName', 'description'],
          },
          {
            id: 'tech',
            title: '技术选型',
            description: '选择框架和功能模块',
            fields: ['framework', 'features'],
          },
          {
            id: 'deploy',
            title: '部署配置',
            description: '选择部署目标和备注',
            fields: ['deployTarget', 'notes'],
          },
        ],
        submitLabel: '完成配置',
        cancelLabel: '取消',
        nextStepLabel: '下一步',
        prevStepLabel: '上一步',
      },
    },
  };
}

/** 示例页初始 / 重置用的 MCP 列表 */
export function createMcpDemoList(): McpAskInteraction[] {
  return [
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
    createMcpInteraction(
      '选择技术栈',
      {
        framework: {
          type: 'string',
          title: '前端框架',
          enum: [
            'react',
            'vue',
            'angular',
            'svelte',
            'solid',
            'preact',
            'qwik',
            'astro',
          ],
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
            enumNames: [
              'React',
              'Vue',
              'Angular',
              'Svelte',
              'SolidJS',
              'Preact',
              'Qwik',
              'Astro',
            ],
          },
        },
        language: {
          'ui:widget': 'list',
          'ui:options': {
            enumNames: [
              'TypeScript',
              'JavaScript',
              'Python',
              'Go',
              'Rust',
              'Java',
            ],
          },
        },
      },
      '请选择项目使用的主要技术栈。',
    ),
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
        screenshot: {
          'ui:widget': 'file',
          'ui:options': { accept: 'image/*' },
        },
        attachments: { 'ui:widget': 'file', 'ui:options': { multiple: true } },
      },
      '请上传问题的截图或相关文件，帮助 Agent 更好地理解问题。',
    ),
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
    createMcpWizardInteraction(),
  ];
}
