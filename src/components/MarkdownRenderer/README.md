# MarkdownRenderer 组件文档

## 问题背景

### 为什么 react-markdown 没有实现增量渲染？

**react-markdown** 是一个基于 **unified** 生态系统的 Markdown 渲染器，它的设计理念是：

1. **声明式渲染**: 每次 `content` 变化时，都会重新解析整个 Markdown 内容
2. **完整重新渲染**: 不会保留之前的 DOM 结构，而是完全重新生成
3. **简单可靠**: 这种设计确保了渲染结果的一致性和可预测性

### 传统渲染的问题

```typescript
// 每次 content 变化都会触发整个组件重新渲染
<ReactMarkdown>{content} // 这里的变化会导致整个 DOM 树重新构建</ReactMarkdown>
```

**问题表现**:

- ❌ 全局 DOM 替换，导致闪烁
- ❌ 性能较差，特别是大文档
- ❌ 不适合流式内容更新
- ❌ 用户体验不流畅

## 解决方案

### 1. 增量渲染组件 (推荐)

我们创建了 `IncrementalMarkdownRenderer` 组件来解决这个问题：

```typescript
import { IncrementalMarkdownRenderer } from '@/components/MarkdownRenderer';

// 使用增量渲染
<IncrementalMarkdownRenderer
  id="chat-message"
  content={streamingContent}
  enableIncremental={true} // 启用增量渲染
  chunkSize={1000} // 每块1000字符
  mermaid={mermaid()}
  onCopy={handleCopy}
/>;
```

**核心特性**:

- ✅ **智能分块**: 将内容分割成小块，优先在代码块边界分割
- ✅ **代码块保护**: 确保代码块、Mermaid 图表等不被分割
- ✅ **增量更新**: 只渲染新增的内容块
- ✅ **性能优化**: 避免全局重新渲染
- ✅ **流式支持**: 完美支持实时流式内容

### 2. 工作原理

````typescript
// 1. 智能内容分块
const chunks = splitContentIntoChunks(fullContent);

// 2. 代码块保护逻辑
if (isInCodeBlock) {
  // 在代码块内，寻找代码块结束位置
  const nextCodeBlockEnd = afterContent.indexOf('\n```\n');
  if (nextCodeBlockEnd !== -1) {
    actualEndOffset = endOffset + nextCodeBlockEnd + 4; // 包含结束标记
  }
} else {
  // 不在代码块内，寻找合适的分割点
  // 优先在段落边界分割（双换行）
  // 其次在单换行分割
  // 再次在句子边界分割
  // 最后在空格分割
}

// 3. 增量检测
if (newContent.startsWith(oldContent)) {
  // 只渲染增量部分
  const incrementalContent = newContent.substring(oldContent.length);
  updateChunksIncrementally(incrementalContent);
} else {
  // 内容发生重大变化，重新渲染
  reRenderAllChunks(newContent);
}

// 4. 块级渲染
chunks.map((chunk) => (
  <ReactMarkdown key={chunk.id}>{chunk.content}</ReactMarkdown>
));
````

### 3. 使用场景对比

| 场景       | 传统渲染    | 增量渲染    |
| ---------- | ----------- | ----------- |
| 聊天应用   | ❌ 闪烁严重 | ✅ 平滑更新 |
| 实时编辑器 | ❌ 性能差   | ✅ 性能优秀 |
| 文档预览   | ✅ 适合     | ✅ 适合     |
| 流式内容   | ❌ 体验差   | ✅ 体验优秀 |

## 组件选择指南

### 何时使用传统 MarkdownRenderer

```typescript
// 适合的场景：
// 1. 静态文档渲染
// 2. 一次性完整内容
// 3. 对性能要求不高
// 4. 内容变化不频繁

import { StandardMarkdownRenderer } from '@/components/MarkdownRenderer';

<StandardMarkdownRenderer
  id="static-doc"
  content={staticContent}
  mermaid={mermaid()}
/>;
```

### 何时使用增量渲染

```typescript
// 适合的场景：
// 1. 聊天应用
// 2. 实时编辑器
// 3. 流式内容更新
// 4. 对性能要求高
// 5. 用户体验要求高

import { IncrementalMarkdownRenderer } from '@/components/MarkdownRenderer';

<IncrementalMarkdownRenderer
  id="chat-stream"
  content={streamingContent}
  enableIncremental={true}
  chunkSize={800}
  mermaid={mermaid()}
/>;
```

## 代码块保护机制

### 智能分割算法

我们的增量渲染组件实现了智能分割算法，确保代码块不被分割：

````typescript
// 检查是否在代码块内
const codeBlockStarts = (beforeContent.match(/```[\w]*\n/g) || []).length;
const codeBlockEnds = (beforeContent.match(/\n```\n/g) || []).length;
const isInCodeBlock = codeBlockStarts > codeBlockEnds;

if (isInCodeBlock) {
  // 在代码块内，寻找代码块结束位置
  const nextCodeBlockEnd = afterContent.indexOf('\n```\n');
  if (nextCodeBlockEnd !== -1) {
    actualEndOffset = endOffset + nextCodeBlockEnd + 4; // 包含结束标记
  }
}
````

### 分割优先级

1. **代码块边界**: 最高优先级，确保代码块完整
2. **段落边界**: 双换行 `\n\n`
3. **单换行**: 单换行 `\n`
4. **句子边界**: 句号 `.`
5. **单词边界**: 空格 ` `

### 支持的代码块类型

- ✅ **普通代码块**: \`\`\`javascript
- ✅ **Mermaid 图表**: \`\`\`mermaid
- ✅ **数学公式**: \`\`\`math
- ✅ **其他语言**: \`\`\`python, \`\`\`typescript 等

## 性能优化建议

### 1. 合理设置块大小

```typescript
// 小块：适合快速更新
chunkSize={500}  // 500字符

// 大块：适合稳定内容
chunkSize={2000} // 2000字符
```

### 2. 使用 React.memo 优化

```typescript
// 组件已经使用 memo 优化
const IncrementalMarkdownRenderer = memo(({ content, ...props }) => {
  // 只在 content 真正变化时才重新渲染
});
```

### 3. 避免频繁更新

```typescript
// 使用节流减少更新频率
const throttledUpdate = useMemo(() => throttle(setContent, 100), []);
```

## 示例代码

### 聊天应用示例

```typescript
import React, { useState, useEffect } from 'react';
import { IncrementalMarkdownRenderer } from '@/components/MarkdownRenderer';
import mermaid from '@/components/MarkdownRenderer/mermaid';

const ChatMessage: React.FC<{ messageId: string; content: string }> = ({
  messageId,
  content,
}) => {
  return (
    <div className="chat-message">
      <IncrementalMarkdownRenderer
        id={messageId}
        content={content}
        enableIncremental={true}
        chunkSize={600}
        mermaid={mermaid()}
        onCopy={() => message.success('复制成功')}
      />
    </div>
  );
};
```

### 流式更新示例

```typescript
const StreamingContent: React.FC = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    // 模拟流式更新
    const stream = new EventSource('/api/stream');

    stream.onmessage = (event) => {
      const newChunk = event.data;
      setContent((prev) => prev + newChunk);
    };

    return () => stream.close();
  }, []);

  return (
    <IncrementalMarkdownRenderer
      id="streaming-content"
      content={content}
      enableIncremental={true}
      chunkSize={1000}
      mermaid={mermaid()}
    />
  );
};
```

## 测试组件

我们提供了两个测试组件来验证增量渲染功能：

### IncrementalMarkdownExample

基础功能演示组件，展示增量渲染的基本用法。

### IncrementalMarkdownTest

专门用于测试代码块分割功能的组件，包含：

- 多种类型的代码块测试
- Mermaid 图表测试
- 流式更新测试
- 对比传统渲染和增量渲染

```typescript
import { IncrementalMarkdownTest } from '@/examples/MarkdownTest';

// 在开发环境中使用测试组件
<IncrementalMarkdownTest />;
```

## 总结

**react-markdown** 本身确实没有实现增量渲染，这是其设计理念决定的。但通过我们的 `IncrementalMarkdownRenderer` 组件，你可以获得：

1. **更好的性能**: 避免全局重新渲染
2. **更流畅的体验**: 支持流式内容更新
3. **更低的资源消耗**: 只渲染必要的部分
4. **更好的用户体验**: 无闪烁的平滑更新

选择哪个组件取决于你的具体使用场景。对于需要频繁更新内容的场景，强烈推荐使用增量渲染组件。
