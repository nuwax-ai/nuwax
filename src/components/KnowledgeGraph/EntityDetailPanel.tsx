/**
 * 实体详情面板
 */
import { dict } from '@/services/i18nRuntime';
import type { KnowledgeTriple } from '@/types/interfaces/knowledge';
import { CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { Empty, Tag } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './EntityDetailPanel.less';
import type { GraphEdge, GraphNode } from './types/graph';

interface EntityDetailPanelProps {
  visible: boolean;
  node: GraphNode | null;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  triples: KnowledgeTriple[];
  onClose: () => void;
  onRelatedEntityClick?: (nodeId: string) => void;
}

const EntityTypeLabels: Record<string, string> = {
  root: dict('PC.Components.EntityDetailPanel.rootEntityType'),
  object: dict('PC.Components.EntityDetailPanel.objectEntityType'),
  content: dict('PC.Components.EntityDetailPanel.contentEntityType'),
};

const EntityDetailPanel: React.FC<EntityDetailPanelProps> = ({
  visible,
  node,
  edges,
  allNodes,
  triples,
  onClose,
  onRelatedEntityClick,
}) => {
  // 展开状态管理
  const [expandedSegments, setExpandedSegments] = useState<
    Record<string, boolean>
  >({});

  // 切换展开状态
  const toggleExpand = (segmentId: string) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [segmentId]: !prev[segmentId],
    }));
  };

  // 获取与当前节点相关的原文切片
  const relatedSegments = useMemo(() => {
    if (!node || !triples || triples.length === 0) {
      return [];
    }

    return triples.filter(
      (triple) =>
        triple.segmentContent &&
        (triple.subject === node.label || triple.object === node.label),
    );
  }, [node, triples]);

  if (!visible || !node) return null;

  // 获取相关实体（通过边连接的节点）
  const relatedEdges = edges.filter(
    (edge) => edge.source === node.id || edge.target === node.id,
  );

  const relatedEntities = relatedEdges.map((edge) => {
    const isSource = edge.source === node.id;
    const relatedNodeId = isSource ? edge.target : edge.source;
    const relatedNode = allNodes.find((n) => n.id === relatedNodeId);
    return {
      id: relatedNodeId,
      label: relatedNode?.label || relatedNodeId,
      relation: edge.label,
      direction: isSource ? 'out' : 'in',
    };
  });

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div
            className={styles.entityColor}
            style={{ backgroundColor: '#4F46E5' }}
          />
          <span className={styles.entityName}>{node.label}</span>
        </div>
        <CloseOutlined className={styles.closeIcon} onClick={onClose} />
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <div className={styles.sectionTitle}>{dict('PC.Components.EntityDetailPanel.entityType')}</div>
          <Tag color="purple">{EntityTypeLabels[node.type] || node.type}</Tag>
        </div>

        {node.fullText && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>{dict('PC.Components.EntityDetailPanel.entityDescription')}</div>
            <div className={styles.description}>{node.fullText}</div>
          </div>
        )}

        {relatedEntities.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>{dict('PC.Components.EntityDetailPanel.relatedEntities')}</div>
            <div className={styles.relatedEntities}>
              {relatedEntities.map((entity) => (
                <div
                  key={entity.id}
                  className={styles.relatedEntityItem}
                  onClick={() => onRelatedEntityClick?.(entity.id)}
                >
                  <span className={styles.relationLabel}>
                    {entity.relation}
                  </span>
                  <span className={styles.entityLabel}>{entity.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {relatedSegments.length > 0 ? (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>{dict('PC.Components.EntityDetailPanel.originalSegment')}</div>
            <div className={styles.segments}>
              {relatedSegments.map((segment, index) => {
                const isExpanded = expandedSegments[segment.id] || false;
                return (
                  <div key={segment.id} className={styles.segmentItem}>
                    <div className={styles.segmentHeader}>
                      <div className={styles.segmentIndex}>
                        {dict('PC.Components.EntityDetailPanel.segment', index + 1)}
                      </div>
                      {segment.documentName && (
                        <div className={styles.documentName}>
                          {segment.documentName}
                        </div>
                      )}
                    </div>
                    <div
                      className={`${styles.segmentContent} ${
                        isExpanded ? styles.expanded : styles.collapsed
                      }`}
                    >
                      {segment.segmentContent}
                    </div>
                    <div
                      className={styles.expandButton}
                      onClick={() => toggleExpand(segment.id)}
                    >
                      {isExpanded ? (
                        <>
                          {dict('PC.Components.EntityDetailPanel.collapse')} <UpOutlined />
                        </>
                      ) : (
                        <>
                          {dict('PC.Components.EntityDetailPanel.more')} <DownOutlined />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>{dict('PC.Components.EntityDetailPanel.originalSegment')}</div>
            <Empty description={dict('PC.Components.EntityDetailPanel.noRelatedSegments')} />
          </div>
        )}
      </div>
    </div>
  );
};

export { EntityDetailPanel };
export default EntityDetailPanel;
