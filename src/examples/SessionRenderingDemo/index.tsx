/**
 * 会话交互处理及渲染演示页
 *
 * 覆盖 Agent 会话与 AppDev 会话的核心状态形态：
 * - 消息增量渲染、思考内容、完成态
 * - 后端任务 EXECUTING 但本地流式已结束
 * - 活跃会话期间的发送入队
 * - AppDev 首条消息透传、附件、计划与工具调用回放
 *
 * 访问：/examples/session-rendering-demo
 */
import { UnifiedChatSession } from '@/components/business-component';
import {
  AssistantRoleEnum,
  DefaultSelectedEnum,
  TaskStatus,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import { AgentTypeEnum } from '@/types/enums/space';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  DatabaseOutlined,
  LoadingOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Input,
  List,
  Radio,
  Row,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Link } from 'umi';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

type AgentScenario = 'complete' | 'streaming' | 'executing' | 'loadingMore';

let messageSeq = 100;
const now = () => Date.now();

const createUserMessage = (text: string): MessageInfo =>
  ({
    id: `demo-user-${++messageSeq}`,
    role: AssistantRoleEnum.USER,
    messageType: 'USER',
    text,
    status: MessageStatusEnum.Complete,
    time: now(),
  } as any);

const createAssistantMessage = (
  text: string,
  options: Partial<MessageInfo> = {},
): MessageInfo =>
  ({
    id: `demo-assistant-${++messageSeq}`,
    role: AssistantRoleEnum.ASSISTANT,
    messageType: 'ASSISTANT',
    text,
    think: '',
    status: MessageStatusEnum.Complete,
    time: now(),
    ...options,
  } as any);

const baseMessages: MessageInfo[] = [
  {
    id: '',
    role: AssistantRoleEnum.ASSISTANT,
    messageType: 'ASSISTANT',
    text: '我是开场白占位；当真实消息存在时会被过滤。',
    time: now() - 3000,
  } as any,
  {
    id: 'demo-user-initial',
    role: AssistantRoleEnum.USER,
    messageType: 'USER',
    text: '帮我做一个插件调试面板，展示请求参数和执行结果。',
    status: MessageStatusEnum.Complete,
    time: now() - 2000,
  } as any,
  {
    id: 'demo-assistant-initial',
    role: AssistantRoleEnum.ASSISTANT,
    messageType: 'ASSISTANT',
    think:
      '我会先确认目标场景，再规划 UI 结构和数据流，最后给出可测试的实现步骤。',
    text:
      '可以。建议拆成三块：\n\n' +
      '1. 参数编辑区：展示输入 schema 和默认值。\n' +
      '2. 执行日志区：记录每次 try-run 的请求与响应。\n' +
      '3. 结果预览区：按 JSON / 表格两种方式切换。',
    status: MessageStatusEnum.Complete,
    time: now() - 1000,
  } as any,
];

const scenarioMeta: Record<
  AgentScenario,
  { label: string; tag: string; description: string }
> = {
  complete: {
    label: '完成态',
    tag: 'Complete',
    description: '用户消息、思考内容、助手正文和建议问题完整渲染。',
  },
  streaming: {
    label: '流式中',
    tag: 'Loading',
    description: '末条助手消息仍处于 Loading，用于检查自动置底和 typing 样式。',
  },
  executing: {
    label: '后端执行中',
    tag: 'EXECUTING',
    description:
      '本地流式已结束，但 taskStatus 仍为 EXECUTING，会展示等待提示且不误判为本地流式。',
  },
  loadingMore: {
    label: '加载更多历史',
    tag: 'History',
    description: '消息数量达到分页阈值，顶部 sentinel 可触发加载更多历史。',
  },
};

const makeScenarioMessages = (scenario: AgentScenario): MessageInfo[] => {
  if (scenario === 'streaming') {
    return [
      ...baseMessages,
      createUserMessage('继续细化异常态和加载态。'),
      createAssistantMessage(
        '正在补充异常态：网络失败、接口超时、参数校验失败',
        {
          think: '正在分析已有消息与目标页面状态。',
          status: MessageStatusEnum.Loading,
        },
      ),
    ];
  }

  if (scenario === 'loadingMore') {
    return [
      ...Array.from({ length: 20 }, (_, index) =>
        index % 2 === 0
          ? createUserMessage(`历史用户消息 ${index + 1}`)
          : createAssistantMessage(`历史助手回复 ${index + 1}`),
      ),
      ...baseMessages,
    ];
  }

  return baseMessages;
};

const appDevTimeline = [
  {
    color: 'blue',
    title: '入口透传',
    description:
      '网页应用开发 / 智能体开发 / 插件开发 / 技能开发把 prompt、文件、技能和组件上下文写入 handoff context。',
  },
  {
    color: 'cyan',
    title: '自动发送',
    description:
      'useAppDevInitialAutoSend 消费上下文，调用 sendMessageWithPrompt，避免 setChatInput 后立即发送的状态竞态。',
  },
  {
    color: 'purple',
    title: '会话占位',
    description:
      'useAppDevChat 先追加 USER 消息和 ASSISTANT 空白占位，后续 SSE chunk 增量写入同一个 requestId。',
  },
  {
    color: 'green',
    title: '渲染完成',
    description:
      'ChatArea 按 role 渲染用户附件、助手 thinking、Plan / ToolCall markdown 标记和完成态。',
  },
];

const appDevPayload = {
  prompt: '把我的技能开发页做成带运行结果预览的调试工作台',
  requestId: 'demo-request-appdev-1',
  selectedModelId: 2002,
  skillIds: [301, 302],
  attachments: [
    { type: 'Image', filename: 'mockup.png' },
    { type: 'Document', filename: 'prd.pdf' },
  ],
  selectedDataResources: [
    { id: 11, name: 'Plugin try-run', type: 'plugin' },
    { id: 12, name: 'Skill formatter workflow', type: 'workflow' },
  ],
};

const appDevRenderedMessages = [
  {
    role: 'USER',
    title: '用户消息',
    text: appDevPayload.prompt,
    tags: ['mockup.png', 'prd.pdf', 'skill:301', 'plugin:11'],
  },
  {
    role: 'ASSISTANT',
    title: '思考过程',
    text: '识别到这是技能开发场景，需要保留技能 ID、插件数据源和原型图上下文。',
    tags: ['thinking'],
  },
  {
    role: 'ASSISTANT',
    title: '执行计划',
    text: '生成调试工作台布局、补充运行结果面板、绑定 try-run 数据。',
    tags: ['appdev-plan'],
  },
  {
    role: 'ASSISTANT',
    title: '工具调用',
    text: 'Read File -> Update File -> Restart Dev Server -> Complete',
    tags: ['tool_call', 'tool_call_update'],
  },
];

const SessionRenderingDemo: React.FC = () => {
  const [scenario, setScenario] = useState<AgentScenario>('complete');
  const [input, setInput] = useState('演示发送一条消息');
  const [localMessages, setLocalMessages] =
    useState<MessageInfo[]>(baseMessages);
  const [isLocalStreaming, setIsLocalStreaming] = useState(false);
  const [taskExecuting, setTaskExecuting] = useState(false);
  const replyTimerRef = useRef<number | null>(null);

  const scenarioMessages = useMemo(() => {
    if (scenario === 'complete') return localMessages;
    return makeScenarioMessages(scenario);
  }, [localMessages, scenario]);

  const conversationInfo = useMemo(
    () =>
      ({
        id: 88001,
        taskStatus:
          scenario === 'executing' || taskExecuting
            ? TaskStatus.EXECUTING
            : TaskStatus.COMPLETE,
      } as any),
    [scenario, taskExecuting],
  );

  const handleSend = useCallback((text: string) => {
    const value = text.trim();
    if (!value) return;

    setLocalMessages((prev) => [
      ...prev,
      createUserMessage(value),
      createAssistantMessage('正在处理你的输入...', {
        think: '收到用户输入，准备进行上下文归纳。',
        status: MessageStatusEnum.Loading,
      }),
    ]);
    setScenario('complete');
    setIsLocalStreaming(true);
    setTaskExecuting(false);

    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
    }
    replyTimerRef.current = window.setTimeout(() => {
      setLocalMessages((prev) =>
        prev.map((message, index) =>
          index === prev.length - 1
            ? {
                ...message,
                text: '这是本地模拟回复。真实链路中，SSE 会持续追加正文、工具调用和最终状态。',
                status: MessageStatusEnum.Complete,
              }
            : message,
        ),
      );
      setIsLocalStreaming(false);
      replyTimerRef.current = null;
    }, 1200);
  }, []);

  const handleSimulateExecuting = () => {
    setScenario('executing');
    setTaskExecuting(true);
    setIsLocalStreaming(false);
  };

  const handleStop = useCallback(async () => {
    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
    setIsLocalStreaming(false);
    setTaskExecuting(false);
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Paragraph type="secondary" className={styles.back}>
          <Link to="/examples">返回示例中心</Link>
        </Paragraph>
        <Space align="start" className={styles.headerRow}>
          <div>
            <Title level={3} className={styles.title}>
              会话交互处理及渲染演示
            </Title>
            <Paragraph type="secondary" className={styles.subtitle}>
              路由：<Text code>/examples/session-rendering-demo</Text>
            </Paragraph>
          </div>
          <Tag color="blue">Agent / AppDev</Tag>
        </Space>
        <Alert
          type="info"
          showIcon
          className={styles.notice}
          message="演示目标"
          description="用本地 Mock 数据演示核心会话状态，不依赖后端。可以对照单测覆盖点检查消息渲染、加载更多、流式结束、后端执行中和 AppDev 首条透传。"
        />
      </header>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card
            title={
              <Space>
                <SendOutlined />
                Agent 会话渲染
              </Space>
            }
            className={styles.sessionCard}
            extra={
              <Radio.Group
                size="small"
                value={scenario}
                onChange={(event) => setScenario(event.target.value)}
              >
                {Object.entries(scenarioMeta).map(([key, item]) => (
                  <Radio.Button key={key} value={key}>
                    {item.label}
                  </Radio.Button>
                ))}
              </Radio.Group>
            }
          >
            <div className={styles.scenarioBar}>
              <Space wrap>
                <Tag color="processing">{scenarioMeta[scenario].tag}</Tag>
                <Text type="secondary">
                  {scenarioMeta[scenario].description}
                </Text>
              </Space>
              <Button size="small" onClick={handleSimulateExecuting}>
                模拟后台执行中
              </Button>
            </div>

            <div className={styles.sessionShell}>
              <UnifiedChatSession
                conversationId={88001}
                messageList={scenarioMessages}
                isLoading={false}
                loadingMore={scenario === 'loadingMore'}
                isMoreMessage={scenario === 'loadingMore'}
                isConversationActive={isLocalStreaming || taskExecuting}
                isLocallyStreaming={isLocalStreaming}
                messageBottomMode="chat"
                showDebug={false}
                agentInfo={{
                  id: 9001,
                  name: 'Session Demo Agent',
                  type: AgentTypeEnum.TaskAgent,
                  allowChooseMode: DefaultSelectedEnum.Yes,
                  openingChatMsg: '选择一个场景开始演示。',
                  guidQuestionDtos: [
                    '演示流式渲染',
                    '演示后台执行中',
                    '演示加载更多历史',
                  ],
                }}
                selectedModelId={2002}
                allowOtherModel={DefaultSelectedEnum.No}
                initialAgentMode="yolo"
                onSendMessage={handleSend}
                onLoadMoreMessage={() => setScenario('loadingMore')}
                runStopConversation={async () => {
                  await handleStop();
                  return {};
                }}
                disabledConversationActive={() => void handleStop()}
                loadingStopConversation={false}
                getCurrentConversationId={() => 88001}
                getCurrentConversationRequestId={() => 'demo-request-agent-1'}
                loadingConversation={false}
                isLoadingOtherInterface={false}
                conversationInfo={conversationInfo}
                queueContext={{
                  streamActive: isLocalStreaming,
                  taskExecuting,
                  runStopConversation: () => void handleStop(),
                }}
                chatSuggestList={[
                  '继续补充异常态',
                  '展示工具调用过程',
                  '生成 AppDev 首条消息',
                ]}
                enableMention={false}
                voiceInputMock
              />
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                交互状态说明
              </Space>
            }
            className={styles.sideCard}
          >
            <Timeline
              items={[
                {
                  color: 'blue',
                  children: '发送消息：重置自动滚动，调用队列 trySend。',
                },
                {
                  color: 'orange',
                  children:
                    '会话活跃或任务执行中：新消息进入待发送队列，不打断当前输出。',
                },
                {
                  color: 'green',
                  children:
                    '流式结束：末条 Loading -> Complete，触发置底兜底与建议问题展示。',
                },
                {
                  color: 'purple',
                  children:
                    '后台仍 EXECUTING：本地流式为 false，但等待提示仍可展示。',
                },
              ]}
            />
            <Divider />
            <Input.Search
              value={input}
              onChange={(event) => setInput(event.target.value)}
              enterButton="发送到演示会话"
              onSearch={handleSend}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <DatabaseOutlined />
                AppDev 首条透传 payload
              </Space>
            }
            className={styles.sideCard}
          >
            <pre className={styles.payload}>
              {JSON.stringify(appDevPayload, null, 2)}
            </pre>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <CodeOutlined />
                AppDev 会话渲染回放
              </Space>
            }
            className={styles.sideCard}
          >
            <Timeline
              items={appDevTimeline.map((item) => ({
                color: item.color,
                children: (
                  <div>
                    <Text strong>{item.title}</Text>
                    <Paragraph type="secondary" className={styles.timelineText}>
                      {item.description}
                    </Paragraph>
                  </div>
                ),
              }))}
            />
            <Divider />
            <List
              dataSource={appDevRenderedMessages}
              renderItem={(item) => (
                <List.Item className={styles.renderItem}>
                  <List.Item.Meta
                    avatar={
                      item.role === 'USER' ? (
                        <SendOutlined className={styles.renderIconUser} />
                      ) : item.tags.includes('tool_call') ? (
                        <LoadingOutlined
                          className={styles.renderIconAssistant}
                        />
                      ) : (
                        <CheckCircleOutlined
                          className={styles.renderIconAssistant}
                        />
                      )
                    }
                    title={
                      <Space wrap>
                        <Text strong>{item.title}</Text>
                        {item.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </Space>
                    }
                    description={item.text}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SessionRenderingDemo;
