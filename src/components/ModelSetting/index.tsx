import {
  CaretDownOutlined,
  CaretUpOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { InputNumber, Popover, Segmented, Select, Slider } from 'antd';
import { useEffect, useState } from 'react';
import ModelListItem from './listItem/index';
import {
  GroupModelListItemProps,
  ModelSelectProp,
  ModelSettingProp,
} from './type';

// 定义带图标的模型选择select
export const GroupedOptionSelect: React.FC<GroupModelListItemProps> = ({
  groupedOptionsData,
  onChange,
  value,
}) => {
  // 自定义渲染函数用于已选中的项
  const labelRender = (props: any) => {
    if (value === '') return null;
    // const { label } = props; // 假设 props 中包含了 label 和 icon
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {props.label.props.icon}
        <span style={{ marginLeft: '8px' }}>{props.label.props.label}</span>
      </div>
    );
  };

  return (
    <Select
      placeholder="请选择模型"
      style={{ width: '100%', marginTop: '10px' }}
      className="input-style"
      value={value}
      onChange={onChange}
      labelRender={labelRender} // 使用 tagRender 来自定义已选中项的渲染
      placement={'bottomLeft'}
      popupMatchSelectWidth={false}
    >
      {groupedOptionsData?.map((group, groupIndex) => (
        <Select.OptGroup key={groupIndex} label={group.label}>
          {group.options.map((opt, index) => (
            <Select.Option
              key={`${groupIndex}-${index}`}
              value={opt.value}
              label={{ label: opt.label, icon: opt.icon }} // 设置 label 属性为一个对象
            >
              <ModelListItem
                icon={opt.icon}
                label={opt.label}
                size={opt.size}
                modelName={opt.modelName}
                desc={opt.desc}
                tagList={opt.tagList}
                value={opt.value}
              />
            </Select.Option>
          ))}
        </Select.OptGroup>
      ))}
    </Select>
  );
};

// 定义模型的设置弹窗
export const ModelSetting: React.FC<ModelSettingProp> = ({
  value,
  onChange,
}) => {
  // 使用 useState 和 useEffect 实现受控组件
  const [setting, setSetting] = useState(value);
  // 默认显示高级设置
  const [showDispose, setShowDispose] = useState<boolean>(true);
  // 改变模式
  const changeSegmented = (value: string) => {
    console.log('changeSegmented', value);
  };
  useEffect(() => {
    // 当父组件传递新的 settings 时，更新本地状态
    setSetting(setting);
  }, [setting]);

  // 更新值的辅助函数
  const updateValue = (key: 'top' | 'reply' | 'random', val: number | null) => {
    const newValue = {
      ...value,
      [key]: val || 0,
    };
    setSetting(newValue);
    onChange(newValue); // 将更新后的值传递回父组件
  };

  return (
    <>
      <div className="model-dispose-mode-style">
        <div className="dis-sb">
          <span className="label-style">生成多样性</span>
          <Segmented<string>
            options={['精确模式', '平衡模式', '创意模式', '自定义']}
            onChange={(value) => changeSegmented(value)}
            className="slider-style"
          />
          <span
            onClick={() => setShowDispose(!showDispose)}
            className="input-style"
          >
            高级设置 {showDispose ? <CaretUpOutlined /> : <CaretDownOutlined />}
          </span>
        </div>
        <div className="dis-sb">
          <span className="label-style">生成随机性</span>
          <Slider
            min={0}
            max={100}
            onChange={(val: number) => updateValue('random', val)}
            value={value.random}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            size="small"
            style={{ margin: '0 16px' }}
            value={value.random}
            onChange={(val: number | null) => updateValue('random', val)}
            className="input-style"
          />
        </div>
        <div className="dis-sb">
          <span className="label-style">top P</span>
          <Slider
            min={0}
            max={100}
            onChange={(val: number) => updateValue('top', val)}
            value={value.top}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            style={{ margin: '0 16px' }}
            size="small"
            value={value.top}
            onChange={(val: number | null) => updateValue('top', val)}
            className="input-style"
          />
        </div>
      </div>
      <div className="model-dispose-mode-style">
        <p className="node-title-style">输入及输出设置</p>
        <div className="dis-sb">
          <span className="label-style">最大回复长度</span>
          <Slider
            min={0}
            max={100}
            onChange={(val: number) => updateValue('reply', val)}
            value={value.reply}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            size="small"
            style={{ margin: '0 16px' }}
            value={value.reply}
            onChange={(val: number | null) => updateValue('reply', val)}
            className="input-style"
          />
        </div>
      </div>
    </>
  );
};

// 定义模型模块
export const ModelSelected: React.FC<ModelSelectProp> = ({
  settings,
  groupModelList,
}) => {
  return (
    <div className="node-item-style">
      <div className="dis-sb">
        <span className="node-title-style">模型</span>
        <Popover
          content={
            <ModelSetting value={settings.value} onChange={settings.onChange} />
          }
          title="模型"
          trigger="click"
          placement="left"
        >
          <SettingOutlined />
        </Popover>
      </div>
      {groupModelList.groupedOptionsData && (
        <GroupedOptionSelect
          groupedOptionsData={groupModelList.groupedOptionsData}
          onChange={groupModelList.onChange}
          value={groupModelList.value}
        />
      )}
    </div>
  );
};
