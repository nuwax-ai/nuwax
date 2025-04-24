import knowledgeImage from '@/assets/images/database_image.png';
import AddAndModify from '@/components/AddAndModify';
import type { FormItem } from '@/components/AddAndModify/type';
import CreatedItem from '@/components/CreatedItem';
import MyTable from '@/components/MyTable';
import EditTable from '@/components/MyTable/EditTable';
import service, { IgetDetails } from '@/services/tableSql';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  LeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Space, Tabs, Tag } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'umi';
import './index.less';
import { mockColumns, mockTableData, typeMap } from './params';

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
  const editTableRef = useRef<any>(null);
  // 当前被点击行的数据
  const [currentRow, setCurrentRow] = useState<AnyObject>({});
  // 当前分页的数据
  const [pagination, setPagination] = useState({
    total: 13,
    pageSize: 10,
    current: 1,
  });
  // 开启关闭新增的弹窗
  const [visible, setVisible] = useState<boolean>(false);
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
  const onEdit = (record: AnyObject) => {
    setCurrentRow(record);
    setVisible(true);
  };

  // 切换页码或者每页显示的条数
  const changePagination = (page: number, pageSize: number) => {
    console.log(page, pageSize);
    setPagination({ ...pagination, current: page, pageSize });
  };

  // 新增和修改数据
  const onAdd = (values: AnyObject) => {
    console.log('新增数据', values);
    // setVisible(false);
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
  // 获取最新的表格数据，提交
  const onDataSourceChange = (data: any) => {
    console.log('onDataSourceChange', data);
    // setTableData(data);
  };

  // 获取当前的数据
  const getDetails = async () => {
    try {
      const res = await service.getDetail(databaseId);
      setDetail(res.data);
    } catch (error) {}
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
      const arr = res.data.columnDefines.map((item) => {
        return {
          title: item.fieldDescription,
          dataIndex: item.fieldName,
          key: item.fieldName,
          type: 'text' as const,
        };
      });
      const addParams = res.data.columnDefines.map((item) => {
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
      setColumns(arr);
    } catch (error) {}
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

  useEffect(() => {
    setColumns(mockColumns);
    setTableData(mockTableData);
    getDetails();
    getTable();
  }, []);

  // 表数据的操作列
  const actionColumn = [
    {
      name: 'edit',
      icon: EditOutlined,
      description: '编辑',
      func: (record: any) => onEdit(record),
    },
    {
      name: 'delete',
      icon: DeleteOutlined,
      description: '删除',
      func: (record: any) => {
        console.log('删除', record);
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
              <Button icon={<PlusOutlined />} onClick={() => setVisible(true)}>
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
      <AddAndModify
        onCancel={() => setVisible(false)}
        title="新增数据"
        formList={AddParams}
        visible={visible}
        onSubmit={onAdd}
        initialValues={currentRow}
      />
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
