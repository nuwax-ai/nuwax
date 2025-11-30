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
import type {
  MentionItem,
  PromptVariable,
} from '../../components/TiptapVariableInput/types';
import { VariableType } from '../../components/TiptapVariableInput/types';

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

  // 功能配置状态
  const [disableMentions, setDisableMentions] = useState(true);
  const [enableMarkdown, setEnableMarkdown] = useState(false);
  const [enableEditableVariables, setEnableEditableVariables] = useState(true);
  const [variableMode, setVariableMode] = useState<'node' | 'mark' | 'text'>(
    'text',
  );

  // 编辑器实例
  const [editorInstance, setEditorInstance] = useState<any>(null);

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
      key: 'products',
      type: VariableType.ArrayObject,
      name: '商品列表',
      description: '商品数组，支持数组索引访问',
      children: [
        {
          key: 'id',
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

  // 设置完整内容（用于测试初始化）
  const setFullContent = useCallback((text: string) => {
    setPromptValue(text);
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
                <Col span={24}>
                  <Space wrap>
                    <Space>
                      <Text>只读模式：</Text>
                      <Switch
                        checked={readonly}
                        onChange={setReadonly}
                        size="small"
                      />
                    </Space>
                    <Space>
                      <Text>禁用状态：</Text>
                      <Switch
                        checked={disabled}
                        onChange={setDisabled}
                        size="small"
                      />
                    </Space>
                    <Space>
                      <Text>禁用 Mentions：</Text>
                      <Switch
                        checked={disableMentions}
                        onChange={setDisableMentions}
                        size="small"
                      />
                    </Space>
                    <Space>
                      <Text>启用 Markdown：</Text>
                      <Switch
                        checked={enableMarkdown}
                        onChange={setEnableMarkdown}
                        size="small"
                      />
                    </Space>
                    <Space>
                      <Text>可编辑变量：</Text>
                      <Switch
                        checked={enableEditableVariables}
                        onChange={setEnableEditableVariables}
                        size="small"
                      />
                    </Space>
                    <Space>
                      <Text>变量模式：</Text>
                      <Button.Group size="small">
                        <Button
                          type={variableMode === 'text' ? 'primary' : 'default'}
                          onClick={() => setVariableMode('text')}
                        >
                          Text
                        </Button>
                        <Button
                          type={variableMode === 'node' ? 'primary' : 'default'}
                          onClick={() => setVariableMode('node')}
                        >
                          Node
                        </Button>
                        <Button
                          type={variableMode === 'mark' ? 'primary' : 'default'}
                          onClick={() => setVariableMode('mark')}
                        >
                          Mark
                        </Button>
                      </Button.Group>
                    </Space>
                  </Space>
                </Col>
                <Col span={24}>
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
                    {editorInstance && (
                      <>
                        <Button
                          size="small"
                          onClick={() => editorInstance.commands.focus()}
                        >
                          聚焦编辑器
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            const html = editorInstance.getHTML();
                            console.log('编辑器 HTML:', html);
                            alert('HTML 已输出到控制台');
                          }}
                        >
                          获取 HTML
                        </Button>
                        <Button
                          size="small"
                          onClick={() => {
                            const text = editorInstance.getText();
                            console.log('编辑器文本:', text);
                            alert('文本已输出到控制台');
                          }}
                        >
                          获取文本
                        </Button>
                      </>
                    )}
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
                  disableMentions={disableMentions}
                  enableMarkdown={enableMarkdown}
                  enableEditableVariables={enableEditableVariables}
                  variableMode={variableMode}
                  getEditor={setEditorInstance}
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

          <Col span={24}>
            <Card title="粘贴/初始化测试场景" size="small">
              <Alert
                message="测试说明"
                description="测试粘贴带有变量引用的内容或初始化时，是否会出现上下各多出一行空行的问题。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="纯文本格式初始化" size="small" type="inner">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button
                        size="small"
                        block
                        onClick={() => setFullContent('您好，{{user.name}}！')}
                      >
                        测试：纯文本变量初始化
                      </Button>
                      <Button
                        size="small"
                        block
                        onClick={() =>
                          setFullContent(
                            '订单{{order.id}}总金额¥{{order.total}}',
                          )
                        }
                      >
                        测试：多个变量初始化
                      </Button>
                      <Button
                        size="small"
                        block
                        onClick={() =>
                          setFullContent(
                            '{#ToolBlock id="web_search_tool" type="search" name="Web Search"#}网页搜索{#/ToolBlock#}',
                          )
                        }
                      >
                        测试：工具块初始化
                      </Button>
                      <Button
                        size="small"
                        block
                        onClick={() =>
                          setFullContent(
                            '您好{{user.name}}，使用{#ToolBlock id="calculator_tool" type="math" name="Calculator"#}计算器{#/ToolBlock#}计算',
                          )
                        }
                      >
                        测试：变量+工具块混合
                      </Button>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="HTML 格式初始化/粘贴" size="small" type="inner">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button
                        size="small"
                        block
                        onClick={() =>
                          setFullContent(
                            '<p>您好，<span class="variable-block-chip" data-key="user.name" data-label="user.name">user.name</span>！</p>',
                          )
                        }
                      >
                        测试：正常 HTML 初始化
                      </Button>
                      <Button
                        size="small"
                        block
                        onClick={() =>
                          setFullContent(
                            '<p></p><p>您好，<span class="variable-block-chip" data-key="user.name" data-label="user.name">user.name</span>！</p><p></p>',
                          )
                        }
                      >
                        测试：带空段落 HTML（应自动清理）
                      </Button>
                      <Button
                        size="small"
                        block
                        onClick={() =>
                          setFullContent(
                            '<p><br></p><p>订单<span class="variable-block-chip" data-key="order.id" data-label="order.id">order.id</span>已创建</p><p><br></p>',
                          )
                        }
                      >
                        测试：带空行 HTML（应自动清理）
                      </Button>
                      <Button
                        size="small"
                        block
                        onClick={() =>
                          setFullContent(
                            '<p> </p><p>您的邮箱：<span class="variable-block-chip" data-key="user.email" data-label="user.email">user.email</span></p><p> </p>',
                          )
                        }
                      >
                        测试：带空格段落 HTML（应自动清理）
                      </Button>
                    </Space>
                  </Card>
                </Col>
                <Col span={24}>
                  <Card title="复杂场景测试" size="small" type="inner">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button
                        size="small"
                        block
                        onClick={() =>
                          setFullContent(
                            '<p></p><p>尊敬的<span class="variable-block-chip" data-key="user.name" data-label="user.name">user.name</span>，订单<span class="variable-block-chip" data-key="order.id" data-label="order.id">order.id</span>总金额¥<span class="variable-block-chip" data-key="order.total" data-label="order.total">order.total</span>。</p><p></p>',
                          )
                        }
                      >
                        测试：复杂内容+空段落（应自动清理）
                      </Button>
                      <Button
                        size="small"
                        block
                        onClick={() =>
                          setFullContent(
                            '<p><br></p><p>使用<span class="mention-node" data-id="datasource_001" data-label="用户数据库" data-type="datasource">用户数据库</span>查询<span class="variable-block-chip" data-key="user.email" data-label="user.email">user.email</span>的信息。</p><p><br></p>',
                          )
                        }
                      >
                        测试：Mentions+变量+空段落（应自动清理）
                      </Button>
                      <Button
                        size="small"
                        block
                        onClick={() =>
                          setFullContent(
                            '<p></p><p>工具：<span class="tool-block-chip" data-tool-id="web_search_tool" data-tool-type="search" data-tool-name="Web Search">网页搜索</span>变量：<span class="variable-block-chip" data-key="user.name" data-label="user.name">user.name</span></p><p></p>',
                          )
                        }
                      >
                        测试：工具+变量+空段落（应自动清理）
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'features',
      label: '功能演示',
      icon: <CodeOutlined />,
      children: (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="变量模式对比" size="small">
              <Alert
                message="变量模式说明"
                description={
                  <div>
                    <p>
                      <Text strong>Text 模式（默认）</Text>：变量以纯文本{' '}
                      <Text code>{'{{variable}}'}</Text> 形式存储，通过 CSS
                      装饰显示样式，无节点边界，光标移动自然
                    </p>
                    <p>
                      <Text strong>Node 模式</Text>
                      ：变量作为独立节点存储，支持可编辑变量节点，可以编辑变量内容
                    </p>
                    <p>
                      <Text strong>Mark 模式</Text>
                      ：变量作为标记应用在文本上，保持文本连续性
                    </p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setVariableMode('text');
                    setFullContent('Text 模式：{{user.name}}');
                  }}
                >
                  切换到 Text 模式并插入变量
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setVariableMode('node');
                    setFullContent('Node 模式：{{user.name}}');
                  }}
                >
                  切换到 Node 模式并插入变量
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setVariableMode('mark');
                    setFullContent('Mark 模式：{{user.name}}');
                  }}
                >
                  切换到 Mark 模式并插入变量
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="可编辑变量功能" size="small">
              <Alert
                message="可编辑变量说明"
                description="开启后可编辑变量节点，支持在变量节点内部进行字符级编辑。关闭后使用不可编辑的原子节点。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setEnableEditableVariables(true);
                    setFullContent(
                      '可编辑变量：{{user.name}}（可以点击变量进行编辑）',
                    );
                  }}
                >
                  启用可编辑变量
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setEnableEditableVariables(false);
                    setFullContent('不可编辑变量：{{user.name}}（原子节点）');
                  }}
                >
                  禁用可编辑变量
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="Markdown 功能" size="small">
              <Alert
                message="Markdown 说明"
                description="启用后支持 Markdown 快捷语法，如 **粗体**、*斜体*、# 标题等。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setEnableMarkdown(true);
                    setFullContent(
                      'Markdown 已启用，试试输入 **粗体** 或 *斜体*',
                    );
                  }}
                >
                  启用 Markdown
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setEnableMarkdown(false);
                    setFullContent('Markdown 已禁用');
                  }}
                >
                  禁用 Markdown
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setEnableMarkdown(true);
                    setFullContent(
                      '# 标题\n\n**粗体文本**\n\n*斜体文本*\n\n- 列表项1\n- 列表项2',
                    );
                  }}
                >
                  插入 Markdown 示例
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="Mentions 功能" size="small">
              <Alert
                message="Mentions 说明"
                description="启用后支持 @ 符号触发用户、文件、数据源等提及功能。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setDisableMentions(false);
                    setFullContent('Mentions 已启用，试试输入 @ 触发选择');
                  }}
                >
                  启用 Mentions
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setDisableMentions(true);
                    setFullContent('Mentions 已禁用');
                  }}
                >
                  禁用 Mentions
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="数组索引访问" size="small">
              <Alert
                message="数组索引说明"
                description="支持通过数组索引访问数组元素，如 products[0].name、cart[1].price 等。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    setFullContent(
                      '第一个商品：{{products[0].name}}，价格：{{products[0].price}}',
                    )
                  }
                >
                  数组索引示例：products[0]
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    setFullContent(
                      '购物车第一项：{{cart[0].name}}，数量：{{cart[0].quantity}}',
                    )
                  }
                >
                  数组索引示例：cart[0]
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    setFullContent(
                      '多个索引：{{products[0].name}}、{{products[1].name}}、{{products[2].name}}',
                    )
                  }
                >
                  多个数组索引
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="编辑器实例操作" size="small">
              <Alert
                message="编辑器实例说明"
                description="通过 getEditor 回调获取编辑器实例，可以执行各种编辑器操作，如聚焦、获取内容、设置内容等。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space wrap>
                <Button
                  size="small"
                  onClick={() => {
                    if (editorInstance) {
                      editorInstance.commands.focus();
                    } else {
                      alert('编辑器实例未就绪');
                    }
                  }}
                >
                  聚焦编辑器
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    if (editorInstance) {
                      const html = editorInstance.getHTML();
                      console.log('HTML:', html);
                      alert('HTML 已输出到控制台');
                    } else {
                      alert('编辑器实例未就绪');
                    }
                  }}
                >
                  获取 HTML
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    if (editorInstance) {
                      const text = editorInstance.getText();
                      console.log('文本:', text);
                      alert('文本已输出到控制台');
                    } else {
                      alert('编辑器实例未就绪');
                    }
                  }}
                >
                  获取纯文本
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    if (editorInstance) {
                      const isEmpty = editorInstance.isEmpty;
                      alert(`编辑器是否为空: ${isEmpty}`);
                    } else {
                      alert('编辑器实例未就绪');
                    }
                  }}
                >
                  检查是否为空
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    if (editorInstance) {
                      const isFocused = editorInstance.isFocused;
                      alert(`编辑器是否聚焦: ${isFocused}`);
                    } else {
                      alert('编辑器实例未就绪');
                    }
                  }}
                >
                  检查是否聚焦
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    if (editorInstance) {
                      editorInstance.commands.clearContent();
                      alert('内容已清空');
                    } else {
                      alert('编辑器实例未就绪');
                    }
                  }}
                >
                  清空内容
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    if (editorInstance) {
                      editorInstance.commands.insertContent(
                        '<p>通过编辑器实例插入的内容</p>',
                      );
                    } else {
                      alert('编辑器实例未就绪');
                    }
                  }}
                >
                  插入内容
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    if (editorInstance) {
                      const { from, to } = editorInstance.state.selection;
                      alert(`光标位置: from=${from}, to=${to}`);
                    } else {
                      alert('编辑器实例未就绪');
                    }
                  }}
                >
                  获取光标位置
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="空行处理测试" size="small">
              <Alert
                message="空行处理说明"
                description="测试组件对空行的处理，包括空段落、带换行的空段落等。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() => setFullContent('第一行\n\n第二行\n\n第三行')}
                >
                  多行文本（包含空行）
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    setFullContent(
                      '<p>第一段</p><p></p><p>第二段</p><p></p><p>第三段</p>',
                    )
                  }
                >
                  HTML 多段落（包含空段落）
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    setFullContent('<p></p><p>中间段落</p><p></p>')
                  }
                >
                  首尾空段落（应自动清理）
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="光标位置测试" size="small">
              <Alert
                message="光标位置说明"
                description="测试组件在内容更新时是否能正确保持光标位置，避免光标跳动。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    setFullContent(
                      '测试光标位置：在中间位置点击，然后点击下面的按钮更新内容',
                    );
                    setTimeout(() => {
                      if (editorInstance) {
                        const { from } = editorInstance.state.selection;
                        alert(`当前光标位置: ${from}`);
                      }
                    }, 100);
                  }}
                >
                  插入测试文本并显示光标位置
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    if (editorInstance) {
                      const { from, to } = editorInstance.state.selection;
                      if (from === to) {
                        alert(`光标位置: ${from}`);
                      } else {
                        alert(`选中范围: ${from} - ${to}`);
                      }
                    } else {
                      alert('编辑器实例未就绪');
                    }
                  }}
                >
                  获取当前光标/选中位置
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="文本格式转换测试" size="small">
              <Alert
                message="格式转换说明"
                description="测试纯文本格式和 HTML 格式之间的自动转换。"
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    const text =
                      '纯文本变量：{{user.name}}，工具：{#ToolBlock id="web_search_tool" type="search" name="Web Search"#}网页搜索{#/ToolBlock#}';
                    setFullContent(text);
                    alert('已插入纯文本格式，组件会自动转换为 HTML');
                  }}
                >
                  插入纯文本格式（自动转换）
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    if (editorInstance) {
                      const html = editorInstance.getHTML();
                      // 使用 extractTextFromHTML 提取纯文本
                      import(
                        '../../components/TiptapVariableInput/utils/htmlUtils'
                      ).then((module) => {
                        const text = module.extractTextFromHTML(html);
                        console.log('提取的纯文本:', text);
                        alert('纯文本已输出到控制台');
                      });
                    } else {
                      alert('编辑器实例未就绪');
                    }
                  }}
                >
                  提取纯文本格式
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() => {
                    const html =
                      '<p>HTML 格式：<span class="variable-block-chip" data-key="user.name">user.name</span></p>';
                    setFullContent(html);
                    alert('已插入 HTML 格式');
                  }}
                >
                  插入 HTML 格式
                </Button>
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
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>时区设置：<variable data-key="user.profile.preferences.timezone" data-label="user.profile.preferences.timezone" data-is-tool="false">user.profile.preferences.timezone</variable></p>',
                    )
                  }
                >
                  三层嵌套：{'{{user.profile.preferences.timezone}}'}
                </Button>
              </Space>
            </Card>
          </Col>

          <Col span={12}>
            <Card title="数组索引示例" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>第一个商品：<variable data-key="products[0].name" data-label="products[0].name" data-is-tool="false">products[0].name</variable>，价格：<variable data-key="products[0].price" data-label="products[0].price" data-is-tool="false">products[0].price</variable></p>',
                    )
                  }
                >
                  数组索引：{'{{products[0].name}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>购物车第一项：<variable data-key="cart[0].name" data-label="cart[0].name" data-is-tool="false">cart[0].name</variable>，数量：<variable data-key="cart[0].quantity" data-label="cart[0].quantity" data-is-tool="false">cart[0].quantity</variable></p>',
                    )
                  }
                >
                  数组索引：{'{{cart[0].name}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>第二个商品：<variable data-key="products[1].name" data-label="products[1].name" data-is-tool="false">products[1].name</variable></p>',
                    )
                  }
                >
                  数组索引：{'{{products[1].name}}'}
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>多个索引：<variable data-key="products[0].name" data-label="products[0].name" data-is-tool="false">products[0].name</variable>、<variable data-key="products[1].name" data-label="products[1].name" data-is-tool="false">products[1].name</variable>、<variable data-key="products[2].name" data-label="products[2].name" data-is-tool="false">products[2].name</variable></p>',
                    )
                  }
                >
                  多个数组索引
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
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>使用 {#ToolBlock id="web_search_tool" type="search" name="Web Search"#}网页搜索{#/ToolBlock#} 查找 <variable data-key="products[0].name" data-label="products[0].name" data-is-tool="false">products[0].name</variable> 的信息。</p>',
                    )
                  }
                >
                  工具 + 数组索引变量
                </Button>
                <Button
                  size="small"
                  block
                  onClick={() =>
                    insertPresetText(
                      '<p>@<mention data-id="user_001" data-label="张三" data-type="user">张三</mention> 购买了 <variable data-key="cart[0].name" data-label="cart[0].name" data-is-tool="false">cart[0].name</variable>，使用 {#ToolBlock id="calculator_tool" type="math" name="Calculator"#}计算器{#/ToolBlock#} 计算总价。</p>',
                    )
                  }
                >
                  完整组合：Mentions + 数组变量 + 工具
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
                <Text code>Enter</Text> 确认,<Text code>Esc</Text> 取消,
                <Text code>Tab</Text> 在变量和工具之间切换
              </p>
              <p>• 支持嵌套对象访问，如 {'{{user.profile.avatar}}'}</p>
              <p>• 支持数组索引访问，如 {'{{products[0].name}}'}</p>
              <p>• 支持插入工具块(Tools)，工具会显示为特殊的块状标签</p>
              <p>• 支持三种变量模式：Text（默认）、Node、Mark</p>
              <p>• 支持可编辑变量节点，可在变量内部进行字符级编辑</p>
              <p>• 支持 Markdown 快捷语法（需启用）</p>
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
