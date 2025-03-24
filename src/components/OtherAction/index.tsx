import { DashOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import React from 'react';
interface OtherOperationsProps {
  //   提交方法给父组件
  onChange: (val: string) => void;
  // 试运行
  testRun?: boolean;
  // 是否有操作节点的按钮
  action?: boolean;
}

// 其他操作，主要是试运行和重命名，创建副本和删除
const OtherOperations: React.FC<OtherOperationsProps> = ({
  onChange,
  testRun,
  action,
}) => {
  const [popoverVisible, setPopoverVisible] = React.useState(false);

  const changeNode = (val: string) => {
    onChange(val);
    setPopoverVisible(false); // 关闭Popover
  };

  const content = (
    <>
      <p onClick={() => changeNode('Rename')} className="cursor-pointer">
        重命名
      </p>
      <p onClick={() => changeNode('Duplicate')} className="cursor-pointer">
        创建副本
      </p>
      <p onClick={() => changeNode('Delete')} className="cursor-pointer">
        删除
      </p>
    </>
  );

  return (
    <div className="dis-left" style={{ marginRight: '6px' }}>
      {/* 试运行 */}
      {testRun && (
        <Popover placement="top" content={'测试该节点'}>
          <PlayCircleOutlined
            style={{ marginRight: '10px' }}
            onClick={() => changeNode('TestRun')}
          />
        </Popover>
      )}
      {/* 节点操作 */}
      {action && (
        <Popover
          content={content}
          trigger="click"
          visible={popoverVisible}
          onVisibleChange={(visible) => setPopoverVisible(visible)}
        >
          <DashOutlined onClick={() => setPopoverVisible(true)} />
        </Popover>
      )}
    </div>
  );
};

export default OtherOperations;
