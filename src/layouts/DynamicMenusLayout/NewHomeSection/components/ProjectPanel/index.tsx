import { dict } from '@/services/i18nRuntime';
import { RightOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 项目子项(文档/会话等内容) */
export interface ProjectChildItem {
  id: string;
  name: string;
  modified?: string;
}

/** 项目列表项 */
export interface ProjectItem {
  id: string;
  name: string;
  children?: ProjectChildItem[];
}

/**
 * MOCK:项目列表数据(参照设计原型样例),仅用于交互/UI 确认。
 * TODO(后端):项目数据接口就绪后删除此 mock,数据改为接口下发。
 */
const MOCK_PROJECTS: ProjectItem[] = [
  {
    id: 'p-1',
    name: '类飞书文档协作工具',
    children: [
      { id: 'c-1-1', name: '技术方案评审稿 v1.1', modified: '昨天' },
      { id: 'c-1-2', name: '租户隔离与需求裁剪', modified: '8月18日' },
      { id: 'c-1-3', name: 'Yjs 实时协作接入', modified: '8月17日' },
    ],
  },
  { id: 'p-2', name: '智能音箱音乐源接入' },
  { id: 'p-3', name: '云南出行方案预览页' },
  { id: 'p-4', name: '湖光秋色志' },
  { id: 'p-5', name: '女娲智能体OS产品介绍PPT' },
];

/**
 * 「项目」Tab 面板。
 *
 * 项目行:名称 + 「+」新建 + 展开箭头;点击行切换展开,展开显示项目子项。
 * 当前为 mock 数据阶段(后端接口未 ready),交互仅到 UI 确认层面:
 * 子项点击与「+」均不触发跳转/创建。
 */
const ProjectPanel: React.FC = () => {
  // 默认展开第一个项目(与原型一致)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(MOCK_PROJECTS[0] ? [MOCK_PROJECTS[0].id] : []),
  );

  const handleProjectClick = (project: ProjectItem) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(project.id)) {
        next.delete(project.id);
      } else {
        next.add(project.id);
      }
      return next;
    });
  };

  if (MOCK_PROJECTS.length === 0) {
    return (
      <div className={cx(styles['project-panel'])}>
        <Typography.Text
          type="secondary"
          className={cx(styles['project-empty'])}
        >
          {dict('PC.Layouts.DynamicMenusLayout.NewHomeSection.noProjects')}
        </Typography.Text>
      </div>
    );
  }

  return (
    <div className={cx(styles['project-panel'])}>
      {MOCK_PROJECTS.map((project) => {
        const expanded = expandedIds.has(project.id);
        return (
          <div key={project.id} className={cx(styles.project)}>
            <div
              className={cx(styles.row, { [styles.expanded]: expanded })}
              onClick={() => handleProjectClick(project)}
              role="button"
              tabIndex={-1}
            >
              <span className={cx(styles.name)} title={project.name}>
                {project.name}
              </span>
              {/* 新建入口:mock 阶段不触发动作,仅阻断行展开 */}
              <span
                className={cx(styles.add)}
                onClick={(event) => event.stopPropagation()}
                title={dict(
                  'PC.Layouts.DynamicMenusLayout.NewHomeSection.newProjectItem',
                )}
              >
                +
              </span>
              <RightOutlined
                className={cx(styles.arrow, {
                  [styles.arrowExpanded]: expanded,
                })}
              />
            </div>
            {expanded &&
              project.children?.map((child) => (
                <div key={child.id} className={cx(styles.child)}>
                  <span className={cx(styles['child-name'])} title={child.name}>
                    {child.name}
                  </span>
                  {child.modified && (
                    <span className={cx(styles['child-time'])}>
                      {child.modified}
                    </span>
                  )}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
};

export default ProjectPanel;
