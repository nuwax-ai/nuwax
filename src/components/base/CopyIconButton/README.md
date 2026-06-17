# CopyIconButton 拷贝图标按钮组件

一个简洁的拷贝图标按钮组件，使用统一的拷贝工具函数，提供一致的用户体验。

## 🚀 快速开始

```typescript
import CopyIconButton from '@/components/base/CopyIconButton';

// 基本用法
<CopyIconButton data={{ name: '张三', age: 25 }} />

// 拷贝文本
<CopyIconButton text="要复制的文本" />

// 自定义配置
<CopyIconButton
  data={{ name: '张三', age: 25 }}
  jsonSpace={4}
  showMessage={false}
  buttonType="primary"
  buttonSize="middle"
/>
```

## 📚 API 说明

### Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `text` | 要复制的文本内容 | `string` | - |
| `data` | 要复制的 JSON 数据 | `Record<string, any> \| any[]` | - |
| `onCopy` | 复制成功后的回调函数 | `(text: string, result: boolean) => void` | - |
| `buttonType` | 按钮类型 | `'text' \| 'link' \| 'default' \| 'primary' \| 'dashed'` | `'text'` |
| `buttonSize` | 按钮大小 | `'large' \| 'middle' \| 'small'` | `'small'` |
| `showMessage` | 是否显示成功提示 | `boolean` | `true` |
| `jsonSpace` | JSON 缩进空格数 | `number` | `2` |
| `tooltipTitle` | 提示文本 | `string` | `'复制'` |
| `successMessage` | 自定义成功消息 | `string` | - |
| `errorMessage` | 自定义失败消息 | `string` | - |
| `style` | 自定义样式 | `React.CSSProperties` | - |
| `className` | 自定义类名 | `string` | - |

## 💡 使用场景

### 1. 拷贝 JSON 数据

```typescript
const userData = {
  name: '张三',
  age: 25,
  city: '北京',
};

<CopyIconButton
  data={userData}
  jsonSpace={2}
  onCopy={(text, success) => {
    if (success) {
      console.log('用户数据复制成功:', text);
    }
  }}
/>;
```

### 2. 拷贝文本

```typescript
<CopyIconButton
  text="https://example.com"
  tooltipTitle="复制链接"
  onCopy={(text, success) => {
    if (success) {
      message.success('链接复制成功');
    }
  }}
/>
```

### 3. 自定义成功和失败消息

```typescript
<CopyIconButton
  data={userData}
  successMessage="🎉 用户信息复制成功！"
  errorMessage="❌ 用户信息复制失败，请重试"
  onCopy={(text, success) => {
    if (success) {
      console.log('复制成功:', text);
    }
  }}
/>
```

### 4. 静默拷贝（不显示提示）

```typescript
<CopyIconButton
  data={complexData}
  showMessage={false}
  onCopy={(text, success) => {
    // 自定义成功处理
    if (success) {
      message.info('数据已复制到剪贴板');
    }
  }}
/>
```

### 5. 自定义按钮样式

```typescript
<CopyIconButton
  data={data}
  buttonType="primary"
  buttonSize="middle"
  style={{ marginLeft: 8 }}
  className="custom-copy-btn"
/>
```

## 🔧 最佳实践

### 1. 选择合适的数据类型

- **JSON 数据**：使用 `data` 属性，组件会自动处理 JSON.stringify
- **纯文本**：使用 `text` 属性，直接拷贝文本内容

### 2. 错误处理

```typescript
<CopyIconButton
  data={data}
  onCopy={(text, success) => {
    if (success) {
      // 复制成功
      console.log('复制成功:', text);
    } else {
      // 复制失败
      console.error('复制失败');
    }
  }}
/>
```

### 3. 性能优化

- 对于频繁拷贝的场景，设置 `showMessage={false}` 避免过多的提示消息
- 使用 `onCopy` 回调进行自定义的成功/失败处理

## 🎨 样式定制

组件使用 Ant Design 的 Button 组件，可以通过以下方式定制样式：

```typescript
// 通过 style 属性
<CopyIconButton
  data={data}
  style={{
    marginLeft: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0'
  }}
/>

// 通过 className 属性
<CopyIconButton
  data={data}
  className="my-custom-copy-btn"
/>
```

## 🔄 迁移指南

如果你之前使用 `CopyToClipboard` 组件，可以这样迁移：

```typescript
// 之前
<Tooltip title="复制">
  <CopyToClipboard text={JSON.stringify(data, null, 2)} onCopy={handleCopy}>
    <Button type="text" size="small" icon={<CopyOutlined />} />
  </CopyToClipboard>
</Tooltip>

// 现在
<CopyIconButton
  data={data}
  jsonSpace={2}
  onCopy={handleCopy}
  tooltipTitle="复制"
/>
```

这样可以获得：

- 更简洁的代码
- 统一的拷贝体验
- 更好的错误处理
- 一致的 UI 风格
