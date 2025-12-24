import SvgIcon from '@/components/base/SvgIcon';
import { Button, Dropdown } from 'antd';
import { useMemo } from 'react';

// 更多操作相关接口
interface MoreActionsProps {
  // 导入项目
  onImportProject?: () => void;
  // 全屏页面预览
  onFullscreenPreview?: () => void;
  // 导出项目
  onExportProject?: () => void;
  // 是否正在加载
  isChatLoading?: boolean;
}

/**
 * 更多操作菜单组件
 * 负责更多操作相关的所有交互逻辑和状态管理
 */
const MoreActionsMenu: React.FC<MoreActionsProps> = ({
  onImportProject,
  onFullscreenPreview,
  onExportProject,
  isChatLoading,
}) => {
  // 菜单项配置
  const menuItems = useMemo(
    () => [
      {
        key: 'import',
        icon: <SvgIcon name="icons-common-import" style={{ fontSize: 16 }} />,
        label: '导入项目',
        onClick: onImportProject,
        disabled: isChatLoading,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'fullscreen',
        icon: (
          <SvgIcon name="icons-common-fullscreen" style={{ fontSize: 16 }} />
        ),
        label: '全屏页面预览',
        onClick: onFullscreenPreview,
        disabled: isChatLoading,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'export',
        icon: <SvgIcon name="icons-common-download" style={{ fontSize: 16 }} />,
        label: '导出项目',
        onClick: onExportProject,
        disabled: isChatLoading,
      },
    ],
    [onImportProject, onFullscreenPreview, onExportProject, isChatLoading],
  );

  return (
    <Dropdown
      trigger={['click']}
      menu={{ items: menuItems }}
      placement="bottomRight"
    >
      <Button
        type="text"
        icon={<SvgIcon name="icons-common-more" style={{ fontSize: '16px' }} />}
      />
    </Dropdown>
  );
};

export default MoreActionsMenu;
