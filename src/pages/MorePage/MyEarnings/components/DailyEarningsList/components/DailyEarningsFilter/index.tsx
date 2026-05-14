import { dict } from '@/services/i18nRuntime';
import { Button, DatePicker } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface DailyEarningsFilterProps {
  onSearch: (values: { date?: string }) => void;
  onReset: () => void;
}

const DailyEarningsFilter: React.FC<DailyEarningsFilterProps> = ({
  onSearch,
  onReset,
}) => {
  const [date, setDate] = useState<dayjs.Dayjs | null>(null);

  const handleReset = () => {
    setDate(null);
    onReset();
  };

  const handleSearch = () => {
    onSearch({
      date: date?.format('YYYY-MM-DD'),
    });
  };

  return (
    <div className={cx(styles['daily-earnings-filter'])}>
      <div className={cx(styles['filter-fields'])}>
        {/* 日期查询 */}
        <div className={cx(styles['filter-item'])}>
          <span className={cx(styles.label)}>
            {dict('PC.Pages.MorePage.MyEarnings.date')}
          </span>
          <DatePicker
            value={date}
            onChange={(val) => setDate(val)}
            format="YYYY-MM-DD"
          />
        </div>
      </div>

      <div className={cx(styles['filter-actions'])}>
        <Button onClick={handleReset}>
          {dict('PC.Components.XProTable.reset')}
        </Button>
        <Button type="primary" onClick={handleSearch}>
          {dict('PC.Components.XProTable.query')}
        </Button>
      </div>
    </div>
  );
};

export default DailyEarningsFilter;
