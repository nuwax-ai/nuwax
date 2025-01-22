import SelectList from '@/components/SelectList';
import { Form, Modal } from 'antd';
import React from 'react';

interface AgentModelSettingProps {
  open: boolean;
  onCancel: () => void;
}

/**
 * 智能体模型设置组件，待核实交互逻辑以及内容
 */
const AgentModelSetting: React.FC<AgentModelSettingProps> = ({
  open,
  onCancel,
}) => {
  return (
    <Modal title="模型设置" open={open} footer={null} onCancel={onCancel}>
      <Form layout="vertical">
        <Form.Item name="model" label="模型">
          <SelectList onChange={() => {}} options={[]} value={1} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AgentModelSetting;
