import { AnyObject } from 'antd/es/_util/type';
import React from 'react';

interface Column {
  title: string;
  dataIndex: string;
  type?: 'checkbox' | 'tag' | 'text' | 'date';
  editable?: boolean;
  onCell?: (record: any) => {
    record: AnyObject;
    dataIndex: string;
    title: string;
    editing: boolean;
  };
}

interface ActionColumn {
  icon: React.ComponentType; // 图标
  name: string; // 标题
  func: (record: AnyObject) => void; // 操作
  description: string;
}

export interface MyTableProp {
  // 表头
  columns: Column[];
  // 表数据
  tableData: any[];
  // 表格的滚动高度
  scrollHeight: number;
  // 操作栏
  actionColumn?: ActionColumn[];
  // 是否显示分页
  showPagination?: boolean;
  // 是否显示序号
  showIndex?: boolean;
  // 是否显示新增行数据
  showAddRow?: boolean;
  // 是否要编辑行
  showEditRow?: boolean;
  // 当前数据用什么作为key
  rowKey?: string;
  // 操作栏的宽度
  actionColumnWidth?: number;
  // 分页的数据
  pagination?: {
    current: number; // 当前页码
    pageSize: number; // 每页显示条数
    total: number; // 总条数
    onChange?: (page: number, pageSize: number) => void;
  };
  // 分页或者排序发生变更，重新获取数据
  onPageChange?: (page: number, pageSize: number) => void;
  // 某一行数据发生了变更，提交数据
  onRowChange?: (record: AnyObject[]) => void;
}
