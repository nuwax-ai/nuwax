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
        <TooltipIcon
          title="删除"
          icon={<DeleteOutlined className={'cursor-pointer'} />}
          onClick={() => onDelete?.(value)}
        />
      }
    />
  );
};

export default SelectTargetFormItemTarget;
