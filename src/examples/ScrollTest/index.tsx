/*
 * 滚动条定位测试页面
 * 用于验证 PromptVariableRef 组件在输入框滚动时的下拉框定位修复
 */

import { Alert, Button, Card, Space, Typography } from 'antd';
import React, { useState } from 'react';
import PromptVariableRef from '../../components/PromptVariableRef';
import {
  type PromptVariable,
  VariableType,
} from '../../components/PromptVariableRef/types';

const { Title, Paragraph } = Typography;

const ScrollTestExample: React.FC = () => {
  const [promptValue, setPromptValue] = useState('');

  // 创建大量测试变量用于生成长文本
  const generateTestVariables = (): PromptVariable[] => {
    const variables: PromptVariable[] = [];

    // 生成多个用户信息
    for (let i = 0; i < 10; i++) {
      variables.push({
        key: `user${i}`,
        type: VariableType.Object,
        name: `用户${i + 1}信息`,
        description: `第${i + 1}个用户的详细信息`,
        children: [
          {
            key: 'id',
            type: VariableType.String,
            name: '用户ID',
            description: '唯一标识符',
          },
          {
            key: 'name',
            type: VariableType.String,
            name: '用户名',
            description: '用户真实姓名',
          },
          {
            key: 'email',
            type: VariableType.String,
            name: '邮箱地址',
            description: '用户邮箱',
          },
          {
            key: 'phone',
            type: VariableType.String,
            name: '手机号码',
            description: '用户手机号',
          },
          {
            key: 'address',
            type: VariableType.String,
            name: '详细地址',
            description: '用户居住地址',
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
                name: '头像URL',
                description: '用户头像链接',
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
                description: '用户偏好配置',
                children: [
                  {
                    key: 'language',
                    type: VariableType.String,
                    name: '首选语言',
                    description: '用户语言偏好',
                  },
                  {
                    key: 'theme',
                    type: VariableType.String,
                    name: '界面主题',
                    description: '界面主题偏好',
                  },
                  {
                    key: 'notifications',
                    type: VariableType.Boolean,
                    name: '通知设置',
                    description: '是否开启通知',
                  },
                ],
              },
            ],
          },
        ],
      });
    }

    return variables;
  };

  const testVariables = generateTestVariables();

  const insertLongText = () => {
    const longText = `这是一个很长的文本段落，用于测试输入框的滚动功能。
当我们输入大量内容时，输入框会出现滚动条，这时变量引用下拉框的定位就会变得非常重要。
请在下面的输入框中输入 {{ 符号来测试变量引用功能。

您可以尝试以下操作来测试滚动条定位修复：
1. 在输入框中输入 {{ 来触发变量选择菜单
2. 上下左右滚动输入框
3. 观察下拉框是否始终跟随光标位置
4. 选择不同的变量，观察定位是否准确

用户信息：{{user0.name}} 居住地址：{{user0.address}}
用户邮箱：{{user0.email}} 手机号：{{user0.phone}}
个人简介：{{user0.profile.bio}}
头像链接：{{user0.profile.avatar}}
语言偏好：{{user0.profile.preferences.language}}
主题设置：{{user0.profile.preferences.theme}}
通知状态：{{user0.profile.preferences.notifications}}

另一个用户的信息：{{user1.name}} 居住地址：{{user1.address}}
用户邮箱：{{user1.email}} 手机号：{{user1.phone}}
个人简介：{{user1.profile.bio}}
头像链接：{{user1.profile.avatar}}
语言偏好：{{user1.profile.preferences.language}}
主题设置：{{user1.profile.preferences.theme}}
通知状态：{{user1.profile.preferences.notifications}}

继续添加更多内容来测试滚动功能，确保输入框能够正确显示滚动条。
当内容足够多时，输入框会出现垂直滚动条和水平滚动条。
这时我们希望变量引用下拉框能够正确跟随光标位置，
不管输入框滚动到什么位置都能准确显示。

测试变量引用：{{user2.name}}, {{user3.email}}, {{user4.profile.preferences.language}}

🆕 新功能测试：一次性删除高亮区块
- 当光标在高亮区块 {{user0.name}} 中时，按退格键会一次性删除整个高亮区块
- 同样地，按删除键也会一次性删除整个高亮区块
- 高亮区块有闪电图标和hover提示「← 一次删除」
- 这让删除变量引用变得更加方便！`;

    setPromptValue(longText);
  };

  const insertCursorTest = () => {
    // 在中间插入一些内容，便于测试光标位置的变量引用
    const testText = `开始测试文本 {{user0.name`;

    setPromptValue((prev) => prev + testText);
  };

  const clearAll = () => {
    setPromptValue('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Title level={2}>PromptVariableRef 滚动条定位测试</Title>
        <Paragraph>
          此页面用于测试修复后的 PromptVariableRef
          组件在输入框滚动时的下拉框定位功能。
        </Paragraph>

        <Alert
          message="测试说明"
          description={
            <div>
              <p>• 点击「插入长文本」按钮生成大量内容，触发输入框滚动条</p>
              <p>
                • 在输入框中输入 <code>{'{{'}</code> 符号来触发变量选择菜单
              </p>
              <p>• 上下左右滚动输入框，观察下拉框是否始终跟随光标位置</p>
              <p>• 选择不同的变量，验证定位精度</p>
              <p>
                • 🆕 <strong>新功能</strong>：将光标放在高亮区块如{' '}
                <code>{'{{user0.name}}'}</code>{' '}
                中，按退格键或删除键体验一次性删除功能
              </p>
              <p>• 在控制台查看调试信息，确认滚动偏移被正确计算</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
      </div>

      <Card title="测试工具" size="small" style={{ marginBottom: '20px' }}>
        <Space wrap>
          <Button onClick={insertLongText}>插入长文本</Button>
          <Button onClick={insertCursorTest}>在光标处测试</Button>
          <Button onClick={clearAll}>清空内容</Button>
          <Button
            onClick={() => console.log('当前变量数量:', testVariables.length)}
          >
            调试信息
          </Button>
        </Space>
      </Card>

      <Card title="变量引用组件测试区域" size="small">
        <div style={{ marginBottom: '16px' }}>
          <Paragraph strong>当前内容长度：</Paragraph>
          <code>{promptValue.length} 字符</code>
        </div>

        <PromptVariableRef
          variables={testVariables}
          value={promptValue}
          onChange={setPromptValue}
          placeholder="输入提示词，使用 {{变量名}} 引用变量..."
          style={{
            width: '100%',
            minHeight: '200px',
          }}
        />

        <div style={{ marginTop: '16px' }}>
          <Paragraph strong>当前值预览：</Paragraph>
          <div
            style={{
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              maxHeight: '150px',
              overflow: 'auto',
              fontFamily: 'Monaco, Menlo, monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap',
            }}
          >
            {promptValue || '（空）'}
          </div>
        </div>
      </Card>

      <Card title="测试检查清单" size="small" style={{ marginTop: '20px' }}>
        <div style={{ fontSize: '14px' }}>
          <p>✅ 在输入框顶部输入 {'{{'} 并选择变量，下拉框位置正确</p>
          <p>✅ 在输入框中部输入 {'{{'} 并选择变量，下拉框位置正确</p>
          <p>✅ 在输入框底部输入 {'{{'} 并选择变量，下拉框位置正确</p>
          <p>✅ 垂直滚动输入框后，{'{{'} 的下拉框位置跟随光标</p>
          <p>✅ 水平滚动输入框后，{'{{'} 的下拉框位置跟随光标</p>
          <p>✅ 同时水平和垂直滚动时，下拉框位置准确</p>
          <p>✅ 选择变量后光标移动到正确位置</p>
          <p>✅ 键盘导航在不同滚动位置下正常工作</p>
          <p>🆕 ✅ 高亮区块显示闪电图标和hover提示</p>
          <p>🆕 ✅ 将光标放在高亮区块中，按退格键一次性删除整个区块</p>
          <p>🆕 ✅ 将光标放在高亮区块中，按删除键一次性删除整个区块</p>
          <p>🆕 ✅ 高亮区块删除后，光标正确移动到删除位置</p>
          <p>🆕 ✅ 光标在高亮区块外部时，正常删除行为不受影响</p>
        </div>
      </Card>
    </div>
  );
};

export default ScrollTestExample;
