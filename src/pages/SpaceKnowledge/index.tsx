import CreateKnowledge from '@/components/CreateKnowledge';
import { KnowledgeGraph } from '@/components/KnowledgeGraph';
import type { AddNodeData } from '@/components/KnowledgeGraph/AddNodeModal';
import AddNodeModal from '@/components/KnowledgeGraph/AddNodeModal';
import BatchImportModal from '@/components/KnowledgeGraph/BatchImportModal';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiKnowledgeConfigDetail,
  apiKnowledgeDocumentDelete,
  apiKnowledgeDocumentList,
  apiKnowledgeQaAdd,
  apiKnowledgeQaDelete,
  apiKnowledgeQaUpdate,
  apiKnowledgeTripleDelete,
  apiKnowledgeTripleGenerate,
  apiKnowledgeTripleList,
} from '@/services/knowledge';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  KnowledgeDocTypeEnum,
  KnowledgeTextImportEnum,
} from '@/types/enums/library';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type {
  KnowledgeBaseInfo,
  KnowledgeDocumentInfo,
  KnowledgeInfo,
  KnowledgeQAInfo,
  KnowledgeTripleDocumentInfo,
} from '@/types/interfaces/knowledge';
import { KnowledgeDocumentStatus } from '@/types/interfaces/knowledge';
import type { Page } from '@/types/interfaces/request';
import { modalConfirm } from '@/utils/ant-custom';
import { Input, message } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRequest } from 'umi';
import DocWrap from './DocWrap';
import GraphDocTable from './GraphDocTable';
import styles from './index.less';
import KnowledgeHeader from './KnowledgeHeader';
import LocalDocModal from './LocalCustomDocModal';
import QaBatchModal from './QaBatchModal';
import QaModal from './QaModal';
import QaTableList, { QaTableListRef } from './QaTableList';
import RawSegmentInfo from './RawSegmentInfo';
import KnowledgeAccuracyTest from './KnowledgeAccuracyTest';
import SourceDocumentComparison from './SourceDocumentComparison';

const cx = classNames.bind(styles);

/**
 * 工作空间-知识库
 */
const SpaceKnowledge: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const knowledgeId = Number(params.knowledgeId);

  const [open, setOpen] = useState<boolean>(false);
  // 知识库资源-文本格式导入类型枚举： 本地文档、在线文档、自定义
  const [type, setType] = useState<KnowledgeTextImportEnum>();
  // 知识库详情信息
  const [knowledgeInfo, setKnowledgeInfo] = useState<KnowledgeInfo>();
  // 打开创建知识库弹窗
  const [openKnowledge, setOpenKnowledge] = useState<boolean>(false);
  // 文档列表
  const [documentList, setDocumentList] = useState<KnowledgeDocumentInfo[]>([]);
  // 文档列表加载中
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);
  // 文档搜索关键词
  const keywordRef = useRef<string>('');
  // 文档总数
  const [totalDocCount, setTotalDocCount] = useState<number>(0);
  // 当前文档信息
  const [currentDocumentInfo, setCurrentDocumentInfo] =
    useState<KnowledgeDocumentInfo | null>(null);
  // QA问答批量弹窗
  const [qaBatchOpen, setQaBatchOpen] = useState<boolean>(false);

  // 当前页码
  const [page, setPage] = useState<number>(1);
  // 是否有更多数据
  const [hasMore, setHasMore] = useState<boolean>(true);

  const [docType, setDocType] = useState<number>(1);
  const qaTableListRef = useRef<QaTableListRef>(null);
  const [qaInfo, setQaInfo] = useState<KnowledgeQAInfo | null>(null);
  // 根据docType 判断是否显示QA问答
  const [qaOpen, setQaOpen] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>('');
  // 当前选中的分段（用于原文对照）
  const [selectedSegment, setSelectedSegment] = useState<any>(null);

  // 知识图谱模式的文档状态
  const [graphDocList, setGraphDocList] = useState<
    KnowledgeTripleDocumentInfo[]
  >([]);
  const [currentGraphDoc, setCurrentGraphDoc] =
    useState<KnowledgeTripleDocumentInfo | null>(null);
  // 知识图谱视图模式：'table' 显示表格，'graph' 显示图谱详情
  const [graphViewMode, setGraphViewMode] = useState<'table' | 'graph'>(
    'table',
  );
  // 手动添加图谱节点弹窗
  const [openAddNodeModal, setOpenAddNodeModal] = useState<boolean>(false);
  // 批量导入图谱节点弹窗
  const [openBatchImportModal, setOpenBatchImportModal] =
    useState<boolean>(false);
  // 知识图谱加载状态
  const [loadingGraph, setLoadingGraph] = useState<boolean>(false);
  // 知识图谱三元组数据
  //const [tripleData, setTripleData] = useState<any>(null);

  // 知识库基础配置接口 - 数据详情查询
  const { run } = useRequest(apiKnowledgeConfigDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: KnowledgeInfo) => {
      setKnowledgeInfo(result);
    },
  });

  // 查询列表成功后处理数据 - 文档列表查询
  const handleQuerySuccess = (result: Page<KnowledgeDocumentInfo>) => {
    const { records, pages, current, total } = result;
    const data = records || [];
    setDocumentList((prev) => {
      return current === 1 ? data : [...prev, ...data];
    });
    // 如果当前页码大于等于总页数，则不再加载更多数据
    setHasMore(current < pages);
    // 更新页码
    setPage(current);
    setTotalDocCount(total);
    setLoadingDoc(false);
    // 首次加载文档列表时，当前文档为空，需要查询分段信息，新增文档时，当前文档信息不为空，就不需要查询分段信息
    // 搜索文档、删除文档后，如果文档列表为空, 文档信息重置为空
    // 搜索文档后，如果文档列表不为空，但是当前文档信息不在文档列表中，就取文档列表第一项作为当前文档信息
    if (
      !currentDocumentInfo ||
      !data?.some((item) => item.id === currentDocumentInfo?.id)
    ) {
      // 取文档列表第一项作为当前文档信息
      const firstDocumentInfo = data[0] || null;
      setCurrentDocumentInfo(firstDocumentInfo);
    }
  };

  // 知识库文档配置 - 数据列表查询
  const { run: runDocList } = useRequest(apiKnowledgeDocumentList, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (result: Page<KnowledgeDocumentInfo>) => {
      handleQuerySuccess(result);
    },
    onError: () => {
      setLoadingDoc(false);
    },
  });

  // 文档数据列表查询
  const handleDocList = (
    current: number = 1,
    docName: string = keywordRef.current,
  ) => {
    runDocList({
      queryFilter: {
        kbId: knowledgeId,
        name: docName,
      },
      current,
      pageSize: 48,
    });
  };

  // 加载知识图谱列表
  const handleLoadGraphList = async (searchName?: string) => {
    setLoadingGraph(true);
    try {
      const response = await apiKnowledgeTripleList({
        knowledgeId: knowledgeId,
        name: searchName,
      });
      if (response.code === SUCCESS_CODE && response.data) {
        // 直接使用返回的数据
        setGraphDocList(response.data || []);
      }
    } catch (error) {
      // console.error('加载知识图谱列表失败:', error);
      message.error(dict('PC.Pages.SpaceKnowledge.Index.loadGraphListFailed'));
    } finally {
      setLoadingGraph(false);
    }
  };

  // 知识库文档配置 - 数据删除接口
  const { run: runDocDelete } = useRequest(apiKnowledgeDocumentDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(dict('PC.Pages.SpaceKnowledge.Index.deleteDocSuccess'));
      // 删除文档后，更新文档列表以及分段信息
      setLoadingDoc(true);
      handleDocList();

      handleLoadGraphList();
    },
  });

  useEffect(() => {
    // 查询知识库数据详情查询
    run(knowledgeId);
    setLoadingDoc(true);
    // 文档数据列表查询
    handleDocList();
  }, [knowledgeId]);

  // 点击添加内容下拉
  const handleClickPopoverItem = (item: CustomPopoverItem) => {
    // 知识图谱模式
    if (docType === KnowledgeDocTypeEnum.GRAPH) {
      if (item.value === 'manual_add') {
        setOpenAddNodeModal(true);
      } else if (item.value === 'auto_generate') {
        // 一键生成知识图谱
        if (graphDocList.length > 0) {
          // 为所有文档生成知识图谱
          /*
          graphDocList.forEach(doc => {
            handleGenerateGraph(doc.id);
          });*/
        } else {
          message.info(dict('PC.Pages.SpaceKnowledge.Index.addDocFirst'));
        }
      } else if (item.value === 'batch_import') {
        setOpenBatchImportModal(true);
      }
      return;
    }
    // 文档模式
    setType(item.value as KnowledgeTextImportEnum);
    setOpen(true);
  };

  // 添加内容-确认
  const handleConfirm = () => {
    setOpen(false);
    setLoadingDoc(true);
    // 文档数据列表查询
    handleDocList();
  };

  // 知识库新增确认事件
  const handleConfirmKnowledge = (info: KnowledgeBaseInfo) => {
    setOpenKnowledge(false);
    const _knowledgeInfo = { ...knowledgeInfo, ...info } as KnowledgeInfo;
    setKnowledgeInfo(_knowledgeInfo);
  };

  // 搜索
  const handleQueryDoc = (value: string) => {
    // 去除空格
    const _value = value.trim();
    keywordRef.current = _value;
    setLoadingDoc(true);
    handleDocList(1, _value);
  };

  // 设置分析成功（自动重试,如果有分段,问答,向量化有失败的话, status为空）
  const handleSetAnalyzed = useCallback(
    (id: number, status: KnowledgeDocumentStatus) => {
      // 修改当前文档
      if (
        currentDocumentInfo?.id === id &&
        status.docStatusCode !== currentDocumentInfo?.docStatusCode
      ) {
        // 修改当前文档状态
        const _documentInfo = {
          ...currentDocumentInfo,
          ...status,
        };
        setCurrentDocumentInfo(_documentInfo);
      }
      // 修改文档列表
      const _documentList = cloneDeep(documentList);
      const list = _documentList.map((item) => {
        if (item.id === id) {
          return { ...item, ...status };
        }
        return item;
      });
      setDocumentList(list);
    },
    [currentDocumentInfo, documentList],
  );

  // 删除文档
  const handleDocDel = useCallback(() => {
    const docId = currentDocumentInfo?.id;
    modalConfirm(
      dict('PC.Pages.SpaceKnowledge.Index.confirmDeleteDoc'),
      currentDocumentInfo?.name || '',
      () => {
        runDocDelete(docId);
        return new Promise((resolve) => {
          setTimeout(resolve, 1000);
        });
      },
    );
  }, [currentDocumentInfo]);

  // 修改文档名称成功后更新state
  const handleSuccessUpdateName = (id: number, name: string) => {
    // 修改当前文档名称
    const _documentInfo = {
      ...currentDocumentInfo,
      name,
    } as KnowledgeDocumentInfo;
    setCurrentDocumentInfo(_documentInfo);
    // 修改文档列表中当前文档名称
    const _documentList = documentList.map((info) => {
      if (info.id === id) {
        info.name = name;
      }
      return info;
    });
    setDocumentList(_documentList);
  };

  // 知识库问答 - 数据列表查询
  const handleQaList = () => {
    qaTableListRef.current?.refresh();
  };

  // 生成知识图谱
  const handleGenerateGraph = async (docId: number) => {
    try {
      const response = await apiKnowledgeTripleGenerate({
        knowledgeId: knowledgeId,
        documentId: docId,
      });
      if (response.code === SUCCESS_CODE && response.data) {
        message.success(response.data);
        // 轮询检查生成状态
        handleLoadGraphList();
        /*
        const checkStatus = setInterval(async () => {
          try {
            console.log("handleGenerateGraph===================2");
            const listResponse = await apiKnowledgeTripleList({
              knowledgeId: knowledgeId,
            });
            if (listResponse.code === SUCCESS_CODE && listResponse.data) {
              const docInfo = listResponse.data.data.find(
                (doc: KnowledgeTripleDocumentInfo) => doc.documentId === docId,
              );
              console.log("handleGenerateGraph===================3");
              if (
                docInfo &&
                (docInfo.tripleStatus === 2 || docInfo.tripleStatus === 10)
              ) {
                clearInterval(checkStatus);
                if (docInfo.tripleStatus === 2) {
                  message.success(dict('PC.Pages.SpaceKnowledge.Index.graphGenerateSuccess'));
                } else {
                  message.error(dict('PC.Pages.SpaceKnowledge.Index.generateGraphFailed'));
                }
                console.log("handleGenerateGraph===================4");
                // 重新加载知识图谱列表
                handleLoadGraphList();
                console.log("handleGenerateGraph===================5");
              }
            }
          } catch (error) {
            console.error('检查知识图谱生成状态失败:', error);
          }
        }, 3000);*/
      } else {
        message.error(
          dict('PC.Pages.SpaceKnowledge.Index.graphGenerateTaskSubmitFailed'),
        );
      }
    } catch (error) {
      console.error('生成知识图谱失败:', error);
      message.error(dict('PC.Pages.SpaceKnowledge.Index.generateGraphFailed'));
    }
  };

  // 切换类型
  const handleChangeDocType = (value: number) => {
    setQuestion(''); // 切换类型后，清空搜索
    setDocType(value);
    // 切换类型后，查询文档列表
    if (value === KnowledgeDocTypeEnum.DOC) {
      setLoadingDoc(true);
      handleDocList();
    } else if (value === KnowledgeDocTypeEnum.QA) {
      // 切换类型后，查询QA问答列表
      handleQaList();
    } else if (value === KnowledgeDocTypeEnum.GRAPH) {
      // 知识图谱模式：加载真实数据
      handleLoadGraphList();
      setGraphViewMode('table'); // 重置为表格视图
      setCurrentGraphDoc(null);
    }
  };

  // 点击QA问答下拉
  const handleClickQaPopoverItem = (item: CustomPopoverItem) => {
    if (item.value === KnowledgeTextImportEnum.Custom) {
      setType(item.value as KnowledgeTextImportEnum);
      setQaInfo(null);
      setQaOpen(true);
    } else {
      //QA批量弹窗添加文件上传
      setQaBatchOpen(true);
    }
  };
  // 文档内容
  const renderDocContent = () => {
    return (
      <div className={cx('flex', 'flex-1')}>
        {/*文档列表*/}
        <DocWrap
          currentDocId={currentDocumentInfo?.id}
          loading={loadingDoc}
          documentList={documentList}
          onClick={setCurrentDocumentInfo}
          onChange={handleQueryDoc}
          onSetAnalyzed={handleSetAnalyzed}
          hasMore={hasMore}
          onScroll={() => {
            // 下一页页码
            const nextPage = page + 1;
            handleDocList(nextPage);
          }}
        />
        {/*文件信息*/}
        <RawSegmentInfo
          documentInfo={currentDocumentInfo}
          onDel={handleDocDel}
          onSuccessUpdateName={handleSuccessUpdateName}
          onSegmentSelect={setSelectedSegment}
        />
        {/*原文对照 - 新增板块*/}
        <SourceDocumentComparison
          documentInfo={currentDocumentInfo}
          selectedSegment={selectedSegment}
          visible={true}
        />
      </div>
    );
  };

  // 编辑QA问答
  const handleEditQa = (record: KnowledgeQAInfo) => {
    setQaInfo(record);
    setQaOpen(true);
  };
  // 删除QA问答
  const handleDeleteQa = async (record: KnowledgeQAInfo) => {
    try {
      const { code } = await apiKnowledgeQaDelete({
        id: record.id,
      });
      if (code === SUCCESS_CODE) {
        message.success(dict('PC.Pages.SpaceKnowledge.Index.deleteQaSuccess'));
        handleQaList();
      }
    } catch {}
  };
  // 添加问题搜索功能 点击按钮搜索
  const handleSearch = (value: string) => {
    setQuestion(value);
    handleQaList();
  };

  // 点击表格中的文档，进入图谱详情页
  const handleGraphDocClick = (doc: KnowledgeTripleDocumentInfo) => {
    setCurrentGraphDoc(doc);
    setGraphViewMode('graph');
  };

  // 批量删除图谱文档
  const handleGraphBatchDelete = async (ids: number[]) => {
    try {
      // 逐个删除知识图谱
      for (const id of ids) {
        const response = await apiKnowledgeTripleDelete({
          kbId: knowledgeId,
          documentId: id,
        });
        if (response.code !== SUCCESS_CODE) {
          throw new Error(`删除文档 ${id} 失败`);
        }
      }
      // 更新本地列表
      /*
      const newList = graphDocList.filter((d) => !ids.includes(d.documentId));
      setGraphDocList(newList);*/

      handleLoadGraphList();

      message.success(
        dict(
          'PC.Pages.SpaceKnowledge.Index.batchDeleteGraphSuccess',
          ids.length,
        ),
      );
    } catch (error) {
      console.error('批量删除知识图谱失败:', error);
      message.error(
        dict('PC.Pages.SpaceKnowledge.Index.batchDeleteGraphFailed'),
      );
    }
  };

  // 批量修改配置
  const handleGraphBatchConfig = (ids: number[]) => {
    message.info(
      dict(
        'PC.Pages.SpaceKnowledge.Index.batchConfigInDevelopment',
        ids.length,
      ),
    );
  };

  // 开启/关闭图谱
  const handleToggleGraph = (id: number, enable: boolean) => {
    const newList = graphDocList.map((d) => {
      if (d.documentId === id) {
        return { ...d, tripleStatus: enable ? 2 : 3 };
      }
      return d;
    });
    setGraphDocList(newList);
    message.success(
      enable
        ? dict('PC.Pages.SpaceKnowledge.Index.graphEnabled')
        : dict('PC.Pages.SpaceKnowledge.Index.graphDisabled'),
    );
  };

  // 单个文档删除
  const handleGraphDelete = async (id: number) => {
    try {
      const response = await apiKnowledgeTripleDelete({
        kbId: knowledgeId,
        documentId: id,
      });
      if (response.code === SUCCESS_CODE && response.data) {
        // 更新本地列表
        /*
        const newList = graphDocList.filter((d) => d.documentId !== id);
        setGraphDocList(newList);*/

        handleLoadGraphList();

        message.success(dict('PC.Pages.SpaceKnowledge.Index.deleteSuccess'));
      } else {
        message.error(dict('PC.Pages.SpaceKnowledge.Index.deleteFailed'));
      }
    } catch (error) {
      console.error('删除知识图谱失败:', error);
      message.error(dict('PC.Pages.SpaceKnowledge.Index.deleteGraphFailed'));
    }
  };

  // 搜索知识图谱文档
  const handleGraphSearch = (keyword: string) => {
    handleLoadGraphList(keyword || undefined);
  };

  // 查看全部知识图谱
  const handleViewAllGraphs = async () => {
    try {
      // 切换到图谱视图，显示所有知识图谱
      setGraphViewMode('graph');
      // 这里可以设置一个特殊的 documentInfo 来标识是全部知识图谱
      setCurrentGraphDoc({
        documentId: 0,
        documentName: dict('PC.Pages.SpaceKnowledge.Index.allKnowledgeGraphs'),
        fileType: 'all',
        tripleStatus: 2,
      });
    } catch (error) {
      console.error('查看全部知识图谱失败:', error);
      message.error(dict('PC.Pages.SpaceKnowledge.Index.viewAllGraphsFailed'));
    }
  };

  // 渲染知识图谱内容
  const renderGraphContent = () => {
    if (graphViewMode === 'table') {
      // 表格视图
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: '16px',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <GraphDocTable
            documentList={graphDocList}
            loading={loadingGraph}
            onRowClick={handleGraphDocClick}
            onBatchDelete={handleGraphBatchDelete}
            onBatchConfig={handleGraphBatchConfig}
            onToggleGraph={handleToggleGraph}
            onDelete={handleGraphDelete}
            onGenerateGraph={handleGenerateGraph}
            onSearch={handleGraphSearch}
          />
        </div>
      );
    }
    // 图谱详情视图
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 知识图谱 */}
        <div
          style={{ flex: 1, width: '100%', minHeight: 0, overflow: 'hidden' }}
        >
          <KnowledgeGraph
            kbId={knowledgeId}
            spaceId={spaceId}
            documentInfo={currentGraphDoc}
            showBackButton
            onBack={() => setGraphViewMode('table')}
          />
        </div>
      </div>
    );
  };
  const renderQaContent = () => {
    return (
      <div className={cx('flex', 'flex-col', 'w-full')}>
        <div className={cx(styles.inputSearch)}>
          <Input.Search
            placeholder={dict('PC.Pages.SpaceKnowledge.Index.searchQuestion')}
            value={question}
            onChange={(e) => handleSearch(e.target.value)}
            allowClear
            style={{
              width: 240,
            }}
            onSearch={handleSearch}
          />
        </div>
        {/* 修改为表格 远程加载数据 */}
        <QaTableList
          ref={qaTableListRef}
          spaceId={Number(spaceId)}
          kbId={Number(knowledgeId)}
          onEdit={handleEditQa}
          onDelete={handleDeleteQa}
          question={question}
        />
      </div>
    );
  };

  // 渲染命中测试内容
  const renderAccuracyTestContent = () => {
    return <KnowledgeAccuracyTest knowledgeBaseId={knowledgeId} />;
  };

  // 确认QA问答
  const handleConfirmQa = async (values: any): Promise<null> => {
    // 把数据添加到后端
    let doAction;
    if (values.id) {
      doAction = apiKnowledgeQaUpdate({
        id: values.id,
        question: values.question,
        answer: values.answer,
      });
    } else {
      doAction = apiKnowledgeQaAdd({
        kbId: knowledgeId,
        question: values.question,
        answer: values.answer,
        spaceId,
      });
    }
    try {
      const res = await doAction;
      if (res.code === SUCCESS_CODE) {
        message.success(
          values.id
            ? dict('PC.Pages.SpaceKnowledge.Index.qaUpdateSuccess')
            : dict('PC.Pages.SpaceKnowledge.Index.qaAddSuccess'),
        );
        // 添加成功后，查询文档列表
        handleQaList();
        setQaOpen(false);
      }
    } catch (error) {
      console.error(error);
      // message.error(values.id ? 'QA问答更新失败' : '添加QA问答失败');
    }
    return null;
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      {/* 知识库头部  根据type 判断是否显示QA问答 */}
      <KnowledgeHeader
        docCount={totalDocCount}
        knowledgeInfo={knowledgeInfo}
        docType={docType}
        onChangeDocType={handleChangeDocType}
        onEdit={() => setOpenKnowledge(true)}
        onPopover={handleClickPopoverItem}
        onQaPopover={handleClickQaPopoverItem}
        onViewAllGraphs={handleViewAllGraphs}
      />
      {/* 根据docType 判断是否显示QA问答 */}
      <div
        className={cx('flex', 'flex-1')}
        style={{
          padding: docType === KnowledgeDocTypeEnum.GRAPH ? 0 : '0 10px',
          overflow: 'hidden',
        }}
      >
        {docType === KnowledgeDocTypeEnum.DOC && renderDocContent()}
        {docType === KnowledgeDocTypeEnum.QA && renderQaContent()}
        {docType === KnowledgeDocTypeEnum.GRAPH && renderGraphContent()}
        {docType === KnowledgeDocTypeEnum.ACCURACYTEST && renderAccuracyTestContent()}
      </div>

      {/*本地文档弹窗*/}
      <LocalDocModal
        id={knowledgeId}
        type={type}
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
      {/*创建、修改知识库弹窗*/}
      <CreateKnowledge
        mode={CreateUpdateModeEnum.Update}
        spaceId={spaceId}
        knowledgeInfo={knowledgeInfo}
        open={openKnowledge}
        onCancel={() => setOpenKnowledge(false)}
        onConfirm={handleConfirmKnowledge}
      />
      {/* QA问答弹窗*/}
      <QaModal
        data={qaInfo}
        type={type as KnowledgeTextImportEnum}
        open={qaOpen}
        onCancel={() => {
          setQaOpen(false);
          setQaInfo(null);
        }}
        onConfirm={handleConfirmQa}
      />
      {/* QA问答批量弹窗*/}
      <QaBatchModal
        open={qaBatchOpen}
        kbId={Number(knowledgeId)}
        onCancel={() => setQaBatchOpen(false)}
        onConfirm={() => {
          setQaBatchOpen(false);
          handleQaList();
        }}
      />
      {/* 手动添加图谱节点弹窗*/}
      <AddNodeModal
        visible={openAddNodeModal}
        onClose={() => setOpenAddNodeModal(false)}
        onConfirm={(data: AddNodeData) => {
          console.log('添加节点数据:', data);
          message.success(dict('PC.Pages.SpaceKnowledge.Index.addSuccess'));
          setOpenAddNodeModal(false);
        }}
      />
      {/* 批量导入图谱节点弹窗*/}
      <BatchImportModal
        visible={openBatchImportModal}
        onClose={() => setOpenBatchImportModal(false)}
        onConfirm={(fileList) => {
          console.log('导入文件列表:', fileList);
          message.success(dict('PC.Pages.SpaceKnowledge.Index.importSuccess'));
        }}
      />
    </div>
  );
};

export default SpaceKnowledge;
