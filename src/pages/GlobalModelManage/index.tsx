import { DragHandle, Row } from '@/components/base/DraggableTableRow';
import {
  ActionItem,
  TableActions,
  XProTable,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { MODEL_TYPE_LIST } from '@/constants/library.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiSystemModelAccessControl,
  apiSystemModelDelete,
  apiSystemModelList,
  apiSystemModelSave,
  apiSystemModelSortUpdate,
} from '@/services/systemManage';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { ModelCapabilityTypeEnum } from '@/types/enums/modelConfig';
import { ModelComponentStatusEnum } from '@/types/enums/space';
import { AccessControlEnum } from '@/types/enums/systemManage';
import { ModelConfigDto } from '@/types/interfaces/systemManage';
import { PlusOutlined } from '@ant-design/icons';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, message, Switch } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useModel } from 'umi';
import ModalitiesTagsCell from '../MorePage/ModelPermissions/ModalitiesTagsCell';
import CreateModel from '../SpaceLibrary/CreateModel';
import TargetAuthModal from '../SystemManagement/Content/components/TargetAuthModal';

/**
 * 公共模型管理页面 (原全局模型管理)
 */
const GlobalModelManage: React.FC = () => {
  const { hasPermission } = useModel('menuModel');
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const location = useLocation();
  const [visible, setVisible] = useState<boolean>(false);
  const [modelId, setModelId] = useState<number>();
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [currentAuthModelId, setCurrentAuthModelId] = useState<number | null>(
    null,
  );
  const [currentAuthModelName, setCurrentAuthModelName] = useState<string>('');
  // 管控状态切换 loading 状态
  const [accessControlLoadingMap, setAccessControlLoadingMap] = useState<
    Record<number, boolean>
  >({});
  const [draggableData, setDraggableData] = useState<ModelConfigDto[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const originalDataRef = useRef<ModelConfigDto[] | null>(null);

  /** 能力类型 value → 展示文案，供列 render Tag 使用 */
  const capabilityTypeLabelMap = Object.fromEntries(
    MODEL_TYPE_LIST.map((item) => [item.value, item.label]),
  ) as Record<ModelCapabilityTypeEnum, string>;

  /** ProTable valueEnum：类型列检索表单项与筛选展示 */
  const capabilityTypeValueEnum = Object.fromEntries(
    MODEL_TYPE_LIST.map((item) => [item.value, { text: item.label }]),
  ) as Record<ModelCapabilityTypeEnum, { text: string }>;

  /** 类型筛选下拉：首项「全部」value 为空；fieldProps 会排除空值项 */
  const typesSelectOptions = [
    { label: dict('PC.Pages.GlobalModelManage.all'), value: '' },
    ...MODEL_TYPE_LIST,
  ];

  /** 状态筛选下拉：首项「全部」value 为空 */
  const statusSelectOptions = [
    { label: dict('PC.Pages.GlobalModelManage.all'), value: '' },
    {
      label: dict('PC.Pages.GlobalModelManage.statusEnabled'),
      value: ModelComponentStatusEnum.Enabled,
    },
    {
      label: dict('PC.Pages.GlobalModelManage.statusDisabled'),
      value: ModelComponentStatusEnum.Disabled,
    },
  ];

  // 删除模型
  const handleConfirmDelete = async (id: number) => {
    const res = await apiSystemModelDelete({ id });
    if (res.code === SUCCESS_CODE) {
      message.success(dict('PC.Toast.Global.deletedSuccessfully'));
      actionRef.current?.reload();
    } else {
      message.error(
        res.message || dict('PC.Pages.GlobalModelManage.deleteFailed'),
      );
    }
  };

  /**
   * 切换管控状态
   */
  const handleAccessControlChange = useCallback(
    async (record: ModelConfigDto, checked: boolean) => {
      const newStatus = checked
        ? AccessControlEnum.Filter
        : AccessControlEnum.NoFilter;
      setAccessControlLoadingMap((prev) => ({
        ...prev,
        [record.id]: true,
      }));
      try {
        const response = await apiSystemModelAccessControl(
          record.id,
          newStatus,
        );
        if (response.code === SUCCESS_CODE) {
          actionRef.current?.reload();
        } else {
          message.error(
            response.message ||
              dict('PC.Pages.GlobalModelManage.accessControlUpdateFailed'),
          );
        }
      } finally {
        setAccessControlLoadingMap((prev) => ({
          ...prev,
          [record.id]: false,
        }));
      }
    },
    [],
  );

  const handleReset = useCallback(() => {
    // 重置表单
    formRef.current?.resetFields();
    // 重置表格状态
    actionRef.current?.reset?.();
    // 设置分页参数:第1页,每页15条
    actionRef.current?.setPageInfo?.({ current: 1, pageSize: 15 });
    // 延迟一下再重新加载,确保分页参数已设置
    actionRef.current?.reload();
  }, []);

  // 监听 location.state 变化
  // 当 state 中存在 _t 变量时，说明是通过菜单切换过来的，需要清空 query 参数
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      handleReset();
    }
  }, [location.state, handleReset]);

  // 操作列配置
  const getActions = useCallback(
    (record: ModelConfigDto): ActionItem<ModelConfigDto>[] => {
      return [
        {
          key: 'edit',
          label: dict('PC.Pages.GlobalModelManage.edit'),
          disabled: !hasPermission('model_manage_modify'),
          onClick: () => {
            setModelId(record.id);
            setVisible(true);
          },
        },
        {
          key: 'auth',
          label: dict('PC.Pages.GlobalModelManage.auth'),
          // 只有开启管控才显示授权按钮
          visible: record.accessControl === AccessControlEnum.Filter,
          disabled: !hasPermission('model_manage_access_control'),
          onClick: () => {
            setCurrentAuthModelId(record.id);
            setCurrentAuthModelName(record.name);
            setAuthModalOpen(true);
          },
        },
        {
          key: 'delete',
          label: dict('PC.Common.Global.delete'),
          confirm: {
            title: dict('PC.Pages.GlobalModelManage.deleteModel'),
            description: (
              <div>
                {dict(
                  'PC.Pages.GlobalModelManage.confirmDeleteModel',
                  record.name,
                )}
              </div>
            ),
          },
          disabled: !hasPermission('model_manage_delete'),
          onClick: (r) => handleConfirmDelete(r.id),
        },
      ];
    },
    [hasPermission],
  );

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      isDraggingRef.current = false;
      return;
    }

    const activeId = Number(active.id);
    const overId = Number(over.id);
    const activeIndex = draggableData.findIndex((item) => item.id === activeId);
    const overIndex = draggableData.findIndex((item) => item.id === overId);

    if (activeIndex === -1 || overIndex === -1) {
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = true;
    originalDataRef.current = [...draggableData];

    const newData = arrayMove(draggableData, activeIndex, overIndex);
    setDraggableData(newData);

    const sortPayload = newData.map((item, index) => ({
      id: item.id,
      sort: index + 1,
    }));

    if (sortPayload.length === 0) {
      isDraggingRef.current = false;
      return;
    }

    try {
      const response = await apiSystemModelSortUpdate(sortPayload);
      if (response?.code !== SUCCESS_CODE) {
        throw new Error('update model sort failed');
      }
      message.success(dict('PC.Common.Global.saveSuccess'));
      originalDataRef.current = null;
    } catch {
      if (originalDataRef.current) {
        setDraggableData(originalDataRef.current);
        originalDataRef.current = null;
      } else {
        actionRef.current?.reload();
      }
    } finally {
      isDraggingRef.current = false;
    }
  };

  const columns: ProColumns<ModelConfigDto>[] = [
    {
      title: dict('PC.Pages.SystemRoleManage.columnSort'),
      key: 'sort',
      align: 'center',
      width: 72,
      fixed: 'left',
      hideInSearch: true,
      render: () => <DragHandle />,
    },
    {
      title: dict('PC.Pages.GlobalModelManage.columnModelName'),
      dataIndex: 'name',
      fixed: 'left',
      hideInSearch: true,
    },
    {
      // 能力类型列：表格以 Tag 展示；检索为 select，筛选逻辑见 request（仅前端）
      title: dict('PC.Pages.GlobalModelManage.columnType'),
      dataIndex: 'types',
      valueType: 'select',
      valueEnum: capabilityTypeValueEnum,
      fieldProps: {
        options: typesSelectOptions.filter((v) => v.value !== ''),
      },
      ellipsis: false,
      render: (_, record) => {
        const types = record.types;
        if (!types?.length) {
          return '-';
        }
        return (
          <ModalitiesTagsCell types={types} labelMap={capabilityTypeLabelMap} />
        );
      },
    },
    {
      title: dict('PC.Pages.GlobalModelManage.columnModelId'),
      dataIndex: 'model',
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.GlobalModelManage.columnDescription'),
      dataIndex: 'description',
      hideInSearch: true,
    },
    {
      // 状态列：检索为 select，筛选逻辑见 request（仅前端）
      title: dict('PC.Pages.GlobalModelManage.columnStatus'),
      dataIndex: 'enabled',
      width: 150,
      valueType: 'select',
      valueEnum: {
        [ModelComponentStatusEnum.Enabled]: {
          text: dict('PC.Pages.GlobalModelManage.statusEnabled'),
        },
        [ModelComponentStatusEnum.Disabled]: {
          text: dict('PC.Pages.GlobalModelManage.statusDisabled'),
        },
      },
      fieldProps: {
        options: statusSelectOptions.filter((v) => v.value !== ''),
      },
    },
    {
      title: dict('PC.Pages.GlobalModelManage.columnCreator'),
      dataIndex: ['creator', 'nickName'],
      hideInSearch: true,
    },
    {
      title: dict('PC.Pages.GlobalModelManage.columnUpdateTime'),
      dataIndex: 'created',
      width: 200,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: dict('PC.Pages.GlobalModelManage.columnAccessControl'),
      tooltip: dict('PC.Pages.GlobalModelManage.accessControlTooltip'),
      dataIndex: 'accessControl',
      align: 'center',
      width: 120,
      fixed: 'right',
      valueEnum: {
        [AccessControlEnum.NoFilter]: {
          text: dict('PC.Pages.GlobalModelManage.accessControlOff'),
          status: 'Default',
        },
        [AccessControlEnum.Filter]: {
          text: dict('PC.Pages.GlobalModelManage.accessControlOn'),
          status: 'Processing',
        },
      },
      valueType: 'select',
      render: (_, record: ModelConfigDto) => (
        <Switch
          checked={record.accessControl === AccessControlEnum.Filter}
          loading={accessControlLoadingMap[record.id] || false}
          onChange={(checked) => handleAccessControlChange(record, checked)}
        />
      ),
    },
    {
      title: dict('PC.Pages.GlobalModelManage.columnActions'),
      valueType: 'option',
      width: 180,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <TableActions<ModelConfigDto>
          record={record}
          actions={getActions(record)}
        />
      ),
    },
  ];

  const request = async (params: any) => {
    // 检索表单 types / enabled；apiSystemModelList 无对应参数，筛选仅在前端执行
    const { types, enabled } = params;
    const res = await apiSystemModelList();

    if (res.code !== SUCCESS_CODE) {
      message.error(
        res.message || dict('PC.Pages.GlobalModelManage.fetchDataFailed'),
      );
      return { data: [], total: 0, success: false };
    }

    let data = res.data || [];
    if (types) {
      // 保留 record.types 包含所选能力类型的行
      data = data.filter((v) => v.types?.includes(types));
    }
    if (enabled !== undefined && enabled !== '') {
      data = data.filter((v) => Number(v.enabled) === Number(enabled));
    }
    const { accessControl } = params;
    if (accessControl !== undefined) {
      data = data.filter((v) => v.accessControl === Number(accessControl));
    }

    return {
      data,
      total: data.length,
      success: true,
    };
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.GlobalModelManage.pageTitle')}
      hideScroll
      rightSlot={
        hasPermission('model_manage_add') && (
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setModelId(undefined);
              setVisible(true);
            }}
          >
            {dict('PC.Pages.GlobalModelManage.addModel')}
          </Button>
        )
      }
    >
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={draggableData.map((item) => String(item.id))}
          strategy={verticalListSortingStrategy}
        >
          <XProTable<ModelConfigDto>
            actionRef={actionRef}
            formRef={formRef}
            rowKey="id"
            columns={columns}
            request={request}
            dataSource={draggableData}
            pagination={false}
            showIndex={false}
            onReset={handleReset}
            showQueryButtons={hasPermission('model_manage_query_list')}
            scroll={{ x: 'max-content' }}
            components={{
              body: {
                row: Row,
              },
            }}
            postData={(data: ModelConfigDto[]) => {
              if (!isDraggingRef.current) {
                setDraggableData(data || []);
              }
              return data;
            }}
          />
        </SortableContext>
      </DndContext>

      {/* 添加模型 */}
      {visible && (
        <CreateModel
          action={apiSystemModelSave}
          id={modelId}
          mode={
            modelId ? CreateUpdateModeEnum.Update : CreateUpdateModeEnum.Create
          }
          open={visible}
          onCancel={() => setVisible(false)}
          onConfirm={() => {
            setVisible(false);
            actionRef.current?.reload();
          }}
        />
      )}

      {/* 授权模型 */}
      <TargetAuthModal
        open={authModalOpen}
        targetId={currentAuthModelId || 0}
        targetType="model"
        targetName={currentAuthModelName}
        onCancel={() => {
          setAuthModalOpen(false);
          setCurrentAuthModelId(null);
          setCurrentAuthModelName('');
        }}
      />
    </WorkspaceLayout>
  );
};

export default GlobalModelManage;
