/**
 * 原文对照主组件
 *
 * 新方案：直接把中间分段列表的所有分段按从上到下顺序拼接显示在最右边；
 * 点击中间分段时高亮右侧对应分段 + 自动 scrollIntoView 聚焦。
 */

import { Empty, Spin } from 'antd';
import React from 'react';
import DocumentPreview from './DocumentPreview';
import { useRawSegments } from './hooks';
// 关键：index.less 必须显式 import，否则 .source-document-comparison 等全局样式
// （含 overflow-y: auto 滚动规则）不会被加载，导致右侧无滚动条。
// 类名在 index.less 中用 :global(.className) 形式声明，与字面量 className 匹配。
import './index.less';
import type { SourceDocumentComparisonProps } from './types';

/**
 * 原文对照组件
 */
const SourceDocumentComparison: React.FC<SourceDocumentComparisonProps> = ({
  documentInfo,
  selectedSegment,
  visible = true,
}) => {
  // 拉取当前文档下的所有分段（按 sortIndex 升序）
  const { segments, loading, error } = useRawSegments(
    documentInfo?.id,
    visible,
  );

  // 如果不可见，不渲染
  if (!visible) {
    return null;
  }

  // 加载状态
  if (loading) {
    return (
      <div
        className="source-document-comparison loading"
        style={{ minWidth: '360px', flex: '1 1 0%' }}
      >
        <Spin tip="加载文档中..." />
      </div>
    );
  }

  // 错误状态 / 无文档
  if (error || !documentInfo) {
    return (
      <div
        className="source-document-comparison error"
        style={{ minWidth: '360px', flex: '1 1 0%' }}
      >
        <Empty description={error || '请选择文档进行预览'} />
      </div>
    );
  }

  return (
    <div
      className="source-document-comparison"
      style={{ minWidth: '360px', flex: '1 1 0%' }}
    >
      <DocumentPreview
        segments={segments}
        selectedSegmentId={
          selectedSegment?.id != null
            ? String(selectedSegment.id)
            : null
        }
        loading={loading}
      />
    </div>
  );
};

export default SourceDocumentComparison;
