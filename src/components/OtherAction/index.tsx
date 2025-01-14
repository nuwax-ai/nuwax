import { DashOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import React from 'react';
interface OtherOperationsProps {
  //   提交方法给父组件
  onChange: (val: string) => void;
  // 试运行
  testRun?: boolean;
}

// 其他操作，主要是试运行和重命名，创建副本和删除
const OtherOperations: React.FC<OtherOperationsProps> = ({
  onChange,
  testRun,
}) => {
  const changeNode = (val: string) => {
    // 检查 onChange 是否存在并且是一个函数
    onChange(val);
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
    <div className="dis-left">
      {/* 试运行 */}
      {testRun && (
        <Popover placement="top" content={'测试该节点'}>
          <PlayCircleOutlined style={{ marginRight: '10px' }} />
        </Popover>
      )}
      {/* 节点操作 */}
      <Popover content={content} trigger="hover">
        <DashOutlined />
      </Popover>
    </div>
  );
};

export default OtherOperations;
