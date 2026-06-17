import { dict } from '@/services/i18nRuntime';
import { NodeTypeEnum } from '@/types/enums/common';
import { CaretRightFilled, EllipsisOutlined } from '@ant-design/icons';
import { App, Button, Popover } from 'antd';
import React from 'react';
interface OtherOperationsProps {
  //   提交方法给父组件
  onChange: (val: string) => void;
  // 试运行
  testRun?: boolean;
  // 是否有操作节点的按钮
  action?: boolean;
  // 节点类型
  nodeType: string;
}

// 其他操作，主要是试运行和重命名，创建副本和删除
const OtherOperations: React.FC<OtherOperationsProps> = ({
  onChange,
  testRun,
  action,
  nodeType,
}) => {
  const { modal } = App.useApp();
  const [popoverVisible, setPopoverVisible] = React.useState(false);
  const isLoopNode = nodeType === NodeTypeEnum.Loop; // 循环节点不支持创建副本

  const changeNode = (val: string) => {
    // 只有删除循环节点时才需要确认
    if (isLoopNode && val === 'Delete') {
      modal.confirm({
        title: dict('PC.Components.OtherAction.confirmDeleteLoopNode'),
        okText: dict('PC.Common.Global.confirm'),
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: () => {
          onChange(val);
          setPopoverVisible(false); // 关闭Popover
        },
      });
      return;
    }
    onChange(val);
    setPopoverVisible(false); // 关闭Popover
  };
  const content = (
    <>
      <p
        key="rename"
        onClick={() => changeNode('Rename')}
        className="cursor-pointer"
        style={{ padding: '3px 0' }}
      >
        {dict('PC.Components.OtherAction.rename')}
      </p>
      {!isLoopNode && (
        <p
          key="duplicate"
          onClick={() => changeNode('Duplicate')}
          className="cursor-pointer"
          style={{ padding: '3px 0' }}
        >
          {dict('PC.Components.OtherAction.createCopy')}
        </p>
      )}
      <p
        key="delete"
        onClick={() => changeNode('Delete')}
        className="cursor-pointer"
        style={{ padding: '3px 0' }}
      >
        {dict('PC.Common.Global.delete')}
      </p>
    </>
  );

  return (
    <div className="dis-left">
      {/* 试运行 */}
      {testRun && (
        <Popover
          placement="top"
          content={dict('PC.Components.OtherAction.testNode')}
        >
          <Button
            type="text"
            icon={<CaretRightFilled />}
            style={{ marginRight: '6px', fontSize: '12px' }}
            size="small"
            onClick={() => changeNode('TestRun')}
          />
        </Popover>
      )}
      {/* 节点操作 */}
      {action && (
        <Popover
          content={content}
          trigger="click"
          open={popoverVisible}
          onOpenChange={(visible) => setPopoverVisible(visible)}
        >
          <Button
            type="text"
            icon={<EllipsisOutlined />}
            style={{ marginRight: '6px', fontSize: '12px' }}
            size="small"
            onClick={() => setPopoverVisible(true)}
          />
        </Popover>
      )}
    </div>
  );
};

export default OtherOperations;
