import {
  ActionItem,
  TableActions,
  XProTable,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiSystemModelDelete,
  apiSystemModelList,
  apiSystemModelSave,
} from '@/services/systemManage';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { ModelTypeEnum } from '@/types/enums/modelConfig';
import { ModelComponentStatusEnum } from '@/types/enums/space';
import { ModelConfigDto } from '@/types/interfaces/systemManage';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import CreateModel from '../SpaceLibrary/CreateModel';
import TargetAuthModal from '../SystemManagement/Content/components/TargetAuthModal';

/**
 * 公共模型管理页面 (原全局模型管理)
 */
const GlobalModelManage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [visible, setVisible] = useState<boolean>(false);
  const [modelId, setModelId] = useState<number>();
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [currentAuthModelId, setCurrentAuthModelId] = useState<number | null>(
    null,
  );

  const selectOptions = [
    { label: '全部', value: '' },
    { label: '聊天对话-纯文本', value: ModelTypeEnum.Chat },
    { label: '向量嵌入', value: ModelTypeEnum.Embeddings },
    { label: '聊天对话-多模态', value: ModelTypeEnum.Multi },
  ];

  // 删除模型
  const handleConfirmDelete = async (id: number) => {
    const res = await apiSystemModelDelete({ id });
    if (res.code === SUCCESS_CODE) {
      message.success('删除成功');
      actionRef.current?.reload();
    } else {
      message.error(res.message || '删除失败');
    }
  };

  // 操作列配置
  const getActions = useCallback(
    (record: ModelConfigDto): ActionItem<ModelConfigDto>[] => {
      return [
        {
          key: 'edit',
          label: '编辑',
          onClick: () => {
            setModelId(record.id);
            setVisible(true);
          },
        },
        {
          key: 'auth',
          label: '授权',
          onClick: () => {
            setCurrentAuthModelId(record.id);
            setAuthModalOpen(true);
          },
        },
        {
          key: 'delete',
          label: '删除',
          type: 'danger',
          confirm: {
            title: '删除模型',
            description: (
              <div>
                确认删除模型 <span style={{ color: 'red' }}>{record.name}</span>
                ?
              </div>
            ),
          },
          onClick: (r) => handleConfirmDelete(r.id),
        },
      ];
    },
    [],
  );

  const columns: ProColumns<ModelConfigDto>[] = [
    {
      title: '模型名称',
      dataIndex: 'name',
      width: 200,
      fixed: 'left',
      hideInSearch: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 160,
      valueType: 'select',
      valueEnum: {
        [ModelTypeEnum.Chat]: { text: '聊天对话-纯文本' },
        [ModelTypeEnum.Embeddings]: { text: '向量嵌入' },
        [ModelTypeEnum.Multi]: { text: '聊天对话-多模态' },
      },
      fieldProps: {
        options: selectOptions.filter((v) => v.value !== ''),
      },
    },
    {
      title: '模型标识',
      dataIndex: 'model',
      width: 200,
      hideInSearch: true,
    },
    {
      title: '模型介绍',
      dataIndex: 'description',
      width: 260,
      hideInSearch: true,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      hideInSearch: true,
      valueEnum: {
        [ModelComponentStatusEnum.Enabled]: { text: '已启用' },
        [ModelComponentStatusEnum.Disabled]: { text: '已禁用' },
      },
    },
    {
      title: '创建者',
      dataIndex: ['creator', 'nickName'],
      width: 160,
      hideInSearch: true,
    },
    {
      title: '更新时间',
      dataIndex: 'created',
      width: 200,
      hideInSearch: true,
      valueType: 'dateTime',
    },
    {
      title: '操作',
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
    const { type } = params;
    const res = await apiSystemModelList();

    if (res.code !== SUCCESS_CODE) {
      message.error(res.message || '获取数据失败');
      return { data: [], total: 0, success: false };
    }

    let data = res.data || [];
    if (type) {
      data = data.filter((v) => v.type === type);
    }

    return {
      data,
      total: data.length,
      success: true,
    };
  };

  return (
    <WorkspaceLayout
      title="公共模型管理"
      hideScroll
      rightSlot={
        <Button
          key="add"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setModelId(undefined);
            setVisible(true);
          }}
        >
          添加模型
        </Button>
      }
    >
      <XProTable<ModelConfigDto>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={request}
      />
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
      <TargetAuthModal
        open={authModalOpen}
        targetId={currentAuthModelId || 0}
        targetType="model"
        onCancel={() => {
          setAuthModalOpen(false);
          setCurrentAuthModelId(null);
        }}
      />
    </WorkspaceLayout>
  );
};

export default GlobalModelManage;
