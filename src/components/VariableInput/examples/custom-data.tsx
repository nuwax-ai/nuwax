/**
 * VariableInput 自定义数据示例
 * 展示如何自定义变量数据结构和样式
 */

import type { DataNode } from 'antd/es/tree';
import React, { useState } from 'react';
import VariableInput from '../index';

const CustomDataExample: React.FC = () => {
  const [emailContent, setEmailContent] = useState('');
  const [contractContent, setContractContent] = useState('');
  const [codeContent, setCodeContent] = useState('');

  // 邮件模板变量
  const emailVariables: DataNode[] = [
    {
      title: '收件人信息',
      key: 'recipient',
      children: [
        { title: '客户姓名', key: 'customerName' },
        { title: '客户邮箱', key: 'customerEmail' },
        { title: '客户电话', key: 'customerPhone' },
      ],
    },
    {
      title: '订单信息',
      key: 'order',
      children: [
        { title: '订单编号', key: 'orderNumber' },
        { title: '订单金额', key: 'orderAmount' },
        { title: '订单日期', key: 'orderDate' },
        { title: '商品名称', key: 'productName' },
      ],
    },
    {
      title: '公司信息',
      key: 'company',
      children: [
        { title: '公司名称', key: 'companyName' },
        { title: '客服电话', key: 'servicePhone' },
        { title: '公司地址', key: 'companyAddress' },
      ],
    },
  ];

  // 合同模板变量
  const contractVariables: DataNode[] = [
    {
      title: '合同双方',
      key: 'parties',
      children: [
        { title: '甲方', key: 'partyA' },
        { title: '乙方', key: 'partyB' },
        { title: '代表人', key: 'representative' },
      ],
    },
    {
      title: '合同内容',
      key: 'contract',
      children: [
        { title: '合同编号', key: 'contractNumber' },
        { title: '合同金额', key: 'contractAmount' },
        { title: '签订日期', key: 'signDate' },
        { title: '有效期至', key: 'validUntil' },
        { title: '服务内容', key: 'serviceContent' },
      ],
    },
  ];

  // 代码模板变量
  const codeVariables: DataNode[] = [
    {
      title: '函数定义',
      key: 'function',
      children: [
        { title: '函数名', key: 'functionName' },
        { title: '参数列表', key: 'parameters' },
        { title: '返回值类型', key: 'returnType' },
        { title: '函数描述', key: 'description' },
      ],
    },
    {
      title: '变量定义',
      key: 'variables',
      children: [
        { title: '变量名', key: 'variableName' },
        { title: '变量类型', key: 'variableType' },
        { title: '初始值', key: 'initialValue' },
      ],
    },
    {
      title: 'API接口',
      key: 'api',
      children: [
        { title: '接口地址', key: 'apiUrl' },
        { title: '请求方法', key: 'httpMethod' },
        { title: '状态码', key: 'statusCode' },
      ],
    },
  ];

  // 解析变量的函数
  const parseVariables = (content: string) => {
    return (
      content
        .match(/\{\{(\w+)\}\}/g)
        ?.map((match) => match.replace(/[{}]/g, '')) || []
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <h2>VariableInput 自定义数据示例</h2>

      {/* 邮件模板示例 */}
      <div style={{ marginBottom: '40px' }}>
        <h3>📧 邮件模板编辑</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h4>编辑器</h4>
            <VariableInput
              treeData={emailVariables}
              onChange={setEmailContent}
              style={{ width: '100%', minHeight: '200px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h4>预览</h4>
            <div
              style={{
                border: '1px solid #ddd',
                padding: '15px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                minHeight: '200px',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            >
              {emailContent || '请输入邮件内容...'}
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              提取的变量: {parseVariables(emailContent).join(', ') || '无'}
            </div>
          </div>
        </div>
      </div>

      {/* 合同模板示例 */}
      <div style={{ marginBottom: '40px' }}>
        <h3>📄 合同模板编辑</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h4>编辑器</h4>
            <VariableInput
              treeData={contractVariables}
              onChange={setContractContent}
              style={{ width: '100%', minHeight: '180px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h4>预览</h4>
            <div
              style={{
                border: '1px solid #ddd',
                padding: '15px',
                backgroundColor: '#fff',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                minHeight: '180px',
                fontSize: '14px',
                lineHeight: '1.6',
              }}
            >
              {contractContent || '请输入合同内容...'}
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              提取的变量: {parseVariables(contractContent).join(', ') || '无'}
            </div>
          </div>
        </div>
      </div>

      {/* 代码模板示例 */}
      <div style={{ marginBottom: '40px' }}>
        <h3>💻 代码模板编辑</h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h4>编辑器</h4>
            <VariableInput
              treeData={codeVariables}
              onChange={setCodeContent}
              style={{ width: '100%', minHeight: '160px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <h4>预览</h4>
            <div
              style={{
                border: '1px solid #ddd',
                padding: '15px',
                backgroundColor: '#2d2d2d',
                color: '#f8f8f2',
                borderRadius: '4px',
                whiteSpace: 'pre-wrap',
                minHeight: '160px',
                fontSize: '14px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                lineHeight: '1.6',
              }}
            >
              {codeContent ||
                '// 请输入代码内容...\nfunction exampleFunction() {\n  // 使用 {{functionName}} 插入函数名\n  // 使用 {{returnType}} 指定返回类型\n}'}
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              提取的变量: {parseVariables(codeContent).join(', ') || '无'}
            </div>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div
        style={{
          border: '1px solid #1890ff',
          padding: '15px',
          backgroundColor: '#e6f7ff',
          borderRadius: '4px',
        }}
      >
        <h4>💡 自定义数据使用说明</h4>
        <ul style={{ lineHeight: '1.8' }}>
          <li>
            每个场景使用不同的 <code>treeData</code> 变量数据结构
          </li>
          <li>变量支持三级嵌套结构（父级 → 子级 → 叶子节点）</li>
          <li>
            每个节点需要 <code>title</code>（显示名称）和 <code>key</code>
            （唯一标识）
          </li>
          <li>
            键名建议使用有意义的命名，如 <code>customerName</code> 而不是简单的{' '}
            <code>name</code>
          </li>
          <li>可以根据业务需求灵活组织变量分类和层级结构</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomDataExample;
