import { dict } from '@/services/i18nRuntime';
import { BulbOutlined, DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { memo, useCallback, useState } from 'react';

import styles from '../index.less';

const cx = classNames.bind(styles);

export type AssistantThinkingCollapsibleProps = {
  think: string;
  /** 与 MarkdownRenderer：流式结束或已有正文时显示「已思考」文案 */
  isThinkingFinished: boolean;
};

/**
 * 助手思考折叠区：展开状态仅存在本组件内，避免父组件 Set 触发整条消息列表与 Markdown 重算导致点击卡顿。
 */
const AssistantThinkingCollapsible = memo(
  function AssistantThinkingCollapsible({
    think,
    isThinkingFinished,
  }: AssistantThinkingCollapsibleProps) {
    const [expanded, setExpanded] = useState(false);

    const handleToggle = useCallback(() => {
      setExpanded((v) => !v);
    }, []);

    return (
      <div className={styles.assistantThinkingWrap}>
        <div
          className={styles.assistantThinkingHeader}
          onClick={handleToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
        >
          <BulbOutlined className={styles.assistantThinkingIcon} />
          <span className={styles.assistantThinkingTitle}>
            {isThinkingFinished
              ? dict('PC.Components.MarkdownRenderer.thought')
              : dict('PC.Components.MarkdownRenderer.thinking')}
          </span>
          <DownOutlined
            className={cx(styles.assistantThinkingExpand, {
              [styles.assistantThinkingExpandExpanded]: expanded,
            })}
          />
        </div>
        {expanded && (
          <div className={styles.assistantThinkingBody}>
            {think.split('\n').map((line: string, index: number) => (
              <div key={index} className={styles.assistantThinkingLine}>
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);

export default AssistantThinkingCollapsible;
