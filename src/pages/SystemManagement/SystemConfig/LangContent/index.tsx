import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  apiI18nConfigBatchDelete,
  apiI18nConfigList,
  apiI18nConfigTranslate,
  apiI18nSideList,
} from '@/services/i18n';
import { dict } from '@/services/i18nRuntime';
import type { I18nSlideLangInfo } from '@/types/interfaces/i18n';
import type { Page } from '@/types/interfaces/request';
import { modalConfirm } from '@/utils/ant-custom';
import { createSSEConnection } from '@/utils/fetchEventSourceConversationInfo';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { Button, Space, Tag, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRequest, useSearchParams } from 'umi';
import AddKeyValueModal from './AddKeyValueModal';
import BatchKeyValueModal from './BatchKeyValueModal';
import styles from './index.less';

/**
 * 语言内容页面
 */
const LangContent: React.FC = () => {
  // ====================== 语言 ======================
  const { lang } = useParams();
  const [searchParams] = useSearchParams();
  // 默认语言, 如果存在，则翻译时需要将默认语言的值翻译成当前语言的值
  const defaultLang = searchParams.get('defaultLang') || '';

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
  // 翻译全部 SSE 连接中断函数
  const translateAllAbortRef = useRef<(() => void) | null>(null);

  // ====================== 批量新增或更新键值对弹窗 ======================
  const [batchModalOpen, setBatchModalOpen] = useState<boolean>(false);

  // ====================== 多语言端 ======================
  const [sideList, setSideList] = useState<string[]>([]);
  const [sideSelectOptions, setSideSelectOptions] = useState<
    { label: string; value: string }[]
  >([]);

  // 查询多语言端列表
  const { run: runQuerySideList } = useRequest(apiI18nSideList, {
    manual: true,
    onSuccess: (list: string[]) => {
      const arr = Array.isArray(list) ? list : [];
      setSideList(arr);
      setSideSelectOptions(
        arr.map((s) => ({ label: String(s), value: String(s) })),
      );
    },
  });

  // 组件卸载时主动中断 SSE，避免内存泄漏和状态更新异常
  useEffect(() => {
    runQuerySideList();

    return () => {
      translateAllAbortRef.current?.();
      translateAllAbortRef.current = null;
    };
  }, []);

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
      const data = {
        sourceLang: defaultLang,
        targetLang: lang,
        i18nConfigDto: record,
      };
      await apiI18nConfigTranslate(data);
      message.success(
        dict('PC.Pages.SystemConfig.LangContent.translateSuccess'),
      );
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
    const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

    // 避免重复点击导致并发 SSE
    translateAllAbortRef.current?.();

    translateAllAbortRef.current = createSSEConnection({
      url: `${process.env.BASE_URL}/api/system/i18n/config/translateAll?sourceLang=${defaultLang}&targetLang=${lang}`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */* ',
      },
      onMessage: (res) => {
        // 翻译失败
        if (res?.code !== SUCCESS_CODE) {
          message.warning(res.message);
          return;
        }
        // message.success(
        //   dict('PC.Pages.SystemConfig.LangContent.translateSuccess'),
        // );
        // actionRef.current?.reload();
      },
      onClose: () => {
        translateAllAbortRef.current?.();
        translateAllAbortRef.current = null;
        setTranslateAllLoading(false);
      },
      onError: () => {
        translateAllAbortRef.current?.();
        translateAllAbortRef.current = null;
        setTranslateAllLoading(false);
      },
    });
  };

  // 翻译全部（二次确认）
  const handleTranslateAllWithConfirm = () => {
    modalConfirm(
      '翻译全部',
      '翻译将会消耗您的token，您确认将默认语言(' +
        defaultLang +
        ')全部的键值对翻译成当前语言(' +
        lang +
        ')吗？',
      async () => {
        await handleTranslateAll();
        return Promise.resolve();
      },
    );
  };

  // 删除单个键值对（二次确认）
  const handleDeleteWithConfirm = (record: I18nSlideLangInfo) => {
    modalConfirm('确认删除', '是否删除当前键值对？', async () => {
      await apiI18nConfigBatchDelete([record]);
      message.success('删除成功');
      actionRef.current?.reload();
      return Promise.resolve();
    });
  };

  // 列配置（使用表格内置搜索）
  const columns: ProColumns<I18nSlideLangInfo>[] = [
    {
      title: dict('PC.Pages.SystemConfig.LangContent.moduleColumn'),
      dataIndex: 'side',
      key: 'side',
      width: 120,
      valueType: 'select',
      fieldProps: {
        allowClear: true,
        options: sideSelectOptions,
      },
      render: (_, record) => <Tag>{record.side}</Tag>,
    },
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      fieldProps: {
        placeholder: dict('PC.Pages.SystemConfig.LangContent.searchKey'),
        allowClear: true,
      },
    },
    {
      title: dict('PC.Pages.SystemConfig.LangContent.textContentLabel'),
      dataIndex: 'value',
      key: 'value',
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.SystemConfig.LangContent.remarkLabel'),
      dataIndex: 'remark',
      key: 'remark',
      width: 300,
      hideInSearch: true,
    },
    {
      title: dict('PC.Common.Global.action'),
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
          <ConditionRender condition={defaultLang}>
            <TooltipIcon
              title={`将默认语言(${defaultLang})的键值对翻译成当前语言(${lang})`}
              icon={
                <Button
                  type="text"
                  icon={
                    <SvgIcon
                      name="icons-common-icon_translate"
                      className={styles['lang-content-translate-icon']}
                      style={{ fontSize: 16 }}
                    />
                  }
                  loading={translateLoadingMap[record.key] || false}
                  onClick={() => handleTranslate(record)}
                />
              }
            ></TooltipIcon>
          </ConditionRender>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteWithConfirm(record)}
          />
        </Space>
      ),
    },
  ];

  // 查询多语言配置列表
  const request = async (params: {
    current?: number;
    pageSize?: number;
    side?: string;
    key?: string;
    value?: string;
  }) => {
    const response = await apiI18nConfigList({
      lang,
      side: params.side,
      key: params.key,
      pageNo: params.current || 1,
      pageSize: params.pageSize || 15,
    });

    const pageData = response?.data as Page<I18nSlideLangInfo>;
    return {
      data: pageData.records || [],
      total: pageData.total || 0,
      success: response.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout
      title={`${lang} - ${dict('PC.Pages.SystemConfig.LangContent.keyValMng')}`}
      back={true}
      rightSlot={
        <>
          {/* 只有非默认语言可以将默认语言的键值对翻译为当前语言 */}
          <ConditionRender condition={defaultLang}>
            <Button
              loading={translateAllLoading}
              onClick={handleTranslateAllWithConfirm}
            >
              {dict('PC.Pages.SystemConfig.LangContent.translateAllBtn')}
            </Button>
          </ConditionRender>
          {/* 只有默认语言可以批量新增或更新 */}
          <ConditionRender condition={!defaultLang}>
            <Button type="primary" onClick={() => setBatchModalOpen(true)}>
              {dict('PC.Pages.SystemConfig.LangContent.batchAddOrUpdateTitle')}
            </Button>
            <Button type="primary" onClick={handleOpenAddModal}>
              {dict('PC.Pages.SystemConfig.LangContent.addKeyValTitle')}
            </Button>
          </ConditionRender>
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

      {/* 新增或编辑键值对弹窗 */}
      <AddKeyValueModal
        open={addModalOpen}
        currentItem={currentItem}
        lang={lang}
        sideSelectOptions={sideSelectOptions}
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

      {/* 批量新增或更新键值对弹窗 */}
      <BatchKeyValueModal
        lang={lang}
        sideList={sideList}
        open={batchModalOpen}
        onCancel={() => setBatchModalOpen(false)}
        onSuccess={() => {
          setBatchModalOpen(false);
          actionRef.current?.reload();
        }}
      />
    </WorkspaceLayout>
  );
};

export default LangContent;
