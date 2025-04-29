import { ChildNode } from '@/types/interfaces/graph';
// import { SearchOutlined } from '@ant-design/icons';
// import { Input } from 'antd';
import '../index.less';
import { asideList } from '../params';
import { Child } from '../type';
// 定义组件的属性接口，规定了组件接受的属性及其类型
interface Prop {
  // 当前正在展示的节点
  foldWrapItem: ChildNode;
  // dragChild 是一个回调函数，用于处理拖拽开始事件。
  // 它接收 React 的原生 DragEvent 和当前被拖拽的子项 (Child) 对象作为参数。
  dragChild: (child: Child, e?: React.DragEvent<HTMLDivElement>) => void;
}
// StencilContent 组件用于渲染 stencil 内容，并允许用户拖拽子项（Child）到画布上。
const StencilContent = ({ dragChild, foldWrapItem }: Prop) => {
  /**
   * handleDragStart 处理拖拽开始事件。
   * 当用户开始拖拽时，它会调用父组件传递过来的 dragChild 回调，
   * 并将当前拖拽事件和被拖拽的子项（Child）对象传递给它。
   *
   * @param e - 拖拽事件对象
   * @param child - 被拖拽的子项对象
   */
  const handleDragStart = (
    child: Child,
    e?: React.DragEvent<HTMLDivElement>,
  ) => {
    dragChild(child, e);
  };

  return (
    <div className="stencil-content">
      {/* 输入框用于搜索功能 */}
      {/* <Input placeholder="搜索" prefix={<SearchOutlined />} /> */}
      <p className="stencil-title">节点选择</p>
      {/* 渲染 stencil 列表 */}
      <div className="stencil-list-style">
        {asideList.map((item) => (
          <div className="stencil-list-item" key={item.name}>
            {/* 如果有组名，则显示组标题 */}
            {item.name && <p className="stencil-list-title">{item.name}</p>}
            <div className="stencil-list-content">
              {/* 渲染该组内的所有子项 */}
              {item.children.map((child) => {
                // 特殊类型处理：LoopBreak/LoopContinue 只在 Loop 节点时显示
                const isLoopControl = ['LoopBreak', 'LoopContinue'].includes(
                  child.type,
                );
                const shouldShow = isLoopControl
                  ? foldWrapItem.type === 'Loop'
                  : true;
                return (
                  shouldShow && (
                    <div
                      className="child-content dis-left"
                      draggable="true"
                      key={child.type}
                      onDragEnd={(e) => handleDragStart(child, e)}
                      onClick={() => handleDragStart(child)}
                    >
                      <div className="icon-box-style">{child.icon}</div>
                      <span>{child.name}</span>
                    </div>
                  )
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StencilContent;
