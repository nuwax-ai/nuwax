import useGlobalSettings from '@/hooks/useGlobalSettings';
import {
  AppstoreOutlined,
  BulbOutlined,
  CodeOutlined,
  ExperimentOutlined,
  EyeOutlined,
  HeartOutlined,
  RocketOutlined,
  StarOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  List,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import React from 'react';
import { history } from 'umi';
import './index.less';

const { Title, Paragraph, Text } = Typography;

/**
 * 示例页面索引
 * 展示所有可用的示例和演示页面
 */
const ExamplesIndex: React.FC = () => {
  const { isChineseLanguage } = useGlobalSettings();

  // 示例列表数据
  const examples = [
    {
      id: 'antd-showcase',
      title: isChineseLanguage
        ? 'Ant Design 组件展示'
        : 'Ant Design Components Showcase',
      description: isChineseLanguage
        ? '全面展示 Ant Design 所有组件在不同主题和语言下的样式效果，包括按钮、表格、表单、导航等各类组件。'
        : 'Comprehensive showcase of all Ant Design components with different themes and languages, including buttons, tables, forms, navigation and more.',
      tags: [
        { text: isChineseLanguage ? '组件展示' : 'Components', color: 'blue' },
        {
          text: isChineseLanguage ? '主题切换' : 'Theme Switch',
          color: 'purple',
        },
        {
          text: isChineseLanguage ? '多语言' : 'Multi-language',
          color: 'green',
        },
      ],
      icon: <AppstoreOutlined />,
      path: '/examples/antd-showcase',
      featured: true,
    },
    {
      id: 'theme-demo',
      title: isChineseLanguage ? '主题功能演示' : 'Theme Demo',
      description: isChineseLanguage
        ? '演示主题切换和多语言功能的使用方法，展示如何在组件中集成全局设置。'
        : 'Demonstrate theme switching and multi-language functionality, showing how to integrate global settings in components.',
      tags: [
        { text: isChineseLanguage ? '主题' : 'Theme', color: 'orange' },
        { text: isChineseLanguage ? '演示' : 'Demo', color: 'cyan' },
      ],
      icon: <BulbOutlined />,
      path: '/examples/theme-demo',
      featured: false,
    },
  ];

  // 跳转到示例页面
  const navigateToExample = (path: string) => {
    if (path.startsWith('/examples/')) {
      // 对于 examples 下的页面，直接在当前窗口打开
      window.location.href = path;
    } else {
      // 对于其他页面，使用 history 跳转
      history.push(path);
    }
  };

  // 特色示例
  const featuredExamples = examples.filter((example) => example.featured);

  return (
    <div className="examples-index">
      {/* 页面标题 */}
      <div className="examples-header">
        <Title level={1}>
          <ExperimentOutlined
            style={{ marginRight: 16, color: 'var(--xagi-color-primary)' }}
          />
          {isChineseLanguage ? '示例展示中心' : 'Examples Showcase Center'}
        </Title>
        <Paragraph type="secondary">
          {isChineseLanguage
            ? '这里包含了各种功能演示和组件展示页面，帮助您了解项目的功能特性和使用方法。'
            : 'This contains various feature demonstrations and component showcase pages to help you understand the project features and usage.'}
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        {/* 特色示例 */}
        {featuredExamples.length > 0 && (
          <Col span={24}>
            <Card
              title={
                <Space>
                  <StarOutlined
                    style={{ color: 'var(--xagi-color-warning)' }}
                  />
                  {isChineseLanguage ? '特色示例' : 'Featured Examples'}
                </Space>
              }
              className="featured-section"
            >
              <Row gutter={[16, 16]}>
                {featuredExamples.map((example) => (
                  <Col xs={24} sm={24} md={12} lg={8} key={example.id}>
                    <Card
                      hoverable
                      className="example-card featured-card"
                      cover={
                        <div className="example-cover">
                          <div className="example-icon">{example.icon}</div>
                        </div>
                      }
                      actions={[
                        <Button
                          key="view"
                          type="primary"
                          icon={<EyeOutlined />}
                          onClick={() => navigateToExample(example.path)}
                        >
                          {isChineseLanguage ? '查看示例' : 'View Example'}
                        </Button>,
                      ]}
                    >
                      <Card.Meta
                        title={
                          <Space>
                            {example.title}
                            <Tag color="gold" style={{ marginLeft: 4 }}>
                              {isChineseLanguage ? '推荐' : 'Featured'}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <Paragraph ellipsis={{ rows: 3 }}>
                              {example.description}
                            </Paragraph>
                            <Space wrap style={{ marginTop: 8 }}>
                              {example.tags.map((tag, index) => (
                                <Tag key={index} color={tag.color}>
                                  {tag.text}
                                </Tag>
                              ))}
                            </Space>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        )}

        {/* 所有示例列表 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <CodeOutlined />
                {isChineseLanguage ? '所有示例' : 'All Examples'}
              </Space>
            }
          >
            <List
              itemLayout="vertical"
              dataSource={examples}
              renderItem={(example) => (
                <List.Item
                  key={example.id}
                  className="example-list-item"
                  actions={[
                    <Button
                      key="view"
                      type="primary"
                      icon={<EyeOutlined />}
                      onClick={() => navigateToExample(example.path)}
                    >
                      {isChineseLanguage ? '查看示例' : 'View Example'}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={64}
                        icon={example.icon}
                        style={{
                          backgroundColor: 'var(--xagi-color-primary)',
                          fontSize: 24,
                        }}
                      />
                    }
                    title={
                      <Space>
                        <Text strong style={{ fontSize: 18 }}>
                          {example.title}
                        </Text>
                        {example.featured && (
                          <Tag color="gold">
                            {isChineseLanguage ? '推荐' : 'Featured'}
                          </Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <Paragraph style={{ margin: '8px 0' }}>
                          {example.description}
                        </Paragraph>
                        <Space wrap>
                          {example.tags.map((tag, index) => (
                            <Tag key={index} color={tag.color}>
                              {tag.text}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 使用指南 */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <BulbOutlined />
                {isChineseLanguage ? '使用指南' : 'Usage Guide'}
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div className="guide-item">
                  <RocketOutlined
                    style={{
                      fontSize: 24,
                      color: 'var(--xagi-color-primary)',
                      marginBottom: 8,
                    }}
                  />
                  <Title level={4}>
                    {isChineseLanguage ? '快速开始' : 'Quick Start'}
                  </Title>
                  <Paragraph>
                    {isChineseLanguage
                      ? '选择您感兴趣的示例，点击"查看示例"按钮即可访问。每个示例都包含完整的代码实现和详细的功能说明。'
                      : 'Choose the example you are interested in and click the "View Example" button to access it. Each example includes complete code implementation and detailed feature descriptions.'}
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="guide-item">
                  <HeartOutlined
                    style={{
                      fontSize: 24,
                      color: 'var(--xagi-color-error)',
                      marginBottom: 8,
                    }}
                  />
                  <Title level={4}>
                    {isChineseLanguage ? '主题切换' : 'Theme Switching'}
                  </Title>
                  <Paragraph>
                    {isChineseLanguage
                      ? '使用右下角的设置按钮可以切换亮色/暗色主题和中英文语言，实时查看不同配置下的组件效果。'
                      : 'Use the settings button in the bottom right corner to switch between light/dark themes and Chinese/English languages to see component effects under different configurations.'}
                  </Paragraph>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ExamplesIndex;
