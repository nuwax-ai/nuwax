import CustomInputNumber from '@/components/CustomInputNumber';
import { Slider } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SliderNumberProps {
  min?: number;
  max?: number;
  step?: number;
  value: string;
  onChange: () => void;
}

const SliderNumber: React.FC<SliderNumberProps> = ({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
}) => {
  return (
    <div className={cx('flex-1', 'flex')}>
      <Slider
        className={cx(styles['slider-box'])}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        value={Number(value) || 0}
      />
      <CustomInputNumber
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
      />
    </div>
  );
};

export default SliderNumber;
