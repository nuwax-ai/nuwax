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
  // 修改 labelRender 函数以匹配 LabelInValueType 类型
  const labelRender = (props: any) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {props.icon && props.icon}
      <span style={{ marginLeft: '8px' }}>{props.label}</span>
    </div>
  );

  return (
    <Select
      placeholder="请选择模型"
      style={{ width: '100%', marginTop: '10px' }}
      className="input-style"
      value={value}
      onChange={onChange}
      labelInValue // 确保 Select 返回完整的 option 对象
      labelRender={labelRender} // 使用自定义的渲染函数
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
    setSetting(value);
  }, [value]);

  // 更新值的辅助函数
  const updateValue = (key: keyof typeof setting, val: number | null) => {
    const newValue = {
      ...setting,
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
  onSettingsChange,
  defaultSettings,
  onModelChange,
  defaultModel,
  groupedOptionsData,
}) => {
  return (
    <div className="node-item-style">
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">模型</span>
        <Popover
          content={
            <ModelSetting
              value={defaultSettings || { top: 0, reply: 0, random: 0 }}
              onChange={onSettingsChange || (() => {})}
            />
          }
          title="模型"
          trigger="click"
          placement="left"
        >
          <SettingOutlined />
        </Popover>
      </div>
      {groupedOptionsData && (
        <GroupedOptionSelect
          groupedOptionsData={groupedOptionsData}
          onChange={onModelChange || (() => {})}
          value={defaultModel || ''}
        />
      )}
    </div>
  );
};
