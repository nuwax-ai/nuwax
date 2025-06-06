import knowledgeImage from '@/assets/images/knowledge_image.png';
import CustomPopover from '@/components/CustomPopover';
import {
  KNOWLEDGE_QA_IMPORT_TYPE,
  KNOWLEDGE_TEXT_IMPORT_TYPE,
} from '@/constants/library.constants';
import type { KnowledgeHeaderProps } from '@/types/interfaces/knowledge';
import { formatBytes } from '@/utils/byteConverter';
import { DownOutlined, EditOutlined, LeftOutlined } from '@ant-design/icons';
import { Button, Radio, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history, useParams } from 'umi';
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
  onQaPopover,
  docType = 1,
  onChangeDocType,
}) => {
  const { spaceId } = useParams();
  // 返回上一页，如果没有referrer，则跳转到工作空间（组件库）页面
  const handleBack = () => {
    const referrer = document.referrer;
    if (!referrer || window.history.length <= 1) {
      history.push(`/space/${spaceId}/library`);
    } else {
      history.back();
    }
  };
  const fileSize = knowledgeInfo?.fileSize
    ? formatBytes(knowledgeInfo.fileSize)
    : '0KB';
  const handleChange = (e: RadioChangeEvent) => {
    onChangeDocType(e.target.value);
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
        className={cx('flex', 'flex-col', 'content-between', styles.section)}
      >
        <div className={cx('flex', styles['top-box'])}>
          <h3 className={cx(styles.name)}>{knowledgeInfo?.name}</h3>
          <EditOutlined
            className={cx('cursor-pointer', 'hover-box')}
            onClick={onEdit}
          />
        </div>
        <div className={cx(styles['bottom-box'], 'flex', 'items-center')}>
          <span className={cx(styles.box)}>{`${fileSize}`}</span>
          <span className={cx(styles.box)}>{`${docCount}个文档`}</span>
        </div>
      </section>
      {/* 添加radio.group 放在中间 选项有 文档和QA问答 默认选中文档 */}
      <div className={cx('flex-1', 'flex', 'flex-col', 'items-center')}>
        <Radio.Group
          className={cx(styles['radio-group'])}
          optionType="button"
          defaultValue={docType}
          onChange={handleChange}
        >
          <Radio value={1}>文档</Radio>
          <Radio value={2}>QA问答</Radio>
        </Radio.Group>
      </div>
      {/*添加内容*/}
      {docType === 1 ? (
        <CustomPopover list={KNOWLEDGE_TEXT_IMPORT_TYPE} onClick={onPopover}>
          <Button
            type="primary"
            icon={<DownOutlined className={cx(styles['dropdown-icon'])} />}
            iconPosition="end"
          >
            添加内容
          </Button>
        </CustomPopover>
      ) : (
        <CustomPopover list={KNOWLEDGE_QA_IMPORT_TYPE} onClick={onQaPopover}>
          <Button
            type="primary"
            icon={<DownOutlined className={cx(styles['dropdown-icon'])} />}
            iconPosition="end"
          >
            添加QA问答
          </Button>
        </CustomPopover>
      )}
    </header>
  );
};

export default KnowledgeHeader;
