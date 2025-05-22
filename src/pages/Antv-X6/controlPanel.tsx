import { ChildNode } from '@/types/interfaces/graph';
import {
  CaretRightOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Button, Popover, Select } from 'antd';
import React, { useState } from 'react';

import StencilContent from './component/stencil';
import { Child } from './type';
interface ControlPanelProps {
  // 拖拽节点到画布
  dragChild: (
    child: Child,
    position?: React.DragEvent<HTMLDivElement>,
    continueDragCount?: number,
  ) => void;
  //   试运行
  handleTestRun: () => void;
  // 切换画布大小
  changeGraph: (val: number | string) => void;
  // 当前画布的缩放比例
  zoomSize?: number;
  // 当前正在展示的节点
  foldWrapItem: ChildNode;
}
const options = [
  { label: '放大 10%', value: '+' },
  { label: '缩小 10%', value: '-' },
  { label: '缩放到适配', value: -1 },
  //添加分割线
  {
    label: (
      <div
        style={{
          borderTop: '1px solid #d9d9d9',
          marginTop: '15px',
          height: 0,
          width: '90%',
          marginLeft: '5%',
        }}
      />
    ),
    value: 'divider',
    disabled: true,
    style: { padding: 0, cursor: 'default' },
  },
  { label: '缩放到 50%', value: 0.5 },
  { label: '缩放到 100%', value: 1 },
  { label: '缩放到 150%', value: 1.5 },
  { label: '缩放到 200%', value: 2 },
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  zoomSize = 1,
  dragChild,
  handleTestRun,
  changeGraph,
  foldWrapItem,
}) => {
  const [open, setOpen] = useState(false);
  const [continueDragCount, setContinueDragCount] = useState(0);
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    setContinueDragCount(0);
  };
  return (
    <>
      <div className="absolute-box">
        <Select
          options={options}
          value={`${Math.floor(zoomSize * 100)}%`}
          onChange={(val) => {
            let newVal;
            if (typeof val === 'string' && ['+', '-'].includes(val)) {
              const factor = val === '+' ? 0.1 : -0.1;
              const _val = zoomSize + factor;
              newVal = _val > 3 ? 3 : _val < 0.2 ? 0.2 : _val;
              //保留两位小数
              newVal = Math.floor(newVal * 100) / 100;
            } else {
              newVal = val;
            }
            changeGraph(Number(newVal));
          }}
          style={{ width: 80, marginRight: 12, height: 28 }}
          popupMatchSelectWidth={false}
          optionLabelProp="displayValue"
          size="small"
        />
        {/* <HomeOutlined /> */}
        <Popover
          content={
            <StencilContent
              isLoop={foldWrapItem.type === 'Loop'}
              dragChild={(
                child: Child,
                position?: React.DragEvent<HTMLDivElement>,
              ) => {
                setContinueDragCount(continueDragCount + 1);
                dragChild(child, position, continueDragCount);
                // setOpen(false);
              }}
            />
          }
          trigger={['click']} // 支持 hover 和 click 触发
          open={open}
          onOpenChange={handleOpenChange}
        >
          <Button
            onMouseEnter={() => setOpen(true)}
            icon={<PlusOutlined />}
            type="primary"
            onClick={() => setOpen(true)}
          >
            添加节点
          </Button>
        </Popover>
      </div>
      <div className="absolute-test">
        <ToolOutlined
          title="调试"
          style={{ paddingRight: 12, paddingLeft: 12 }}
        />
        <Button
          icon={<CaretRightOutlined />}
          variant="solid"
          color="green"
          onClick={handleTestRun}
        >
          试运行
        </Button>
      </div>
    </>
  );
};

export default ControlPanel;
