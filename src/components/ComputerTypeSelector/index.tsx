import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiGetUserSelectableSandboxList,
  apiSaveSelectedSandbox,
} from '@/services/systemManage';
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
import { SvgIcon } from '../base';
import styles from './index.less';
import type { ComputerOption, ComputerTypeSelectorProps } from './types';

const cx = classNames.bind(styles);

/**
 * 无可用电脑选项
 */
const NO_COMPUTER_OPTION: ComputerOption = {
  id: '',
  name: '无可用电脑',
  description: '',
};

/**
 * 电脑不可用选项
 */
const UNAVAILABLE_OPTION: ComputerOption = {
  id: '',
  name: '电脑不可用',
  description: '',
};

/**
 * 电脑类型选择器组件
 * 在智能体电脑模式下显示，允许用户选择使用的电脑
 */
const ComputerTypeSelector: React.FC<ComputerTypeSelectorProps> = ({
  value = '',
  onChange,
  disabled = false,
  className,
  agentId,
  fixedSelection = false,
  unavailable = false,
  options: externalOptions,
  autoSelect = true,
  saveOnSelect = true,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [computerList, setComputerList] = useState<ComputerOption[]>([]);
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);

  const [agentSelectedMap, setAgentSelectedMap] = useState<
    Record<string, string>
  >({});

  // 使用外部或内部电脑列表
  const effectiveComputerList = useMemo(
    () => externalOptions || computerList,
    [externalOptions, computerList],
  );

  // 是否从外部加载
  const isExternalLoaded = !!externalOptions;
  // 综合初始化状态
  const isFullyInitialized = initialized || isExternalLoaded;

  // 获取用户电脑列表
  const fetchComputerList = useCallback(async () => {
    if (initializedRef.current || isExternalLoaded) return;

    setLoading(true);
    try {
      const res = await apiGetUserSelectableSandboxList();
      if (res.code === SUCCESS_CODE && res.data) {
        const { sandboxes, agentSelected: selectedMap } = res.data;
        const options: ComputerOption[] = sandboxes.map((item) => ({
          id: item.sandboxId,
          name: item.name,
          description: item.description,
          raw: item,
        }));
        setComputerList(options);
        if (selectedMap) {
          setAgentSelectedMap(selectedMap);
        }
        setInitialized(true);
        initializedRef.current = true;
      }
    } catch (error) {
      console.error('获取电脑列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 监听 agentId 和 agentSelectedMap 变化，自动应用选择
  useEffect(() => {
    if (
      !autoSelect ||
      fixedSelection ||
      !isFullyInitialized ||
      effectiveComputerList.length === 0
    )
      return;

    // 检查当前 value 是否在列表中有效
    const isValueValid =
      value &&
      effectiveComputerList.some((opt) => String(opt.id) === String(value));

    let selectedId: string | null = null;

    // 1. 如果有agentId，检查是否有已保存的选择
    if (
      agentId &&
      agentSelectedMap &&
      Object.keys(agentSelectedMap).length > 0
    ) {
      const savedSelection = agentSelectedMap[String(agentId)];
      if (savedSelection) {
        selectedId = savedSelection;
      }
    }

    // 2. 如果没有已保存的选择，且当前值无效，默认选中列表中的第一个
    if (!selectedId && !isValueValid && effectiveComputerList.length > 0) {
      selectedId = effectiveComputerList[0].id;
    }

    // 如果确定了选择且与当前值不同，触发onChange
    if (selectedId && selectedId !== value) {
      const option = effectiveComputerList.find(
        (opt) => String(opt.id) === String(selectedId),
      );
      if (option) {
        onChange?.(selectedId, option);
      }
    }
  }, [
    agentId,
    agentSelectedMap,
    isFullyInitialized,
    effectiveComputerList,
    value,
    onChange,
    fixedSelection,
    autoSelect,
  ]);

  // 挂载时加载数据
  useEffect(() => {
    if (!isFullyInitialized) {
      fetchComputerList();
    }
  }, [isFullyInitialized, fetchComputerList]);

  // 当前选中的选项
  const selectedOption = useMemo(() => {
    // 如果电脑不可用，显示不可用状态
    if (unavailable) {
      return UNAVAILABLE_OPTION;
    }

    // 优先检查列表是否为空：如果已初始化且列表为空，直接显示无可用电脑
    if (isFullyInitialized && effectiveComputerList.length === 0) {
      return NO_COMPUTER_OPTION;
    }

    // 查找选中的电脑
    if (value) {
      const found = effectiveComputerList.find(
        (item) => String(item.id) === String(value),
      );
      if (found) {
        return found;
      }
      // 如果是固定选择且在列表中找不到，则显示不可用
      if (fixedSelection && isFullyInitialized) {
        return UNAVAILABLE_OPTION;
      }
    }
    // 如果已初始化且找不到，说明列表为空或选中的电脑不在列表中
    if (isFullyInitialized) {
      // 列表为空的情况上面已经处理过了

      // 如果是固定选择，且没找到（前面已经处理过），这里应该是不可达或者默认
      // 但为了安全起见，如果是固定选择，不应该fallback到第一个
      if (fixedSelection) {
        return UNAVAILABLE_OPTION;
      }
      // 返回第一个选项
      return effectiveComputerList[0];
    }
    // 未初始化时显示默认文本
    return { id: '', name: '选择电脑', description: '' };
  }, [
    value,
    effectiveComputerList,
    unavailable,
    isFullyInitialized,
    fixedSelection,
  ]);

  // 处理选择
  const handleSelect = useCallback(
    async (option: ComputerOption) => {
      // 如果选中的是当前已选中的，直接返回，不触发接口
      if (String(option.id) === String(value)) {
        setOpen(false);
        return;
      }

      onChange?.(option.id, option);
      setOpen(false);

      // 如果有 agentId，保存选择并更新本地映射
      if (agentId) {
        // 立即更新本地映射，防止 useEffect 回退选择
        setAgentSelectedMap((prev) => ({
          ...prev,
          [String(agentId)]: option.id,
        }));

        if (saveOnSelect) {
          try {
            await apiSaveSelectedSandbox(agentId, option.id);
          } catch (error) {
            console.error('保存电脑选择失败:', error);
            // 保存失败时可以考虑回滚本地映射，但暂时不处理
          }
        }
      }
    },
    [onChange, agentId, value, saveOnSelect],
  );

  // 构建菜单项
  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [];

    if (loading) {
      items.push({
        key: 'loading',
        label: (
          <div className={cx(styles['menu-item'])}>
            <Spin size="small" />
            <span style={{ marginLeft: 8 }}>加载中...</span>
          </div>
        ),
        disabled: true,
      });
    } else if (effectiveComputerList.length > 0) {
      effectiveComputerList.forEach((computer) => {
        const isSelected = String(computer.id) === String(value);
        items.push({
          key: computer.id,
          label: (
            <div className={cx(styles['menu-item'])}>
              <div className={cx(styles['item-content'])}>
                <span className={cx(styles['item-name'])}>{computer.name}</span>
                {computer.description && (
                  <span className={cx(styles['item-desc'])}>
                    {computer.description}
                  </span>
                )}
              </div>
              {isSelected && (
                <CheckOutlined className={cx(styles['item-check'])} />
              )}
            </div>
          ),
          onClick: () => handleSelect(computer),
        });
      });
    } else if (isFullyInitialized) {
      // 列表为空时显示提示
      items.push({
        key: 'empty',
        label: (
          <div
            className={cx(styles['menu-item'], styles['menu-item-disabled'])}
          >
            <span className={cx(styles['item-name'])}>暂无可用电脑</span>
          </div>
        ),
        disabled: true,
      });
    }

    return items;
  }, [loading, effectiveComputerList, isFullyInitialized, handleSelect, value]);

  // 计算是否真正禁用
  const isDisabled =
    disabled ||
    fixedSelection ||
    unavailable ||
    effectiveComputerList.length === 0;

  if (selectedOption === UNAVAILABLE_OPTION) {
    // 如果电脑不可用，不显示选择器
    return null;
  }

  return (
    <div className={cx(styles['computer-selector-container'], className)}>
      <Dropdown
        menu={{
          items: menuItems,
          selectedKeys: value ? [value] : [],
        }}
        trigger={['click']}
        placement="topRight"
        open={open}
        onOpenChange={setOpen}
        disabled={isDisabled}
        overlayClassName={styles['computer-menu']}
      >
        <span className={cx(styles['computer-selector'], className)}>
          <span
            className={cx(styles['selector-btn'], {
              [styles['selector-btn-active']]: !!value,
              [styles['selector-btn-unavailable']]:
                unavailable || selectedOption === UNAVAILABLE_OPTION,
              [styles.open]: open,
            })}
          >
            {/* <DesktopOutlined className={cx(styles['selector-icon'])} /> */}
            <span>
              {loading || !isFullyInitialized ? '' : selectedOption.name}
            </span>
            {!fixedSelection && !unavailable && (
              <SvgIcon
                name="icons-common-caret_down"
                style={{ fontSize: 14 }}
                className={cx(styles['selector-arrow'])}
              />
            )}
          </span>
        </span>
      </Dropdown>
    </div>
  );
};

export default ComputerTypeSelector;
