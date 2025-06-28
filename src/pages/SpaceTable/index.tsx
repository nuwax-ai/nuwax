import AddAndModify from './AddAndModify';
// import type { FormItem } from './AddAndModify/type';
import CreatedItem from '@/components/CreatedItem';
import {
  apiClearBusinessData,
  apiExportExcel,
  apiGetTableData,
  apiImportExcel,
  apiTableAddBusinessData,
  apiTableDeleteBusinessData,
  apiTableDetail,
  apiUpdateBusinessData,
  apiUpdateTableDefinition,
  apiUpdateTableName,
} from '@/services/dataTable';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { TableTabsEnum } from '@/types/enums/dataTable';
import {
  TableDefineDetails,
  TableFieldInfo,
} from '@/types/interfaces/dataTable';
import {
  ClearOutlined,
  DownloadOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, message, Modal, Space, Tabs, Upload } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import { cloneDeep } from 'lodash';
import { useEffect, useState } from 'react';
import { useParams } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import DataTable from './DataTable';
import DeleteSure from './DeleteSure';
import './index.less';
import StructureTable from './StructureTable';
import TableHeader from './TableHeader';

const SpaceTable = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const tableId = Number(params.tableId);
  // 数据表详情
  const [tableDetail, setTableDetail] = useState<TableDefineDetails | null>(
    null,
  );
  // const [AddParams, setAddParams] = useState<FormItem[]>([]);
  // 当前显示的表结构还是表数据
  const [activeKey, setActiveKey] = useState<TableTabsEnum>(
    TableTabsEnum.Structure,
  );
  // 当前表的columns
  const [columns, setColumns] = useState<TableFieldInfo[]>([]);
  // 当前表的业务数据
  const [tableData, setTableData] = useState<any[]>([]);
  // // 当前新增和删除的ref
  // const addedRef = useRef<AddAndModifyRef>(null);
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

  // 切换表结构还是表数据
  const onChange = (key: string) => {
    setActiveKey(key as TableTabsEnum);
  };
  //   点击弹出编辑框
  // const onShow = (record?: TableFieldInfo) => {
  const onShow = () => {
    // if (addedRef.current) {
    //   if (record && record.id) {
    //     addedRef.current?.onShow('修改数据', AddParams, record);
    //   } else {
    //     addedRef.current?.onShow('新增数据', AddParams);
    //   }
    // }
  };

  // 获取当前浏览器的高度
  const getBrowserHeight = () => {
    return (
      (window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight) - 160
    );
  };

  // 触发表格新增行
  const onAddRow = () => {
    const _tableDetail = cloneDeep(tableDetail) || [];
    _tableDetail?.fieldList?.push({
      nullableFlag: false,
      enabledFlag: true,
      fieldType: 1,
      defaultValue: '',
      fieldName: '',
      fieldDescription: '',
      systemFieldFlag: false,
      isNew: true,
      id: uuidv4(),
    });
    setTableDetail(_tableDetail);
  };

  // 获取当前的数据
  const getDetails = async () => {
    const { data } = await apiTableDetail(tableId);
    setTableDetail(data);
  };

  // 保存表结构
  const onSaveTableStructure = async () => {
    try {
      setLoading(true);
      const _fieldList = tableDetail?.fieldList?.map((item: AnyObject) => {
        if (item.fieldType === 1 && item.dataLength === 7) {
          return {
            ...item,
            fieldType: 7,
          };
        }
        return item;
      });
      const _params = {
        id: tableId,
        fieldList: _fieldList,
      };
      await apiUpdateTableDefinition(_params);
      setLoading(false);
      // getDetails();
      message.success('修改成功');
    } finally {
      setLoading(false);
    }
  };

  // 查询数据表的业务数据
  const getTableBusinessData = async (params: Global.IGetList) => {
    const _params = {
      tableId: tableId,
      ...params,
    };
    try {
      const { data } = await apiGetTableData(_params);
      setColumns(data?.columnDefines || []);
      setTableData(data.records);
      setPagination({
        ...pagination,
        total: data.total,
        current: data.current,
        pageSize: data.size,
      });
    } catch (error) {}
  };
  // 新增和修改数据
  const onAdd = async (values: AnyObject) => {
    try {
      const _params = {
        tableId: tableId,
        rowData: values,
        rowId: values.id,
      };
      if (_params && _params.rowId) {
        await apiUpdateBusinessData(_params);
      } else {
        await apiTableAddBusinessData(_params);
      }
      getTableBusinessData({
        pageNo: pagination.current,
        pageSize: pagination.pageSize,
      });
      // getDetails();
      // addedRef.current?.onClose();
    } finally {
      // addedRef.current?.stopLoading();
    }
    // setVisible(false);
  };

  // 修改当前数据表的数据
  const handleUpdateTableName = async (value: AnyObject) => {
    if (!tableDetail) {
      return;
    }
    try {
      const _params = {
        tableName: value.name,
        tableDescription: value.description,
        icon: value.icon,
        id: tableDetail.id,
      };
      await apiUpdateTableName(_params);
      setTableDetail({
        ...(tableDetail as TableDefineDetails),
        tableName: value.name,
        tableDescription: value.description,
        icon: value.icon,
      });
      setOpen(false);
    } catch (error) {}
  };

  // 删除数据表业务数据
  const handleDeleteTableBusinessData = async (id: number) => {
    try {
      Modal.confirm({
        title: '删除确认',
        content: '确定要删除吗？',
        okText: '确定',
        cancelText: '取消',
        icon: <ExclamationCircleFilled />,
        onOk: async () => {
          await apiTableDeleteBusinessData(id, tableId);
          message.success('删除成功');
          if (tableData.length === 1) {
            getDetails();
            setTableData([]);
          } else {
            getTableBusinessData({
              pageNo: pagination.current,
              pageSize: pagination.pageSize,
            });
          }
        },
      });
    } catch (error) {}
  };

  // 切换页码或者每页显示的条数
  const changePagination = (page: number, pageSize: number) => {
    getTableBusinessData({ pageNo: page, pageSize: pageSize });
  };

  // 确认清空数据表
  const handleConfirmClear = async () => {
    try {
      await apiClearBusinessData(tableId);
      message.success('清除成功');
      setTableData([]);
      setPagination({ total: 0, current: 1, pageSize: 10 });
      setOpenDelete(false);
      getDetails();
    } catch (error) {}
  };

  // 导入数据
  const handleChangeFile = async (info: any) => {
    setImportLoading(true);
    try {
      await apiImportExcel(tableId, info.file);
      message.success('导入成功');
      getTableBusinessData({ pageNo: 1, pageSize: pagination.pageSize });
      setPagination({ ...pagination, current: 1 });
      setImportLoading(false);
    } finally {
      setImportLoading(false);
    }
  };

  // 导出数据
  const exportData = async () => {
    setLoading(true);
    try {
      const _res = await apiExportExcel(tableId);
      const blob = new Blob([_res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }); // 将响应数据转换为 Blob 对象
      const objectURL = URL.createObjectURL(blob); // 创建一个 URL 对象
      const link = document.createElement('a'); // 创建一个 a 标签
      link.href = objectURL;
      link.download = `${tableDetail?.tableName}.xlsx`; // 设置下载文件的名称
      link.click(); // 模拟点击下载
      URL.revokeObjectURL(objectURL); // 释放 URL 对象
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDetails();
    getTableBusinessData({ pageNo: 1, pageSize: pagination.pageSize });
  }, []);

  return (
    <div className="database-container">
      {/* 头部内容 */}
      <TableHeader
        spaceId={spaceId}
        tableDetail={tableDetail}
        total={pagination.total}
        onClick={() => setOpen(true)}
      />
      <div className="inner-container">
        <div className="dis-sb">
          <Tabs
            items={[
              { key: TableTabsEnum.Structure, label: '表结构' },
              { key: TableTabsEnum.Data, label: '表数据' },
            ]}
            activeKey={activeKey}
            onChange={onChange}
            className="tabs-style"
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                getDetails();
                getTableBusinessData({
                  pageNo: 1,
                  pageSize: pagination.pageSize,
                });
                setPagination({ ...pagination, current: 1 });
                // if (activeKey !== TableTabsEnum.Data) {
                //   editTableRef.current?.resetFields();
                // }
              }}
            >
              刷新
            </Button>
            {activeKey === TableTabsEnum.Structure && (
              <>
                <Button icon={<PlusOutlined />} onClick={onAddRow}>
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
            )}
            {activeKey === TableTabsEnum.Data && (
              <>
                <Button
                  icon={<ClearOutlined />}
                  onClick={() => setOpenDelete(true)}
                >
                  清除所有数据
                </Button>
                <Upload
                  accept={'.xlsx'}
                  // action={''}
                  onChange={handleChangeFile}
                  showUploadList={false}
                >
                  <Button icon={<UploadOutlined />} loading={importLoading}>
                    导入
                  </Button>
                </Upload>
                <Button
                  icon={<DownloadOutlined />}
                  loading={loading}
                  onClick={exportData}
                >
                  导出
                </Button>
                <Button icon={<PlusOutlined />} onClick={onShow}>
                  新增
                </Button>
              </>
            )}
          </Space>
        </div>
        <div className="flex-1">
          {activeKey === TableTabsEnum.Structure ? (
            <StructureTable
              // dataEmptyFlag={
              //   tableDetail ? tableDetail.existTableDataFlag : false
              // }
              tableData={tableDetail?.fieldList || []}
              scrollHeight={getBrowserHeight()}
              // onDataSourceChange={onDataSourceChange}
            />
          ) : (
            <DataTable
              columns={columns}
              tableData={tableData}
              pagination={pagination}
              onPageChange={changePagination}
              scrollHeight={getBrowserHeight() + 40}
              onEdit={onShow}
              onDel={(record) => handleDeleteTableBusinessData(record.id)}
            />
          )}
        </div>
      </div>
      <AddAndModify
        open={open}
        title="编辑数据"
        onSubmit={onAdd}
        formList={[]}
        onClose={() => setOpen(false)}
      />
      <CreatedItem
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
