import {
  apiDocAutoRetryTaskByDocId,
  apiKnowledgeDocumentDetail,
} from '@/services/knowledge';
import { DocStatusCodeEnum, DocStatusEnum } from '@/types/enums/library';
import type {
  DocItemProps,
  KnowledgeDocumentInfo,
} from '@/types/interfaces/knowledge';
import { KnowledgeDocumentStatus } from '@/types/interfaces/knowledge';
import { FileSearchOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 文档列表项
const DocItem: React.FC<DocItemProps> = ({
  currentDocId,
  info,
  onClick,
  onSetAnalyzed,
}) => {
  // 知识库分段配置 - 数据列表查询
  const { run: runAutoRetry } = useRequest(apiDocAutoRetryTaskByDocId, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_, params) => {
      const id = params[0];
      const status: KnowledgeDocumentStatus = {
        docStatus: DocStatusEnum.ANALYZING_RAW,
        docStatusCode: DocStatusCodeEnum.ANALYZING_RAW,
        docStatusDesc: '分析中',
        docStatusReason: '分段生成中',
      };
      onSetAnalyzed(id, status);
    },
  });

  // 知识库文档配置 - 数据详情查询
  const { run: runDetail, cancel: cancelDetail } = useRequest(
    apiKnowledgeDocumentDetail,
    {
      manual: true,
      // 防抖
      debounceInterval: 300,
      // 设置显示 loading 的延迟时间，避免闪烁
      loadingDelay: 300,
      // 进入轮询模式，定时触发函数执行。
      pollingInterval: 5000,
      // 在屏幕不可见时，暂时暂停定时任务。
      pollingWhenHidden: false,
      // 轮询错误重试次数。如果设置为 -1，则无限次
      pollingErrorRetryCount: 3,
      onSuccess: (result: KnowledgeDocumentInfo) => {
        const { docStatusCode, id, docStatus, docStatusDesc, docStatusReason } =
          result;
        // 分析成功或者分析失败时，才更新文档列表状态，因为除了这两种状态外，其他状态都是"构建中"
        if (
          docStatusCode === DocStatusCodeEnum.ANALYZED ||
          docStatusCode === DocStatusCodeEnum.ANALYZE_FAILED
        ) {
          const status = {
            docStatus,
            docStatusCode,
            docStatusDesc,
            docStatusReason,
          };
          onSetAnalyzed(id, status);
        }

        if (docStatusCode === DocStatusCodeEnum.ANALYZED) {
          cancelDetail();
        }
      },
      onError: () => {
        cancelDetail();
      },
    },
  );

  useEffect(() => {
    cancelDetail();
    const { docStatusCode } = info;
    // 知识库文档状态：分析中
    if (
      docStatusCode !== DocStatusCodeEnum.ANALYZED &&
      docStatusCode !== DocStatusCodeEnum.ANALYZE_FAILED
    ) {
      runDetail(info.id);
    }

    return () => {
      cancelDetail();
    };
  }, [info?.docStatusCode]);

  // 重新构建
  const handleAutoRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    runAutoRetry(info.id);
  };

  return (
    <li
      onClick={() => onClick(info)}
      className={cx(
        styles['file-info'],
        'flex',
        'items-center',
        'radius-6',
        'overflow-hide',
        { [styles.active]: currentDocId === info.id },
      )}
    >
      <FileSearchOutlined />
      <Tooltip title={info.name?.length > 25 ? info.name : ''}>
        <span className={cx('flex-1', 'text-ellipsis')}>{info.name}</span>
      </Tooltip>

      {info.docStatusCode === DocStatusCodeEnum.ANALYZED ? (
        <span className={cx(styles.analyzing, styles['analyzing-success'])}>
          构建成功
        </span>
      ) : info.docStatusCode === DocStatusCodeEnum.ANALYZE_FAILED ? (
        <Button
          type="primary"
          className={cx(styles['retry-btn'])}
          size="small"
          danger
          onClick={handleAutoRetry}
        >
          构建失败,重新构建
        </Button>
      ) : (
        <span className={cx(styles.analyzing)}>构建中</span>
      )}
    </li>
  );
};

export default DocItem;
