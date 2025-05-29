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
  const isLoopNode = nodeType === 'Loop'; // 循环节点不支持创建副本

  const changeNode = (val: string) => {
    if (isLoopNode) {
      //删除先提示
      modal.confirm({
        title: '确定要删除循环节点吗？',
        okText: '确认',
        cancelText: '取消',
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
        onClick={() => changeNode('Rename')}
        className="cursor-pointer"
        style={{ padding: '3px 0' }}
      >
        重命名
      </p>
      {!isLoopNode && (
        <p
          onClick={() => changeNode('Duplicate')}
          className="cursor-pointer"
          style={{ padding: '3px 0' }}
        >
          创建副本
        </p>
      )}
      <p
        onClick={() => changeNode('Delete')}
        className="cursor-pointer"
        style={{ padding: '3px 0' }}
      >
        删除
      </p>
    </>
  );

  return (
    <div className="dis-left">
      {/* 试运行 */}
      {testRun && (
        <Popover placement="top" content={'测试该节点'}>
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
