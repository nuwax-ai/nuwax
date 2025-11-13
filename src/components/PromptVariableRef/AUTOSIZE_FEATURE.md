# PromptVariableRef 组件 - 自动调整大小功能

本文档介绍 PromptVariableRef 组件新增的类似 textarea 的 rows、cols 和 autosize 功能。

## 新增功能概览

### 1. 自动调整大小 (autosize)

```typescript
// 简单启用
<PromptVariableRef autosize={true} />

// 高级配置
<PromptVariableRef
  autosize={{
    minRows: 2,
    maxRows: 10
  }}
/>
```

### 2. 固定行数 (rows)

```typescript
<PromptVariableRef
  rows={5}
  // 固定高度为5行
/>
```

### 3. 固定列数 (cols)

```typescript
<PromptVariableRef
  cols={40}
  // 固定宽度为40个字符
/>
```

### 4. 字符计数 (showCount)

```typescript
<PromptVariableRef
  showCount={true}
  maxLength={500} // 可选：最大字符数限制
/>
```

### 5. 高度控制

```typescript
<PromptVariableRef
  minHeight={80} // 最小高度（像素）
  maxHeight={400} // 最大高度（像素）
  autosize={true}
/>
```

## API 参考

### 新增 Props

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `rows` | `number` | - | 可见行数 |
| `cols` | `number` | - | 可见列数 |
| `autosize` | `boolean \| { minRows?: number; maxRows?: number }` | `false` | 自动调整大小 |
| `minRows` | `number` | - | 自动调整的最小行数 |
| `maxRows` | `number` | - | 自动调整的最大行数 |
| `showCount` | `boolean` | `false` | 是否显示字符计数 |
| `maxLength` | `number` | - | 最大字符数限制 |
| `maxHeight` | `number \| string` | `400` | 最大高度 |
| `minHeight` | `number \| string` | `80` | 最小高度 |

## 使用示例

### 基础自动调整

```typescript
<PromptVariableRef
  variables={sampleVariables}
  autosize={true}
  placeholder="输入提示词，使用 {{变量名}} 引用变量"
  value={value}
  onChange={setValue}
  showCount={true}
  minRows={3}
  maxRows={10}
/>
```

### 固定尺寸

```typescript
<PromptVariableRef
  variables={sampleVariables}
  rows={6}
  cols={50}
  placeholder="固定6行50列的输入框"
  showCount={true}
  maxLength={500}
/>
```

### 高级配置

```typescript
<PromptVariableRef
  variables={sampleVariables}
  autosize={{ minRows: 2, maxRows: 8 }}
  showCount={true}
  maxLength={1000}
  minHeight={60}
  maxHeight={300}
  style={{ width: '100%' }}
/>
```

## 功能特性

### 自动调整大小

- **智能高度计算**: 根据文本行数自动调整高度
- **最小/最大限制**: 可以设置最小和最大行数限制
- **平滑过渡**: 高度变化时有平滑的动画效果
- **响应式**: 自动适应内容变化

### 字符计数

- **实时计数**: 实时显示当前字符数
- **最大长度提示**: 支持最大字符数限制
- **颜色提示**: 超出限制时显示红色警告

### 尺寸控制

- **固定行高**: 使用 `rows` 设置固定行数
- **固定列宽**: 使用 `cols` 设置固定列数
- **混合模式**: 可以同时设置行数和列数

## 样式定制

### CSS 类名

- `.prompt-variable-input-autosize`: 自动调整大小状态
- `.prompt-variable-count`: 字符计数器样式

### 自定义样式

```scss
.prompt-variable-input-autosize {
  overflow-y: hidden; // 自动大小时隐藏滚动条
  transition: height 0.1s ease-out; // 平滑过渡
}

.prompt-variable-count {
  font-family: Monaco, Menlo, 'Ubuntu Mono', monospace;
  user-select: none;

  &.count-error {
    color: #ff4d4f; // 超出限制时的颜色
  }
}
```

## 注意事项

1. **性能**: 自动调整大小功能使用了防抖处理，避免频繁计算
2. **兼容性**: 所有新功能都与现有的变量引用功能完全兼容
3. **默认值**: 当不设置相关属性时，使用原有的默认行为
4. **样式**: 新功能会自动应用相应的样式类名，便于自定义

## 更新日志

### v1.x.x

- 新增 `autosize` 属性，支持自动调整大小
- 新增 `rows` 属性，固定行数设置
- 新增 `cols` 属性，固定列数设置
- 新增 `showCount` 属性，字符计数显示
- 新增 `maxLength` 属性，最大字符数限制
- 新增 `minHeight` 和 `maxHeight` 属性，高度控制
- 修复换行符丢失问题
- 修复回车键换行问题

## 演示

查看 `src/examples/AutosizeDemo/index.tsx` 文件获取完整的使用示例。
