/**
 * 菜单权限演示页面
 * @description 展示动态菜单系统和功能权限控制的使用方式
 */
import PermissionWrapper from '@/components/base/PermissionWrapper';
import { usePermission } from '@/hooks/usePermission';
import type { MenuItemDto } from '@/types/interfaces/menu';
import {
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  LockOutlined,
  MenuOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  message,
  Row,
  Space,
  Spin,
  Tag,
  Tree,
  Typography,
} from 'antd';
import React, { useEffect } from 'react';
import { useModel } from 'umi';
import styles from './MenuPermissionDemo.less';

const { Title, Text, Paragraph } = Typography;

/**
 * 菜单权限演示页面
 */
const MenuPermissionDemo: React.FC = () => {
  const { menuTree, loading, loadMenus, hasPermission, firstLevelMenus } =
    useModel('menuModel');
  const { hasAnyPermission, hasAllPermissions } = usePermission();

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  /**
   * 将菜单树转换为 Ant Design Tree 数据格式
   */
  const convertToTreeData = (menus: MenuItemDto[]): any[] => {
    return menus.map((menu) => ({
      key: menu.code,
      title: (
        <Space>
          <Text>{menu.name}</Text>
          <Tag color="blue">{menu.code}</Tag>
          {menu.path && <Tag color="green">{menu.path}</Tag>}
          {menu.permissions?.length && (
            <Tag color="purple">{menu.permissions.length} 个权限</Tag>
          )}
        </Space>
      ),
      children: menu.children?.length
        ? convertToTreeData(menu.children)
        : undefined,
    }));
  };

  /**
   * 刷新菜单数据
   */
  const handleRefresh = () => {
    loadMenus();
    message.success('菜单数据已刷新');
  };

  return (
    <div className={styles.container}>
      {/* 页面标题 */}
      <div className={styles.header}>
        <Title level={2}>
          <LockOutlined
            style={{ marginRight: 12, color: 'var(--xagi-color-primary)' }}
          />
          菜单权限管理演示
        </Title>
        <Paragraph type="secondary">
          展示动态菜单系统和功能权限控制的使用方式。此页面用于开发测试，展示如何使用
          PermissionWrapper 组件和 usePermission Hook。
        </Paragraph>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={loading}
        >
          刷新菜单数据
        </Button>
      </div>

      <Divider />

      <Row gutter={[24, 24]}>
        {/* 菜单树展示 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <MenuOutlined />
                当前用户菜单树
              </Space>
            }
            className={styles.card}
            extra={<Tag color="blue">{firstLevelMenus.length} 个一级菜单</Tag>}
          >
            <Spin spinning={loading}>
              {menuTree.length > 0 ? (
                <Tree
                  showLine={{ showLeafIcon: false }}
                  defaultExpandAll
                  treeData={convertToTreeData(menuTree)}
                  className={styles.menuTree}
                />
              ) : (
                <Alert
                  message="暂无菜单数据"
                  description={
                    <div>
                      <p>
                        请确保后端接口 <Text code>/api/system/menu/list</Text>{' '}
                        已配置并返回菜单数据。
                      </p>
                      <p>接口返回格式示例：</p>
                      <pre className={styles.codeBlock}>
                        {`{
  "code": 0,
  "data": {
    "menus": [
      {
        "id": 1,
        "name": "系统管理",
        "code": "system_manage",
        "icon": "icons-nav-settings",
        "path": "/system",
        "children": [...]
      }
    ]
  }
}`}
                      </pre>
                    </div>
                  }
                  type="info"
                />
              )}
            </Spin>
          </Card>
        </Col>

        {/* PermissionWrapper 组件使用示例 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CodeOutlined />
                PermissionWrapper 组件使用
              </Space>
            }
            className={styles.card}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              {/* 单个权限检查 */}
              <div>
                <Text strong>1. 单个权限检查：</Text>
                <div className={styles.demoRow}>
                  <PermissionWrapper permissions="user:add">
                    <Button type="primary">新增用户（需要 user:add）</Button>
                  </PermissionWrapper>

                  <PermissionWrapper
                    permissions="user:add"
                    fallback={<Button disabled>无权限（fallback）</Button>}
                  >
                    <Button type="primary">有权限的按钮</Button>
                  </PermissionWrapper>
                </div>
                <div className={styles.codeSnippet}>
                  <code>{`<PermissionWrapper permissions="user:add">
  <Button>新增用户</Button>
</PermissionWrapper>`}</code>
                </div>
              </div>

              <Divider dashed />

              {/* 任意权限满足 */}
              <div>
                <Text strong>2. 任意权限满足（OR）：</Text>
                <div className={styles.demoRow}>
                  <PermissionWrapper permissions={['user:edit', 'user:delete']}>
                    <Button>编辑或删除（任一权限即可）</Button>
                  </PermissionWrapper>
                </div>
                <div className={styles.codeSnippet}>
                  <code>{`<PermissionWrapper permissions={['user:edit', 'user:delete']}>
  <Button>编辑或删除</Button>
</PermissionWrapper>`}</code>
                </div>
              </div>

              <Divider dashed />

              {/* 所有权限满足 */}
              <div>
                <Text strong>3. 所有权限满足（AND）：</Text>
                <div className={styles.demoRow}>
                  <PermissionWrapper
                    permissions={['user:edit', 'user:delete']}
                    requireAll
                  >
                    <Button danger>批量操作（需要全部权限）</Button>
                  </PermissionWrapper>
                </div>
                <div className={styles.codeSnippet}>
                  <code>{`<PermissionWrapper 
  permissions={['user:edit', 'user:delete']} 
  requireAll
>
  <Button>批量操作</Button>
</PermissionWrapper>`}</code>
                </div>
              </div>
            </Space>
          </Card>
        </Col>

        {/* usePermission Hook 使用示例 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BulbOutlined />
                usePermission Hook 使用
              </Space>
            }
            className={styles.card}
          >
            <div className={styles.codeBlock}>
              <code>
                {`const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermission();`}
              </code>
            </div>

            <Divider />

            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div className={styles.permissionCheck}>
                <Text code>{"hasPermission('user:add')"}</Text>:
                {hasPermission('user:add') ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    有权限
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    无权限
                  </Tag>
                )}
              </div>

              <div className={styles.permissionCheck}>
                <Text code>{"hasPermission('user:edit')"}</Text>:
                {hasPermission('user:edit') ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    有权限
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    无权限
                  </Tag>
                )}
              </div>

              <div className={styles.permissionCheck}>
                <Text code>
                  {"hasAnyPermission(['user:edit', 'user:delete'])"}
                </Text>
                :
                {hasAnyPermission(['user:edit', 'user:delete']) ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    有权限
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    无权限
                  </Tag>
                )}
              </div>

              <div className={styles.permissionCheck}>
                <Text code>
                  {"hasAllPermissions(['user:add', 'user:edit'])"}
                </Text>
                :
                {hasAllPermissions(['user:add', 'user:edit']) ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">
                    有权限
                  </Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="error">
                    无权限
                  </Tag>
                )}
              </div>
            </Space>
          </Card>
        </Col>

        {/* 代码示例 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CodeOutlined />
                完整代码示例
              </Space>
            }
            className={styles.card}
          >
            <pre className={styles.codeExample}>
              {`// 1. 使用 PermissionWrapper 包裹需要权限控制的元素
import PermissionWrapper from '@/components/base/PermissionWrapper';

<PermissionWrapper permissions="user:add">
  <Button type="primary" onClick={handleAdd}>
    新增用户
  </Button>
</PermissionWrapper>

// 2. 使用 usePermission Hook 进行条件渲染
import { usePermission } from '@/hooks/usePermission';

const { hasPermission } = usePermission();

{hasPermission('user:delete') && (
  <Button danger onClick={handleDelete}>
    删除
  </Button>
)}

// 3. 在业务逻辑中检查权限
const handleExport = () => {
  if (!hasPermission('data:export')) {
    message.error('您没有导出权限');
    return;
  }
  // 执行导出...
};

// 4. 使用 fallback 显示无权限提示
<PermissionWrapper 
  permissions="admin:manage" 
  fallback={<Text type="secondary">无管理权限</Text>}
>
  <Button>管理员操作</Button>
</PermissionWrapper>`}
            </pre>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MenuPermissionDemo;
