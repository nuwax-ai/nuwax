import { TABLE_TABS_LIST } from '@/constants/dataTable.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { dict } from '@/services/i18nRuntime';
import { TableTabsEnum } from '@/types/enums/dataTable';
import { FileType } from '@/types/interfaces/common';
import { TableOperationBarProps } from '@/types/interfaces/dataTable';
import {
  ClearOutlined,
  DownloadOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Space, Tabs, Upload, message } from 'antd';
import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

// 表格操作栏组件
const TableOperationBar: React.FC<TableOperationBarProps> = ({
  tableId,
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
  // 校验文件类型和大小
  const beforeUploadDefault = (file: FileType) => {
    // 校验文件类型
    const isExcel =
      file.type ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls');

    if (!isExcel) {
      message.error(
        dict('PC.Pages.SpaceTable.TableOperationBar.excelFileOnly'),
      );
      return false;
    }

    // 校验文件大小（限制为100MB）
    const isLessThan10M = file.size / 1024 / 1024 < 100;
    if (!isLessThan10M) {
      message.error(
        dict('PC.Pages.SpaceTable.TableOperationBar.fileSizeLimit'),
      );
      return false;
    }

    return true;
  };
  return (
    <div className="dis-sb flex-wrap">
      <Tabs
        items={TABLE_TABS_LIST.map((item) => ({
          ...item,
          label:
            item.key === TableTabsEnum.Structure
              ? dict('PC.Pages.SpaceTable.DataTable.tabStructure')
              : dict('PC.Pages.SpaceTable.DataTable.tabData'),
        }))}
        activeKey={activeKey}
        onChange={onChangeTabs}
        className={cx(styles['tab-container'])}
      />
      <Space>
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          {dict('PC.Common.Global.refresh')}
        </Button>
        {activeKey === TableTabsEnum.Structure ? (
          <>
            <Button icon={<PlusOutlined />} onClick={onAddField}>
              {dict('PC.Pages.SpaceTable.TableOperationBar.addField')}
            </Button>
            <Button
              loading={loading}
              icon={<SaveOutlined />}
              onClick={onSaveTableStructure}
            >
              {dict('PC.Common.Global.save')}
            </Button>
          </>
        ) : (
          <>
            <Button
              icon={<ClearOutlined />}
              onClick={onClear}
              disabled={!tableData?.length} // 没有数据时禁用清空按钮
            >
              {dict('PC.Pages.SpaceTable.TableOperationBar.clearAllData')}
            </Button>
            <Upload
              // 是否禁用
              disabled={importLoading}
              accept={'.xlsx,.xls'}
              onChange={onChangeFile}
              action={`${process.env.BASE_URL}/api/compose/db/table/importExcel/${tableId}`}
              headers={{
                Authorization: `Bearer ${
                  localStorage.getItem(ACCESS_TOKEN) || ''
                }`,
              }}
              showUploadList={false}
              beforeUpload={beforeUploadDefault}
            >
              <Button
                icon={<UploadOutlined />}
                loading={importLoading}
                disabled={importLoading}
              >
                {dict('PC.Common.Global.import')}
              </Button>
            </Upload>
            <Button
              icon={<DownloadOutlined />}
              loading={loading}
              onClick={onExportData}
            >
              {dict('PC.Common.Global.export')}
            </Button>
            <Button
              icon={<PlusOutlined />}
              onClick={onCreateOrEditData}
              disabled={disabledCreateBtn} // 没有数据时禁用新增按钮
            >
              {dict('PC.Common.Global.add')}
            </Button>
          </>
        )}
      </Space>
    </div>
  );
};

export default TableOperationBar;
