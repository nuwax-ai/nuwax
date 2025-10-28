/**
 * 示例页面导航组件
 * 提供示例页面之间的快速导航
 */
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Space, Typography } from 'antd';
import React from 'react';
import { history } from 'umi';
import './index.less';

const { Text } = Typography;

interface ExampleNavigationProps {
  /**
   * 当前页面标题
   */
  currentTitle: string;
  /**
   * 是否显示面包屑导航
   */
  showBreadcrumb?: boolean;
  /**
   * 是否显示返回按钮
   */
  showBackButton?: boolean;
  /**
   * 自定义返回路径
   */
  backPath?: string;
  /**
   * 是否显示快速导航按钮
   */
  showQuickNav?: boolean;
}

/**
 * 示例页面配置
 */
const examplePages = [
  {
    title: '示例中心',
    path: '/examples',
    icon: <AppstoreOutlined />,
  },
  {
    title: '背景风格切换',
    path: '/examples/background-style',
    icon: <AppstoreOutlined />,
  },
  {
    title: '导航Token指南',
    path: '/examples/navigation-token',
    icon: <AppstoreOutlined />,
  },
  {
    title: 'Ant Design展示',
    path: '/examples/antd-showcase',
    icon: <AppstoreOutlined />,
  },
];

const ExampleNavigation: React.FC<ExampleNavigationProps> = ({
  currentTitle,
  showBreadcrumb = true,
  showBackButton = true,
  backPath = '/examples',
  showQuickNav = true,
}) => {
  /**
   * 获取当前页面的面包屑路径
   */
  const getBreadcrumbItems = () => {
    const currentPath = history.location.pathname;
    const items = [
      {
        title: (
          <Space>
            <HomeOutlined />
            <span>首页</span>
          </Space>
        ),
        href: '/',
      },
      {
        title: (
          <Space>
            <AppstoreOutlined />
            <span>示例中心</span>
          </Space>
        ),
        href: '/examples',
      },
    ];

    // 如果不是示例首页，添加当前页面
    if (currentPath !== '/examples') {
      const currentPage = examplePages.find(
        (page) => page.path === currentPath,
      );
      if (currentPage) {
        items.push({
          title: currentPage.title,
        });
      }
    }

    return items;
  };

  /**
   * 获取相邻页面
   */
  const getAdjacentPages = () => {
    const currentPath = history.location.pathname;
    const currentIndex = examplePages.findIndex(
      (page) => page.path === currentPath,
    );

    if (currentIndex === -1) return { prev: null, next: null };

    return {
      prev: currentIndex > 0 ? examplePages[currentIndex - 1] : null,
      next:
        currentIndex < examplePages.length - 1
          ? examplePages[currentIndex + 1]
          : null,
    };
  };

  const adjacentPages = getAdjacentPages();

  return (
    <div className="example-navigation">
      {/* 面包屑导航 */}
      {showBreadcrumb && (
        <div className="breadcrumb-section">
          <Breadcrumb
            items={getBreadcrumbItems()}
            separator=">"
            className="breadcrumb"
          />
        </div>
      )}

      {/* 操作按钮区域 */}
      <div className="action-section">
        <Space size="middle">
          {/* 返回按钮 */}
          {showBackButton && (
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => history.push(backPath)}
              className="back-button"
            >
              返回
            </Button>
          )}

          {/* 页面标题 */}
          <div className="page-title">
            <Text strong className="title-text">
              {currentTitle}
            </Text>
          </div>

          {/* 快速导航 */}
          {showQuickNav && (
            <Space>
              {adjacentPages.prev && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => history.push(adjacentPages.prev!.path)}
                  size="small"
                  className="nav-button prev-button"
                >
                  {adjacentPages.prev.title}
                </Button>
              )}

              {adjacentPages.next && (
                <Button
                  icon={<ArrowRightOutlined />}
                  onClick={() => history.push(adjacentPages.next!.path)}
                  size="small"
                  className="nav-button next-button"
                >
                  {adjacentPages.next.title}
                </Button>
              )}
            </Space>
          )}
        </Space>
      </div>
    </div>
  );
};

export default ExampleNavigation;
