import SelectList from '@/components/custom/SelectList';
import CustomFormModal from '@/components/CustomFormModal';
import { Form, FormProps } from 'antd';
// import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
// import styles from './index.less';

// const cx = classNames.bind(styles);

interface DebugAgentBindModelProps {
  spaceId: number;
  open: boolean;
  onCancel: () => void;
  onConfirm: (result: number) => void;
}

/**
 * 调试智能体绑定弹窗
 */
const DebugAgentBindModel: React.FC<DebugAgentBindModelProps> = ({
  spaceId,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);

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
    console.log('open', spaceId);
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

  return (
    <CustomFormModal
      form={form}
      title="调试智能体绑定"
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
        <Form.Item name="name">
          <SelectList
            placeholder="请选择调试智能体"
            options={[
              { label: '模型1', value: 1 },
              { label: '模型2', value: 2 },
            ]}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default DebugAgentBindModel;
