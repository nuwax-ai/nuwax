/**
 * PromptEditorWithVariable 组件测试页面
 * 用于测试变量选择功能的各个场景
 */

import PromptEditorWithVariable from '@/components/PromptEditorWithVariable';
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { Button, Card, Divider, Form, Space, Tag, Typography } from 'antd';
import { PromptEditorProvider } from 'prompt-kit-editor';
import React, { useState } from 'react';
import './index.less';

const { Title, Paragraph, Text } = Typography;

/**
 * 模拟变量数据（输入参数配置）
 */
const mockVariables: InputAndOutConfig[] = [
  {
    key: 'user',
    name: 'user',
    description: '用户信息',
    dataType: DataTypeEnum.Object,
    require: false,
    systemVariable: false,
    bindValue: '',
    subArgs: [
      {
        key: 'user.name',
        name: 'name',
        description: '用户姓名',
        dataType: DataTypeEnum.String,
        require: false,
        systemVariable: false,
        bindValue: '',
      },
      {
        key: 'user.email',
        name: 'email',
        description: '用户邮箱',
        dataType: DataTypeEnum.String,
        require: false,
        systemVariable: false,
        bindValue: '',
      },
      {
        key: 'user.age',
        name: 'age',
        description: '用户年龄',
        dataType: DataTypeEnum.Integer,
        require: false,
        systemVariable: false,
        bindValue: '',
      },
    ],
  },
  {
    key: 'products',
    name: 'products',
    description: '产品列表',
    dataType: DataTypeEnum.Array_String,
    require: false,
    systemVariable: false,
    bindValue: '',
    subArgs: [
      {
        key: 'products.name',
        name: 'name',
        description: '产品名称',
        dataType: DataTypeEnum.String,
        require: false,
        systemVariable: false,
        bindValue: '',
      },
      {
        key: 'products.price',
        name: 'price',
        description: '产品价格',
        dataType: DataTypeEnum.Number,
        require: false,
        systemVariable: false,
        bindValue: '',
      },
      {
        key: 'products.category',
        name: 'category',
        description: '产品分类',
        dataType: DataTypeEnum.Object,
        require: false,
        systemVariable: false,
        bindValue: '',
        subArgs: [
          {
            key: 'products.category.id',
            name: 'id',
            description: '分类ID',
            dataType: DataTypeEnum.Integer,
            require: false,
            systemVariable: false,
            bindValue: '',
          },
          {
            key: 'products.category.name',
            name: 'name',
            description: '分类名称',
            dataType: DataTypeEnum.String,
            require: false,
            systemVariable: false,
            bindValue: '',
          },
        ],
      },
    ],
  },
  {
    key: 'order',
    name: 'order',
    description: '订单信息',
    dataType: DataTypeEnum.Object,
    require: false,
    systemVariable: false,
    bindValue: '',
    subArgs: [
      {
        key: 'order.id',
        name: 'id',
        description: '订单ID',
        dataType: DataTypeEnum.String,
        require: false,
        systemVariable: false,
        bindValue: '',
      },
      {
        key: 'order.items',
        name: 'items',
        description: '订单项列表',
        dataType: DataTypeEnum.Array_String,
        require: false,
        systemVariable: false,
        bindValue: '',
        subArgs: [
          {
            key: 'order.items.productName',
            name: 'productName',
            description: '商品名称',
            dataType: DataTypeEnum.String,
            require: false,
            systemVariable: false,
            bindValue: '',
          },
          {
            key: 'order.items.quantity',
            name: 'quantity',
            description: '数量',
            dataType: DataTypeEnum.Integer,
            require: false,
            systemVariable: false,
            bindValue: '',
          },
        ],
      },
    ],
  },
  {
    key: 'timestamp',
    name: 'timestamp',
    description: '时间戳',
    dataType: DataTypeEnum.Integer,
    require: false,
    systemVariable: false,
    bindValue: '',
  },
];

/**
 * 测试页面组件
 */
const PromptEditorVariableTest: React.FC = () => {
  const [form] = Form.useForm();
  const [output, setOutput] = useState<string>('');

  // 处理表单提交
  const handleSubmit = () => {
    const values = form.getFieldsValue();
    setOutput(JSON.stringify(values, null, 2));
  };

  // 重置表单
  const handleReset = () => {
    form.resetFields();
    setOutput('');
  };

  return (
    <div className="prompt-editor-variable-test">
      <div className="test-container">
        <Title level={2}>PromptEditorWithVariable 组件测试</Title>
        <Paragraph>此页面用于测试变量选择功能的各个场景，包括：</Paragraph>
        <ul>
          <li>
            输入 <Text code>{'{'}</Text> 自动触发变量选择器
          </li>
          <li>变量搜索过滤功能</li>
          <li>键盘导航（上下键、回车、ESC）</li>
          <li>变量插入功能</li>
          <li>
            自动补全 <Text code>{'{}'}</Text> 的处理
          </li>
        </ul>

        <Divider />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* 测试场景 1: 基础使用 */}
          <Card title="测试场景 1: 基础变量选择" style={{ marginBottom: 24 }}>
            <Paragraph>
              输入 <Text code>{'{'}</Text> 或 <Text code>{'{{'}</Text>{' '}
              来触发变量选择器
            </Paragraph>
            <Form.Item
              label="系统提示词"
              name="systemPrompt"
              tooltip="输入 { 来触发变量选择"
            >
              <PromptEditorProvider>
                <PromptEditorWithVariable
                  variables={mockVariables}
                  placeholder="输入 { 来触发变量选择，例如：你好，{{user.name}}"
                  isControled={true}
                />
              </PromptEditorProvider>
            </Form.Item>
          </Card>

          {/* 测试场景 2: 用户提示词 */}
          <Card title="测试场景 2: 用户提示词" style={{ marginBottom: 24 }}>
            <Paragraph>测试在用户提示词中使用变量引用</Paragraph>
            <Form.Item
              label="用户提示词"
              name="userPrompt"
              tooltip="可以使用变量引用，如 {{user.name}}"
            >
              <PromptEditorProvider>
                <PromptEditorWithVariable
                  variables={mockVariables}
                  placeholder="请输入用户提示词，可以使用 {{变量名}} 的方式引用变量"
                  isControled={true}
                />
              </PromptEditorProvider>
            </Form.Item>
          </Card>

          {/* 测试场景 3: 复杂变量路径 */}
          <Card title="测试场景 3: 复杂变量路径" style={{ marginBottom: 24 }}>
            <Paragraph>测试嵌套变量和数组变量的引用，例如：</Paragraph>
            <ul>
              <li>
                <Text code>{'{{user.name}}'}</Text> - 简单变量
              </li>
              <li>
                <Text code>{'{{products[0].name}}'}</Text> - 数组变量
              </li>
              <li>
                <Text code>{'{{order.items[0].productName}}'}</Text> -
                嵌套数组变量
              </li>
              <li>
                <Text code>{'{{products.category.name}}'}</Text> - 嵌套对象变量
              </li>
            </ul>
            <Form.Item label="复杂提示词" name="complexPrompt">
              <PromptEditorProvider>
                <PromptEditorWithVariable
                  variables={mockVariables}
                  placeholder="尝试输入 { 并选择不同的变量，观察生成的路径格式"
                  isControled={true}
                />
              </PromptEditorProvider>
            </Form.Item>
          </Card>

          {/* 测试场景 4: 空变量列表 */}
          <Card title="测试场景 4: 空变量列表" style={{ marginBottom: 24 }}>
            <Paragraph>
              测试当没有变量时，输入 <Text code>{'{'}</Text> 不会触发选择器
            </Paragraph>
            <Form.Item label="无变量提示词" name="emptyPrompt">
              <PromptEditorProvider>
                <PromptEditorWithVariable
                  variables={[]}
                  placeholder="没有变量时，输入 { 不会触发选择器"
                  isControled={true}
                />
              </PromptEditorProvider>
            </Form.Item>
          </Card>

          {/* 变量列表展示 */}
          <Card title="可用变量列表" style={{ marginBottom: 24 }}>
            <div className="variable-list">
              {mockVariables.map((variable) => (
                <div key={variable.key} className="variable-item">
                  <Tag color="blue">{variable.name}</Tag>
                  <Text type="secondary">{variable.description}</Text>
                  {variable.subArgs && variable.subArgs.length > 0 && (
                    <div className="variable-children">
                      {variable.subArgs.map((child) => (
                        <div key={child.key} className="variable-child">
                          <Tag color="cyan">
                            {variable.name}.{child.name}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {child.description}
                          </Text>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* 操作按钮 */}
          <Space>
            <Button type="primary" htmlType="submit">
              提交表单
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form>

        {/* 输出结果 */}
        {output && (
          <Card title="表单输出结果" style={{ marginTop: 24 }}>
            <pre className="output-result">{output}</pre>
          </Card>
        )}

        {/* 使用说明 */}
        <Card title="使用说明" style={{ marginTop: 24 }}>
          <Title level={4}>触发方式</Title>
          <ul>
            <li>
              在编辑器中输入 <Text code>{'{'}</Text> 字符，会自动显示变量选择器
            </li>
            <li>
              如果编辑器自动补全为 <Text code>{'{}'}</Text>
              ，光标在中间时也会触发
            </li>
          </ul>

          <Title level={4}>搜索功能</Title>
          <ul>
            <li>在变量选择器的搜索框中输入关键词，可以实时过滤变量</li>
            <li>支持中文搜索</li>
            <li>搜索时会保持树形结构，显示匹配节点及其父节点</li>
          </ul>

          <Title level={4}>键盘导航</Title>
          <ul>
            <li>
              <Text code>↑</Text> <Text code>↓</Text> - 上下选择变量
            </li>
            <li>
              <Text code>Enter</Text> - 确认选择并插入变量
            </li>
            <li>
              <Text code>ESC</Text> - 关闭变量选择器
            </li>
          </ul>

          <Title level={4}>变量格式</Title>
          <ul>
            <li>
              <Text code>{'{{变量名}}'}</Text> - 简单变量引用
            </li>
            <li>
              <Text code>{'{{变量名.子变量名}}'}</Text> - 对象属性引用
            </li>
            <li>
              <Text code>{'{{变量名[数组索引]}}'}</Text> - 数组元素引用
            </li>
            <li>
              <Text code>{'{{变量名[索引].属性名}}'}</Text> - 数组元素属性引用
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default PromptEditorVariableTest;
