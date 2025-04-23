import { AnyObject } from 'antd/es/_util/type';
import React from 'react';

declare global {
  interface TableColumn {
    title: string;
    dataIndex: string;
    type?: 'checkbox' | 'tag' | 'text' | 'date';
    editable?: boolean;
    edit?: boolean;
    onCell?: (record: any) => {
      record: AnyObject;
      dataIndex: string;
      title: string;
      editing: boolean;
    };
  }
}

interface ActionColumn {
  icon: React.ComponentType; // 图标
  name: string; // 标题
  func: (record: AnyObject) => void; // 操作
  description: string;
}

export interface MyTableProp {
  // 表头
  columns: TableColumn[];
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
  };
  // 分页或者排序发生变更，重新获取数据
  onPageChange?: (page: number, pageSize: number) => void;
  // 当前表格是否有数据
  dataEmptyFlag?: boolean;
  // 当数据发生变化，同步修改数据源
  onDataSourceChange?: (dataSource: AnyObject[]) => void;
  // 可编辑表格的formRef
  formRef?: React.Ref<{ submit: () => void }>; // 简化类型，只暴露submit方法
}
