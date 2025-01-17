/*
 * @Author: binxiaolin 18030705033
 * @Date: 2025-01-16 15:16:11
 * @LastEditors: binxiaolin 18030705033
 * @LastEditTime: 2025-01-17 10:55:36
 * @FilePath: \agent-platform-front\src\pages\Antv-X6\component\stencil.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import '../index.less';
import { asideList } from '../params';
import { Child } from '../type';

// 定义组件的属性接口，规定了组件接受的属性及其类型
interface Prop {
  // dragChild 是一个回调函数，用于处理拖拽开始事件。
  // 它接收 React 的原生 DragEvent 和当前被拖拽的子项 (Child) 对象作为参数。
  dragChild: (e: React.DragEvent<HTMLDivElement>, child: Child) => void;
}
// StencilContent 组件用于渲染 stencil 内容，并允许用户拖拽子项（Child）到画布上。
const StencilContent = ({ dragChild }: Prop) => {
  /**
   * handleDragStart 处理拖拽开始事件。
   * 当用户开始拖拽时，它会调用父组件传递过来的 dragChild 回调，
   * 并将当前拖拽事件和被拖拽的子项（Child）对象传递给它。
   *
   * @param e - 拖拽事件对象
   * @param child - 被拖拽的子项对象
   */
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    child: Child,
  ) => {
    dragChild(e, child);
  };

  return (
    <div className="stencil-content">
      {/* 输入框用于搜索功能 */}
      <Input placeholder="搜索" prefix={<SearchOutlined />} />
      {/* 渲染 stencil 列表 */}
      <div className="stencil-list-style">
        {asideList.map((item) => (
          <div className="stencil-list-item" key={item.name}>
            {/* 如果有组名，则显示组标题 */}
            {item.name && <p className="stencil-list-title">{item.name}</p>}
            <div className="stencil-list-content">
              {/* 渲染该组内的所有子项 */}
              {item.children.map((child) => (
                <div
                  className="child-content"
                  // 确保元素是可拖拽的
                  draggable="true"
                  key={child.type}
                  // 确保元素是可拖拽的
                  onDragEnd={(e) => handleDragStart(e, child)}
                >
                  {child.icon}
                  <span>{child.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StencilContent;
