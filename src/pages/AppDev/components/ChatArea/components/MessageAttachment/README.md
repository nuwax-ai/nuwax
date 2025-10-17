# MessageAttachment 组件

## 概述

`MessageAttachment` 是一个统一的附件组件，用于在聊天消息中显示各种类型的附件，包括图片、文本文件和文档。它封装了所有附件类型的渲染逻辑，提供了统一的接口和样式。

## 功能特性

- **多类型支持**：支持图片、文本文件和文档三种类型
- **统一接口**：所有附件类型使用相同的 Props 接口
- **图片预览**：图片附件支持点击预览功能
- **文件信息**：文件附件显示文件名和类型
- **响应式设计**：适配不同屏幕尺寸
- **悬停效果**：提供良好的交互反馈

## 使用方法

```tsx
import MessageAttachment from './components/MessageAttachment';

// 图片附件
<MessageAttachment
  attachment={imageAttachment}
  type="Image"
  size={120}
  showPreview={true}
/>

// 文本文件附件
<MessageAttachment
  attachment={textAttachment}
  type="Text"
  onClick={() => {}}
/>

// 文档附件
<MessageAttachment
  attachment={documentAttachment}
  type="Document"
  onClick={() => {}}
/>
```

## Props

| 属性 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `attachment` | `ImageAttachment \| TextAttachment \| DocumentAttachment` | - | 附件数据（必填） |
| `type` | `'Image' \| 'Text' \| 'Document'` | - | 附件类型（必填） |
| `size` | `number` | `120` | 图片显示尺寸（仅对图片类型有效） |
| `showPreview` | `boolean` | `true` | 是否显示预览功能（仅对图片类型有效） |
| `className` | `string` | - | 自定义样式类名 |
| `onClick` | `() => void` | - | 点击回调函数（仅对文件类型有效） |

## 支持的附件类型

### 1. 图片附件 (Image)

- **数据格式**：Base64 编码的图片数据
- **显示方式**：缩略图显示，支持点击预览
- **配置项**：`size`（尺寸）、`showPreview`（预览功能）

### 2. 文本文件附件 (Text)

- **显示方式**：文件卡片，显示文件名和类型
- **图标**：📄
- **交互**：支持点击事件

### 3. 文档附件 (Document)

- **显示方式**：文件卡片，显示文件名和类型
- **图标**：📋
- **交互**：支持点击事件

## 数据结构

### ImageAttachment

```typescript
interface ImageAttachment {
  id: string; // 附件唯一标识
  filename: string; // 文件名
  mime_type: string; // MIME 类型
  dimensions?: ImageDimensions; // 图片尺寸
  source: AttachmentSource; // 数据源
}
```

### TextAttachment

```typescript
interface TextAttachment {
  id: string; // 附件唯一标识
  filename: string; // 文件名
  description?: string; // 文件描述
  source: AttachmentSource; // 数据源
}
```

### DocumentAttachment

```typescript
interface DocumentAttachment {
  id: string; // 附件唯一标识
  filename: string; // 文件名
  description?: string; // 文件描述
  size?: number; // 文件大小
  source: AttachmentSource; // 数据源
}
```

## 样式定制

组件使用 CSS Modules，可以通过以下方式定制样式：

```less
// 自定义图片附件样式
.custom-image-attachment {
  border-radius: 12px;
  border: 2px solid #1890ff;

  &:hover {
    transform: scale(1.05);
  }
}

// 自定义文件附件样式
.custom-file-attachment {
  background: rgba(24, 144, 255, 5%);
  border-color: rgba(24, 144, 255, 20%);

  &:hover {
    background: rgba(24, 144, 255, 10%);
  }
}
```

## 使用示例

### 在聊天消息中渲染附件

```tsx
// 渲染所有类型的附件
{
  message.attachments && message.attachments.length > 0 && (
    <div className={styles.messageAttachments}>
      {message.attachments.map((attachment) => (
        <MessageAttachment
          key={attachment.content.id}
          attachment={attachment.content}
          type={attachment.type}
          size={120}
          showPreview={true}
        />
      ))}
    </div>
  );
}
```

### 条件渲染不同类型的附件

```tsx
// 只渲染图片附件
{
  message.attachments
    .filter((attachment) => attachment.type === 'Image')
    .map((attachment) => (
      <MessageAttachment
        key={attachment.content.id}
        attachment={attachment.content}
        type={attachment.type}
        size={150}
      />
    ));
}
```

## 注意事项

1. **类型匹配**：`attachment` 和 `type` 必须匹配对应的数据类型
2. **图片数据**：图片附件需要 Base64 格式的数据
3. **文件名长度**：过长的文件名会被截断显示
4. **性能考虑**：大尺寸图片可能影响渲染性能
5. **浏览器兼容性**：需要支持 CSS3 变换效果的现代浏览器

## 更新日志

- **v1.0.0**：初始版本，合并了图片和文件附件组件，提供统一的附件渲染接口
