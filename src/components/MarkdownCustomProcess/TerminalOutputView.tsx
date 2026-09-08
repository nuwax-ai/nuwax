import classNames from 'classnames';
import React, { memo, useEffect, useRef } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 流式预览保留的尾部行数 */
const PREVIEW_LINES = 6;
/** 展开全量时的渲染截断（保留尾部，防止超长输出撑爆 DOM） */
const MAX_RENDER_LINES = 500;

interface TerminalOutputViewProps {
  content: string;
  /** preview=流式尾部预览（自动滚底）；full=展开全量（限高滚动） */
  mode: 'preview' | 'full';
}

const toTailText = (text: string, maxLines: number) =>
  text.replace(/\n+$/, '').split('\n').slice(-maxLines).join('\n');

/**
 * 终端输出内容区（会话渲染升级 P0-1）。
 *
 * 只负责输出正文的展示；命令行、退出码徽标、耗时与展开交互由外层
 * MarkdownCustomProcess 的卡片骨架统一承担（与 diff/Plan 同构）。
 */
const TerminalOutputView: React.FC<TerminalOutputViewProps> = ({
  content,
  mode,
}) => {
  const scrollRef = useRef<HTMLPreElement>(null);

  // 流式预览自动跟随到底部（最新输出）
  useEffect(() => {
    if (mode === 'preview' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, mode]);

  if (!content) return null;

  const text =
    mode === 'preview'
      ? toTailText(content, PREVIEW_LINES)
      : toTailText(content, MAX_RENDER_LINES);

  return (
    <div
      className={cx(styles['terminal-output'], {
        [styles['is-preview']]: mode === 'preview',
      })}
    >
      <pre ref={scrollRef} className={cx(styles['terminal-output-text'])}>
        {text}
      </pre>
    </div>
  );
};

export default memo(TerminalOutputView);
