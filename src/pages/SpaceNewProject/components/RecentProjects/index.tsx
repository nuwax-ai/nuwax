import {
  BarChartOutlined,
  CompassOutlined,
  FileTextOutlined,
  RobotOutlined,
  ShareAltOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ProjectItem {
  id: string;
  title: string;
  desc: string;
  tag: string;
  tagType: 'workflow' | 'agent' | 'web';
  icon: React.ReactNode;
  iconBgClass: string;
}

interface RecentProjectsProps {
  onProjectClick: (type: string, name: string) => void;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ onProjectClick }) => {
  const { initialState } = useModel('@@initialState');
  const nickname =
    initialState?.currentUser?.nickname ||
    initialState?.currentUser?.username ||
    '冯飞';

  const projects: ProjectItem[] = [
    {
      id: '1',
      title: 'AI新闻自动收集8点工作流',
      desc: '每日8点自动收集AI新闻的工作流，提升信息获取效率',
      tag: '工作流',
      tagType: 'workflow',
      icon: <FileTextOutlined />,
      iconBgClass: 'icon-workflow',
    },
    {
      id: '2',
      title: '爆款小红书Agent',
      desc: '小红书爆款模仿智能体，自动分析爆款逻辑，生成高流量笔记...',
      tag: '智能体',
      tagType: 'agent',
      icon: <CompassOutlined />,
      iconBgClass: 'icon-agent',
    },
    {
      id: '3',
      title: '颜值管理网站',
      desc: '颜值焕新平台，打造个性美学体验，提升视觉品味。',
      tag: '网页应用',
      tagType: 'web',
      icon: <SmileOutlined />,
      iconBgClass: 'icon-web',
    },
    {
      id: '4',
      title: '智能客服机器人',
      desc: '基于大模型的智能客服Agent，支持多轮对话和知识库检索',
      tag: '智能体',
      tagType: 'agent',
      icon: <RobotOutlined />,
      iconBgClass: 'icon-agent-bot',
    },
    {
      id: '5',
      title: '电商数据分析平台',
      desc: '实时销售数据看板，支持多维度分析、用户画像 and 趋势预测',
      tag: '网页应用',
      tagType: 'web',
      icon: <BarChartOutlined />,
      iconBgClass: 'icon-web-chart',
    },
    {
      id: '6',
      title: '社交媒体内容生成器',
      desc: '一键生成多平台营销文案，适配微博、抖音、小红书风格',
      tag: '工作流',
      tagType: 'workflow',
      icon: <ShareAltOutlined />,
      iconBgClass: 'icon-workflow-share',
    },
  ];

  return (
    <div className={cx(styles['recent-projects-container'])}>
      {/* Section Title */}
      <div className={cx(styles['section-header'])}>
        <span className={cx(styles['section-badge'])}>最近项目</span>
      </div>

      {/* Cards Grid */}
      <div className={cx(styles['projects-grid'])}>
        {projects.map((project) => (
          <div
            key={project.id}
            className={cx(styles['project-card'])}
            onClick={() => onProjectClick(project.tagType, project.title)}
          >
            <div className={cx(styles['card-main'])}>
              {/* Left Details */}
              <div className={cx(styles['left-info'])}>
                <h4 className={cx(styles['project-title'])}>{project.title}</h4>
                <p className={cx(styles['project-desc'])}>{project.desc}</p>
                <div
                  className={cx(styles['tag-badge'], {
                    [styles['tag-workflow']]: project.tagType === 'workflow',
                    [styles['tag-agent']]: project.tagType === 'agent',
                    [styles['tag-web']]: project.tagType === 'web',
                  })}
                >
                  {project.tag}
                </div>
              </div>

              {/* Right Decorative Icon */}
              <div
                className={cx(
                  styles['right-graphic'],
                  styles[project.iconBgClass],
                )}
              >
                {project.icon}
              </div>
            </div>

            {/* Footer */}
            <div className={cx(styles['card-footer'])}>
              <span className={cx(styles['creator-name'])}>{nickname}</span>
              <span className={cx(styles['divider'])}>|</span>
              <span className={cx(styles['status-text'])}>最近使用</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentProjects;
