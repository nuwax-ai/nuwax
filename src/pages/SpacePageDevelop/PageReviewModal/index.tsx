import Loading from '@/components/custom/Loading';
import { apiPageGetProjectInfo } from '@/services/pageDev';
import {
  CustomPageDto,
  PageReviewModalProps,
} from '@/types/interfaces/pageDev';
import { Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 页面预览弹窗
 */
const PageReviewModal: React.FC<PageReviewModalProps> = ({
  open,
  projectId,
  onCancel,
}) => {
  // 页面信息
  const [pageInfo, setPageInfo] = useState<CustomPageDto | null>(null);
  // 加载状态
  const [loading, setLoading] = useState(false);

  // 查询页面信息
  const { run: runPageInfo } = useRequest(apiPageGetProjectInfo, {
    manual: true,
    onSuccess: (result: CustomPageDto) => {
      setPageInfo(result);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    if (projectId) {
      setLoading(true);
      runPageInfo(projectId);
    }
  }, [projectId]);

  return (
    <Modal
      centered
      open={open}
      title="页面预览"
      onCancel={onCancel}
      destroyOnHidden
      footer={null}
      width={1000}
      classNames={{
        body: styles['modal-body'],
      }}
    >
      <div className={cx('h-full', 'flex')}>
        {loading ? (
          <div
            className={cx('flex-1', 'flex', 'items-center', 'content-center')}
          >
            <Loading />
          </div>
        ) : (
          <iframe
            src={`${process.env.BASE_URL}${pageInfo?.pageUrl}`}
            className={cx(styles.iframe)}
          />
        )}
      </div>
    </Modal>
  );
};

export default PageReviewModal;
