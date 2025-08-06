import ConditionRender from '@/components/ConditionRender';
import InfiniteScrollDiv from '@/components/custom/InfiniteScrollDiv';
import Loading from '@/components/custom/Loading';
import { apiKnowledgeRawSegmentList } from '@/services/knowledge';
import { DocStatusCodeEnum } from '@/types/enums/library';
import type {
  KnowledgeRawSegmentInfo,
  RawSegmentInfoProps,
} from '@/types/interfaces/knowledge';
import type { Page } from '@/types/interfaces/request';
import { DeleteOutlined, FileSearchOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import DocRename from './DocRename';
import styles from './index.less';

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
          className={cx('px-16', 'py-16', 'flex-1', 'overflow-y')}
          id="rawSegmentDiv"
        >
          <InfiniteScrollDiv
            scrollableTarget="rawSegmentDiv"
            list={rawSegmentInfoList || []}
            hasMore={hasMore}
            onScroll={onScroll}
          >
            {rawSegmentInfoList?.map((info) => (
              <p key={info.id} className={cx(styles.line, 'radius-6')}>
                {info.rawTxt}
              </p>
            ))}
          </InfiniteScrollDiv>
        </div>
      ) : (
        <div className={cx('flex', 'flex-1', 'items-center', 'content-center')}>
          <Empty description="暂无分段" />
        </div>
      )}
    </div>
  );
};

export default RawSegmentInfo;
