import {
  CaretRightOutlined,
  HomeOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Button, Popover, Select } from 'antd';
import React from 'react';
import StencilContent from './component/stencil';
import { Child } from './type';

interface ControlPanelProps {
  // 拖拽节点到画布
  dragChild: (e: React.DragEvent<HTMLDivElement>, child: Child) => void;
  //   试运行
  handleTestRun: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  dragChild,
  handleTestRun,
}) => (
  <>
    <div className="absolute-box">
      <Select defaultValue="lucy" /* ...其他属性 */ />
      <HomeOutlined />
      <Popover
        content={<StencilContent dragChild={dragChild} />}
        trigger="click"
      >
        <Button icon={<PlusOutlined />} type="primary">
          添加节点
        </Button>
      </Popover>
    </div>
    <div className="absolute-test">
      <ToolOutlined />
      <Button
        icon={<CaretRightOutlined />}
        type="primary"
        onClick={handleTestRun}
      >
        试运行
      </Button>
    </div>
  </>
);

export default ControlPanel;
