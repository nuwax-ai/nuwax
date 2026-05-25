import { dict } from '@/services/i18nRuntime';
import { Button, Checkbox, Space } from 'antd';
import React from 'react';

export interface PermissionOperationsBarProps {
  activeTab: 'api' | 'model' | 'spaceModel';
  isIndeterminate: boolean;
  isModelIndeterminate: boolean;
  isSpaceModelIndeterminate: boolean;
  isAllChecked: boolean;
  isAllModelChecked: boolean;
  isAllSpaceModelChecked: boolean;
  onSelectAll: (checked: boolean) => void;
  onSelectAllModels: (checked: boolean) => void;
  onSelectAllSpaceModels: (checked: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

/**
 * 顶部操作栏组件
 */
const PermissionOperationsBar: React.FC<PermissionOperationsBarProps> = ({
  activeTab,
  isIndeterminate,
  isModelIndeterminate,
  isSpaceModelIndeterminate,
  isAllChecked,
  isAllModelChecked,
  isAllSpaceModelChecked,
  onSelectAll,
  onSelectAllModels,
  onSelectAllSpaceModels,
  onExpandAll,
  onCollapseAll,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        padding: '0 16px',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
      }}
    >
      <Checkbox
        indeterminate={
          activeTab === 'api'
            ? isIndeterminate
            : activeTab === 'model'
            ? isModelIndeterminate
            : isSpaceModelIndeterminate
        }
        checked={
          activeTab === 'api'
            ? isAllChecked
            : activeTab === 'model'
            ? isAllModelChecked
            : isAllSpaceModelChecked
        }
        onChange={(e) => {
          const checked = e.target.checked;
          if (activeTab === 'api') {
            onSelectAll(checked);
          } else if (activeTab === 'model') {
            onSelectAllModels(checked);
          } else {
            onSelectAllSpaceModels(checked);
          }
        }}
      >
        {dict('PC.Pages.MorePage.ApiKeyPermission.selectAll')}
      </Checkbox>
      {activeTab === 'api' && (
        <Space>
          <Button size="small" onClick={onExpandAll}>
            {dict('PC.Pages.MorePage.ApiKeyPermission.expandAll')}
          </Button>
          <Button size="small" onClick={onCollapseAll}>
            {dict('PC.Pages.MorePage.ApiKeyPermission.collapseAll')}
          </Button>
        </Space>
      )}
    </div>
  );
};

export default PermissionOperationsBar;
