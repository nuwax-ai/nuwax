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
  dragChild: (child: Child, e?: React.DragEvent<HTMLDivElement>) => void;
  //   试运行
  handleTestRun: () => void;
  // 切换画布大小
  changeGraph: (val: number) => void;
}

const options = [
  { label: '缩放到50%', value: 0.5 },
  { label: '缩放到100%', value: 1 },
  { label: '缩放到150%', value: 1.5 },
  { label: '缩放到200%', value: 2 },
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  dragChild,
  handleTestRun,
  changeGraph,
}) => (
  <>
    <div className="absolute-box">
      <Select
        options={options}
        defaultValue={1}
        /* ...其他属性 */ onChange={changeGraph}
        style={{ width: 120 }}
      />
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
      <ToolOutlined title="调试" />
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
