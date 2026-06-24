import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Input, Select, Spin } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import type { SearchStrategy } from '@/components/KnowledgeAccuracyTest/types';
import {
  getAccuracyTestDocuments,
  getAccuracyTestHistory,
  performAccuracySearch,
} from '@/components/KnowledgeAccuracyTest/service';
import type { DocumentItem, TestHistoryItem, RecallResultItem } from '@/components/KnowledgeAccuracyTest/types';
import styles from './index.less';

const { TextArea } = Input;
const { Option } = Select;

interface KnowledgeAccuracyTestProps {
  knowledgeBaseId?: string | number;
  onBack?: () => void;
}

const KnowledgeAccuracyTest: React.FC<KnowledgeAccuracyTestProps> = ({
  knowledgeBaseId,
  onBack,
}) => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // 测试范围和模式选择
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [searchStrategy, setSearchStrategy] = useState<SearchStrategy>('MIXED');
  const [query, setQuery] = useState('');

  // 数据列表
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);
  const [recallResults, setRecallResults] = useState<RecallResultItem[]>([]);

  // 展开状态管理
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // 搜索参数
  const [topK, setTopK] = useState(10);
  const [matchingDegree, setMatchingDegree] = useState(0.3);

  // 初始化加载数据
  useEffect(() => {
    if (knowledgeBaseId) {
      loadDocuments();
      loadTestHistory();
    }
  }, [knowledgeBaseId]);

  // 加载文档列表
  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await getAccuracyTestDocuments(Number(knowledgeBaseId));
      if (response?.data) {
        setDocuments(response.data);
        // 默认全选
        setSelectedDocuments(response.data.map((doc: DocumentItem) => doc.id));
      }
    } catch (error) {
      console.error('加载文档列表失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载测试历史
  const loadTestHistory = async () => {
    try {
      setLoading(true);
      const response = await getAccuracyTestHistory(Number(knowledgeBaseId));
      if (response?.data) {
        setTestHistory(response.data);
      }
    } catch (error) {
      console.error('加载测试历史失败', error);
    } finally {
      setLoading(false);
    }
  };

  // 执行命中测试
  const handleSearchTest = async () => {
    if (!query.trim()) {
      return;
    }

    try {
      setSearchLoading(true);
      const response = await performAccuracySearch({
        knowledgeBaseId: Number(knowledgeBaseId),
        query: query.trim(),
        searchStrategy,
        topK,
        matchingDegree,
      });

      if (response?.data) {
        setRecallResults(response.data.results || []);

        // 重新加载测试历史
        await loadTestHistory();
      }
    } catch (error) {
      console.error('执行命中测试失败', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // 获取搜索策略显示名称
  const getStrategyLabel = (strategy: SearchStrategy) => {
    switch (strategy) {
      case 'SEMANTIC':
        return '语义搜索';
      case 'FULL_TEXT':
        return '全文搜索';
      case 'MIXED':
        return '混合搜索';
      default:
        return strategy;
    }
  };

  // 获取排名标签颜色
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FF69B4'; // 粉色
      case 2:
        return '#FFA500'; // 橙色
      case 3:
        return '#20B2AA'; // 青色
      default:
        return '#999999'; // 灰色
    }
  };

  // 获取排名标签文本
  const getRankLabel = (rank: number) => {
    return rank <= 3 ? `TOP${rank}` : `${rank}`;
  };

  // 处理测试历史记录点击事件
  const handleHistoryClick = (record: TestHistoryItem) => {
    console.log('点击了历史记录:', record);
    console.log('record.results:', record.results);
    console.log('record.results 类型:', typeof record.results);

    try {
      // 先清空当前显示的召回结果
      setRecallResults([]);
      setExpandedCardId(null);

      // 检查results字段是否为空
      if (!record.results ||
          record.results === '' ||
          record.results === null ||
          record.results === undefined ||
          record.results === '[]' ||
          record.results === '{}') {
        console.log('results字段为空，召回结果已清空');
        return;
      }

      // 如果是字符串，先解析
      let parsedResults: any;
      if (typeof record.results === 'string') {
        // 尝试解析JSON字符串
        try {
          parsedResults = JSON.parse(record.results);
          console.log('解析后的results:', parsedResults);
        } catch (e) {
          console.error('JSON解析失败:', e);
          return;
        }
      } else {
        parsedResults = record.results;
      }

      // 检查解析后的结果是否为空对象或空数组
      if (
        (Array.isArray(parsedResults) && parsedResults.length === 0) ||
        (typeof parsedResults === 'object' && Object.keys(parsedResults).length === 0)
      ) {
        console.log('解析后的结果为空数组或空对象，召回结果保持为空');
        return;
      }

      // 处理results字段为对象的情况
      let resultsArray: RecallResultItem[] = [];

      if (Array.isArray(parsedResults)) {
        // 如果直接是数组，直接使用
        resultsArray = parsedResults;
      } else if (typeof parsedResults === 'object' && parsedResults !== null) {
        // 如果是对象，尝试提取数组数据
        if (Array.isArray(parsedResults.results)) {
          resultsArray = parsedResults.results;
          console.log('从 results.results 提取到数组数据，长度:', resultsArray.length);
        } else if (Array.isArray(parsedResults.data)) {
          resultsArray = parsedResults.data;
          console.log('从 results.data 提取到数组数据，长度:', resultsArray.length);
        } else if (Array.isArray(parsedResults.list)) {
          resultsArray = parsedResults.list;
          console.log('从 results.list 提取到数组数据，长度:', resultsArray.length);
        } else {
          console.warn('无法从results对象中提取数组数据:', parsedResults);
          return;
        }
      }

      // 检查提取的数组是否为空
      if (!resultsArray || resultsArray.length === 0) {
        console.log('提取的数组为空，召回结果保持为空');
        return;
      }

      console.log('设置召回结果:', resultsArray);
      setRecallResults(resultsArray);
    } catch (error) {
      console.error('解析历史记录结果失败', error);
      // 解析失败时也清空召回结果（已经在开始时清空了）
    }
  };

  // 处理卡片展开/收缩
  const handleCardToggle = (docId: string | number) => {
    if (expandedCardId === docId) {
      setExpandedCardId(null); // 收缩
    } else {
      setExpandedCardId(docId); // 展开
    }
  };

  // 测试历史表格列定义
  const historyColumns = [
    {
      title: 'Query',
      dataIndex: 'query',
      key: 'query',
      width: '70%',
      render: (text: string, record: TestHistoryItem) => (
        <a
          onClick={(e) => {
            e.preventDefault();
            console.log('Query点击事件触发:', record);
            handleHistoryClick(record);
          }}
          style={{ cursor: 'pointer', color: '#1890FF' }}
        >
          {text}
        </a>
      ),
    },
    {
      title: '时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: '30%',
    },
  ];

  return (
    <div className={styles.container}>
      {/* 左侧面板 */}
      <div className={styles.leftPanel}>
        {/* 测试配置区 */}
        <Card className={styles.testConfig} bordered={false}>
          <div className={styles.configHeader}>
            <ArrowLeftOutlined onClick={onBack} className={styles.backIcon} />
            <span className={styles.headerTitle}>命中测试配置</span>
          </div>

          <div className={styles.configContent}>
            {/* 测试范围 */}
            <div className={styles.configItem}>
              <label className={styles.label}>测试范围：</label>
              <Select
                mode="multiple"
                className={styles.select}
                placeholder="选择测试文档"
                value={selectedDocuments}
                onChange={setSelectedDocuments}
                allowClear
                maxTagCount="responsive"
                maxTagPlaceholder={(omittedValues) => `+ ${omittedValues.length} ...`}
              >
                {documents.map((doc) => (
                  <Option key={doc.id} value={doc.id}>
                    {doc.name}
                  </Option>
                ))}
              </Select>
            </div>

            {/* 搜索模式 */}
            <div className={styles.configItem}>
              <label className={styles.label}>搜索模式：</label>
              <Select
                className={styles.select}
                value={searchStrategy}
                onChange={setSearchStrategy}
              >
                <Option value="SEMANTIC">语义搜索</Option>
                <Option value="MIXED">混合搜索</Option>
                <Option value="FULL_TEXT">全文搜索</Option>
              </Select>
            </div>

            {/* 命中测试输入框 */}
            <div className={styles.configItem}>
              <label className={styles.label}>测试Query：</label>
              <TextArea
                className={styles.textarea}
                placeholder="输入要测试的query文本..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
              />
            </div>

            {/* 执行测试按钮 */}
            <Button
              type="primary"
              className={styles.testButton}
              onClick={handleSearchTest}
              loading={searchLoading}
              icon={<SearchOutlined />}
              disabled={!query.trim()}
            >
              执行命中测试
            </Button>
          </div>
        </Card>

        {/* 测试历史区 */}
        <Card className={styles.testHistory} bordered={false} title="测试历史">
          <Table
            columns={historyColumns}
            dataSource={testHistory}
            loading={loading}
            pagination={false}
            size="small"
            rowKey="id"
          />
        </Card>
      </div>

      {/* 右侧面板 */}
      <div className={styles.rightPanel}>
        <Card className={styles.resultsPanel} bordered={false}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsTitle}>
              召回结果（{recallResults.length}）
            </div>
          </div>

          <Spin spinning={searchLoading}>
            <div className={styles.resultsList}>
              {recallResults.length === 0 && !searchLoading ? (
                <div className={styles.emptyState}>
                  暂无召回结果
                </div>
              ) : (
                recallResults.map((result, index) => {
                  const isExpanded = expandedCardId === result.docId;
                  const showExpandButton = result.content && result.content.length > 200;

                  return (
                    <Card
                      key={result.docId}
                      className={styles.resultCard}
                      bordered={false}
                      onClick={() => showExpandButton && handleCardToggle(result.docId)}
                      style={showExpandButton ? { cursor: 'pointer' } : undefined}
                    >
                      <div className={styles.resultHeader}>
                        <Tag
                          className={styles.rankTag}
                          style={{ backgroundColor: getRankColor(index + 1) }}
                        >
                          {getRankLabel(index + 1)}
                        </Tag>
                        <span className={styles.scoreText}>
                          Score: {result.score}/1
                        </span>
                      </div>

                      <div className={styles.documentInfo}>
                        <div className={styles.documentName}>{result.docName}</div>
                      </div>

                      {result.content && (
                        <div className={styles.contentPreview}>
                          {isExpanded ? (
                            <div className={styles.contentText}>
                              {result.content}
                            </div>
                          ) : (
                            <>
                              {result.content.substring(0, 200)}
                              {showExpandButton && '...'}
                            </>
                          )}
                          {showExpandButton && (
                            <div className={styles.expandHint}>
                                {isExpanded ? '点击收缩' : '点击展开'}
                              </div>
                            )}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </Spin>
        </Card>
      </div>
    </div>
  );
};

export default KnowledgeAccuracyTest;