import { InputTypeEnum } from '@/types/enums/agent';
import { BindConfigWithSub } from '@/types/interfaces/agent';
import { NewConversationSetProps } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { Button, Cascader, Form, FormProps, Input, InputNumber } from 'antd';
import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import ConditionRender from '../ConditionRender';
import styles from './index.less';

const cx = classNames.bind(styles);

const { SHOW_CHILD } = Cascader;

// 新对话设置组件
const NewConversationSet: React.FC<NewConversationSetProps> = ({
  className,
  form,
  disabled = false,
  showSubmitButton = false,
  variables,
  onConfirm,
}) => {
  // 是否打开表单
  const [isOpen, setIsOpen] = useState<boolean>(true);
  // 是否已填写表单
  const isFilled = useRef<boolean>(false);

  if (!variables?.length) {
    return null;
  }

  const onFinish: FormProps<Record<string, string | number>>['onFinish'] = (
    values,
  ) => {
    setIsOpen(false);
    isFilled.current = true;
    onConfirm?.(values);
  };

  // 对话容器样式
  const _className = isOpen
    ? styles['conversation-container']
    : isFilled.current
    ? styles['close-form']
    : null;

  // 根据输入方式获取内容
  const getContent = (item: BindConfigWithSub) => {
    const { inputType, description } = item;
    // 是否单选、多选
    const isSelect = [
      InputTypeEnum.Select,
      InputTypeEnum.MultipleSelect,
    ].includes(inputType as InputTypeEnum);
    let content;
    // 输入方式
    switch (inputType) {
      // 单行文本
      case InputTypeEnum.Text:
        content = (
          <Input
            variant="filled"
            placeholder={description || '请输入'}
            allowClear
          />
        );
        break;
      // 段落、智能识别
      case InputTypeEnum.Paragraph:
      case InputTypeEnum.AutoRecognition:
        content = (
          <Input.TextArea
            variant="filled"
            placeholder={description || '请输入'}
            allowClear
          />
        );
        break;
      // 数字
      case InputTypeEnum.Number:
        content = (
          <InputNumber
            variant="filled"
            className="w-full"
            placeholder={description || '请输入'}
          />
        );
        break;
      // 单选、多选
      case InputTypeEnum.Select:
      case InputTypeEnum.MultipleSelect:
        content = (
          <Cascader
            variant="filled"
            multiple={inputType === InputTypeEnum.MultipleSelect}
            maxTagCount="responsive"
            showCheckedStrategy={SHOW_CHILD}
            placeholder={description || '请选择'}
            options={item.selectConfig?.options || []}
            allowClear
          />
        );
        break;
      default:
        content = <Input placeholder={description || '请输入'} allowClear />;
    }

    return { isSelect, content };
  };
  return (
    <div className={cx(styles['variables-box'], className)}>
      <header
        className={cx(styles.header, 'flex', 'items-center', 'content-between')}
      >
        <span>新对话设置</span>
        <ConditionRender condition={isFilled.current}>
          <span
            className={cx(styles.text, 'cursor-pointer')}
            onClick={() => setIsOpen(!isOpen)}
          >
            {!isOpen ? '编辑' : '关闭'}
          </span>
        </ConditionRender>
      </header>
      <div className={cx(_className, styles['form-box'])}>
        <Form
          form={form}
          disabled={disabled}
          preserve={false}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={customizeRequiredMark}
          autoComplete="off"
        >
          {variables?.map((item: BindConfigWithSub) => {
            const { name, displayName, require, key } = item;
            const { isSelect, content } = getContent(item);
            return (
              <Form.Item
                key={key}
                name={name}
                label={displayName}
                rules={[
                  {
                    required: require,
                    message: `请${isSelect ? '选择' : '输入'}${displayName}`,
                  },
                ]}
              >
                {content}
              </Form.Item>
            );
          })}
          <ConditionRender condition={showSubmitButton}>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                开始对话
              </Button>
            </Form.Item>
          </ConditionRender>
        </Form>
      </div>
    </div>
  );
};

export default NewConversationSet;
