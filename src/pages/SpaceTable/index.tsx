import CreatedItem from '@/components/CreatedItem';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiClearBusinessData,
  apiGetTableData,
  apiTableAddBusinessData,
  apiTableDeleteBusinessData,
  apiTableDetail,
  apiUpdateBusinessData,
  apiUpdateTableDefinition,
  apiUpdateTableName,
} from '@/services/dataTable';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { TableFieldTypeEnum, TableTabsEnum } from '@/types/enums/dataTable';
import {
  TableDefineDetails,
  TableFieldInfo,
  TableRowData,
  UpdateTableFieldInfo,
} from '@/types/interfaces/dataTable';
import { modalConfirm } from '@/utils/ant-custom';
import { validateTableName } from '@/utils/common';
import { exportTableExcel } from '@/utils/exportImportFile';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, message, Modal, UploadProps } from 'antd';
import classNames from 'classnames';
import { Dayjs } from 'dayjs';
import { cloneDeep, isEqual } from 'lodash';
import omit from 'lodash/omit';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import AddAndModify from './AddAndModify';
import DataTable from './DataTable';
import DeleteSure from './DeleteSure';
import styles from './index.less';
import StructureTable from './StructureTable';
import TableHeader from './TableHeader';
import TableOperationBar from './TableOperationBar';

const cx = classNames.bind(styles);

const SpaceTable = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const tableId = Number(params.tableId);
  const [structureTableLoading, setStructureTableLoading] =
    useState<boolean>(false);
  // 数据表详情
  const [tableDetail, setTableDetail] = useState<TableDefineDetails | null>(
    null,
  );
  // 当前显示的表结构还是表数据
  const [activeKey, setActiveKey] = useState<TableTabsEnum>(
    TableTabsEnum.Structure,
  );
  // 当前表的columns
  const [columns, setColumns] = useState<TableFieldInfo[]>([]);
  const [tableDataLoading, setTableDataLoading] = useState<boolean>(false);
  // 当前表的业务数据
  const [tableData, setTableData] = useState<TableRowData[]>([]);
  // 当前分页的数据
  const [pagination, setPagination] = useState({
    total: 0,
    pageSize: 10,
    current: 1,
  });
  // 导入的loading
  const [importLoading, setImportLoading] = useState(false);
  // 导出和保存的loading
  const [loading, setLoading] = useState(false);
  // 开启关闭编辑表的弹窗
  const [open, setOpen] = useState<boolean>(false);
  // 开启关闭清除的弹窗
  const [openDelete, setOpenDelete] = useState<boolean>(false);
  // 编辑表的form表单字段列表
  const [formList, setFormList] = useState<TableFieldInfo[]>([]);
  // 开启关闭编辑表数据的弹窗
  const [editTableDataVisible, setEditTableDataVisible] =
    useState<boolean>(false);
  // 编辑表数据的初始值
  const [initialValues, setInitialValues] = useState<TableRowData | null>(null);
  // 表格高度
  const [tableBoxHeight, setTableBoxHeight] = useState<number>(0);
  // 缓存系统字段, 用于保存时使用
  const systemFieldListRef = useRef<TableFieldInfo[]>([]);
  // 缓存自定义字段, 用于切换tabs时,对比是否用户修改过数据, 但是并未保存直接切换tab前二次提示使用
  const tableDetailRef = useRef<TableDefineDetails | null>(null);
  // 防止文件上传重复处理
  const processingFileRef = useRef<string | null>(null);
  const [editTableLoading, setEditTableLoading] = useState<boolean>(false);

  // 点击弹出编辑框
  const handleCreateOrEditData = (data?: TableRowData) => {
    setEditTableDataVisible(true);
    setInitialValues(data || null);
  };

  // 数据表新增字段
  const handleAddField = () => {
    const _tableDetail = cloneDeep(tableDetail);
    const fieldList = _tableDetail?.fieldList || [];
    const sortIndex =
      fieldList.length > 0 ? fieldList.slice(-1)[0].sortIndex + 1 : 0;
    _tableDetail?.fieldList?.push({
      id: uuidv4(),
      fieldName: '',
      fieldDescription: '',
      systemFieldFlag: false,
      // nullableFlag	是否可为空,true:可空;false:非空(页面显示是否必须，此字段取反)
      nullableFlag: true,
      // 是否唯一,true:唯一;false:非唯一
      uniqueFlag: false,
      // 是否启用：true:启用;false:禁用
      enabledFlag: true,
      sortIndex,
      fieldType: TableFieldTypeEnum.String,
      dataLength: TableFieldTypeEnum.String,
      defaultValue: null,
      isNew: true,
    });
    setTableDetail(_tableDetail);
    // 滚动到表格底部
    setTimeout(() => {
      // const tableBody = document.querySelector('.ant-table-tbody');
      const tableBody = document.querySelector(
        '.ant-table-tbody-virtual-holder-inner',
      );
      if (tableBody) {
        tableBody.scrollTop = tableBody.scrollHeight;
      }
    }, 0);
  };

  // 获取数据表结构详情
  const getTableStructureDetails = async () => {
    setStructureTableLoading(true);
    const { data } = await apiTableDetail(tableId);
    const fieldList = data?.fieldList || [];
    const [_systemFieldList, _customFieldList] = fieldList.reduce<
      [TableFieldInfo[], TableFieldInfo[]]
    >(
      (acc, item) => {
        acc[item.systemFieldFlag ? 0 : 1].push(item);
        return acc;
      },
      [[], []],
    );
    // 缓存系统字段和自定义字段
    systemFieldListRef.current = _systemFieldList;
    // 将系统变量放在筛选出并折叠
    const list: TableFieldInfo[] = _systemFieldList?.length
      ? [
          {
            id: 0,
            fieldName: '--',
            fieldDescription: '--',
            systemFieldFlag: true,
            fieldType: TableFieldTypeEnum.String,
            nullableFlag: false,
            defaultValue: '',
            uniqueFlag: false,
            enabledFlag: true,
            sortIndex: 0,
            children: _systemFieldList,
          },
          ..._customFieldList,
        ]
      : _customFieldList;
    const _tableDetail = {
      ...(data as TableDefineDetails),
      fieldList: list,
    };
    // 缓存表结构数据
    tableDetailRef.current = _tableDetail;
    setTableDetail(_tableDetail);
    setStructureTableLoading(false);
  };

  // 保存表结构
  const handleSaveTableStructure = async (
    successCallback?: () => void,
    cancelCallback?: () => void,
  ) => {
    try {
      // 自定义字段列表
      const _customFieldList: UpdateTableFieldInfo[] =
        tableDetail?.fieldList
          ?.filter((item: TableFieldInfo) => !item.systemFieldFlag)
          ?.map((item: UpdateTableFieldInfo) => {
            // 删除自定义属性
            let _item = item.isNew ? omit(item, ['id']) : item;
            if (
              _item.fieldType === TableFieldTypeEnum.String &&
              _item.dataLength === TableFieldTypeEnum.MEDIUMTEXT
            ) {
              return {
                ..._item,
                fieldType: TableFieldTypeEnum.MEDIUMTEXT,
              };
            }

            return _item;
          }) || [];

      // 校验字段名是否合法
      const isFieldNameValidate = _customFieldList?.every((item) =>
        validateTableName(item.fieldName),
      );
      if (!isFieldNameValidate) {
        message.error('字段名只能包含字母、数字、下划线，且必须以字母开头');
        cancelCallback?.();
        return;
      }
      setLoading(true);
      const _params = {
        id: tableId,
        fieldList: [...systemFieldListRef.current, ..._customFieldList],
      };
      await apiUpdateTableDefinition(_params);
      setLoading(false);
      message.success('保存成功');
      // 保存成功后，调用成功回调
      if (successCallback) {
        successCallback();
      } else {
        // 表结构table保存时，成功回调不存在，则调用获取表结构详情，刷新表结构
        getTableStructureDetails();
      }
    } finally {
      setLoading(false);
    }
  };

  // 查询数据表的业务数据
  const getTableBusinessData = async (
    pageNo: number = 1,
    pageSize: number = 10,
  ) => {
    setTableDataLoading(true);
    const _params = {
      tableId,
      pageNo,
      pageSize,
    };
    const { data } = await apiGetTableData(_params);
    setColumns(data?.columnDefines || []);
    // 过滤掉系统字段, 过滤掉未启用的字段
    const _fieldList = data?.columnDefines.filter(
      (item) => !item.systemFieldFlag && item.enabledFlag,
    );
    setFormList(_fieldList || []);
    // 业务数据
    setTableData(data.records);
    setTableDataLoading(false);
    setPagination({
      ...pagination,
      total: data.total,
      current: data.current,
      pageSize: data.size,
    });
  };

  useEffect(() => {
    getTableStructureDetails();
    // 获取表的业务数据，此处调用是因为头部组件中需要展示表的有多少条数据
    getTableBusinessData();
  }, []);

  // 监听窗口大小变化，动态更新表格高度
  useEffect(() => {
    const updateTableHeight = () => {
      const _tableBoxHeight =
        (window.innerHeight ||
          document.documentElement.clientHeight ||
          document.body.clientHeight) - 130;
      setTableBoxHeight(_tableBoxHeight);
    };

    // 初始化时获取一次高度
    updateTableHeight();

    // 监听窗口大小变化
    window.addEventListener('resize', updateTableHeight);

    // 监听浏览器开发者工具打开/关闭（可能影响视口高度）
    const handleOrientationChange = () => {
      // 延迟执行，确保布局完成
      setTimeout(updateTableHeight, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    // 清理事件监听器
    return () => {
      window.removeEventListener('resize', updateTableHeight);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // 新增和修改数据
  const handleCreateUpdateData = async (values: TableRowData) => {
    const _params = {
      tableId,
      rowData: values,
    };
    if (initialValues?.id) {
      await apiUpdateBusinessData({
        ..._params,
        rowId: Number(initialValues.id),
      });
    } else {
      await apiTableAddBusinessData(_params);
    }
    setEditTableDataVisible(false);
    getTableBusinessData(pagination.current, pagination.pageSize);
  };

  // 更新数据表名称和描述信息
  const handleUpdateTableName = async (info: {
    icon?: string;
    name?: string;
    description?: string;
  }) => {
    if (!tableDetail) {
      return;
    }
    const { icon, name, description } = info;
    setEditTableLoading(true);

    // 确保必需字段不为空
    if (!name) {
      message.error('名称不能为空');
      return;
    }

    const _params = {
      tableName: name,
      tableDescription: description || '',
      icon: icon || '',
      id: tableDetail.id,
    };
    await apiUpdateTableName(_params);
    message.success('修改成功');
    setEditTableLoading(false);
    setTableDetail({
      ...(tableDetail as TableDefineDetails),
      tableName: name,
      tableDescription: description || '',
      icon: icon || '',
    });
    setOpen(false);
  };

  // 删除数据表业务数据
  const handleDeleteTableBusinessData = async (id: number) => {
    modalConfirm('删除确认', '确定要删除吗？', async () => {
      await apiTableDeleteBusinessData(tableId, id);
      message.success('删除成功');
      getTableBusinessData(pagination.current, pagination.pageSize);
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    });
  };

  // 切换页码或者每页显示的条数
  const changePagination = (pageNo: number, pageSize: number) => {
    getTableBusinessData(pageNo, pageSize);
  };

  // 确认清空数据表
  const handleConfirmClear = async () => {
    await apiClearBusinessData(tableId);
    message.success('清除成功');
    setTableData([]);
    setPagination({ total: 0, current: 1, pageSize: 10 });
    setOpenDelete(false);
  };

  // 导入数据
  const handleChangeFile: UploadProps['onChange'] = (info) => {
    setImportLoading(true);
    // 只在文件状态为 'done' 时处理上传完成逻辑
    if (info.file.status === 'done') {
      // 防止重复处理同一个文件
      if (processingFileRef.current === info.file.uid) {
        console.log('文件正在处理中，跳过重复请求:', info.file.name);
        return;
      }

      processingFileRef.current = info.file.uid;

      try {
        // 接口上传失败
        if (info.file.response?.code !== SUCCESS_CODE) {
          message.warning(info.file.response?.message);
          setImportLoading(false);
          return;
        }
        message.success('导入成功');
        // 重新查询数据表的业务数据
        getTableBusinessData();
        setPagination({ ...pagination, current: 1 });
      } catch (error) {
        message.error('导入失败，请重试');
      } finally {
        setImportLoading(false);
        processingFileRef.current = null; // 重置处理状态
      }
    }

    // 处理上传错误
    if (info.file.status === 'error') {
      message.error('文件上传失败，请重试');
      setImportLoading(false);
      processingFileRef.current = null; // 重置处理状态
    }

    // 处理上传中状态（可选，用于显示进度）
    // if (info.file.status === 'uploading') {
    //   console.log('文件上传中，进度:', info.file.percent);
    // }
  };

  // 导出数据
  const handleExportData = async () => {
    setLoading(true);
    await exportTableExcel(tableId, tableDetail?.tableName || '');
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  // 放弃变更
  const onModalCancel = (key: string) => {
    setActiveKey(key as TableTabsEnum);
    getTableBusinessData();
    Modal.destroyAll();
  };

  // 弹出确认框，确认保存或者放弃变更
  const onModalConfirm = (key: string) => {
    Modal.confirm({
      title: '提示',
      icon: <ExclamationCircleFilled />,
      content: '当前表结构已修改，是否保存？',
      maskClosable: true,
      footer: (
        <div className="flex content-end gap-10 mt-16">
          <Button
            onClick={() => {
              Modal.destroyAll();
            }}
          >
            取消
          </Button>
          <Button onClick={() => onModalCancel(key)}>放弃变更</Button>
          <Button
            type="primary"
            onClick={() => {
              // 保存表结构
              handleSaveTableStructure(
                () => onModalCancel(key),
                () => {
                  Modal.destroyAll();
                },
              );
            }}
          >
            确定保存
          </Button>
        </div>
      ),
    });
  };

  // 切换表结构还是表数据
  const handleChangeTabs = (key: string) => {
    if (key === TableTabsEnum.Structure) {
      setActiveKey(key as TableTabsEnum);
      getTableStructureDetails();
    } else {
      // 如果表结构没有修改，则直接切换
      if (isEqual(tableDetailRef.current, tableDetail)) {
        setActiveKey(key as TableTabsEnum);
        getTableBusinessData();
      } else {
        // 如果表结构有修改，则弹出确认框
        onModalConfirm(key);
      }
    }
  };

  // 刷新
  const handleRefresh = () => {
    if (activeKey === TableTabsEnum.Structure) {
      getTableStructureDetails();
    } else {
      getTableBusinessData();
    }
  };

  // 输入框值改变
  const handleChangeValue = (
    id: string | number,
    attr: string,
    value: React.Key | boolean | Dayjs | null,
  ) => {
    const _tableDetail = cloneDeep(tableDetail);
    const _fieldList = _tableDetail?.fieldList?.map((item: TableFieldInfo) => {
      if (item.id === id) {
        if (attr === 'fieldType') {
          item.defaultValue = '';
        }
        // 长文本: 禁止添加默认值, 禁止唯一;
        if (attr === 'dataLength') {
          item.defaultValue = '';
          item.uniqueFlag = false;
        }
        // 恢复dataLength为String
        item.dataLength = TableFieldTypeEnum.String;
        // 字段详情描述，最长100个字符, 数据库最长200个字符
        if (
          attr === 'fieldDescription' &&
          value &&
          value.toString().length > 100
        ) {
          return item;
        }
        return {
          ...item,
          // 是否必须，取反
          [attr]: attr === 'nullableFlag' ? !value : value,
        };
      }
      return item;
    });
    _tableDetail.fieldList = _fieldList;
    setTableDetail(_tableDetail);
  };

  // 删除字段(id: 默认id是主键，number型，新增字段id是uuid自定义的)
  const handleDelField = (id: string | number) => {
    const _tableDetail = cloneDeep(tableDetail);
    const _fieldList = _tableDetail?.fieldList?.filter(
      (item: TableFieldInfo) => item.id !== id,
    );
    _tableDetail.fieldList = _fieldList;
    setTableDetail(_tableDetail);
  };
  return (
    <div className={cx(styles['database-container'])}>
      {/* 头部内容 */}
      <TableHeader
        spaceId={spaceId}
        tableDetail={tableDetail}
        total={pagination.total}
        onClick={() => setOpen(true)}
      />
      <div className={cx(styles['inner-container'])}>
        {/* 表格操作栏 */}
        <TableOperationBar
          tableId={tableId}
          activeKey={activeKey}
          loading={loading}
          importLoading={importLoading}
          tableData={tableData}
          disabledCreateBtn={!columns?.some((item) => !item.systemFieldFlag)}
          onChangeTabs={handleChangeTabs}
          onRefresh={handleRefresh}
          onAddField={handleAddField}
          onSaveTableStructure={() => handleSaveTableStructure()}
          onChangeFile={handleChangeFile}
          onExportData={handleExportData}
          onCreateOrEditData={handleCreateOrEditData}
          onClear={() => setOpenDelete(true)}
        />
        <div className="flex-1">
          {activeKey === TableTabsEnum.Structure ? (
            <StructureTable
              existTableDataFlag={tableDetail?.existTableDataFlag}
              tableData={tableDetail?.fieldList || []}
              loading={structureTableLoading}
              scrollHeight={tableBoxHeight}
              onChangeValue={handleChangeValue}
              onDeleteField={handleDelField}
            />
          ) : (
            <DataTable
              columns={columns}
              tableData={tableData}
              loading={tableDataLoading}
              pagination={pagination}
              onPageChange={changePagination}
              scrollHeight={tableBoxHeight}
              onEdit={handleCreateOrEditData}
              onDel={(record) =>
                handleDeleteTableBusinessData(Number(record.id))
              }
            />
          )}
        </div>
      </div>
      <AddAndModify
        open={editTableDataVisible}
        title={initialValues ? '修改数据' : '新增数据'}
        onSubmit={handleCreateUpdateData}
        formList={formList}
        initialValues={initialValues}
        onCancel={() => setEditTableDataVisible(false)}
      />
      <CreatedItem
        loading={editTableLoading}
        type={AgentComponentTypeEnum.Table}
        mode={CreateUpdateModeEnum.Update}
        spaceId={spaceId}
        open={open}
        onCancel={() => setOpen(false)}
        Confirm={handleUpdateTableName}
        info={
          tableDetail
            ? {
                name: tableDetail.tableName,
                description: tableDetail.tableDescription,
                icon: tableDetail.icon,
              }
            : undefined
        }
      />
      <DeleteSure
        onSure={handleConfirmClear}
        onCancel={() => setOpenDelete(false)}
        open={openDelete}
        title={'清除确认'}
        sureText={tableDetail?.tableName || ''}
      />
    </div>
  );
};

export default SpaceTable;
