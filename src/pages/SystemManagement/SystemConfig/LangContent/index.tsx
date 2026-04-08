import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiI18nConfigList,
  apiI18nConfigTranslate,
  apiI18nConfigTranslateAll,
} from '@/services/i18n';
import type { I18nSlideLangInfo } from '@/types/interfaces/i18n';
import type { Page } from '@/types/interfaces/request';
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { Button, Space, Tag, message } from 'antd';
import React, { useRef, useState } from 'react';
import { history, useParams } from 'umi';
import AddKeyValueModal from './AddKeyValueModal';

/**
 * 语言内容页面
 */
const LangContent: React.FC = () => {
  // ====================== 语言 ======================
  const { lang } = useParams();

  // ====================== 添加键值对弹窗 ======================
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [currentItem, setCurrentItem] = useState<I18nSlideLangInfo | null>(
    null,
  );
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  // 单个翻译 key 的 loading 状态
  const [translateLoadingMap, setTranslateLoadingMap] = useState<
    Record<string, boolean>
  >({});
  // 翻译全部 loading 状态
  const [translateAllLoading, setTranslateAllLoading] =
    useState<boolean>(false);

  // ====================== 多语言端 ======================
  const side = String(history.location.query?.side || 'PC');

  // 打开添加键值对弹窗
  const handleOpenAddModal = () => {
    setCurrentItem(null);
    setAddModalOpen(true);
  };

  // 编辑
  const handleEdit = (record: I18nSlideLangInfo) => {
    setCurrentItem(record);
    setAddModalOpen(true);
  };

  // 翻译单个key
  const handleTranslate = async (record: I18nSlideLangInfo) => {
    const rowKey = record.key;
    setTranslateLoadingMap((prev) => ({ ...prev, [rowKey]: true }));
    try {
      await apiI18nConfigTranslate({
        side,
        lang,
        value: record.value,
        key: record.key,
      });
      message.success('翻译成功');
      actionRef.current?.reload();
    } finally {
      setTranslateLoadingMap((prev) => {
        const next = { ...prev };
        delete next[rowKey];
        return next;
      });
    }
  };

  // 翻译全部
  const handleTranslateAll = async () => {
    setTranslateAllLoading(true);
    try {
      await apiI18nConfigTranslateAll(lang);
      message.success('翻译成功');
      actionRef.current?.reload();
    } finally {
      setTranslateAllLoading(false);
    }
  };

  // 列配置（使用表格内置搜索）
  const columns: ProColumns<I18nSlideLangInfo>[] = [
    {
      title: '模块',
      dataIndex: 'module',
      width: 120,
      fieldProps: {
        placeholder: '搜索模块...',
        allowClear: true,
      },
      search: {
        transform: (value: string) => ({ module: value }),
      },
      render: (_, record) => {
        const moduleText = String(record.key || '').split('.')[0] || '-';
        return <Tag>{moduleText}</Tag>;
      },
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      width: 220,
      fieldProps: {
        placeholder: '搜索 Key...',
        allowClear: true,
      },
    },
    {
      title: '文本内容',
      dataIndex: 'value',
      key: 'value',
      fieldProps: {
        placeholder: '搜索文本内容...',
        allowClear: true,
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      hideInSearch: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      hideInSearch: true,
      align: 'center',
      valueType: 'option',
      render: (_value, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            icon={<TranslationOutlined />}
            loading={translateLoadingMap[record.key] || false}
            onClick={() => handleTranslate(record)}
          />
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  // 查询多语言配置列表
  const request = async (params: {
    current?: number;
    pageSize?: number;
    module?: string;
    key?: string;
    value?: string;
  }) => {
    const response = await apiI18nConfigList({
      side,
      lang,
      module: params.module,
      key: params.key,
      pageNo: params.current || 1,
      pageSize: params.pageSize || 15,
    });
    const data = response.data;
    if (Array.isArray(data)) {
      return {
        data,
        total: data.length,
        success: response.code === SUCCESS_CODE,
      };
    }
    const pageData = data as Page<I18nSlideLangInfo>;
    return {
      data: pageData.records || [],
      total: pageData.total || 0,
      success: response.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout
      title={`${lang} - 键值对管理`}
      back={true}
      rightSlot={
        <>
          <Button
            icon={<DownOutlined />}
            loading={translateAllLoading}
            onClick={handleTranslateAll}
          >
            翻译全部
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenAddModal}
          >
            添加键值对
          </Button>
        </>
      }
    >
      <XProTable<I18nSlideLangInfo>
        actionRef={actionRef}
        formRef={formRef}
        rowKey={(record) => `${record.key || ''}-${record.lang || ''}`}
        columns={columns}
        request={request}
      />

      {/* 添加键值对弹窗 */}
      <AddKeyValueModal
        open={addModalOpen}
        currentItem={currentItem}
        lang={lang}
        side={side}
        onCancel={() => {
          setAddModalOpen(false);
          setCurrentItem(null);
        }}
        onSuccess={() => {
          setAddModalOpen(false);
          setCurrentItem(null);
          actionRef.current?.reload();
        }}
      />
    </WorkspaceLayout>
  );
};

export default LangContent;
