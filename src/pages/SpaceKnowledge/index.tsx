import CreateKnowledge from '@/components/CreateKnowledge';
import {
  apiKnowledgeConfigDetail,
  apiKnowledgeDocumentDelete,
  apiKnowledgeDocumentList,
  apiKnowledgeRawSegmentList,
} from '@/services/knowledge';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { KnowledgeTextImportEnum } from '@/types/enums/library';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import type {
  KnowledgeBaseInfo,
  KnowledgeDocumentInfo,
  KnowledgeInfo,
  KnowledgeRawSegmentInfo,
} from '@/types/interfaces/knowledge';
import type { Page } from '@/types/interfaces/request';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useMatch, useRequest } from 'umi';
import DocWrap from './DocWrap';
import KnowledgeHeader from './KnowledgeHeader';
import LocalDocModal from './LocalCustomDocModal';
import RawSegmentInfo from './RawSegmentInfo';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 工作空间-知识库
 */
const SpaceKnowledge: React.FC = () => {
  const match = useMatch('/space/:spaceId/knowledge/:knowledgeId');
  const { spaceId, knowledgeId } = match.params;
  const [open, setOpen] = useState<boolean>(false);
  // 知识库资源-文本格式导入类型枚举： 本地文档、在线文档、自定义
  const [type, setType] = useState<KnowledgeTextImportEnum>();
  // 知识库详情信息
  const [knowledgeInfo, setKnowledgeInfo] = useState<KnowledgeInfo>(null);
  // 打开创建知识库弹窗
  const [openKnowledge, setOpenKnowledge] = useState<boolean>(false);
  // 文档列表
  const [documentList, setDocumentList] = useState<KnowledgeDocumentInfo[]>([]);
  // 当前文档信息
  const [currentDocumentInfo, setCurrentDocumentInfo] =
    useState<KnowledgeDocumentInfo>(null);
  // 所有的文档列表, 用于搜索
  const documentListRef = useRef<KnowledgeDocumentInfo[]>([]);
  // 知识库文档分段信息
  const [rawSegmentInfoList, setRawSegmentInfoList] = useState<
    KnowledgeRawSegmentInfo[]
  >([]);

  // 知识库基础配置接口 - 数据详情查询
  const { run } = useRequest(apiKnowledgeConfigDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: KnowledgeInfo) => {
      setKnowledgeInfo(result);
    },
  });

  // 知识库分段配置 - 数据列表查询
  const { run: runRawSegmentList } = useRequest(apiKnowledgeRawSegmentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<KnowledgeRawSegmentInfo>) => {
      setRawSegmentInfoList(result.records);
    },
  });

  // 知识库文档配置 - 数据列表查询
  const { run: runDocList } = useRequest(apiKnowledgeDocumentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<KnowledgeDocumentInfo>) => {
      if (result?.records?.length > 0) {
        const { records } = result;
        setDocumentList(records);
        documentListRef.current = records;
        // 首次加载文档列表时，当前文档为空，需要查询分段信息，新增文档时，当前文档信息不为空，就不需要查询分段信息
        if (!currentDocumentInfo) {
          // 取文档列表第一项作为当前文档信息
          const firstDocumentInfo = records[0];
          const id = firstDocumentInfo.id;
          setCurrentDocumentInfo(firstDocumentInfo);
          // 知识库分段配置 - 数据列表查询
          runRawSegmentList({
            queryFilter: {
              spaceId,
              docId: id,
            },
            current: 1,
            pageSize: 100,
          });
        }
      }
    },
  });

  // 删除文档后，更新文档列表以及分段信息
  const handleDocDelete = (delDocId: number) => {
    // 删除文档列表
    const _documentList = [...documentList];
    const index = _documentList.findIndex((info) => info.id === delDocId);
    _documentList.splice(index, 1);
    // 重置文档列表
    setDocumentList(_documentList);
    documentListRef.current = _documentList;
    // 删除文档后， 新的文档列表是否为空
    if (_documentList?.length > 0) {
      // 默认第一项文档为当前文档
      setCurrentDocumentInfo(_documentList[0]);
      // 文档ID
      const id = _documentList[0].id;
      // 知识库分段配置 - 数据列表查询
      runRawSegmentList({
        queryFilter: {
          spaceId,
          docId: id,
        },
        current: 1,
        pageSize: 100,
      });
    } else {
      // 文档列表为空时, 文档信息重置为空
      setCurrentDocumentInfo(null);
      // 文档分段数组清空
      setRawSegmentInfoList([]);
    }
  };

  // 知识库文档配置 - 数据删除接口
  const { run: runDocDelete } = useRequest(apiKnowledgeDocumentDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_, params) => {
      message.success('删除文档成功');
      const delDocId = params[0];
      // 删除文档后，更新文档列表以及分段信息
      handleDocDelete(delDocId);
    },
  });

  useEffect(() => {
    // 查询知识库数据详情查询
    run(knowledgeId);
    // 文档数据列表查询
    runDocList({
      queryFilter: {
        spaceId,
        kbId: knowledgeId,
        name: '',
      },
      current: 1,
      pageSize: 100,
    });
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
    runDocList({
      queryFilter: {
        spaceId,
        kbId: knowledgeId,
        name: '',
      },
      current: 1,
      pageSize: 100,
    });
  };

  // 知识库新增确认事件
  const handleConfirmKnowledge = (info: KnowledgeBaseInfo) => {
    setOpenKnowledge(false);
    const _knowledgeInfo = { ...knowledgeInfo, ...info };
    setKnowledgeInfo(_knowledgeInfo);
  };

  // 点击文档
  const handleClickDoc = (info: KnowledgeDocumentInfo) => {
    const { id } = info;
    // 当前文档信息
    setCurrentDocumentInfo(info);
    runRawSegmentList({
      queryFilter: {
        spaceId,
        docId: id,
      },
      current: 1,
      pageSize: 100,
    });
  };

  // 搜索
  const handleQueryDoc = (value: string) => {
    const list = documentListRef.current.filter((item) =>
      item.name.includes(value),
    );
    setDocumentList(list);
  };

  // 删除文档
  const handleDocDel = () => {
    const docId = currentDocumentInfo?.id;
    runDocDelete(docId);
  };

  // 修改文档名称成功后更新state
  const handleSuccessUpdateName = (id: number, name: string) => {
    // 修改当前文档名称
    const _documentInfo = { ...currentDocumentInfo };
    _documentInfo.name = name;
    setCurrentDocumentInfo(_documentInfo);
    // 修改文档列表中当前文档名称
    const _documentList = [...documentList].map((info) => {
      if (info.id === id) {
        return {
          ...info,
          name,
        };
      }
      return info;
    });
    setDocumentList(_documentList);
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <KnowledgeHeader
        knowledgeInfo={knowledgeInfo}
        onEdit={() => setOpenKnowledge(true)}
        onPopover={handleClickPopoverItem}
      />
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
          documentList={documentList}
          onClick={handleClickDoc}
          onChange={handleQueryDoc}
        />
        {/*文件信息*/}
        <RawSegmentInfo
          documentInfo={currentDocumentInfo}
          onDel={handleDocDel}
          onSuccessUpdateName={handleSuccessUpdateName}
          rawSegmentInfoList={rawSegmentInfoList}
        />
      </div>
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
    </div>
  );
};

export default SpaceKnowledge;
