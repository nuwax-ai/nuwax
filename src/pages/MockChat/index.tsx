/**
 * 会话终态收敛开发验收页。
 *
 * 场景控制走 Umi mock，消息处理和 UI 则完整复用 conversationInfo model 与
 * UnifiedChatSession，确保手工验收覆盖生产路径而非另一套演示实现。
 */
import { UnifiedChatSession } from '@/components/business-component';
import {
  MOCK_SCENARIOS,
  type MockScenarioId,
} from '@/mocks/conversationScenarios';
import { apiAgentConversation } from '@/services/agentConfig';
import { DefaultSelectedEnum, TaskStatus } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';

const { Paragraph, Text, Title } = Typography;
const MOCK_CONVERSATION_ID = 999999;

type MockServerStatus = {
  scenario: MockScenarioId;
  taskStatus: TaskStatus;
  pollCount: number;
  emittedEvents: Array<{ eventType: string; data?: Record<string, unknown> }>;
};

const speedOptions = [
  { label: '瞬间', value: 0.05 },
  { label: '快速', value: 0.25 },
  { label: '正常', value: 1 },
];

const isTerminal = (status?: TaskStatus) =>
  status === TaskStatus.COMPLETE ||
  status === TaskStatus.FAILED ||
  status === TaskStatus.CANCEL;

const MockChat: React.FC = () => {
  const model = useModel('conversationInfo');
  const [scenarioId, setScenarioId] = useState<MockScenarioId>('NORMAL_SINGLE');
  const [speed, setSpeed] = useState(0.25);
  const [preparing, setPreparing] = useState(false);
  const [serverStatus, setServerStatus] = useState<MockServerStatus>();
  const [lastError, setLastError] = useState('');
  const subTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const didInitialPrepareRef = useRef(false);

  const scenario = useMemo(
    () => MOCK_SCENARIOS.find((item) => item.id === scenarioId)!,
    [scenarioId],
  );

  const refreshServerStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/mock/conversation/status');
      const result = await response.json();
      setServerStatus(result.data);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(refreshServerStatus, 250);
    return () => window.clearInterval(timer);
  }, [refreshServerStatus]);

  useEffect(
    () => () => {
      if (subTimerRef.current) clearTimeout(subTimerRef.current);
      model.abortResumeStream();
      model.handleClearSideEffect();
    },
    // model 是 Umi 动态对象；这里只在页面卸载时清理连接。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const prepareScenario = useCallback(async () => {
    setPreparing(true);
    setLastError('');
    try {
      model.abortResumeStream();
      model.handleClearSideEffect();
      model.setMessageList([]);
      model.setConversationInfo(null);

      const response = await fetch('/api/mock/conversation/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId, speed }),
      });
      if (!response.ok)
        throw new Error(`场景初始化失败：HTTP ${response.status}`);

      await model.runAsync(MOCK_CONVERSATION_ID);
      await refreshServerStatus();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      setPreparing(false);
    }
  }, [model, refreshServerStatus, scenarioId, speed]);

  useEffect(() => {
    if (didInitialPrepareRef.current) return;
    didInitialPrepareRef.current = true;
    void prepareScenario();
  }, [prepareScenario]);

  const play = useCallback(async () => {
    await prepareScenario();
    await model.onMessageSend({
      id: MOCK_CONVERSATION_ID,
      messageInfo: `执行 Mock 场景：${scenario.label}`,
      sandboxId: 'mock-sandbox',
      debug: false,
      isSync: false,
      agentMode: 'yolo',
    });

    if (scenario.transport === 'sub-only') {
      subTimerRef.current = setTimeout(() => {
        model.resumeConversationStream(
          MOCK_CONVERSATION_ID,
          model.messageList || [],
          refreshServerStatus,
          `mock:${scenario.id}`,
        );
      }, 400);
    }

    if (scenario.id === 'IDLE_POLL_TERMINAL') {
      subTimerRef.current = setTimeout(async () => {
        const result = await apiAgentConversation(MOCK_CONVERSATION_ID);
        if (result?.data) {
          model.syncConversationSnapshotMessages(result.data);
          if (isTerminal(result.data.taskStatus)) {
            model.finalizeConversationTerminal(
              MOCK_CONVERSATION_ID,
              result.data.taskStatus,
              'mock-poll-snapshot',
            );
          }
        }
        await refreshServerStatus();
      }, 600);
    }
  }, [model, prepareScenario, refreshServerStatus, scenario]);

  const sendMessage = useCallback(
    (
      messageInfo: string,
      files?: UploadFileInfo[],
      skillIds?: number[],
      modelId?: number,
      selectedAgentMode?: 'yolo' | 'ask',
    ) => {
      void model.onMessageSend({
        id: MOCK_CONVERSATION_ID,
        messageInfo,
        files,
        skillIds,
        modelId,
        sandboxId: 'mock-sandbox',
        debug: false,
        isSync: false,
        agentMode: selectedAgentMode || 'yolo',
      });
    },
    [model],
  );

  const stop = useCallback(async () => {
    await model.runStopConversation(
      model.getCurrentConversationRequestId() || MOCK_CONVERSATION_ID,
    );
    await refreshServerStatus();
  }, [model, refreshServerStatus]);

  const messageList = (model.messageList || []) as MessageInfo[];
  const executingProcessingCount = messageList.reduce(
    (count, message) =>
      count +
      (message.processingList || []).filter(
        (item) => item.status === ProcessingEnum.EXECUTING,
      ).length,
    0,
  );
  const hasFinalResult = Boolean(
    serverStatus?.emittedEvents.some(
      (event) => event.eventType === 'FINAL_RESULT',
    ),
  );
  const terminalExpected = scenario.events.some(
    (event) => event.eventType === 'FINAL_RESULT',
  );
  const hangingExpected = scenario.transport === 'keep-open';
  const assertions = [
    {
      label: '真实会话模型已加载 Mock 会话',
      passed: model.conversationInfo?.id === MOCK_CONVERSATION_ID,
    },
    {
      label: terminalExpected
        ? '已收到协议 FINAL_RESULT'
        : '事件脚本按预期无 FINAL_RESULT',
      passed: terminalExpected ? hasFinalResult : !hasFinalResult,
    },
    {
      label: hangingExpected
        ? '悬挂场景保持活跃，等待用户处理'
        : '终态后本地流式状态已释放',
      passed: hangingExpected
        ? model.isConversationActive
        : terminalExpected
        ? !hasFinalResult || !model.isConversationActive
        : !model.isConversationActive,
    },
    {
      label: terminalExpected
        ? '终态后无 EXECUTING 工具残留'
        : '工具状态与当前脚本一致',
      passed:
        terminalExpected && hasFinalResult
          ? executingProcessingCount === 0
          : true,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Card size="small">
          <Space wrap align="start">
            <div>
              <Title level={4} style={{ margin: 0 }}>
                会话终态收敛 Mock 验收
              </Title>
              <Text type="secondary">
                28 个故障注入场景，复用生产会话模型与 UI。
              </Text>
            </div>
            <Select
              showSearch
              style={{ width: 260 }}
              value={scenarioId}
              onChange={setScenarioId}
              options={MOCK_SCENARIOS.map((item) => ({
                value: item.id,
                label: `${item.id} · ${item.label}`,
              }))}
            />
            <Segmented
              options={speedOptions}
              value={speed}
              onChange={(value) => setSpeed(Number(value))}
            />
            <Button
              type="primary"
              loading={preparing}
              onClick={() => void play()}
            >
              播放场景
            </Button>
            <Button
              danger
              disabled={!model.isConversationActive}
              onClick={() => void stop()}
            >
              停止会话
            </Button>
            <Button onClick={() => void prepareScenario()}>仅重置</Button>
          </Space>
          <Paragraph type="secondary" style={{ margin: '10px 0 0' }}>
            {scenario.description}；验证：{scenario.verifies}
          </Paragraph>
          {lastError && (
            <Alert
              style={{ marginTop: 8 }}
              type="error"
              showIcon
              message={lastError}
            />
          )}
        </Card>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(620px, 1fr) 360px',
            gap: 12,
          }}
        >
          <Card size="small" styles={{ body: { padding: 0 } }}>
            <div style={{ height: 'calc(100vh - 190px)', minHeight: 620 }}>
              <UnifiedChatSession
                conversationId={MOCK_CONVERSATION_ID}
                messageList={messageList}
                isLoading={model.loadingConversation}
                loadingMore={model.loadingMore}
                isMoreMessage={model.isMoreMessage}
                isConversationActive={model.isConversationActive}
                isLocallyStreaming={model.isConversationActive}
                isAwaitingChatTerminal={model.isAwaitingChatTerminal}
                messageBottomMode="chat"
                agentInfo={{
                  id: 44,
                  name: '会话验收 Mock Agent',
                  type: 'TaskAgent',
                  allowChooseMode: DefaultSelectedEnum.Yes,
                  hasPermission: true,
                  sandboxId: 'mock-sandbox',
                }}
                initialAgentMode="yolo"
                onSendMessage={sendMessage}
                onLoadMoreMessage={model.handleLoadMoreMessage}
                runStopConversation={model.runStopConversation}
                loadingStopConversation={model.loadingStopConversation}
                getCurrentConversationId={model.getCurrentConversationId}
                getCurrentConversationRequestId={
                  model.getCurrentConversationRequestId
                }
                disabledConversationActive={model.disabledConversationActive}
                loadingConversation={model.loadingConversation}
                isLoadingOtherInterface={false}
                conversationInfo={model.conversationInfo}
                onResumeConversationStream={model.resumeConversationStream}
                onAbortResumeStream={model.abortResumeStream}
                onReloadConversationHistoryAsync={async () => {
                  const result = await apiAgentConversation(
                    MOCK_CONVERSATION_ID,
                  );
                  return result.data?.messageList;
                }}
                onConversationSnapshot={model.syncConversationSnapshotMessages}
                onTerminalTaskStatus={(status) =>
                  model.finalizeConversationTerminal(
                    MOCK_CONVERSATION_ID,
                    status,
                    'mock-session-poll',
                  )
                }
                resumeDebugSource={`mock:${scenario.id}`}
                messageViewRef={model.messageViewRef}
                allowAutoScrollRef={model.allowAutoScrollRef}
                scrollTimeoutRef={model.scrollTimeoutRef}
                enableMention={false}
                showClearIcon={false}
                showAnnouncement={false}
              />
            </div>
          </Card>

          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Card size="small" title="自动断言">
              {assertions.map((assertion) => (
                <div key={assertion.label} style={{ marginBottom: 8 }}>
                  {assertion.passed ? (
                    <CheckCircleOutlined style={{ color: '#16a34a' }} />
                  ) : (
                    <CloseCircleOutlined style={{ color: '#dc2626' }} />
                  )}{' '}
                  {assertion.label}
                </div>
              ))}
            </Card>
            <Card size="small" title="运行状态">
              <Space wrap>
                <Tag
                  color={model.isConversationActive ? 'processing' : 'default'}
                >
                  active={String(model.isConversationActive)}
                </Tag>
                <Tag>awaiting={String(model.isAwaitingChatTerminal)}</Tag>
                <Tag
                  color={
                    isTerminal(serverStatus?.taskStatus) ? 'green' : 'blue'
                  }
                >
                  server={serverStatus?.taskStatus || '-'}
                </Tag>
                <Tag>poll={serverStatus?.pollCount || 0}</Tag>
                <Tag>messages={messageList.length}</Tag>
                <Tag color={executingProcessingCount ? 'orange' : 'default'}>
                  executing-tools={executingProcessingCount}
                </Tag>
              </Space>
            </Card>
            <Card
              size="small"
              title={`SSE 事件（${serverStatus?.emittedEvents.length || 0}）`}
            >
              <div
                style={{
                  maxHeight: 380,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
              >
                {serverStatus?.emittedEvents.map((event, index) => (
                  <div
                    key={`${event.eventType}-${index}`}
                    style={{
                      padding: '3px 0',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <Tag
                      color={
                        event.eventType === 'FINAL_RESULT'
                          ? 'green'
                          : event.eventType === 'ERROR'
                          ? 'red'
                          : event.eventType === 'PROCESSING'
                          ? 'blue'
                          : 'default'
                      }
                    >
                      {event.eventType}
                    </Tag>
                    {String(
                      event.data?.name ||
                        event.data?.text ||
                        event.data?.success ||
                        '',
                    ).slice(0, 42)}
                  </div>
                ))}
              </div>
            </Card>
          </Space>
        </div>
      </Space>
    </div>
  );
};

export default MockChat;
