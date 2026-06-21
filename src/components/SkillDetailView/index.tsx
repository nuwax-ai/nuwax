import { FileTreeViewPanel } from '@/components/business-component';
import {
  apiPublishedSkillDetail,
  apiPublishSkillDetail,
} from '@/services/skill';
import type { SkillDetailInfo } from '@/types/interfaces/skill';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import SkillHeader, { type SkillDetailViewMode } from './SkillHeader';
import styles from './index.less';

const cx = classNames.bind(styles);

export type { SkillDetailViewMode };

interface SkillDetailViewProps {
  spaceId: number;
  skillId: number;
  /** apply — 待审核 / published — 已发布 */
  mode: SkillDetailViewMode;
}

/** mode 对应的 API 函数映射 */
const apiMap: Record<SkillDetailViewMode, (skillId: number) => any> = {
  apply: apiPublishSkillDetail,
  published: apiPublishedSkillDetail,
};

/**
 * 技能详情公共组件
 * - 根据 mode 自动调用对应接口（待审核 / 已发布）
 * - 只读查看，不提供编辑/发布/文件操作等能力
 */
const SkillDetailView: React.FC<SkillDetailViewProps> = ({ skillId, mode }) => {
  const [skillInfo, setSkillInfo] = useState<SkillDetailInfo | null>(null);

  // 文件树数据加载状态
  const [fileTreeDataLoading, setFileTreeDataLoading] =
    useState<boolean>(false);

  // 根据 mode 选择对应的 API
  const apiFn = apiMap[mode];

  // 查询技能信息
  const { run: runSkillInfo } = useRequest(apiFn, {
    manual: true,
    debounceInterval: 300,
    onSuccess: async (result: SkillDetailInfo) => {
      setFileTreeDataLoading(false);
      const { files } = result || {};
      if (Array.isArray(files) && files.length > 0) {
        setSkillInfo(() => ({
          ...result,
          files: files.map((item) => ({
            ...item,
            fileId: item.name,
          })),
        }));
      } else {
        setSkillInfo(result);
      }
    },
    onError: () => {
      setFileTreeDataLoading(false);
    },
  });

  useEffect(() => {
    if (skillId) {
      setFileTreeDataLoading(true);
      runSkillInfo(skillId);
    }
  }, [skillId]);

  return (
    <div className={cx(styles['page-container'])}>
      {/* 技能头部 */}
      <SkillHeader skillInfo={skillInfo} mode={mode} />

      <div className={cx(styles['layout-wrapper'])}>
        {/* 详情内容区域 */}
        <div className={cx(styles['detail-section'])}>
          <div
            className={cx(
              'flex',
              'h-full',
              'flex-col',
              'overflow-hide',
              'relative',
            )}
          >
            <div className={cx('flex', 'flex-1', 'overflow-y')}>
              {/* 文件树视图（只读模式） */}
              <FileTreeViewPanel
                taskAgentSelectedFileId={'SKILL.md'}
                initViewFileType={'code'}
                isProjectSkill={true}
                fileTreeDataLoading={fileTreeDataLoading}
                originalFiles={skillInfo?.files || []}
                showMoreActions={false}
                isFullscreenPreview={false}
                showFullscreenIcon={false}
                isFileTreePinned={true}
                showRefreshButton={false}
                isShowShare={false}
                isShowDownloadButton={false}
                isShowExportPdfButton={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillDetailView;
