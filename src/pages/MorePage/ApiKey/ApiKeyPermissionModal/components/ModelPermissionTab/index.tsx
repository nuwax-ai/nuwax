import { dict } from '@/services/i18nRuntime';
import { Checkbox, Empty, Typography } from 'antd';
import React, { useState } from 'react';

const { Text } = Typography;

export interface ModelPermissionTabProps {
  loading: boolean;
  myModels: any[];
  checkedModelKeys: number[];
  onCheckedModelKeysChange: (keys: number[]) => void;
}

/**
 * 系统模型页签组件
 */
const ModelPermissionTab: React.FC<ModelPermissionTabProps> = ({
  loading,
  myModels,
  checkedModelKeys,
  onCheckedModelKeysChange,
}) => {
  const [hoveredModelId, setHoveredModelId] = useState<number | null>(null);

  if (myModels.length === 0) {
    if (loading) return null;
    return (
      <Empty
        description={dict('PC.Pages.MorePage.ApiKeyPermission.noModelDefs')}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {myModels.map((item) => {
        const isChecked = checkedModelKeys.includes(item.id);
        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 4px',
              borderRadius: 4,
              backgroundColor:
                hoveredModelId === item.id ? '#f5f5f5' : 'transparent',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={() => setHoveredModelId(item.id)}
            onMouseLeave={() => setHoveredModelId(null)}
          >
            <Checkbox
              checked={isChecked}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  onCheckedModelKeysChange([...checkedModelKeys, item.id]);
                } else {
                  onCheckedModelKeysChange(
                    checkedModelKeys.filter((id) => id !== item.id),
                  );
                }
              }}
              style={{ marginRight: 8 }}
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                paddingRight: 8,
                gap: 16,
                cursor: 'pointer',
              }}
              onClick={() => {
                if (isChecked) {
                  onCheckedModelKeysChange(
                    checkedModelKeys.filter((id) => id !== item.id),
                  );
                } else {
                  onCheckedModelKeysChange([...checkedModelKeys, item.id]);
                }
              }}
            >
              <Text
                ellipsis={{ tooltip: true }}
                style={{ fontSize: 14, flex: 1, width: 0 }}
              >
                {item.name}
              </Text>
              <Text
                type="secondary"
                ellipsis={{ tooltip: true }}
                style={{
                  fontSize: 12,
                  flex: 1,
                  width: 0,
                  textAlign: 'left',
                }}
              >
                {item.description || ''}
              </Text>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModelPermissionTab;
