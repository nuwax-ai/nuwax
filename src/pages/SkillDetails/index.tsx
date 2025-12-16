import FileTreeView from '@/components/FileTreeView';
import PublishComponentModal from '@/components/PublishComponentModal';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiSkillDetail,
  apiSkillExport,
  apiSkillTemplate,
  apiSkillUploadFile,
} from '@/services/skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { FileNode } from '@/types/interfaces/appDev';
import { SkillDetailInfo } from '@/types/interfaces/skill';
import { transformFlatListToTree } from '@/utils/appDevUtils';
import { exportWholeProjectZip } from '@/utils/exportImportFile';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import styles from './index.less';
import SkillHeader from './SkillHeader';

const cx = classNames.bind(styles);
/**
 * 技能详情页面
 */
const SkillDetails: React.FC = () => {
  const { spaceId, skillId } = useParams();
  // 技能信息
  const [skillInfo, setSkillInfo] = useState<any>(null);
  // 文件树数据
  const [files, setFiles] = useState<FileNode[]>([]);
  // 发布技能弹窗是否打开
  const [open, setOpen] = useState<boolean>(false);

  // 查询技能信息
  const { run: runSkillInfo } = useRequest(apiSkillDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: async (result: SkillDetailInfo) => {
      setSkillInfo(result);
      const { files } = result || {};
      let treeData: FileNode[] = [];
      // 如果文件列表不为空，则转换为树形结构
      if (Array.isArray(files) && files.length > 0 && files[0].name) {
        treeData = transformFlatListToTree(files);
      } else {
        // 从模板中获取文件列表
        const {
          data: templateInfo,
          code,
          message: errorMessage,
        } = await apiSkillTemplate();
        if (code === SUCCESS_CODE) {
          treeData = transformFlatListToTree(templateInfo.files);
        } else {
          message.error(errorMessage || '获取技能模板失败');
        }
      }
      setFiles(treeData);
    },
  });

  useEffect(() => {
    if (skillId) {
      runSkillInfo(skillId);
    }
  }, [skillId]);

  // 确认发布技能回调
  const handleConfirmPublish = () => {
    console.log('handleConfirmPublish');
    setOpen(false);
    // // 同步发布时间和修改时间
    // const time = dayjs().toString();
    // // 更新技能配置信息
    // const _skillInfo = {
    //   ...skillInfo,
    //   publishDate: time,
    //   modified: time,
    // };
  };

  /**
   * 处理上传单个文件回调
   */
  const handleUploadSingleFile = async (node: FileNode | null) => {
    console.log('node', node);
    if (!skillId) {
      message.error('技能ID不能为空');
      return;
    }
    // 两种情况 第一个是文件夹，第二个是文件
    let relativePath = '';

    if (node) {
      if (node.type === 'file') {
        relativePath = node.path.replace(new RegExp(node.name + '$'), ''); //只替换以node.name结尾的部分
      } else if (node.type === 'folder') {
        relativePath = node.path + '/';
      }
    }

    // 创建一个隐藏的文件输入框
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    document.body.appendChild(input);

    // 等待用户选择文件
    input.click();

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      try {
        // 设置加载状态，与弹窗上传保持一致
        // setSingleFileUploadLoading(true);
        // setIsFileOperating(true);

        console.log('file', file);

        // 直接调用上传接口，使用文件名作为路径
        const result = await apiSkillUploadFile({
          file,
          skillId,
          filePath: relativePath + file.name,
        });

        if (result) {
          message.success('上传成功');
          // 刷新项目详情
          runSkillInfo(skillId);
        }
      } catch (error) {
        console.error('上传失败', error);
      } finally {
        // 清理加载状态和DOM
        // setSingleFileUploadLoading(false);
        document.body.removeChild(input);
        // setIsFileOperating(false);
      }
    };

    // 如果用户取消选择，也要清理DOM
    input.oncancel = () => {
      document.body.removeChild(input);
      // setIsFileOperating(false);
    };
  };

  // 下载技能文件
  const handleDownload = async () => {
    // 检查项目ID是否有效
    if (!skillId) {
      message.error('技能ID不存在或无效，无法导出');
      return;
    }

    try {
      const result = await apiSkillExport(skillId);
      const filename = `skill-${skillId}.zip`;
      // 导出整个项目压缩包
      exportWholeProjectZip(result, filename);
      message.success('导出成功！');
    } catch (error) {
      // 改进错误处理，兼容不同的错误格式
      const errorMessage =
        (error as any)?.message ||
        (error as any)?.toString() ||
        '导出过程中发生未知错误';

      message.error(`导出失败: ${errorMessage}`);
    }
  };

  return (
    <div
      className={cx('skill-details-container', 'flex', 'h-full', 'flex-col')}
    >
      {/* 技能头部 */}
      <SkillHeader
        skillInfo={skillInfo}
        onEditAgent={() => {}}
        onPublish={() => setOpen(true)}
      />
      {/* 文件树视图 */}
      <FileTreeView
        files={files}
        onUploadSingleFile={handleUploadSingleFile}
        onDownload={handleDownload}
      />

      {/*发布技能弹窗*/}
      <PublishComponentModal
        mode={AgentComponentTypeEnum.Skill}
        targetId={skillId}
        open={open}
        spaceId={spaceId}
        category={skillInfo?.category}
        // 取消发布
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirmPublish}
      />
    </div>
  );
};

export default SkillDetails;
