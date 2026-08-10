/**
 * 文档预览组件 - 把所有分段按从上到下顺序拼接显示，
 * 点击中间分段时高亮右侧对应分段并自动滚动入视口
 */

import { Empty, Spin } from 'antd';
import { dict } from '@/services/i18nRuntime';
import React, { useEffect, useRef } from 'react';
import type { DocumentPreviewProps } from './types';

/**
 * 文档预览主组件（拼接模式）
 *
 * 新方案：直接渲染 segments[]，不再做 PDF/Word/Markdown 文本提取与匹配。
 * - 选中分段时通过 ref + scrollIntoView 自动聚焦
 * - 文本两侧完全一致（来自同一份 segments[]）
 *
 * 说明：class 名采用字面量字符串（segment-block / highlight / document-preview-container），
 * 配合 index.less 中的 :global 声明，便于测试与样式覆盖。
 */
const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  segments,
  selectedSegmentId,
  loading = false,
}) => {
  const highlightRef = useRef<HTMLDivElement>(null);

  // selectedSegmentId 变化时自动滚动到高亮分段
  useEffect(() => {
    if (!highlightRef.current) return;
    // 用 setTimeout 等待渲染稳定后再滚动，避免分段较多时
    // ref 已挂载但布局尚未完成导致 scrollIntoView 定位偏差（Bug B 防御性处理）。
    const t = setTimeout(() => {
      highlightRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 50);
    return () => clearTimeout(t);
  }, [selectedSegmentId]);

  if (loading) {
    return (
      <div className="document-preview loading-state">
        <Spin tip={dict('PC.Pages.SpaceKnowledge.SourceDocumentComparison.loadingDocument')} />
      </div>
    );
  }

  if (!segments || segments.length === 0) {
    return (
      <div className="document-preview empty-state">
        <Empty description={dict('PC.Pages.SpaceKnowledge.SourceDocumentComparison.noOriginalDocument')} />
      </div>
    );
  }

  return (
    <div className="document-preview">
      <div className="preview-header">
        <h3 className="preview-title">{dict('PC.Pages.SpaceKnowledge.SourceDocumentComparison.originalComparison')}</h3>
      </div>
      <div className="preview-content">
        <div className="document-preview-container">
          {segments.map((seg, idx) => {
            const isHighlighted = String(seg.id) === String(selectedSegmentId);
            return (
              <div
                key={seg.id ?? idx}
                ref={isHighlighted ? highlightRef : null}
                className={`segment-block${isHighlighted ? ' highlight' : ''}`}
                data-segment-id={seg.id}
                data-segment-index={idx}
              >
                {seg.rawTxt}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
