import { SvgIcon } from '@/components/base';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetUserSelectableSandboxList,
  apiSaveSelectedSandbox,
} from '@/services/systemManage';
import { CheckOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.less';
import { resolveAutoSelection } from './resolveAutoSelection';
import { type ComputerOption, type ComputerTypeSelectorProps } from './types';

const cx = classNames.bind(styles);

// [sandbox-trace] 临时排查日志（修复验证完成后整体移除）
const trace = (event: string, payload?: Record<string, unknown>) => {
  console.warn(`[sandbox-trace] selector:${event}`, payload ?? {});
};

/**
 * 无可用电脑选项
 */
const NO_COMPUTER_OPTION: ComputerOption = {
  id: '',
  name: dict('PC.Components.ComputerTypeSelector.noComputerAvailable'),
  description: '',
};

/**
 * 电脑不可用选项 (通用)
 */
const UNAVAILABLE_OPTION: ComputerOption = {
  id: '',
  name: dict('PC.Components.ComputerTypeSelector.computerUnavailable'),
  description: '',
};

/**
 * 个人电脑不可用选项 (绑定ID丢失)
 */
const PERSONAL_COMPUTER_UNAVAILABLE_OPTION: ComputerOption = {
  id: '',
  name: dict('PC.Components.ComputerTypeSelector.personalComputerUnavailable'),
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
  autoSelect = true,
  saveOnSelect = true,
  isPersonalComputer = false,
  readonly = false,
  cloudOnly = false,
  strictAgentMemory = false,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rawComputerList, setRawComputerList] = useState<ComputerOption[]>([]);
  const [initialized, setInitialized] = useState(false);
  const initializedRef = useRef(false);

  const [agentSelectedMap, setAgentSelectedMap] = useState<
    Record<string, string>
  >({});

  // 仅云端模式（如全栈应用不支持个人电脑）：渲染期过滤，列表切换即时生效
  const computerList = useMemo(
    () =>
      cloudOnly
        ? rawComputerList.filter((item) => String(item.id) === '-1')
        : rawComputerList,
    [rawComputerList, cloudOnly],
  );

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
        // [sandbox-trace] 列表就绪：顺序（list[0] 是回落目标）+ per-agent 记忆表
        trace('list-loaded', {
          order: options.map((opt) => `${opt.id}(${opt.name})`),
          firstId: options[0]?.id,
          agentSelectedMap: selectedMap,
          readonly,
        });
        setRawComputerList(options);
        if (selectedMap) {
          setAgentSelectedMap(readonly ? {} : selectedMap);
        }
        setInitialized(true);
        initializedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to get computer list:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 监听 agentId 和 agentSelectedMap 变化，自动应用选择
  useEffect(() => {
    if (
      !autoSelect ||
      fixedSelection ||
      !initialized ||
      computerList.length === 0
    ) {
      // [sandbox-trace] 自动选择未启用（early-return 原因）
      trace('autoSelect-skip', {
        autoSelect,
        fixedSelection,
        initialized,
        listLen: computerList.length,
      });
      return;
    }

    const isValueValid =
      value && computerList.some((opt) => String(opt.id) === String(value));

    // 决策单源：strict（首页）=记忆顶替/保持现值/失效兜底；legacy=既有行为
    const { selectedId, reason } = resolveAutoSelection({
      strictAgentMemory,
      agentId,
      value,
      computerList,
      agentSelectedMap,
    });
    // [sandbox-trace] 决策结果（memory=记忆顶替 / keep-current=保持现值 / fallback-first=回落首项）
    trace('autoSelect-decision', {
      agentId,
      currentValue: value,
      isValueValid,
      reason,
      selectedId,
      strictAgentMemory,
    });

    // 个人电脑下线处理：如果列表中仅剩云电脑（-1），且当前状态并非云电脑，则主动同步到后端
    let finalId = selectedId;
    if (
      agentId &&
      computerList.length === 1 &&
      String(computerList[0].id) === '-1' &&
      agentSelectedMap?.[String(agentId)] !== '-1' &&
      saveOnSelect
    ) {
      // [sandbox-trace] 分支命中：仅剩云电脑，主动同步 '-1'（覆盖决策结果，保持既有行为）
      trace('autoSelect-branch-cloud-only-sync', {
        agentId,
        currentValue: value,
        memoryValue: agentSelectedMap?.[String(agentId)],
      });
      apiSaveSelectedSandbox(agentId, '-1').catch(console.error);
      setAgentSelectedMap((prev) => ({ ...prev, [String(agentId)]: '-1' }));
      finalId = '-1';
    }

    // 如果确定了选择且与当前值不同，触发onChange
    if (finalId && finalId !== value) {
      const option = computerList.find(
        (opt) => String(opt.id) === String(finalId),
      );
      if (option) {
        // [sandbox-trace] 自动选择落地：onChange 写回宿主
        trace('autoSelect-apply', {
          from: value,
          to: finalId,
          agentId,
          reason,
        });
        onChange?.(finalId, option);
      }
    } else {
      // [sandbox-trace] 决策完成但无变化（含：保持当前有效选择）
      trace('autoSelect-noop', {
        agentId,
        currentValue: value,
        isValueValid,
        decidedId: finalId,
        reason,
      });
    }
  }, [
    agentId,
    agentSelectedMap,
    initialized,
    computerList,
    value,
    onChange,
    fixedSelection,
    autoSelect,
    strictAgentMemory,
  ]);

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
      const found = computerList.find(
        (item) => String(item.id) === String(value),
      );
      if (found) {
        return found;
      }
      // 如果是固定选择且在列表中找不到，且是个人电脑（高优先级），直接返回不可用
      if (fixedSelection && initialized && isPersonalComputer) {
        return PERSONAL_COMPUTER_UNAVAILABLE_OPTION;
      }
    }

    // 优先检查列表是否为空：如果已初始化且列表为空，直接显示无可用电脑
    if (initialized && computerList.length === 0) {
      return NO_COMPUTER_OPTION;
    }

    // 如果已初始化且找不到，说明列表为空或选中的电脑不在列表中
    if (initialized) {
      // 列表为空的情况上面已经处理过了

      // 如果是固定选择（非个人电脑，如共享电脑），且没找到，这里返回不可用
      if (fixedSelection) {
        return UNAVAILABLE_OPTION;
      }
      // 返回第一个选项
      return computerList[0];
    }
    // 未初始化时显示默认文本
    return {
      id: '',
      name: dict('PC.Components.ComputerTypeSelector.selectComputer'),
      description: '',
    };
  }, [value, computerList, unavailable, initialized, fixedSelection]);

  // 处理选择
  const handleSelect = useCallback(
    async (option: ComputerOption) => {
      // 如果选中的是当前已选中的，直接返回，不触发接口
      if (String(option.id) === String(value) || readonly) {
        // [sandbox-trace] 手选被拦：同值点击（不写记忆/不持久化）或只读
        trace('handleSelect-blocked', {
          optionId: option.id,
          currentValue: value,
          sameValue: String(option.id) === String(value),
          readonly,
        });
        setOpen(false);
        return;
      }

      // [sandbox-trace] 用户手选
      trace('handleSelect', {
        from: value,
        to: option.id,
        agentId,
        willPersist: !!agentId && saveOnSelect,
      });
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
            // [sandbox-trace] 记忆持久化成功
            trace('handleSelect-persisted', { agentId, sandboxId: option.id });
          } catch (error) {
            console.error('Failed to save computer selection:', error);
            // [sandbox-trace] 记忆持久化失败
            trace('handleSelect-persist-failed', {
              agentId,
              sandboxId: option.id,
            });
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

    if (computerList.length > 0) {
      computerList.forEach((computer: ComputerOption) => {
        const isSelected = String(computer.id) === String(value);
        items.push({
          key: computer.id,
          label: (
            <div className={cx(styles['menu-item'])}>
              <div className={cx(styles['item-content'])}>
                <span className={cx(styles['item-name'])}>{computer.name}</span>
                {computer.description && (
                  <span
                    className={cx(styles['item-desc'], {
                      [styles['item-desc-warning']]:
                        String(computer.id) !== '-1',
                    })}
                  >
                    {computer.description}
                  </span>
                )}
              </div>
              {isSelected && (
                <CheckOutlined className={cx(styles['item-check'])} />
              )}
            </div>
          ),
          disabled: readonly || (fixedSelection && !isSelected),
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
            <span className={cx(styles['item-name'])}>
              {dict('PC.Components.ComputerTypeSelector.noComputerAvailable')}
            </span>
          </div>
        ),
        disabled: true,
      });
    }

    return items;
  }, [computerList, initialized, handleSelect, value]);

  // 计算是否真正禁用
  const isDisabled =
    disabled ||
    unavailable ||
    computerList.length === 0 ||
    selectedOption === UNAVAILABLE_OPTION ||
    selectedOption === PERSONAL_COMPUTER_UNAVAILABLE_OPTION;

  const isShow = initialized && !loading;

  return (
    <div
      className={cx(styles['computer-selector-container'], className, {
        [styles.show]: isShow,
      })}
    >
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
                unavailable ||
                selectedOption === UNAVAILABLE_OPTION ||
                selectedOption === PERSONAL_COMPUTER_UNAVAILABLE_OPTION ||
                selectedOption === NO_COMPUTER_OPTION,
              [styles.open]: open,
            })}
          >
            {/* <DesktopOutlined className={cx(styles['selector-icon'])} /> */}
            <span>{selectedOption.name}</span>
            {!unavailable &&
              selectedOption !== UNAVAILABLE_OPTION &&
              selectedOption !== PERSONAL_COMPUTER_UNAVAILABLE_OPTION &&
              selectedOption !== NO_COMPUTER_OPTION && (
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
