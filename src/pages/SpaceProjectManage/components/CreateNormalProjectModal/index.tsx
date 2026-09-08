import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiProjectCreate } from '@/services/appDev';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { Button, Input, message, Modal } from 'antd';
import React, { useEffect, useState } from 'react';

interface CreateNormalProjectModalProps {
  /** 空间 ID */
  spaceId: number;
  open: boolean;
  onCancel: () => void;
  /** 创建成功回调（参数为项目 id） */
  onConfirm: (targetId: number) => void;
}

/**
 * 新建常规项目弹窗：仅需名称，走统一创建接口（targetType=NormalProject）。
 * 与全栈应用表单弹窗（CreateUserApp）区分：常规项目无介绍/图标表单。
 */
const CreateNormalProjectModal: React.FC<CreateNormalProjectModalProps> = ({
  spaceId,
  open,
  onCancel,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
    }
  }, [open]);

  const handleConfirm = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      message.warning(dict('PC.Pages.SpaceProjectManage.nameRequired'));
      return;
    }
    setConfirmLoading(true);
    try {
      const res = await apiProjectCreate({
        spaceId,
        targetType: AgentComponentTypeEnum.NormalProject,
        name: trimmed,
      });
      if (res?.code === SUCCESS_CODE && res.data?.targetId) {
        message.success(dict('PC.Pages.SpaceProjectManage.createSuccess'));
        onConfirm(res.data.targetId as number);
      } else {
        message.error(
          res?.message || dict('PC.Pages.SpaceProjectManage.createFailed'),
        );
      }
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={dict('PC.Pages.SpaceProjectManage.createNormalProject')}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {dict('PC.Common.Global.cancel')}
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={confirmLoading}
          onClick={handleConfirm}
        >
          {dict('PC.Common.Global.confirm')}
        </Button>,
      ]}
      destroyOnClose
    >
      <Input
        value={name}
        maxLength={30}
        placeholder={dict('PC.Pages.SpaceProjectManage.namePlaceholder')}
        onChange={(e) => setName(e.target.value)}
        onPressEnter={handleConfirm}
      />
    </Modal>
  );
};

export default CreateNormalProjectModal;
