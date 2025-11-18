/*
 * 滚动同步测试页面
 * 用于验证PromptVariableRef组件的滚动同步功能
 */

import PromptVariableRef from '@/components/PromptVariableRef';
import type {
  PromptVariable,
  VariableType,
} from '@/components/PromptVariableRef/types';
import { Alert, Button, Card, Space, Typography } from 'antd';
import React, { useState } from 'react';

const { Title, Paragraph, Text } = Typography;

export const ScrollSyncTestPage: React.FC = () => {
  const [value, setValue] = useState('');
  const [testLogs, setTestLogs] = useState<string[]>([]);

  // 添加测试日志
  const addTestLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setTestLogs((prev) => [...prev.slice(-9), logMessage]); // 保留最近10条日志
    console.log('ScrollSyncTest:', message);
  };

  // 示例变量数据 - 包含大量变量以触发滚动
  const variables: PromptVariable[] = [
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
          key: 'phone',
          type: VariableType.String,
          name: '电话号码',
          description: '用户电话号码',
        },
        {
          key: 'address',
          type: VariableType.String,
          name: '地址',
          description: '用户家庭地址',
        },
        {
          key: 'city',
          type: VariableType.String,
          name: '城市',
          description: '用户所在城市',
        },
        {
          key: 'country',
          type: VariableType.String,
          name: '国家',
          description: '用户所在国家',
        },
        {
          key: 'birthDate',
          type: VariableType.Date,
          name: '出生日期',
          description: '用户出生日期',
        },
        {
          key: 'gender',
          type: VariableType.String,
          name: '性别',
          description: '用户性别',
        },
        {
          key: 'occupation',
          type: VariableType.String,
          name: '职业',
          description: '用户职业',
        },
      ],
    },
    {
      key: 'product',
      type: VariableType.Object,
      name: '产品信息',
      description: '产品相关数据',
      children: [
        {
          key: 'name',
          type: VariableType.String,
          name: '产品名称',
          description: '产品的名称',
        },
        {
          key: 'price',
          type: VariableType.Number,
          name: '价格',
          description: '产品价格',
        },
        {
          key: 'description',
          type: VariableType.String,
          name: '产品描述',
          description: '产品的详细描述',
        },
        {
          key: 'category',
          type: VariableType.String,
          name: '分类',
          description: '产品分类',
        },
        {
          key: 'brand',
          type: VariableType.String,
          name: '品牌',
          description: '产品品牌',
        },
        {
          key: 'rating',
          type: VariableType.Number,
          name: '评分',
          description: '产品评分',
        },
        {
          key: 'inStock',
          type: VariableType.Boolean,
          name: '库存状态',
          description: '是否有库存',
        },
        {
          key: 'weight',
          type: VariableType.Number,
          name: '重量',
          description: '产品重量',
        },
        {
          key: 'dimensions',
          type: VariableType.String,
          name: '尺寸',
          description: '产品尺寸',
        },
        {
          key: 'color',
          type: VariableType.String,
          name: '颜色',
          description: '产品颜色',
        },
      ],
    },
    {
      key: 'order',
      type: VariableType.Object,
      name: '订单信息',
      description: '订单相关数据',
      children: [
        {
          key: 'id',
          type: VariableType.String,
          name: '订单号',
          description: '唯一订单标识符',
        },
        {
          key: 'total',
          type: VariableType.Number,
          name: '订单总额',
          description: '订单总金额',
        },
        {
          key: 'status',
          type: VariableType.String,
          name: '订单状态',
          description: '当前订单状态',
        },
        {
          key: 'date',
          type: VariableType.Date,
          name: '订单日期',
          description: '下单日期',
        },
        {
          key: 'shippingAddress',
          type: VariableType.String,
          name: '收货地址',
          description: '订单收货地址',
        },
        {
          key: 'paymentMethod',
          type: VariableType.String,
          name: '支付方式',
          description: '支付方法',
        },
        {
          key: 'trackingNumber',
          type: VariableType.String,
          name: '物流单号',
          description: '快递跟踪号码',
        },
        {
          key: 'estimatedDelivery',
          type: VariableType.Date,
          name: '预计送达',
          description: '预计送达日期',
        },
        {
          key: 'discount',
          type: VariableType.Number,
          name: '折扣',
          description: '订单折扣金额',
        },
        {
          key: 'tax',
          type: VariableType.Number,
          name: '税费',
          description: '订单税费',
        },
      ],
    },
  ];

  // 添加测试操作
  const addLongText = () => {
    const longText = `这是一个很长的文本用于测试滚动同步功能。
    
当我们输入很长的内容时，输入框会出现滚动条。
此时高亮层（highlight layer）必须与输入框同步滚动。
    
请在下面的输入框中：
1. 输入一些{{变量名}}来测试变量引用
2. 滚动内容查看高亮层是否同步
3. 测试自动补全功能在滚动状态下的表现
    
变量包括：
{{user.name}} - 用户姓名
{{user.email}} - 用户邮箱
{{user.phone}} - 用户电话
{{product.name}} - 产品名称
{{product.price}} - 产品价格
{{order.id}} - 订单号
{{order.total}} - 订单总额
    
请输入更多内容以触发滚动：
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

继续添加更多内容来测试垂直和水平滚动：
This is a very long line of text that will definitely trigger horizontal scrolling in the text area. It contains many words and characters to test the horizontal scroll synchronization between the input layer and the highlight layer. The quick brown fox jumps over the lazy dog near the river bank where the old man sits and fishes. The quick brown fox jumps over the lazy dog near the river bank where the old man sits and fishes.

更多测试内容：
当输入框内容超过容器大小时，应该出现滚动条。
此时高亮层必须与输入框保持完全同步。
这样才能确保光标位置和下拉框位置都正确计算。
`;

    setValue((prev) => prev + longText);
    addTestLog('添加了长文本内容');
  };

  const clearText = () => {
    setValue('');
    addTestLog('清空了文本内容');
  };

  const addVariableExample = () => {
    const example =
      '你好，{{user.name}}！你的订单{{order.id}}总金额为{{order.total}}元。';
    setValue((prev) => prev + example);
    addTestLog('添加了变量引用示例');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>🔄 滚动同步功能测试页面</Title>

      <Alert
        message="测试目标"
        description="验证PromptVariableRef组件的输入框和高亮层滚动同步功能，包括垂直滚动、水平滚动以及自动补全时的位置计算。"
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 控制面板 */}
        <Card title="🛠️ 测试控制面板" size="small">
          <Space wrap>
            <Button onClick={addLongText} type="primary">
              添加长文本（触发滚动）
            </Button>
            <Button onClick={addVariableExample} type="default">
              添加变量示例
            </Button>
            <Button onClick={clearText} danger>
              清空内容
            </Button>
          </Space>
        </Card>

        {/* 主要测试区域 */}
        <Card title="📝 滚动同步测试区域" style={{ height: '600px' }}>
          <div
            style={{
              height: '500px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Paragraph>
              <Text strong>测试说明：</Text>
              <br />
              1. 使用上方按钮添加测试内容
              <br />
              2. 观察输入框出现滚动条时高亮层是否同步
              <br />
              3. 测试输入 <Text code>{`{{`}</Text> 时自动补全是否在正确位置
              <br />
              4. 滚动时检查下拉框位置是否正确
            </Paragraph>

            <div style={{ flex: 1, minHeight: 0 }}>
              <PromptVariableRef
                variables={variables}
                value={value}
                onChange={(newValue) => {
                  setValue(newValue);
                  addTestLog(`文本内容更新，长度: ${newValue.length}`);
                }}
                placeholder="在此输入大量文本以测试滚动同步功能..."
                style={{
                  height: '100%',
                  minHeight: '300px',
                }}
                className="scroll-sync-test"
              />
            </div>
          </div>
        </Card>

        {/* 测试日志 */}
        <Card title="📊 测试日志" size="small" style={{ height: '200px' }}>
          <div
            style={{
              height: '120px',
              overflow: 'auto',
              background: '#f5f5f5',
              padding: '10px',
              fontFamily: 'Monaco, Menlo, monospace',
              fontSize: '12px',
            }}
          >
            {testLogs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px' }}>
                {log}
              </div>
            ))}
            {testLogs.length === 0 && (
              <div style={{ color: '#999' }}>暂无测试日志，请开始测试...</div>
            )}
          </div>
        </Card>

        {/* 测试结果说明 */}
        <Card title="✅ 成功标准" size="small">
          <Space direction="vertical">
            <Text>• 输入框滚动时，高亮层必须完全同步滚动</Text>
            <Text>• 自动补全下拉框在滚动状态下位置正确</Text>
            <Text>• 光标位置计算考虑滚动偏移量</Text>
            <Text>• 垂直和水平滚动都能正确同步</Text>
            <Text>• 滚动操作流畅，无明显延迟或闪烁</Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default ScrollSyncTestPage;
