/**
 * VariableInput 模板应用示例
 * 展示在实际业务场景中的应用，包括邮件、合同、代码等模板
 */

import type { DataNode } from 'antd/es/tree';
import React, { useState } from 'react';
import VariableInput from '../index';

interface TemplateVariable {
  name: string;
  value: string;
  description: string;
}

const TemplateDemoExample: React.FC = () => {
  const [activeTab, setActiveTab] = useState('email');
  const [templates, setTemplates] = useState<{ [key: string]: string }>({
    email: '',
    contract: '',
    notification: '',
  });
  const [variableValues, setVariableValues] = useState<{
    [key: string]: TemplateVariable;
  }>({});

  // 不同模板的变量数据
  const templateVariables: { [key: string]: DataNode[] } = {
    email: [
      {
        title: '客户信息',
        key: 'customer',
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
          { title: '商品名称', key: 'productName' },
          { title: '订单金额', key: 'orderAmount' },
          { title: '订单日期', key: 'orderDate' },
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
    ],
    contract: [
      {
        title: '合同主体',
        key: 'parties',
        children: [
          { title: '甲方公司', key: 'companyA' },
          { title: '乙方公司', key: 'companyB' },
          { title: '法定代表人', key: 'legalRep' },
        ],
      },
      {
        title: '合同详情',
        key: 'details',
        children: [
          { title: '合同编号', key: 'contractNumber' },
          { title: '合同金额', key: 'contractAmount' },
          { title: '合同期限', key: 'contractPeriod' },
          { title: '签署日期', key: 'signDate' },
        ],
      },
    ],
    notification: [
      {
        title: '系统信息',
        key: 'system',
        children: [
          { title: '系统名称', key: 'systemName' },
          { title: '当前时间', key: 'currentTime' },
          { title: '服务器状态', key: 'serverStatus' },
        ],
      },
      {
        title: '用户信息',
        key: 'user',
        children: [
          { title: '用户名', key: 'username' },
          { title: '用户ID', key: 'userId' },
          { title: '登录时间', key: 'loginTime' },
        ],
      },
    ],
  };

  // 模板示例
  const templateExamples: { [key: string]: string } = {
    email: `尊敬的 {{customerName}}：

感谢您选择我们的服务！您的订单 {{orderNumber}} 已经确认。

商品名称：{{productName}}
订单金额：¥{{orderAmount}}
下单日期：{{orderDate}}

如有任何疑问，请联系客服：{{servicePhone}}

此致
敬礼
{{companyName}}`,

    contract: `合同编号：{{contractNumber}}

甲方：{{companyA}}
乙方：{{companyB}}
法定代表人：{{legalRep}}

一、合同金额
本合同总金额为人民币 {{contractAmount}} 元。

二、合同期限
合同期限为 {{contractPeriod}}，自 {{signDate}} 起生效。

三、其他条款
双方应严格按照合同约定履行各自义务。

甲方（盖章）：{{companyA}}
乙方（盖章）：{{companyB}}

签署日期：{{signDate}}`,

    notification: `系统通知 - {{systemName}}

尊敬的用户 {{username}}（ID：{{userId}}）：

您于 {{loginTime}} 成功登录系统。
当前系统状态：{{serverStatus}}
当前时间：{{currentTime}}

如有异常情况，请及时联系管理员。

系统管理员`,
  };

  // 默认变量值
  const defaultVariableValues: TemplateVariable[] = [
    { name: 'customerName', value: '张三', description: '客户姓名' },
    {
      name: 'customerEmail',
      value: 'zhangsan@example.com',
      description: '客户邮箱',
    },
    { name: 'orderNumber', value: 'ORD-2024-001', description: '订单编号' },
    { name: 'productName', value: '高级会员服务', description: '商品名称' },
    { name: 'orderAmount', value: '199.00', description: '订单金额' },
    { name: 'companyName', value: '示例科技有限公司', description: '公司名称' },
    { name: 'servicePhone', value: '400-123-4567', description: '客服电话' },
  ];

  // 初始化变量值
  React.useEffect(() => {
    const values: { [key: string]: TemplateVariable } = {};
    defaultVariableValues.forEach((item) => {
      values[item.name] = item;
    });
    setVariableValues(values);
  }, []);

  // 切换模板标签
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // 更新模板内容
  const handleTemplateChange = (templateId: string, content: string) => {
    setTemplates((prev) => ({
      ...prev,
      [templateId]: content,
    }));
  };

  // 渲染最终模板（替换变量）
  const renderFinalTemplate = (content: string) => {
    return content.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variableValues[varName]?.value || match;
    });
  };

  // 提取模板中的变量
  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{(\w+)\}\}/g);
    return matches ? matches.map((match) => match.replace(/[{}]/g, '')) : [];
  };

  const currentVariables = extractVariables(templates[activeTab]);

  return (
    <div style={{ padding: '20px', maxWidth: '1400px' }}>
      <h2>VariableInput 模板应用演示</h2>

      {/* 标签页导航 */}
      <div
        style={{
          display: 'flex',
          borderBottom: '2px solid #f0f0f0',
          marginBottom: '20px',
        }}
      >
        {Object.keys(templateVariables).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => handleTabChange(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab ? '#1890ff' : 'transparent',
              color: activeTab === tab ? 'white' : '#666',
              cursor: 'pointer',
              fontSize: '16px',
              borderRadius: '4px 4px 0 0',
              marginRight: '2px',
            }}
          >
            {tab === 'email' && '📧 邮件模板'}
            {tab === 'contract' && '📄 合同模板'}
            {tab === 'notification' && '🔔 系统通知'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 左侧：模板编辑器 */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3>模板编辑器</h3>
            <button
              type="button"
              onClick={() =>
                handleTemplateChange(activeTab, templateExamples[activeTab])
              }
              style={{
                padding: '6px 12px',
                border: '1px solid #d9d9d9',
                background: 'white',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              加载示例模板
            </button>
          </div>

          <VariableInput
            treeData={templateVariables[activeTab]}
            onChange={(content) => handleTemplateChange(activeTab, content)}
            style={{
              width: '100%',
              minHeight: '400px',
              border: '1px solid #d9d9d9',
            }}
          />

          {/* 变量列表 */}
          {currentVariables.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>模板变量配置</h4>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {currentVariables.map((varName) => (
                  <div
                    key={varName}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '10px',
                      padding: '8px',
                      border: '1px solid #f0f0f0',
                      borderRadius: '4px',
                    }}
                  >
                    <label
                      style={{
                        minWidth: '120px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#666',
                      }}
                    >
                      {varName}:
                    </label>
                    <input
                      type="text"
                      value={variableValues[varName]?.value || ''}
                      onChange={(e) =>
                        setVariableValues((prev) => ({
                          ...prev,
                          [varName]: {
                            ...prev[varName],
                            name: varName,
                            value: e.target.value,
                            description: varName,
                          },
                        }))
                      }
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                      placeholder={`请输入${varName}的值`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：预览和导出 */}
        <div style={{ flex: 1 }}>
          <h3>最终预览</h3>
          <div
            style={{
              border: '1px solid #d9d9d9',
              padding: '20px',
              backgroundColor: '#fafafa',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              minHeight: '400px',
              fontSize: '14px',
              lineHeight: '1.6',
              marginBottom: '20px',
            }}
          >
            {renderFinalTemplate(templates[activeTab]) ||
              '请在左侧编辑器中输入内容...'}
          </div>

          {/* 导出选项 */}
          <div
            style={{
              border: '1px solid #52c41a',
              padding: '15px',
              backgroundColor: '#f6ffed',
              borderRadius: '4px',
            }}
          >
            <h4>📤 导出选项</h4>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  const content = renderFinalTemplate(templates[activeTab]);
                  const blob = new Blob([content], {
                    type: 'text/plain;charset=utf-8',
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${activeTab}-template.txt`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#52c41a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                下载TXT
              </button>
              <button
                type="button"
                onClick={() => {
                  const content = renderFinalTemplate(templates[activeTab]);
                  navigator.clipboard.writeText(content);
                  alert('内容已复制到剪贴板！');
                }}
                style={{
                  padding: '8px 16px',
                  background: '#1890ff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                复制内容
              </button>
            </div>
          </div>

          {/* 模板统计 */}
          <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
            <div>模板长度: {templates[activeTab].length} 字符</div>
            <div>变量数量: {currentVariables.length} 个</div>
            <div>
              已配置变量:{' '}
              {currentVariables.filter((v) => variableValues[v]?.value).length}{' '}
              个
            </div>
          </div>
        </div>
      </div>

      {/* 使用指南 */}
      <div
        style={{
          marginTop: '30px',
          border: '1px solid #faad14',
          padding: '15px',
          backgroundColor: '#fffbe6',
          borderRadius: '4px',
        }}
      >
        <h4>💡 使用指南</h4>
        <ol style={{ lineHeight: '1.8', fontSize: '14px' }}>
          <li>
            在编辑器中输入 <code>{'{'}</code> 字符触发变量选择
          </li>
          <li>选择合适的变量插入到模板中</li>
          <li>在右侧配置每个变量的实际值</li>
          <li>预览区域会实时显示最终的模板效果</li>
          <li>可以导出为TXT文件或复制到剪贴板</li>
          <li>点击&ldquo;加载示例模板&rdquo;查看预设模板</li>
        </ol>
      </div>
    </div>
  );
};

export default TemplateDemoExample;
