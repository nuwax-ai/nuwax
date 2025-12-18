import VncPreview from '@/components/business-component/VncPreview';
import {
  Breadcrumb,
  Card,
  Col,
  Layout,
  Row,
  Space,
  Switch,
  Typography,
} from 'antd';
import React, { useState } from 'react';

const { Title, Paragraph, Text } = Typography;
const { Content } = Layout;

/**
 * VncPreview 示例
 *
 * 此示例演示了如何使用 VncPreview 组件
 * 配合测试服务器 URL 和会话详情进行集成。
 */
const VncPreviewDemo: React.FC = () => {
  const [readOnly, setReadOnly] = useState(false);

  // 测试配置
  const config = {
    serviceUrl: 'https://testagent.xspaceagi.com',
    userId: '5',
    projectId: '123',
    autoConnect: true,
  };

  return (
    <Layout
      style={{ padding: '24px', minHeight: '100vh', background: '#f0f2f5' }}
    >
      <Content>
        <Breadcrumb style={{ marginBottom: '16px' }}>
          <Breadcrumb.Item href="/examples">示例中心</Breadcrumb.Item>
          <Breadcrumb.Item>VNC 远程桌面演示</Breadcrumb.Item>
        </Breadcrumb>

        <Card>
          <div style={{ marginBottom: 24 }}>
            <Title level={2}>VNC 远程桌面演示</Title>
            <Paragraph>
              此演示展示了 <code>VncPreview</code>{' '}
              业务组件。它使用以下参数连接到远程 VNC 会话：
            </Paragraph>
            <Row gutter={24}>
              <Col span={12}>
                <ul>
                  <li>
                    <strong>服务地址:</strong> {config.serviceUrl}
                  </li>
                  <li>
                    <strong>用户 ID:</strong> {config.userId}
                  </li>
                  <li>
                    <strong>会话 ID (项目 ID):</strong> {config.projectId}
                  </li>
                  <li>
                    <strong>自动连接:</strong> 已启用
                  </li>
                </ul>
              </Col>
              <Col span={12}>
                <Space
                  direction="vertical"
                  style={{
                    background: '#fafafa',
                    padding: 16,
                    borderRadius: 8,
                    width: '100%',
                  }}
                >
                  <Text strong>控制选项</Text>
                  <Space>
                    <span>只读模式 (View Only):</span>
                    <Switch
                      checked={readOnly}
                      onChange={(checked) => setReadOnly(checked)}
                    />
                  </Space>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    修改此选项将自动刷新 VNC 连接。
                  </Text>
                </Space>
              </Col>
            </Row>
            <Paragraph type="secondary">
              组件会自动为 VNC 地址添加 <code>autoconnect=true</code> 和{' '}
              <code>resize=scale</code> 参数。
            </Paragraph>
          </div>

          <div
            style={{
              height: '600px',
              border: '1px solid #d9d9d9',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <VncPreview
              serviceUrl={config.serviceUrl}
              userId={config.userId}
              projectId={config.projectId}
              autoConnect={config.autoConnect}
              readOnly={readOnly}
            />
          </div>
        </Card>
      </Content>
    </Layout>
  );
};

export default VncPreviewDemo;
