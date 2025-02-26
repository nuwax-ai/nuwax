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
  const [type, setType] = useState<KnowledgeTextImportEnum>();
  // 知识库详情信息
  const [knowledgeInfo, setKnowledgeInfo] = useState<KnowledgeInfo>(null);
  // 打开创建知识库弹窗
  const [openKnowledge, setOpenKnowledge] = useState<boolean>(false);
  // 文档列表
  const [documentList, setDocumentList] = useState<KnowledgeDocumentInfo[]>([]);
  // 当前文档
  const [currentDocumentInfo, setCurrentDocumentInfo] =
    useState<KnowledgeDocumentInfo>(null);
  // 所有的文档列表, 用于搜索
  const documentListRef = useRef<KnowledgeDocumentInfo[]>([]);
  // 知识库文档分段信息
  const [rawSegmentInfoList, setRawSegmentInfoList] = useState<
    KnowledgeRawSegmentInfo[]
  >([]);

  const handleEdit = () => {
    setOpenKnowledge(true);
  };

  // 知识库基础配置接口 - 数据详情查询
  const { run } = useRequest(apiKnowledgeConfigDetail, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: KnowledgeInfo) => {
      setKnowledgeInfo(result);
    },
  });

  // 知识库分段配置 - 数据列表查询
  const { run: runRawSegmentList } = useRequest(apiKnowledgeRawSegmentList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: Page<KnowledgeRawSegmentInfo>) => {
      console.log(result);
      setRawSegmentInfoList(result.records);
    },
  });

  // 知识库文档配置 - 数据列表查询
  const { run: runDocList } = useRequest(apiKnowledgeDocumentList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: Page<KnowledgeDocumentInfo>) => {
      console.log(result);
      if (result.records?.length > 0) {
        setDocumentList(result.records);
        documentListRef.current = result.records;
        setCurrentDocumentInfo(result.records[0]);
        const id = result.records[0].id;
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
    },
  });

  // 知识库文档配置 - 数据删除接口
  const { run: runDocDelete } = useRequest(apiKnowledgeDocumentDelete, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('删除文档成功');
    },
  });

  useEffect(() => {
    run(knowledgeId);
    runDocList({
      queryFilter: {
        spaceId,
        name: '',
      },
      current: 1,
      pageSize: 10,
    });
  }, [knowledgeId]);

  const handleClickPopoverItem = (item: CustomPopoverItem) => {
    console.log('点击popover', item);
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

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <KnowledgeHeader
        knowledgeInfo={knowledgeInfo}
        onEdit={handleEdit}
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
          documentList={documentList}
          onClick={handleClickDoc}
          onChange={handleQueryDoc}
        />
        {/*文件信息*/}
        <RawSegmentInfo
          documentInfo={currentDocumentInfo}
          onDel={handleDocDel}
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
      {/*创建知识库弹窗*/}
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
