import { t } from '@/services/i18nRuntime';
import type {
  BindConfigWithSub,
  CreatedNodeItem,
} from '@/types/interfaces/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { SkillProps } from '@/types/interfaces/workflow';
import { loopSetBindValueType } from '@/utils/deepNode';
import {
  DeleteOutlined,
  // DownOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Popover, Tag } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { getImg } from '../../utils/workflowV3';
import styles from './index.less';
import SettingModal from './SettingModal';

const cx = classNames.bind(styles);
interface TreeOutput extends InputAndOutConfig {
  key: string;
}
const truncate = (str: string, maxLength: number) => {
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
};
// Render skill parameters in popover.
const SkillParamsContent: React.FC<{ params: TreeOutput[] }> = ({ params }) => {
  return (
    <div style={{ maxWidth: '300px' }}>
      {(params || []).map((item) => (
        <div key={item.name} style={{ padding: '3px 0' }}>
          <div className={cx('dis-left')}>
            <span style={{ marginRight: '8px' }}>
              {truncate(item.name, 30)}
            </span>
            <Tag color="#C9CDD4" style={{ fontSize: '10px' }}>
              {item.dataType}
            </Tag>
          </div>
          <p className={cx(styles['skill-params-description'])}>
            {truncate(item.description || '', 70)}
          </p>
        </div>
      ))}
    </div>
  );
};

// V3 skill list without loading state.
export const SkillList: React.FC<SkillProps> = ({
  params,
  disabled = false,
  removeItem,
  modifyItem,
  variables = [],
}) => {
  // Hovered item state.
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<CreatedNodeItem | null>(null);

  // Modal state for skill setting.
  const [open, setOpen] = useState(false);
  // Mask visibility for hover actions.
  const [showMask, setShowMask] = useState(false);

  // Remove skill item.
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
    // Normalize nested bind-value types.
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
  const genKey = useCallback(
    (item: CreatedNodeItem, prefix: string, index: number) => {
      // Include index to ensure uniqueness when typeId is undefined.
      return `${prefix}-${item?.type}-${item?.typeId ?? index}-${
        item?.toolName || ''
      }`;
    },
    [],
  );
  return (
    <div className={cx(styles['skill-list'], 'relative')}>
      {/* V3: sync operations on frontend without loading placeholder */}
      {params.map((item, index) => (
        <div
          key={genKey(item, 'skill', index)}
          className={cx(
            styles['skill-item-container'],
            index === 0 && 'margin-top-10',
          )}
        >
          <div
            className={cx(styles['skill-item-style'], 'dis-left')}
            style={{
              opacity: disabled ? 0.5 : 1,
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
                  <Popover
                    content={t('PC.Pages.AntvX6Skill.editParams')}
                    trigger="hover"
                  >
                    <SettingOutlined
                      className={cx('ml-12 cursor-pointer white')}
                      onClick={() => {
                        handleEdit(item);
                        setOpen(true);
                      }}
                    />
                  </Popover>
                  {!disabled && (
                    <Popover
                      content={t('PC.Pages.AntvX6Skill.remove')}
                      trigger="hover"
                    >
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
        key={genKey(currentComponentInfo as CreatedNodeItem, 'setting', 0)}
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
