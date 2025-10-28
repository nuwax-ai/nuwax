import { Button, Card, Divider, Input, Space, Switch } from 'antd';
import React, { useRef, useState } from 'react';
import SmartVariableInput, { SmartVariableInputRef } from './index';
import { PathBuildOptions, TreeNodeData } from './utils';

/**
 * SmartVariableInput 组件使用示例
 * 展示如何获取完整的树路径和自定义路径构建选项
 */
const SmartVariableInputDemo: React.FC = () => {
  const inputRef = useRef<SmartVariableInputRef>(null);

  // 路径构建选项状态
  const [pathOptions, setPathOptions] = useState<PathBuildOptions>({
    arrayIndexPlaceholder: '0',
    pathSeparator: '.',
    wrapWithBraces: true,
    includeArrayBrackets: true,
  });

  // 示例数据：包含对象和数组类型的变量
  const variableData: TreeNodeData[] = [
    {
      key: 'user',
      title: 'user',
      dataType: 'object',
      description: '用户信息对象',
      children: [
        {
          key: 'user.name',
          title: 'name',
          dataType: 'string',
          description: '用户姓名',
        },
        {
          key: 'user.email',
          title: 'email',
          dataType: 'string',
          description: '用户邮箱',
        },
        {
          key: 'user.age',
          title: 'age',
          dataType: 'number',
          description: '用户年龄',
        },
        {
          key: 'user.isActive',
          title: 'isActive',
          dataType: 'boolean',
          description: '是否激活',
        },
      ],
    },
    {
      key: 'products',
      title: 'products',
      isArray: true, // 标识为数组类型
      dataType: 'array',
      description: '产品列表数组',
      children: [
        {
          key: 'products.name',
          title: 'name',
          dataType: 'string',
          description: '产品名称',
        },
        {
          key: 'products.price',
          title: 'price',
          dataType: 'number',
          description: '产品价格',
        },
        {
          key: 'products.category',
          title: 'category',
          dataType: 'string',
          description: '产品分类',
        },
        {
          key: 'products.inStock',
          title: 'inStock',
          dataType: 'boolean',
          description: '是否有库存',
        },
      ],
    },
    {
      key: 'order',
      title: 'order',
      dataType: 'object',
      description: '订单信息对象',
      children: [
        {
          key: 'order.id',
          title: 'id',
          dataType: 'string',
          description: '订单ID',
        },
        {
          key: 'order.total',
          title: 'total',
          dataType: 'number',
          description: '订单总额',
        },
        {
          key: 'order.items',
          title: 'items',
          isArray: true, // 嵌套数组
          dataType: 'array',
          description: '订单项目数组',
          children: [
            {
              key: 'order.items.name',
              title: 'name',
              dataType: 'string',
              description: '商品名称',
            },
            {
              key: 'order.items.quantity',
              title: 'quantity',
              dataType: 'number',
              description: '商品数量',
            },
            {
              key: 'order.items.price',
              title: 'price',
              dataType: 'number',
              description: '商品单价',
            },
          ],
        },
        {
          key: 'order.customer',
          title: 'customer',
          dataType: 'object',
          description: '客户信息',
          children: [
            {
              key: 'order.customer.name',
              title: 'name',
              dataType: 'string',
              description: '客户姓名',
            },
            {
              key: 'order.customer.phone',
              title: 'phone',
              dataType: 'string',
              description: '客户电话',
            },
          ],
        },
      ],
    },
    {
      key: 'config',
      title: 'config',
      dataType: 'object',
      description: '配置信息对象',
      children: [
        {
          key: 'config.theme',
          title: 'theme',
          dataType: 'string',
          description: '主题设置',
        },
        {
          key: 'config.settings',
          title: 'settings',
          dataType: 'object',
          description: '详细设置',
          children: [
            {
              key: 'config.settings.language',
              title: 'language',
              dataType: 'string',
              description: '语言设置',
            },
            {
              key: 'config.settings.timezone',
              title: 'timezone',
              dataType: 'string',
              description: '时区设置',
            },
            {
              key: 'config.settings.notifications',
              title: 'notifications',
              dataType: 'boolean',
              description: '通知开关',
            },
          ],
        },
      ],
    },
  ];

  // 处理按钮点击事件
  const handleShowPopover = () => {
    inputRef.current?.showPopover();
  };

  const handleGetContent = () => {
    const content = inputRef.current?.getContent();
    console.log('当前内容:', content);
    alert(`当前内容: ${content}`);
  };

  const handleSetContent = () => {
    inputRef.current?.setContent(
      '这是预设的内容 {{user.name}} 和 {{products[0].price}}',
    );
  };

  const handleInsertVariable = () => {
    inputRef.current?.insertVariable('user.email');
  };

  // 更新路径选项
  const updatePathOption = (key: keyof PathBuildOptions, value: any) => {
    setPathOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>SmartVariableInput 完整路径演示</h2>

      <Card title="路径构建选项" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ minWidth: 120 }}>数组索引占位符:</span>
            <Input
              value={pathOptions.arrayIndexPlaceholder}
              onChange={(e) =>
                updatePathOption('arrayIndexPlaceholder', e.target.value)
              }
              style={{ width: 100 }}
              placeholder="0"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ minWidth: 120 }}>路径分隔符:</span>
            <Input
              value={pathOptions.pathSeparator}
              onChange={(e) =>
                updatePathOption('pathSeparator', e.target.value)
              }
              style={{ width: 100 }}
              placeholder="."
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ minWidth: 120 }}>包装双大括号:</span>
            <Switch
              checked={pathOptions.wrapWithBraces}
              onChange={(checked) =>
                updatePathOption('wrapWithBraces', checked)
              }
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ minWidth: 120 }}>包含数组括号:</span>
            <Switch
              checked={pathOptions.includeArrayBrackets}
              onChange={(checked) =>
                updatePathOption('includeArrayBrackets', checked)
              }
            />
          </div>
        </Space>
      </Card>

      <Card title="预期路径格式" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, lineHeight: '1.6' }}>
          <p>
            <strong>当前配置下的路径格式：</strong>
          </p>
          <ul>
            <li>
              对象属性：<code>user.name</code> →
              <code style={{ color: '#1890ff', marginLeft: 8 }}>
                {pathOptions.wrapWithBraces ? '{{user.name}}' : 'user.name'}
              </code>
            </li>
            <li>
              数组元素：<code>products.name</code> →
              <code style={{ color: '#1890ff', marginLeft: 8 }}>
                {pathOptions.wrapWithBraces
                  ? `{{products${
                      pathOptions.includeArrayBrackets
                        ? `[${pathOptions.arrayIndexPlaceholder}]`
                        : ''
                    }${pathOptions.pathSeparator}name}}`
                  : `products${
                      pathOptions.includeArrayBrackets
                        ? `[${pathOptions.arrayIndexPlaceholder}]`
                        : ''
                    }${pathOptions.pathSeparator}name`}
              </code>
            </li>
            <li>
              嵌套对象：<code>config.settings.language</code> →
              <code style={{ color: '#1890ff', marginLeft: 8 }}>
                {pathOptions.wrapWithBraces
                  ? `{{config${pathOptions.pathSeparator}settings${pathOptions.pathSeparator}language}}`
                  : `config${pathOptions.pathSeparator}settings${pathOptions.pathSeparator}language`}
              </code>
            </li>
            <li>
              嵌套数组：<code>order.items.name</code> →
              <code style={{ color: '#1890ff', marginLeft: 8 }}>
                {pathOptions.wrapWithBraces
                  ? `{{order${pathOptions.pathSeparator}items${
                      pathOptions.includeArrayBrackets
                        ? `[${pathOptions.arrayIndexPlaceholder}]`
                        : ''
                    }${pathOptions.pathSeparator}name}}`
                  : `order${pathOptions.pathSeparator}items${
                      pathOptions.includeArrayBrackets
                        ? `[${pathOptions.arrayIndexPlaceholder}]`
                        : ''
                    }${pathOptions.pathSeparator}name`}
              </code>
            </li>
          </ul>
        </div>
      </Card>

      <div style={{ marginBottom: 16 }}>
        <SmartVariableInput
          ref={inputRef}
          variables={variableData}
          pathOptions={pathOptions}
          placeholder="输入 { 或 {{ 来触发变量选择，或点击下方按钮手动打开..."
        />
      </div>

      <Space wrap>
        <Button type="primary" onClick={handleShowPopover}>
          显示变量选择器
        </Button>
        <Button onClick={handleGetContent}>获取内容</Button>
        <Button onClick={handleSetContent}>设置预设内容</Button>
        <Button onClick={handleInsertVariable}>插入变量 (user.email)</Button>
      </Space>

      <Divider />

      <Card title="使用说明" size="small">
        <ol style={{ fontSize: 14, lineHeight: '1.6' }}>
          <li>
            在输入框中输入 <code>{'{'}</code> 或 <code>{'{{'}</code>{' '}
            会自动触发变量选择器
          </li>
          <li>
            选择树节点时，会根据配置的选项自动构建完整路径：
            <ul>
              <li>
                普通对象使用配置的分隔符：
                <code>parent{pathOptions.pathSeparator}child</code>
              </li>
              <li>
                数组类型根据配置使用索引语法：
                <code>
                  parent[{pathOptions.arrayIndexPlaceholder}]
                  {pathOptions.pathSeparator}child
                </code>
              </li>
            </ul>
          </li>
          <li>只有叶子节点（没有子节点的节点）才能被选择插入</li>
          <li>
            插入的变量会根据配置决定是否包装为 <code>{'{{variable}}'}</code>{' '}
            格式
          </li>
          <li>支持自定义数组索引占位符、路径分隔符等选项</li>
        </ol>
      </Card>

      <Card title="数据结构示例" size="small" style={{ marginTop: 16 }}>
        <pre
          style={{
            fontSize: 12,
            background: '#f5f5f5',
            padding: 12,
            borderRadius: 4,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(variableData, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default SmartVariableInputDemo;
