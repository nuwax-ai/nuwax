import pluginIcon from '@/assets/images/plugin_image.png';
import ConditionRender from '@/components/ConditionRender';
import SelectList from '@/components/custom/SelectList';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import {
  CLOUD_BASE_CODE_OPTIONS,
  PLUGIN_CREATE_TOOL,
} from '@/constants/library.constants';
import { apiPluginAdd, apiPluginHttpUpdate } from '@/services/plugin';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { PluginTypeEnum } from '@/types/enums/plugin';
import type { CreateNewPluginProps } from '@/types/interfaces/library';
import type {
  PluginAddParams,
  PluginHttpUpdateParams,
} from '@/types/interfaces/plugin';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps, RadioChangeEvent } from 'antd';
import { Form, Input, message, Radio } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import CustomFormModal from '../CustomFormModal';

const cx = classNames;

/**
 * 新建、修改插件组件
 */
const CreateNewPlugin: React.FC<CreateNewPluginProps> = ({
  spaceId,
  id,
  icon,
  name,
  description,
  mode = CreateUpdateModeEnum.Create,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [pluginType, setPluginType] = useState<PluginTypeEnum>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setImageUrl(icon || '');
      form.setFieldsValue({
        name,
        description,
      });
    }
  }, [open, icon, name, description]);

  // 根据type类型，判断插件跳转路径
  const handlePluginUrl = (id: number, type: PluginTypeEnum) => {
    if (type === PluginTypeEnum.CODE) {
      history.push(`/space/${spaceId}/plugin/${id}/cloud-tool`);
    } else if (type === PluginTypeEnum.HTTP) {
      history.push(`/space/${spaceId}/plugin/${id}`);
    }
  };

  // 新增插件接口
  const { run: runCreate } = useRequest(apiPluginAdd, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: number, params: PluginAddParams[]) => {
      setImageUrl('');
      // 关闭弹窗
      onCancel();
      // 跳转到插件配置页面
      const { type } = params[0];
      handlePluginUrl(result, type);
      message.success('插件已创建');
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 更新HTTP插件配置接口
  const { run: runUpdate } = useRequest(apiPluginHttpUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: PluginHttpUpdateParams[]) => {
      setImageUrl('');
      const info = params[0];
      onConfirm?.(info);
      message.success('插件更新成功');
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  const onFinish: FormProps<PluginAddParams>['onFinish'] = (values) => {
    setLoading(true);
    if (mode === CreateUpdateModeEnum.Create) {
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
        id,
      });
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  const handleChangeCreateTool = ({ target: { value } }: RadioChangeEvent) => {
    if (value === PluginTypeEnum.HTTP) {
      form.setFieldValue('codeLang', null);
    }
    setPluginType(value);
  };

  return (
    <CustomFormModal
      form={form}
      title={mode === CreateUpdateModeEnum.Create ? '新建插件' : '更新插件'}
      open={open}
      classNames={classNames}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <div className={cx('flex', 'flex-col', 'items-center', 'py-16')}>
        <UploadAvatar
          className={cx('mt-16', 'mb-16')}
          onUploadSuccess={setImageUrl}
          imageUrl={imageUrl}
          defaultImage={pluginIcon as string}
        />
        <Form
          form={form}
          requiredMark={customizeRequiredMark}
          layout="vertical"
          onFinish={onFinish}
          rootClassName={cx('w-full')}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="插件名称"
            rules={[
              { required: true, message: '请输入插件名称' },
              {
                validator(_, value) {
                  if (!value || value?.length <= 30) {
                    return Promise.resolve();
                  }
                  if (value?.length > 30) {
                    return Promise.reject(new Error('名称不能超过30个字符!'));
                  }
                  return Promise.reject(new Error('请输入插件名称!'));
                },
              },
            ]}
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
            maxLength={100}
          />
          <ConditionRender condition={mode === CreateUpdateModeEnum.Create}>
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
            <ConditionRender condition={pluginType === PluginTypeEnum.CODE}>
              <Form.Item
                name="codeLang"
                label="IDE 运行时"
                rules={[{ required: true, message: '请选择插件模式' }]}
              >
                <SelectList options={CLOUD_BASE_CODE_OPTIONS} />
              </Form.Item>
            </ConditionRender>
          </ConditionRender>
        </Form>
      </div>
    </CustomFormModal>
  );
};

export default CreateNewPlugin;
