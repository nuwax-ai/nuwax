// import { SearchOutlined } from '@ant-design/icons';
// import { Input } from 'antd';
import { t } from '@/services/i18nRuntime';
import { NodeTypeEnum } from '@/types/enums/common';
import { StencilChildNode } from '@/types/interfaces/graph';
import '../../indexV3.less';
import { asideList } from '../../ParamsV3';
// Component props definition.
interface Prop {
  // Current node list entry being rendered.
  // dragChild handles drag/click to create nodes on canvas.
  dragChild: (
    child: StencilChildNode,
    position?: React.DragEvent<HTMLDivElement>,
  ) => void;
  isLoop?: boolean;
  // Current port name.
  portName?: string;
}
const renderIcon = (url: string) => {
  return (
    <div
      className="icon-box-style"
      style={{
        width: '20px',
        height: '20px',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        ...(url && { backgroundImage: `url("${url}")` }),
      }}
    ></div>
  );
};

// Render stencil panel and allow dragging child nodes onto canvas.
const StencilContent = ({ dragChild, isLoop = false }: Prop) => {
  /**
   * Handle drag start.
   * Calls parent `dragChild` with current event and child node.
   *
   * @param e - drag event
   * @param child - dragged child node
   */
  const handleDragStart = (
    child: StencilChildNode,
    position?: React.DragEvent<HTMLDivElement>,
  ) => {
    dragChild(child, position);
  };

  return (
    <div className="stencil-content">
      {/* Search input placeholder */}
      {/* <Input placeholder="Search" prefix={<SearchOutlined />} /> */}
      <p className="stencil-title">
        {t('PC.Pages.AntvX6Stencil.nodeSelectorTitle')}
      </p>
      {/* Render stencil list */}
      <div className="stencil-list-style">
        {asideList.map((item) => (
          <div className="stencil-list-item" key={item.name}>
            {/* Show group title if present */}
            {item.name && <p className="stencil-list-title">{item.name}</p>}
            <div className="stencil-list-content">
              {/* Render group children, skip Loop node inside loop context */}
              {item.children
                .filter((child) =>
                  isLoop ? child.type !== NodeTypeEnum.Loop : true,
                )
                .map((child) => {
                  // Show LoopBreak/LoopContinue only in Loop context.
                  const isLoopControl = [
                    NodeTypeEnum.LoopBreak,
                    NodeTypeEnum.LoopContinue,
                  ].includes(child?.type || '');
                  const shouldShow = isLoopControl ? isLoop : true;
                  return (
                    shouldShow && (
                      <div
                        className="child-content dis-left"
                        draggable="true"
                        key={child.type}
                        onDragEnd={(e) => handleDragStart(child, e)}
                        onClick={() => handleDragStart(child)}
                      >
                        {renderIcon(child.bgIcon || '')}
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
