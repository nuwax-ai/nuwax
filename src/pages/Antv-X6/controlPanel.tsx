import { ChildNode } from '@/types/interfaces/graph';
import {
  CaretRightOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Button, Popover, Select } from 'antd';
import React, { useEffect, useState } from 'react';

import StencilContent from './component/stencil';
import { Child } from './type';
interface ControlPanelProps {
  // 拖拽节点到画布
  dragChild: (child: Child, e?: React.DragEvent<HTMLDivElement>) => void;
  //   试运行
  handleTestRun: () => void;
  // 切换画布大小
  changeGraph: (val: number) => void;
  // 当前画布的缩放比例
  zoomSize?: number;
  // 当前正在展示的节点
  foldWrapItem: ChildNode;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  zoomSize = 1,
  dragChild,
  handleTestRun,
  changeGraph,
  foldWrapItem,
}) => {
  const [options, setOptions] = useState([
    { label: '缩放到50%', value: 0.5, displayValue: '50%' },
    { label: '缩放到100%', value: 1, displayValue: '100%' },
    { label: '缩放到150%', value: 1.5, displayValue: '150%' },
    { label: '缩放到200%', value: 2, displayValue: '200%' },
  ]);

  useEffect(() => {
    setOptions((prev) => {
      // 使用函数式更新确保获取最新options
      if (!prev.find((option) => option.value === zoomSize)) {
        return [
          ...prev,
          {
            label: `缩放到${Math.floor(zoomSize * 100)}%`,
            value: zoomSize,
            displayValue: `${Math.floor(zoomSize * 100)}%`,
          },
        ];
      }
      return prev;
    });
  }, [zoomSize]);

  const [open, setOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
  };

  return (
    <>
      <div className="absolute-box">
        <Select
          options={options}
          value={zoomSize}
          onChange={changeGraph}
          style={{ width: 80 }}
          popupMatchSelectWidth={false}
          optionLabelProp="displayValue"
        />
        {/* <HomeOutlined /> */}
        <Popover
          content={
            <StencilContent
              isLoop={foldWrapItem.type === 'Loop'}
              dragChild={(
                child: Child,
                e?: React.DragEvent<HTMLDivElement>,
              ) => {
                dragChild(child, e);
                setOpen(false);
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
};

export default ControlPanel;
