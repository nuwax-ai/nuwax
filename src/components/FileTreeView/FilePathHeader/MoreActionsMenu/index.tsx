import SvgIcon from '@/components/base/SvgIcon';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import { useMemo } from 'react';

// 更多操作相关接口
interface MoreActionsProps {
  // 导入项目
  onImportProject?: () => void;
  // 重启远程电脑
  onRestartServer?: () => void;
  // 重启智能体
  onRestartAgent?: () => void;
  // 导出项目
  onExportProject?: () => void;
}

/**
 * 更多操作菜单组件
 * 负责更多操作相关的所有交互逻辑和状态管理
 */
const MoreActionsMenu: React.FC<MoreActionsProps> = ({
  onImportProject,
  onRestartServer,
  onRestartAgent,
  onExportProject,
}) => {
  // 菜单项配置
  const menuItems = useMemo(
    () => [
      // 只有当 onImportProject 存在时才显示导入项目选项
      ...(onImportProject
        ? [
            {
              key: 'import',
              icon: (
                <SvgIcon name="icons-common-import" style={{ fontSize: 16 }} />
              ),
              label: '导入项目',
              onClick: onImportProject,
            },
            {
              type: 'divider' as const,
            },
          ]
        : []),
      // 只有当 onRestartServer 存在时才显示重启服务器选项
      ...(onRestartServer
        ? [
            {
              key: 'restart',
              icon: (
                <SvgIcon name="icons-common-restart" style={{ fontSize: 16 }} />
              ),
              label: (
                <div className="flex items-center">
                  <span>重启远程电脑</span>
                  <TooltipIcon
                    title="当前用户正在运行的所有智能体将全部被重启；"
                    icon={<InfoCircleOutlined />}
                  />
                </div>
              ),
              onClick: onRestartServer,
            },
          ]
        : []),

      // 只有当 onRestartAgent 存在时才显示重启智能体选项
      ...(onRestartAgent
        ? [
            {
              key: 'restart-agent',
              icon: (
                <SvgIcon name="icons-common-restart" style={{ fontSize: 16 }} />
              ),
              label: (
                <div className="flex items-center">
                  <span>重启智能体</span>
                  <TooltipIcon
                    title="当前会话对应的智能体将重启；"
                    icon={<InfoCircleOutlined />}
                  />
                </div>
              ),
              onClick: onRestartAgent,
            },
          ]
        : []),

      // 只有当 onExportProject 存在时才显示导出项目选项和分隔线
      ...(onExportProject
        ? [
            {
              type: 'divider' as const,
            },
            {
              key: 'export',
              icon: (
                <SvgIcon
                  name="icons-common-download"
                  style={{ fontSize: 16 }}
                />
              ),
              label: '导出结果',
              onClick: onExportProject,
            },
          ]
        : []),
    ],
    [onImportProject, onRestartServer, onExportProject],
  );

  // 如果没有菜单项，则不显示
  if (!menuItems?.length) {
    return null;
  }

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
      <Button
        type="text"
        icon={
          <SvgIcon
            name="icons-common-more"
            style={{ fontSize: '16px', color: 'rgba(0,0,0,0.65)' }}
          />
        }
      />
    </Dropdown>
  );
};

export default MoreActionsMenu;
