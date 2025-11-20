/*
 * Tiptap Variable Input Component Test Example
 * Tiptap 变量输入组件测试示例
 */

import {
  CodeOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  List,
  Row,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useState } from 'react';
import TiptapVariableInput from '../../components/TiptapVariableInput';
import type { MentionItem } from '../../components/TiptapVariableInput/types';
import {
  type PromptVariable,
  VariableType,
} from '../../components/VariableInferenceInput/types';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const TiptapVariableInputTestExample: React.FC = () => {
  // 基础状态
  const [promptValue, setPromptValue] = useState('');
  const [selectedVariables, setSelectedVariables] = useState<
    Array<{ variable: PromptVariable; path: string }>
  >([]);
  const [readonly, setReadonly] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // 测试变量数据（复用 VariableRefTest 的数据）
  const testVariables: PromptVariable[] = [
    {
      key: 'user',
      type: VariableType.Object,
      name: '用户信息',
      description: '当前登录用户的基本信息',
      children: [
        {
          key: 'id',
          type: VariableType.String,
          name: '用户ID',
          description: '用户的唯一标识符',
        },
        {
          key: 'name',
          type: VariableType.String,
          name: '用户名',
          description: '用户的真实姓名',
        },
        {
          key: 'email',
          type: VariableType.String,
          name: '邮箱',
          description: '用户邮箱地址',
        },
        {
          key: 'phone',
          type: VariableType.String,
          name: '手机号',
          description: '用户手机号码',
        },
        {
          key: 'age',
          type: VariableType.Integer,
          name: '年龄',
          description: '用户年龄',
        },
        {
          key: 'isActive',
          type: VariableType.Boolean,
          name: '是否激活',
          description: '账户是否激活',
        },
        {
          key: 'balance',
          type: VariableType.Number,
          name: '账户余额',
          description: '用户账户余额',
        },
        {
          key: 'profile',
          type: VariableType.Object,
          name: '个人资料',
          description: '用户详细资料',
          children: [
            {
              key: 'avatar',
              type: VariableType.String,
              name: '头像',
              description: '用户头像URL',
            },
            {
              key: 'bio',
              type: VariableType.String,
              name: '个人简介',
              description: '用户个人简介',
            },
            {
              key: 'preferences',
              type: VariableType.Object,
              name: '偏好设置',
              children: [
                {
                  key: 'language',
                  type: VariableType.String,
                  name: '语言',
                  description: '用户首选语言',
                },
                {
                  key: 'theme',
                  type: VariableType.String,
                  name: '主题',
                  description: '界面主题',
                },
                {
                  key: 'timezone',
                  type: VariableType.String,
                  name: '时区',
                  description: '用户时区',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'cart',
      type: VariableType.Array,
      name: '购物车',
      description: '用户购物车商品列表',
      children: [
        {
          key: 'productId',
          type: VariableType.String,
          name: '商品ID',
        },
        {
          key: 'name',
          type: VariableType.String,
          name: '商品名称',
        },
        {
          key: 'price',
          type: VariableType.Number,
          name: '价格',
        },
        {
          key: 'quantity',
          type: VariableType.Integer,
          name: '数量',
        },
        {
          key: 'category',
          type: VariableType.String,
          name: '分类',
        },
      ],
    },
    {
      key: 'order',
      type: VariableType.Object,
      name: '订单信息',
      description: '当前订单信息',
      children: [
        {
          key: 'id',
          type: VariableType.String,
          name: '订单号',
        },
        {
          key: 'status',
          type: VariableType.String,
          name: '订单状态',
        },
        {
          key: 'total',
          type: VariableType.Number,
          name: '订单总额',
        },
        {
          key: 'currency',
          type: VariableType.String,
          name: '货币',
        },
        {
          key: 'createdAt',
          type: VariableType.String,
          name: '创建时间',
        },
        {
          key: 'items',
          type: VariableType.ArrayObject,
          name: '订单项',
          children: [
            {
              key: 'name',
              type: VariableType.String,
              name: '商品名称',
            },
            {
              key: 'price',
              type: VariableType.Number,
              name: '价格',
            },
          ],
        },
      ],
    },
    {
      key: 'system',
      type: VariableType.Object,
      name: '系统信息',
      description: '系统和环境信息',
      children: [
        {
          key: 'timestamp',
          type: VariableType.String,
          name: '时间戳',
        },
        {
          key: 'version',
          type: VariableType.String,
          name: '系统版本',
        },
        {
          key: 'environment',
          type: VariableType.String,
          name: '环境',
        },
      ],
    },
  ];

  // 测试工具数据
  const testSkills = [
    {
      typeId: 'web_search_tool',
      id: 'tool_001',
      name: 'Web Search',
      toolName: '网页搜索',
      description: '在互联网上搜索信息',
      category: 'search',
    },
    {
      typeId: 'calculator_tool',
      id: 'tool_002',
      name: 'Calculator',
      toolName: '计算器',
      description: '执行数学计算',
      category: 'math',
    },
    {
      typeId: 'weather_tool',
      id: 'tool_003',
      name: 'Weather Forecast',
      toolName: '天气预报',
      description: '获取天气信息',
      category: 'info',
    },
    {
      typeId: 'translator_tool',
      id: 'tool_004',
      name: 'Translator',
      toolName: '翻译工具',
      description: '翻译多种语言',
      category: 'language',
    },
    {
      typeId: 'image_generator',
      id: 'tool_005',
      name: 'Image Generator',
      toolName: '图像生成器',
      description: '根据描述生成图像',
      category: 'creative',
    },
  ];

  // 测试 Mentions 数据
  const testMentions: MentionItem[] = [
    {
      id: 'user_001',
      label: '张三',
      type: 'user',
    },
    {
      id: 'user_002',
      label: '李四',
      type: 'user',
    },
    {
      id: 'user_003',
      label: '王五',
      type: 'user',
    },
    {
      id: 'file_001',
      label: '项目文档.md',
      type: 'file',
    },
    {
      id: 'file_002',
      label: 'README.md',
      type: 'file',
    },
    {
      id: 'datasource_001',
      label: '用户数据库',
      type: 'datasource',
    },
    {
      id: 'datasource_002',
      label: '订单数据库',
      type: 'datasource',
    },
  ];

  // 处理变量选择
  const handleVariableSelect = useCallback(
    (variable: PromptVariable, path: string) => {
      setSelectedVariables((prev) => [...prev, { variable, path }]);
    },
    [],
  );

  // 清空内容
  const handleClear = useCallback(() => {
    setPromptValue('');
    setSelectedVariables([]);
  }, []);

  // 插入预设文本
  const insertPresetText = useCallback((text: string) => {
    setPromptValue((prev) => prev + text);
  }, []);

  const tabItems = [
    {
      key: 'test',
      label: '功能测试',
      icon: <SettingOutlined />,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="组件配置" size="small">
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Text>只读模式：</Text>
                  <Switch
                    checked={readonly}
                    onChange={setReadonly}
                    size="small"
                  />
                </Col>
                <Col span={6}>
                  <Text>禁用状态：</Text>
                  <Switch
                    checked={disabled}
                    onChange={setDisabled}
                    size="small"
                  />
                </Col>
                <Col span={12}>
                  <Space>
                    <Button size="small" onClick={handleClear}>
                      清空
                    </Button>
                    <Button
                      size="small"
                      onClick={() =>
                        insertPresetText(
                          '<p>您好，<variable data-key="user.name" data-label="user.name" data-is-tool="false">user.name</variable>！</p>',
                        )
                      }
                    >
                      插入示例
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="组件测试区域" size="small">
              <Space
                direction="vertical"
                style={{ width: '100%', marginBottom: 16 }}
              >
                <Alert
                  message="使用说明"
                  description={
                    <div>
                      <p>
                        • 输入 <Text code>@</Text> 触发 Mentions 自动补全
                      </p>
                      <p>
                        • 输入 <Text code>{`{`}</Text> 触发变量自动补全
                      </p>
                      <p>• 使用键盘上下箭头选择，Enter 确认，Esc 取消</p>
                    </div>
                  }
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Button
                  onClick={() =>
                    console.log('Debug: current variables', testVariables)
                  }
                >
                  调试：输出变量数据
                </Button>
                <Button
                  onClick={() =>
                    console.log('Debug: current mentions', testMentions)
                  }
                >
                  调试：输出 Mentions 数据
                </Button>
                <Button
                  onClick={() =>
                    console.log('Debug: current prompt value', promptValue)
                  }
                >
                  调试：输出当前值
                </Button>
              </Space>
              <div
                style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  minHeight: '200px',
                }}
              >
                <TiptapVariableInput
                  variables={testVariables}
                  skills={testSkills}
                  mentions={testMentions}
                  value={promptValue}
                  onChange={setPromptValue}
                  onVariableSelect={handleVariableSelect}
                  readonly={readonly}
                  disabled={disabled}
                  placeholder="输入 @ 或 { 开始使用"
                />
              </div>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="实时预览" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>当前 HTML 值：</Text>
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '4px',
                      marginTop: '8px',
                      fontFamily: 'Monaco, Menlo, monospace',
                      fontSize: '12px',
                      maxHeight: '150px',
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {promptValue || '（空）'}
                  </pre>
                </div>

                <div>
                  <Text strong>渲染预览：</Text>
                  <div
                    style={{
                      background: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '4px',
                      marginTop: '8px',
                      minHeight: '50px',
                      border: '1px solid #d9d9d9',
                    }}
                    dangerouslySetInnerHTML={{ __html: promptValue }}
                  />
                </div>

                <div>
                  <Text strong>选择的变量：</Text>
                  <div style={{ marginTop: '8px' }}>
                    {selectedVariables.length > 0 ? (
                      selectedVariables.map((item, index) => (
                        <Tag
                          key={index}
                          color="success"
                          style={{ marginBottom: '4px' }}
                        >
                          {item.path} - {item.variable.name}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">无变量选择</Text>
                    )}
                  </div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'examples',
      label: '使用示例',
      icon: <CodeOutlined />,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="Mentions 示例" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>@<mention data-id="user_001" data-label="张三" data-type="user">张三</mention> 你好！</p>',
                    )
                  }
                >
                  用户 Mention: @张三
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>请查看 <mention data-id="file_001" data-label="项目文档.md" data-type="file">项目文档.md</mention></p>',
                    )
                  }
                >
                  文件 Mention: @项目文档.md
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>连接 <mention data-id="datasource_001" data-label="用户数据库" data-type="datasource">用户数据库</mention></p>',
                    )
                  }
                >
                  数据源 Mention: @用户数据库
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="变量示例" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>您好，<variable data-key="user.name" data-label="user.name" data-is-tool="false">user.name</variable>！</p>',
                    )
                  }
                >
                  基础变量：{'{{user.name}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>您的邮箱是：<variable data-key="user.email" data-label="user.email" data-is-tool="false">user.email</variable></p>',
                    )
                  }
                >
                  邮箱引用：{'{{user.email}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>您的年龄是：<variable data-key="user.age" data-label="user.age" data-is-tool="false">user.age</variable>岁</p>',
                    )
                  }
                >
                  年龄引用：{'{{user.age}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>账户余额：¥<variable data-key="user.balance" data-label="user.balance" data-is-tool="false">user.balance</variable></p>',
                    )
                  }
                >
                  金额引用：{'{{user.balance}}'}
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="嵌套变量示例" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>您的偏好语言是：<variable data-key="user.profile.preferences.language" data-label="user.profile.preferences.language" data-is-tool="false">user.profile.preferences.language</variable></p>',
                    )
                  }
                >
                  深度嵌套：{'{{user.profile.preferences.language}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>您的头像：<variable data-key="user.profile.avatar" data-label="user.profile.avatar" data-is-tool="false">user.profile.avatar</variable></p>',
                    )
                  }
                >
                  嵌套对象：{'{{user.profile.avatar}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>订单状态：<variable data-key="order.status" data-label="order.status" data-is-tool="false">order.status</variable></p>',
                    )
                  }
                >
                  订单信息：{'{{order.status}}'}
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="工具示例" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>{#ToolBlock id="web_search_tool" type="search" name="Web Search"#}网页搜索{#/ToolBlock#}</p>',
                    )
                  }
                >
                  网页搜索工具
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>{#ToolBlock id="calculator_tool" type="math" name="Calculator"#}计算器{#/ToolBlock#}</p>',
                    )
                  }
                >
                  计算器工具
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>{#ToolBlock id="weather_tool" type="info" name="Weather Forecast"#}天气预报{#/ToolBlock#}</p>',
                    )
                  }
                >
                  天气预报工具
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="复合示例" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>尊敬的<variable data-key="user.name" data-label="user.name" data-is-tool="false">user.name</variable>，您的订单<variable data-key="order.id" data-label="order.id" data-is-tool="false">order.id</variable>已创建，总金额¥<variable data-key="order.total" data-label="order.total" data-is-tool="false">order.total</variable>。</p>',
                    )
                  }
                >
                  订单通知（变量组合）
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>@<mention data-id="user_001" data-label="张三" data-type="user">张三</mention> 在 <variable data-key="system.timestamp" data-label="system.timestamp" data-is-tool="false">system.timestamp</variable> 将商品加入了购物车。</p>',
                    )
                  }
                >
                  Mentions + 变量组合
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>使用 <mention data-id="datasource_001" data-label="用户数据库" data-type="datasource">用户数据库</mention> 查询 <variable data-key="user.email" data-label="user.email" data-is-tool="false">user.email</variable> 的信息。</p>',
                    )
                  }
                >
                  Mentions + 变量 + 数据源
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'variables',
      label: '变量列表',
      icon: <EyeOutlined />,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Card title="可用变量结构" size="small">
              <Collapse size="small" ghost>
                {testVariables.map((variable) => (
                  <Panel
                    header={
                      <Space>
                        <strong>{variable.name}</strong>
                        <Tag color="blue">{variable.key}</Tag>
                        <Tag color="green">{variable.type}</Tag>
                      </Space>
                    }
                    key={variable.key}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <Text type="secondary">{variable.description}</Text>
                    </div>
                    {variable.children && (
                      <List
                        size="small"
                        dataSource={variable.children}
                        renderItem={(child) => (
                          <List.Item>
                            <Space>
                              <Tag color="cyan">{child.key}</Tag>
                              <Text>{child.name}</Text>
                              <Text type="secondary">({child.type})</Text>
                              {child.description && (
                                <Text
                                  type="secondary"
                                  style={{ fontSize: '12px' }}
                                >
                                  - {child.description}
                                </Text>
                              )}
                            </Space>
                          </List.Item>
                        )}
                      />
                    )}
                  </Panel>
                ))}
              </Collapse>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="Mentions 列表" size="small">
              <List
                size="small"
                dataSource={testMentions}
                renderItem={(mention) => (
                  <List.Item>
                    <Space>
                      <UserOutlined />
                      <Tag color="blue">@{mention.label}</Tag>
                      <Text>{mention.id}</Text>
                      {mention.type && <Tag color="green">{mention.type}</Tag>}
                    </Space>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col span={24}>
            <Card title="选择的变量历史" size="small">
              {selectedVariables.length > 0 ? (
                <List
                  size="small"
                  dataSource={selectedVariables.slice().reverse()}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Tag color="success">{item.path}</Tag>
                          <Text strong>{item.variable.name}</Text>
                          <Text type="secondary">({item.variable.type})</Text>
                        </Space>
                        {item.variable.description && (
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {item.variable.description}
                          </Text>
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <InfoCircleOutlined
                    style={{ fontSize: '24px', color: '#d9d9d9' }}
                  />
                  <div style={{ marginTop: '8px', color: '#8c8c8c' }}>
                    暂无选择的变量
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Title level={2}>Tiptap Variable Input 组件测试</Title>
        <Paragraph>
          这是一个基于 Tiptap 的变量输入组件测试页面，支持 <Text code>@</Text>{' '}
          Mentions 自动补全和 <Text code>{`{`}</Text> 变量插入功能。
        </Paragraph>

        <Alert
          message="测试说明"
          description={
            <div>
              <p>
                • 在输入框中输入 <Text code>@</Text> 触发 Mentions 选择菜单
              </p>
              <p>
                • 在输入框中输入 <Text code>{`{`}</Text> 触发变量/工具选择菜单
              </p>
              <p>
                • 使用 <Text code>↑</Text> <Text code>↓</Text> 键选择项,
                <Text code>Enter</Text> 确认,<Text code>Esc</Text> 取消
              </p>
              <p>• 支持嵌套对象和数组索引访问</p>
              <p>• 支持插入工具块(Tools)，工具会显示为特殊的块状标签</p>
              <p>• 基于 Tiptap 编辑器，提供更好的光标管理和编辑体验</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      </div>

      <Tabs defaultActiveKey="test" items={tabItems} size="small" />
    </div>
  );
};

export default TiptapVariableInputTestExample;
