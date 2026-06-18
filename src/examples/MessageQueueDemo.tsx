/**
 * MessageQueue 消息队列示例页
 *
 * 真实会话状态机 + 权限审批 / Ask·Question 卡片 + 待发送队列，全 Mock 驱动。
 * 访问：/examples/message-queue-demo
 *
 * 状态模型：
 * - active（会话活跃 = isConversationActive）：由 sendMessage 自动驱动
 *     发送消息 → active=true（AI 处理中）→ 回复完成 → active=false（触发消费下一条）
 * - 「模拟阻塞」开关 / 审批 / Ask 卡片：手动让 active=true（模拟会话被占用）
 *
 * 注：demo 用单信号简化。真实页面（useUnifiedChatQueue）入队判定用合并信号
 *    isActive（isConversationActive || taskStatus===EXECUTING，与发送按钮一致），
 *    而 auto-consume 触发用纯 isConversationActive，避免 taskStatus 状态机切换的中间空白误消费。
 */
import { AgentInterventionChatLayer } from '@/components/business-component/AgentIntervention';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
} from '@/components/business-component/AgentIntervention/types/acpIntervention';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '@/components/business-component/AgentIntervention/types/mcpAskIntervention';
import MessageQueuePanel, {
  useChatMessageQueue,
  type QueuedMessage,
} from '@/components/business-component/MessageQueue';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { PlusOutlined, SendOutlined, StopOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  List,
  Row,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'umi';
import {
  createAcpInteraction,
  createMcpInteraction,
} from './AgentInterventionDemo/mockData';
import styles from './MessageQueueDemo.less';

const cx = classNames.bind(styles);
const { Title, Paragraph, Text } = Typography;

interface LogRecord {
  key: string;
  text: string;
}

let msgSeq = 0;
const makeUserMessage = (text: string): MessageInfo =>
  ({
    id: `m-${++msgSeq}`,
    role: 'user',
    demoText: text,
    status: 'complete',
  } as any);
const makeAssistantMessage = (
  text: string,
  status: any = 'complete',
): MessageInfo =>
  ({ id: `m-${++msgSeq}`, role: 'assistant', demoText: text, status } as any);

const REPLY_DELAY = 1200;

const MessageQueueDemo: React.FC = () => {
  // 会话活跃（= isConversationActive）：sendMessage 自动驱动，开关/审批可手动占据
  const [active, setActive] = useState(false);
  // 队列消费最小间隔（ms），可调，对应会话框的 queueMinConsumeInterval
  const [minInterval, setMinInterval] = useState(500);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<MessageInfo[]>([
    makeAssistantMessage(
      '你好！打开「模拟阻塞」开关或点「添加审批 / Ask」让会话进入活跃，连发多条消息即可入队；关闭阻塞后队列会逐条自动发送（每条发送→活跃→回复完成→发下一条）。',
    ),
  ]);
  const [logs, setLogs] = useState<LogRecord[]>([]);
  const replyTimerRef = useRef<number | null>(null);

  const log = useCallback((text: string) => {
    setLogs((prev) =>
      [{ key: `${Date.now()}-${Math.random()}`, text }, ...prev].slice(0, 60),
    );
  }, []);

  // mock：真正发送 → 会话活跃 → REPLY_DELAY 后回复完成转空闲（触发消费下一条）
  const sendMessage = useCallback(
    (messageInfo: string) => {
      setMessages((prev) => [...prev, makeUserMessage(messageInfo)]);
      setActive(true);
      log(`📤 发送："${messageInfo}" → 会话活跃`);
      if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
      replyTimerRef.current = window.setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          makeAssistantMessage(`（回复）收到："${messageInfo}"`),
        ]);
        setActive(false);
        log(`✅ 回复完成 → 会话空闲（触发下一条消费）`);
      }, REPLY_DELAY);
    },
    [log],
  );

  const runStopConversation = useCallback(() => {
    if (replyTimerRef.current) {
      window.clearTimeout(replyTimerRef.current);
      replyTimerRef.current = null;
    }
    setActive(false);
    log('⏹ 停止会话 → 立即空闲');
  }, [log]);

  const messageQueue = useChatMessageQueue({
    isConversationActive: active,
    messageList: messages,
    conversationId: 'demo-conv',
    sendMessage,
    runStopConversation,
    minConsumeInterval: minInterval,
  });

  const handleEdit = useCallback(
    (qMsg: QueuedMessage) => {
      const item = messageQueue.editQueued(qMsg);
      if (item) {
        setInput(item.text);
        log(`✏️ 编辑回填：${item.text}`);
      }
    },
    [messageQueue, log],
  );

  const handleSendClick = () => {
    const value = input.trim();
    if (!value) return;
    if (active) log(`📥 入队："${value}"`);
    messageQueue.trySend(value);
    setInput('');
  };

  const showStop = active && !input.trim();

  const addAcp = () => {
    setMessages((prev) => [
      ...prev,
      {
        ...makeAssistantMessage('我需要执行一个操作，需要你授权：', 'loading'),
        acpPermissionInteractions: [createAcpInteraction()],
      } as any,
    ]);
    setActive(true);
    log('➕ 添加 ACP 权限审批（会话占用）');
  };
  const addMcp = () => {
    setMessages((prev) => [
      ...prev,
      {
        ...makeAssistantMessage('请回答下面的问题：', 'loading'),
        mcpAskInteractions: [
          createMcpInteraction('请填写项目信息', {
            projectName: { type: 'string', title: '项目名称' },
            framework: {
              type: 'string',
              title: '前端框架',
              enum: ['React', 'Vue', 'Angular'],
            },
          }),
        ],
      } as any,
    ]);
    setActive(true);
    log('➕ 添加 Ask/Question（会话占用）');
  };

  const onRespondAcpPermission = useCallback(
    (
      interaction: AcpPermissionInteraction,
      response: AcpRequestPermissionResponse,
    ) => {
      const outcomeDesc =
        response.outcome.outcome === 'selected'
          ? response.outcome.optionId
          : 'cancelled';
      log(`✅ 审批响应：${outcomeDesc} → 释放占用`);
      setActive(false);
      setMessages((prev) =>
        prev.map((m: any) =>
          m.acpPermissionInteractions
            ? {
                ...m,
                acpPermissionInteractions: m.acpPermissionInteractions.map(
                  (i: AcpPermissionInteraction) =>
                    i.intervention.id === interaction.intervention.id
                      ? { ...i, responseStatus: 'submitted' as const }
                      : i,
                ),
              }
            : m,
        ),
      );
    },
    [log],
  );

  const onRespondMcpAsk = useCallback(
    (interaction: McpAskInteraction, payload: McpAskRespondPayload) => {
      log(`✏️ Ask 响应：${payload.action} → 释放占用`);
      setActive(false);
      setMessages((prev) =>
        prev.map((m: any) =>
          m.mcpAskInteractions
            ? {
                ...m,
                mcpAskInteractions: m.mcpAskInteractions.map(
                  (i: McpAskInteraction) =>
                    i.input.requestId === interaction.input.requestId
                      ? {
                          ...i,
                          responseStatus:
                            payload.action === 'cancel'
                              ? ('cancelled' as any)
                              : ('submitted' as any),
                          hasMcpAskResumeMessage: true as any,
                        }
                      : i,
                ),
              }
            : m,
        ),
      );
    },
    [log],
  );

  React.useEffect(
    () => () => {
      if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
    },
    [],
  );

  return (
    <div className={cx(styles['demo-wrap'])}>
      <Link to="/examples">← 返回示例索引</Link>
      <Title level={3} className={cx(styles['demo-title'])}>
        MessageQueue 消息队列 Demo
      </Title>
      <Paragraph type="secondary" className={cx(styles['demo-desc'])}>
        真实会话状态机：发送消息后会话自动活跃，AI
        回复完成后转空闲并触发队列消费下一条。「模拟阻塞」/ 审批 / Ask
        卡片会让会话被占用，此时发送的消息进入队列。
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <div className={cx(styles.session)}>
            <div className={cx(styles['msg-list'])}>
              {messages.map((m: any) => (
                <div
                  key={m.id}
                  className={cx(
                    styles.msg,
                    m.role === 'user'
                      ? styles['msg-user']
                      : styles['msg-assistant'],
                  )}
                >
                  {m.demoText}
                </div>
              ))}
            </div>

            <div className={cx(styles['intervention-dock'])}>
              <AgentInterventionChatLayer
                messageList={messages}
                onRespondAcpPermission={onRespondAcpPermission}
                onRespondMcpAsk={onRespondMcpAsk}
              />
            </div>

            <div className={cx(styles['input-area'])}>
              <div className={cx(styles['queue-wrap'])}>
                <MessageQueuePanel
                  queue={messageQueue.queue}
                  onSendNow={(m) => {
                    messageQueue.sendNow(m);
                    log(`⚡ 立即发送：${m.text}`);
                  }}
                  onDelete={(id) => {
                    messageQueue.deleteQueued(id);
                    log(`❌ 删除：${id}`);
                  }}
                  onEdit={handleEdit}
                  onClear={() => {
                    messageQueue.clearQueue();
                    log('🗑 清空');
                  }}
                  onReorder={(from, to) => {
                    messageQueue.reorder(from, to);
                    log(`↕️ 排序：${from} → ${to}`);
                  }}
                />
              </div>
              <div className={cx(styles['input-row'])}>
                <Input.TextArea
                  rows={1}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    active ? '会话活跃中，发送将加入队列…' : '输入消息…'
                  }
                  onPressEnter={handleSendClick}
                />
                <span
                  className={cx(
                    styles['send-btn'],
                    showStop && styles.stop,
                    !showStop && !input.trim() && styles.disabled,
                  )}
                  onClick={() => {
                    if (showStop) {
                      runStopConversation();
                    } else {
                      handleSendClick();
                    }
                  }}
                >
                  {showStop ? <StopOutlined /> : <SendOutlined />}
                </span>
              </div>
            </div>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            size="small"
            title="控制台"
            className={cx(styles['console-card'])}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space wrap>
                <Tag color={active ? 'processing' : 'default'}>
                  {active ? '会话活跃' : '会话空闲'}
                </Tag>
                <Tag
                  color={messageQueue.hasQueuedMessages ? 'orange' : 'default'}
                >
                  队列 {messageQueue.queue.length}
                </Tag>
              </Space>
              <Space>
                <Text>模拟阻塞：</Text>
                <Switch
                  checked={active}
                  onChange={(v) => {
                    setActive(v);
                    log(
                      v ? '🔒 开启占用（会话活跃）' : '🔓 关闭占用 → 触发消费',
                    );
                  }}
                />
              </Space>
              <Space>
                <Text>消费间隔(ms)：</Text>
                <InputNumber
                  min={0}
                  max={5000}
                  step={100}
                  value={minInterval}
                  onChange={(v) => setMinInterval(v ?? 500)}
                />
              </Space>
              <Space wrap>
                <Button icon={<PlusOutlined />} onClick={addAcp}>
                  添加审批
                </Button>
                <Button icon={<PlusOutlined />} onClick={addMcp}>
                  添加 Ask
                </Button>
              </Space>
              <Button
                block
                onClick={() => {
                  messageQueue.clearQueue();
                  setMessages([messages[0]]);
                  setActive(false);
                  log('🗑 重置');
                }}
              >
                重置
              </Button>
              <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                <Text strong>测试连续消费：</Text>
                开「模拟阻塞」→ 连发 3 条（入队）→ 关阻塞 →
                队列逐条发送：每条发送后会话活跃（开关自动
                ON），回复完成后（开关自动 OFF）发下一条。
              </Paragraph>
            </Space>
          </Card>

          <Card size="small" title="事件日志" style={{ marginTop: 16 }}>
            <List
              size="small"
              dataSource={logs}
              locale={{ emptyText: '暂无日志' }}
              renderItem={(item) => (
                <List.Item className={cx(styles['log-item'])}>
                  <Text style={{ fontSize: 12 }}>{item.text}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MessageQueueDemo;
