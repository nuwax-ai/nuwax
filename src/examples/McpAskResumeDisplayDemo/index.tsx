/**
 * MCP Ask resume 用户消息展示 — 文件/图片类型验证 Demo
 *
 * 验证 parseMcpAskResumeDisplayContent / McpAskResumeUserDisplay 对各类 URL 的渲染行为。
 * 访问：/examples/mcp-ask-resume-display-demo
 */
import { McpAskResumeUserDisplay } from '@/components/business-component/AgentIntervention';
import {
  isRemoteFileUrl,
  isRemoteImageUrl,
  parseMcpAskResumeDisplayContent,
} from '@/components/business-component/AgentIntervention/utils/mcpAskResumeMessage';
import {
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { Link } from 'umi';
import styles from './index.less';
import {
  COMBINED_RESUME_MESSAGE,
  EXTENSIONLESS_CASES,
  SINGLE_TYPE_CASES,
  SUPPORTED_IMAGE_EXTENSIONS,
  UNSUPPORTED_FILE_EXTENSIONS,
  buildResumeMessageForCase,
  type ResumeDisplayCase,
} from './mockResumeMessages';

const cx = classNames.bind(styles);
const { Title, Paragraph, Text } = Typography;

interface CaseRow extends ResumeDisplayCase {
  resumeText: string;
  isImageUrl: boolean;
  parsedKind: string;
  renderMode: string;
}

function resolveRenderMode(caseItem: ResumeDisplayCase): string {
  const parsed = parseMcpAskResumeDisplayContent(
    buildResumeMessageForCase(caseItem),
  );
  if (parsed.kind !== 'resume' || !parsed.fields?.length) {
    return 'plain';
  }
  const field = parsed.fields[0];
  if (field.imageUrls?.length) {
    return 'inline-image';
  }
  if (field.fileUrls?.length) {
    return 'inline-document';
  }
  return 'text';
}

const McpAskResumeDisplayDemo: React.FC = () => {
  const tableRows = useMemo<CaseRow[]>(() => {
    return [...SINGLE_TYPE_CASES, ...EXTENSIONLESS_CASES].map((caseItem) => {
      const resumeText = buildResumeMessageForCase(caseItem);
      const parsed = parseMcpAskResumeDisplayContent(resumeText);
      return {
        ...caseItem,
        resumeText,
        isImageUrl: isRemoteImageUrl(caseItem.url),
        parsedKind: parsed.kind,
        renderMode: resolveRenderMode(caseItem),
      };
    });
  }, []);

  const columns: ColumnsType<CaseRow> = [
    {
      title: '扩展名',
      dataIndex: 'extension',
      width: 88,
      render: (ext: string) => <Text code>{ext}</Text>,
    },
    {
      title: 'isRemoteImageUrl',
      dataIndex: 'isImageUrl',
      width: 130,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{String(value)}</Tag>
      ),
    },
    {
      title: '期望',
      dataIndex: 'expectedKind',
      width: 88,
      render: (kind: string) => (
        <Tag color={kind === 'image' ? 'blue' : 'orange'}>{kind}</Tag>
      ),
    },
    {
      title: '实际 renderMode',
      dataIndex: 'renderMode',
      width: 120,
      render: (mode: string, record) => {
        const matched =
          (record.expectedKind === 'image' && mode === 'inline-image') ||
          (record.expectedKind === 'document' && mode === 'inline-document');
        return <Tag color={matched ? 'success' : 'error'}>{mode}</Tag>;
      },
    },
    {
      title: '说明',
      dataIndex: 'note',
      ellipsis: true,
      render: (note?: string) => note ?? '—',
    },
  ];

  return (
    <div className={cx(styles['demo-wrap'])}>
      <Link to="/examples">← 返回示例索引</Link>
      <Title level={3} className={cx(styles['demo-title'])}>
        MCP Ask Resume 文件/图片展示 Demo
      </Title>
      <Paragraph type="secondary" className={cx(styles['demo-desc'])}>
        对照 <Text code>McpAskResumeUserDisplay</Text>{' '}
        与解析函数，确认哪些扩展名会渲染为 62×62
        内联缩略图，哪些以附件卡片展示（可点击打开/下载）。
      </Paragraph>

      <Card size="small" className={cx(styles.legend)} title="规则摘要">
        <Space wrap>
          <Tag color="blue">
            支持缩略图：{SUPPORTED_IMAGE_EXTENSIONS.join(' / ')}
          </Tag>
          <Tag color="orange">
            附件卡片：{UNSUPPORTED_FILE_EXTENSIONS.join(' / ')} 等
          </Tag>
          <Tag color="purple">
            /api/f/ 受保护 URL 需 Bearer 拉取（见 ResumeAuthImage）
          </Tag>
          <Tag color="cyan">无后缀 URL：兜底未知附件卡片</Tag>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="综合用例（单条 resume 多字段）" size="small">
            <Paragraph type="secondary" style={{ marginBottom: 12 }}>
              一条消息内同时包含多图、非图片 URL 与普通文本字段。
            </Paragraph>
            <div className={cx(styles.bubble, styles['bubble-combined'])}>
              <McpAskResumeUserDisplay text={COMBINED_RESUME_MESSAGE} />
            </div>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="类型对照表" size="small">
            <Table<CaseRow>
              className={cx(styles['meta-table'])}
              size="small"
              rowKey="id"
              pagination={false}
              columns={columns}
              dataSource={tableRows}
              scroll={{ x: 720 }}
            />
          </Card>
        </Col>

        {SINGLE_TYPE_CASES.concat(EXTENSIONLESS_CASES).map((caseItem) => {
          const resumeText = buildResumeMessageForCase(caseItem);
          const parsed = parseMcpAskResumeDisplayContent(resumeText);
          const renderMode = resolveRenderMode(caseItem);
          const matched =
            (caseItem.expectedKind === 'image' &&
              renderMode === 'inline-image') ||
            (caseItem.expectedKind === 'document' &&
              renderMode === 'inline-document');

          return (
            <Col xs={24} sm={12} lg={8} key={caseItem.id}>
              <Card
                size="small"
                className={cx(styles['case-card'])}
                title={
                  <Space>
                    <Text code>{caseItem.extension}</Text>
                    <Tag color={matched ? 'success' : 'error'}>
                      {renderMode}
                    </Tag>
                  </Space>
                }
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="字段">
                    {caseItem.fieldLabel}
                  </Descriptions.Item>
                  <Descriptions.Item label="isRemoteFileUrl">
                    {String(isRemoteFileUrl(caseItem.url))}
                  </Descriptions.Item>
                  <Descriptions.Item label="parse.kind">
                    {parsed.kind}
                  </Descriptions.Item>
                </Descriptions>
                <div className={cx(styles.bubble, styles['case-bubble'])}>
                  <McpAskResumeUserDisplay text={resumeText} />
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Paragraph type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
        相关模块：{' '}
        <Link to="/examples/mcp-ask-duplicate-demo">MCP Ask 重复询问 Demo</Link>
        {' · '}
        <Link to="/examples/agent-intervention-demo">Agent 干预卡片 Demo</Link>
      </Paragraph>
    </div>
  );
};

export default McpAskResumeDisplayDemo;
