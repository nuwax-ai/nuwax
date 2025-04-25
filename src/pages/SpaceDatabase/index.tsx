import knowledgeImage from '@/assets/images/database_image.png';
import AddAndModify, { AddAndModifyRef } from '@/components/AddAndModify';
import type { FormItem } from '@/components/AddAndModify/type';
import CreatedItem from '@/components/CreatedItem';
import MyTable from '@/components/MyTable';
import EditTable, { EditTableRef } from '@/components/MyTable/EditTable';
import service, { IgetDetails } from '@/services/tableSql';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  LeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, message, Modal, Space, Tabs, Tag } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'umi';
import './index.less';
import { mockColumns, typeMap } from './params';

const SpaceDataBase = () => {
  const { spaceId, databaseId } = useParams();
  const [detail, setDetail] = useState<IgetDetails | null>(null);
  const [AddParams, setAddParams] = useState<FormItem[]>([]);
  // 当前显示的表结构还是表数据
  const [currentContent, setCurrentContent] = useState<string>('structure');
  // 当前表的columns
  const [columns, setColumns] = useState<TableColumn[]>([]);
  // 当前表的数据
  const [tableData, setTableData] = useState<AnyObject[]>([]);
  // 表结构的数据
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

  // 开启关闭编辑表的弹窗
  const [open, setOpen] = useState<boolean>(false);

  // 返回上一级
  const handleBack = () => {
    history.back();
  };
  // 切换表结构还是表数据
  const onChange = (key: string) => {
    console.log(key);
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

  // 切换页码或者每页显示的条数
  const changePagination = (page: number, pageSize: number) => {
    console.log(page, pageSize);
    setPagination({ ...pagination, current: page, pageSize });
  };

  // 获取当前浏览器的高度
  const getBrowserHeight = () => {
    return (
      (window.innerHeight ||
        document.documentElement.clientHeight ||
        document.body.clientHeight) - 220
    );
  };
  // 触发表格的提交数据
  const onSave = () => {
    if (editTableRef.current) {
      editTableRef.current.submit();
    }
  };

  // 获取当前的数据
  const getDetails = async () => {
    try {
      const res = await service.getDetail(databaseId);
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
          };
        });
      setAddParams(addParams);
      setDetail(res.data);
    } catch (error) {}
  };

  // 获取最新的表格数据，提交
  const onDataSourceChange = async (data: any) => {
    try {
      const _params = {
        id: databaseId,
        fieldList: data,
      };
      await service.modifyTableStructure(_params);
      getDetails();
      message.success('操作成功');
    } catch (error) {
      message.success('数据校验失败');
    }
    // setTableData(data);
  };

  // 获取表数据的数据
  const getTable = async () => {
    try {
      const _params = {
        tableId: databaseId,
        pageNo: pagination.current,
        pageSize: pagination.pageSize,
      };
      const res = await service.getTableData(_params);
      setTableData(res.data.records);
      const arr = res.data.columnDefines
        .filter(
          (item) =>
            !item.systemFieldFlag ||
            item.fieldName === 'id' ||
            item.fieldName === 'created',
        )
        .map((item) => {
          return {
            title: item.fieldDescription,
            dataIndex: item.fieldName,
            key: item.fieldName,
            type: item.fieldType === 5 ? ('time' as const) : ('text' as const),
          };
        });
      setColumns(arr);
    } catch (error) {}
  };
  // 新增和修改数据
  const onAdd = (values: AnyObject) => {
    try {
      const _params = {
        tableId: databaseId,
        rowData: values,
        rowId: values.id,
      };
      //

      if (_params.rowId) {
        service.modifyTableData(_params);
      } else {
        service.addTableData(_params);
      }
      message.success('操作成功');
      getTable();
      addedRef.current?.onClose();
    } catch (error) {
      message.success('操作失败');
    }
    // setVisible(false);
  };

  // 修改当前数据表的数据
  const Confirm = async (value: AnyObject) => {
    try {
      const _params = {
        tableName: value.name,
        tableDescription: value.description,
        spaceId: spaceId,
        id: detail?.id,
      };
      await service.modifyTask(_params);
      setDetail({
        ...(detail as IgetDetails),
        tableName: value.name,
        tableDescription: value.description,
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
            tableId: databaseId,
          };
          await service.deleteTableData(_params);
          message.success('删除成功');
          getTable();
        },
      });
    } catch (error) {}
  };

  useEffect(() => {
    getDetails();
    getTable();
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
          <Tag className="tag-style">{`${detail?.tableDescription}条记录`}</Tag>
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
          />
          {currentContent === 'structure' && (
            <Button icon={<PlusOutlined />} onClick={onSave}>
              保存
            </Button>
          )}
          {currentContent === 'data' && (
            <Space>
              <Button icon={<DownloadOutlined />}>导出</Button>
              <Button icon={<PlusOutlined />} onClick={onShow}>
                新增
              </Button>
            </Space>
          )}
        </div>
        <div className="flex-1">
          {currentContent === 'data' && (
            <MyTable
              columns={columns}
              tableData={tableData}
              showEditRow
              showIndex
              pagination={pagination}
              showPagination
              onPageChange={changePagination}
              scrollHeight={getBrowserHeight() + 40}
              actionColumn={actionColumn}
            />
          )}
          {currentContent === 'structure' && (
            <EditTable
              dataEmptyFlag={true}
              columns={mockColumns}
              tableData={detail?.fieldList || []}
              showIndex
              showAddRow
              pagination={pagination}
              showPagination={false}
              scrollHeight={getBrowserHeight()}
              onDataSourceChange={onDataSourceChange}
              formRef={editTableRef}
              rowKey={'row_key_chao'}
            />
          )}
        </div>
      </div>
      <AddAndModify ref={addedRef} onSubmit={onAdd} />
      <CreatedItem
        type={AgentComponentTypeEnum.Database}
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
    </div>
  );
};

export default SpaceDataBase;
