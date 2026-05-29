/**
 * Chat Preview - Markdown 渲染对比页面
 *
 * 镜像 workbench preview (http://localhost:5180/) 的 17 种渲染类型，
 * 方便在 nuwax 项目中对比 MarkdownRenderer / PureMarkdownRenderer 的视觉效果。
 *
 * 路由：/examples/chat-preview
 */

import RunOver from '@/components/ChatView/RunOver';
import {
  MarkdownRenderer,
  PureMarkdownRenderer,
} from '@/components/MarkdownRenderer';
import { groupMarkdownProcesses } from '@/components/MarkdownRenderer/utils';
import useMarkdownRender from '@/hooks/useMarkdownRender';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { Alert, Card, Tag, theme } from 'antd';
import React, { useMemo, useState } from 'react';

const { useToken } = theme;

// ---------------------------------------------------------------------------
// Helper: Section label
// ---------------------------------------------------------------------------

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div
    style={{
      fontSize: 11,
      color: '#999',
      marginBottom: 4,
      paddingLeft: 4,
      fontFamily: 'monospace',
    }}
  >
    {label}
  </div>
);

// ---------------------------------------------------------------------------
// Helper: Wrapper card for each section
// ---------------------------------------------------------------------------

const Section: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div style={{ marginBottom: 24 }}>
    <SectionLabel label={label} />
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Helper: Assistant message bubble (mirrors ChatView assistant styling)
// ---------------------------------------------------------------------------

const AssistantBubble: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useToken();
  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        padding: '12px 16px',
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
      className="ds-markdown"
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helper: User message bubble
// ---------------------------------------------------------------------------

const UserBubble: React.FC<{ text: string }> = ({ text }) => {
  const { token } = useToken();
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div
        style={{
          background: token.colorPrimary,
          color: '#fff',
          borderRadius: token.borderRadiusLG,
          padding: '10px 14px',
          maxWidth: '70%',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helper: MarkdownRenderer wrapper for sections that need full MarkdownRenderer
// (mermaid, thinking, streaming)
// ---------------------------------------------------------------------------

const FullMarkdownSection: React.FC<{
  id: string;
  answer?: string;
  thinking?: string;
  status?: MessageStatusEnum;
  conversationId?: string;
}> = ({
  id,
  answer = '',
  thinking = '',
  status,
  conversationId = 'preview',
}) => {
  const processedText = useMemo(() => groupMarkdownProcesses(answer), [answer]);

  const { markdownRef, messageIdRef } = useMarkdownRender({
    answer: processedText,
    thinking,
    id,
  });

  return (
    <MarkdownRenderer
      key={messageIdRef.current}
      id={messageIdRef.current}
      markdownRef={markdownRef}
      conversationId={conversationId}
      answer={processedText}
      thinking={thinking}
      status={status}
    />
  );
};

// ---------------------------------------------------------------------------
// Mock MessageInfo factory
// ---------------------------------------------------------------------------

function makeMessageInfo(overrides: Partial<MessageInfo> = {}): MessageInfo {
  return {
    id: 'mock',
    index: 0,
    tenantId: 0,
    senderType: 'AGENT',
    senderId: 'agent-preview',
    userId: 0,
    agentId: 0,
    role: AssistantRoleEnum.ASSISTANT,
    time: new Date().toISOString(),
    componentExecutedList: [],
    messageType: 'ASSISTANT' as any,
    ...overrides,
  } as MessageInfo;
}

// ---------------------------------------------------------------------------
// Mock RunOver data
// ---------------------------------------------------------------------------

const mockRunOverComplete = makeMessageInfo({
  id: 'runover-complete',
  status: MessageStatusEnum.Complete,
  text: '已完成代码分析，发现了 3 个潜在问题并提供了修复建议。',
  finalResult: {
    completionTokens: 500,
    componentExecuteResults: [],
    endTime: Date.now(),
    error: '',
    outputText: '',
    promptTokens: 1000,
    startTime: Date.now() - 8500,
    success: true,
    totalTokens: 1500,
  },
  processingList: [
    {
      executeId: 'step-read',
      name: 'Read File',
      status: ProcessingEnum.FINISHED,
      result: {
        startTime: Date.now() - 8500,
        endTime: Date.now() - 8270,
      } as any,
      cardBindConfig: {} as any,
      targetId: 0,
      type: 0 as any,
      subEventType: null,
    },
    {
      executeId: 'step-grep',
      name: 'Grep Search',
      status: ProcessingEnum.FINISHED,
      result: {
        startTime: Date.now() - 8200,
        endTime: Date.now() - 8155,
      } as any,
      cardBindConfig: {} as any,
      targetId: 0,
      type: 0 as any,
      subEventType: null,
    },
    {
      executeId: 'step-edit',
      name: 'Edit File',
      status: ProcessingEnum.FINISHED,
      result: {
        startTime: Date.now() - 8100,
        endTime: Date.now() - 7920,
      } as any,
      cardBindConfig: {} as any,
      targetId: 0,
      type: 0 as any,
      subEventType: null,
    },
  ],
});

const mockRunOverRunning = makeMessageInfo({
  id: 'runover-running',
  status: MessageStatusEnum.Loading,
  text: '',
  processingList: [
    {
      executeId: 's1',
      name: 'Bash',
      status: ProcessingEnum.FINISHED,
      result: {
        startTime: Date.now() - 3000,
        endTime: Date.now() - 1800,
      } as any,
      cardBindConfig: {} as any,
      targetId: 0,
      type: 0 as any,
      subEventType: null,
    },
    {
      executeId: 's2',
      name: 'Read File',
      status: ProcessingEnum.EXECUTING,
      result: null,
      cardBindConfig: {} as any,
      targetId: 0,
      type: 0 as any,
      subEventType: null,
    },
  ],
});

// ---------------------------------------------------------------------------
// Preview content constants (same as workbench preview)
// ---------------------------------------------------------------------------

const MARKDOWN_BASIC = `## 代码分析结果

经过仔细审查，我发现以下几个 **关键性能问题**：

### 1. 内存泄漏风险

你的代码中存在 *未清理的事件监听器*，这会导致内存持续增长。

> **注意**: 这类问题在生产环境中通常不会立即暴露，但随着运行时间增长会越来越严重。

具体来说：
- \`addEventListener\` 注册后没有对应的 \`removeEventListener\`
- \`setInterval\` 没有在组件卸载时清理
- 闭包引用了外部大对象

详见 [MDN 内存管理指南](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Memory_Management)

---

### 2. 建议修复方案

1. 使用 \`AbortController\` 统一管理事件生命周期
2. 用 \`WeakRef\` 替代强引用
3. 添加 \`finally\` 块确保资源释放

这是一个 ~O(n²)~ 的优化点，改为 \`O(n log n)\` 后性能提升显著。`;

const MARKDOWN_CODE_BLOCKS = `以下是修复后的代码：

\`\`\`typescript
import { useEffect, useRef } from 'react';

function useEventCleanup(
  target: EventTarget,
  event: string,
  handler: EventListener,
) {
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    controllerRef.current = new AbortController();
    target.addEventListener(event, handler, {
      signal: controllerRef.current.signal,
    });
    return () => controllerRef.current?.abort();
  }, [target, event, handler]);
}
\`\`\`

对应的 Python 版本使用 \`weakref\`：

\`\`\`python
import weakref

class ResourceManager:
    def __init__(self):
        self._refs = weakref.WeakSet()

    def register(self, resource):
        self._refs.add(resource)

    def cleanup(self):
        for ref in list(self._refs):
            ref.close()
\`\`\`

验证脚本：

\`\`\`bash
#!/bin/bash
echo "Running memory profiler..."
node --inspect-brk --max-old-space-size=512 app.js &
sleep 5
curl -s http://localhost:9229/json | jq '.[0].webSocketDebuggerUrl'
\`\`\`

配置文件：

\`\`\`json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "target": "ES2022",
    "moduleResolution": "bundler"
  }
}
\`\`\`

行内代码示例：使用 \`console.time('label')\` 和 \`console.timeEnd('label')\` 来测量耗时。`;

const MARKDOWN_MATH = `该算法的时间复杂度分析如下：

行内公式：$T(n) = 2T(n/2) + O(n)$，根据主定理可得 $T(n) = O(n \\log n)$。

块级公式（高斯积分）：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

矩阵表示：

$$
A = \\begin{pmatrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\end{pmatrix}, \\quad \\det(A) = a_{11}a_{22} - a_{12}a_{21}
$$

欧拉恒等式：$e^{i\\pi} + 1 = 0$`;

const MARKDOWN_MERMAID = `下面是修复后的事件处理流程：

\`\`\`mermaid
graph TD
    A[Component Mount] --> B[Create AbortController]
    B --> C[addEventListener with signal]
    C --> D{User Action?}
    D -->|Yes| E[Handle Event]
    D -->|No| F[Wait]
    E --> D
    F --> G[Component Unmount]
    G --> H[AbortController.abort]
    H --> I[All listeners removed]
\`\`\`

以及一个时序图：

\`\`\`mermaid
sequenceDiagram
    participant C as Component
    participant T as EventTarget
    participant AC as AbortController
    C->>AC: new AbortController()
    C->>T: addEventListener(signal)
    Note over C,T: Event handling...
    C->>AC: abort()
    AC->>T: Remove all listeners
\`\`\``;

const MARKDOWN_TABLE = `### 性能对比

| 指标 | 修复前 | 修复后 | 改善 |
|------|--------|--------|------|
| 内存占用 | 256 MB | 48 MB | **-81%** |
| 首次渲染 | 3.2s | 1.1s | **-66%** |
| 事件监听器 | 128 个 | 12 个 | **-91%** |
| GC 暂停 | 450ms | 30ms | **-93%** |

> 数据来源：Chrome DevTools Performance 面板`;

const MARKDOWN_IMAGE = `下面是内存使用趋势图（点击图片可放大）：

![Memory Usage Chart](https://placehold.co/600x300/e6f4ff/1677ff?text=Memory+Usage+Chart&font=roboto)

修复后内存曲线平稳，未修复前持续增长。`;

const MARKDOWN_TASK_RESULT = `分析报告已生成：

<task-result>
  <description>性能分析报告</description>
  <file>performance-report-2026.md</file>
</task-result>

<task-result>
  <description>修复补丁</description>
  <file>fix-memory-leak.patch</file>
</task-result>

你可以点击上方卡片查看文件详情。`;

const MARKDOWN_CUSTOM_PROCESS = `<markdown-custom-process status="done" title="Search Codebase">
{"query":"addEventListener without cleanup"}
</markdown-custom-process>
<markdown-custom-process status="done" title="Read File">
{"path":"src/hooks/useEventListener.ts"}
</markdown-custom-process>

找到了 3 处未清理的事件监听器，分布在以下文件中。`;

const THINKING_CONTENT = `Let me analyze the user's code for performance issues.

First, I need to look at the event listener registration pattern. The code uses addEventListener in a useEffect but doesn't return a cleanup function.

Second, there's a setInterval that runs every 100ms but is never cleared.

Third, the closure in the event handler captures the entire state object, which prevents garbage collection of old state references.

The most critical issue is the missing cleanup — this is a classic memory leak pattern in React.`;

const THINKING_ANSWER =
  '根据分析，这段代码的主要问题是事件监听器没有在组件卸载时清理。\n\n建议使用 `AbortController` 来统一管理事件生命周期，这样可以确保所有监听器在组件卸载时自动移除。';

const STREAMING_THINKING =
  "Analyzing the user's request... Let me think about the best approach to solve this problem. I need to consider multiple factors including performance, maintainability, and code clarity.";

const RAW_MARKDOWN = `这是一段直接通过 **MarkdownRenderer** 渲染的内容，不经过 ChatMessage 包装。

\`\`\`python
print("Hello from raw MarkdownRenderer!")
\`\`\`

支持 $E = mc^2$ 行内公式和完整 Markdown 语法。`;

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ChatPreview: React.FC = () => {
  const { data } = useUnifiedTheme();
  const isDarkMode = data.antdTheme === 'dark';
  const { token } = useToken();
  const [filter, setFilter] = useState('');

  // All 17 sections as an array for filtering
  const sections = useMemo(() => {
    const all: Array<{
      id: string;
      label: string;
      keywords: string;
      render: () => React.ReactNode;
    }> = [
      {
        id: '1',
        label: '1. 用户消息（纯文本气泡）',
        keywords: 'user message bubble 用户 消息',
        render: () => (
          <UserBubble text="帮我分析这段 TypeScript 代码的性能问题，特别是内存泄漏方面。" />
        ),
      },
      {
        id: '2',
        label:
          '2. 基础 Markdown（标题/粗体/斜体/列表/链接/行内代码/引用/分割线）',
        keywords: 'basic markdown bold italic list link 基础',
        render: () => (
          <AssistantBubble>
            <PureMarkdownRenderer id="preview-2" disableTyping>
              {MARKDOWN_BASIC}
            </PureMarkdownRenderer>
          </AssistantBubble>
        ),
      },
      {
        id: '3',
        label: '3. 代码块（TypeScript / Python / Bash / JSON）',
        keywords: 'code block typescript python bash json 代码块',
        render: () => (
          <AssistantBubble>
            <PureMarkdownRenderer id="preview-3" disableTyping>
              {MARKDOWN_CODE_BLOCKS}
            </PureMarkdownRenderer>
          </AssistantBubble>
        ),
      },
      {
        id: '4',
        label: '4. 数学公式（KaTeX 行内 + 块级）',
        keywords: 'math katex formula 数学 公式',
        render: () => (
          <AssistantBubble>
            <PureMarkdownRenderer id="preview-4" disableTyping>
              {MARKDOWN_MATH}
            </PureMarkdownRenderer>
          </AssistantBubble>
        ),
      },
      {
        id: '5',
        label: '5. Mermaid 图表（需使用完整 MarkdownRenderer）',
        keywords: 'mermaid diagram chart 图表 流程图',
        render: () => (
          <AssistantBubble>
            <FullMarkdownSection
              id="preview-5"
              answer={MARKDOWN_MERMAID}
              status={MessageStatusEnum.Complete}
            />
          </AssistantBubble>
        ),
      },
      {
        id: '6',
        label: '6. Thinking 推理过程（metadata.thinking）',
        keywords: 'thinking trace 思考 推理',
        render: () => (
          <AssistantBubble>
            <FullMarkdownSection
              id="preview-6"
              answer={THINKING_ANSWER}
              thinking={THINKING_CONTENT}
              status={MessageStatusEnum.Complete}
            />
          </AssistantBubble>
        ),
      },
      {
        id: '7',
        label: '7. 工具执行可视化（RunOver — 完成状态，3 步）',
        keywords: 'runover complete tool execution 工具 执行 完成',
        render: () => (
          <Card size="small">
            <div style={{ marginBottom: 8 }}>
              <RunOver messageInfo={mockRunOverComplete} showStatusDesc />
            </div>
            <div
              style={{
                color: token.colorTextSecondary,
                fontSize: 13,
              }}
            >
              已完成代码分析，发现了 3 个潜在问题并提供了修复建议。
            </div>
          </Card>
        ),
      },
      {
        id: '8',
        label: '8. 工具执行可视化（RunOver — 运行中，2 步）',
        keywords: 'runover running streaming 工具 执行 运行中',
        render: () => (
          <Card size="small">
            <RunOver messageInfo={mockRunOverRunning} showStatusDesc />
          </Card>
        ),
      },
      {
        id: '9',
        label: '9. 表格（GFM）',
        keywords: 'table gfm 表格',
        render: () => (
          <AssistantBubble>
            <PureMarkdownRenderer id="preview-9" disableTyping>
              {MARKDOWN_TABLE}
            </PureMarkdownRenderer>
          </AssistantBubble>
        ),
      },
      {
        id: '10',
        label: '10. 图片（OptimizedImage + 点击放大）',
        keywords: 'image picture 图片',
        render: () => (
          <AssistantBubble>
            <PureMarkdownRenderer id="preview-10" disableTyping>
              {MARKDOWN_IMAGE}
            </PureMarkdownRenderer>
          </AssistantBubble>
        ),
      },
      {
        id: '11',
        label: '11. Task Result 文件卡片',
        keywords: 'task result card file 任务 结果 文件',
        render: () => (
          <AssistantBubble>
            <PureMarkdownRenderer id="preview-11" disableTyping>
              {MARKDOWN_TASK_RESULT}
            </PureMarkdownRenderer>
          </AssistantBubble>
        ),
      },
      {
        id: '12',
        label: '12. 内联 <markdown-custom-process> 标签',
        keywords: 'custom process tag inline 自定义 过程',
        render: () => (
          <AssistantBubble>
            <PureMarkdownRenderer
              id="preview-12"
              disableTyping
              conversationId="preview"
            >
              {MARKDOWN_CUSTOM_PROCESS}
            </PureMarkdownRenderer>
          </AssistantBubble>
        ),
      },
      {
        id: '13',
        label: '13. 错误状态',
        keywords: 'error state 错误',
        render: () => (
          <Alert
            type="error"
            message="Connection timeout"
            description="Connection timeout: unable to reach the model API after 30s"
            showIcon
          />
        ),
      },
      {
        id: '14',
        label: '14. 流式输出中（streaming indicator）',
        keywords: 'streaming indicator loading 流式 输出',
        render: () => (
          <Card size="small">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: token.colorPrimary,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: token.colorPrimary,
                  animation: 'chatPreviewPulse 1.2s ease-in-out infinite',
                }}
              />
              <span style={{ fontSize: 13 }}>正在生成回复...</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <RunOver
                messageInfo={makeMessageInfo({
                  id: 'streaming-14',
                  status: MessageStatusEnum.Loading,
                  text: '',
                  processingList: [],
                })}
                showStatusDesc
              />
            </div>
          </Card>
        ),
      },
      {
        id: '15',
        label: '15. 流式 Thinking（streaming + thinking）',
        keywords: 'streaming thinking 流式 思考',
        render: () => (
          <AssistantBubble>
            <FullMarkdownSection
              id="preview-15"
              answer=""
              thinking={STREAMING_THINKING}
              status={MessageStatusEnum.Loading}
            />
          </AssistantBubble>
        ),
      },
      {
        id: '16',
        label: '16. 权限请求卡片（PermissionCard — mock）',
        keywords: 'permission card 权限 请求',
        render: () => (
          <Card
            size="small"
            style={{
              borderColor: token.colorWarningBorder,
              background: token.colorWarningBg,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <Tag color="warning">权限请求</Tag>
              <strong>允许执行 Bash 命令？</strong>
            </div>
            <div
              style={{
                fontSize: 13,
                color: token.colorTextSecondary,
                marginBottom: 12,
              }}
            >
              Agent 想要运行 &quot;rm -rf node_modules &amp;&amp; npm
              install&quot;，这可能影响项目依赖。
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Tag
                color="success"
                style={{ cursor: 'pointer', padding: '4px 12px' }}
              >
                允许一次
              </Tag>
              <Tag
                color="processing"
                style={{ cursor: 'pointer', padding: '4px 12px' }}
              >
                总是允许
              </Tag>
              <Tag
                color="error"
                style={{ cursor: 'pointer', padding: '4px 12px' }}
              >
                拒绝
              </Tag>
            </div>
          </Card>
        ),
      },
      {
        id: '17',
        label: '17. PureMarkdownRenderer 直接渲染（无消息气泡包装）',
        keywords: 'pure raw markdown 直接 渲染',
        render: () => (
          <div
            style={{
              background: token.colorBgContainer,
              padding: 16,
              borderRadius: token.borderRadiusLG,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
            className={
              isDarkMode ? 'ds-markdown ds-markdown-dark' : 'ds-markdown'
            }
          >
            <PureMarkdownRenderer id="preview-17" disableTyping>
              {RAW_MARKDOWN}
            </PureMarkdownRenderer>
          </div>
        ),
      },
    ];
    return all;
  }, [token, isDarkMode]);

  const filtered = filter
    ? sections.filter(
        (s) =>
          s.label.toLowerCase().includes(filter.toLowerCase()) ||
          s.keywords.toLowerCase().includes(filter.toLowerCase()),
      )
    : sections;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: token.colorBgLayout,
      }}
    >
      {/* Pulse animation for streaming indicator */}
      <style>{`
        @keyframes chatPreviewPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '8px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorBgContainer,
          flexShrink: 0,
          fontSize: 13,
        }}
      >
        <strong style={{ marginRight: 8 }}>Nuwax Markdown 渲染预览</strong>
        <Tag color={isDarkMode ? 'blue' : 'default'}>
          {isDarkMode ? 'Dark' : 'Light'}
        </Tag>
        <span style={{ color: token.colorTextQuaternary }}>|</span>
        <input
          type="text"
          placeholder="筛选渲染类型..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '4px 8px',
            border: `1px solid ${token.colorBorder}`,
            borderRadius: token.borderRadiusSM,
            fontSize: 13,
            width: 200,
            background: token.colorBgContainer,
            color: token.colorText,
          }}
        />
        <span
          style={{
            color: token.colorTextQuaternary,
            marginLeft: 'auto',
          }}
        >
          {filtered.length} / {sections.length} 个渲染类型
        </span>
        <span style={{ fontSize: 11, color: token.colorTextTertiary }}>
          对比参考:{' '}
          <a
            href="http://localhost:5180/"
            target="_blank"
            rel="noreferrer"
            style={{ color: token.colorPrimary }}
          >
            Workbench Preview ↗
          </a>
        </span>
      </div>

      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px 0',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px' }}>
          {filtered.map(({ id, label, render }) => (
            <Section key={id} label={label}>
              {render()}
            </Section>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: 'center',
          padding: '6px 0',
          fontSize: 10,
          color: token.colorTextQuaternary,
          background: token.colorBgContainer,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          flexShrink: 0,
        }}
      >
        Nuwax ChatPreview — 使用 PureMarkdownRenderer / MarkdownRenderer /
        RunOver 组件渲染
      </div>
    </div>
  );
};

export default ChatPreview;
