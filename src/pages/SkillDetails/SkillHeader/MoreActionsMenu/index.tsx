import SvgIcon from '@/components/base/SvgIcon';
import { Button, Dropdown } from 'antd';
import { useMemo } from 'react';

// 更多操作相关接口
interface MoreActionsProps {
  // 导入项目
  onImportProject?: () => void;
  // 全屏预览
  onFullscreenPreview?: () => void;
  // 导出项目
  onExportProject?: () => void;
  // 是否正在加载
  isLoading?: boolean;
  // 是否正在导出项目
  isExportingProject?: boolean;
}

/**
 * 更多操作菜单组件
 * 负责更多操作相关的所有交互逻辑和状态管理
 */
const MoreActionsMenu: React.FC<MoreActionsProps> = ({
  onImportProject,
  onFullscreenPreview,
  onExportProject,
  isLoading,
  isExportingProject,
}) => {
  // 菜单项配置
  const menuItems = useMemo(
    () => [
      {
        key: 'import',
        icon: <SvgIcon name="icons-common-import" style={{ fontSize: 16 }} />,
        label: '导入技能',
        onClick: onImportProject,
        disabled: isLoading,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'fullscreen',
        icon: (
          <SvgIcon name="icons-common-fullscreen" style={{ fontSize: 16 }} />
        ),
        label: '全屏预览',
        onClick: onFullscreenPreview,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'export',
        icon: <SvgIcon name="icons-common-download" style={{ fontSize: 16 }} />,
        label: '导出技能',
        onClick: onExportProject,
        disabled: isExportingProject,
      },
    ],
    [
      onImportProject,
      onFullscreenPreview,
      onExportProject,
      isLoading,
      isExportingProject,
    ],
  );

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
      <Button
        type="text"
        icon={<SvgIcon name="icons-common-more" style={{ fontSize: '16px' }} />}
      />
    </Dropdown>
  );
};

export default MoreActionsMenu;
