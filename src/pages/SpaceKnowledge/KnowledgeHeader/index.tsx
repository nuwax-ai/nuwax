import knowledgeImage from '@/assets/images/knowledge_image.png';
import CustomPopover from '@/components/CustomPopover';
import { KNOWLEDGE_TEXT_IMPORT_TYPE } from '@/constants/library.constants';
import type { KnowledgeHeaderProps } from '@/types/interfaces/knowledge';
import { DownOutlined, EditOutlined, LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 知识库头部组件
 */
const KnowledgeHeader: React.FC<KnowledgeHeaderProps> = ({
  docCount = 0,
  knowledgeInfo,
  onEdit,
  onPopover,
}) => {
  const handleBack = () => {
    history.back();
  };

  return (
    <header className={cx('flex', 'items-center', 'w-full', styles.header)}>
      <LeftOutlined
        className={cx(styles['icon-back'], 'cursor-pointer')}
        onClick={handleBack}
      />
      <img
        className={cx(styles.logo)}
        src={knowledgeInfo?.icon || (knowledgeImage as string)}
        alt=""
      />
      <section
        className={cx(
          'flex-1',
          'flex',
          'flex-col',
          'content-between',
          styles.section,
        )}
      >
        <div className={cx('flex', styles['top-box'])}>
          <h3 className={cx(styles.name)}>{knowledgeInfo?.name}</h3>
          <EditOutlined
            className={cx('cursor-pointer', 'hover-box')}
            onClick={onEdit}
          />
        </div>
        <div className={cx(styles['bottom-box'], 'flex', 'items-center')}>
          <span className={cx(styles.box, 'radius-6')}>
            {`${docCount}个文档`}
          </span>
        </div>
      </section>
      {/*添加内容*/}
      <CustomPopover list={KNOWLEDGE_TEXT_IMPORT_TYPE} onClick={onPopover}>
        <Button
          type="primary"
          icon={<DownOutlined className={cx(styles['dropdown-icon'])} />}
          iconPosition="end"
        >
          添加内容
        </Button>
      </CustomPopover>
    </header>
  );
};

export default KnowledgeHeader;
