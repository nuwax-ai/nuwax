import Constant from '@/constants/codes.constants';
import service from '@/services/workflow';
import { HistoryData } from '@/types/interfaces/publish';
import { Button, message } from 'antd';
import { useState } from 'react';

interface VersionActionProps {
  data: HistoryData;
  onRefresh: () => void;
  onClose: () => void;
}
const VersionAction: React.FC<VersionActionProps> = ({
  data,
  onRefresh,
  onClose,
}) => {
  const [currentVersionId, setCurrentVersionId] = useState<number | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const handleRestoreVersion = async (item: HistoryData) => {
    try {
      setHistoryLoading(true);
      const res = await service.apiRestoreWorkflowVersion(item.id);
      if (res.code === Constant.success) {
        message.success('还原成功');
        setHistoryLoading(false);
        onRefresh();
        onClose();
      }
    } catch (error) {
      setHistoryLoading(false);
    }
  };
  return (
    <div
      key={data.id}
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        right: 0,
        top: 0,
        zIndex: 1000,
      }}
      onMouseEnter={() => {
        setCurrentVersionId(data.id);
      }}
      onMouseLeave={() => {
        setCurrentVersionId(null);
      }}
    >
      {data.id === currentVersionId && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Button
            variant="outlined"
            loading={historyLoading}
            onClick={() => handleRestoreVersion(data)}
          >
            还原
          </Button>
        </div>
      )}
    </div>
  );
};

export default VersionAction;
