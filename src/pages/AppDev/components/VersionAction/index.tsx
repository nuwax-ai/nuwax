import Constant from '@/constants/codes.constants';
import { apiRestoreAgentVersion } from '@/services/agentConfig';
import { HistoryData } from '@/types/interfaces/publish';
import { Button, message } from 'antd';
import classNames from 'classnames';
import { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface VersionActionProps {
  data: HistoryData;
  onRefresh: () => void;
  onClose: () => void;
}

/**
 * AppDev 版本历史操作组件
 * 提供版本还原功能
 */
const VersionAction: React.FC<VersionActionProps> = ({
  data,
  onRefresh,
  onClose,
}) => {
  const [currentVersionId, setCurrentVersionId] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  /**
   * 还原版本
   * @param item 历史版本数据
   */
  const handleRestoreVersion = async (item: HistoryData) => {
    try {
      setHistoryLoading(true);
      const res = await apiRestoreAgentVersion(item.id);
      if (res.code === Constant.success) {
        message.success('版本还原成功');
        setHistoryLoading(false);
        onRefresh();
        onClose();
      } else {
        message.error(res.message || '版本还原失败');
        setHistoryLoading(false);
      }
    } catch (error) {
      console.error('版本还原失败:', error);
      message.error('版本还原失败，请稍后重试');
      setHistoryLoading(false);
    }
  };

  return (
    <div
      key={data.id}
      className={cx('version-action')}
      onMouseEnter={() => {
        setCurrentVersionId(data.id);
      }}
      onMouseLeave={() => {
        setCurrentVersionId(null);
      }}
    >
      <div
        className={cx('hover-overlay', {
          visible: data.id === currentVersionId,
        })}
      >
        <Button
          type="primary"
          size="small"
          loading={historyLoading}
          onClick={() => handleRestoreVersion(data)}
          className={cx('action-button')}
        >
          还原此版本
        </Button>
      </div>
    </div>
  );
};

export default VersionAction;
