/*
 * Variable Reference Component Test Example
 * 变量引用组件测试示例
 */

import {
  CodeOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  SettingOutlined,
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
import VariableInferenceInput from '../../components/VariableInferenceInput';
import {
  type PromptVariable,
  VariableType,
} from '../../components/VariableInferenceInput/types';
import { VARIABLE_REGEX } from '../../components/VariableInferenceInput/utils/parserUtils';
import { generateVariableReference } from '../../components/VariableInferenceInput/utils/treeUtils';

const findAllVariableReferences = (text: string) => {
  return text.match(VARIABLE_REGEX) || [];
};

const isValidVariableReference = (ref: string) => {
  return new RegExp(/^\{\{([^}]+)\}\}$/).test(ref);
};

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const VariableRefTestExample: React.FC = () => {
  // 提取变量名
  const extractVariableName = (ref: string) => {
    const match = ref.match(/^\{\{(.+)\}\}$/);
    return match ? match[1] : null;
  };

  // 基础状态
  const [promptValue, setPromptValue] = useState('');
  const [selectedVariables, setSelectedVariables] = useState<
    Array<{ variable: PromptVariable; path: string }>
  >([]);
  const [readonly, setReadonly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [direction, setDirection] = useState<
    'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  >('bottomLeft');

  // 测试变量数据
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

  // 分析变量引用
  const analyzeVariableReferences = useCallback(() => {
    const references = findAllVariableReferences(promptValue);
    return references.map((ref) => ({
      reference: ref,
      name: extractVariableName(ref),
      isValid: isValidVariableReference(ref),
    }));
  }, [promptValue]);

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
                <Col span={6}>
                  <Text>弹窗方向：</Text>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as any)}
                    style={{ marginLeft: 8 }}
                  >
                    <option value="bottomLeft">左下</option>
                    <option value="bottomRight">右下</option>
                    <option value="topLeft">左上</option>
                    <option value="topRight">右上</option>
                  </select>
                </Col>
                <Col span={6}>
                  <Space>
                    <Button size="small" onClick={handleClear}>
                      清空
                    </Button>
                    <Button
                      size="small"
                      onClick={() => insertPresetText('您好，{{user.name}}！')}
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
                <Button
                  onClick={() =>
                    console.log('Debug: current variables', testVariables)
                  }
                >
                  调试：输出变量数据
                </Button>
                <Button
                  onClick={() =>
                    console.log('Debug: current prompt value', promptValue)
                  }
                >
                  调试：输出当前值
                </Button>
              </Space>
              <VariableInferenceInput
                variables={testVariables}
                value={promptValue}
                onChange={setPromptValue}
                onVariableSelect={handleVariableSelect}
                readonly={readonly}
                disabled={disabled}
                direction={direction}
                placeholder="输入提示词，使用 {{变量名}} 引用变量..."
              />
            </Card>
          </Col>

          <Col span={12}>
            <Card title="实时预览" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>当前值：</Text>
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
                    }}
                  >
                    {promptValue || '（空）'}
                  </pre>
                </div>

                <div>
                  <Text strong>解析到的变量：</Text>
                  <div style={{ marginTop: '8px' }}>
                    {analyzeVariableReferences().length > 0 ? (
                      analyzeVariableReferences().map((item, index) => (
                        <Tag
                          key={index}
                          color={item.isValid ? 'success' : 'error'}
                          style={{ marginBottom: '4px' }}
                        >
                          {item.reference}
                        </Tag>
                      ))
                    ) : (
                      <Text type="secondary">无变量引用</Text>
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
            <Card title="基础语法示例" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() => insertPresetText('您好，{{user.name}}！')}
                >
                  基础变量：{'{{user.name}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => insertPresetText('您的邮箱是：{{user.email}}')}
                >
                  邮箱引用：{'{{user.email}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => insertPresetText('您的年龄是：{{user.age}}岁')}
                >
                  年龄引用：{'{{user.age}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText('账户余额：¥{{user.balance}}')
                  }
                >
                  金额引用：{'{{user.balance}}'}
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="嵌套语法示例" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '您的偏好语言是：{{user.profile.preferences.language}}',
                    )
                  }
                >
                  深度嵌套：{'{{user.profile.preferences.language}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText('您的头像：{{user.profile.avatar}}')
                  }
                >
                  嵌套对象：{'{{user.profile.avatar}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => insertPresetText('订单状态：{{order.status}}')}
                >
                  订单信息：{'{{order.status}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText('系统时间：{{system.timestamp}}')
                  }
                >
                  系统信息：{'{{system.timestamp}}'}
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="数组语法示例" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText('购物车第一件商品：{{cart[0].name}}')
                  }
                >
                  数组索引：{'{{cart[0].name}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText('商品价格：¥{{cart[0].price}}')
                  }
                >
                  数组字段：{'{{cart[0].price}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText('购买数量：{{cart[0].quantity}}件')
                  }
                >
                  数组数量：{'{{cart[0].quantity}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText('第一个订单项：{{order.items[0].name}}')
                  }
                >
                  嵌套数组：{'{{order.items[0].name}}'}
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="复合表达式示例" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '尊敬的{{user.name}}，您的订单{{order.id}}已创建，总金额¥{{order.total}}。',
                    )
                  }
                >
                  订单通知
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '{{user.name}}在{{system.timestamp}}将{{cart[0].name}}加入了购物车。',
                    )
                  }
                >
                  购物车更新
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '您的偏好语言{{user.profile.preferences.language}}，时区{{user.profile.preferences.timezone}}。',
                    )
                  }
                >
                  用户偏好
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '系统版本{{system.version}}运行在{{system.environment}}环境。',
                    )
                  }
                >
                  系统信息
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
            <Card title="选择的变量历史" size="small">
              {selectedVariables.length > 0 ? (
                <List
                  size="small"
                  dataSource={selectedVariables.slice().reverse()}
                  renderItem={(item) => (
                    <List.Item>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Tag color="success">
                            {generateVariableReference(item.path)}
                          </Tag>
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
        <Title level={2}>Prompt Variable Reference 组件测试</Title>
        <Paragraph>
          这是一个完整的变量引用组件测试页面，支持 {'{{变量名}}'},{' '}
          {'{{变量名.子变量名}}'}, {'{{变量名[数组索引]}}'} 三种语法。 输入{' '}
          <Text code>{`{{`}</Text>{' '}
          开始输入变量引用，系统会自动弹出变量选择菜单。
        </Paragraph>

        <Alert
          message="测试说明"
          description={
            <div>
              <p>
                • 在输入框中输入 <Text code>{`{{`}</Text> 触发变量选择菜单
              </p>
              <p>
                • 使用 <Text code>↑</Text> <Text code>↓</Text> 键选择变量，
                <Text code>Enter</Text> 确认，<Text code>Esc</Text> 取消
              </p>
              <p>• 支持嵌套对象和数组索引访问</p>
              <p>• 实时解析和验证变量引用语法</p>
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

export default VariableRefTestExample;
