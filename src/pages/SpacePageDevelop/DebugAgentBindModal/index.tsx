import SelectList from '@/components/custom/SelectList';
import CustomFormModal from '@/components/CustomFormModal';
import { apiAgentConfigList } from '@/services/agentConfig';
import { apiCustomPageBindDevAgent } from '@/services/pageDev';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { option } from '@/types/interfaces/common';
import { DebugAgentBindModalProps } from '@/types/interfaces/pageDev';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, FormProps, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';

/**
 * 调试智能体绑定弹窗
 */
const DebugAgentBindModal: React.FC<DebugAgentBindModalProps> = ({
  spaceId,
  defaultDevAgentId,
  projectId,
  open,
  onCancel,
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
      if (defaultDevAgentId) {
        form.setFieldsValue({
          devAgentId: defaultDevAgentId,
        });
      }
    },
  });

  // 绑定开发智能体
  const { run: runCustomPageBindDevAgent } = useRequest(
    apiCustomPageBindDevAgent,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        message.success('绑定成功');
        setLoading(false);
        // 关闭弹窗
        onCancel();
        // 选择调试智能体后，跳转到开发页面
        history.push(`/app-dev?projectId=${projectId}`);
      },
      onError: () => {
        message.error('绑定失败');
        setLoading(false);
      },
    },
  );

  useEffect(() => {
    if (open) {
      runAgentList(spaceId);
    }
  }, [open, spaceId]);

  // 调试智能体绑定
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    setLoading(true);
    runCustomPageBindDevAgent({
      projectId,
      spaceId,
      ...values,
    });
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
        <Form.Item
          name="devAgentId"
          rules={[{ required: true, message: '请选择一个用于调试的智能体' }]}
        >
          <SelectList
            placeholder="请选择一个用于调试的智能体"
            options={agentList}
            dropdownRenderComponent={
              <div className="px-16 py-16">
                <Button
                  type="primary"
                  onClick={handleCreateAgent}
                  icon={<PlusOutlined />}
                >
                  创建智能体
                </Button>
              </div>
            }
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default DebugAgentBindModal;
