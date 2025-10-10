import databaseImage from '@/assets/images/database_image.png';
import { TableHeaderProps } from '@/types/interfaces/dataTable';
import { jumpBack } from '@/utils/router';
import { EditOutlined, LeftOutlined } from '@ant-design/icons';
import { Tag } from 'antd';
import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

// 数据表头部组件
const TableHeader: React.FC<TableHeaderProps> = ({
  spaceId,
  tableDetail,
  total,
  onClick,
}) => {
  return (
    <header className={cx('dis-left', styles['database-header'])}>
      <LeftOutlined
        className={cx(styles['icon-back'])}
        onClick={() => jumpBack(`/space/${spaceId}/library`)}
      />
      <img
        className={cx(styles.logo)}
        src={tableDetail?.icon || databaseImage}
        alt=""
      />
      <div>
        <div className={cx('dis-left', styles['database-header-title'])}>
          <h3 className={cx(styles.name)}>{tableDetail?.tableName}</h3>
          <EditOutlined
            className="cursor-pointer hover-box"
            onClick={onClick}
            style={{ fontSize: 16 }}
          />
          <Tag className={cx(styles['tag-style'])}>{`${total}条记录`}</Tag>
        </div>
      </div>
    </header>
  );
};

export default TableHeader;
