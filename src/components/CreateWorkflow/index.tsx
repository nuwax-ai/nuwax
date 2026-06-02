import workflowIcon from '@/assets/images/workflow_image.png';
import ConditionRender from '@/components/ConditionRender';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { dict } from '@/services/i18nRuntime';
import {
  apiAddResourceToGroup,
  apiAddWorkflow,
  apiResourceGroupList,
  apiUpdateWorkflow,
} from '@/services/library';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { ComponentTypeEnum } from '@/types/enums/space';
import type {
  CreateWorkflowProps,
  UpdateWorkflowParams,
  WorkflowBaseInfo,
} from '@/types/interfaces/library';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps } from 'antd';
import { Form, Input, message, Select } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建工作流弹窗
 */
const CreateWorkflow: React.FC<CreateWorkflowProps> = ({
  type = CreateUpdateModeEnum.Create,
  name,
  spaceId,
  id,
  icon,
  description,
  open,
  onCancel,
  onConfirm,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [groupOptions, setGroupOptions] = useState<any[]>([]);

  // 拉取资源分组列表
  useEffect(() => {
    if (open && type === CreateUpdateModeEnum.Create && spaceId) {
      apiResourceGroupList({
        spaceId,
        types: [ComponentTypeEnum.Workflow],
      })
        .then((res) => {
          if (res.success && res.data) {
            setGroupOptions(res.data || []);
          }
        })
        .catch(() => {});
    }
  }, [open, type, spaceId]);

  // 新增工作流
  const { run } = useRequest(apiAddWorkflow, {
    manual: true,
    debounceInterval: 300,
    onSuccess: async (result: number) => {
      // 校验如果用户选择了分组，则先执行移入分组操作
      const targetGroupId = form.getFieldValue('groupId');
      if (targetGroupId) {
        try {
          await apiAddResourceToGroup(targetGroupId, {
            targetType: ComponentTypeEnum.Workflow,
            targetId: result,
          });
        } catch (e) {}
      }

      message.success(dict('PC.Components.CreateWorkflow.workflowCreated'));
      onCancel();
      history.push(`/space/${spaceId}/workflow/${result}`);
    },
  });

  // 更新工作流（内部接口，当未提供 onUpdate 时使用）
  const { run: runUpdate } = useRequest(apiUpdateWorkflow, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: UpdateWorkflowParams[]) => {
      message.success(dict('PC.Components.CreateWorkflow.workflowUpdated'));
      const info = params[0];
      onConfirm?.(info as WorkflowBaseInfo);
      onCancel(); // 关闭对话框
    },
  });

  useEffect(() => {
    if (open) {
      setImageUrl(icon || '');
      form.setFieldsValue({
        name,
        description,
      });
    }
  }, [open, icon, name, description]);

  const onFinish: FormProps<{
    name: string;
    description: string;
    groupId?: number;
  }>['onFinish'] = async (values) => {
    const baseParams = {
      name: values?.name,
      description: values?.description,
      icon: imageUrl,
    };

    if (type === CreateUpdateModeEnum.Create) {
      run({
        spaceId,
        ...baseParams,
      });
    } else {
      // 构建完整的更新参数
      const updateParams: WorkflowBaseInfo = {
        id: id as number,
        spaceId: spaceId as number,
        ...baseParams,
        extension: { size: 1 },
      };
      // 如果提供了外部更新回调，则使用外部处理
      if (onUpdate) {
        const success = await onUpdate(updateParams);
        if (success) {
          message.success(dict('PC.Components.CreateWorkflow.workflowUpdated'));
          onConfirm?.(updateParams);
          onCancel();
        }
      } else {
        // 否则使用内部接口
        runUpdate({
          id: id as number,
          ...baseParams,
        });
      }
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      title={
        type === CreateUpdateModeEnum.Create
          ? dict('PC.Components.CreateWorkflow.createWorkflow')
          : dict('PC.Components.CreateWorkflow.updateWorkflow')
      }
      classNames={{
        content: cx(styles.container),
        header: cx(styles.header),
      }}
      open={open}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <Form
        form={form}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label={dict('PC.Components.CreateWorkflow.name')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Components.CreateWorkflow.pleaseInputWorkflowName',
              ),
            },
            {
              validator(_, value) {
                if (!value || value?.length <= 30) {
                  return Promise.resolve();
                }
                if (value?.length > 30) {
                  return Promise.reject(
                    new Error(
                      dict('PC.Components.CreateWorkflow.nameMaxChars'),
                    ),
                  );
                }
                return Promise.reject(
                  new Error(
                    dict(
                      'PC.Components.CreateWorkflow.pleaseInputWorkflowNameBang',
                    ),
                  ),
                );
              },
            },
          ]}
        >
          <Input
            placeholder={dict(
              'PC.Components.CreateWorkflow.placeholderWorkflowName',
            )}
            showCount
            maxLength={30}
          />
        </Form.Item>
        <OverrideTextArea
          name="description"
          label={dict('PC.Components.CreateWorkflow.description')}
          initialValue={description}
          placeholder={dict(
            'PC.Components.CreateWorkflow.placeholderWorkflowDesc',
          )}
          maxLength={10000}
        />
        <Form.Item
          name="icon"
          label={dict('PC.Components.CreateWorkflow.icon')}
        >
          <UploadAvatar
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={workflowIcon as string}
            svgIconName="icons-workspace-workflow"
          />
        </Form.Item>
        <ConditionRender condition={type === CreateUpdateModeEnum.Create}>
          <Form.Item
            name="groupId"
            label={dict('PC.Pages.SpaceResource.LeftGroupList.selectGroup')}
          >
            <Select
              placeholder={dict(
                'PC.Pages.SpaceResource.LeftGroupList.selectGroupPlaceholder',
              )}
              allowClear
              options={groupOptions.map((g) => ({
                value: g.id,
                label: g.name,
              }))}
            />
          </Form.Item>
        </ConditionRender>
      </Form>
    </CustomFormModal>
  );
};

export default CreateWorkflow;
