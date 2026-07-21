/**
 * MCP Ask 重复询问本地示例页
 *
 * 用用户提供的真实 ASK_QUESTION SSE 载荷，模拟两轮同 title 询问，
 * 验证第二次 Ask 在第一次 resume 后仍能弹出 Dock 卡片。
 * 访问：/examples/mcp-ask-duplicate-demo
 */
import { AgentInterventionChatLayer } from '@/components/business-component/AgentIntervention';
import { useActiveInterventionQueue } from '@/components/business-component/AgentIntervention/hooks/useActiveInterventionQueue';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '@/components/business-component/AgentIntervention/types/mcpAskIntervention';
import {
  buildMcpAskResumeMessage,
  hasMcpAskResumeMessage,
  stripMcpAskResumeDisplayArtifacts,
} from '@/components/business-component/AgentIntervention/utils/mcpAskResumeMessage';
import { extractMcpAskFormAttachments } from '@/components/business-component/AgentIntervention/utils/normalizeMcpAskFormData';
import { processInterventionSsePatch } from '@/components/business-component/AgentIntervention/utils/processInterventionSsePatch';
import { reconcileMcpAskHydratedMessageList } from '@/components/business-component/AgentIntervention/utils/reconcileMcpAskHydratedStatus';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, { useCallback, useMemo, useState } from 'react';
import { Link } from 'umi';
import styles from './index.less';
import {
  FIRST_EXECUTE_ID,
  FIRST_REQUEST_ID,
  MCP_ASK_FIRST_SSE,
  MCP_ASK_SECOND_SSE,
  SECOND_EXECUTE_ID,
  SECOND_REQUEST_ID,
} from './mockSsePayloads';

const cx = classNames.bind(styles);
const { Title, Paragraph, Text } = Typography;

let messageSeq = 0;

function createWelcomeMessage(): MessageInfo {
  return {
    id: `msg-welcome-${messageSeq}`,
    index: messageSeq++,
    role: AssistantRoleEnum.ASSISTANT,
    text: '点击下方「推送第 1 次 AskQuestion」开始模拟。两次询问 title 均为「补充回复」，但 requestId / executeId 不同。',
    status: MessageStatusEnum.Complete,
  } as MessageInfo;
}

function getNextIndex(messages: MessageInfo[]): number {
  if (!messages.length) {
    return 0;
  }
  return Math.max(...messages.map((item) => item.index ?? 0)) + 1;
}

/** 从消息列表收集所有 MCP Ask 交互及所在消息下标 */
function collectMcpAskRows(messages: MessageInfo[]) {
  const rows: Array<{
    messageIndex: number;
    interaction: McpAskInteraction;
  }> = [];

  messages.forEach((message, messageIndex) => {
    message.mcpAskInteractions?.forEach((interaction) => {
      rows.push({ messageIndex, interaction });
    });
  });

  return rows;
}

const McpAskDuplicateDemo: React.FC = () => {
  const [messages, setMessages] = useState<MessageInfo[]>([
    createWelcomeMessage(),
  ]);
  const [firstAskPushed, setFirstAskPushed] = useState(false);
  const [firstAskResponded, setFirstAskResponded] = useState(false);
  const [secondAskPushed, setSecondAskPushed] = useState(false);

  const activeQueue = useActiveInterventionQueue(messages);
  const mcpAskRows = useMemo(() => collectMcpAskRows(messages), [messages]);

  const pushAskSse = useCallback(
    (ssePayload: ConversationChatResponse, assistantText: string) => {
      setMessages((prev) => {
        const nextIndex = getNextIndex(prev);
        const assistantMessage = {
          id: `msg-assistant-${++messageSeq}`,
          index: nextIndex,
          role: AssistantRoleEnum.ASSISTANT,
          text: assistantText,
          status: MessageStatusEnum.Loading,
        } as MessageInfo;

        const patched = processInterventionSsePatch(
          ssePayload,
          assistantMessage,
          prev,
        );

        if (!patched) {
          return prev;
        }

        return [...prev, patched];
      });
    },
    [],
  );

  const handlePushFirst = useCallback(() => {
    pushAskSse(MCP_ASK_FIRST_SSE, '（Agent）第 1 次 AskQuestion：补充回复');
    setFirstAskPushed(true);
  }, [pushAskSse]);

  const handlePushSecond = useCallback(() => {
    pushAskSse(MCP_ASK_SECOND_SSE, '（Agent）第 2 次 AskQuestion：补充回复');
    setSecondAskPushed(true);
  }, [pushAskSse]);

  const handleReset = useCallback(() => {
    messageSeq = 0;
    setMessages([createWelcomeMessage()]);
    setFirstAskPushed(false);
    setFirstAskResponded(false);
    setSecondAskPushed(false);
  }, []);

  const handleRespondMcpAsk = useCallback(
    (interaction: McpAskInteraction, payload: McpAskRespondPayload) => {
      const requestId = interaction.input.requestId;
      const resumeText = buildMcpAskResumeMessage(interaction, payload);
      const uploadFiles =
        payload.files ??
        extractMcpAskFormAttachments(
          payload.formData ?? {},
          interaction.input.ui,
        );
      const attachments = uploadFiles.map((file) => ({
        fileKey: file.key || file.uid || '',
        fileUrl: file.url || '',
        fileName: file.name || '',
        mimeType: file.type || '',
      }));
      const resolveStatus = (): McpAskInteraction['responseStatus'] => {
        if (payload.action === 'cancel') return 'cancelled';
        if (payload.action === 'skip') return 'skipped';
        return 'submitted';
      };

      setMessages((prev) => {
        const updated = prev.map((message) => {
          if (
            !message.mcpAskInteractions?.some(
              (item) => item.input.requestId === requestId,
            )
          ) {
            return message;
          }

          return {
            ...message,
            status: MessageStatusEnum.Complete,
            mcpAskInteractions: message.mcpAskInteractions.map((item) =>
              item.input.requestId === requestId
                ? {
                    ...item,
                    responseStatus: resolveStatus(),
                    formData: payload.formData,
                  }
                : item,
            ),
          };
        });

        const userMessage = {
          id: `msg-user-resume-${requestId}`,
          index: getNextIndex(updated),
          role: AssistantRoleEnum.USER,
          text: resumeText,
          attachments: attachments.length ? attachments : undefined,
          status: MessageStatusEnum.Complete,
        } as MessageInfo;

        const merged = [...updated, userMessage];
        return reconcileMcpAskHydratedMessageList(merged, merged);
      });

      if (requestId === FIRST_REQUEST_ID) {
        setFirstAskResponded(true);
      }
    },
    [],
  );

  return (
    <div className={cx(styles['demo-wrap'])}>
      <Link to="/examples">← 返回示例索引</Link>
      <Title level={3} className={cx(styles['demo-title'])}>
        MCP Ask 重复询问 Demo
      </Title>
      <Paragraph type="secondary" className={cx(styles['demo-desc'])}>
        复现同 title「补充回复」的两次 ASK_QUESTION SSE。第一次提交 resume 后，
        第二次应仍能弹出 Dock 表单。修复前会因 legacy title 匹配误判为已回答。
      </Paragraph>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <div className={cx(styles.session)}>
            <div className={cx(styles['msg-list'])}>
              {messages.map((message) => {
                const isUser = message.role === AssistantRoleEnum.USER;
                const displayText = isUser
                  ? stripMcpAskResumeDisplayArtifacts(message.text)
                  : message.text;

                return (
                  <div
                    key={message.id ?? message.index}
                    className={cx(
                      styles.msg,
                      isUser ? styles['msg-user'] : styles['msg-assistant'],
                    )}
                  >
                    {displayText}
                    {message.mcpAskInteractions?.length ? (
                      <div className={cx(styles['msg-meta'])}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          mcpAsk × {message.mcpAskInteractions.length}
                        </Text>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className={cx(styles['intervention-dock'])}>
              <AgentInterventionChatLayer
                messageList={messages}
                onRespondAcpPermission={async () => {}}
                onRespondMcpAsk={handleRespondMcpAsk}
              />
            </div>
          </div>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            size="small"
            title="操作"
            className={cx(styles['console-card'])}
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Space wrap>
                <Tag color={firstAskPushed ? 'success' : 'default'}>
                  第 1 次已推送
                </Tag>
                <Tag color={firstAskResponded ? 'success' : 'default'}>
                  第 1 次已回复
                </Tag>
                <Tag color={secondAskPushed ? 'success' : 'default'}>
                  第 2 次已推送
                </Tag>
                <Tag color={activeQueue.length ? 'processing' : 'default'}>
                  Dock 队列 {activeQueue.length}
                </Tag>
              </Space>

              <Space wrap>
                <Button
                  type="primary"
                  onClick={handlePushFirst}
                  disabled={firstAskPushed}
                >
                  推送第 1 次 AskQuestion
                </Button>
                <Button
                  type="primary"
                  onClick={handlePushSecond}
                  disabled={!firstAskResponded || secondAskPushed}
                >
                  推送第 2 次 AskQuestion
                </Button>
                <Button onClick={handleReset}>重置</Button>
              </Space>

              <Paragraph type="secondary" style={{ fontSize: 12, margin: 0 }}>
                流程：推送第 1 次 → Dock 填写提交 → 推送第 2 次 → Dock
                应再次弹出。
              </Paragraph>
            </Space>
          </Card>

          <Card size="small" title="调试面板" style={{ marginTop: 16 }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="第 1 次 requestId">
                <Text code copyable>
                  {FIRST_REQUEST_ID}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="第 1 次 executeId">
                <Text code>{FIRST_EXECUTE_ID}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="第 2 次 requestId">
                <Text code copyable>
                  {SECOND_REQUEST_ID}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="第 2 次 executeId">
                <Text code>{SECOND_EXECUTE_ID}</Text>
              </Descriptions.Item>
            </Descriptions>

            {mcpAskRows.length === 0 ? (
              <Paragraph type="secondary" style={{ marginTop: 12 }}>
                暂无 mcpAskInteractions
              </Paragraph>
            ) : (
              <Space
                direction="vertical"
                style={{ width: '100%', marginTop: 12 }}
              >
                {mcpAskRows.map(({ messageIndex, interaction }) => {
                  const resumeMatched = hasMcpAskResumeMessage(
                    messages,
                    interaction,
                    { containingMessageIndex: messageIndex },
                  );
                  const inQueue = activeQueue.some(
                    (item) =>
                      item.kind === 'mcp_ask' &&
                      item.interaction.input.requestId ===
                        interaction.input.requestId,
                  );

                  return (
                    <Card key={interaction.input.requestId} size="small">
                      <Space direction="vertical" size={4}>
                        <Text strong>{interaction.input.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          requestId: {interaction.input.requestId}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          executeId: {interaction.executeId ?? '—'}
                        </Text>
                        <Text style={{ fontSize: 12 }}>
                          responseStatus:{' '}
                          {interaction.responseStatus ?? 'pending'}
                        </Text>
                        <Space wrap>
                          <Tag color={resumeMatched ? 'red' : 'green'}>
                            hasMcpAskResumeMessage: {String(resumeMatched)}
                          </Tag>
                          <Tag color={inQueue ? 'processing' : 'default'}>
                            in Dock queue: {String(inQueue)}
                          </Tag>
                        </Space>
                      </Space>
                    </Card>
                  );
                })}
              </Space>
            )}
          </Card>

          <Paragraph type="secondary" style={{ marginTop: 16, fontSize: 12 }}>
            更多静态卡片形态见{' '}
            <Link to="/examples/agent-intervention-demo">
              Agent 干预交互卡片 Demo
            </Link>
          </Paragraph>
        </Col>
      </Row>
    </div>
  );
};

export default McpAskDuplicateDemo;
