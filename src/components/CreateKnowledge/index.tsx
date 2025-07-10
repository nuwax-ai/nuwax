import knowledgeIcon from '@/assets/images/knowledge_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import {
  apiKnowledgeConfigAdd,
  apiKnowledgeConfigUpdate,
} from '@/services/knowledge';
import { apiModelList } from '@/services/modelConfig';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { KnowledgeDataTypeEnum } from '@/types/enums/library';
import { ModelTypeEnum } from '@/types/enums/modelConfig';
import type { CreateKnowledgeProps, option } from '@/types/interfaces/common';
import type {
  KnowledgeBaseInfo,
  KnowledgeConfigUpdateParams,
} from '@/types/interfaces/knowledge';
import { ModelConfigInfo } from '@/types/interfaces/model';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import SelectList from '../SelectList';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建知识库
 */
const CreateKnowledge: React.FC<CreateKnowledgeProps> = ({
  mode = CreateUpdateModeEnum.Create,
  spaceId,
  knowledgeInfo,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [resourceFormat, setResourceFormat] = useState<KnowledgeDataTypeEnum>(
    KnowledgeDataTypeEnum.Text,
  );
  // 模型列表
  const [modelConfigList, setModelConfigList] = useState<option[]>([]);

  // 数据新增接口
  const { run } = useRequest(apiKnowledgeConfigAdd, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: number) => {
      message.success('知识库已创建成功');
      setLoading(false);
      onCancel();
      history.push(`/space/${spaceId}/knowledge/${result}`);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 数据更新接口
  const { run: runUpdate } = useRequest(apiKnowledgeConfigUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: KnowledgeConfigUpdateParams[]) => {
      message.success('知识库更新成功');
      setLoading(false);
      const info = params[0];
      onConfirm?.(info);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 查询可使用模型列表接口
  const { run: runMode } = useRequest(apiModelList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ModelConfigInfo[]) => {
      const list: option[] =
        result?.map((item) => ({
          label: item.name,
          value: item.id,
        })) || [];
      setModelConfigList(list);
    },
  });

  useEffect(() => {
    if (open) {
      // 查询可使用模型列表接口
      runMode({
        spaceId,
        modelType: ModelTypeEnum.Embeddings,
      });
      if (knowledgeInfo) {
        setImageUrl(knowledgeInfo.icon);
        setResourceFormat(knowledgeInfo.dataType);
        form.setFieldsValue({
          name: knowledgeInfo.name,
          description: knowledgeInfo.description,
          embeddingModelId: knowledgeInfo.embeddingModelId,
        });
      }
    }
  }, [spaceId, open, knowledgeInfo]);

  const onFinish: FormProps<KnowledgeBaseInfo>['onFinish'] = (values) => {
    const params = {
      spaceId,
      name: values.name,
      description: values.description,
      embeddingModelId: values.embeddingModelId,
      icon: imageUrl,
      dataType: resourceFormat,
    };
    setLoading(true);
    if (mode === CreateUpdateModeEnum.Create) {
      run(params);
    } else {
      runUpdate({
        id: knowledgeInfo?.id,
        ...params,
      });
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      title={mode === CreateUpdateModeEnum.Create ? '创建知识库' : '更新知识库'}
      open={open}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <Form
        form={form}
        className={cx('mt-16')}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        preserve={false}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '输入知识库名称' }]}
        >
          <Input placeholder="输入知识库名称" showCount maxLength={100} />
        </Form.Item>
        <OverrideTextArea
          name="description"
          label="描述"
          initialValue={knowledgeInfo?.description}
          placeholder="输入知识库内容的描述"
          maxLength={100}
        />
        <Form.Item
          name="embeddingModelId"
          label="向量模型"
          rules={[{ required: true, message: '请选择向量模型' }]}
        >
          <SelectList
            placeholder="请选择向量模型"
            disabled={mode === CreateUpdateModeEnum.Update}
            options={modelConfigList}
            allowClear
          />
        </Form.Item>
        <Form.Item name="icon" label="图标">
          <UploadAvatar
            className={cx(styles['upload-box'])}
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={knowledgeIcon as string}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateKnowledge;
