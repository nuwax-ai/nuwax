import Database from '@/assets/images/database_image.png';
import { default as Knowledge } from '@/assets/images/knowledge_image.png';
import Plugin from '@/assets/images/plugin_image.png';
import Workflow from '@/assets/images/workflow_image.png';
import GuardedFormModal, {
  GuardedFormModalForm,
  useFormModalSubmit,
} from '@/components/business-component/GuardedFormModal';
import SelectList from '@/components/custom/SelectList';
import UploadAvatar from '@/components/UploadAvatar';
import {
  CLOUD_BASE_CODE_OPTIONS,
  PLUGIN_CREATE_TOOL,
} from '@/constants/library.constants';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type { CreateKnowledgeProps } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { resolveCreateIcon } from '@/utils/resolveCreateIcon';
import type { FormInstance } from 'antd';
import { Form, Input, Radio } from 'antd';
import React, { useEffect, useState } from 'react';

interface Info {
  name?: string;
  description?: string;
  icon?: string;
  type?: string;
  codeLang?: string;
}

interface CreatedItemProp extends CreateKnowledgeProps {
  loading?: boolean;
  type:
    | AgentComponentTypeEnum.Plugin
    | AgentComponentTypeEnum.Workflow
    | AgentComponentTypeEnum.Knowledge
    | AgentComponentTypeEnum.Table;
  info?: Info;
  Confirm: (
    info: Info,
    type?: AgentComponentTypeEnum,
    mode?: CreateUpdateModeEnum,
  ) => void;
}

interface CreatedItemFormProps {
  form: FormInstance;
  mode: CreateUpdateModeEnum;
  type: CreatedItemProp['type'];
  imageUrl: string;
  setImageUrl: (url: string) => void;
  Confirm: CreatedItemProp['Confirm'];
  getDefaultImage: () => string;
}

/** 须在 GuardedFormModal 子树内渲染，以使用统一提交防重 */
const CreatedItemForm: React.FC<CreatedItemFormProps> = ({
  form,
  mode,
  type,
  imageUrl,
  setImageUrl,
  Confirm,
  getDefaultImage,
}) => {
  const modalSubmit = useFormModalSubmit();

  const onFinish = async (values: Info) => {
    if (mode !== CreateUpdateModeEnum.Create) {
      Confirm(values, type, mode);
      return;
    }
    try {
      const { icon, description } = await resolveCreateIcon({
        imageUrl: form.getFieldValue('icon') || imageUrl,
        name: values.name,
        description: values.description,
      });
      Confirm(
        { ...values, icon, description: description ?? values.description },
        type,
        mode,
      );
    } catch {
      modalSubmit?.abortSubmit();
    }
  };

  return (
    <GuardedFormModalForm
      form={form}
      layout="vertical"
      onFinish={onFinish}
      requiredMark={customizeRequiredMark}
    >
      {(type === AgentComponentTypeEnum.Plugin ||
        type === AgentComponentTypeEnum.Table) && (
        <Form.Item name="icon">
          <div className="dis-center">
            <UploadAvatar
              className={'upload-box'}
              onUploadSuccess={(e) => {
                form.setFieldValue('icon', e);
                setImageUrl(e);
              }}
              imageUrl={form.getFieldValue('icon') || imageUrl}
              defaultImage={getDefaultImage()}
              svgIconName="icons-workspace-table"
            />
          </div>
        </Form.Item>
      )}
      <Form.Item
        name="name"
        label={dict('PC.Components.CreatedItem.name')}
        rules={[
          {
            required: true,
            message: dict('PC.Components.CreatedItem.pleaseInputName'),
          },
          {
            validator(_, value) {
              if (!value || value?.length <= 30) {
                return Promise.resolve();
              }
              if (value?.length > 30) {
                return Promise.reject(
                  new Error(dict('PC.Components.CreatedItem.nameMaxChars')),
                );
              }
              return Promise.reject(
                new Error(
                  dict('PC.Components.CreatedItem.pleaseInputNameBang'),
                ),
              );
            },
          },
        ]}
      >
        <Input
          placeholder={dict('PC.Components.CreatedItem.placeholderName')}
          showCount
          maxLength={30}
        />
      </Form.Item>
      <Form.Item
        name="description"
        label={dict('PC.Components.CreatedItem.description')}
        className="position-relative"
      >
        <Input.TextArea
          placeholder={dict('PC.Components.CreatedItem.placeholderDesc')}
          autoSize={{ minRows: 3, maxRows: 6 }}
          maxLength={10000}
          showCount
          className="dispose-textarea-count"
        />
      </Form.Item>
      {(type === AgentComponentTypeEnum.Workflow ||
        type === AgentComponentTypeEnum.Knowledge) && (
        <Form.Item name="icon">
          <div>
            <UploadAvatar
              className={'upload-box'}
              onUploadSuccess={(e) => {
                form.setFieldValue('icon', e);
              }}
              imageUrl={imageUrl}
              defaultImage={getDefaultImage()}
              svgIconName="icons-workspace-knowledge"
            />
          </div>
        </Form.Item>
      )}
      {type === AgentComponentTypeEnum.Plugin && (
        <>
          <Form.Item
            shouldUpdate
            label={dict('PC.Components.CreatedItem.toolCreateMethod')}
            name="type"
          >
            <Radio.Group options={PLUGIN_CREATE_TOOL}></Radio.Group>
          </Form.Item>
          <Form.Item shouldUpdate>
            {() =>
              form.getFieldValue('type') === 'CODE' && (
                <Form.Item
                  label={dict('PC.Components.CreatedItem.ideRuntime')}
                  name="codeLang"
                >
                  <SelectList options={CLOUD_BASE_CODE_OPTIONS} />
                </Form.Item>
              )
            }
          </Form.Item>
        </>
      )}
    </GuardedFormModalForm>
  );
};

const CreatedItem: React.FC<CreatedItemProp> = ({
  loading,
  mode = CreateUpdateModeEnum.Create,
  type,
  info,
  open,
  onCancel,
  Confirm,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    if (open && info) {
      form.setFieldsValue(info);
      setImageUrl(info.icon || '');
    }
  }, [open, info, form]);

  const getTitle = () => {
    const _mode = {
      [CreateUpdateModeEnum.Create]: dict('PC.Components.CreatedItem.create'),
      [CreateUpdateModeEnum.Update]: dict('PC.Components.CreatedItem.update'),
    };
    const _type = {
      [AgentComponentTypeEnum.Table]: dict(
        'PC.Components.CreatedItem.dataTable',
      ),
      [AgentComponentTypeEnum.Knowledge]: dict(
        'PC.Components.CreatedItem.knowledge',
      ),
      [AgentComponentTypeEnum.Plugin]: dict('PC.Components.CreatedItem.plugin'),
      [AgentComponentTypeEnum.Workflow]: dict(
        'PC.Components.CreatedItem.workflow',
      ),
    };
    return `${_mode[mode]}${_type[type]}`;
  };

  const getDefaultImage = () => {
    const _type = {
      [AgentComponentTypeEnum.Table]: Database,
      [AgentComponentTypeEnum.Knowledge]: Knowledge,
      [AgentComponentTypeEnum.Plugin]: Plugin,
      [AgentComponentTypeEnum.Workflow]: Workflow,
    };
    return _type[type];
  };

  return (
    <GuardedFormModal
      form={form}
      title={getTitle()}
      open={open}
      loading={loading}
      onCancel={onCancel}
      onConfirm={() => form.submit()}
    >
      <CreatedItemForm
        form={form}
        mode={mode}
        type={type}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        Confirm={Confirm}
        getDefaultImage={getDefaultImage}
      />
    </GuardedFormModal>
  );
};

export default CreatedItem;
