import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiGetSandboxUserConfigList } from '@/services/systemManage';
import { DesktopOutlined, DownOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps, Spin } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.less';
import type { ComputerOption, ComputerTypeSelectorProps } from './types';

const cx = classNames.bind(styles);

/**
 * 远程电脑默认选项
 */
const REMOTE_COMPUTER_OPTION: ComputerOption = {
  id: null,
  name: '远程电脑',
  online: true,
  isActive: true,
};

/**
 * 电脑类型选择器组件
 * 在智能体电脑模式下显示，允许用户选择使用远程电脑或自己配置的电脑
 */
const ComputerTypeSelector: React.FC<ComputerTypeSelectorProps> = ({
  value = null,
  onChange,
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [computerList, setComputerList] = useState<ComputerOption[]>([]);

  // 获取用户电脑列表
  const fetchComputerList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetSandboxUserConfigList();
      if (res.code === SUCCESS_CODE && res.data) {
        const options: ComputerOption[] = res.data.map((item) => ({
          id: item.id,
          name: item.name,
          online: item.online,
          isActive: item.isActive,
          raw: item,
        }));
        setComputerList(options);
      }
    } catch (error) {
      console.error('获取电脑列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 首次打开下拉菜单时加载数据
  useEffect(() => {
    if (open && computerList.length === 0) {
      fetchComputerList();
    }
  }, [open, computerList.length, fetchComputerList]);

  // 当前选中的选项
  const selectedOption = useMemo(() => {
    if (value === null) {
      return REMOTE_COMPUTER_OPTION;
    }
    return (
      computerList.find((item) => item.id === value) || REMOTE_COMPUTER_OPTION
    );
  }, [value, computerList]);

  // 处理选择
  const handleSelect = useCallback(
    (option: ComputerOption) => {
      onChange?.(option.id, option);
      setOpen(false);
    },
    [onChange],
  );

  // 构建菜单项
  const menuItems: MenuProps['items'] = useMemo(() => {
    const items: MenuProps['items'] = [
      {
        key: 'remote',
        label: (
          <div className={cx(styles['menu-item'])}>
            <span className={cx(styles['item-name'])}>远程电脑</span>
          </div>
        ),
        onClick: () => handleSelect(REMOTE_COMPUTER_OPTION),
      },
    ];

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
      items.push({ type: 'divider' });
      computerList.forEach((computer) => {
        const isDisabled = !computer.online || !computer.isActive;
        items.push({
          key: String(computer.id),
          label: (
            <div
              className={cx(styles['menu-item'], {
                [styles['menu-item-disabled']]: isDisabled,
              })}
            >
              <span className={cx(styles['item-name'])}>{computer.name}</span>
              <span
                className={cx(styles['item-status'], {
                  [styles['status-online']]: computer.online,
                  [styles['status-offline']]: !computer.online,
                })}
              >
                {computer.online ? '在线' : '离线'}
              </span>
            </div>
          ),
          disabled: isDisabled,
          onClick: () => handleSelect(computer),
        });
      });
    }

    return items;
  }, [loading, computerList, handleSelect]);

  return (
    <Dropdown
      menu={{
        items: menuItems,
        selectedKeys: [value === null ? 'remote' : String(value)],
      }}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      overlayClassName={styles['computer-menu']}
    >
      <span className={cx(styles['computer-selector'], className)}>
        <span
          className={cx(styles['selector-btn'], {
            [styles['selector-btn-active']]: value !== null,
            [styles.open]: open,
          })}
        >
          <DesktopOutlined className={cx(styles['selector-icon'])} />
          <span>{selectedOption.name}</span>
          <DownOutlined className={cx(styles['selector-arrow'])} />
        </span>
      </span>
    </Dropdown>
  );
};

export default ComputerTypeSelector;
