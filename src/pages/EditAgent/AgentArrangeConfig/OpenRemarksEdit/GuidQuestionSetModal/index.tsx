import SelectList from '@/components/custom/SelectList';
import CustomFormModal from '@/components/CustomFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import { Form, FormProps, Input } from 'antd';
// import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
// import styles from './index.less';

// const cx = classNames.bind(styles);

interface GuidQuestionSetModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (result: number) => void;
}

/**
 * 开场白预置问题设置弹窗
 */
const GuidQuestionSetModal: React.FC<GuidQuestionSetModalProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  // 图标
  const [imageUrl, setImageUrl] = useState<string>('');
  // 类型
  const [type, setType] = useState<React.Key>();

  // // 新增智能体接口
  // const { run: runAdd } = useRequest(apiAgentAdd, {
  //   manual: true,
  //   debounceInterval: 300,
  //   onSuccess: (result: number) => {
  //     onConfirm?.(result);
  //     setLoading(false);
  //   },
  //   onError: () => {
  //     setLoading(false);
  //   },
  // });

  const initForm = () => {
    form.setFieldsValue({
      name: 1,
    });
  };

  useEffect(() => {
    if (open) {
      initForm();
    }
  }, [open]);

  const onFinish: FormProps<any>['onFinish'] = (values) => {
    console.log('onFinish', values);
    setLoading(true);
    onConfirm?.(values.name);
    setLoading(false);
  };

  const handlerSubmit = () => {
    form.submit();
  };

  // 上传图标成功
  const handleUploadSuccess = (url: string) => {
    setImageUrl(url);
    form.setFieldValue('icon', url);
  };

  // 切换类型时，根据类型设置对应的表单项
  const handleChangeType = (value: React.Key) => {
    form.setFieldValue('type', value);
    setType(value);
  };

  return (
    <CustomFormModal
      form={form}
      title="预置问题设置"
      open={open}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item name="icon" label="图标">
          <UploadAvatar
            // className={cx(styles['upload-box'])}
            onUploadSuccess={handleUploadSuccess}
            defaultImage={''}
            imageUrl={imageUrl}
            // svgIconName="icons-workspace-knowledge"
          />
        </Form.Item>
        <Form.Item name="displayInfo" label="展示信息">
          <Input placeholder="这里是问题内容" />
        </Form.Item>
        <Form.Item name="type" label="类型">
          <SelectList
            placeholder="请选择类型"
            options={[
              { label: '问题引导', value: 1 },
              { label: '扩展页面路径', value: 2 },
              { label: '外链地址', value: 3 },
            ]}
            onChange={handleChangeType}
          />
        </Form.Item>
        {type === 1 ? (
          <Form.Item name="question" label="问题">
            <Input placeholder="请输入问题" />
          </Form.Item>
        ) : type === 2 ? (
          <Form.Item name="type" label="类型">
            <SelectList
              placeholder="请选择类型"
              options={[
                { label: '问题引导', value: 1 },
                { label: '扩展页面路径', value: 2 },
                { label: '外链地址', value: 3 },
              ]}
              onChange={handleChangeType}
            />
          </Form.Item>
        ) : (
          type === 3 && (
            <Form.Item name="linkUrl" label="链接地址（类型为外链时展示）">
              <Input placeholder="https://xxxxxxx" />
            </Form.Item>
          )
        )}
      </Form>
    </CustomFormModal>
  );
};

export default GuidQuestionSetModal;
