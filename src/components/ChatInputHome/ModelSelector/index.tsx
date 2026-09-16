import { SvgIcon } from '@/components/base';
import CreateModel from '@/components/business-component/CreateModel';
import ConditionRender from '@/components/ConditionRender';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentConversationModelOptions } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import {
  apiModelDelete,
  apiModelListPersonal,
  apiModelListTeam,
} from '@/services/modelConfig';
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
import {
  Button,
  Dropdown,
  MenuProps,
  message,
  Segmented,
  Tag,
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import { ModelSelectorProps } from './types';

const cx = classNames.bind(styles);

/** 模型弹层 tab:系统(公共)/ 个人 / 团队 */
type ModelTabKey = 'system' | 'personal' | 'team';

/**
 * 判断是否系统(公共)模型,沿用旧分组规则:
 * scope 为 Tenant 或未归属任何空间(spaceId === -1)时视为系统模型;
 * Space(空间)域模型(个人/团队)不属于公共维度,过滤出系统 tab
 */
const isSystemModel = (model: ModelOptionDto) => {
  if (model.scope === 'Tenant') return true;
  if (model.scope === 'Space') return false;
  return model.spaceId === -1;
};

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
  modelList: externalModelList,
}) => {
  const isExternalList = externalModelList !== undefined;
  const { spaceList } = useModel('spaceModel');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // 外部注入列表(external 模式专用,渲染保持旧版分组下拉)
  const [modelList, setModelList] = useState<ModelOptionDto[]>([]);

  // 三 tab 数据(agentId 模式):系统 / 个人 / 团队
  const [systemModels, setSystemModels] = useState<ModelOptionDto[]>([]);
  const [personalModels, setPersonalModels] = useState<ModelOptionDto[]>([]);
  const [teamModels, setTeamModels] = useState<ModelOptionDto[]>([]);
  const [activeTab, setActiveTab] = useState<ModelTabKey>('system');

  // options 接口原始回包首项 id(后端按"该智能体最近使用的模型"排首):
  // 首项可能是 Space 域模型(个人/团队),会被 isSystemModel 过滤出
  // 系统 tab,自动落回时优先在三 tab 合集中找它,实现跨 tab 恢复
  const [preferredModelId, setPreferredModelId] = useState<number>();

  // 弹窗控制
  const [openModel, setOpenModel] = useState(false);
  const [editingModelId, setEditingModelId] = useState<number>();
  const [editingSpaceId, setEditingSpaceId] = useState<number>();
  const [shouldResetSelection, setShouldResetSelection] = useState(false);

  // 按智能体类型过滤模型(可用场景限制)
  const filterByAgentType = useCallback(
    (models: ModelOptionDto[]) =>
      models.filter((model) => {
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
      }),
    [agentType],
  );

  // 获取系统 tab 模型:按智能体查询可用模型,仅保留系统(公共)部分;
  // 回包涵盖系统/个人/团队三个维度,其 id 集是"该智能体可用模型"的
  // 权威口径,返回给调用方供个人/团队 tab 过滤
  const fetchSystemModels = useCallback(
    async (id: number): Promise<Set<number> | undefined> => {
      try {
        const res = await apiAgentConversationModelOptions(id);
        if (res.code === SUCCESS_CODE && res.data) {
          // 回包按"最近使用"排序,先记录原始首项再过滤(首项可能非系统域)
          setPreferredModelId(res.data[0]?.id);
          setSystemModels(filterByAgentType(res.data.filter(isSystemModel)));
        }
        return new Set(res.data?.map((model) => model.id));
      } catch (error) {
        console.error('Failed to get agent model list:', error);
        // 拉取失败返回 undefined:个人/团队退化为不过滤(维持可用性)
        return undefined;
      }
    },
    [filterByAgentType],
  );

  // 获取个人 tab 模型:按 options 回包 id 集过滤(独立接口无智能体
  // 上下文,需剔除当前智能体不可用的模型),再叠加智能体类型过滤
  const fetchPersonalModels = useCallback(
    async (availableIds?: Set<number>) => {
      try {
        const res = await apiModelListPersonal();
        if (res.code === SUCCESS_CODE && res.data) {
          const models = availableIds
            ? res.data.filter((model) => availableIds.has(model.id))
            : res.data;
          setPersonalModels(filterByAgentType(models));
        }
      } catch (error) {
        console.error('Failed to get personal model list:', error);
      }
    },
    [filterByAgentType],
  );

  // 获取团队 tab 模型:过滤规则同个人 tab
  const fetchTeamModels = useCallback(
    async (availableIds?: Set<number>) => {
      try {
        const res = await apiModelListTeam();
        if (res.code === SUCCESS_CODE && res.data) {
          const models = availableIds
            ? res.data.filter((model) => availableIds.has(model.id))
            : res.data;
          setTeamModels(filterByAgentType(models));
        }
      } catch (error) {
        console.error('Failed to get team model list:', error);
      }
    },
    [filterByAgentType],
  );

  // 拉取三个 tab 的模型列表(增删改模型后也会调用刷新)。options 是
  // 权威口径须先到,个人/团队回包按其 id 集过滤,二者之间保持并行
  const fetchAllModelLists = useCallback(
    async (id: number) => {
      setLoading(true);
      try {
        const availableIds = await fetchSystemModels(id);
        await Promise.all([
          fetchPersonalModels(availableIds),
          fetchTeamModels(availableIds),
        ]);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    },
    [fetchSystemModels, fetchPersonalModels, fetchTeamModels],
  );

  // 监听 agentId 的变化，当 agentId 改变时，重新加载数据并重置初始化状态与模型列表
  useEffect(() => {
    if (isExternalList) return;
    if (agentId) {
      setInitialized(false);
      setSystemModels([]);
      setPersonalModels([]);
      setTeamModels([]);
      setPreferredModelId(undefined);
      fetchAllModelLists(agentId);
    }
  }, [agentId, fetchAllModelLists, isExternalList]);

  // 外部预加载模型列表：直接使用传入数据，跳过接口拉取
  useEffect(() => {
    if (!isExternalList) return;
    setModelList(externalModelList);
    setInitialized(true);
  }, [isExternalList, externalModelList]);

  // 三 tab 数据合集(agentId 模式);external 模式沿用注入列表
  const allModels = useMemo(
    () => [...systemModels, ...personalModels, ...teamModels],
    [systemModels, personalModels, teamModels],
  );
  const lookupList = isExternalList ? modelList : allModels;

  // 监听数据加载完成，自动应用默认选择
  useEffect(() => {
    if (!initialized || lookupList.length === 0) return;

    // 如果当前没有选中的模型 ID，或者选中的 ID 不在列表中
    // 或者是因为新增/编辑/删除后强制要求重置选择
    const isSelectedInList = lookupList.some((m) => m.id === selectedModelId);

    if (!selectedModelId || !isSelectedInList || shouldResetSelection) {
      // 优先落回 options 回包首项(该智能体最近使用的模型,可能位于
      // 个人/团队 tab);不在合集(如被智能体类型过滤)时落回系统首个
      const preferred =
        lookupList.find((m) => m.id === preferredModelId) || lookupList[0];
      onModelSelect?.(preferred.id);
      // 重置标记位
      if (shouldResetSelection) {
        setShouldResetSelection(false);
      }
    }
  }, [
    initialized,
    lookupList,
    selectedModelId,
    onModelSelect,
    shouldResetSelection,
    preferredModelId,
  ]);

  // 当前选中的模型信息
  const selectedModel = useMemo(() => {
    if (selectedModelId) {
      const found = lookupList.find((m) => m.id === selectedModelId);
      if (found) return found;
    }
    if (lookupList.length > 0) return lookupList[0];
    return null;
  }, [selectedModelId, lookupList]);

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
      fetchAllModelLists(agentId);
    }
  }, [agentId, fetchAllModelLists]);

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

  // 处理编辑模型(仅个人 tab 模型)
  const handleEditModel = useCallback((model: ModelOptionDto) => {
    setEditingModelId(model.id);
    setEditingSpaceId(model.spaceId);
    setOpenModel(true);
    setOpen(false);
  }, []);

  // 处理删除模型(仅个人 tab 模型)
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
                fetchAllModelLists(agentId);
              }
            }
          } catch (error) {
            console.error('Failed to delete model:', error);
          }
        },
      );
    },
    [agentId, fetchAllModelLists],
  );

  // 打开弹层时自动定位到选中模型所在的 tab
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen && !isExternalList) {
        if (personalModels.some((m) => m.id === selectedModelId)) {
          setActiveTab('personal');
        } else if (teamModels.some((m) => m.id === selectedModelId)) {
          setActiveTab('team');
        } else {
          setActiveTab('system');
        }
      }
    },
    [isExternalList, personalModels, teamModels, selectedModelId],
  );

  // 渲染 tab 内单个模型项:
  // 系统 tab 展示 tag / 倍率(勾选 icon 排倍率之前);个人 tab 保留编辑/删除;
  // 团队 tab 不分组平铺,空间名作为 tag 展示在名称行最右侧
  const renderModelItem = useCallback(
    (model: ModelOptionDto, tab: ModelTabKey) => {
      const isSelected = model.id === selectedModelId;
      const showMeta = tab === 'system';
      // 系统 tab 有倍率时勾选 icon 紧排倍率之前,其余(无倍率)维度保持行末
      const hasCost =
        showMeta &&
        model.cost !== null &&
        model.cost !== undefined &&
        model.cost !== '';
      const checkIcon = isSelected ? (
        <CheckOutlined className={cx(styles['item-check'])} />
      ) : null;
      return (
        <div
          key={model.id}
          className={cx(styles['list-item'], {
            [styles['item-selected']]: isSelected,
          })}
          onClick={() => handleSelect(model)}
        >
          <div className={cx(styles['item-content'])}>
            <div className={cx(styles['item-title-row'])}>
              {/* 名称截断时 hover tooltip 展示全称(与描述行同款) */}
              <Typography.Text
                className={cx(styles['item-name'])}
                ellipsis={{ tooltip: model.name }}
              >
                {model.name}
              </Typography.Text>
              {showMeta && model.tag && (
                <Tag
                  color={model.tagColor || undefined}
                  className={cx(styles['item-tag'])}
                >
                  {model.tag}
                </Tag>
              )}
              {/* 团队 tab:空间名 tag 吸附名称行最右端(勾选 icon 之前) */}
              {tab === 'team' && model.spaceName && (
                <Tag
                  className={cx(styles['item-tag'], styles['item-space-tag'])}
                >
                  {model.spaceName}
                </Tag>
              )}
            </div>
          </div>
          {hasCost && checkIcon}
          {hasCost && (
            <span className={cx(styles['item-cost'])}>{model.cost}</span>
          )}
          {tab === 'personal' && (
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
          {!hasCost && checkIcon}
        </div>
      );
    },
    [selectedModelId, handleSelect, handleEditModel, handleDeleteModel],
  );

  // 渲染 tab 内容(空列表时给出占位文案)
  const renderTabPane = useCallback(
    (models: ModelOptionDto[], tab: ModelTabKey) => {
      if (models.length === 0) {
        return (
          <div className={cx(styles['model-list'], styles['list-empty'])}>
            {dict('PC.Components.ModelSelector.noModels')}
          </div>
        );
      }
      return (
        <div className={cx(styles['model-list'])}>
          {models.map((model) => renderModelItem(model, tab))}
        </div>
      );
    },
    [renderModelItem],
  );

  // Segmented 分段选项(样式对齐专家&技能&连接器页主 tab)
  const segmentedOptions = useMemo(
    () => [
      {
        label: dict('PC.Components.ModelSelector.tabSystem'),
        value: 'system',
      },
      {
        label: dict('PC.Components.ModelSelector.tabPersonal'),
        value: 'personal',
      },
      { label: dict('PC.Components.ModelSelector.tabTeam'), value: 'team' },
    ],
    [],
  );

  // 当前 tab 对应的模型列表
  const activeTabModels = useMemo(() => {
    if (activeTab === 'personal') return personalModels;
    if (activeTab === 'team') return teamModels;
    return systemModels;
  }, [activeTab, systemModels, personalModels, teamModels]);

  // external 模式:调用方注入列表,维持旧版分组下拉(无 tab、无增删改)
  const menuItems: MenuProps['items'] = useMemo(() => {
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

    const renderMenuItem = (model: ModelOptionDto) => {
      const isSelected = model.id === selectedModelId;
      return {
        key: model.id,
        label: (
          <div className={cx(styles['menu-item'])}>
            <div className={cx(styles['item-content'])}>
              <Typography.Text
                className={cx(styles['item-name'])}
                ellipsis={{ tooltip: model.name }}
              >
                {model.name}
              </Typography.Text>
              {model.description && (
                <Typography.Text
                  className={cx(styles['item-desc'])}
                  ellipsis={{ tooltip: model.description }}
                >
                  {model.description}
                </Typography.Text>
              )}
            </div>
            {isSelected && (
              <CheckOutlined className={cx(styles['item-check'])} />
            )}
          </div>
        ),
        onClick: () => handleSelect(model),
      };
    };

    const tenantModels: ModelOptionDto[] = [];
    const spaceModels: ModelOptionDto[] = [];

    modelList.forEach((model) => {
      if (model.scope === 'Tenant') {
        tenantModels.push(model);
      } else if (model.scope === 'Space') {
        spaceModels.push(model);
      } else {
        if (model.spaceId !== -1) {
          spaceModels.push(model);
        } else {
          tenantModels.push(model);
        }
      }
    });

    const items: MenuProps['items'] = [];

    if (tenantModels.length > 0) {
      items.push({
        type: 'group',
        label: dict('PC.Components.ModelSelector.systemModel'),
        key: 'tenant-group',
        children: tenantModels.map(renderMenuItem),
      });
    }

    if (spaceModels.length > 0) {
      items.push({
        type: 'group',
        label: dict('PC.Components.ModelSelector.personalSpace'),
        key: 'space-group',
        children: spaceModels.map(renderMenuItem),
      });
    }

    return items.length > 0 ? items : modelList.map(renderMenuItem);
  }, [modelList, initialized, selectedModelId, handleSelect]);

  if (
    (!isExternalList && !agentId) ||
    (lookupList.length === 0 && initialized)
  ) {
    return null;
  }

  const isShow = initialized && !loading;

  return (
    <div
      className={cx(styles['model-selector-container'], className, {
        [styles.show]: isShow,
      })}
    >
      <Dropdown
        menu={isExternalList ? { items: menuItems } : undefined}
        trigger={['click']}
        placement="topLeft"
        open={open}
        onOpenChange={handleOpenChange}
        overlayClassName={styles['model-menu']}
        popupRender={(menu) => (
          <div
            className={cx(
              styles['model-dropdown-container'],
              // 三 tab 模式弹层定高;external 分组下拉保持自适应
              !isExternalList && styles['tab-mode'],
            )}
          >
            {isExternalList ? (
              menu
            ) : (
              <>
                <Segmented
                  block
                  options={segmentedOptions}
                  value={activeTab}
                  onChange={(value) => setActiveTab(value as ModelTabKey)}
                  className={cx(styles['model-tabs'])}
                />
                {renderTabPane(activeTabModels, activeTab)}
              </>
            )}
            {!isExternalList && (
              <div className={styles['add-button-wrap']}>
                <Button
                  block
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={handleAddModel}
                >
                  {dict('PC.Components.ModelSelector.addPersonalModel')}
                </Button>
              </div>
            )}
          </div>
        )}
      >
        <span className={cx(styles['model-selector'])}>
          <span
            className={cx(styles['selector-btn'], {
              [styles.open]: open,
            })}
          >
            <Typography.Text
              ellipsis={{
                tooltip:
                  selectedModel?.name ||
                  dict('PC.Components.ModelSelector.selectModel'),
              }}
            >
              {selectedModel?.name ||
                dict('PC.Components.ModelSelector.selectModel')}
            </Typography.Text>
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
