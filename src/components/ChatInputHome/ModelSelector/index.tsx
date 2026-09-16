import { SvgIcon } from '@/components/base';
import CreateModel from '@/components/business-component/CreateModel';
import ConditionRender from '@/components/ConditionRender';
import { SUCCESS_CODE } from '@/constants/codes.constants';
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
import {
  Button,
  Dropdown,
  MenuProps,
  message,
  Segmented,
  Tag,
  Tooltip,
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

/** 模型供应商 icon 兜底图(options 回包 providerIcon 为空时使用) */
const DEFAULT_PROVIDER_ICON =
  'http://s3.nuwax.com:9443/nuwax-public/providers/custom.png';

/**
 * 模型归 tab 分类:三 tab 数据同源 options 接口——scope 为 Tenant 归
 * 系统;Space 域按 spaceType 细分(Personal 归个人、Team 归团队);
 * 遗留兜底:无 scope 的旧数据按 spaceId === -1 归系统,其余归个人
 */
const getModelTabKey = (model: ModelOptionDto): ModelTabKey => {
  if (model.scope === 'Tenant') return 'system';
  if (model.scope === 'Space') {
    return model.spaceType === SpaceTypeEnum.Team ? 'team' : 'personal';
  }
  return model.spaceId === -1 ? 'system' : 'personal';
};

/**
 * 截断文案 hover 展示全称(仅实际溢出时):
 * 弃用 Typography 内建 ellipsis tooltip——弹层关闭/文案变更瞬间门户
 * 会残留在 body 流末尾错位闪现(页面左下角偶现闪动),且无法传
 * destroyOnHidden;自绘 Tooltip 隐藏即销毁门户,规避该竞态
 */
const EllipsisTooltipText: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className }) => {
  const [tip, setTip] = useState('');
  return (
    <Tooltip title={tip} destroyOnHidden>
      <span
        className={className}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          setTip(el.scrollWidth > el.clientWidth ? text : '');
        }}
        onMouseLeave={() => setTip('')}
      >
        {text}
      </span>
    </Tooltip>
  );
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
  // 首项可能是 Space 域模型(个人/团队),会被分类出系统 tab,自动
  // 落回时优先在三 tab 合集中找它,实现跨 tab 恢复
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

  // 拉取模型列表(增删改模型后也会调用刷新)。三 tab 同源 options 接口:
  // 回包即该智能体可用的全部模型(系统/个人/团队),一次请求按
  // scope + spaceType 分类进各 tab,无需再调个人/团队独立接口
  const fetchAllModelLists = useCallback(
    async (id: number) => {
      setLoading(true);
      try {
        const res = await apiAgentConversationModelOptions(id);
        if (res.code === SUCCESS_CODE && res.data) {
          // 回包按"该智能体最近使用的模型"排序,先记录原始首项再分类
          // (首项可能在任意 tab,自动落回时跨 tab 优先恢复)
          setPreferredModelId(res.data[0]?.id);
          const tabModels: Record<ModelTabKey, ModelOptionDto[]> = {
            system: [],
            personal: [],
            team: [],
          };
          filterByAgentType(res.data).forEach((model) => {
            tabModels[getModelTabKey(model)].push(model);
          });
          setSystemModels(tabModels.system);
          setPersonalModels(tabModels.personal);
          setTeamModels(tabModels.team);
        }
      } catch (error) {
        console.error('Failed to get agent model list:', error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    },
    [filterByAgentType],
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

  // 渲染 tab 内单个模型项:名称前展示供应商 icon,系统 tab 展示 tag /
  // 倍率,个人 tab 常驻编辑/删除按钮,团队 tab 不分组平铺(空间名 tag
  // 靠名称行最右)。三个 tab 统一:勾选 icon 恒排行末最右,常驻占位
  // 仅切换显隐
  const renderModelItem = useCallback(
    (model: ModelOptionDto, tab: ModelTabKey) => {
      const isSelected = model.id === selectedModelId;
      const showMeta = tab === 'system';
      // 系统 tab 的倍率有值才展示
      const hasCost =
        showMeta &&
        model.cost !== null &&
        model.cost !== undefined &&
        model.cost !== '';
      // 勾选 icon 常驻渲染占位,选中态由样式切换 opacity,行内布局恒定
      const checkIcon = <CheckOutlined className={cx(styles['item-check'])} />;
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
              {/* 供应商 icon:回包 providerIcon 为空时兜底 custom.png */}
              <img
                className={cx(styles['item-icon'])}
                src={model.providerIcon || DEFAULT_PROVIDER_ICON}
                alt=""
              />
              {/* 名称截断时 hover tooltip 展示全称(与描述行同款) */}
              <EllipsisTooltipText
                text={model.name}
                className={cx(styles['item-name'])}
              />
              {showMeta && model.tag && (
                <Tag
                  color={model.tagColor || undefined}
                  className={cx(styles['item-tag'])}
                >
                  {model.tag}
                </Tag>
              )}
              {/* 团队 tab:空间名 tag 吸附名称行最右(勾选 icon 统一在行末) */}
              {tab === 'team' && model.spaceName && (
                <Tag
                  className={cx(styles['item-tag'], styles['item-space-tag'])}
                >
                  {model.spaceName}
                </Tag>
              )}
            </div>
          </div>
          {/* 系统模型的倍率 */}
          {hasCost && (
            <span className={cx(styles['item-cost'])}>{model.cost}</span>
          )}
          {/* 个人 tab:编辑/删除按钮 */}
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
          {/* 三个 tab 统一:勾选 icon 恒居行末最右(常驻占位,opacity 显隐) */}
          {checkIcon}
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
            <EllipsisTooltipText
              text={
                selectedModel?.name ||
                dict('PC.Components.ModelSelector.selectModel')
              }
            />
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
