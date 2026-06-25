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
import { useModel } from 'umi';
import { dict } from '@/services/i18nRuntime';

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

  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  let isShowGRAPH = tenantConfigInfo.commercialEdition;

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
      console.error(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.loadDocListFailed'), error);
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
      console.error(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.loadTestHistoryFailed'), error);
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
        isShowGRAPH,
      });

      if (response?.data) {
        setRecallResults((response.data.results || []).map((result: RecallResultItem) => ({
          ...result,
          isExpanded: false,
        })));

        // 重新加载测试历史
        await loadTestHistory();
      }
    } catch (error) {
      console.error(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.executeHitTestFailed'), error);
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
    return rank <= 3 ? 'rgb(124, 112, 255)' : '#999999';
  };

  // 获取排名标签文本
  const getRankLabel = (rank: number) => {
    return rank <= 3 ? `TOP${rank}` : `${rank}`;
  };

  // 处理测试历史记录点击事件
  const handleHistoryClick = (record: TestHistoryItem) => {
    console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.clickedHistoryRecord'), record);
    console.log('record.results:', record.results);
    console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.recordResultsType'), typeof record.results);

    try {
      // 先清空当前显示的召回结果
      setRecallResults([]);

      // 检查results字段是否为空
      if (!record.results ||
          record.results === '' ||
          record.results === null ||
          record.results === undefined ||
          record.results === '[]' ||
          record.results === '{}') {
        console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.resultsFieldEmpty'));
        return;
      }

      // 如果是字符串，先解析
      let parsedResults: any;
      if (typeof record.results === 'string') {
        // 尝试解析JSON字符串
        try {
          parsedResults = JSON.parse(record.results);
          console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.parsedResults'), parsedResults);
        } catch (e) {
          console.error(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.jsonParseFailed'), e);
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
        console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.parsedResultsEmpty'));
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
          console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.extractedFromResultsResults'), resultsArray.length);
        } else if (Array.isArray(parsedResults.data)) {
          resultsArray = parsedResults.data;
          console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.extractedFromResultsData'), resultsArray.length);
        } else if (Array.isArray(parsedResults.list)) {
          resultsArray = parsedResults.list;
          console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.extractedFromResultsList'), resultsArray.length);
        } else {
          console.warn(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.cannotExtractArrayData'), parsedResults);
          return;
        }
      }

      // 检查提取的数组是否为空
      if (!resultsArray || resultsArray.length === 0) {
        console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.extractedArrayEmpty'));
        return;
      }

      console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.settingRecallResults'), resultsArray);
      setRecallResults(resultsArray.map((result: RecallResultItem) => ({
        ...result,
        isExpanded: false,
      })));
    } catch (error) {
      console.error(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.parseHistoryResultsFailed'), error);
      // 解析失败时也清空召回结果（已经在开始时清空了）
    }
  };

  // 处理卡片展开/收缩
  const handleCardToggle = (index: number) => {
    setRecallResults(prevResults =>
      prevResults.map((result, i) =>
        i === index
          ? { ...result, isExpanded: !result.isExpanded }
          : result
      )
    );
  };

  // 自定义测试范围标签渲染（不显示删除图标）
  const renderTestScopeTag = (props: any) => {
    const { label, value } = props;
    return (
      <Tag
        className={styles.customTag}
        closable={false}
      >
        {label}
      </Tag>
    );
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
            console.log(dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.queryClickEventTriggered'), record);
            handleHistoryClick(record);
          }}
          style={{ cursor: 'pointer', color: '#1890FF' }}
        >
          {text}
        </a>
      ),
    },
    {
      title: dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.time'),
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
            <span className={styles.headerTitle}>{dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.hitTestConfig')}</span>
          </div>

          <div className={styles.configContent}>
            {/* 测试范围 */}
            <div className={styles.configItem}>
              <label className={styles.label}>{dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.testScope')}：</label>
              <Select
                mode="multiple"
                className={styles.select}
                placeholder={dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.selectTestDoc')}
                value={selectedDocuments}
                onChange={(value) => {
                  // 不更新 selectedDocuments 状态
                  console.log('尝试修改测试范围，被阻止:', value);
                }}
                allowClear={false}
                maxTagCount="responsive"
                maxTagPlaceholder={(omittedValues) => `+ ${omittedValues.length} ...`}
                tagRender={renderTestScopeTag}
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
              <label className={styles.label}>{dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.searchMode')}：</label>
              <Select
                className={styles.select}
                value={searchStrategy}
                onChange={setSearchStrategy}
              >
                <Option value="SEMANTIC">{dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.semanticSearch')}</Option>
                <Option value="MIXED">{dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.mixedSearch')}</Option>
                <Option value="FULL_TEXT">{dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.fullTextSearch')}</Option>
              </Select>
            </div>

            {/* 命中测试输入框 */}
            <div className={styles.configItem}>
              <label className={styles.label}>{dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.testQuery')}：</label>
              <TextArea
                className={styles.textarea}
                placeholder={dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.inputQueryText')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
              />
            </div>

            {/* 执行测试按钮 */}
            <Button
              type="primary"
              onClick={handleSearchTest}
              loading={searchLoading}
              icon={<SearchOutlined />}
              disabled={!query.trim() || selectedDocuments.length === 0}
            >
              {dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.executeHitTest')}
            </Button>
          </div>
        </Card>

        {/* 测试历史区 */}
        <Card className={styles.testHistory} bordered={false} title={dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.testHistory')}>
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
              {dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.recallResults')}（{recallResults.length}）
            </div>
          </div>

          <Spin spinning={searchLoading}>
            <div className={styles.resultsList}>
              {recallResults.length === 0 && !searchLoading ? (
                <div className={styles.emptyState}>
                  {dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.noRecallResults')}
                </div>
              ) : (
                recallResults.map((result, index) => {
                  const isExpanded = result.isExpanded;
                  const showExpandButton = result.content && result.content.length > 200;

                  return (
                    <Card
                      key={`recall-result-${index}`}
                      className={styles.resultCard}
                      bordered={false}
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
                            <div className={styles.expandHint} onClick={(e) => {
                              e.stopPropagation();
                              handleCardToggle(index);
                            }} style={{ cursor: 'pointer' }}>
                                {isExpanded ? dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.collapse') : dict('PC.Pages.SpaceKnowledge.KnowledgeAccuracyTest.expand')}
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