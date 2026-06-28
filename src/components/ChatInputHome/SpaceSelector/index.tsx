import { SvgIcon } from '@/components/base';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';
import { apiSpaceList } from '@/services/workspace';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { CheckOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps, Typography } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SpaceSelectorProps {
  selectedSpaceId?: number;
  onSpaceSelect?: (spaceId: number) => void;
  className?: string;
}

const SpaceSelector: React.FC<SpaceSelectorProps> = ({
  selectedSpaceId,
  onSpaceSelect,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [spaceList, setSpaceList] = useState<SpaceInfo[]>([]);

  const fetchSpaceList = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiSpaceList();
      if (result.code === SUCCESS_CODE) {
        setSpaceList(result.data || []);
      } else {
        setSpaceList([]);
      }
    } catch (error) {
      console.error('Failed to get space list:', error);
      setSpaceList([]);
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaceList();
  }, [fetchSpaceList]);

  useEffect(() => {
    if (!initialized || !spaceList.length) return;

    const isSelectedInList = spaceList.some(
      (space) => space.id === selectedSpaceId,
    );
    if (!selectedSpaceId || !isSelectedInList) {
      onSpaceSelect?.(spaceList[0].id);
    }
  }, [initialized, onSpaceSelect, selectedSpaceId, spaceList]);

  const selectedSpace = useMemo(() => {
    if (selectedSpaceId) {
      const found = spaceList.find((space) => space.id === selectedSpaceId);
      if (found) return found;
    }
    return spaceList[0] || null;
  }, [selectedSpaceId, spaceList]);

  const handleSelect = useCallback(
    (space: SpaceInfo) => {
      if (space.id !== selectedSpaceId) {
        onSpaceSelect?.(space.id);
      }
      setOpen(false);
    },
    [onSpaceSelect, selectedSpaceId],
  );

  const menuItems: MenuProps['items'] = useMemo(() => {
    if (!spaceList.length && initialized) {
      return [
        {
          key: 'empty',
          label: (
            <div className={cx(styles['menu-item'])}>
              <span className={cx(styles['item-name'])}>
                {t('PC.Components.ChatInputHomeSpaceSelector.noAvailableSpace')}
              </span>
            </div>
          ),
          disabled: true,
        },
      ];
    }

    return spaceList.map((space) => {
      const isSelected = space.id === selectedSpace?.id;
      return {
        key: space.id,
        label: (
          <div className={cx(styles['menu-item'])}>
            <div className={cx(styles['item-content'])}>
              <span className={cx(styles['item-name'])}>{space.name}</span>
              {space.description && (
                <span className={cx(styles['item-desc'])}>
                  {space.description}
                </span>
              )}
            </div>
            {isSelected && (
              <CheckOutlined className={cx(styles['item-check'])} />
            )}
          </div>
        ),
        onClick: () => handleSelect(space),
      };
    });
  }, [handleSelect, initialized, selectedSpace?.id, spaceList]);

  if (!initialized || loading || !spaceList.length) {
    return null;
  }

  return (
    <div className={cx(styles['space-selector-container'], className)}>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="topLeft"
        open={open}
        onOpenChange={setOpen}
        overlayClassName={styles['space-menu']}
      >
        <span className={cx(styles['space-selector'])}>
          <span
            className={cx(styles['selector-btn'], {
              [styles.open]: open,
            })}
          >
            <Typography.Text>{selectedSpace?.name || '--'}</Typography.Text>
            <SvgIcon
              name="icons-common-caret_down"
              style={{ fontSize: 14 }}
              className={cx(styles['selector-arrow'])}
            />
          </span>
        </span>
      </Dropdown>
    </div>
  );
};

export default SpaceSelector;
