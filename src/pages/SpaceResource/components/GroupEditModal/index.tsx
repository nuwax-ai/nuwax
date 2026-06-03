import pluginIcon from '@/assets/images/plugin_image.png';
import workflowIcon from '@/assets/images/workflow_image.png';
import UploadAvatar from '@/components/UploadAvatar';
import { dict } from '@/services/i18nRuntime';
import {
  apiAddResourceGroup,
  apiUpdateResourceGroup,
} from '@/services/library';
import { ComponentTypeEnum } from '@/types/enums/space';
import type { ResourceGroupInfo } from '@/types/interfaces/library';
import { Form, Input, message, Modal } from 'antd';
import React, { useEffect, useState } from 'react';

interface GroupEditModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  editingGroup: ResourceGroupInfo | null;
  spaceId: number;
  filterType: ComponentTypeEnum;
  onCancel: () => void;
  onSuccess: (targetGroupId: number) => void;
}

const GroupEditModal: React.FC<GroupEditModalProps> = ({
  open,
  mode,
  editingGroup,
  spaceId,
  filterType,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [modalLoading, setModalLoading] = useState(false);
  const selectedType = Form.useWatch('type', form);

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editingGroup) {
        setImageUrl(editingGroup.icon || '');
        form.setFieldsValue({
          name: editingGroup.name,
          description: editingGroup.description || '',
          icon: editingGroup.icon || '',
          type: editingGroup.type,
        });
      } else {
        setImageUrl('');
        form.resetFields();
        // 新建时，直接根据传入的 filterType 自动决定类型
        const defaultType =
          filterType === ComponentTypeEnum.Workflow
            ? ComponentTypeEnum.Workflow
            : ComponentTypeEnum.Plugin;
        form.setFieldsValue({
          type: defaultType,
        });
      }
    }
  }, [open, mode, editingGroup, form, filterType]);

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      const name = values.name.trim();
      const description = (values.description || '').trim();
      const icon = values.icon || '';
      const type =
        values.type ||
        (filterType === ComponentTypeEnum.Workflow
          ? ComponentTypeEnum.Workflow
          : ComponentTypeEnum.Plugin);

      if (!name) return;

      setModalLoading(true);
      if (mode === 'add') {
        const newGroup: ResourceGroupInfo = {
          id: 0,
          spaceId,
          name,
          description,
          icon,
          toolCount: 0,
          type,
          created: '',
          modified: '',
        };
        apiAddResourceGroup(newGroup)
          .then((res) => {
            if (res.success) {
              message.success(
                dict('PC.Pages.SpaceResource.LeftGroupList.createSuccess'),
              );
              onSuccess(res.data);
            }
          })
          .catch(() => {
            // 静默降级，由全局拦截器做报错提醒
          })
          .finally(() => {
            setModalLoading(false);
          });
      } else if (mode === 'edit' && editingGroup) {
        const payload: ResourceGroupInfo = {
          ...editingGroup,
          name,
          description,
          icon,
        };
        apiUpdateResourceGroup(editingGroup.id, payload)
          .then((res) => {
            if (res.success) {
              message.success(
                dict('PC.Pages.SpaceResource.LeftGroupList.editSuccess'),
              );
              onSuccess(editingGroup.id);
            }
          })
          .catch(() => {
            // 静默降级，由全局拦截器做报错提醒
          })
          .finally(() => {
            setModalLoading(false);
          });
      }
    });
  };

  return (
    <Modal
      title={
        mode === 'add'
          ? dict('PC.Pages.SpaceResource.LeftGroupList.createGroupTitle')
          : dict('PC.Pages.SpaceResource.LeftGroupList.editGroupTitle')
      }
      open={open}
      onOk={handleModalOk}
      confirmLoading={modalLoading}
      onCancel={onCancel}
      okText={dict('PC.Common.Global.confirm')}
      cancelText={dict('PC.Common.Global.cancel')}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          name="icon"
          label={dict('PC.Pages.SpaceResource.LeftGroupList.groupIconLabel')}
        >
          <div
            style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
          >
            <UploadAvatar
              imageUrl={imageUrl}
              onUploadSuccess={(url) => {
                setImageUrl(url);
                form.setFieldValue('icon', url);
              }}
              defaultImage={
                selectedType === ComponentTypeEnum.Workflow
                  ? workflowIcon
                  : pluginIcon
              }
            />
          </div>
        </Form.Item>
        <Form.Item
          name="name"
          label={dict('PC.Pages.SpaceResource.LeftGroupList.groupNameLabel')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Pages.SpaceResource.LeftGroupList.groupNameRequired',
              ),
            },
            {
              whitespace: true,
              message: dict(
                'PC.Pages.SpaceResource.LeftGroupList.groupNameNoWhitespace',
              ),
            },
            {
              max: 30,
              message: dict(
                'PC.Pages.SpaceResource.LeftGroupList.groupNameMaxLength',
              ),
            },
          ]}
        >
          <Input
            placeholder={dict(
              'PC.Pages.SpaceResource.LeftGroupList.groupNamePlaceholder',
            )}
            maxLength={30}
            showCount
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={dict('PC.Pages.SpaceResource.LeftGroupList.groupDescLabel')}
          rules={[
            {
              max: 100,
              message: dict(
                'PC.Pages.SpaceResource.LeftGroupList.groupDescMaxLength',
              ),
            },
          ]}
        >
          <Input.TextArea
            placeholder={dict(
              'PC.Pages.SpaceResource.LeftGroupList.groupDescPlaceholder',
            )}
            rows={3}
            maxLength={100}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GroupEditModal;
