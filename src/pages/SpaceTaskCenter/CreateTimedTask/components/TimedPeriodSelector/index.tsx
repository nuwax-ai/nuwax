import SelectList from '@/components/custom/SelectList';
import { apiTaskCronList } from '@/services/agentTask';
import { TaskCronInfo, TaskCronItemDto } from '@/types/interfaces/agentTask';
import { option } from '@/types/interfaces/common';
import { Form, Space } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 定时周期选择组件
 *
 * @description
 * 封装定时任务中的「定时周期」选择区域以及内部状态处理逻辑：
 * - 通过接口获取可选定时范围及对应 cron
 * - 处理「定时范围名称」和「cron」的联动
 * - 作为 Form.Item 的受控子组件，和表单值双向同步
 *
 * @param props.value 当前表单字段值，由 antd Form 注入（cron）
 * @param props.onChange 表单字段变更回调，由 antd Form 注入
 *
 * @note
 * - 组件内部维护 typeName/typeCron 以及 options 列表
 * - 外部只需要在 Form.Item 中使用 name，即可拿到最终选中的 cron
 */
export interface TimedPeriodSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const TimedPeriodSelector: React.FC<TimedPeriodSelectorProps> = ({
  value,
  onChange,
}) => {
  const [typeName, setTypeName] = useState<string>('');
  const [typeCron, setTypeCron] = useState<string>('');
  const [typeNameList, setTypeNameList] = useState<option[]>([]);
  const [typeCronList, setTypeCronList] = useState<option[]>([]);
  // 保存可选定时范围
  const taskCronListRef = useRef<TaskCronInfo[]>([]);

  /**
   * 设置某个定时范围下的子项列表
   *
   * @param cronList 当前定时范围下的 cron 配置列表
   * @param cron 可选，指定选中的 cron，不传则默认选中列表第一个
   */
  const handleSetTypeCron = (cronList: TaskCronItemDto[], cron?: string) => {
    const list =
      cronList?.map((item) => ({
        label: item.desc,
        value: item.cron,
      })) || [];
    setTypeCronList(list as option[]);
    const nextCron = cron || list[0]?.value || '';
    setTypeCron(nextCron);
    if (nextCron) {
      onChange?.(nextCron);
    }
  };

  /**
   * 处理接口返回的定时配置数据
   *
   * @param data 接口返回的完整定时配置列表
   * @param targetCron 可选，指定需要回显的 cron（更新场景或表单初始值）
   */
  const handleTimedInfo = (data: TaskCronInfo[], targetCron?: string) => {
    if (!data || data.length === 0) {
      return;
    }
    const _typeNameList = data.map((item) => ({
      label: item.typeName,
      value: item.typeName,
    }));
    setTypeNameList(_typeNameList);

    // 如果有需要回显的 cron，则先找到对应的定时范围
    if (targetCron) {
      const currentItem = data.find((info) =>
        info.items.some((subItem) => subItem.cron === targetCron),
      );
      if (currentItem) {
        setTypeName(currentItem.typeName);
        handleSetTypeCron(currentItem.items, targetCron);
        return;
      }
    }

    // 默认取第一个定时范围
    const firstItem = data[0];
    setTypeName(firstItem.typeName);
    handleSetTypeCron(firstItem.items || []);
  };

  // 可选定时范围 - 获取接口数据
  const { run: runCron } = useRequest(apiTaskCronList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: TaskCronInfo[]) => {
      if (result.length > 0) {
        taskCronListRef.current = result;
        handleTimedInfo(result, value);
      }
    },
  });

  // 初始化加载定时配置
  useEffect(() => {
    runCron();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 当外部表单值变更（例如 form.setFieldsValue）时，同步内部选中状态
  useEffect(() => {
    if (!value || taskCronListRef.current.length === 0) {
      return;
    }
    // 如果当前内部 cron 已经等于外部值，则不必重复处理
    if (value === typeCron) {
      return;
    }
    handleTimedInfo(taskCronListRef.current, value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // 选择定时范围 - 名称
  const handleChangeTypeName = (value: React.Key) => {
    setTypeName(value as string);
    const currentItem = taskCronListRef.current?.find(
      (item) => item.typeName === value,
    );
    handleSetTypeCron(currentItem?.items || []);
  };

  // 选择定时范围 - cron
  const handleChangeTypeCron = (value: React.Key) => {
    const cron = value as string;
    setTypeCron(cron);
    onChange?.(cron);
  };

  return (
    <Space>
      <Form.Item noStyle rules={[{ required: true, message: '请输入' }]}>
        <SelectList
          className={cx(styles.select)}
          options={typeNameList}
          value={typeName}
          onChange={handleChangeTypeName}
        />
      </Form.Item>
      <Form.Item noStyle rules={[{ required: true, message: '请输入' }]}>
        <SelectList
          className={cx(styles.select)}
          options={typeCronList}
          value={typeCron}
          onChange={handleChangeTypeCron}
        />
      </Form.Item>
    </Space>
  );
};

export default TimedPeriodSelector;
