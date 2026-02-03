import TooltipIcon from '@/components/custom/TooltipIcon';
import McpCollapseComponentItem from '@/components/McpCollapseComponentList/McpCollapseComponentItem';
import { McpConfigComponentInfo } from '@/types/interfaces/mcp';
import { DeleteOutlined } from '@ant-design/icons';

export interface SelectTargetFormItemTargetProps {
  value?: McpConfigComponentInfo;
  onDelete?: (value: McpConfigComponentInfo) => void;
}
const SelectTargetFormItemTarget: React.FC<SelectTargetFormItemTargetProps> = ({
  value,
  onDelete,
}) => {
  if (!value) return null;
  return (
    <McpCollapseComponentItem
      componentInfo={value}
      extra={
        onDelete ? (
          <TooltipIcon
            title="删除"
            icon={<DeleteOutlined className={'cursor-pointer'} />}
            onClick={() => onDelete?.(value)}
          />
        ) : null
      }
    />
  );
};

export default SelectTargetFormItemTarget;
