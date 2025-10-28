import { TableFieldInfo } from '@/types/interfaces/dataTable';
import { Tooltip } from 'antd';
import { PropsWithChildren } from 'react';

export interface ClearDataTooltipProps {
  record: TableFieldInfo;
  existTableDataFlag?: boolean;
}

const ClearDataTooltip: React.FC<PropsWithChildren<ClearDataTooltipProps>> = ({
  record,
  existTableDataFlag,
  children,
}) => {
  const disabled =
    record?.systemFieldFlag || (!record?.isNew && existTableDataFlag);
  if (!disabled) {
    return children;
  }
  return <Tooltip title="清空表数据后,可修改">{children}</Tooltip>;
};

export default ClearDataTooltip;
