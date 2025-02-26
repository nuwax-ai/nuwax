import knowledgeIcon from '@/assets/images/knowledge_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { KNOWLEDGE_RESOURCE_FORMAT } from '@/constants/library.constants';
import {
  apiKnowledgeConfigAdd,
  apiKnowledgeConfigUpdate,
} from '@/services/knowledge';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { KnowledgeDataTypeEnum } from '@/types/enums/library';
import type { CreateKnowledgeProps } from '@/types/interfaces/common';
import type { KnowledgeBaseInfo } from '@/types/interfaces/knowledge';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
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
  const [imageUrl, setImageUrl] = useState<string>('');
  const [resourceFormat, setResourceFormat] = useState<KnowledgeDataTypeEnum>(
    KnowledgeDataTypeEnum.Text,
  );

  // 数据新增接口
  const { run } = useRequest(apiKnowledgeConfigAdd, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result, params) => {
      message.success('知识库已创建成功');
      const data: KnowledgeBaseInfo = {
        id: result,
        ...params[0],
      };
      onConfirm(data);
    },
  });

  // 数据更新接口
  const { run: runUpdate } = useRequest(apiKnowledgeConfigUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_, params) => {
      message.success('知识库更新成功');
      onConfirm(...params);
    },
  });

  useEffect(() => {
    if (knowledgeInfo) {
      setImageUrl(knowledgeInfo.icon);
      setResourceFormat(knowledgeInfo.dataType);
    }
  }, [knowledgeInfo]);

  // 切换资源文件格式类型
  const handleDataType = (value: KnowledgeDataTypeEnum) => {
    if (value === KnowledgeDataTypeEnum.Table) {
      message.warning('表格格式此版本暂时未做');
      return;
    }
    setResourceFormat(value);
  };

  const onFinish: FormProps<KnowledgeBaseInfo>['onFinish'] = (values) => {
    const params = {
      spaceId,
      name: values.name,
      description: values.description,
      icon: imageUrl,
      dataType: resourceFormat,
    };
    if (mode === CreateUpdateModeEnum.Create) {
      run({
        ...params,
      });
    } else {
      runUpdate({
        id: knowledgeInfo?.id,
        ...params,
      });
    }
  };

  const handlerSubmit = async () => {
    await form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      title="创建知识库"
      open={open}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <div className={cx('flex', styles.header)}>
        {KNOWLEDGE_RESOURCE_FORMAT.map((item) => (
          <div
            key={item.value}
            className={cx(
              'flex',
              'flex-col',
              'items-center',
              'content-center',
              'cursor-pointer',
              styles.box,
              { [styles.active]: resourceFormat === item.value },
            )}
            onClick={() => handleDataType(item.value)}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <Form
        form={form}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          name: knowledgeInfo?.name,
          description: knowledgeInfo?.description,
        }}
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
          maxLength={2000}
        />
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
