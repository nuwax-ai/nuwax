import React from 'react';

/**
 * 树列头组件的Props接口
 */
interface TreeColumnHeaderProps {
  /** 是否显示必填复选框 */
  showCheck?: boolean;
  /** 是否为body类型 */
  isBody?: boolean;
}

/**
 * 树列头组件
 * 负责渲染树的列标题，包括变量名、变量类型等
 */
const TreeColumnHeader: React.FC<TreeColumnHeaderProps> = ({
  showCheck,
  isBody,
}) => {
  return (
    <div className={'dis-left font-12 mb-6 font-color-gray07'}>
      <span className="flex-1 ">变量名</span>
      <span
        style={{
          width: 80 + (showCheck ? 60 : 50) + (isBody ? 62 : 0),
        }}
      >
        变量类型
      </span>
    </div>
  );
};

export default TreeColumnHeader;
