import { TABLE_TABS_LIST } from '@/constants/dataTable.constants';
import { TableTabsEnum } from '@/types/enums/dataTable';
import { TableOperationBarProps } from '@/types/interfaces/dataTable';
import {
  ClearOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Space, Tabs, Upload } from 'antd';
import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

// 表格操作栏组件
const TableOperationBar: React.FC<TableOperationBarProps> = ({
  activeKey,
  loading,
  importLoading,
  tableData,
  disabledCreateBtn,
  onChangeTabs,
  onRefresh,
  onAddField,
  onSaveTableStructure,
  onClear,
  onChangeFile,
  onExportData,
  onCreateOrEditData,
}) => {
  return (
    <div className="dis-sb">
      <Tabs
        items={TABLE_TABS_LIST}
        activeKey={activeKey}
        onChange={onChangeTabs}
        className={cx(styles['tab-container'])}
      />
      <Space>
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          刷新
        </Button>
        {activeKey === TableTabsEnum.Structure ? (
          <>
            <Button icon={<PlusOutlined />} onClick={onAddField}>
              新增字段
            </Button>
            <Button
              loading={loading}
              icon={<SaveOutlined />}
              onClick={onSaveTableStructure}
            >
              保存
            </Button>
          </>
        ) : (
          <>
            <Button
              icon={<ClearOutlined />}
              onClick={onClear}
              disabled={!tableData?.length} // 没有数据时禁用清空按钮
            >
              清除所有数据
            </Button>
            <Upload accept={'.xlsx'} onChange={onChangeFile}>
              <Button icon={<UploadOutlined />} loading={importLoading}>
                导入
              </Button>
            </Upload>
            <Button
              icon={<DownloadOutlined />}
              loading={loading}
              onClick={onExportData}
            >
              导出
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={onCreateOrEditData}
              disabled={disabledCreateBtn} // 没有数据时禁用新增按钮
            >
              新增
            </Button>
          </>
        )}
      </Space>
    </div>
  );
};

export default TableOperationBar;
