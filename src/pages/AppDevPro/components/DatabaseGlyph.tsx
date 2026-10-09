import React from 'react';

export interface DatabaseGlyphProps {
  /** 图标边长 */
  size?: number;
}

/**
 * 圆柱体数据库图标，用于 Header 与预览区 Tab。
 *
 * @param props.size 边长，默认 16
 * @returns SVG 图标
 */
const DatabaseGlyph: React.FC<DatabaseGlyphProps> = ({ size = 16 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
    <path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
  </svg>
);

export default DatabaseGlyph;
