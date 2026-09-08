/**
 * 会话终态收敛开发验收页。
 *
 * 场景控制走 Umi mock（数据源单点在 mock/conversationScenarios.ts，页面经
 * /api/mock/conversation/scenarios 拉取元数据，业务代码不依赖 mock 数据），
 * 消息处理和 UI 则完整复用 conversationInfo model 与 UnifiedChatSession，
 * 确保手工验收覆盖生产路径而非另一套演示实现。
 *
 * 应用内嵌形态：访问 /app/mock-chat（/app 前缀由 useOpenApp 自动识别）。
 */
import { UnifiedChatSession } from '@/components/business-component';
import { useConversationRuntimeSession } from '@/features/conversation/react/useConversationRuntimeSession';
import { useConversationRendererPreference } from '@/hooks/useConversationRendererPreference';
import { apiAgentConversation } from '@/services/agentConfig';
import { fetchAndApplyLangMap } from '@/services/i18nRuntime';
import { DefaultSelectedEnum, TaskStatus } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import {
  setConversationRendererUrlOverride,
  type ConversationRendererVersion,
} from '@/utils/conversationRendererPreference';
import {
  isConversationRuntimeEnabled,
  setConversationRuntimeUrlOverride,
} from '@/utils/conversationRuntimeFlag';
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

/** E2E 只读的页面断言快照（scripts/e2e/mock-chat-acceptance.mjs 轮询消费） */
type MockChatAssertionSnapshot = {
  scenarioId: string;
  line: 'legacy' | 'runtime';
  assertions: Array<{ label: string; passed: boolean }>;
  updatedAt: number;
  /** 已触发播放（autoplay 或手动点击）——E2E 开流门控前置条件 */
  playing: boolean;
  /** 当前轨流式活跃（断言同源，避免 E2E 读旧 model 假绿） */
  streamActive: boolean;
  messageCount: number;
  emittedCount: number;
  /** 事件脚本总数（mock status 透传）：E2E 判定回放完毕，防终态后事件未发完提前收尾 */
  scriptLength: number;
  /** 全部回放连接已落定（mock status 透传）：续连轮只发终态时 emitted 永达不到 scriptLength，以此为准 */
  replaySettled?: boolean;
  hasFinalResult: boolean;
  serverTaskStatus: string;
  /** 全程出现过活跃态 / EXECUTING 工具——断言非空转证明 */
  sawActive: boolean;
  sawExecutingTools: boolean;
  /** 页面运行期 console.error 文本（截尾）——E2E 断言零 [Conv:Status] 级错误输出 */
  consoleErrors: string[];
  lastError: string;
};

declare global {
  interface Window {
    __MOCK_CHAT_ASSERTIONS__?: MockChatAssertionSnapshot;
  }
}

type MockServerStatus = {
  scenario: string;
  taskStatus: TaskStatus;
  pollCount: number;
  scriptLength?: number;
  replaySettled?: boolean;
  emittedEvents: Array<{ eventType: string; data?: Record<string, unknown> }>;
};

/** 场景元数据（由 mock 接口下发，页面不 import mock 目录数据）。 */
type ScenarioMeta = {
  id: string;
  label: string;
  description: string;
  verifies: string;
  transport?: string;
  entry?: string;
  hasFinalResult: boolean;
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

// URL 参数驱动（E2E 单标签串行入口）：scenario 指定初始场景、speed 覆盖初始
// 速度、autoplay=1 跳过人工点击直接播放。页面整重载天然清干净上一场景状态。
const initialUrlParams = new URLSearchParams(window.location.search);
const initialScenarioFromUrl = initialUrlParams.get('scenario') || '';
const initialSpeedFromUrl = Number(initialUrlParams.get('speed'));
const AUTOPLAY = initialUrlParams.get('autoplay') === '1';
// 审批 DockPanel 的业务门禁：会话框 ask 模式（审批）下权限/问答卡才走真实
// 路径。干预类用例以 ?agentMode=ask 注入——写入智能体模式缓存（模块级执行
// 早于 interventionLayer hook 初始化；initialAgentMode prop 仅无缓存时生效）
const INITIAL_AGENT_MODE =
  initialUrlParams.get('agentMode') === 'ask' ? 'ask' : 'yolo';
if (typeof window !== 'undefined' && INITIAL_AGENT_MODE === 'ask') {
  try {
    localStorage.setItem(
      'nuwax_agent_mode_cache',
      JSON.stringify({ version: 1, agents: { '44': 'ask' } }),
    );
  } catch {
    // localStorage 不可用（隐私模式等）：回落默认 yolo
  }
}

// 语言钉死（E2E 断言依赖中文文案）：initI18n 首屏的查询模式请求按
// Accept-Language 识别语种，无头/Agent 浏览器（en-US）会被下发英文词典。
// ?lang=zh-CN 在挂载后携参重拉词典并置就绪位；回放等语言就绪后再开播，
// 避免与 initI18n 的查询模式请求竞态（后到的英文词典会覆盖）。
const PINNED_LANG = initialUrlParams.get('lang');
if (typeof window !== 'undefined' && PINNED_LANG) {
  try {
    localStorage.setItem('umi_locale', PINNED_LANG);
  } catch {
    // ignore
  }
}

const MockChat: React.FC = () => {
  const model = useModel('conversationInfo');
  const [scenarioId, setScenarioId] = useState(
    initialScenarioFromUrl || 'NORMAL_SINGLE',
  );
  const [speed, setSpeed] = useState(
    Number.isFinite(initialSpeedFromUrl) && initialSpeedFromUrl > 0
      ? initialSpeedFromUrl
      : 0.25,
  );
  const [preparing, setPreparing] = useState(false);
  const [scenarios, setScenarios] = useState<ScenarioMeta[]>([]);
  const [serverStatus, setServerStatus] = useState<MockServerStatus>();
  const [lastError, setLastError] = useState('');
  const subTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const didInitialPrepareRef = useRef(false);
  // 「曾经出现」语义的观测标记：E2E 断言非空转（终态场景先活跃再收敛）
  const playingRef = useRef(false);
  const sawActiveRef = useRef(false);
  const sawExecutingToolsRef = useRef(false);
  // console.error 收集（M3）：E2E 断言会话路径零 [Conv:Status] 级错误输出
  const consoleErrorsRef = useRef<string[]>([]);
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      consoleErrorsRef.current.push(
        args
          .map((arg) => String(arg))
          .join(' ')
          .slice(0, 300),
      );
      if (consoleErrorsRef.current.length > 50) {
        consoleErrorsRef.current.shift();
      }
      originalError(...args);
    };
    return () => {
      console.error = originalError;
    };
  }, []);
  // 桥接初始 effect 与下方声明的 play（避免 use-before-define）
  const playRef = useRef<() => Promise<void>>(async () => {});

  // ── 双轨接入（M0）：flag 开启（?conversationRuntime=1）时挂 runtime 线，
  // conversationProps 于 JSX 尾部展开覆盖旧线字段；编排与断言按轨分派。──
  // 渲染线（V2 双线重构）：?conversationRenderer=v1|v2 切换 V1/V2 渲染（URL
  // 优先于全局偏好，e2e 四组合矩阵经此参数驱动）
  const { renderer: mockRendererVersion } =
    useConversationRendererPreference(MOCK_CONVERSATION_ID);
  const runtimeMessageViewRef = useRef<HTMLDivElement | null>(null);
  const runtimeAllowAutoScrollRef = useRef(true);
  const runtimeLine = useConversationRuntimeSession({
    conversationId: MOCK_CONVERSATION_ID,
    // runtime 轨滚动跟随（resumeController 置底）需要自己的容器 ref
    messageViewRef: runtimeMessageViewRef,
    allowAutoScrollRef: runtimeAllowAutoScrollRef,
    // effectsResources 留空：TaskAgent 文件树/预览类 effect 在 mock 页静默忽略
    // （可选契约，先例 AgentConversationChatPanel/index.tsx:104）
  });
  const isRuntimeLine = Boolean(runtimeLine);
  const runtimeProps = runtimeLine?.conversationProps ?? {};

  const refreshServerStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/mock/conversation/status');
      const result = await response.json();
      setServerStatus(result.data);
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  // ── 轨感知状态选择器（断言与编排共用；runtime 线不写旧 model）──
  const lineConversationInfo = (
    isRuntimeLine ? runtimeProps.conversationInfo : model.conversationInfo
  ) as typeof model.conversationInfo;
  const lineIsConversationActive = (
    isRuntimeLine
      ? runtimeProps.isConversationActive
      : model.isConversationActive
  ) as boolean;
  const lineMessageList = (
    isRuntimeLine ? runtimeLine?.messageList : model.messageList || []
  ) as MessageInfo[];

  /** 按轨分派的编排 API（legacy 走 conversationInfo model，runtime 走 session） */
  const lineApi = {
    /** 重置并装载会话详情（prepareScenario 用） */
    resetAndLoad: async (): Promise<void> => {
      if (runtimeLine) {
        runtimeLine.session.store.reset();
        await runtimeLine.session.load(MOCK_CONVERSATION_ID);
        return;
      }
      await model.runAsync(MOCK_CONVERSATION_ID);
    },
    /** 清理上一场景连接（prepare / 卸载用） */
    abortStreams: (): void => {
      if (runtimeLine) {
        runtimeLine.session.abortResumeStream();
        return;
      }
      model.abortResumeStream();
      model.handleClearSideEffect();
    },
    /** 发送用户消息（agentMode 与 URL 注入模式一致，ask 下走审批路径） */
    send: (text: string): void => {
      if (runtimeLine) {
        (runtimeProps.onSendMessage as typeof sendMessage)(
          text,
          undefined,
          undefined,
          undefined,
          INITIAL_AGENT_MODE,
        );
        return;
      }
      void model.onMessageSend({
        id: MOCK_CONVERSATION_ID,
        messageInfo: text,
        sandboxId: 'mock-sandbox',
        debug: false,
        isSync: false,
        agentMode: INITIAL_AGENT_MODE,
      });
    },
    /** 停止会话 */
    stop: async (): Promise<void> => {
      if (runtimeLine) {
        (runtimeProps.runStopConversation as (id: string) => void)(
          String(
            (runtimeProps.getCurrentConversationId as () => number | null)() ??
              MOCK_CONVERSATION_ID,
          ),
        );
        return;
      }
      await model.runStopConversation(
        model.getCurrentConversationRequestId() || MOCK_CONVERSATION_ID,
      );
    },
    /** sub 流续接（两轨签名一致：id, currentList, onClose, debugSource） */
    resume: (debugSource: string): void => {
      const resume = (
        isRuntimeLine
          ? runtimeProps.onResumeConversationStream
          : model.resumeConversationStream
      ) as typeof model.resumeConversationStream;
      resume(
        MOCK_CONVERSATION_ID,
        lineMessageList,
        refreshServerStatus,
        debugSource,
      );
    },
    /** 快照归并（轮询详情） */
    applySnapshot: (
      snapshot: NonNullable<
        Awaited<ReturnType<typeof apiAgentConversation>>['data']
      >,
    ): void => {
      if (runtimeLine) {
        (runtimeProps.onConversationSnapshot as (s: unknown) => void)(snapshot);
        return;
      }
      model.syncConversationSnapshotMessages(snapshot);
    },
    /** 终态落定 */
    applyTerminal: (status: TaskStatus): void => {
      if (runtimeLine) {
        (runtimeProps.onTerminalTaskStatus as (s: TaskStatus) => void)(status);
        return;
      }
      model.finalizeConversationTerminal(
        MOCK_CONVERSATION_ID,
        status,
        'mock-poll-snapshot',
      );
    },
  };

  useEffect(() => {
    fetch('/api/mock/conversation/scenarios')
      .then((response) => response.json())
      .then((result) => setScenarios(result.data || []))
      .catch((error) =>
        setLastError(error instanceof Error ? error.message : String(error)),
      );
  }, []);

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) || scenarios[0],
    [scenarios, scenarioId],
  );

  useEffect(() => {
    const timer = window.setInterval(refreshServerStatus, 250);
    return () => window.clearInterval(timer);
  }, [refreshServerStatus]);

  useEffect(
    () => () => {
      if (subTimerRef.current) clearTimeout(subTimerRef.current);
      lineApi.abortStreams();
    },
    // 轨归属在首帧定型（flag 初始化读一次），卸载时清理当前轨连接。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const prepareScenario = useCallback(async () => {
    setPreparing(true);
    setLastError('');
    try {
      // 清理上一场景连接与消息（按轨），再重置 mock 服务端场景
      lineApi.abortStreams();
      if (runtimeLine) {
        runtimeLine.session.store.reset();
      } else {
        model.setMessageList([]);
        model.setConversationInfo(null);
      }

      const response = await fetch('/api/mock/conversation/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId, speed }),
      });
      if (!response.ok) {
        // 服务端 400 会带 code/message（如 MOCK_SCENARIO_NOT_FOUND），
        // 多为 dev-server mock 层未重载场景表，提示重启
        const detail = await response.json().catch(() => null);
        throw new Error(
          `场景初始化失败：HTTP ${response.status}` +
            (detail?.message ? `（${detail.code}: ${detail.message}）` : '') +
            (detail?.code === 'MOCK_SCENARIO_NOT_FOUND'
              ? '；mock 场景表未热重载，请重启 dev server 或 touch mock/conversationMock.ts'
              : ''),
        );
      }

      await lineApi.resetAndLoad();
      await refreshServerStatus();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : String(error));
      throw error;
    } finally {
      setPreparing(false);
    }
    // lineApi 每帧重建但轨归属恒定（flag 初始化读一次），依赖收敛到稳定项
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioId, speed, refreshServerStatus]);

  // ?lang 钉语言：挂载后携参重拉词典，回放开播前等它就绪（E2E 文案断言依赖）
  const [langReady, setLangReady] = useState(!PINNED_LANG);
  useEffect(() => {
    if (!PINNED_LANG) return;
    void fetchAndApplyLangMap(PINNED_LANG, 'PC').finally(() => {
      setLangReady(true);
    });
  }, []);

  useEffect(() => {
    if (didInitialPrepareRef.current) return;
    // autoplay 依赖场景元数据（entry/transport 分派），scenarios 为异步
    // fetch——首帧为空会导致 play 提前 return、SSE 永不开流
    if (AUTOPLAY && !scenarios.length) return;
    if (AUTOPLAY && !langReady) return;
    didInitialPrepareRef.current = true;
    // autoplay（E2E 入口）：直接走完整播放链（play 内部会先 prepare）；
    // 失败已写入 lastError 并以 Alert 呈现，吞掉 rejection 避免错误覆盖层整页崩
    (AUTOPLAY ? playRef.current : prepareScenario)().catch(() => {});
    // 轨归属与 URL 参数在首帧定型；playRef 见下方声明
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepareScenario, scenarios, langReady]);

  const play = useCallback(async () => {
    playingRef.current = true;
    try {
      await prepareScenario();
    } catch {
      return; // 初始化失败已展示在 Alert，不再继续发送
    }
    if (!scenario) return; // 元数据未加载（mock 未就绪）

    // 会话续接：不发送新消息——详情快照（EXECUTING 半途消息）装载后
    // 直接 sub 续接剩余输出，模拟刷新/重进会话的恢复链路
    if (scenario.entry === 'resume') {
      subTimerRef.current = setTimeout(() => {
        lineApi.resume(`mock:${scenario.id}`);
      }, 400);
      return;
    }

    lineApi.send(`执行 Mock 场景：${scenario.label}`);

    if (scenario.transport === 'sub-only') {
      subTimerRef.current = setTimeout(() => {
        lineApi.resume(`mock:${scenario.id}`);
      }, 400);
    }

    if (scenario.id === 'IDLE_POLL_TERMINAL') {
      subTimerRef.current = setTimeout(async () => {
        const result = await apiAgentConversation(MOCK_CONVERSATION_ID);
        if (result?.data) {
          lineApi.applySnapshot(result.data);
          if (isTerminal(result.data.taskStatus)) {
            lineApi.applyTerminal(result.data.taskStatus);
          }
        }
        await refreshServerStatus();
      }, 600);
    }
    // lineApi 依赖当前轨的闭包（轨归属恒定）；收敛到稳定依赖项
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prepareScenario, refreshServerStatus, scenario]);

  playRef.current = play;

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
        agentMode: selectedAgentMode || INITIAL_AGENT_MODE,
      });
    },
    [model],
  );

  const stop = useCallback(async () => {
    await lineApi.stop();
    await refreshServerStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshServerStatus]);

  // 断言与展示统一走轨感知选择器（runtime 线不写旧 model，直读 model 会假绿）
  const messageList = lineMessageList;
  const executingProcessingCount = messageList.reduce(
    (count, message) =>
      count +
      (message.processingList || []).filter(
        (item) => item.status === ProcessingEnum.EXECUTING,
      ).length,
    0,
  );
  // 「曾经」观测标记在渲染路径记录（幂等写，E2E 据此证明断言非空转）：
  // 活跃信号 = 本轨流式活跃 或 会话快照处于 EXECUTING（resume 链路 legacy
  // 轨的 model.isConversationActive 不含 sub 续接，靠 taskStatus 补充）
  const lineTaskExecuting =
    lineConversationInfo?.taskStatus === TaskStatus.EXECUTING;
  if (lineIsConversationActive || lineTaskExecuting)
    sawActiveRef.current = true;
  if (executingProcessingCount > 0) sawExecutingToolsRef.current = true;
  const hasFinalResult = Boolean(
    serverStatus?.emittedEvents.some(
      (event) => event.eventType === 'FINAL_RESULT',
    ),
  );
  const terminalExpected = scenario?.hasFinalResult ?? false;
  const hangingExpected = scenario?.transport === 'keep-open';
  const assertions = [
    {
      label: `当前轨（${
        isRuntimeLine ? 'runtime' : 'legacy'
      }）已加载 Mock 会话`,
      passed: lineConversationInfo?.id === MOCK_CONVERSATION_ID,
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
      // 按轨取源：runtime 线不写旧 model，读 model.isConversationActive 恒假
      passed: hangingExpected
        ? lineIsConversationActive
        : terminalExpected
        ? !hasFinalResult || !lineIsConversationActive
        : !lineIsConversationActive,
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

  // E2E 只读快照（断言单源：页面算，scripts/e2e/mock-chat-acceptance.mjs 只读）
  useEffect(() => {
    window.__MOCK_CHAT_ASSERTIONS__ = {
      scenarioId: scenario?.id ?? scenarioId,
      line: isRuntimeLine ? 'runtime' : 'legacy',
      renderer: mockRendererVersion,
      assertions,
      updatedAt: Date.now(),
      playing: playingRef.current,
      streamActive: lineIsConversationActive,
      messageCount: messageList.length,
      emittedCount: serverStatus?.emittedEvents.length ?? 0,
      scriptLength: serverStatus?.scriptLength ?? 0,
      replaySettled: serverStatus?.replaySettled,
      hasFinalResult,
      serverTaskStatus: serverStatus?.taskStatus ?? '',
      sawActive: sawActiveRef.current,
      sawExecutingTools: sawExecutingToolsRef.current,
      consoleErrors: [...consoleErrorsRef.current],
      lastError,
    };
  });

  if (!scenario) {
    return (
      <Card size="small" loading={scenarios.length === 0}>
        {lastError ? <Alert type="error" showIcon message={lastError} /> : null}
      </Card>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Card size="small">
          <Space wrap align="start">
            <div>
              <Title level={4} style={{ margin: 0 }}>
                会话终态收敛 Mock 验收
                <Tag
                  color={isRuntimeLine ? 'geekblue' : 'default'}
                  style={{ marginLeft: 12 }}
                >
                  {isRuntimeLine ? 'runtime 轨' : 'legacy 轨'}
                </Tag>
              </Title>
              <Text type="secondary">
                {scenarios.length} 个故障注入场景，复用生产会话模型与
                UI；应用内嵌 形态访问 /app/mock-chat。会话轨与渲染线均为双线，
                可用下方开关或 URL 参数切换（?conversationRuntime=1、
                ?conversationRenderer=v1|v2）。
              </Text>
            </div>
            <Select
              showSearch
              style={{ width: 400 }}
              value={scenario.id}
              onChange={setScenarioId}
              options={scenarios.map((item) => ({
                value: item.id,
                label: `${item.id} · ${item.label}`,
              }))}
            />
            <Segmented
              options={speedOptions}
              value={speed}
              onChange={(value) => setSpeed(Number(value))}
            />
            <Segmented
              data-testid="mock-track-toggle"
              options={[
                { value: false, label: '会话轨 legacy' },
                { value: true, label: '会话轨 runtime' },
              ]}
              value={isConversationRuntimeEnabled()}
              onChange={(value) => {
                // runtime hook 在初始化时读一次 flag（切换即组件树重建）：
                // 写入 URL 参数后整页重载生效，与 e2e URL 驱动同一语义
                setConversationRuntimeUrlOverride(Boolean(value));
                window.location.reload();
              }}
            />
            <Segmented
              data-testid="mock-renderer-toggle"
              options={[
                { value: 'v1', label: '渲染 V1 Markdown' },
                { value: 'v2', label: '渲染 V2 工作轨迹' },
              ]}
              value={mockRendererVersion}
              onChange={(value) =>
                setConversationRendererUrlOverride(
                  value as ConversationRendererVersion,
                )
              }
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
              disabled={!lineIsConversationActive}
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
                messageRenderer={mockRendererVersion}
                isLoading={isRuntimeLine ? false : model.loadingConversation}
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
                messageViewRef={
                  isRuntimeLine
                    ? runtimeMessageViewRef
                    : (model.messageViewRef as never)
                }
                allowAutoScrollRef={
                  isRuntimeLine
                    ? runtimeAllowAutoScrollRef
                    : (model.allowAutoScrollRef as never)
                }
                scrollTimeoutRef={model.scrollTimeoutRef}
                enableMention={false}
                showClearIcon={false}
                showAnnouncement={false}
                queueContext={
                  isRuntimeLine
                    ? {
                        // 队列门控按轨取源：未注入时会回落 legacy model（恒假）
                        streamActive: Boolean(runtimeProps.isLocallyStreaming),
                        taskExecuting:
                          (
                            runtimeProps.conversationInfo as {
                              taskStatus?: TaskStatus;
                            }
                          )?.taskStatus === TaskStatus.EXECUTING,
                      }
                    : undefined
                }
                {...runtimeProps}
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
                  color={lineIsConversationActive ? 'processing' : 'default'}
                >
                  active={String(lineIsConversationActive)}
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
