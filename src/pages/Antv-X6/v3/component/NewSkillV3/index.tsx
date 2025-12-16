import type {
  BindConfigWithSub,
  CreatedNodeItem,
} from '@/types/interfaces/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { SkillProps } from '@/types/interfaces/workflow';
import { loopSetBindValueType } from '@/utils/deepNode';
import { getImg } from '@/utils/workflow';
import {
  DeleteOutlined,
  // DownOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Popover, Tag } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import styles from './index.less';
import SettingModal from './SettingModal';

const cx = classNames.bind(styles);
interface TreeOutput extends InputAndOutConfig {
  key: string;
}
const truncate = (str: string, maxLength: number) => {
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
};
// 定义技能的参数展示
const SkillParamsContent: React.FC<{ params: TreeOutput[] }> = ({ params }) => {
  return (
    <div style={{ maxWidth: '300px' }}>
      {(params || []).map((item) => (
        <div key={item.name} style={{ padding: '3px 0' }}>
          <div className={cx('dis-left')}>
            <span className={cx('mr-16')}>{truncate(item.name, 30)}</span>
            <Tag color="#C9CDD4">{item.dataType}</Tag>
          </div>
          <p className={cx(styles['skill-params-description'])}>
            {truncate(item.description || '', 70)}
          </p>
        </div>
      ))}
    </div>
  );
};

// V3 定义通用的技能显示（无 loading）
export const SkillList: React.FC<SkillProps> = ({
  params,
  disabled = false,
  removeItem,
  modifyItem,
  variables = [],
}) => {
  // const [skillParams,setSkillParams] = useState<NodeConfig>(params);
  // 使用useState钩子来管理每个项目的hover状态
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<CreatedNodeItem | null>(null);

  // 打开技能配置的数据
  const [open, setOpen] = useState(false);
  // 新增一个状态来控制蒙版层的显示
  const [showMask, setShowMask] = useState(false);

  // 移除技能
  const handleDelete = (item: CreatedNodeItem) => {
    removeItem(item);
  };

  const handleOnSave = (val: { [key: string]: BindConfigWithSub[] }) => {
    modifyItem({
      ...(currentComponentInfo as CreatedNodeItem),
      inputArgBindConfigs: val.inputArgBindConfigs as InputAndOutConfig[],
    });
    setOpen(false);
    setCurrentComponentInfo(null);
  };
  const handleEdit = (item: CreatedNodeItem) => {
    const inputConfigArgs = item.inputArgBindConfigs as BindConfigWithSub[];
    // 使用递归函数设置默认值：输入，并处理嵌套的子配置
    const _inputConfigArgs = loopSetBindValueType(inputConfigArgs || []);

    setCurrentComponentInfo({
      ...item,
      inputArgBindConfigs: _inputConfigArgs as InputAndOutConfig[],
    });
    setOpen(true);
  };
  // const { referenceList } = Form.useWatch('referenceList');
  // const variables = Object.values(referenceList.argMap || {});
  const isHoveredItem = (item: CreatedNodeItem) => {
    return (
      currentComponentInfo?.typeId === item.typeId &&
      (currentComponentInfo?.toolName || '') === (item.toolName || '')
    );
  };
  const genKey = useCallback((item: CreatedNodeItem, prefix: string) => {
    return `${prefix}-${item?.type}-${item?.typeId}-${item?.toolName || ''}`;
  }, []);
  return (
    <div className={cx(styles['skill-list'], 'relative')}>
      {/* V3: 前端同步操作，移除 loading */}
      {params.map((item, index) => (
        <div
          key={genKey(item, 'skill')}
          className={cx(
            styles['skill-item-container'],
            index === 0 && 'margin-top-10',
          )}
        >
          <div
            className={cx(styles['skill-item-style'], 'dis-left')}
            style={{
              //设置为整体为灰色
              opacity: disabled ? 0.5 : 1,
              //设置为不可点击
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={() => {
              setCurrentComponentInfo(item);
              setShowMask(true);
            }}
            onMouseLeave={() => setShowMask(false)}
          >
            <img
              src={item.icon || getImg(item.targetType)}
              alt=""
              className={cx(styles['skill-item-icon'])}
            />
            <div className={cx(styles['skill-item-content-style'])}>
              <div className={cx(styles['skill-item-title-style'])}>
                {item.name}
              </div>
              <div className={cx(styles['skill-item-desc-style'])}>
                {item.description}
              </div>
            </div>
            {isHoveredItem(item) && showMask && (
              <div className={cx(styles['mask-layer-style'])}>
                <div
                  className={cx(
                    styles['skill-item-dispose-style'],
                    styles['skill-item-dispose-mask'],
                  )}
                >
                  {item.inputArgBindConfigs &&
                    item.inputArgBindConfigs.length && (
                      <Popover
                        content={
                          <SkillParamsContent
                            params={item.inputArgBindConfigs as TreeOutput[]}
                          />
                        }
                        placement="right"
                        trigger="hover"
                      >
                        <InfoCircleOutlined className={cx('white')} />
                      </Popover>
                    )}
                  <Popover content={'编辑参数'} trigger="hover">
                    <SettingOutlined
                      className={cx('ml-12 cursor-pointer white')}
                      onClick={() => {
                        handleEdit(item);
                        setOpen(true);
                      }}
                    />
                  </Popover>
                  {!disabled && (
                    <Popover content={'移除'} trigger="hover">
                      <DeleteOutlined
                        className={cx('ml-12  white')}
                        onClick={() => handleDelete(item)}
                      />
                    </Popover>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
      <SettingModal
        open={open}
        key={genKey(currentComponentInfo as CreatedNodeItem, 'setting')}
        variables={variables}
        inputArgBindConfigs={
          currentComponentInfo?.inputArgBindConfigs as BindConfigWithSub[]
        }
        onSave={handleOnSave}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
};
