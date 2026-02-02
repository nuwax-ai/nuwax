import ConditionRender from '@/components/ConditionRender';
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiKnowledgeRawSegmentList,
  apiKnowledgeRawSegmentUpdate,
} from '@/services/knowledge';
import { DocStatusCodeEnum } from '@/types/enums/library';
import type {
  KnowledgeRawSegmentInfo,
  KnowledgeRawSegmentUpdateParams,
  RawSegmentInfoProps,
} from '@/types/interfaces/knowledge';
import type { Page } from '@/types/interfaces/request';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { Empty, Tooltip, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import DocRename from './DocRename';
import styles from './index.less';
import RawSegmentEditModal from './RawSegmentEditModal/index';

const cx = classNames.bind(styles);

/**
 * 文件 - 分段配置信息
 */
const RawSegmentInfo: React.FC<RawSegmentInfoProps> = ({
  onDel,
  onSuccessUpdateName,
  documentInfo,
}) => {
  // 知识库文档分段信息
  const [rawSegmentInfoList, setRawSegmentInfoList] = useState<
    KnowledgeRawSegmentInfo[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  // 当前页码
  const [page, setPage] = useState<number>(1);
  // 是否有更多数据
  const [hasMore, setHasMore] = useState<boolean>(true);

  // 知识库分段配置 - 数据列表查询
  const { run: runRawSegmentList } = useRequest(apiKnowledgeRawSegmentList, {
    manual: true,
    debounceInterval: 300,
    // 设置显示 loading 的延迟时间，避免闪烁
    loadingDelay: 300,
    onSuccess: (result: Page<KnowledgeRawSegmentInfo>) => {
      const { records, pages, current } = result;
      const data = records || [];
      setRawSegmentInfoList((prev) => {
        return current === 1 ? data : [...prev, ...data];
      });
      // 如果当前页码大于等于总页数，则不再加载更多数据
      setHasMore(current < pages);
      // 更新页码
      setPage(current + 1);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 知识库分段配置 - 数据列表查询
  const handleRawSegmentList = (current: number = 1) => {
    runRawSegmentList({
      queryFilter: {
        docId: documentInfo?.id,
      },
      current,
      pageSize: 20,
    });
  };

  useEffect(() => {
    if (!!documentInfo) {
      const { docStatusCode } = documentInfo;
      // 分析成功
      if (
        [
          DocStatusCodeEnum.ANALYZED,
          DocStatusCodeEnum.ANALYZED_QA,
          DocStatusCodeEnum.ANALYZED_EMBEDDING,
        ].includes(docStatusCode)
      ) {
        setLoading(true);
        // 知识库分段配置 - 数据列表查询
        handleRawSegmentList();
      }
      // 分析中状态为：1时,此状态可能是由于一些脏数据引起的，此时分段信息显示为空
      if (docStatusCode === DocStatusCodeEnum.ANALYZING) {
        // 文档分段数组清空
        setRawSegmentInfoList([]);
      }
    } else {
      // 文档分段数组清空
      setRawSegmentInfoList([]);
    }
  }, [documentInfo]);

  const onScroll = () => {
    // 知识库分段配置 - 数据列表查询
    handleRawSegmentList(page);
  };

  const handlePreview = () => {
    if (!documentInfo?.docUrl) {
      return;
    }
    const docUrl = encodeURIComponent(documentInfo.docUrl);

    // 构建预览地址
    const previewPageUrl = `/static/file-preview.html?docUrl=${docUrl}`;
    //在新窗口打开
    window.open(previewPageUrl, '_blank');
  };

  // 编辑弹窗
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] =
    useState<KnowledgeRawSegmentInfo | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleEdit = (item: KnowledgeRawSegmentInfo) => {
    setCurrentEditItem(item);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setCurrentEditItem(null);
  };

  const handleSave = async (values: { rawTxt: string }) => {
    try {
      setConfirmLoading(true);
      const params: KnowledgeRawSegmentUpdateParams = {
        spaceId: currentEditItem?.spaceId as number,
        rawSegmentId: currentEditItem?.id as number,
        docId: currentEditItem?.docId as number,
        rawTxt: values.rawTxt,
        sortIndex: currentEditItem?.sortIndex as number,
      };

      const { code } = await apiKnowledgeRawSegmentUpdate(params);
      if (code === SUCCESS_CODE) {
        // 更新本地数据
        setRawSegmentInfoList((prev) =>
          prev.map((item) =>
            item.id === currentEditItem?.id
              ? { ...item, rawTxt: values.rawTxt }
              : item,
          ),
        );
        message.success('修改成功');
        setIsModalOpen(false);
        setCurrentEditItem(null);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div
      className={cx('flex-1', 'h-full', 'flex', 'flex-col', 'overflow-hide')}
    >
      <header className={cx(styles.header, 'flex', 'items-center')}>
        <ConditionRender condition={!!documentInfo}>
          <FileSearchOutlined />
          <span className={cx('text-ellipsis', styles['file-name'])}>
            {documentInfo?.name}
          </span>
          <DocRename
            docId={documentInfo?.id}
            docName={documentInfo?.name}
            onSuccessUpdateName={onSuccessUpdateName}
          />

          {documentInfo?.docUrl && (
            <Tooltip title="预览原始文档">
              <EyeOutlined
                className={cx(styles.del, 'cursor-pointer', 'mr-8')}
                style={{ fontSize: '16px' }}
                onClick={handlePreview}
              />
            </Tooltip>
          )}

          <div className={cx(styles['extra-box'], 'flex', 'items-center')}>
            {/*<span className={cx(styles['switch-name'])}>预览原始文档</span>*/}
            {/*<Switch defaultChecked onChange={handleChange} />*/}
            <DeleteOutlined
              className={cx(styles.del, 'cursor-pointer')}
              onClick={onDel}
            />
          </div>
        </ConditionRender>
      </header>
      {documentInfo?.docStatusCode === DocStatusCodeEnum.ANALYZING_RAW ? (
        <div
          className={cx(
            'flex',
            'flex-1',
            'items-center',
            'content-center',
            styles['segment-box'],
          )}
        >
          <span>分段正在处理中</span>
        </div>
      ) : loading ? (
        <Loading />
      ) : rawSegmentInfoList?.length > 0 ? (
        <div
          className={cx('px-16', 'py-16', 'flex-1', 'scroll-container')}
          id="rawSegmentDiv"
        >
          <InfiniteScrollDiv
            scrollableTarget="rawSegmentDiv"
            list={rawSegmentInfoList || []}
            hasMore={hasMore}
            onScroll={onScroll}
          >
            {rawSegmentInfoList?.map((info) => (
              <div
                key={info.id}
                className={cx(
                  styles.line,
                  'radius-6',
                  'relative',
                  'group',
                  'hover:bg-gray-50',
                )}
                style={{ position: 'relative' }} // ensure relative for absolute positioning of edit icon
                onMouseEnter={(e) => {
                  const target = e.currentTarget.querySelector('.edit-icon');
                  if (target) {
                    (target as HTMLElement).style.display = 'block';
                  }
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget.querySelector('.edit-icon');
                  if (target) {
                    (target as HTMLElement).style.display = 'none';
                  }
                }}
              >
                {info.rawTxt}
                <div
                  className="edit-icon"
                  style={{
                    display: 'none',
                    position: 'absolute',
                    right: '10px',
                    top: '7px',
                    cursor: 'pointer',
                    background: '#fff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                  onClick={() => handleEdit(info)}
                >
                  <Tooltip title="编辑">
                    <EditOutlined />
                  </Tooltip>
                </div>
              </div>
            ))}
          </InfiniteScrollDiv>
        </div>
      ) : (
        <div className={cx('flex', 'flex-1', 'items-center', 'content-center')}>
          <Empty description="暂无分段" />
        </div>
      )}

      <RawSegmentEditModal
        open={isModalOpen}
        onCancel={handleCancel}
        onOk={handleSave}
        loading={confirmLoading}
        initialValues={
          currentEditItem ? { rawTxt: currentEditItem.rawTxt } : undefined
        }
      />
    </div>
  );
};

export default RawSegmentInfo;
