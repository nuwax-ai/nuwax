import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  BarChartOutlined,
  CompassOutlined,
  RobotOutlined,
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
  tagType: AgentComponentTypeEnum.Agent | AgentComponentTypeEnum.PageApp;
  icon: React.ReactNode;
  iconBgClass: string;
}

interface RecentProjectsProps {
  onProjectClick: (type: string, name: string) => void;
}

const RecentProjects: React.FC<RecentProjectsProps> = ({ onProjectClick }) => {
  const { userInfo } = useModel('userInfo');
  const nickname = userInfo?.nickname || userInfo?.userName || '--';

  const projects: ProjectItem[] = [
    {
      id: '2',
      title: '爆款小红书Agent',
      desc: '小红书爆款模仿智能体，自动分析爆款逻辑，生成高流量笔记...',
      tag: '智能体',
      tagType: AgentComponentTypeEnum.Agent,
      icon: <CompassOutlined />,
      iconBgClass: 'icon-agent',
    },
    {
      id: '3',
      title: '颜值管理网站',
      desc: '颜值焕新平台，打造个性美学体验，提升视觉品味。',
      tag: '网页应用',
      tagType: AgentComponentTypeEnum.PageApp,
      icon: <SmileOutlined />,
      iconBgClass: 'icon-web',
    },
    {
      id: '4',
      title: '智能客服机器人',
      desc: '基于大模型的智能客服Agent，支持多轮对话 and 知识库检索',
      tag: '智能体',
      tagType: AgentComponentTypeEnum.Agent,
      icon: <RobotOutlined />,
      iconBgClass: 'icon-agent-bot',
    },
    {
      id: '5',
      title: '电商数据分析平台',
      desc: '实时销售数据看板，支持多维度分析、用户画像 and 趋势预测',
      tag: '网页应用',
      tagType: AgentComponentTypeEnum.PageApp,
      icon: <BarChartOutlined />,
      iconBgClass: 'icon-web-chart',
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
                    [styles['tag-agent']]:
                      project.tagType === AgentComponentTypeEnum.Agent,
                    [styles['tag-web']]:
                      project.tagType === AgentComponentTypeEnum.PageApp,
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
