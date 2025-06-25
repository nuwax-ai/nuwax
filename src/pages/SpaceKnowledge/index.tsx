import CreateKnowledge from '@/components/CreateKnowledge';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiKnowledgeConfigDetail,
  apiKnowledgeDocumentDelete,
  apiKnowledgeDocumentList,
  apiKnowledgeQaAdd,
  apiKnowledgeQaDelete,
  apiKnowledgeQaUpdate,
} from '@/services/knowledge';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { KnowledgeTextImportEnum } from '@/types/enums/library';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type {
  KnowledgeBaseInfo,
  KnowledgeDocumentInfo,
  KnowledgeInfo,
  KnowledgeQAInfo,
} from '@/types/interfaces/knowledge';
import { KnowledgeDocumentStatus } from '@/types/interfaces/knowledge';
import type { Page } from '@/types/interfaces/request';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Input, message, Modal } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRequest } from 'umi';
import DocWrap from './DocWrap';
import styles from './index.less';
import KnowledgeHeader from './KnowledgeHeader';
import LocalDocModal from './LocalCustomDocModal';
import QaBatchModal from './QaBatchModal';
import QaModal from './QaModal';
import QaTableList, { QaTableListRef } from './QaTableList';
import RawSegmentInfo from './RawSegmentInfo';

const cx = classNames.bind(styles);
const { confirm } = Modal;

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
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);
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

  // 知识库基础配置接口 - 数据详情查询
  const { run } = useRequest(apiKnowledgeConfigDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: KnowledgeInfo) => {
      setKnowledgeInfo(result);
    },
  });

  // 知识库文档配置 - 数据列表查询
  const { run: runDocList } = useRequest(apiKnowledgeDocumentList, {
    manual: true,
    debounceInterval: 500,
    onSuccess: (result: Page<KnowledgeDocumentInfo>) => {
      const { records, pages, current, total } = result;
      setDocumentList((prev) => {
        return current === 1 ? records || [] : [...prev, ...records];
      });
      // 如果当前页码大于等于总页数，则不再加载更多数据
      setHasMore(current < pages);
      // 更新页码
      setPage(current + 1);
      setTotalDocCount(total);
      setLoadingDoc(false);
      // 首次加载文档列表时，当前文档为空，需要查询分段信息，新增文档时，当前文档信息不为空，就不需要查询分段信息
      if (!currentDocumentInfo) {
        // 取文档列表第一项作为当前文档信息
        const firstDocumentInfo = records[0];
        setCurrentDocumentInfo(firstDocumentInfo);
      }
    },
    onError: () => {
      setLoadingDoc(false);
    },
  });

  // 文档数据列表查询
  const handleDocList = (current: number = 1, docName?: string) => {
    runDocList({
      queryFilter: {
        spaceId,
        kbId: knowledgeId,
        name: docName,
      },
      current,
      pageSize: 20,
    });
  };

  // 删除文档后，更新文档列表以及分段信息
  const handleDocDelete = (delDocId: number) => {
    // 删除文档列表
    const _documentList = [...documentList];
    const index = _documentList.findIndex((info) => info.id === delDocId);
    _documentList.splice(index, 1);
    // 重置文档列表
    setDocumentList(_documentList);
    // 删除文档后， 新的文档列表是否为空
    if (_documentList?.length > 0) {
      // 取文档列表第一项作为当前文档信息
      const firstDocumentInfo = _documentList[0];
      setCurrentDocumentInfo(firstDocumentInfo);
    } else {
      // 文档列表为空时, 文档信息重置为空
      setCurrentDocumentInfo(null);
    }
  };

  // 知识库文档配置 - 数据删除接口
  const { run: runDocDelete } = useRequest(apiKnowledgeDocumentDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: number[]) => {
      message.success('删除文档成功');
      const delDocId = params[0];
      // 删除文档后，更新文档列表以及分段信息
      handleDocDelete(delDocId);
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
    setType(item.value as KnowledgeTextImportEnum);
    switch (item.value) {
      case KnowledgeTextImportEnum.Local_Doc:
        setOpen(true);
        break;
      case KnowledgeTextImportEnum.Online_Doc:
        message.warning('在线文档本版本暂时未做');
        break;
      case KnowledgeTextImportEnum.Custom:
        setOpen(true);
        break;
    }
  };

  // 添加内容-取消操作
  const handleCancel = () => {
    setOpen(false);
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
    console.log('value', value);
    handleDocList(1, value);
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
          item.docStatus = status.docStatus;
          item.docStatusCode = status.docStatusCode;
          item.docStatusDesc = status.docStatusDesc;
          item.docStatusReason = status.docStatusReason;
        }
        return item;
      });
      setDocumentList(list);
    },
    [currentDocumentInfo, documentList],
  );

  // 删除文档
  const handleDocDel = () => {
    const docId = currentDocumentInfo?.id;
    confirm({
      title: '您确定要删除此文档吗?',
      icon: <ExclamationCircleFilled />,
      content: currentDocumentInfo?.name,
      okText: '确定',
      maskClosable: true,
      cancelText: '取消',
      onOk() {
        runDocDelete(docId);
      },
    });
  };

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
  const [docType, setDocType] = useState<number>(1);
  const qaTableListRef = useRef<QaTableListRef>(null);
  const [qaInfo, setQaInfo] = useState<KnowledgeQAInfo | null>(null);
  // 根据docType 判断是否显示QA问答
  const showDocContent = docType === 1;
  const [qaOpen, setQaOpen] = useState<boolean>(false);
  const [question, setQuestion] = useState<string>('');

  // 知识库问答 - 数据列表查询
  const handleQaList = () => {
    qaTableListRef.current?.refresh();
  };
  // 切换类型
  const handleChangeDocType = (value: number) => {
    setDocType(value);
    // 切换类型后，查询文档列表
    if (value === 1) {
      setLoadingDoc(true);
      handleDocList();
    } else {
      // 切换类型后，查询QA问答列表
      handleQaList();
    }
  };

  // 点击QA问答下拉
  const handleClickQaPopoverItem = (item: CustomPopoverItem) => {
    switch (item.value) {
      case KnowledgeTextImportEnum.Custom:
        setType(item.value as KnowledgeTextImportEnum);
        setQaInfo(null);
        setQaOpen(true);
        break;
      case KnowledgeTextImportEnum.Local_Doc:
        //QA批量弹窗添加文件上传
        setQaBatchOpen(true);
        break;
      default:
        break;
    }
  };
  // 文档内容
  const renderDocContent = () => {
    return (
      <div
        className={cx(
          'flex',
          'flex-1',
          'radius-6',
          'overflow-hide',
          styles['inner-container'],
        )}
      >
        {/*文档列表*/}
        <DocWrap
          currentDocId={currentDocumentInfo?.id}
          loading={loadingDoc}
          documentList={documentList}
          onClick={setCurrentDocumentInfo}
          onChange={handleQueryDoc}
          onSetAnalyzed={handleSetAnalyzed}
          hasMore={hasMore}
          onScroll={() => handleDocList(page)}
        />
        {/*文件信息*/}
        <RawSegmentInfo
          documentInfo={currentDocumentInfo}
          onDel={handleDocDel}
          onSuccessUpdateName={handleSuccessUpdateName}
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
        message.success('删除QA问答成功');
        handleQaList();
      } else {
        message.error('删除QA问答失败');
      }
    } catch {
      message.error('删除QA问答失败');
    }
    return null;
  };

  const renderQaContent = () => {
    // 添加问题搜索功能 点击按钮搜索
    const handleSearchQa = (value: string) => {
      setQuestion(value);
    };
    return (
      <div className="flex flex-col h-full">
        {/* QA问答 */}
        <div className={cx('flex', 'flex-1', 'flex-col')}>
          {/* 添加问题搜索功能 */}
          <div
            style={{
              height: '50px',
            }}
          >
            <div className={cx(styles.inputSearch)}>
              <Input.Search
                placeholder="请输入问题搜索"
                allowClear
                style={{
                  width: 240,
                }}
                onSearch={handleSearchQa}
                onPressEnter={(e) => handleSearchQa(e.currentTarget.value)}
              />
            </div>
          </div>
          <div
            className={cx('flex', 'flex-1', 'items-center', 'justify-center')}
          >
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
        </div>
      </div>
    );
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
        spaceId: spaceId,
      });
    }
    try {
      const res = await doAction;
      if (res.code === '0000') {
        message.success(values.id ? 'QA问答更新成功' : '添加QA问答成功');
        // 添加成功后，查询文档列表
        handleQaList();
        setQaOpen(false);
      } else {
        message.error(values.id ? 'QA问答更新失败' : '添加QA问答失败');
      }
    } catch (error) {
      console.error(error);
      message.error(values.id ? 'QA问答更新失败' : '添加QA问答失败');
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
      />
      {/* 根据docType 判断是否显示QA问答 */}
      {showDocContent ? renderDocContent() : renderQaContent()}

      {/*本地文档弹窗*/}
      <LocalDocModal
        id={knowledgeId}
        type={type}
        open={open}
        onCancel={handleCancel}
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
    </div>
  );
};

export default SpaceKnowledge;
