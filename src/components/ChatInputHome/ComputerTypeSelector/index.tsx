import { SvgIcon } from '@/components/base';
import { dict } from '@/services/i18nRuntime';
import { apiSaveSelectedSandbox } from '@/services/systemManage';
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
import { useComputerList } from './useComputerList';

const cx = classNames.bind(styles);

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
  const {
    rawComputerList,
    agentSelectedMap: remoteSelectedMap,
    initialized,
    refresh,
  } = useComputerList(!cloudOnly);
  // 手选覆盖当前组件会话内的服务器记忆，旧的在途响应不能把手选回退。
  const [manualSelectedMap, setManualSelectedMap] = useState<
    Record<string, string>
  >({});
  const selectionContext = useRef<{
    key: string;
    pendingMemory?: string;
    pendingManual?: string;
  } | null>(null);
  const knownOptions = useRef(new Map<string, ComputerOption>());
  const agentKey = agentId ? String(agentId) : 'no-agent';
  const agentSelectedMap = useMemo(
    () => (readonly ? {} : { ...remoteSelectedMap, ...manualSelectedMap }),
    [readonly, remoteSelectedMap, manualSelectedMap],
  );

  // 仅云端模式（如全栈应用不支持个人电脑）：渲染期过滤，列表切换即时生效
  const computerList = useMemo(
    () =>
      cloudOnly
        ? rawComputerList.filter((item) => String(item.id) === '-1')
        : rawComputerList,
    [rawComputerList, cloudOnly],
  );

  // 首次/切换 agent 按既有记忆解析；同一 agent 的刷新保留已选电脑。
  useEffect(() => {
    if (
      !autoSelect ||
      fixedSelection ||
      !initialized ||
      computerList.length === 0
    ) {
      return;
    }

    const previousContext = selectionContext.current;
    const switchedAgent = !!previousContext && previousContext.key !== agentKey;
    const firstForAgent = !previousContext || switchedAgent;
    const context: NonNullable<typeof selectionContext.current> = firstForAgent
      ? { key: agentKey }
      : previousContext!;
    selectionContext.current = context;
    const isInList = (id?: string) =>
      !!id && computerList.some((option) => String(option.id) === String(id));
    const rememberedId = agentId
      ? agentSelectedMap[String(agentId)]
      : undefined;
    if (readonly) {
      context.pendingMemory = undefined;
      context.pendingManual = undefined;
    }
    let finalId: string | null;

    if (cloudOnly) {
      // 场景策略变化时必须回落云端，不能沿用个人电脑的手选或记忆。
      finalId = isInList('-1') ? '-1' : null;
    } else if (!readonly && manualSelectedMap[agentKey]) {
      const manualId = manualSelectedMap[agentKey];
      // 切回时目标暂缺要留下等待目标，后续候选传播后恢复当前 agent 的手选。
      if (!firstForAgent && context.pendingManual !== manualId) return;
      if (!isInList(manualId)) {
        context.pendingManual = manualId;
        return;
      }
      context.pendingManual = undefined;
      finalId = manualId;
    } else if (context.pendingMemory && isInList(context.pendingMemory)) {
      finalId = context.pendingMemory;
      context.pendingMemory = undefined;
    } else {
      if (rememberedId && !isInList(rememberedId)) {
        context.pendingMemory = rememberedId;
        // 列表传播期间保留已有值与记忆，绝不据临时云端列表覆盖选择。
        if (value) return;
      }
      if (!firstForAgent && value) return;
      if (!switchedAgent && value && !rememberedId) return;
      finalId = resolveAutoSelection({
        strictAgentMemory,
        agentId,
        value,
        computerList,
        agentSelectedMap,
      }).selectedId;
    }

    if (finalId && finalId !== value) {
      const option = computerList.find(
        (opt) => String(opt.id) === String(finalId),
      );
      if (option) {
        onChange?.(finalId, option);
      }
    }
  }, [
    agentId,
    agentKey,
    agentSelectedMap,
    manualSelectedMap,
    initialized,
    computerList,
    value,
    onChange,
    fixedSelection,
    autoSelect,
    strictAgentMemory,
    cloudOnly,
    readonly,
  ]);

  // 当前选中的选项
  const selectedOption = useMemo(() => {
    computerList.forEach((option) =>
      knownOptions.current.set(String(option.id), option),
    );
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
      // 后续列表暂缺当前电脑时保留其名称；固定会话仍按既有不可用提示处理。
      if (!fixedSelection && !cloudOnly) {
        const known = knownOptions.current.get(String(value));
        if (known) return known;
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
  }, [
    value,
    computerList,
    unavailable,
    initialized,
    fixedSelection,
    isPersonalComputer,
    cloudOnly,
  ]);

  // 处理选择
  const handleSelect = useCallback(
    async (option: ComputerOption) => {
      // 如果选中的是当前已选中的，直接返回，不触发接口
      if (readonly || fixedSelection) {
        setOpen(false);
        return;
      }
      setManualSelectedMap((prev) => ({ ...prev, [agentKey]: option.id }));
      if (selectionContext.current?.key === agentKey) {
        selectionContext.current.pendingMemory = undefined;
        selectionContext.current.pendingManual = undefined;
      }
      if (String(option.id) === String(value)) {
        setOpen(false);
        return;
      }

      onChange?.(option.id, option);
      setOpen(false);

      // 如果有 agentId，保存选择并更新本地映射
      if (agentId) {
        if (saveOnSelect) {
          try {
            await apiSaveSelectedSandbox(agentId, option.id);
          } catch (error) {
            console.error('Failed to save computer selection:', error);
            // 保存失败时可以考虑回滚本地映射，但暂时不处理
          }
        }
      }
    },
    [
      onChange,
      agentId,
      agentKey,
      value,
      saveOnSelect,
      readonly,
      fixedSelection,
    ],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) refresh();
    },
    [refresh],
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
  }, [
    computerList,
    initialized,
    handleSelect,
    value,
    readonly,
    fixedSelection,
  ]);

  // 计算是否真正禁用
  const isDisabled =
    disabled ||
    unavailable ||
    selectedOption === UNAVAILABLE_OPTION ||
    selectedOption === PERSONAL_COMPUTER_UNAVAILABLE_OPTION;

  const isShow = initialized;

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
        onOpenChange={handleOpenChange}
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
