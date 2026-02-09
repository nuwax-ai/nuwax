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
  name: '无可选电脑',
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
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [computerList, setComputerList] = useState<ComputerOption[]>([]);
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);

  // 获取用户电脑列表
  const fetchComputerList = useCallback(async () => {
    if (initializedRef.current) return;

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
        setInitialized(true);
        initializedRef.current = true;

        // 确定要选择的值
        let selectedId: string | null = null;

        // 1. 如果有agentId，检查是否有已保存的选择
        if (agentId && selectedMap && Object.keys(selectedMap).length > 0) {
          const savedSelection = selectedMap[String(agentId)];
          if (savedSelection) {
            selectedId = savedSelection;
          }
        }

        // 2. 如果没有已保存的选择，默认选中列表中的第一个
        if (!selectedId && options.length > 0) {
          selectedId = options[0].id;
        }

        // 如果确定了选择且与当前值不同，触发onChange
        if (selectedId && selectedId !== value) {
          const option = options.find((opt) => opt.id === selectedId);
          if (option) {
            onChange?.(selectedId, option);
          }
        }
      }
    } catch (error) {
      console.error('获取电脑列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [agentId, value, onChange]);

  // 挂载时加载数据
  useEffect(() => {
    if (!initialized) {
      fetchComputerList();
    }
  }, [initialized, fetchComputerList]);

  // 当前选中的选项
  const selectedOption = useMemo(() => {
    // 如果电脑不可用，显示不可用状态
    if (unavailable) {
      return UNAVAILABLE_OPTION;
    }
    // 查找选中的电脑
    if (value) {
      const found = computerList.find((item) => item.id === value);
      if (found) {
        return found;
      }
    }
    // 如果已初始化且找不到，说明列表为空或选中的电脑不在列表中
    if (initialized) {
      if (computerList.length === 0) {
        return NO_COMPUTER_OPTION;
      }
      // 返回第一个选项
      return computerList[0];
    }
    // 未初始化时显示默认文本
    return { id: '', name: '选择电脑', description: '' };
  }, [value, computerList, unavailable, initialized]);

  // 处理选择
  const handleSelect = useCallback(
    async (option: ComputerOption) => {
      onChange?.(option.id, option);
      setOpen(false);

      // 如果有 agentId，保存选择
      if (agentId && option.id !== value) {
        try {
          await apiSaveSelectedSandbox(agentId, option.id);
        } catch (error) {
          console.error('保存电脑选择失败:', error);
        }
      }
    },
    [onChange, agentId, value],
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
    } else if (computerList.length > 0) {
      computerList.forEach((computer) => {
        const isSelected = computer.id === value;
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
    } else if (initialized) {
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
  }, [loading, computerList, initialized, handleSelect]);

  // 计算是否真正禁用
  const isDisabled = disabled || fixedSelection || unavailable;

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
              [styles['selector-btn-unavailable']]: unavailable,
              [styles.open]: open,
            })}
          >
            {/* <DesktopOutlined className={cx(styles['selector-icon'])} /> */}
            <span>{selectedOption.name}</span>
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
