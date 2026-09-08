import { dict } from '@/services/i18nRuntime';
import { BulbOutlined, DownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { memo, useEffect, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface MarkdownCustomThinkProps {
  /** 思考内容明文（由 genCustomPlugin 对 content 属性解码后传入）。 */
  content: string;
  /** thinking=流式中的思考轮；finished=已被后续输出超越。 */
  status?: string;
  /** 思考块被后续内容超越时由分组层标记，用于自动收起（一次性，不覆盖手动展开）。 */
  autoCollapse?: boolean;
  /** 历史/已完成消息中的思考块初始收起。 */
  defaultCollapsed?: boolean;
}

/**
 * 消息内按流式位置渲染的思考块。
 *
 * 与 MarkdownCustomProcessGroup 同一套折叠范式：非受控展开态 +
 * autoCollapse 一次性收起 + CSS grid 0fr/1fr 平滑动画。当前活动思考块
 * 默认展开实时显示文字；被后续内容（工具调用/正文/下一轮思考）超越后
 * 自动收起为「已思考」摘要行。
 */
const MarkdownCustomThink: React.FC<MarkdownCustomThinkProps> = ({
  content,
  status,
  autoCollapse = false,
  defaultCollapsed = false,
}) => {
  // 历史消息、以及流式重推后重挂载但已被超越的块，直接以收起态挂载，避免展开闪烁
  const [isExpanded, setIsExpanded] = useState(
    !(defaultCollapsed || autoCollapse),
  );
  const wasAutoCollapseRef = useRef(autoCollapse);

  useEffect(() => {
    // 只响应一次「被后续内容超越」的收起信号，之后保留用户的手动展开选择
    if (autoCollapse && !wasAutoCollapseRef.current) {
      setIsExpanded(false);
    }
    wasAutoCollapseRef.current = autoCollapse;
  }, [autoCollapse]);

  // 已完成的消息不存在流式思考；defaultCollapsed 为真即视为终态
  const isThinking = status === 'thinking' && !defaultCollapsed;

  // 思考计时：活动态从挂载起每秒 +1（市面通行形态——「正在思考 · Ns」）
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    if (!isThinking) return;
    const timer = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isThinking]);

  // 思考中：单行滚动条带（不做多行预览）——内容持续追加，视口连续缓动贴尾，
  // 呈现文字快速流动播放的效果；被超越（收口）后回到「已思考」折叠形态。
  // 缓动贴尾用 rAF 循环每帧向最大滚动位推进（指数缓出 + 最低速度）：
  // 瞬时赋值会在文本布局完成前落空，scroll-behavior:smooth 会被吞，
  // ResizeObserver 只在宽度变化时跳变——均无连续流动感。
  const tickerViewportRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isThinking) return;
    let frame = 0;
    const glide = () => {
      const viewport = tickerViewportRef.current;
      if (viewport) {
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        if (maxScroll > 0) {
          const next =
            viewport.scrollLeft +
            (maxScroll - viewport.scrollLeft) * 0.08 +
            0.5;
          viewport.scrollLeft = Math.min(next, maxScroll);
        }
      }
      frame = requestAnimationFrame(glide);
    };
    frame = requestAnimationFrame(glide);
    return () => cancelAnimationFrame(frame);
  }, [isThinking]);

  if (isThinking) {
    return (
      <div className={cx(styles['markdown-custom-think'])}>
        <div className={cx(styles['think-ticker'])}>
          <span className={cx(styles['think-ticker-label'])}>
            <BulbOutlined
              className={cx(styles['think-icon'], styles['is-thinking'])}
            />
            <span className={cx(styles['think-title'])}>
              {dict('PC.Components.MarkdownCustomThink.thinking')} ·{' '}
              {elapsedSec}s
            </span>
          </span>
          <div
            ref={tickerViewportRef}
            className={cx(styles['think-ticker-viewport'])}
          >
            <span className={cx(styles['think-ticker-text'])}>{content}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cx(styles['markdown-custom-think'])}>
        <div
          className={cx(styles['think-header'])}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={cx(styles['header-left'])}>
            <BulbOutlined
              className={cx(styles['think-icon'], {
                [styles['is-thinking']]: isThinking,
              })}
            />
            <span className={cx(styles['think-title'])}>
              {isThinking
                ? dict('PC.Components.MarkdownCustomThink.thinking')
                : dict('PC.Components.MarkdownCustomThink.thought')}
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
      <div
        className={cx(styles['think-content'], {
          [styles['is-expanded']]: isExpanded,
        })}
      >
        <div className={cx(styles['think-content-inner'])}>{content}</div>
      </div>
    </>
  );
};

export default memo(MarkdownCustomThink);
