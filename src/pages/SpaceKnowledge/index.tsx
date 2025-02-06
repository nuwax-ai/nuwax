import FileInfo from '@/pages/SpaceKnowledge/FileInfo';
import classNames from 'classnames';
import React from 'react';
import DocWrap from './DocWrap';
import styles from './index.less';
import KnowledgeHeader from './KnowledgeHeader';

const cx = classNames.bind(styles);

const SpaceKnowledge: React.FC = () => {
  const handleEdit = () => {};

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <KnowledgeHeader onEdit={handleEdit} />
      <div
        className={cx(
          'flex',
          'flex-1',
          'radius-6',
          'overflow-hide',
          styles['inner-container'],
        )}
      >
        <DocWrap />
        <FileInfo />
      </div>
    </div>
  );
};

export default SpaceKnowledge;
