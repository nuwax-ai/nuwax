/**
 * V2 轨迹结构示例：去外层大折叠（方案 A 演示页）
 *
 * 新结构 = 纯统计行（不可点、无折叠语义）+ 条目流按时序穿插：
 *   思考行/工具组各自是折叠控件（范围只含过程行），叙述（narration）正文直出，
 *   不属于任何折叠范围；直播 / 完成 / 刷新 / 历史四态同构。
 * 页内对照组 = 现状 ConversationRendererV2（外层大折叠，收起时叙述不可见）。
 *
 * 访问：/examples/trace-structure-demo
 */
import { projectConversation } from '@/features/conversation/presentation-v2/projectConversation';
import ConversationRendererV2 from '@/features/conversation/presentation-v2/react/ConversationRendererV2';
import FinalAnswerBlock from '@/features/conversation/presentation-v2/react/FinalAnswerBlock';
import ProcessNodeRow from '@/features/conversation/presentation-v2/react/ProcessNodeRow';
import ToolGroupDisclosure from '@/features/conversation/presentation-v2/react/ToolGroupDisclosure';
import { NarrationText } from '@/features/conversation/presentation-v2/react/WorkTraceDisclosure';
import {
  formatElapsed,
  formatElapsedClock,
} from '@/features/conversation/presentation-v2/react/formatElapsed';
import v2Styles from '@/features/conversation/presentation-v2/react/index.less';
import {
  resolveNodeMode,
  splitNodesByVisibility,
} from '@/features/conversation/presentation-v2/renderPreferences';
import {
  composeConversationTraceItems,
  getToolGroupActionKinds,
  getToolGroupStatus,
} from '@/features/conversation/presentation-v2/traceItems';
import type {
  ConversationProcessNode,
  ConversationRenderPreferencesV2,
  ConversationToolResource,
  ConversationTraceItem,
  ConversationTurnPresentationV2,
} from '@/features/conversation/presentation-v2/types';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum, AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Card, theme, Typography } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import demoStyles from './TraceStructureDemo.less';

const cx = classNames.bind(v2Styles);
const dx = classNames.bind(demoStyles);
const { Title, Paragraph, Text } = Typography;

// ---------------- mock 数据构造（照 tests/conversationRendererComponent 模板） ----------------

const processTag = (attrs: {
  executeId?: string;
  type?: string;
  status?: string;
  name?: string;
}) => {
  const parts = [
    attrs.executeId && `executeId="${attrs.executeId}"`,
    attrs.type && `type="${attrs.type}"`,
    attrs.status && `status="${attrs.status}"`,
    attrs.name && `name="${encodeURIComponent(attrs.name || '')}"`,
  ].filter(Boolean);
  return `\n\n<div><markdown-custom-process ${parts.join(
    ' ',
  )}></markdown-custom-process></div>\n\n`;
};

const thinkTag = (status: 'thinking' | 'finished', content: string) =>
  `\n\n<div><markdown-custom-think status="${status}" content="${encodeURIComponent(
    content,
  )}"></markdown-custom-think></div>\n\n`;

const msg = (
  overrides: Partial<MessageInfo> & {
    id: string | number;
    role: AssistantRoleEnum;
  },
): MessageInfo =>
  ({
    text: '',
    time: '2026-09-18 15:00:00',
    componentExecutedList: [],
    messageType: 'ASSISTANT',
    index: 0,
    tenantId: 1,
    senderType: 'User',
    senderId: 'u1',
    userId: 1,
    agentId: 1,
    status: MessageStatusEnum.Complete,
    ...overrides,
  } as MessageInfo);

const ROLE_INFO: RoleInfo = {
  assistant: { name: '综合测试问答型（勿动）', avatar: '' },
  system: { name: 'System', avatar: '' },
} as unknown as RoleInfo;

const PREFS: ConversationRenderPreferencesV2 = {
  preset: 'balanced',
  nodeOverrides: {},
};

type MockToolKind = 'read' | 'run' | 'edit' | 'search';

const toolResult = (
  executeId: string,
  kind: MockToolKind,
  detail: string,
  output: string,
  spanMs = 5000,
) => {
  const input =
    kind === 'run'
      ? { kind: 'execute', command: detail }
      : kind === 'read'
      ? { kind: 'read', filePath: detail }
      : kind === 'edit'
      ? { kind: 'write', filePath: detail }
      : { kind: 'search', query: detail };
  return {
    executeId,
    success: true,
    input,
    data: output,
    startTime: Date.now() - spanMs,
    endTime: Date.now(),
  };
};

/** 单轮：思考 + 叙述1 + 工具 + 叙述2 + 最终回答（终态） */
const buildSingleTurn = (running = false): MessageInfo[] => {
  const end = Date.now();
  return [
    msg({
      id: 'u1',
      role: AssistantRoleEnum.USER,
      text: '请先输出「第一步：开始检查」，等待 5 秒，再输出「第二步：检查完成」，最后输出「全部完成」并结束任务',
      time: running
        ? new Date(end - 12_000).toISOString()
        : '2026-09-18 15:00:00',
    }),
    msg({
      id: 'a1',
      role: AssistantRoleEnum.ASSISTANT,
      status: running ? MessageStatusEnum.Loading : MessageStatusEnum.Complete,
      text: [
        thinkTag(
          running ? 'thinking' : 'finished',
          '用户要求三步：先输出「第一步」，然后等待 5 秒，再输出「第二步」，最后收尾。第二步需要用工具真实计时，保证确实等待了 5 秒。',
        ),
        '第一步：开始检查',
        processTag({
          executeId: 'e1',
          type: AgentComponentTypeEnum.ToolCall,
          status: running ? 'EXECUTING' : 'FINISHED',
          name: '运行命令',
        }),
        '第二步：检查完成',
      ].join(''),
      processingList: [
        {
          executeId: 'e1',
          name: '运行命令',
          type: AgentComponentTypeEnum.ToolCall,
          status: running ? 'EXECUTING' : 'FINISHED',
          result: toolResult(
            'e1',
            'run',
            'sleep 5 && echo 完成',
            running ? '' : '完成',
          ),
        },
      ] as MessageInfo['processingList'],
      ...(running
        ? {}
        : {
            finalResult: {
              success: true,
              outputText: '全部完成，三步已按顺序执行完毕，任务结束。',
              startTime: end - 5000,
              endTime: end,
              componentExecuteResults: [],
            } as unknown as MessageInfo['finalResult'],
          }),
    }),
  ];
};

/** 22 工具长轮：5 组工具 + 7 条叙述穿插（文案取自真实会话 1693344） */
const buildLongTurn = (): MessageInfo[] => {
  const N = [
    '项目文件齐全，开始跑完整流水线。',
    '缩略图整体正常。对信息密度最高的几页做 150 DPI 放大核对。',
    '三页放大核对均正常，无折行、无溢出、项目符号完整。唯一一处瑕疵在封面第三行的对齐。',
    '源码无前导空白，缩进不是空白字符造成的。直接查 PPTX 里这行的形状几何。',
    '三行形状几何完全相同——说明不是排版缺陷，而是渲染端字形边距。',
    '三行几何一致，纯属渲染端字形边距问题。用等宽微调把第三行补齐。',
    '三行已齐平对齐。出最终缩略图总览并做交付前校验。',
  ];
  const tool = (executeId: string, name: string) =>
    processTag({
      executeId,
      type: AgentComponentTypeEnum.ToolCall,
      status: 'FINISHED',
      name,
    });
  const list: MessageInfo['processingList'] = [
    {
      executeId: 'read-1',
      kind: 'read',
      detail: 'build.py',
      name: '读取文件 build.py',
      status: 'FINISHED',
    },
    {
      executeId: 'read-2',
      kind: 'read',
      detail: 'render.py',
      name: '读取文件 render.py',
      status: 'FINISHED',
    },
    {
      executeId: 'run-1',
      kind: 'run',
      detail: 'python build.py --all',
      name: '运行命令 python build.py --all',
      status: 'FINISHED',
    },
    {
      executeId: 'run-2',
      kind: 'run',
      detail: 'python render.py --dpi 96',
      name: '运行命令 python render.py --dpi 96',
      status: 'FINISHED',
    },
    {
      executeId: 'run-3',
      kind: 'run',
      detail: 'python check.py --overflow',
      name: '运行命令 python check.py --overflow',
      status: 'FINISHED',
    },
    {
      executeId: 'search-1',
      kind: 'search',
      detail: 'margin-left',
      name: '检索代码 margin-left',
      status: 'FINISHED',
    },
    {
      executeId: 'read-3',
      kind: 'read',
      detail: 'cover.slide9.xml',
      name: '读取文件 cover.slide9.xml',
      status: 'FINISHED',
    },
    {
      executeId: 'run-4',
      kind: 'run',
      detail: 'python align.py --equalize',
      name: '运行命令 python align.py --equalize',
      status: 'FINISHED',
    },
    {
      executeId: 'read-4',
      kind: 'read',
      detail: 'body.py',
      name: '读取文件 body.py',
      status: 'FINISHED',
    },
    {
      executeId: 'read-5',
      kind: 'read',
      detail: 'refs.py',
      name: '读取文件 refs.py',
      status: 'FINISHED',
    },
    {
      executeId: 'search-2',
      kind: 'search',
      detail: 'left=',
      name: '检索代码 left=',
      status: 'FINISHED',
    },
    {
      executeId: 'edit-1',
      kind: 'edit',
      detail: 'cover.py',
      name: '编辑 cover.py',
      status: 'FINISHED',
    },
    {
      executeId: 'run-5',
      kind: 'run',
      detail: 'python build.py --cover',
      name: '运行命令 python build.py --cover',
      status: 'FINISHED',
    },
    {
      executeId: 'read-6',
      kind: 'read',
      detail: 'toc.py',
      name: '读取文件 toc.py',
      status: 'FINISHED',
    },
    {
      executeId: 'run-6',
      kind: 'run',
      detail: 'python render.py --dpi 150',
      name: '运行命令 python render.py --dpi 150',
      status: 'FINISHED',
    },
    {
      executeId: 'run-7',
      kind: 'run',
      detail: 'python verify.py --pages 1-8',
      name: '运行命令 python verify.py --pages 1-8',
      status: 'FINISHED',
    },
    {
      executeId: 'run-8',
      kind: 'run',
      detail: 'python verify.py --pages 9-16',
      name: '运行命令 python verify.py --pages 9-16',
      status: 'FINISHED',
    },
    {
      executeId: 'edit-2',
      kind: 'edit',
      detail: 'footer.py',
      name: '编辑 footer.py',
      status: 'FINISHED',
    },
    {
      executeId: 'run-9',
      kind: 'run',
      detail: 'python build.py --footer',
      name: '运行命令 python build.py --footer',
      status: 'FINISHED',
    },
    {
      executeId: 'run-10',
      kind: 'run',
      detail: 'python overview.py --thumbs',
      name: '运行命令 python overview.py --thumbs',
      status: 'FINISHED',
    },
    {
      executeId: 'run-11',
      kind: 'run',
      detail: 'python qa.py --final',
      name: '运行命令 python qa.py --final',
      status: 'FINISHED',
    },
    {
      executeId: 'search-3',
      kind: 'search',
      detail: 'font-mono',
      name: '检索代码 font-mono',
      status: 'FINISHED',
    },
  ].map((item) => ({
    executeId: item.executeId,
    name: item.name,
    type: AgentComponentTypeEnum.ToolCall,
    status: item.status,
    result: toolResult(
      item.executeId,
      item.kind as MockToolKind,
      item.detail,
      'ok',
    ),
  })) as MessageInfo['processingList'];

  const end = Date.now();
  return [
    msg({
      id: 'u2',
      role: AssistantRoleEnum.USER,
      text: '把论文 PPT 做完并做交付前校验',
    }),
    msg({
      id: 'a2',
      role: AssistantRoleEnum.ASSISTANT,
      text: [
        thinkTag(
          'finished',
          '先盘点文件，再跑完整构建流水线，渲染后做多级 DPI 校验，发现封面第三行瑕疵后定位形状几何并修复，最后出总览。',
        ),
        N[0],
        tool('read-1', '读取文件 build.py'),
        tool('read-2', '读取文件 render.py'),
        tool('read-6', '读取文件 toc.py'),
        N[1],
        tool('run-1', '运行命令 python build.py --all'),
        tool('run-2', '运行命令 python render.py --dpi 96'),
        tool('run-3', '运行命令 python check.py --overflow'),
        N[2],
        tool('search-1', '检索代码 margin-left'),
        N[3],
        tool('read-3', '读取文件 cover.slide9.xml'),
        N[4],
        tool('search-3', '检索代码 font-mono'),
        N[5],
        tool('edit-1', '编辑 cover.py'),
        tool('run-4', '运行命令 python align.py --equalize'),
        tool('run-5', '运行命令 python build.py --cover'),
        N[6],
        tool('edit-2', '编辑 footer.py'),
        tool('run-9', '运行命令 python build.py --footer'),
        tool('read-4', '读取文件 body.py'),
        tool('read-5', '读取文件 refs.py'),
        tool('run-10', '运行命令 python overview.py --thumbs'),
        tool('run-6', '运行命令 python render.py --dpi 150'),
        tool('run-7', '运行命令 python verify.py --pages 1-8'),
        tool('run-8', '运行命令 python verify.py --pages 9-16'),
        tool('run-11', '运行命令 python qa.py --final'),
        tool('search-2', '检索代码 left='),
      ].join(''),
      processingList: list,
      finalResult: {
        success: true,
        outputText:
          '最终交付：16 页 PPT 全部通过溢出校验，封面三行齐平，缩略图总览见产物面板。',
        startTime: end - 86_000,
        endTime: end,
        componentExecuteResults: [],
      } as unknown as MessageInfo['finalResult'],
    }),
  ];
};

// ---------------- 新结构组件（方案 A：去外层大折叠，复用真实行级/组级折叠） ----------------

const useElapsedMs = (
  turn: ConversationTurnPresentationV2,
): number | undefined => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!turn.running) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [turn.running]);
  if (typeof turn.metrics.elapsedMs === 'number') return turn.metrics.elapsedMs;
  if (turn.running && typeof turn.metrics.elapsedAnchor === 'number') {
    return Math.max(0, now - turn.metrics.elapsedAnchor);
  }
  return undefined;
};

const TraceStatsLine: React.FC<{ turn: ConversationTurnPresentationV2 }> = ({
  turn,
}) => {
  const elapsedMs = useElapsedMs(turn);
  const metricParts: string[] = [];
  if (!turn.running && turn.metrics.toolCount > 0) {
    metricParts.push(
      dict(
        'PC.Components.ConversationRendererV2.traceMetricTools',
        turn.metrics.toolCount,
      ),
    );
  }
  if (!turn.running && turn.metrics.messageCount > 0) {
    metricParts.push(
      dict(
        'PC.Components.ConversationRendererV2.traceMetricMessages',
        turn.metrics.messageCount,
      ),
    );
  }
  const elapsedText = turn.running
    ? formatElapsedClock(elapsedMs ?? 0)
    : formatElapsed(elapsedMs);
  if (elapsedText) {
    metricParts.push(
      dict(
        turn.running
          ? 'PC.Components.ConversationRendererV2.traceMetricRunning'
          : 'PC.Components.ConversationRendererV2.traceMetricElapsed',
        elapsedText,
      ),
    );
  }
  const headerText = metricParts.length
    ? metricParts.join(' · ')
    : dict('PC.Components.ConversationRendererV2.traceTitleProcessOnly');
  return (
    <div className={dx('trace-stats')} data-testid="v2-trace-stats">
      <span
        className={cx(
          v2Styles['trace-metrics'],
          v2Styles['trace-metrics-leading'],
        )}
      >
        {headerText}
      </span>
    </div>
  );
};

const NewTrace: React.FC<{
  turn: ConversationTurnPresentationV2;
  preferences: ConversationRenderPreferencesV2;
  onOpenResource?: (resource: ConversationToolResource) => void;
}> = ({ turn, preferences, onOpenResource }) => {
  const { token } = theme.useToken();
  const [revealHidden, setRevealHidden] = useState(false);
  const { visibleNodes, hiddenCount } = useMemo(
    () => splitNodesByVisibility(turn.nodes, preferences),
    [turn.nodes, preferences],
  );
  const traceItems = useMemo(
    () => composeConversationTraceItems(turn.nodes, turn.running),
    [turn.nodes, turn.running],
  );
  const shownItems = useMemo(() => {
    if (revealHidden) return traceItems;
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    return traceItems.flatMap<ConversationTraceItem>((item) => {
      if (item.kind !== 'tool-group') {
        return visibleIds.has(item.node.id) ? [item] : [];
      }
      const nodes = item.nodes.filter((node) => visibleIds.has(node.id));
      if (!nodes.length) return [];
      return [
        {
          ...item,
          nodes,
          actionKinds: getToolGroupActionKinds(nodes),
          status: getToolGroupStatus(nodes),
        },
      ];
    });
  }, [revealHidden, traceItems, visibleNodes]);

  const [nodeExpanded, setNodeExpanded] = useState<Record<string, boolean>>({});
  const [groupExpanded, setGroupExpanded] = useState<Record<string, boolean>>(
    {},
  );
  const previousActiveGroups = useRef<Set<string>>(new Set());
  const autoCollapsedGroups = useRef<Set<string>>(new Set());
  const activeGroupKey = traceItems
    .filter((item) => item.kind === 'tool-group' && item.active)
    .map((item) => item.id)
    .join('|');

  useEffect(() => {
    const current = new Set(activeGroupKey ? activeGroupKey.split('|') : []);
    const collapsed: string[] = [];
    previousActiveGroups.current.forEach((groupId) => {
      if (!current.has(groupId) && !autoCollapsedGroups.current.has(groupId)) {
        collapsed.push(groupId);
        autoCollapsedGroups.current.add(groupId);
      }
    });
    if (collapsed.length) {
      setGroupExpanded((previous) => {
        const next = { ...previous };
        collapsed.forEach((groupId) => {
          next[groupId] = false;
        });
        return next;
      });
    }
    previousActiveGroups.current = current;
  }, [activeGroupKey]);

  const toggleNode = (nodeId: string) => {
    const node = turn.nodes.find((item) => item.id === nodeId);
    setNodeExpanded((previous) => {
      const current =
        typeof previous[nodeId] === 'boolean'
          ? previous[nodeId]
          : Boolean(
              node &&
                resolveNodeMode(node, preferences) === 'expanded' &&
                node.status !== 'running',
            );
      return { ...previous, [nodeId]: !current };
    });
  };
  const nodeIsExpanded = (node: ConversationProcessNode): boolean => {
    const manual = nodeExpanded[node.id];
    if (typeof manual === 'boolean') return manual;
    return (
      resolveNodeMode(node, preferences) === 'expanded' &&
      node.status !== 'running'
    );
  };
  const groupIsExpanded = (
    item: Extract<ConversationTraceItem, { kind: 'tool-group' }>,
  ): boolean => {
    const manual = groupExpanded[item.id];
    return typeof manual === 'boolean' ? manual : item.active;
  };

  const traceThemeStyle = {
    '--v2-color-text': token.colorText,
    '--v2-color-text-secondary': token.colorTextSecondary,
    '--v2-color-text-tertiary': token.colorTextTertiary,
    '--v2-color-text-quaternary': token.colorTextQuaternary,
    '--v2-color-border': token.colorBorderSecondary,
    '--v2-color-fill': token.colorFillQuaternary,
    '--v2-color-fill-hover': token.colorFillTertiary,
    '--v2-color-link': token.colorLink,
    '--v2-color-primary': token.colorPrimary,
    '--v2-color-primary-border': token.colorPrimaryBorder,
    '--v2-color-success': token.colorSuccess,
    '--v2-color-error': token.colorError,
  } as React.CSSProperties;

  return (
    <div
      className={cx(v2Styles['trace'])}
      style={traceThemeStyle}
      data-trace-key={turn.key}
      data-trace-running={turn.running ? 'true' : 'false'}
    >
      {/* 纯统计行：不可点、无折叠语义 */}
      <TraceStatsLine turn={turn} />
      {/* 条目流按时序穿插：叙述直出（不在任何折叠范围）；过程行用既有组/行折叠 */}
      {shownItems.map((item) => {
        if (item.kind === 'narration') {
          return (
            <NarrationText key={item.id} narrationId={item.id}>
              {item.node.text ?? ''}
            </NarrationText>
          );
        }
        if (item.kind === 'tool-group') {
          return (
            <ToolGroupDisclosure
              key={item.id}
              group={item}
              nodes={item.nodes}
              expanded={groupIsExpanded(item)}
              onToggle={() =>
                setGroupExpanded((previous) => {
                  const current =
                    typeof previous[item.id] === 'boolean'
                      ? previous[item.id]
                      : item.active;
                  return { ...previous, [item.id]: !current };
                })
              }
              nodeIsExpanded={nodeIsExpanded}
              onToggleNode={toggleNode}
              onOpenResource={onOpenResource}
            />
          );
        }
        return (
          <ProcessNodeRow
            key={item.id}
            node={item.node}
            expanded={nodeIsExpanded(item.node)}
            onToggle={() => toggleNode(item.node.id)}
            onOpenResource={onOpenResource}
          />
        );
      })}
      {!revealHidden && hiddenCount > 0 && (
        <button
          type="button"
          className={cx(v2Styles['hidden-entry'])}
          data-testid="v2-hidden-entry"
          onClick={() => setRevealHidden(true)}
        >
          {dict(
            'PC.Components.ConversationRendererV2.hiddenEntry',
            hiddenCount,
          )}
        </button>
      )}
    </div>
  );
};

/** 新结构单轮壳：标题栏 + 新轨迹 + 最终回答（FinalAnswerBlock 复用真实组件） */
const NewTurnBlock: React.FC<{
  turn: ConversationTurnPresentationV2;
}> = ({ turn }) => (
  <div style={{ paddingBottom: 4 }}>
    <div className={dx('titlebar')}>
      <span className={dx('titlebar-name')}>{ROLE_INFO.assistant.name}</span>
      {!turn.running && (
        <span className={dx('titlebar-over')}>
          <CheckCircleOutlined /> 运行完毕
        </span>
      )}
    </div>
    <NewTrace turn={turn} preferences={PREFS} />
    <FinalAnswerBlock turn={turn} messageBottomMode="none" />
  </div>
);

// ---------------- 页面 ----------------

const TraceStructureDemo: React.FC = () => {
  const singleTurn = useMemo(() => buildSingleTurn(), []);
  const runningTurn = useMemo(() => buildSingleTurn(true), []);
  const longTurn = useMemo(() => buildLongTurn(), []);

  const projectionSingle = useMemo(
    () => projectConversation(singleTurn),
    [singleTurn],
  );
  const projectionRunning = useMemo(
    () => projectConversation(runningTurn),
    [runningTurn],
  );
  const projectionLong = useMemo(
    () => projectConversation(longTurn),
    [longTurn],
  );

  return (
    <div className={dx('page')}>
      <Title level={4}>V2 轨迹新结构示例 · 去外层大折叠（方案 A）</Title>
      <Paragraph type="secondary" style={{ maxWidth: 720 }}>
        新结构 = <Text strong>纯统计行</Text>（不可点）+ 条目流按时序穿插：
        思考行/工具组<b>各自</b>
        是折叠控件，叙述文案正文直出、不属于任何折叠范围。 直播 / 完成 / 刷新 /
        历史四态完全同构——完成瞬间没有任何收起动作。
        下面每组均为真实组件渲染（组头/思考行可点击展开收起）。
      </Paragraph>

      <Card
        size="small"
        title="① 同一轮（终态）· 现状 ConversationRendererV2"
        style={{ marginTop: 16 }}
      >
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          外层大折叠收起：叙述「第一步/第二步」不可见，只剩统计头 +
          最终回答（即刷新后的现状）。
        </Paragraph>
        <ConversationRendererV2
          messageList={singleTurn}
          conversationId={-1}
          roleInfo={ROLE_INFO}
          preferences={PREFS}
        />
      </Card>

      <Card
        size="small"
        title="② 同一轮（终态）· 新结构"
        style={{ marginTop: 16 }}
      >
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          统计行不可点；思考行/工具组可折叠（范围只有过程行）；两条叙述直出穿插——与①同一份数据。
        </Paragraph>
        <NewTurnBlock turn={projectionSingle.turns[0]} />
      </Card>

      <Card size="small" title="③ 新结构 · 运行中态" style={{ marginTop: 16 }}>
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          统计行变「工作中
          MM:SS」实时跳动；活动工具组自动展开带运行态；完成时组自行收拢、叙述不动。
        </Paragraph>
        <NewTurnBlock turn={projectionRunning.turns[0]} />
      </Card>

      <Card
        size="small"
        title="④ 新结构 · 22 工具长轮（密度验证）"
        style={{ marginTop: 16 }}
      >
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          默认态：5 个工具组头紧凑常显 + 7
          条叙述穿插；组头可点开逐条工具。请评估此密度是否可接受。
        </Paragraph>
        <NewTurnBlock turn={projectionLong.turns[0]} />
      </Card>
    </div>
  );
};

export default TraceStructureDemo;
