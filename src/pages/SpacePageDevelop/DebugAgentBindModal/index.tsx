import SelectList from '@/components/custom/SelectList';
import CustomFormModal from '@/components/CustomFormModal';
import { apiAgentConfigList } from '@/services/agentConfig';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { option } from '@/types/interfaces/common';
import { CreateCustomPageInfo } from '@/types/interfaces/pageDev';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, FormProps } from 'antd';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';

interface DebugAgentBindModalProps {
  spaceId: number;
  devAgentId?: number;
  createCustomPageInfo?: CreateCustomPageInfo | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (result: number) => void;
}

/**
 * 调试智能体绑定弹窗
 */
const DebugAgentBindModal: React.FC<DebugAgentBindModalProps> = ({
  spaceId,
  devAgentId,
  createCustomPageInfo,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  // 智能体列表
  const [agentList, setAgentList] = useState<option[]>([]);

  // 查询空间智能体列表接口
  const { run: runAgentList } = useRequest(apiAgentConfigList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentConfigInfo[]) => {
      const list =
        result?.map((item) => ({
          label: item.name,
          value: item.id,
        })) || [];
      setAgentList(list);
      // 如果调试智能体ID存在，则设置默认值
      if (devAgentId) {
        form.setFieldsValue({
          name: devAgentId,
        });
      }
    },
  });

  useEffect(() => {
    if (open) {
      runAgentList(spaceId);
    }
  }, [open, devAgentId, spaceId]);

  const onFinish: FormProps<any>['onFinish'] = (values) => {
    console.log('onFinish', values);
    setLoading(true);
    // todo: 选择调试智能体后，跳转到开发页面
    console.log('createCustomPageInfo', createCustomPageInfo);
    onConfirm?.(values.name);
    setLoading(false);
  };

  const handlerSubmit = () => {
    form.submit();
  };

  // 创建智能体
  const handleCreateAgent = () => {
    history.push(`/space/${spaceId}/develop`);
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
        preserve={false}
        autoComplete="off"
      >
        <Form.Item name="name">
          <SelectList
            placeholder="请选择一个用于调试的智能体"
            options={agentList}
            dropdownRenderComponent={
              <Button
                type="primary"
                onClick={handleCreateAgent}
                icon={<PlusOutlined />}
              >
                创建智能体
              </Button>
            }
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default DebugAgentBindModal;
