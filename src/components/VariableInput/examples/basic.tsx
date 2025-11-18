/**
 * VariableInput 基础用法示例
 * 展示组件的基本使用方法和核心功能
 */

import type { DataNode } from 'antd/es/tree';
import React, { useState } from 'react';
import VariableInput from '../index';

const BasicExample: React.FC = () => {
  const [content, setContent] = useState('');

  // 基础变量数据
  const basicTreeData: DataNode[] = [
    {
      title: '用户信息',
      key: 'userinfo',
      children: [
        { title: '姓名', key: 'name' },
        { title: '邮箱', key: 'email' },
        { title: '手机号', key: 'phone' },
      ],
    },
    {
      title: '订单信息',
      key: 'orderinfo',
      children: [
        { title: '订单号', key: 'orderId' },
        { title: '金额', key: 'amount' },
        { title: '日期', key: 'date' },
      ],
    },
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>VariableInput 基础用法示例</h2>

      {/* 基础组件使用 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>1. 基础组件使用</h3>
        <VariableInput
          onChange={(value) => setContent(value)}
          treeData={basicTreeData}
        />
      </div>

      {/* 显示当前内容 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>2. 当前内容预览</h3>
        <div
          style={{
            border: '1px solid #ddd',
            padding: '15px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
          }}
        >
          {content || '请在上方输入框中输入文本并插入变量...'}
        </div>
      </div>

      {/* 使用说明 */}
      <div style={{ marginBottom: '30px' }}>
        <h3>3. 使用说明</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li>
            输入 <code>{'{'}</code> 字符触发变量选择
          </li>
          <li>
            使用 <code>↑↓</code> 箭头键导航选项
          </li>
          <li>
            按 <code>Enter</code> 键确认选择
          </li>
          <li>
            按 <code>Esc</code> 键取消操作
          </li>
          <li>输入字母进行搜索过滤</li>
          <li>
            使用 <code>Backspace/Delete</code> 键删除变量块
          </li>
        </ul>
      </div>

      {/* 解析变量示例 */}
      <div>
        <h3>4. 提取的变量</h3>
        {(() => {
          const variables = content.match(/\{\{(\w+)\}\}/g) || [];
          return (
            <div
              style={{
                border: '1px solid #52c41a',
                padding: '10px',
                backgroundColor: '#f6ffed',
                borderRadius: '4px',
              }}
            >
              {variables.length > 0 ? (
                <ul>
                  {variables.map((variable, index) => (
                    <li key={index}>
                      <code>{variable}</code>
                    </li>
                  ))}
                </ul>
              ) : (
                <span style={{ color: '#666' }}>暂无变量</span>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default BasicExample;
