import pluginIcon from '@/assets/images/plugin_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import SelectList from '@/components/SelectList';
import UploadAvatar from '@/components/UploadAvatar';
import { PLUGIN_CREATE_TOOL } from '@/constants/library.constants';
import { PluginCreateToolEnum, PluginModeEnum } from '@/types/enums/library';
import type { CreateNewPluginProps } from '@/types/interfaces/library';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, Radio, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 新建、修改插件组件
 */
const CreateNewPlugin: React.FC<CreateNewPluginProps> = ({
  pluginId,
  img,
  pluginName,
  desc,
  type = PluginModeEnum.Create,
  open,
  onCancel,
}) => {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [form] = Form.useForm();
  const [createTool, setCreateTool] = useState<PluginCreateToolEnum>();

  const onFinish = (values: any) => {
    console.log('Received values of form: ', values, pluginId, img);
  };

  const handleOk = () => {
    setConfirmLoading(true);
    form.submit();
    setTimeout(() => {
      onCancel();
      // todo 目前逻辑未定，这里只是暂时做页面跳转到测试插件，后续修改
      history.push('/space/1101010/plugin/15115');
      setConfirmLoading(false);
    }, 3000);
  };

  const handleChangeCreateTool = ({ target: { value } }: RadioChangeEvent) => {
    setCreateTool(value);
  };

  const title = type === PluginModeEnum.Create ? '新建插件' : '更新插件';

  return (
    <CustomFormModal
      form={form}
      title={title}
      open={open}
      onCancel={onCancel}
      loading={confirmLoading}
      onConfirm={handleOk}
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
            pluginName,
            desc,
          }}
          layout="vertical"
          onFinish={onFinish}
          rootClassName={cx(styles['create-team-form'])}
          autoComplete="off"
        >
          <Form.Item
            name="pluginName"
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
            name="desc"
            label="插件描述"
            initialValue={desc}
            rules={[
              { required: true, message: '请输入插件的主要功能和使用场景' },
            ]}
            placeholder="请输入插件的主要功能和使用场景，确保内容符合平台规范。帮助用户/大模型更好地理解"
            maxLength={600}
          />
          {type === PluginModeEnum.Create && (
            <>
              <Form.Item
                name="createMode"
                label="插件工具创建方式"
                rules={[{ required: true, message: '请选择插件工具创建方式' }]}
              >
                <Radio.Group
                  options={PLUGIN_CREATE_TOOL}
                  value={createTool}
                  onChange={handleChangeCreateTool}
                ></Radio.Group>
              </Form.Item>
              {createTool === PluginCreateToolEnum.Existing_Service_Based ? (
                <Form.Item
                  name="pluginUrl"
                  label="插件 URL"
                  rules={[{ required: true, message: '请输入插件名称' }]}
                >
                  <Input placeholder="请输入插件的访问地址或相关资源的链接" />
                </Form.Item>
              ) : (
                <Form.Item
                  name="ide"
                  label="IDE 运行时"
                  rules={[{ required: true, message: '请输入插件名称' }]}
                >
                  <SelectList
                    options={[
                      {
                        value: 1,
                        label: 'Node.js',
                      },
                      {
                        value: 2,
                        label: 'Python3',
                      },
                    ]}
                  />
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
