import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import CreateModel from '@/pages/SpaceLibrary/CreateModel';
import { apiAgentConversationModelOptions } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import { apiModelDelete } from '@/services/modelConfig';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { SpaceTypeEnum } from '@/types/enums/space';
import { ModelOptionDto } from '@/types/interfaces/agent';
import { SpaceInfo } from '@/types/interfaces/workspace';
import { modalConfirm } from '@/utils/ant-custom';
import {
  CheckOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, MenuProps, message, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import { ModelSelectorProps } from './types';

const cx = classNames.bind(styles);

/**
 * 智能体模型选择器组件
 * 在 allowOtherModel 为开启状态时显示，允许用户选择要使用的自有模型
 */
const ModelSelector: React.FC<ModelSelectorProps> = ({
  agentId,
  selectedModelId,
  onModelSelect,
  agentType,
  className,
}) => {
  const { spaceList } = useModel('spaceModel');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modelList, setModelList] = useState<ModelOptionDto[]>([]);
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);

  // 弹窗控制
  const [openModel, setOpenModel] = useState(false);
  const [editingModelId, setEditingModelId] = useState<number>();
  const [editingSpaceId, setEditingSpaceId] = useState<number>();
  const [shouldResetSelection, setShouldResetSelection] = useState(false);

  // 获取模型选项列表
  const fetchModelOptions = useCallback(
    async (id: number, force = false) => {
      if (initializedRef.current && !force) return;

      setLoading(true);
      try {
        const res = await apiAgentConversationModelOptions(id);
        if (res.code === SUCCESS_CODE && res.data) {
          // 根据智能体类型过滤模型
          const filteredData = res.data.filter((model: ModelOptionDto) => {
            // 如果没有智能体类型，或者模型没有使用场景限制，则显示
            if (
              !agentType ||
              !model.usageScenarios ||
              model.usageScenarios.length === 0
            ) {
              return true;
            }
            // 否则，只有当前智能体类型在模型的可用场景中时才显示
            return model.usageScenarios.includes(agentType);
          });

          setModelList(filteredData);
          setInitialized(true);
          initializedRef.current = true;
        }
      } catch (error) {
        console.error('获取智能体模型列表失败:', error);
      } finally {
        setLoading(false);
      }
    },
    [agentType],
  );

  // 挂载时加载数据
  useEffect(() => {
    if (agentId && !initialized) {
      fetchModelOptions(agentId);
    }
  }, [agentId, initialized, fetchModelOptions]);

  // 监听数据加载完成，自动应用默认选择
  useEffect(() => {
    if (!initialized || modelList.length === 0) return;

    // 如果当前没有选中的模型 ID，或者选中的 ID 不在列表中
    // 或者是因为新增/编辑/删除后强制要求重置选择
    const isSelectedInList = modelList.some((m) => m.id === selectedModelId);

    if (!selectedModelId || !isSelectedInList || shouldResetSelection) {
      onModelSelect?.(modelList[0].id);
      // 重置标记位
      if (shouldResetSelection) {
        setShouldResetSelection(false);
      }
    }
  }, [
    initialized,
    modelList,
    selectedModelId,
    onModelSelect,
    shouldResetSelection,
  ]);

  // 当前选中的模型信息
  const selectedModel = useMemo(() => {
    if (selectedModelId) {
      const found = modelList.find((m) => m.id === selectedModelId);
      if (found) return found;
    }
    if (modelList.length > 0) return modelList[0];
    return null;
  }, [selectedModelId, modelList]);

  // 处理模型选择
  const handleSelect = useCallback(
    (model: ModelOptionDto) => {
      if (model.id === selectedModelId) {
        setOpen(false);
        return;
      }
      onModelSelect?.(model.id);
      setOpen(false);
    },
    [onModelSelect, selectedModelId],
  );

  // 处理弹窗确认后的逻辑
  const handleConfirmModel = useCallback(() => {
    setOpenModel(false);
    if (agentId) {
      // 标记为需要重置选中项为第一个
      setShouldResetSelection(true);
      fetchModelOptions(agentId, true);
    }
  }, [agentId, fetchModelOptions]);

  // 从空间列表中获取个人空间 ID
  const personalSpaceId = useMemo(() => {
    return spaceList?.find(
      (item: SpaceInfo) => item.type === SpaceTypeEnum.Personal,
    )?.id;
  }, [spaceList]);

  // 处理添加模型
  const handleAddModel = useCallback(() => {
    setEditingModelId(undefined);
    setEditingSpaceId(personalSpaceId);
    setOpenModel(true);
    setOpen(false); // 关闭下拉菜单
  }, [personalSpaceId]);

  // 处理编辑模型
  const handleEditModel = useCallback((model: ModelOptionDto) => {
    setEditingModelId(model.id);
    setEditingSpaceId(model.spaceId);
    setOpenModel(true);
    setOpen(false); // 关闭下拉菜单
  }, []);

  // 处理删除模型
  const handleDeleteModel = useCallback(
    (model: ModelOptionDto) => {
      modalConfirm(
        dict('PC.Pages.SpaceLibrary.Index.confirmDeleteComponent'),
        model.name,
        async () => {
          try {
            const res = await apiModelDelete(String(model.id));
            if (res.code === SUCCESS_CODE) {
              message.success(
                dict('PC.Pages.SpaceLibrary.Index.modelDeleteSuccess'),
              );
              if (agentId) {
                // 标记为需要重置选中项为第一个
                setShouldResetSelection(true);
                fetchModelOptions(agentId, true);
              }
            }
          } catch (error) {
            console.error('删除模型失败:', error);
          }
        },
      );
    },
    [agentId, fetchModelOptions],
  );

  // 构建菜单项
  const menuItems: MenuProps['items'] = useMemo(() => {
    if (loading) {
      return [
        {
          key: 'loading',
          label: (
            <div className={cx(styles['menu-item'])}>
              <Spin size="small" />
              <span style={{ marginLeft: 8 }}>
                {dict('PC.Components.ModelSelector.loadingModels')}
              </span>
            </div>
          ),
          disabled: true,
        },
      ];
    }

    if (modelList.length === 0 && initialized) {
      return [
        {
          key: 'empty',
          label: (
            <div className={cx(styles['menu-item'])}>
              <span className={cx(styles['item-name'])}>
                {dict('PC.Components.ModelSelector.noAvailableModels')}
              </span>
            </div>
          ),
          disabled: true,
        },
      ];
    }

    return modelList.map((model) => {
      const isSelected = model.id === selectedModelId;
      const isSpaceModel = model.spaceId !== -1;
      return {
        key: model.id,
        label: (
          <div className={cx(styles['menu-item'])}>
            <div className={cx(styles['item-content'])}>
              <span className={cx(styles['item-name'])}>{model.name}</span>
              {model.description && (
                <span className={cx(styles['item-desc'])}>
                  {model.description}
                </span>
              )}
            </div>
            {isSpaceModel && (
              <div className={cx(styles['item-actions'])}>
                <EditOutlined
                  className={cx(styles['action-icon'])}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditModel(model);
                  }}
                />
                <DeleteOutlined
                  className={cx(styles['action-icon'])}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteModel(model);
                  }}
                />
              </div>
            )}
            {isSelected && (
              <CheckOutlined className={cx(styles['item-check'])} />
            )}
          </div>
        ),
        onClick: () => handleSelect(model),
      };
    });
  }, [
    loading,
    modelList,
    initialized,
    selectedModelId,
    handleSelect,
    handleEditModel,
    handleDeleteModel,
  ]);

  if (!agentId || (modelList.length === 0 && initialized)) {
    return null;
  }

  return (
    <div className={cx(styles['model-selector-container'], className)}>
      <Dropdown
        menu={{
          items: menuItems,
        }}
        trigger={['click']}
        placement="topLeft"
        open={open}
        onOpenChange={setOpen}
        overlayClassName={styles['model-menu']}
        popupRender={(menu) => (
          <div className={styles['model-dropdown-container']}>
            {menu}
            <div className={styles['add-button-wrap']}>
              <Button
                block
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddModel}
              >
                {dict('PC.Components.ModelSelector.addModel')}
              </Button>
            </div>
          </div>
        )}
      >
        <span className={cx(styles['model-selector'])}>
          <span
            className={cx(styles['selector-btn'], {
              [styles.open]: open,
            })}
          >
            <span>
              {selectedModel?.name ||
                (loading
                  ? dict('PC.Components.ModelSelector.loading')
                  : dict('PC.Components.ModelSelector.selectModel'))}
            </span>
            <SvgIcon
              name="icons-common-caret_down"
              style={{ fontSize: 14 }}
              className={cx(styles['selector-arrow'])}
            />
          </span>
        </span>
      </Dropdown>

      {/* 创建/编辑模型弹窗 */}
      <ConditionRender condition={openModel}>
        <CreateModel
          mode={
            editingModelId
              ? CreateUpdateModeEnum.Update
              : CreateUpdateModeEnum.Create
          }
          spaceId={editingSpaceId}
          id={editingModelId}
          open={openModel}
          onCancel={() => setOpenModel(false)}
          onConfirm={handleConfirmModel}
        />
      </ConditionRender>
    </div>
  );
};

export default ModelSelector;
