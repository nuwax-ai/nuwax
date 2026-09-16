/**
 * 更新日志轻量渲染（纯文本 notes → 卡片内容，不引 markdown 依赖）
 * @description 逐行无状态解析，天然容忍 CI 截断产生的半截尾行：
 * `#`/`##`/`###` → 分级标题；`- `/`*` → 圆点列表项；`**bold**` → 内联加粗；其余为段落。
 */
import React from 'react';

/** 行内 `**加粗**` 解析 */
function renderInline(text: string, key: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <strong key={`${key}-b${match.index}`} style={{ fontWeight: 600 }}>
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const HEADING_STYLE: React.CSSProperties[] = [
  { fontSize: 14, fontWeight: 600, color: 'var(--xagi-color-text)', margin: '2px 0 6px' },
  { fontSize: 13, fontWeight: 600, color: 'var(--xagi-color-text)', margin: '2px 0 6px' },
  { fontSize: 12, fontWeight: 600, color: 'var(--xagi-color-text)', margin: '2px 0 4px' },
];

const ReleaseNotesContent: React.FC<{ notes: string }> = ({ notes }) => {
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  let seq = 0;

  const flushBullets = () => {
    if (!bullets.length) return;
    const items = bullets;
    bullets = [];
    const listSeq = seq++;
    blocks.push(
      <ul key={`ul-${listSeq}`} style={{ margin: '2px 0', paddingLeft: 16 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              color: 'var(--xagi-color-text-secondary)',
            }}
          >
            {renderInline(item, `li-${listSeq}-${i}`)}
          </li>
        ))}
      </ul>,
    );
  };

  notes.split('\n').forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      flushBullets();
      return;
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (heading) {
      flushBullets();
      const headingSeq = seq++;
      blocks.push(
        <div key={`h-${headingSeq}`} style={HEADING_STYLE[heading[1].length - 1]}>
          {renderInline(heading[2], `h-${headingSeq}`)}
        </div>,
      );
    } else if (bullet) {
      bullets.push(bullet[1]);
    } else {
      flushBullets();
      const paraSeq = seq++;
      blocks.push(
        <p
          key={`p-${paraSeq}`}
          style={{
            margin: '2px 0',
            fontSize: 12,
            lineHeight: 1.7,
            color: 'var(--xagi-color-text-secondary)',
          }}
        >
          {renderInline(line, `p-${paraSeq}`)}
        </p>,
      );
    }
  });
  flushBullets();

  return <div>{blocks}</div>;
};

export default ReleaseNotesContent;
