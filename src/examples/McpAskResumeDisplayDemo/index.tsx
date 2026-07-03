/**
 * MCP Ask resume 用户消息展示 Demo
 *
 * 验证 resume 消息与普通用户消息一样渲染：strip requestId 标记 + message.attachments。
 * 访问：/examples/mcp-ask-resume-display-demo
 */
import AttachFile from '@/components/ChatView/AttachFile';
import { stripMcpAskResumeDisplayArtifacts } from '@/components/business-component/AgentIntervention/utils/mcpAskResumeMessage';
import { Card, Space, Typography } from 'antd';
import React from 'react';
import { Link } from 'umi';
import styles from './index.less';
import { COMBINED_RESUME_MESSAGE } from './mockResumeMessages';

const { Title, Paragraph, Text } = Typography;

const MOCK_ATTACHMENTS = [
  {
    fileKey: 'k1',
    fileUrl: 'https://cdn.example.com/a.png',
    fileName: 'a.png',
    mimeType: 'image/png',
  },
  {
    fileKey: 'k2',
    fileUrl: 'https://cdn.example.com/b.pdf',
    fileName: 'b.pdf',
    mimeType: 'application/pdf',
  },
];

const McpAskResumeDisplayDemo: React.FC = () => {
  const displayText = stripMcpAskResumeDisplayArtifacts(
    COMBINED_RESUME_MESSAGE,
  );

  return (
    <div className={styles.page}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Link to="/examples/mcp-ask-duplicate-demo">
            ← MCP Ask 重复询问 Demo
          </Link>
        </div>
        <Title level={3}>MCP Ask Resume 普通消息渲染</Title>
        <Paragraph type="secondary">
          无特殊解析：正文仅去掉内部 requestId 标记；附件走{' '}
          <Text code>message.attachments</Text> + <Text code>AttachFile</Text>。
        </Paragraph>
        <Card title="用户消息预览">
          <AttachFile files={MOCK_ATTACHMENTS} />
          <pre className={styles.previewText}>{displayText}</pre>
        </Card>
      </Space>
    </div>
  );
};

export default McpAskResumeDisplayDemo;
