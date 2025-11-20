import TipTapEditorForUMI from '@/components/TipTapEditorForUMI';
import { toolService } from '@/services/toolService';
import { variableService } from '@/services/variableService';
import {
  BookOutlined,
  CodeOutlined,
  EyeOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Row,
  Space,
  Tabs,
  Typography,
} from 'antd';
import React, { useCallback, useState } from 'react';
import './index.less';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

/**
 * TipTap 编辑器示例页面
 * 展示完整的 TipTap 编辑器功能，包括变量补全和 ToolBlock 插入
 */
const TipTapEditorExample: React.FC = () => {
  const [editorContent, setEditorContent] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showToolbar, setShowToolbar] = useState(true);
  const [activeTab, setActiveTab] = useState('demo');

  // 获取数据
  const variables = variableService.getAllVariables();
  const tools = toolService.getToolTree();

  // 处理编辑器内容变化
  const handleContentChange = useCallback((content: string) => {
    setEditorContent(content);
  }, []);

  // 重置编辑器内容
  const handleReset = useCallback(() => {
    setEditorContent('');
  }, []);

  // 插入示例内容
  const handleInsertExample = useCallback(() => {
    const exampleContent = `
      <h2>欢迎使用 TipTap 编辑器</h2>
      <p>这是一个功能强大的富文本编辑器，支持 <strong>变量补全</strong> 和 <strong>ToolBlock 插入</strong>。</p>
      
      <div data-type="toolBlock" data-tool="web-search">
        <div class="toolblock-header">{#ToolBlock tool="web-search"#}</div>
        <div class="toolblock-content">在这里输入搜索内容...</div>
        <div class="toolblock-footer">{#/ToolBlock#}</div>
      </div>
      
      <p>按 <code>{</code> 键可以同时选择 <strong>变量</strong> 或 <strong>工具</strong>：</p>
      
      <ul>
        <li>变量：以 <span class="mention-node">@username</span> 的形式插入</li>
        <li>工具：插入为 <code>{#ToolBlock#}</code> 格式的块级元素</li>
      </ul>
      
      <h3>使用场景</h3>
      <p>此编辑器适用于：</p>
      <ul>
        <li>AI 助手对话</li>
        <li>模板编辑器</li>
        <li>工作流设计器</li>
        <li>代码生成器</li>
      </ul>
    `;
    setEditorContent(exampleContent.trim());
  }, []);

  // 导出内容
  const handleExport = useCallback(() => {
    const blob = new Blob([editorContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tiptap-editor-content.html';
    a.click();
    URL.revokeObjectURL(url);
  }, [editorContent]);

  // 代码示例
  const codeExamples = [
    {
      title: '基础使用',
      code: `import TipTapEditorForUMI from '@/components/TipTapEditorForUMI';

<TipTapEditorForUMI
  variables={variables}
  tools={tools}
  onChange={(content) => console.log(content)}
  placeholder="请输入内容..."
/>`,
    },
    {
      title: '高级配置',
      code: `import { variableService, toolService } from '@/services';

const variables = variableService.getAllVariables();
const tools = toolService.getToolTree();

<TipTapEditorForUMI
  content="<p>初始内容</p>"
  variables={variables}
  tools={tools}
  theme="dark"
  showToolbar={true}
  minHeight={300}
  maxHeight={600}
  onChange={handleContentChange}
  editorOptions={{
    autofocus: true,
    editable: true,
  }}
/>`,
    },
    {
      title: '变量管理',
      code: `import { variableService } from '@/services/variableService';

// 获取所有变量
const allVariables = variableService.getAllVariables();

// 搜索变量
const searchResults = variableService.searchVariables('user');

// 添加自定义变量
variableService.addVariable({
  key: 'customVar',
  name: '自定义变量',
  description: '这是一个自定义变量',
  type: 'string',
});`,
    },
    {
      title: '工具管理',
      code: `import { toolService } from '@/services/toolService';

// 获取所有工具
const allTools = toolService.getAllTools();

// 获取扁平化工具列表
const flattenedTools = toolService.getFlattenedTools();

// 搜索工具
const searchResults = toolService.searchTools('search');

// 按分类获取
const searchTools = toolService.getToolsByCategory('信息获取');`,
    },
  ];

  return (
    <div className="tiptap-editor-example">
      {/* 页面标题 */}
      <Card className="page-header">
        <Title level={2}>
          <CodeOutlined /> TipTap 编辑器示例
        </Title>
        <Paragraph>
          这是一个基于 TipTap 的高级富文本编辑器，支持 {'{'} 字符触发的
          <Text strong> 变量补全</Text> 和 <Text strong>ToolBlock 插入</Text>{' '}
          功能。
        </Paragraph>
        <Alert
          message="功能提示"
          description="在编辑器中输入左大括号字符，可以同时选择变量和工具。变量以 @variable 的形式插入，工具以 ToolBlock 格式插入。"
          type="info"
          showIcon
          closable
        />
      </Card>

      {/* 功能演示 */}
      <Row gutter={[16, 16]} className="demo-section">
        <Col span={24}>
          <Card
            title="功能演示"
            className="demo-card"
            extra={
              <Space>
                <Button
                  type={theme === 'light' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setTheme('light')}
                >
                  浅色主题
                </Button>
                <Button
                  type={theme === 'dark' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setTheme('dark')}
                >
                  深色主题
                </Button>
                <Button
                  type={showToolbar ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setShowToolbar(!showToolbar)}
                >
                  {showToolbar ? '隐藏工具栏' : '显示工具栏'}
                </Button>
              </Space>
            }
          >
            <TipTapEditorForUMI
              content={editorContent}
              variables={variables}
              tools={tools}
              theme={theme}
              showToolbar={showToolbar}
              onChange={handleContentChange}
              placeholder="请输入内容... 按 { 键开始选择变量或工具"
              minHeight={300}
              maxHeight={500}
            />

            <Divider />

            <Space wrap>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleInsertExample}
              >
                插入示例内容
              </Button>
              <Button icon={<EyeOutlined />} onClick={handleReset}>
                清空内容
              </Button>
              <Button
                icon={<CodeOutlined />}
                onClick={handleExport}
                disabled={!editorContent}
              >
                导出内容
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 数据统计 */}
      <Row gutter={[16, 16]} className="stats-section">
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-number">{variables.length}</div>
              <div className="stat-label">可用变量</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-number">
                {toolService.getFlattenedTools().length}
              </div>
              <div className="stat-label">可用工具</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-number">
                {toolService.getCategories().length}
              </div>
              <div className="stat-label">工具分类</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <div className="stat-item">
              <div className="stat-number">{editorContent.length}</div>
              <div className="stat-label">当前字数</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 使用文档 */}
      <Row gutter={[16, 16]} className="docs-section">
        <Col span={24}>
          <Card
            title={
              <>
                <BookOutlined /> 使用文档
              </>
            }
          >
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab="快速开始" key="quickstart">
                <div className="doc-section">
                  <Title level={4}>1. 基础配置</Title>
                  <Paragraph>首先需要安装依赖包：</Paragraph>
                  <pre className="code-block">
                    {`npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-placeholder @tiptap/pm`}
                  </pre>

                  <Title level={4}>2. 导入组件</Title>
                  <pre className="code-block">
                    {`import TipTapEditorForUMI from '@/components/TipTapEditorForUMI';
import { variableService, toolService } from '@/services';`}
                  </pre>

                  <Title level={4}>3. 获取数据</Title>
                  <pre className="code-block">
                    {`const variables = variableService.getAllVariables();
const tools = toolService.getToolTree();`}
                  </pre>

                  <Title level={4}>4. 使用组件</Title>
                  <pre className="code-block">
                    {`<TipTapEditorForUMI
  variables={variables}
  tools={tools}
  onChange={(content) => console.log(content)}
  placeholder="请输入内容..."
/>`}
                  </pre>
                </div>
              </TabPane>

              <TabPane tab="代码示例" key="examples">
                <div className="examples-section">
                  {codeExamples.map((example, index) => (
                    <div key={index} className="example-item">
                      <Title level={5}>{example.title}</Title>
                      <pre className="code-block">
                        <code>{example.code}</code>
                      </pre>
                    </div>
                  ))}
                </div>
              </TabPane>

              <TabPane tab="功能说明" key="features">
                <div className="features-section">
                  <Title level={4}>核心功能</Title>

                  <div className="feature-item">
                    <Title level={5}>1. 变量补全</Title>
                    <ul>
                      <li>
                        支持 <Text code>@</Text> 触发变量选择
                      </li>
                      <li>
                        支持 <Text code>{'{'}</Text> 触发统一选择
                      </li>
                      <li>
                        变量以 <Text code>{'{variableName}'}</Text> 格式显示
                      </li>
                      <li>支持变量搜索和分类</li>
                    </ul>
                  </div>

                  <div className="feature-item">
                    <Title level={5}>2. ToolBlock 插入</Title>
                    <ul>
                      <li>
                        通过 <Text code>{'{'}</Text> 字符选择工具
                      </li>
                      <li>
                        插入格式：
                        <Text code>
                          {'{#ToolBlock tool="toolName"#}内容{#/ToolBlock#}'}
                        </Text>
                      </li>
                      <li>支持工具分类和树形展示</li>
                      <li>ToolBlock 内容可编辑</li>
                    </ul>
                  </div>

                  <div className="feature-item">
                    <Title level={5}>3. 编辑器特性</Title>
                    <ul>
                      <li>基于 TipTap 的富文本编辑</li>
                      <li>支持标题、列表、引用等格式</li>
                      <li>支持深色/浅色主题切换</li>
                      <li>响应式设计，移动端友好</li>
                    </ul>
                  </div>
                </div>
              </TabPane>

              <TabPane tab="API 参考" key="api">
                <div className="api-section">
                  <Title level={4}>组件属性</Title>
                  <div className="api-table">
                    <table>
                      <thead>
                        <tr>
                          <th>属性</th>
                          <th>类型</th>
                          <th>默认值</th>
                          <th>说明</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <Text code>variables</Text>
                          </td>
                          <td>
                            <Text code>VariableItem[]</Text>
                          </td>
                          <td>
                            <Text code>[]</Text>
                          </td>
                          <td>变量列表数据</td>
                        </tr>
                        <tr>
                          <td>
                            <Text code>tools</Text>
                          </td>
                          <td>
                            <Text code>ToolItem[]</Text>
                          </td>
                          <td>
                            <Text code>[]</Text>
                          </td>
                          <td>工具列表数据</td>
                        </tr>
                        <tr>
                          <td>
                            <Text code>onChange</Text>
                          </td>
                          <td>
                            <Text code>{'(content: string) => void'}</Text>
                          </td>
                          <td>-</td>
                          <td>内容变化回调</td>
                        </tr>
                        <tr>
                          <td>
                            <Text code>theme</Text>
                          </td>
                          <td>
                            <Text code>
                              &apos;light&apos; | &apos;dark&apos;
                            </Text>
                          </td>
                          <td>
                            <Text code>&apos;light&apos;</Text>
                          </td>
                          <td>编辑器主题</td>
                        </tr>
                        <tr>
                          <td>
                            <Text code>showToolbar</Text>
                          </td>
                          <td>
                            <Text code>boolean</Text>
                          </td>
                          <td>
                            <Text code>true</Text>
                          </td>
                          <td>是否显示工具栏</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TipTapEditorExample;
