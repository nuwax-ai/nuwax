import knowledgeImage from '@/assets/images/database_image.png';
import AddAndModify, { AddAndModifyRef } from '@/components/AddAndModify';
import type { FormItem } from '@/components/AddAndModify/type';
import CreatedItem from '@/components/CreatedItem';
import DeleteSure from '@/components/DeleteSure';
import MyTable from '@/components/MyTable';
import EditTable, { EditTableRef } from '@/components/MyTable/EditTable';
import service, { IgetDetails } from '@/services/tableSql';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  ClearOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  LeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, message, Modal, Space, Tabs, Tag, Upload } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'umi';
import './index.less';
import { mockColumns, typeMap } from './params';

const SpaceTable = () => {
  const { spaceId, tableId } = useParams();
  const [detail, setDetail] = useState<IgetDetails | null>(null);

  const [AddParams, setAddParams] = useState<FormItem[]>([]);
  // 当前显示的表结构还是表数据
  const [currentContent, setCurrentContent] = useState<string>('structure');
  // 当前表的columns
  const [columns, setColumns] = useState<TableColumn[]>([]);
  // 当前表的数据
  const [tableData, setTableData] = useState<AnyObject[]>([]);
  // 表结构的数据
  const [tableStructure, setTableStructure] = useState<AnyObject[]>([]);
  // 当前可以编辑表格的ref
  const editTableRef = useRef<EditTableRef>(null);
  // 当前新增和删除的ref
  const addedRef = useRef<AddAndModifyRef>(null);
  // 当前分页的数据
  const [pagination, setPagination] = useState({
    total: 13,
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

  // 返回上一级
  const handleBack = () => {
    history.back();
  };
  // 切换表结构还是表数据
  const onChange = (key: string) => {
    setCurrentContent(key);
  };
  //   点击弹出编辑框
  const onShow = (record?: AnyObject) => {
    if (addedRef.current) {
      if (record && record.id) {
        addedRef.current?.onShow('修改数据', AddParams, record);
      } else {
        addedRef.current?.onShow('新增数据', AddParams);
      }
    }
  };

  // 获取当前浏览器的高度
  const getBrowserHeight = () => {
    return (
      (window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight) - 160
    );
  };
  // 触发表格的提交数据
  const onSave = () => {
    setLoading(true);
    if (editTableRef.current) {
      editTableRef.current.submit();
    }
  };

  // 触发表格新增行
  const onAddRow = () => {
    if (editTableRef.current) {
      editTableRef.current.handleAddRow({
        nullableFlag: false,
        enabledFlag: true,
        fieldType: 1,
        dataLength: 1,
      });
    }
  };

  // 获取当前的数据
  const getDetails = async () => {
    try {
      const res = await service.getDetail(tableId);
      const addParams = res.data.fieldList
        .filter((item) => !item.systemFieldFlag)
        .map((item) => {
          return {
            label: item.fieldDescription,
            dataIndex: item.fieldName,
            key: item.fieldName,
            type: typeMap[item.fieldType],
            rules: item.nullableFlag
              ? undefined
              : [{ required: true, message: '请输入' }],
            options:
              item.fieldType === 4
                ? [
                    { label: 'true', value: 'true' },
                    { label: 'false', value: 'false' },
                  ]
                : undefined,
            maxLength:
              item.fieldType === 1
                ? 255
                : item.fieldType === 7
                ? 1000
                : undefined,
          };
        });
      setAddParams(addParams);
      setDetail(res.data);
      const arr = res.data.fieldList.map((item) => {
        return {
          title: item.fieldName,
          description: item.fieldDescription,
          dataIndex: item.fieldName,
          key: item.fieldName,
          type:
            item.fieldType === 5
              ? ('time' as const)
              : item.fieldType === 4
              ? ('checkbox' as const)
              : ('text' as const),
          width: 180,
        };
      });
      const table = res.data.fieldList.map((item) => {
        if (item.fieldType === 1 || item.fieldType === 7) {
          return {
            ...item,
            dataLength: item.fieldType,
            fieldType: 1,
            nullableFlag: !item.nullableFlag,
          };
        }
        return { ...item, nullableFlag: !item.nullableFlag };
      });
      setTableStructure(table);
      setColumns(arr);
    } catch (error) {}
  };

  // 获取最新的表格数据，提交
  const onDataSourceChange = async (data: any) => {
    try {
      const arr = data.map((item: AnyObject) => {
        if (item.fieldType === 1 && item.dataLength === 7) {
          return {
            ...item,
            fieldType: 7,
            nullableFlag: !item.nullableFlag,
          };
        }
        return { ...item, nullableFlag: !item.nullableFlag };
      });
      const _params = {
        id: tableId,
        fieldList: arr,
      };
      await service.modifyTableStructure(_params);
      setLoading(false);
      getDetails();
      message.success('修改成功');
    } finally {
      setLoading(false);
    }
    // setTableData(data);
  };

  // 获取表数据的数据
  const getTable = async (params: Global.IGetList) => {
    const _params = {
      tableId: tableId,
      ...params,
    };
    try {
      const res = await service.getTableData(_params);
      setTableData(res.data.records);
      setPagination({
        ...pagination,
        total: res.data.total,
        current: res.data.current,
        pageSize: res.data.size,
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
        await service.modifyTableData(_params);
      } else {
        await service.addTableData(_params);
      }
      getTable({ pageNo: pagination.current, pageSize: pagination.pageSize });
      // getDetails();
      addedRef.current?.onClose();
    } finally {
      addedRef.current?.stopLoading();
    }
    // setVisible(false);
  };

  // 修改当前数据表的数据
  const Confirm = async (value: AnyObject) => {
    try {
      const _params = {
        tableName: value.name,
        tableDescription: value.description,
        icon: value.icon,
        spaceId: spaceId,
        id: detail?.id,
      };
      await service.modifyTask(_params);
      setDetail({
        ...(detail as IgetDetails),
        tableName: value.name,
        tableDescription: value.description,
        icon: value.icon,
      });
      setOpen(false);
    } catch (error) {}
  };

  // 删除当前的数据
  const onDelete = async (id: number) => {
    try {
      Modal.confirm({
        title: '删除确认',
        content: '确定要删除吗？',
        okText: '确定',
        cancelText: '取消',
        icon: <ExclamationCircleFilled />,
        onOk: async () => {
          const _params = {
            rowId: id,
            tableId: tableId,
          };
          await service.deleteTableData(_params);
          message.success('删除成功');
          if (tableData.length === 1) {
            getDetails();
            setTableData([]);
          } else {
            getTable({
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
    // setPagination({ ...pagination, current: page, pageSize });
    getTable({ pageNo: page, pageSize: pageSize });
  };
  // 清除所有数据
  const clearData = async () => {
    setOpenDelete(true);
  };

  const onSureClear = async () => {
    try {
      await service.clearTableData(tableId);
      message.success('清除成功');
      setTableData([]);
      setPagination({ total: 0, current: 1, pageSize: 10 });
      setOpenDelete(false);
      getDetails();
    } catch (error) {}
  };

  // 导入数据
  const handleChangeFile = async (info: any) => {
    if (info.file.status !== 'done') return;
    setImportLoading(true);
    try {
      await service.importTableData(tableId, info.file.originFileObj);
      message.success('导入成功');
      getTable({ pageNo: 1, pageSize: 10 });
      setPagination({ ...pagination, current: 1, pageSize: 10 });
      setImportLoading(false);
    } finally {
      setImportLoading(false);
    }
  };
  // 导出数据
  const exportData = async () => {
    setLoading(true);
    try {
      const _res = await service.exportTableData(tableId);
      const blob = new Blob([_res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }); // 将响应数据转换为 Blob 对象
      const objectURL = URL.createObjectURL(blob); // 创建一个 URL 对象
      const link = document.createElement('a'); // 创建一个 a 标签
      link.href = objectURL;
      link.download = `${detail?.tableName}.xlsx`; // 设置下载文件的名称
      link.click(); // 模拟点击下载
      URL.revokeObjectURL(objectURL); // 释放 URL 对象
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getDetails();
    getTable({ pageNo: 1, pageSize: 10 });
  }, []);

  // 表数据的操作列
  const actionColumn = [
    {
      name: 'edit',
      icon: EditOutlined,
      description: '编辑',
      func: (record: any) => onShow(record),
    },
    {
      name: 'delete',
      icon: DeleteOutlined,
      description: '删除',
      func: (record: any) => {
        onDelete(record.id);
      },
    },
  ];

  return (
    <div className="database-container">
      {/* 头部内容 */}
      <div className="database-header dis-left">
        <LeftOutlined className="icon-back" onClick={handleBack} />
        <img
          className="logo"
          src={detail && detail.icon ? detail.icon : (knowledgeImage as string)}
          alt=""
        />
        <div>
          <div className="dis-left database-header-title">
            <h3 className="name ">{detail?.tableName}</h3>
            <EditOutlined
              className="cursor-pointer hover-box"
              onClick={() => setOpen(true)}
            />
          </div>
          <Tag className="tag-style">{`${pagination.total}条记录`}</Tag>
        </div>
      </div>
      <div className="inner-container">
        <div className="dis-sb">
          <Tabs
            items={[
              { key: 'structure', label: '表结构' },
              { key: 'data', label: '表数据' },
            ]}
            activeKey={currentContent}
            onChange={onChange}
            className="tabs-style"
          />
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                getDetails();
                getTable({ pageNo: 1, pageSize: 10 });
                setPagination({ ...pagination, current: 1, pageSize: 10 });
              }}
            >
              刷新
            </Button>
            {currentContent === 'structure' && (
              <>
                <Button icon={<PlusOutlined />} onClick={onAddRow}>
                  新增字段
                </Button>
                <Button
                  loading={loading}
                  icon={<SaveOutlined />}
                  onClick={onSave}
                >
                  保存
                </Button>
              </>
            )}
            {currentContent === 'data' && (
              <>
                <Button icon={<ClearOutlined />} onClick={clearData}>
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
          {currentContent === 'data' && (
            <MyTable
              columns={columns}
              tableData={tableData}
              showEditRow
              showDescription
              // showIndex
              pagination={pagination}
              showPagination
              actionColumnFixed
              onPageChange={changePagination}
              scrollHeight={getBrowserHeight() + 40}
              actionColumn={actionColumn}
              actionColumnWidth={100}
            />
          )}
          {currentContent === 'structure' && (
            <EditTable
              dataEmptyFlag={detail ? detail.existTableDataFlag : false}
              columns={mockColumns}
              tableData={tableStructure || []}
              showIndex
              showAddRow
              pagination={pagination}
              showPagination={false}
              scrollHeight={getBrowserHeight()}
              onDataSourceChange={onDataSourceChange}
              formRef={editTableRef}
              rowKey={'row_key_chao'}
              actionColumnWidth={60}
            />
          )}
        </div>
      </div>
      <AddAndModify ref={addedRef} onSubmit={onAdd} />
      <CreatedItem
        type={AgentComponentTypeEnum.Table}
        mode={CreateUpdateModeEnum.Update}
        spaceId={spaceId}
        open={open}
        onCancel={() => setOpen(false)}
        Confirm={Confirm}
        info={
          detail
            ? {
                name: detail.tableName,
                description: detail.tableDescription,
                icon: detail.icon,
              }
            : undefined
        }
      />
      <DeleteSure
        onSure={onSureClear}
        onCancel={() => setOpenDelete(false)}
        open={openDelete}
        title={'清除确认'}
        sureText={detail?.tableName || '人之初性本善'}
      />
    </div>
  );
};

export default SpaceTable;
