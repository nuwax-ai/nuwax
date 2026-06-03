import { dict } from '@/services/i18nRuntime';
import {
  apiAddResourceToGroup,
  apiRemoveResourceFromGroup,
  apiResourceGroupList,
} from '@/services/library';
import type { ComponentInfo } from '@/types/interfaces/library';
import { message, Modal, Select } from 'antd';
import React, { useEffect, useState } from 'react';

interface MoveToGroupModalProps {
  open: boolean;
  currentComponentInfo: ComponentInfo | null;
  spaceId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const MoveToGroupModal: React.FC<MoveToGroupModalProps> = ({
  open,
  currentComponentInfo,
  spaceId,
  onCancel,
  onSuccess,
}) => {
  const [targetGroupId, setTargetGroupId] = useState<number | undefined>(
    undefined,
  );
  const [groupOptions, setGroupOptions] = useState<any[]>([]);
  const [moveGroupLoading, setMoveGroupLoading] = useState(false);

  useEffect(() => {
    if (open && currentComponentInfo) {
      setTargetGroupId(undefined);
      apiResourceGroupList({
        spaceId,
        types: [currentComponentInfo.type],
      })
        .then((res) => {
          if (res.success && res.data) {
            setGroupOptions(res.data || []);
          }
        })
        .catch(() => {});
    }
  }, [open, currentComponentInfo, spaceId]);

  const handleConfirm = () => {
    if (!targetGroupId || !currentComponentInfo) return;
    setMoveGroupLoading(true);

    const targetType = currentComponentInfo.type;
    const targetId = currentComponentInfo.id;
    const currentGroupId = currentComponentInfo.groupId;

    const moveAction = async () => {
      if (currentGroupId && Number(currentGroupId) !== 0) {
        await apiRemoveResourceFromGroup(currentGroupId, {
          targetType,
          targetId,
        });
      }
      return apiAddResourceToGroup(targetGroupId, {
        targetType,
        targetId,
      });
    };

    moveAction()
      .then((res) => {
        if (res.success) {
          message.success(
            dict('PC.Pages.SpaceResource.LeftGroupList.moveSuccess'),
          );
          onSuccess();
        }
      })
      .catch(() => {})
      .finally(() => {
        setMoveGroupLoading(false);
      });
  };

  return (
    <Modal
      title={dict('PC.Pages.SpaceResource.LeftGroupList.selectGroup')}
      open={open}
      confirmLoading={moveGroupLoading}
      onCancel={onCancel}
      okButtonProps={{ disabled: !targetGroupId }}
      onOk={handleConfirm}
      okText={dict('PC.Common.Global.confirm')}
      cancelText={dict('PC.Common.Global.cancel')}
    >
      <div style={{ padding: '24px 0' }}>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>
          {dict('PC.Pages.SpaceResource.LeftGroupList.selectGroup')}
        </div>
        <Select
          style={{ width: '100%' }}
          placeholder={dict(
            'PC.Pages.SpaceResource.LeftGroupList.selectGroupPlaceholder',
          )}
          value={targetGroupId}
          onChange={(val) => setTargetGroupId(val)}
          options={groupOptions
            .filter(
              (g) =>
                !currentComponentInfo?.groupId ||
                Number(g.id) !== Number(currentComponentInfo.groupId),
            )
            .map((g) => ({
              value: g.id,
              label: g.name,
            }))}
        />
      </div>
    </Modal>
  );
};

export default MoveToGroupModal;
