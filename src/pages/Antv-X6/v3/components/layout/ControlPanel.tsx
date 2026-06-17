import { t } from '@/services/i18nRuntime';
import { NodeTypeEnum } from '@/types/enums/common';
import { ChildNode, StencilChildNode } from '@/types/interfaces/graph';
import {
  CaretRightOutlined,
  CompressOutlined,
  MinusOutlined,
  PlusOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Button, Popover, Select } from 'antd';
import React, { useState } from 'react';

import StencilContent from './Sidebar';
interface ControlPanelProps {
  // 拖拽节点到画布
  dragChild: (
    child: StencilChildNode,
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
  // 试运行loading
  testRunLoading: boolean;
}
const options = [
  { label: t('PC.Pages.AntvX6ControlPanel.zoomIn10Percent'), value: '+' },
  {
    label: t('PC.Pages.AntvX6ControlPanel.zoomOut10Percent'),
    value: '-',
  },
  { label: t('PC.Pages.AntvX6ControlPanel.fitCanvas'), value: -1 },
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
  { label: t('PC.Pages.AntvX6ControlPanel.zoom50Percent'), value: 0.5 },
  { label: t('PC.Pages.AntvX6ControlPanel.zoom100Percent'), value: 1 },
  { label: t('PC.Pages.AntvX6ControlPanel.zoom150Percent'), value: 1.5 },
  { label: t('PC.Pages.AntvX6ControlPanel.zoom200Percent'), value: 2 },
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  zoomSize = 1,
  dragChild,
  handleTestRun,
  changeGraph,
  foldWrapItem,
  testRunLoading,
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
        <div className="action-section">
          <Button
            type="text"
            style={{ marginRight: 2 }}
            icon={<MinusOutlined />}
            onClick={() => {
              const factor = -10;
              const currentPercent = Math.round(zoomSize * 100);
              const newPercent = currentPercent + factor;
              const clampedPercent = Math.max(20, Math.min(300, newPercent));
              const newVal = clampedPercent / 100;
              changeGraph(Number(newVal));
            }}
          />
          <Select
            options={options}
            value={`${Math.round(zoomSize * 100)}%`}
            onChange={(val) => {
              let newVal;
              if (typeof val === 'string' && ['+', '-'].includes(val)) {
                const factor = val === '+' ? 10 : -10;
                const currentPercent = Math.round(zoomSize * 100);
                const newPercent = currentPercent + factor;

                const clampedPercent = Math.max(20, Math.min(300, newPercent));
                newVal = clampedPercent / 100;
              } else {
                newVal = val;
              }
              changeGraph(Number(newVal));
            }}
            style={{ width: 80, marginRight: 2, height: 28 }}
            popupMatchSelectWidth={false}
            optionLabelProp="displayValue"
            size="small"
          />
          <Button
            type="text"
            style={{ marginRight: 12 }}
            icon={<PlusOutlined />}
            onClick={() => {
              const factor = 10;
              const currentPercent = Math.round(zoomSize * 100);
              const newPercent = currentPercent + factor;
              const clampedPercent = Math.max(20, Math.min(300, newPercent));
              const newVal = clampedPercent / 100;
              changeGraph(Number(newVal));
            }}
          />
          {/* 添加缩放到适配画布 */}
          <Popover
            content={t('PC.Pages.AntvX6ControlPanel.fitCanvas')}
            trigger={['hover']}
            mouseEnterDelay={1}
          >
            <Button
              type="text"
              style={{ marginRight: 12 }}
              icon={<CompressOutlined />}
              onClick={() => changeGraph(-1)}
            />
          </Popover>
          <Popover
            content={
              <StencilContent
                isLoop={foldWrapItem.type === NodeTypeEnum.Loop}
                dragChild={(
                  child: StencilChildNode,
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
              {t('PC.Pages.AntvX6ControlPanel.addNode')}
            </Button>
          </Popover>
        </div>
        <div className="action-section" style={{ marginLeft: 18 }}>
          <ToolOutlined
            title={t('PC.Pages.AntvX6ControlPanel.debug')}
            style={{ paddingRight: 12, paddingLeft: 12 }}
          />
          <Button
            loading={testRunLoading}
            icon={<CaretRightOutlined />}
            variant="solid"
            color="green"
            onClick={handleTestRun}
          >
            {t('PC.Pages.AntvX6ControlPanel.testRun')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ControlPanel;
