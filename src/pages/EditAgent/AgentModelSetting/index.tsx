/*
 * @Author: binxiaolin 18030705033
 * @Date: 2025-01-16 19:28:43
 * @LastEditors: binxiaolin 18030705033
 * @LastEditTime: 2025-01-16 19:29:43
 * @FilePath: \agent-platform-front\src\pages\EditAgent\AgentModelSetting\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import SelectList from '@/components/SelectList';
import { Form, Modal } from 'antd';
// import classNames from 'classnames';
import React from 'react';
// import styles from './index.less';

// const cx = classNames.bind(styles);

interface AgentModelSettingProps {
  open: boolean;
  onCancel: () => void;
}

/**
 * 智能体模型设置组件，待核实交互逻辑以及内容
 * @constructor
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
