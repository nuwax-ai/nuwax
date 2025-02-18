import pluginIcon from '@/assets/images/plugin_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import SelectList from '@/components/SelectList';
import UploadAvatar from '@/components/UploadAvatar';
import {
  CLOUD_BASE_CODE_OPTIONS,
  PLUGIN_CREATE_TOOL,
} from '@/constants/library.constants';
import { apiPluginAdd, apiPluginHttpUpdate } from '@/services/plugin';
import { PluginModeEnum } from '@/types/enums/library';
import { PluginTypeEnum } from '@/types/enums/plugin';
import type { CreateNewPluginProps } from '@/types/interfaces/library';
import type { PluginAddParams } from '@/types/interfaces/plugin';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps, RadioChangeEvent } from 'antd';
import { Form, Input, message, Radio } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 新建、修改插件组件
 */
const CreateNewPlugin: React.FC<CreateNewPluginProps> = ({
  spaceId,
  pluginId,
  icon,
  name,
  description,
  type = PluginModeEnum.Create,
  codeLang,
  open,
  onCancel,
  onConfirmCreate,
  onConfirmUpdate,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>(icon || '');
  const [pluginType, setPluginType] = useState<PluginTypeEnum>();

  // 新增插件接口
  const { run: runCreate } = useRequest(apiPluginAdd, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setImageUrl('');
      onConfirmCreate?.(result);
      message.success('插件已创建');
    },
  });

  // 更新HTTP插件配置接口
  const { run: runUpdate } = useRequest(apiPluginHttpUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      setImageUrl('');
      onConfirmUpdate?.();
      message.success('插件更新成功');
    },
  });

  const onFinish: FormProps<PluginAddParams>['onFinish'] = (values) => {
    if (type === PluginModeEnum.Create) {
      runCreate({
        ...values,
        icon: imageUrl,
        spaceId,
      });
    } else {
      // 更新HTTP插件配置接口
      runUpdate({
        ...values,
        icon: imageUrl,
        id: pluginId,
      });
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  const handleChangeCreateTool = ({ target: { value } }: RadioChangeEvent) => {
    setPluginType(value);
  };

  const title = type === PluginModeEnum.Create ? '新建插件' : '更新插件';

  return (
    <CustomFormModal
      form={form}
      title={title}
      open={open}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <div className={cx('flex', 'flex-col', 'items-center', 'py-16')}>
        <UploadAvatar
          className={styles['upload-box']}
          onUploadSuccess={setImageUrl}
          imageUrl={imageUrl}
          defaultImage={pluginIcon as string}
        />
        <Form
          form={form}
          preserve={false}
          requiredMark={customizeRequiredMark}
          initialValues={{
            name,
            description,
            type,
            codeLang,
          }}
          layout="vertical"
          onFinish={onFinish}
          rootClassName={cx(styles['create-team-form'])}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="插件名称"
            rules={[{ required: true, message: '请输入插件名称' }]}
          >
            <Input
              placeholder="请输入插件名称，确保名称含义清晰且符合平台规范"
              showCount
              maxLength={30}
            />
          </Form.Item>
          <OverrideTextArea
            name="description"
            label="插件描述"
            initialValue={description}
            rules={[
              { required: true, message: '请输入插件的主要功能和使用场景' },
            ]}
            placeholder="请输入插件的主要功能和使用场景，确保内容符合平台规范。帮助用户/大模型更好地理解"
            maxLength={600}
          />
          {type === PluginModeEnum.Create && (
            <>
              <Form.Item
                name="type"
                label="插件工具创建方式"
                rules={[{ required: true, message: '请选择插件工具创建方式' }]}
              >
                <Radio.Group
                  options={PLUGIN_CREATE_TOOL}
                  value={pluginType}
                  onChange={handleChangeCreateTool}
                ></Radio.Group>
              </Form.Item>
              {pluginType === PluginTypeEnum.HTTP ? (
                <Form.Item
                  name="pluginUrl"
                  label="插件 URL"
                  rules={[{ required: true, message: '请输入插件名称' }]}
                >
                  <Input placeholder="请输入插件的访问地址或相关资源的链接" />
                </Form.Item>
              ) : (
                <Form.Item
                  name="codeLang"
                  label="IDE 运行时"
                  rules={[{ required: true, message: '请输入插件名称' }]}
                >
                  <SelectList options={CLOUD_BASE_CODE_OPTIONS} />
                </Form.Item>
              )}
            </>
          )}
        </Form>
      </div>
    </CustomFormModal>
  );
};

export default CreateNewPlugin;
