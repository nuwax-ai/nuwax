import knowledgeImage from '@/assets/images/knowledge_image.png';
import AddAndModify from '@/components/AddAndModify';
import MyTable from '@/components/MyTable';
import {
  DownloadOutlined,
  EditOutlined,
  LeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Space, Tabs, Tag } from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import { useEffect, useState } from 'react';
// import { useParams } from 'umi';
import './index.less';
import { AddParams, mockColumns, mockTableData } from './params';
import type { Detail } from './type';

const SpaceDataBase = () => {
  // const { spaceId, databaseId } = useParams();
  const [detail, setDetail] = useState<Detail | null>(null);
  // 当前显示的表结构还是表数据
  const [currentContent, setCurrentContent] = useState<string>('structure');
  // 当前表的columns
  const [columns, setColumns] = useState<any[]>([]);
  // 当前表的数据
  const [tableData, setTableData] = useState<any[]>([]);
  // 当前分页的数据
  const [pagination, setPagination] = useState<any>({
    total: 13,
    pageSize: 10,
    current: 1,
  });
  // 开启关闭新增的弹窗
  const [visible, setVisible] = useState<boolean>(false);
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
  const onEdit = () => {
    console.log('点击编辑');
  };

  // 切换页码或者每页显示的条数
  const changePagination = (page: number, pageSize: number) => {
    console.log(page, pageSize);
    setPagination({ ...pagination, current: page, pageSize });
  };

  // 新增数据
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

  useEffect(() => {
    // 获取详情数据
    setDetail({
      name: 'SpaceDataBase',
      icon: knowledgeImage,
      count: 10,
    });
    setColumns(mockColumns);
    setTableData(mockTableData);
  }, []);

  return (
    <div className="database-container">
      {/* 头部内容 */}
      <div className="database-header dis-left">
        <LeftOutlined className="icon-back" onClick={handleBack} />
        <img
          className="logo"
          src={detail ? detail.icon : (knowledgeImage as string)}
          alt=""
        />
        <div>
          <div className="dis-left database-header-title">
            <h3 className="name">{detail?.name}</h3>
            <EditOutlined
              className="cursor-pointer hover-box"
              onClick={onEdit}
            />
          </div>
          <Tag className="tag-style">{`${detail?.count}条记录`}</Tag>
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
          <MyTable
            columns={columns}
            tableData={tableData}
            showEditRow
            showIndex
            showAddRow={currentContent === 'data' ? false : true}
            pagination={currentContent === 'data' ? pagination : null}
            onPageChange={changePagination}
            scrollHeight={getBrowserHeight()}
          />
        </div>
      </div>
      <AddAndModify
        onCancel={() => setVisible(false)}
        title="新增数据"
        formList={AddParams}
        visible={visible}
        onSubmit={onAdd}
      />
    </div>
  );
};

export default SpaceDataBase;
