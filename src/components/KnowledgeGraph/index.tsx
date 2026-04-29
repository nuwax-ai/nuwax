/**
 * 知识图谱主组件
 */
import { apiKnowledgeTripleListByKnowledge } from '@/services/knowledge';
import type { KnowledgeTripleDocumentInfo } from '@/types/interfaces/knowledge';
import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { Empty, Input, Spin, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import EntityDetailPanel from './EntityDetailPanel';
import GraphCanvas, { GraphCanvasRef } from './GraphCanvas';
import styles from './index.less';
import { useGraphStore } from './store/useGraphStore';
import { convertToGraphData, resetColorIndex } from './utils';

interface KnowledgeGraphProps {
  kbId?: number;
  spaceId?: number;
  documentInfo: KnowledgeTripleDocumentInfo | null;
  showBackButton?: boolean;
  onBack?: () => void;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  kbId,
  documentInfo,
  showBackButton,
  onBack,
}) => {
  const graphCanvasRef = useRef<GraphCanvasRef>(null);
  const [loading, setLoading] = useState(false);
  const [nodeSearchKeyword, setNodeSearchKeyword] = useState('');
  const {
    filteredData,
    graphData,
    detailPanelVisible,
    detailPanelNode,
    setGraphData,
    closeDetailPanel,
    openDetailPanel,
    search,
  } = useGraphStore();

  // 存储三元组数据，用于显示原文切片
  const [triples, setTriples] = useState<any[]>([]);

  // 初始化数据
  useEffect(() => {
    if (kbId) {
      useGraphStore.getState().reset();
      setLoading(true);
      resetColorIndex();

      const fetchData = async () => {
        try {
          const response = await apiKnowledgeTripleListByKnowledge({
            knowledgeId: kbId,
            pageNum: 1,
            pageSize: 1000, // 加载更多数据以显示完整图谱
          });

          if (response.success && response.message === 'success') {
            let tripleData = response.data.list || [];

            // 如果是单个文档的知识图谱，过滤数据
            if (documentInfo && documentInfo.documentId !== 0) {
              tripleData = tripleData.filter(
                (triple) => triple.documentId === documentInfo.documentId,
              );
            }

            const data = convertToGraphData(tripleData);
            setGraphData(data);
            setTriples(tripleData); // 保存三元组数据
          }
        } catch (error) {
          console.error('加载知识图谱数据失败:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [kbId, setGraphData]);

  const handleNodeSearch = useCallback(
    (keyword: string) => {
      setNodeSearchKeyword(keyword);
      search(keyword);
    },
    [search],
  );

  const handleRelatedEntityClick = useCallback(
    (nodeId: string) => {
      const node = graphData.nodes.find((n) => n.id === nodeId);
      if (node) {
        openDetailPanel(node);
      }
    },
    [graphData.nodes, openDetailPanel],
  );

  if (!documentInfo) {
    return (
      <div className={styles.emptyContainer}>
        <Empty description="请选择文档查看知识图谱" />
      </div>
    );
  }

  return (
    <div className={styles.knowledgeGraphContainer}>
      {loading && (
        <div className={styles.loadingOverlay}>
          <Spin size="large" tip="图谱加载中..." />
        </div>
      )}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {showBackButton && (
            <ArrowLeftOutlined className={styles.backIcon} onClick={onBack} />
          )}
          <div className={styles.titleArea}>
            <div className={styles.titleMain}>知识图谱</div>
            {/* 只有当不是从知识图谱按钮进入时，才显示文档名称 */}
            {documentInfo.documentId !== 0 && (
              <Tooltip
                title={
                  documentInfo.documentName?.length > 30
                    ? documentInfo.documentName
                    : ''
                }
              >
                <div className={styles.titleSub}>
                  {documentInfo.documentName?.replace(/\.[^.]+$/, '') || '-'}
                </div>
              </Tooltip>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.searchTip}>
            移动鼠标滚轮可实现图谱缩放
            {/* 最多展示60个实体，可通过搜索查看更多内容 */}
          </span>
          <Input
            placeholder="搜索节点"
            prefix={<SearchOutlined />}
            value={nodeSearchKeyword}
            onChange={(e) => handleNodeSearch(e.target.value)}
            allowClear
            style={{ width: 200 }}
          />
        </div>
      </header>
      <main className={styles.main}>
        {!loading && filteredData.nodes.length > 0 ? (
          <GraphCanvas ref={graphCanvasRef} data={filteredData} />
        ) : loading ? (
          <div className={styles.emptyState}>
            <Spin size="large" tip="加载中..." />
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Empty description="暂无节点数据" />
          </div>
        )}
      </main>
      <EntityDetailPanel
        visible={detailPanelVisible}
        node={detailPanelNode}
        edges={graphData.edges}
        allNodes={graphData.nodes}
        triples={triples}
        onClose={closeDetailPanel}
        onRelatedEntityClick={handleRelatedEntityClick}
      />
    </div>
  );
};

export { KnowledgeGraph };
export default KnowledgeGraph;
