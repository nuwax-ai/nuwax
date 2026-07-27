/**
 * 原文对照独立页面
 *
 * 功能：根据分段 ID 展示所属文档的全部分段，默认高亮选中分段并自动滚动定位
 */

import { Empty, Spin } from 'antd';
import { dict } from '@/services/i18nRuntime';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'umi';
import { useOriginalTextSegments } from './hooks';
import './index.less';

/**
 * 原文对照页面组件
 */
const SpaceKnowledgeOriginalText: React.FC = () => {
  const { segmentId: routeSegmentId, spaceId } = useParams<{
    segmentId?: string;
    spaceId?: string;
  }>();
  const location = useLocation();

  // 支持路由参数和 query 参数两种方式
  const [segmentId, setSegmentId] = useState<number | null>(() => {
    // 优先使用路由参数
    if (routeSegmentId) {
      return Number(routeSegmentId);
    }
    // 从 query 中解析
    const searchParams = new URLSearchParams(location.search);
    const querySegmentId = searchParams.get('segmentId');
    return querySegmentId ? Number(querySegmentId) : null;
  });

  // 监听路由变化
  useEffect(() => {
    if (routeSegmentId) {
      setSegmentId(Number(routeSegmentId));
    } else {
      const searchParams = new URLSearchParams(location.search);
      const querySegmentId = searchParams.get('segmentId');
      setSegmentId(querySegmentId ? Number(querySegmentId) : null);
    }
  }, [routeSegmentId, location.search]);

  const highlightRef = useRef<HTMLDivElement>(null);
  const { segments, loading, error, usingMockData } = useOriginalTextSegments(segmentId);

  // 选中分段变化时自动滚动定位
  // 依赖含 segments：初始进入/切换时 segmentId 已定但分段异步加载，
  // 必须等 segments 到位、高亮 ref 挂载后再触发滚动。
  // 双 rAF：第一帧触发布局/绘制，第二帧确保 navigate 后大量重排已稳定再滚动，
  // 消除「渲染未完成就 scrollIntoView」的偶发定位偏差（S3/S8 竞态根因）。
  useEffect(() => {
    const el = highlightRef.current;
    if (!el) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [segmentId, segments]);

  // 加载状态
  if (loading) {
    return (
      <div className="original-text-page loading">
        <Spin tip={dict('PC.Pages.SpaceKnowledge.SourceDocumentComparison.loadingDocument')} />
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="original-text-page error">
        <Empty description={error} />
      </div>
    );
  }

  // 无数据状态
  if (!segments || segments.length === 0) {
    return (
      <div className="original-text-page empty">
        <Empty description={dict('PC.Pages.SpaceKnowledge.SourceDocumentComparison.noOriginalDocument')} />
      </div>
    );
  }

  return (
    <div className="original-text-page">
      <div className="preview-header">
        <h3 className="preview-title">{dict('PC.Pages.SpaceKnowledge.SourceDocumentComparison.originalComparison')}</h3>
        {usingMockData && (
          <span className="mock-data-badge">模拟数据</span>
        )}
      </div>
      <div className="preview-content">
        <div className="original-text-container">
          {segments.map((seg, idx) => {
            const isHighlighted = String(seg.id) === String(segmentId);
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

export default SpaceKnowledgeOriginalText;
