import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CustomInputNumberProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  gap?: number;
}

const CustomInputNumber: React.FC<CustomInputNumberProps> = ({
  value,
  onChange,
  min = 0,
  max,
  gap = 1,
}) => {
  const maxDisabled = Number(value) === max ? styles['input-disabled'] : '';
  const minDisabled = Number(value) === min ? styles['input-disabled'] : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue } = e.target;
    const reg = /^-?\d*(\.\d*)?$/;
    if (reg.test(inputValue) || inputValue === '' || inputValue === '-') {
      onChange(inputValue);
    }
  };

  const handleResult = (_value: number) => {
    let newValue = _value;
    if (_value < min) {
      newValue = min;
    }
    if (max && _value > max) {
      newValue = max;
    }
    if (gap.toString().indexOf('.')) {
      newValue = parseFloat(newValue.toFixed(2));
    }
    onChange(newValue.toString());
  };

  // '.' at the end or only '-' in the input box.
  const handleBlur = () => {
    let valueTemp = value ?? '0';
    if ((value && value.charAt(value.length - 1) === '.') || value === '-') {
      valueTemp = value.slice(0, -1);
    }
    let newValue = valueTemp?.replace(/0*(\d+)/, '$1');
    handleResult(Number(newValue));
  };

  const handlerPlus = () => {
    let valueTemp = value ? Number(value) : 0;
    let newValue = valueTemp + gap;
    handleResult(newValue);
  };

  const handlerReduce = () => {
    let valueTemp = value ? Number(value) : 0;
    let newValue = valueTemp - gap;
    handleResult(newValue);
  };

  return (
    <div className={cx('flex', styles['space-box'])}>
      <Input
        rootClassName={cx('flex-1')}
        placeholder="请输入卡片列表最大长度"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <div
        className={cx(
          'flex',
          'flex-col',
          'content-between',
          styles['input-number-arrow'],
        )}
      >
        <UpOutlined
          className={cx('cursor-pointer', maxDisabled)}
          onClick={handlerPlus}
        />
        <DownOutlined
          className={cx('cursor-pointer', minDisabled)}
          onClick={handlerReduce}
        />
      </div>
    </div>
  );
};

export default CustomInputNumber;
