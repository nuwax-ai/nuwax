import knowledgeImage from '@/assets/images/database_image.png';
import { jumpBack } from '@/utils/router';
import { EditOutlined, LeftOutlined } from '@ant-design/icons';
import { Tag } from 'antd';

export interface TableHeaderProps {
  spaceId: number;
  tableDetail: any;
  total: number;
  onClick: () => void;
}

// 数据表头部组件
const TableHeader: React.FC<TableHeaderProps> = ({
  spaceId,
  tableDetail,
  total,
  onClick,
}) => {
  return (
    <div className="database-header dis-left">
      <LeftOutlined
        className="icon-back"
        onClick={() => jumpBack(`/space/${spaceId}/library`)}
      />
      <img className="logo" src={tableDetail?.icon || knowledgeImage} alt="" />
      <div>
        <div className="dis-left database-header-title">
          <h3 className="name ">{tableDetail?.tableName}</h3>
          <EditOutlined
            className="cursor-pointer hover-box"
            onClick={onClick}
          />
        </div>
        <Tag className="tag-style">{`${total}条记录`}</Tag>
      </div>
    </div>
  );
};

export default TableHeader;
