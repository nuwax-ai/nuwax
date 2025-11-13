/*
 * Prompt Variable Reference Component - Autosize Feature Demo
 * 提示词变量引用组件 - 自动调整大小功能演示
 */

import React, { useState } from 'react';
import PromptVariableRef from '../../components/PromptVariableRef';
import type { PromptVariable } from '../../components/PromptVariableRef/types';

// 示例变量数据
const sampleVariables: PromptVariable[] = [
  {
    key: 'user',
    type: 'object' as any,
    name: '用户信息',
    description: '当前用户的相关信息',
    children: [
      {
        key: 'user.name',
        type: 'string' as any,
        name: '用户姓名',
        description: '用户的真实姓名',
      },
      {
        key: 'user.age',
        type: 'integer' as any,
        name: '用户年龄',
        description: '用户的年龄',
      },
      {
        key: 'user.email',
        type: 'string' as any,
        name: '用户邮箱',
        description: '用户的邮箱地址',
      },
    ],
  },
  {
    key: 'product',
    type: 'object' as any,
    name: '产品信息',
    description: '产品相关数据',
    children: [
      {
        key: 'product.name',
        type: 'string' as any,
        name: '产品名称',
        description: '产品的名称',
      },
      {
        key: 'product.price',
        type: 'number' as any,
        name: '产品价格',
        description: '产品的价格',
      },
    ],
  },
];

const AutosizeDemo: React.FC = () => {
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [value3, setValue3] = useState('');
  const [value4, setValue4] = useState('');

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>PromptVariableRef - 自动调整大小功能演示</h1>

      <div style={{ marginBottom: '40px' }}>
        <h2>1. 基础自动调整大小</h2>
        <p>启用 autosize，高度会根据内容自动调整</p>
        <PromptVariableRef
          variables={sampleVariables}
          autosize={true}
          placeholder="输入提示词，使用 {{变量名}} 引用变量"
          value={value1}
          onChange={setValue1}
          showCount={true}
          minRows={3}
          maxRows={10}
          minHeight={80}
          maxHeight={300}
        />
        <p>当前值: {JSON.stringify(value1)}</p>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>2. 固定行数</h2>
        <p>使用 rows 属性设置固定行数</p>
        <PromptVariableRef
          variables={sampleVariables}
          rows={5}
          placeholder="这是一个5行的固定高度输入框"
          value={value2}
          onChange={setValue2}
          showCount={true}
          maxLength={200}
        />
        <p>当前值: {JSON.stringify(value2)}</p>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>3. 固定列数和行数</h2>
        <p>使用 cols 和 rows 设置固定宽度和高度</p>
        <PromptVariableRef
          variables={sampleVariables}
          cols={40}
          rows={6}
          placeholder="这是一个40列6行的固定尺寸输入框"
          value={value3}
          onChange={setValue3}
          showCount={true}
          maxLength={500}
        />
        <p>当前值: {JSON.stringify(value3)}</p>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>4. 高级自动调整配置</h2>
        <p>使用 autosize 对象配置最小和最大行数</p>
        <PromptVariableRef
          variables={sampleVariables}
          autosize={{ minRows: 2, maxRows: 8 }}
          placeholder="自动调整大小，最小2行，最大8行"
          value={value4}
          onChange={setValue4}
          showCount={true}
          maxLength={300}
          style={{ width: '100%' }}
        />
        <p>当前值: {JSON.stringify(value4)}</p>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>5. 综合示例</h2>
        <p>结合多种功能的复杂场景</p>
        <PromptVariableRef
          variables={sampleVariables}
          autosize={true}
          showCount={true}
          maxLength={1000}
          minRows={4}
          maxRows={12}
          minHeight={100}
          maxHeight={400}
          placeholder="这是一个功能完整的输入框：支持自动调整大小、字符计数、最大长度限制..."
          onChange={(value) => console.log('Value changed:', value)}
          onVariableSelect={(variable, path) =>
            console.log('Variable selected:', variable, path)
          }
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
};

export default AutosizeDemo;
