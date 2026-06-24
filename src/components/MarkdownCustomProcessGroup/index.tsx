import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { memo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MarkdownCustomProcessGroupProps {
  children: React.ReactNode;
}

const MarkdownCustomProcessGroup: React.FC<MarkdownCustomProcessGroupProps> = ({
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // 过滤并处理子元素：连续相同的执行计划（Plan）只显示最后一个，并过滤 Event 类型
  const childrenArray = React.Children.toArray(children);
  let lastPlanIndex = -1;
  for (let i = childrenArray.length - 1; i >= 0; i--) {
    const child = childrenArray[i];
    const type = findProcessType(child);
    if (type === 'Plan' || type === AgentComponentTypeEnum.Plan) {
      lastPlanIndex = i;
      break;
    }
  }

  const filteredChildren = childrenArray.filter((child, index) => {
    if (!React.isValidElement(child)) return false;

    const type = findProcessType(child);
    // 所有事件类型都不显示
    if (type === AgentComponentTypeEnum.Event || type === 'Event') {
      return false;
    }

    // 执行计划只保留最新的一个
    if (type === 'Plan' || type === AgentComponentTypeEnum.Plan) {
      return index === lastPlanIndex;
    }

    return true;
  });

  const processCount = filteredChildren.length;

  if (processCount === 0) return null;

  return (
    <>
      <div className={cx(styles['markdown-custom-process-group'])}>
        <div
          className={cx(styles['group-header'])}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={cx(styles['header-left'])}>
            <span className={cx(styles['group-title'])}>
              {dict('PC.Components.MarkdownRenderer.executedProcesses')}
            </span>
            <span className={cx(styles['process-count'])}>
              {processCount} {dict('PC.Components.MarkdownRenderer.items')}
            </span>
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
      {isExpanded && (
        <div className={cx(styles['group-content'])}>{filteredChildren}</div>
      )}
    </>
  );
};

export default memo(MarkdownCustomProcessGroup);
