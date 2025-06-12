import CustomFormModal from '@/components/CustomFormModal';
import { AGENT_VARIABLES_INPUT_OPTIONS } from '@/constants/agent.constants';
import { InputTypeEnum, OptionDataSourceEnum } from '@/types/enums/agent';
import { BindConfigWithSub } from '@/types/interfaces/agent';
import { customizeRequiredMark } from '@/utils/form';
import { Checkbox, Form, FormProps, Input, Radio, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 创建变量弹窗组件
export interface CreateVariableModalProps {
  open: boolean; // 控制弹窗的显示隐藏
  onCancel: () => void; // 取消按钮的回调函数
  onOk: () => void; // 确定按钮的回调函数，传入变量名称
}

// 创建变量弹窗组件
const CreateVariableModal: React.FC<CreateVariableModalProps> = ({
  open,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm();
  const [inputType, setInputType] = useState<InputTypeEnum>(InputTypeEnum.Text); // 输入方式，默认为空字符串

  useEffect(() => {
    if (open) {
      form.setFieldValue('inputType', InputTypeEnum.Text); // 重置表单
    }
  }, [open]);

  // 创建、更新定时任务
  const onFinish: FormProps<BindConfigWithSub>['onFinish'] = (values) => {
    console.log('values', values); // 打印表单值，用于调试
  };

  const items: TabsProps['items'] = [
    {
      key: OptionDataSourceEnum.MANUAL,
      label: '手动创建',
      children: 'Content of Tab Pane 1',
    },
    {
      key: OptionDataSourceEnum.PLUGIN,
      label: '插件绑定',
      children: 'Content of Tab Pane 2',
    },
  ];

  return (
    <CustomFormModal
      form={form}
      open={open}
      title="编辑或添加变量"
      onCancel={onCancel}
      onConfirm={onOk}
    >
      <Form
        form={form}
        preserve={false}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="字段名称"
          rules={[{ required: true, message: '请输入字段名称' }]}
        >
          <Input
            placeholder="请输入字段名称，符合字段命名规划"
            showCount
            maxLength={30}
          />
        </Form.Item>
        <Form.Item
          name="displayName"
          label="展示名称"
          rules={[{ required: true, message: '请输入字段展示名称' }]}
        >
          <Input
            placeholder="请输入字段展示名称，供前端展示使用"
            showCount
            maxLength={30}
          />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea
            className="dispose-textarea-count"
            placeholder="请输入字段描述"
            showCount
            maxLength={200}
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>
        <Form.Item name="inputType" label="输入方式">
          <Radio.Group
            className={cx(styles['radio-group'])}
            options={AGENT_VARIABLES_INPUT_OPTIONS}
            value={inputType}
            onChange={(e) => setInputType(e.target.value as InputTypeEnum)}
          ></Radio.Group>
        </Form.Item>
        {[InputTypeEnum.Select, InputTypeEnum.MultipleSelect].includes(
          inputType,
        ) ? (
          <Tabs defaultActiveKey={OptionDataSourceEnum.MANUAL} items={items} />
        ) : (
          <Form.Item className={cx('mb-16')} name="bindValue" label="默认值">
            <Input.TextArea
              placeholder="请输入默认值"
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
        )}
        <Form.Item name="require">
          <Checkbox>必填</Checkbox>
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateVariableModal;
