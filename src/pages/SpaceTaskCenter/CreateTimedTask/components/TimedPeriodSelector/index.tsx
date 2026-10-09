import SelectList from '@/components/custom/SelectList';
import { useTimedPeriodOptions } from '@/hooks/useTimedPeriodOptions';
import { apiTaskCronList } from '@/services/agentTask';
import { t } from '@/services/i18nRuntime';
import { DatePicker, Form, Space } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
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
  const {
    typeName,
    typeCron,
    typeNameList,
    typeCronList,
    isCustomCron,
    handleChangeTypeName,
    handleChangeTypeCron,
  } = useTimedPeriodOptions(apiTaskCronList, value, onChange);

  return (
    <Space>
      <Form.Item
        noStyle
        rules={[
          {
            required: true,
            message: t('PC.Pages.SpaceTaskTimedPeriodSelector.enter'),
          },
        ]}
      >
        <SelectList
          className={cx(styles.select)}
          options={typeNameList}
          value={typeName}
          onChange={handleChangeTypeName}
        />
      </Form.Item>
      {isCustomCron && <span title={typeCron}>{typeCron}</span>}
      {typeName !== 'SpecificTime' && typeCronList.length > 0 && (
        <Form.Item
          noStyle
          rules={[
            {
              required: true,
              message: t('PC.Pages.SpaceTaskTimedPeriodSelector.enter'),
            },
          ]}
        >
          <SelectList
            className={cx(styles.select)}
            options={typeCronList}
            value={typeCron}
            onChange={handleChangeTypeCron}
          />
        </Form.Item>
      )}
      {typeName === 'SpecificTime' && (
        <Form.Item
          name="lockTime"
          noStyle
          rules={[
            {
              required: true,
              message: t(
                'PC.Pages.SpaceTaskTimedPeriodSelector.selectSpecificTime',
              ),
            },
            {
              validator: (_, selectedValue) => {
                if (selectedValue && dayjs(selectedValue).isBefore(dayjs())) {
                  return Promise.reject(
                    new Error(
                      t(
                        'PC.Pages.SpaceTaskTimedPeriodSelector.specificTimeMustBeFuture',
                      ),
                    ),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            showTime
            placeholder={t(
              'PC.Pages.SpaceTaskTimedPeriodSelector.selectDateTime',
            )}
            style={{ width: 200 }}
          />
        </Form.Item>
      )}
    </Space>
  );
};

export default TimedPeriodSelector;
