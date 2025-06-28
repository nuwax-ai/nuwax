import { customizeRequiredMark } from '@/utils/form';
import {
  Cascader,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
} from 'antd';
import React from 'react';
import './index.less';
import type { FormItem } from './type';
// // 定义ref的类型
// export interface AddAndModifyRef {
//   onShow: (
//     title: string,
//     formList: FormItem[],
//     initialValues?: any,
//   ) => void;
//   onClose: () => void;
//   stopLoading: () => void;
// }

export interface AddAndModifyProps {
  open: boolean;
  title: string;
  loading?: boolean;
  onSubmit: (values: { [key: string]: string | number | boolean }) => void; // 提交表单的回调函数
  // 初始化的值
  initialValues?: {
    [key: string]: string | number | boolean;
  };
  formList: FormItem[];
  onClose: () => void;
}

// 新增和修改的组件
const AddAndModify: React.FC<AddAndModifyProps> = ({
  open,
  title,
  loading,
  onSubmit,
  initialValues,
  formList,
  onClose,
}) => {
  // 打开与关闭当前组件
  // const [open, setOpen] = useState<boolean>(false);
  // 当前初始化的值
  // const [initialValues, setInitialValues] = useState<any>({});
  // 当前组件的title
  // const [title, setTitle] = useState<string>('新增');
  // // 表单渲染的数据格式
  // const [formList, setFormList] = useState<FormItem[]>([]);
  // loading状态
  // const [confirmLoading, setConfirmLoading] = useState(false);
  const [form] = Form.useForm();

  const inputNode = (item: FormItem) => {
    if (item.isSpan) {
      return (
        <span className="disabled-field">
          {initialValues?.[item.name] || item.name}
        </span>
      );
    } else {
      switch (item.type) {
        case 'Checkbox':
          return <Checkbox.Group options={item.options} />;
        case 'DatePicker':
          return (
            <DatePicker
              showTime
              placeholder={item.placeholder || '请选择时间'}
            />
          );
        case 'RangePicker':
          return <DatePicker.RangePicker />;
        case 'Select':
          return (
            <Select
              options={item.options}
              placeholder={item.placeholder || '请选择'}
            />
          );
        case 'TextArea':
          return (
            <Input.TextArea
              placeholder={item.placeholder || '请输入'}
              className="dispose-textarea-count"
              showCount
              maxLength={item.maxLength || 30}
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          );
        case 'Cascader':
          return (
            <Cascader
              options={item.options}
              placeholder={item.placeholder || '请选择'}
            />
          );
        case 'Radio':
          return <Radio.Group options={item.options} />;
        // case 'Upload':
        //   return <Radio.Group options={item.options} />;
        case 'Number':
          return <InputNumber />;
        default:
          return (
            <Input
              showCount
              maxLength={item.maxLength || 30}
              placeholder={item.placeholder || '请输入'}
            />
          );
      }
    }
  };

  const getValuePropName = (type: string) => {
    switch (type) {
      case 'Checkbox':
        return 'checked';
      case 'Upload':
        return 'fileList';
      default:
        return 'value';
    }
  };

  const onFinish = (values: { [key: string]: string | number | boolean }) => {
    // setConfirmLoading(true);
    onSubmit(values);
  };

  // const onShow = (
  //   title: string,
  //   formList: FormItem[],
  //   initialValues?: any,
  // ) => {
  //   form.resetFields();
  //   setTitle(title);
  //   setFormList(formList);

  //   if (initialValues) {
  //     // 根据formList，找出type为DatePicker的字段，将值转换为dayjs对象
  //     formList.forEach((item) => {
  //       if (item.type === 'DatePicker' && initialValues[item.name]) {
  //         initialValues[item.name] = dayjs(
  //           initialValues[item.name],
  //         );
  //       }
  //     });
  //     setInitialValues(initialValues);
  //     form.setFieldsValue(initialValues);
  //   } else {
  //     setInitialValues({});
  //     form.setFieldsValue({});
  //   }
  //   setOpen(true);
  // };

  // const onClose = () => {
  //   Modal.destroyAll();
  //   setConfirmLoading(false);
  //   setOpen(false);
  // };

  // // 结束loading
  // const stopLoading = () => {
  //   setConfirmLoading(!confirmLoading);
  // };
  // 使用useImperativeHandle暴露方法
  // useImperativeHandle(ref, () => ({
  //   onShow,
  //   onClose,
  //   stopLoading,
  // }));

  return (
    <Modal
      title={title}
      open={open}
      onOk={() => {
        form.submit();
      }}
      onCancel={() => {
        // form.resetFields();
        onClose();
      }}
      // width={width}
      okText="提交"
      cancelText="取消"
      confirmLoading={loading}
      className="add-modal-style"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        // onFinishFailed={() => setConfirmLoading(false)}
        requiredMark={customizeRequiredMark}
        className="add-modify-form"
      >
        {formList.map((item, index) => {
          return (
            <Form.Item
              key={index}
              name={item.name}
              label={item.label}
              valuePropName={getValuePropName(item.type)}
              rules={item.rules}
            >
              {inputNode(item)}
            </Form.Item>
          );
        })}
      </Form>
    </Modal>
  );
};

export default AddAndModify;
