import { KnowledgeTextImportEnum } from '@/types/enums/library';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import DocWrap from './DocWrap';
import FileInfo from './FileInfo';
import KnowledgeHeader from './KnowledgeHeader';
import LocalDocModal from './LocalCustomDocModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 工作空间-知识库
 */
const SpaceKnowledge: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [type, setType] = useState<KnowledgeTextImportEnum>();

  const handleEdit = () => {};

  const handleClickPopoverItem = (item: CustomPopoverItem) => {
    console.log('点击popover', item);
    setType(item.value as KnowledgeTextImportEnum);
    switch (item.value) {
      case KnowledgeTextImportEnum.Local_Doc:
        setOpen(true);
        break;
      case KnowledgeTextImportEnum.Online_Doc:
        message.warning('在线文档本版本暂时未做');
        break;
      case KnowledgeTextImportEnum.Custom:
        setOpen(true);
        break;
    }
  };

  // 添加内容-取消操作
  const handleCancel = () => {
    setOpen(false);
  };

  // 添加内容-确认
  const handleConfirm = () => {
    setOpen(false);
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <KnowledgeHeader onEdit={handleEdit} onPopover={handleClickPopoverItem} />
      <div
        className={cx(
          'flex',
          'flex-1',
          'radius-6',
          'overflow-hide',
          styles['inner-container'],
        )}
      >
        {/*文档列表*/}
        <DocWrap />
        {/*文件信息*/}
        <FileInfo />
      </div>
      {/*本地文档弹窗*/}
      <LocalDocModal
        type={type}
        open={open}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </div>
  );
};

export default SpaceKnowledge;
