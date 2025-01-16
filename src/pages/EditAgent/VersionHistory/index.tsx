import FoldWrap from '@/components/FoldWrap';
import type { VersionHistoryProps } from '@/types/interfaces/space';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 版本历史组件
 */
const VersionHistory: React.FC<VersionHistoryProps> = ({
  visible,
  onClose,
}) => {
  // const [data, setData] = useState<any[]>([]);
  //
  // const { run, loading } = useRequest(apiHome, {
  //   manual: true,
  //   debounceWait: 300,
  //   onSuccess: (res: RequestResponse<T>) => {
  //     const { data } = res;
  //     if (data) {
  //     }
  //   },
  // });
  //
  // useEffect(() => {
  //   run();
  // }, []);

  return (
    <FoldWrap lineMargin title={'版本历史'} visible={visible} onClose={onClose}>
      <div className={cx(styles['main-wrap'])}>
        <div className={cx(styles.box)}>
          <div className={cx('flex', 'items-center', styles.header)}>
            <span className={cx(styles['author-update-time'])}>作者</span>
            <span className={cx(styles['author-update-time'])}>
              2024-11-21 15:30
            </span>
            <span className={styles['new-version']}>已发布版本</span>
            <Button type="link" className={cx(styles['recover-btn'])}>
              恢复
            </Button>
          </div>
          <p>更新提示词</p>
        </div>
        <div className={cx(styles.box)}>
          <div className={cx('flex', 'items-center', styles.header)}>
            <span className={cx(styles['author-update-time'])}>作者</span>
            <span className={cx(styles['author-update-time'])}>
              2024-11-21 15:30
            </span>
            <span className={styles['new-version']}>已发布版本</span>
            <Button type="link" className={cx(styles['recover-btn'])}>
              恢复
            </Button>
          </div>
          <p>添加工具“bing搜索引擎”</p>
        </div>
        <div className={cx(styles.box)}>
          <div className={cx('flex', 'items-center', styles.header)}>
            <span className={cx(styles['author-update-time'])}>作者</span>
            <span className={cx(styles['author-update-time'])}>
              2024-11-21 15:30
            </span>
            <span className={styles['new-version']}>已发布版本</span>
            <Button type="link" className={cx(styles['recover-btn'])}>
              恢复
            </Button>
          </div>
          <p>更新提示词</p>
        </div>
        <div className={cx(styles.box)}>
          <div className={cx('flex', 'items-center', styles.header)}>
            <span className={cx(styles['author-update-time'])}>作者</span>
            <span className={cx(styles['author-update-time'])}>
              2024-11-21 15:30
            </span>
            <span className={styles['new-version']}>已发布版本</span>
            <Button type="link" className={cx(styles['recover-btn'])}>
              恢复
            </Button>
          </div>
          <p>更新提示词</p>
        </div>
        <div className={cx(styles.box)}>
          <div className={cx('flex', 'items-center', styles.header)}>
            <span className={cx(styles['author-update-time'])}>作者</span>
            <span className={cx(styles['author-update-time'])}>
              2024-11-21 15:30
            </span>
            <span className={styles['new-version']}>已发布版本</span>
            <Button type="link" className={cx(styles['recover-btn'])}>
              恢复
            </Button>
          </div>
          <p>更新提示词</p>
        </div>
        <div className={cx(styles.box)}>
          <div className={cx('flex', 'items-center', styles.header)}>
            <span className={cx(styles['author-update-time'])}>作者</span>
            <span className={cx(styles['author-update-time'])}>
              2024-11-21 15:30
            </span>
            <span className={styles['new-version']}>已发布版本</span>
            <Button type="link" className={cx(styles['recover-btn'])}>
              恢复
            </Button>
          </div>
          <p>更新提示词</p>
        </div>
        <div className={cx(styles.box)}>
          <div className={cx('flex', 'items-center', styles.header)}>
            <span className={cx(styles['author-update-time'])}>作者</span>
            <span className={cx(styles['author-update-time'])}>
              2024-11-21 15:30
            </span>
            <span className={styles['new-version']}>已发布版本</span>
            <Button type="link" className={cx(styles['recover-btn'])}>
              恢复
            </Button>
          </div>
          <p>更新提示词</p>
        </div>
      </div>
    </FoldWrap>
  );
};

export default VersionHistory;
