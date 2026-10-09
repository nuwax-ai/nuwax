import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import DsMarkdown from 'ds-markdown';
import { katexPlugin } from 'ds-markdown/plugins';
import React, { memo, useEffect, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MarkdownCustomProcessGroupProps {
  children: React.ReactNode;
  /** 正文开始输出时由 Markdown 转换层标记，用于自动收起已完成的工具调用组。 */
  autoCollapse?: boolean;
  /** 历史消息中的工具调用组初始保持收起。 */
  defaultCollapsed?: boolean;
  /** 终态聚合组（collapseTerminalProcesses 产出）：标题显示「执行过程」，组内可含中间正文文本片段。 */
  terminal?: boolean;
}

/**
 * 终态聚合组内的中间正文片段：以 markdown 重新渲染
 * （自定义标签内部的文本不经过 react-markdown 的块级解析，需嵌套渲染保真）
 */
const ProcessGroupTextFragment: React.FC<{ children: string }> = ({
  children,
}) => (
  <div className={cx(styles['group-text-fragment'])}>
    <DsMarkdown
      disableTyping
      interval={30}
      timerType="requestAnimationFrame"
      plugins={[katexPlugin]}
      codeBlock={{ headerActions: true }}
      theme="light"
    >
      {children}
    </DsMarkdown>
  </div>
);

const MarkdownCustomProcessGroup: React.FC<MarkdownCustomProcessGroupProps> = ({
  children,
  autoCollapse = false,
  defaultCollapsed = false,
  terminal = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed);
  const wasAutoCollapseRef = useRef(false);

  useEffect(() => {
    // 只响应从“执行中”到“正文已输出”的一次状态变化，之后保留用户的手动展开选择。
    if (autoCollapse && !wasAutoCollapseRef.current) {
      setIsExpanded(false);
    }
    wasAutoCollapseRef.current = autoCollapse;
  }, [autoCollapse]);

  // 递归寻找并获取真正的 type 属性以适配可能被 div 等标签包装的子节点
  const findProcessType = (node: React.ReactNode): string | undefined => {
    if (!React.isValidElement(node)) return undefined;
    const props = node.props as any;
    if (props && props.type) {
      return props.type;
    }
    if (props && props.children) {
      if (React.isValidElement(props.children)) {
        return findProcessType(props.children);
      }
      if (Array.isArray(props.children)) {
        for (const subChild of props.children) {
          const t = findProcessType(subChild);
          if (t) return t;
        }
      }
    }
    return undefined;
  };

  // 按原始顺序分离元素与文本子节点：文本为终态聚合收进折叠区的中间正文片段，
  // 不参与工具计数与 Plan/Event 过滤
  type ChildSlot =
    | { kind: 'element'; node: React.ReactElement }
    | { kind: 'text'; node: string };
  const slots: ChildSlot[] = [];
  React.Children.toArray(children).forEach((child) => {
    if (React.isValidElement(child)) {
      slots.push({ kind: 'element', node: child });
    } else if (typeof child === 'string' && child.trim()) {
      slots.push({ kind: 'text', node: child });
    }
  });

  // 连续相同的执行计划（Plan）只显示最后一个，并过滤 Event 类型
  let lastPlanSlotIndex = -1;
  for (let i = slots.length - 1; i >= 0; i--) {
    const slot = slots[i];
    if (slot.kind !== 'element') continue;
    const type = findProcessType(slot.node);
    if (type === 'Plan' || type === AgentComponentTypeEnum.Plan) {
      lastPlanSlotIndex = i;
      break;
    }
  }

  const visibleSlots = slots.filter((slot, index) => {
    if (slot.kind === 'text') return true;
    const type = findProcessType(slot.node);
    // 所有事件类型都不显示
    if (type === AgentComponentTypeEnum.Event || type === 'Event') {
      return false;
    }
    // 执行计划只保留最新的一个
    if (type === 'Plan' || type === AgentComponentTypeEnum.Plan) {
      return index === lastPlanSlotIndex;
    }
    return true;
  });

  const processCount = visibleSlots.filter(
    (slot) => slot.kind === 'element',
  ).length;
  const hasTextFragment = visibleSlots.some((slot) => slot.kind === 'text');

  // 与旧版行为一致：无工具且无文本（如纯 Event 组）不渲染
  if (processCount === 0 && !hasTextFragment) return null;

  return (
    <>
      <div className={cx(styles['markdown-custom-process-group'])}>
        <div
          className={cx(styles['group-header'])}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={cx(styles['header-left'])}>
            <span className={cx(styles['group-title'])}>
              {dict(
                terminal
                  ? 'PC.Components.MarkdownRenderer.executionProcess'
                  : 'PC.Components.MarkdownRenderer.executedProcesses',
              )}
            </span>
            {processCount > 0 && (
              <span className={cx(styles['process-count'])}>
                {processCount} {dict('PC.Components.MarkdownRenderer.items')}
              </span>
            )}
          </div>
          <div className={cx(styles['header-right'])}>
            <DownOutlined
              className={cx(styles['expand-icon'], {
                [styles['is-expanded']]: isExpanded,
              })}
            />
          </div>
        </div>
      </div>
      <div
        className={cx(styles['group-content'], {
          [styles['is-expanded']]: isExpanded,
        })}
      >
        <div className={cx(styles['group-content-inner'])}>
          {visibleSlots.map((slot, index) =>
            slot.kind === 'text' ? (
              <ProcessGroupTextFragment key={`text-${index}`}>
                {slot.node}
              </ProcessGroupTextFragment>
            ) : (
              <React.Fragment key={`el-${index}`}>{slot.node}</React.Fragment>
            ),
          )}
        </div>
      </div>
    </>
  );
};

export default memo(MarkdownCustomProcessGroup);
