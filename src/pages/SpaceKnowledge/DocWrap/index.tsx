import {
  apiDocAutoRetryTaskByDocId,
  apiKnowledgeDocumentDetail,
} from '@/services/knowledge';
import { KnowledgeDocStatusEnum } from '@/types/enums/library';
import type {
  DocWrapProps,
  KnowledgeDocumentInfo,
} from '@/types/interfaces/knowledge';
import { FileSearchOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, message, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 文档列表（带搜索文档）
 */
const DocWrap: React.FC<DocWrapProps> = ({
  currentDocId,
  onChange,
  documentList,
  onClick,
  onSetAnalyzed,
}) => {
  // 知识库分段配置 - 数据列表查询
  const { run: runAutoRetry } = useRequest(apiDocAutoRetryTaskByDocId, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_, params) => {
      message.success('成功重新构建');
      const id = params[0];
      onSetAnalyzed(id);
    },
  });

  // 知识库文档配置 - 数据详情查询
  const { run: runDetail } = useRequest(apiKnowledgeDocumentDetail, {
    manual: true,
    // 防抖
    debounceInterval: 300,
    // 设置显示 loading 的延迟时间，避免闪烁
    loadingDelay: 300,
    // 进入轮询模式，定时触发函数执行。
    pollingInterval: 1000,
    // 在屏幕不可见时，暂时暂停定时任务。
    pollingWhenHidden: false,
    // 轮询错误重试次数。如果设置为 -1，则无限次
    pollingErrorRetryCount: 3,
    onSuccess: (result: KnowledgeDocumentInfo) => {
      // 分析成功
      if (result.docStatus === KnowledgeDocStatusEnum.ANALYZED) {
        onSetAnalyzed(result.id);
      }
    },
  });

  // const getIsAnalyzing = (documentList: KnowledgeDocumentInfo[]) => {
  //   const index = documentList?.findIndex(item => item.docStatus === KnowledgeDocStatusEnum.ANALYZING);
  //   return index > -1;
  // }

  useEffect(() => {
    documentList?.forEach((item) => {
      if (item.docStatus === KnowledgeDocStatusEnum.ANALYZING) {
        runDetail(item.id);
      }
    });
    // const isAnalyzing = getIsAnalyzing(documentList);
    // if (!isAnalyzing) {
    //   runCancel();
    // }
    //
    // return () => {
    //   runCancel();
    // }
  }, [documentList]);

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <Input
        placeholder="搜索"
        size="large"
        onChange={(e) => onChange(e.target.value)}
        prefix={<SearchOutlined className={cx(styles['search-icon'])} />}
      />
      <p className={cx(styles['document-title'])}>文档列表</p>
      <ul className={cx('flex-1', 'overflow-y')}>
        {documentList?.map((item) => (
          <li
            key={item.id}
            onClick={() => onClick(item)}
            className={cx(
              styles['file-info'],
              'flex',
              'items-center',
              'radius-6',
              'overflow-hide',
              { [styles.active]: currentDocId === item.id },
            )}
          >
            <FileSearchOutlined />
            <Tooltip title={item.name}>
              <span className={cx('flex-1', 'text-ellipsis')}>{item.name}</span>
            </Tooltip>
            {item.docStatus === KnowledgeDocStatusEnum.ANALYZING ? (
              <span className={cx(styles.analyzing)}>构建中</span>
            ) : item.docStatus === KnowledgeDocStatusEnum.ANALYZE_FAILED ? (
              <Button type="primary" onClick={() => runAutoRetry(item.id)}>
                构建失败,重新构建
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocWrap;
