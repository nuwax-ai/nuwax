import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { DataTableProps } from '@/types/interfaces/workflow';
import { getImg } from '@/utils/workflow';
import './index.less';
const DataTable: React.FC<DataTableProps> = ({
  icon,
  name,
  description,
  showParams,
  params,
}) => {
  return (
    <div>
      <div className="skill-item-style  dis-sb">
        <div className="dis-left">
          <img
            src={
              !icon || icon === '' ? getImg(AgentComponentTypeEnum.Table) : icon
            }
            alt=""
            className="skill-item-icon"
          />
          <div className="skill-item-content-style">
            <div className="skill-item-title-style">{name}</div>
            <div className="skill-item-desc-style">{description}</div>
          </div>
        </div>
      </div>
      {showParams && params && (
        <div className="dis-wrap-sa margin-bottom">
          {params?.map((item) => (
            <div className="database-tag-style" key={item}>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataTable;
