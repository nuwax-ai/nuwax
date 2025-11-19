/*
 * Variable Inference Input Component Example
 * 变量智能推断输入组件使用示例
 */

import { Alert, Card, Space, Tag, Typography } from 'antd';
import React, { useState } from 'react';
import VariableInferenceInput from './index';
import type { PromptVariable } from './types';
import { VariableType } from './types';

const { Title, Paragraph, Text } = Typography;

export const VariableInferenceInputExample: React.FC = () => {
  const [promptValue, setPromptValue] = useState('');
  const [selectedVariable, setSelectedVariable] = useState<{
    variable: PromptVariable;
    path: string;
  } | null>(null);

  // 示例变量数据
  const sampleVariables: PromptVariable[] = [
    {
      key: 'user',
      type: VariableType.Object,
      name: '用户信息',
      description: '当前用户的基本信息',
      children: [
        {
          key: 'name',
          type: VariableType.String,
          name: '用户名',
          description: '用户的姓名',
        },
        {
          key: 'age',
          type: VariableType.Integer,
          name: '年龄',
          description: '用户年龄',
        },
        {
          key: 'email',
          type: VariableType.String,
          name: '邮箱',
          description: '用户邮箱地址',
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
              description: '用户界面主题',
            },
          ],
        },
      ],
    },
    {
      key: 'products',
      type: VariableType.Array,
      name: '商品列表',
      description: '用户购物车中的商品',
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
        {
          key: 'quantity',
          type: VariableType.Integer,
          name: '数量',
        },
      ],
    },
    {
      key: 'order',
      type: VariableType.Object,
      name: '订单信息',
      children: [
        {
          key: 'id',
          type: VariableType.String,
          name: '订单号',
        },
        {
          key: 'total',
          type: VariableType.Number,
          name: '订单总额',
        },
        {
          key: 'status',
          type: VariableType.String,
          name: '订单状态',
        },
      ],
    },
  ];

  const handleVariableSelect = (variable: PromptVariable, path: string) => {
    setSelectedVariable({ variable, path });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
      <Title level={2}>Variable Inference Input Component</Title>

      <Alert
        message="智能变量引用组件"
        description={`支持 ${'{{变量名}}'}、${'{{变量名.子变量名}}'}、${'{{变量名[数组索引]}}'} 三种引用语法，提供智能提示和自动补全功能。`}
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Card title="基础使用示例" style={{ marginBottom: 20 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Paragraph>
            在下面的文本框中输入提示词，当输入 <Text code>{`{{`}</Text>{' '}
            时会自动弹出变量选择菜单。
          </Paragraph>

          <VariableInferenceInput
            variables={sampleVariables}
            value={promptValue}
            onChange={setPromptValue}
            onVariableSelect={handleVariableSelect}
            placeholder={`请输入提示词，使用 ${'{{变量名}}'} 引用变量...`}
          />

          {promptValue && (
            <div>
              <Text strong>当前提示词：</Text>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: '10px',
                  borderRadius: '4px',
                  marginTop: '8px',
                  fontFamily: 'Monaco, Menlo, monospace',
                }}
              >
                {promptValue}
              </pre>
            </div>
          )}

          {selectedVariable && (
            <div>
              <Text strong>最后选择的变量：</Text>
              <div style={{ marginTop: '8px' }}>
                <Tag color="blue">{selectedVariable.path}</Tag>
                <span style={{ marginLeft: '8px' }}>
                  {selectedVariable.variable.name} -{' '}
                  {selectedVariable.variable.description}
                </span>
              </div>
            </div>
          )}
        </Space>
      </Card>

      <Card title="支持的语法示例" style={{ marginBottom: 20 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>基础变量引用：</Text>
            <pre
              style={{
                background: '#f0f0f0',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              {`你好，{{user.name}}！`}
            </pre>
          </div>

          <div>
            <Text strong>嵌套属性访问：</Text>
            <pre
              style={{
                background: '#f0f0f0',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              {`你的语言偏好是：{{user.preferences.language}}`}
            </pre>
          </div>

          <div>
            <Text strong>数组索引访问：</Text>
            <pre
              style={{
                background: '#f0f0f0',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              {`购物车中的第一个商品：{{products[0].name}}`}
            </pre>
          </div>

          <div>
            <Text strong>复合表达式：</Text>
            <pre
              style={{
                background: '#f0f0f0',
                padding: '8px',
                borderRadius: '4px',
              }}
            >
              {`订单 {{order.id}} 的总金额是 {{order.total}}，包含 {{products[0].quantity}} 个 {{products[0].name}}`}
            </pre>
          </div>
        </Space>
      </Card>

      <Card title="功能特性">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>✨ 智能提示：</Text>
            <Paragraph>
              输入 {`{{`} 时自动弹出变量选择菜单，支持模糊搜索
            </Paragraph>
          </div>

          <div>
            <Text strong>⌨️ 键盘导航：</Text>
            <Paragraph>
              使用上下箭头键选择变量，Enter 键确认选择，Esc 键关闭菜单
            </Paragraph>
          </div>

          <div>
            <Text strong>🎯 类型图标：</Text>
            <Paragraph>不同类型的变量显示对应的图标，便于快速识别</Paragraph>
          </div>

          <div>
            <Text strong>🔍 搜索过滤：</Text>
            <Paragraph>支持按变量名、标签、路径进行模糊搜索</Paragraph>
          </div>

          <div>
            <Text strong>🌙 暗色主题：</Text>
            <Paragraph>自动适配系统暗色主题</Paragraph>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default VariableInferenceInputExample;
