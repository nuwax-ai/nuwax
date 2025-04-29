import Database from '@/assets/images/database_image.png';
import { default as Knowledge } from '@/assets/images/knowledge_image.png';
import Plugin from '@/assets/images/plugin_image.png';
import Workflow from '@/assets/images/workflow_image.png';
import SelectList from '@/components/SelectList';
import UploadAvatar from '@/components/UploadAvatar';
import {
  CLOUD_BASE_CODE_OPTIONS,
  PLUGIN_CREATE_TOOL,
} from '@/constants/library.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type { CreateKnowledgeProps } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, Modal, Radio } from 'antd';
import React, { useEffect, useState } from 'react';

interface Info {
  name?: string;
  description?: string;
  icon?: string;
  type?: string;
  codeLang?: string;
}

interface CreatedItemProp extends CreateKnowledgeProps {
  type:
    | AgentComponentTypeEnum.Plugin
    | AgentComponentTypeEnum.Workflow
    | AgentComponentTypeEnum.Knowledge
    | AgentComponentTypeEnum.Table; // 组件类型，数据库、知识库、插件、工作流
  info?: Info;
  Confirm: (
    info: Info,
    type: AgentComponentTypeEnum,
    mode: CreateUpdateModeEnum,
  ) => void;
}

const CreatedItem: React.FC<CreatedItemProp> = ({
  mode = CreateUpdateModeEnum.Create,
  type,
  info,
  // spaceId,
  open,
  onCancel,
  Confirm,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');

  const handlerSubmit = async () => {
    await form.submit();
  };

  //   title
  const getTitle = () => {
    const _mode = {
      [CreateUpdateModeEnum.Create]: '创建',
      [CreateUpdateModeEnum.Update]: '编辑',
    };
    const _type = {
      [AgentComponentTypeEnum.Table]: '数据库',
      [AgentComponentTypeEnum.Knowledge]: '知识库',
      [AgentComponentTypeEnum.Plugin]: '插件',
      [AgentComponentTypeEnum.Workflow]: '工作流',
    };
    return `${_mode[mode]}${_type[type]}`;
  };
  //   默认图片
  const getDefaultImage = () => {
    const _type = {
      [AgentComponentTypeEnum.Table]: Database,
      [AgentComponentTypeEnum.Knowledge]: Knowledge,
      [AgentComponentTypeEnum.Plugin]: Plugin,
      [AgentComponentTypeEnum.Workflow]: Workflow,
    };
    return _type[type];
  };
  // 提交数据
  const onFinish = (values: any) => {
    Confirm(values, type, mode);
  };

  useEffect(() => {
    if (info) {
      form.setFieldsValue(info);
    }
  }, [info]);

  return (
    <Modal
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      open={open}
      onCancel={() => onCancel()}
      centered
      okText="确定"
      cancelText="取消"
      onOk={() => handlerSubmit()}
      title={getTitle()}
    >
      <Form
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
                imageUrl={form.getFieldValue('icon') || imageUrl} // 传入imageUrl作为默认图片，或者使用getDefaultImage()作为默认图片提供
                defaultImage={getDefaultImage()}
              />
            </div>
          </Form.Item>
        )}
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="请输入名称" showCount maxLength={30} />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          className="position-relative"
        >
          <Input.TextArea
            placeholder="请输入描述"
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={1000}
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
              />
            </div>
          </Form.Item>
        )}
        {type === AgentComponentTypeEnum.Plugin && (
          <>
            <Form.Item shouldUpdate label="工具创建方式" name="type">
              <Radio.Group options={PLUGIN_CREATE_TOOL}></Radio.Group>
            </Form.Item>
            {/* IDE 运行时 */}
            <Form.Item shouldUpdate>
              {() =>
                form.getFieldValue('type') === 'CODE' && (
                  <Form.Item label="IDE 运行时" name="codeLang">
                    <SelectList options={CLOUD_BASE_CODE_OPTIONS} />
                  </Form.Item>
                )
              }
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default CreatedItem;
