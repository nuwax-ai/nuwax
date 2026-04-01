import { SvgIcon } from '@/components/base';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentConversationModelOptions } from '@/services/agentConfig';
import { ModelOptionDto } from '@/types/interfaces/agent';
import { CheckOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modelList, setModelList] = useState<ModelOptionDto[]>([]);
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);

  // 获取模型选项列表
  const fetchModelOptions = useCallback(
    async (id: number) => {
      if (initializedRef.current) return;

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

    // 如果当前没有选中的模型 ID，或者选中的 ID 不在列表中，且列表不为空，则默认选中第一个
    const isSelectedInList = modelList.some((m) => m.id === selectedModelId);

    if (!selectedModelId || !isSelectedInList) {
      onModelSelect?.(modelList[0].id);
    }
  }, [initialized, modelList, selectedModelId, onModelSelect]);

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

  // 构建菜单项
  const menuItems: MenuProps['items'] = useMemo(() => {
    if (loading) {
      return [
        {
          key: 'loading',
          label: (
            <div className={cx(styles['menu-item'])}>
              <Spin size="small" />
              <span style={{ marginLeft: 8 }}>加载模型中...</span>
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
              <span className={cx(styles['item-name'])}>暂无可用自有模型</span>
            </div>
          ),
          disabled: true,
        },
      ];
    }

    return modelList.map((model) => {
      const isSelected = model.id === selectedModelId;
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
            {isSelected && (
              <CheckOutlined className={cx(styles['item-check'])} />
            )}
          </div>
        ),
        onClick: () => handleSelect(model),
      };
    });
  }, [loading, modelList, initialized, selectedModelId, handleSelect]);

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
      >
        <span className={cx(styles['model-selector'])}>
          <span
            className={cx(styles['selector-btn'], {
              [styles.open]: open,
            })}
          >
            <span>
              {selectedModel?.name || (loading ? '加载中...' : '选择模型')}
            </span>
            <SvgIcon
              name="icons-common-caret_down"
              style={{ fontSize: 14 }}
              className={cx(styles['selector-arrow'])}
            />
          </span>
        </span>
      </Dropdown>
    </div>
  );
};

export default ModelSelector;
