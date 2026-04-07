import workflowIcon from '@/assets/images/workflow_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { dict } from '@/services/i18nRuntime';
import { apiAddWorkflow, apiUpdateWorkflow } from '@/services/library';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type {
  CreateWorkflowProps,
  UpdateWorkflowParams,
  WorkflowBaseInfo,
} from '@/types/interfaces/library';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps } from 'antd';
import { Form, Input, message } from 'antd';
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

  // 新增工作流
  const { run } = useRequest(apiAddWorkflow, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: number) => {
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
      </Form>
    </CustomFormModal>
  );
};

export default CreateWorkflow;
