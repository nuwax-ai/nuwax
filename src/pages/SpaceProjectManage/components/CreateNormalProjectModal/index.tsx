import WorkspaceDirPickerModal from '@/components/ChatInputHome/WorkspaceDirPickerModal';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { CLOUD_SANDBOX_ID } from '@/constants/workspaceDirPolicy.constants';
import { apiNormalProjectCreate } from '@/services/appDev';
import { dict } from '@/services/i18nRuntime';
import { apiGetUserSelectableSandboxList } from '@/services/systemManage';
import {
  DownOutlined,
  FolderOpenOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Input, message, Modal, Select, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 创建成功回调载荷：id 必返；其余为契约先行字段（缺省由调用方降级） */
export interface CreatedNormalProject {
  id: number;
  name: string;
  /** 个人电脑沙箱（仅自选个人电脑时有值） */
  sandboxId?: number;
  /** 创建即建的首个会话 id */
  conversationId?: number;
  /** 首个会话归属智能体 id */
  agentId?: number;
}

interface CreateNormalProjectModalProps {
  /** 空间 ID */
  spaceId: number;
  open: boolean;
  onCancel: () => void;
  /** 创建成功回调（载荷含创建返回的会话/智能体 id，缺省触发调用方降级） */
  onConfirm: (project: CreatedNormalProject) => void;
}

/**
 * 新建常规项目弹窗：名称 + 运行环境（云电脑/个人电脑）+ 工作目录。
 * 走常规项目专用接口 /api/normal-project/create（2026-09-10 契约，
 * 替代原 project/create 管理端入口）。选个人电脑时可指定工作目录
 * （默认工作目录=不传），目录被占用时创建报错；目录能力策略统一见
 * workspaceDirPolicy.constants（常规项目=个人电脑+自定义目录均开启）。
 */
const CreateNormalProjectModal: React.FC<CreateNormalProjectModalProps> = ({
  spaceId,
  open,
  onCancel,
  onConfirm,
}) => {
  const [name, setName] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  // 运行环境：'-1'=云电脑（默认分配目录），其他为个人电脑沙箱 ID
  const [sandboxId, setSandboxId] = useState<string>(CLOUD_SANDBOX_ID);
  const [computerOptions, setComputerOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [computerLoading, setComputerLoading] = useState(false);
  // 自定义工作目录（仅个人电脑时可选）
  const [workspaceDir, setWorkspaceDir] = useState('');
  const [dirPickerOpen, setDirPickerOpen] = useState(false);

  const isPersonal = sandboxId !== CLOUD_SANDBOX_ID;

  useEffect(() => {
    if (!open) return;
    setName('');
    setSandboxId(CLOUD_SANDBOX_ID);
    setWorkspaceDir('');
    setComputerLoading(true);
    apiGetUserSelectableSandboxList()
      .then((res) => {
        if (res?.code === SUCCESS_CODE && res.data?.sandboxes) {
          const options = res.data.sandboxes.map((item) => ({
            label: item.name,
            value: String(item.sandboxId),
          }));
          // 兜底：列表未返回云电脑固定项时本地补一个
          if (!options.some((item) => item.value === CLOUD_SANDBOX_ID)) {
            options.unshift({
              label: dict('PC.Pages.SpaceProjectManage.cloudComputer'),
              value: CLOUD_SANDBOX_ID,
            });
          }
          setComputerOptions(options);
        }
      })
      .finally(() => setComputerLoading(false));
  }, [open]);

  const handleConfirm = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      message.warning(dict('PC.Pages.SpaceProjectManage.nameRequired'));
      return;
    }
    setConfirmLoading(true);
    try {
      const res = await apiNormalProjectCreate({
        spaceId,
        name: trimmed,
        sandboxId: isPersonal ? Number(sandboxId) : undefined,
        workspaceDir: isPersonal ? workspaceDir || undefined : undefined,
      });
      // 返回体 id 字段名契约未细化，兼容 id / targetId 两种形态；
      // conversationId/agentId 为创建即建的首个会话及其智能体（契约先行）
      const newId = res?.data?.id ?? res?.data?.targetId;
      if (res?.code === SUCCESS_CODE && newId) {
        message.success(dict('PC.Pages.SpaceProjectManage.createSuccess'));
        onConfirm({
          id: newId,
          name: trimmed,
          sandboxId: isPersonal ? Number(sandboxId) : undefined,
          conversationId: res?.data?.conversationId,
          agentId: res?.data?.agentId,
        });
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
      <div className={cx(styles['field-row'])}>
        <span className={cx(styles['field-label'])}>
          {dict('PC.Pages.SpaceProjectManage.runtimeEnv')}
        </span>
        <Select
          className={cx(styles['field-control'])}
          value={sandboxId}
          loading={computerLoading}
          notFoundContent={<Spin size="small" />}
          onChange={(value: string) => {
            setSandboxId(value);
            // 目录属于所选电脑，切换到另一台电脑时必须重新选择
            if (value !== sandboxId) {
              setWorkspaceDir('');
              setDirPickerOpen(false);
            }
          }}
          options={computerOptions}
        />
      </div>
      {isPersonal && (
        <div className={cx(styles['field-row'])}>
          <span className={cx(styles['field-label'])}>
            {dict('PC.Components.WorkspaceDir.pick')}
          </span>
          <Dropdown
            trigger={['click']}
            menu={{
              selectable: true,
              selectedKeys: [workspaceDir ? 'pick-folder' : 'default'],
              items: [
                {
                  key: 'default',
                  icon: <FolderOutlined />,
                  label: dict('PC.Components.WorkspaceDir.defaultDir'),
                },
                {
                  key: 'pick-folder',
                  icon: <FolderOpenOutlined />,
                  label: dict('PC.Components.WorkspaceDir.openComputerFolder'),
                },
              ],
              onClick: ({ key }: { key: string }) => {
                if (key === 'pick-folder') {
                  setDirPickerOpen(true);
                } else {
                  setWorkspaceDir('');
                }
              },
            }}
          >
            <button
              type="button"
              className={cx(styles['field-control'], styles['dir-trigger'])}
              title={workspaceDir || undefined}
            >
              <FolderOutlined />
              <span className={cx(styles['dir-text'])}>
                {workspaceDir || dict('PC.Components.WorkspaceDir.defaultDir')}
              </span>
              <DownOutlined className={cx(styles['dir-caret'])} />
            </button>
          </Dropdown>
        </div>
      )}
      <WorkspaceDirPickerModal
        sandboxId={sandboxId}
        open={dirPickerOpen}
        onCancel={() => setDirPickerOpen(false)}
        onConfirm={(dir) => {
          setDirPickerOpen(false);
          setWorkspaceDir(dir);
        }}
      />
    </Modal>
  );
};

export default CreateNormalProjectModal;
