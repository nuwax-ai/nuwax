import knowledgeImage from '@/assets/images/knowledge_image.png';
import CustomPopover from '@/components/CustomPopover';
import {
  KNOWLEDGE_QA_IMPORT_TYPE,
  KNOWLEDGE_TEXT_IMPORT_TYPE,
} from '@/constants/library.constants';
import { KnowledgeDocTypeEnum } from '@/types/enums/library';
import type { KnowledgeHeaderProps } from '@/types/interfaces/knowledge';
import { formatBytes } from '@/utils/byteConverter';
import { jumpBack } from '@/utils/router';
import { DownOutlined, FormOutlined, LeftOutlined } from '@ant-design/icons';
import { Button, Radio, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useParams } from 'umi';
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
  docType = KnowledgeDocTypeEnum.DOC,
  onChangeDocType,
}) => {
  const { spaceId } = useParams();

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
        onClick={() => jumpBack(`/space/${spaceId}/library`)}
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
          <h3 className={cx(styles.name, 'text-ellipsis')}>
            {knowledgeInfo?.name}
          </h3>
          <FormOutlined
            className={cx('cursor-pointer', 'hover-box')}
            onClick={onEdit}
            style={{ fontSize: 16 }}
          />

          <div className={cx(styles['bottom-box'], 'flex', 'items-center')}>
            <span className={cx(styles.box)}>{`${fileSize}`}</span>
            <span className={cx(styles.box)}>{`${docCount}个文档`}</span>
          </div>
        </div>
      </section>
      {/* 添加radio.group 放在中间 选项有 文档和QA问答 默认选中文档 */}
      {/* <div className={cx('flex', 'flex-col', 'items-center', styles['radio-group-box'])}> */}
      <Radio.Group
        className={cx(
          'flex',
          'items-center',
          'flex-1',
          'content-center',
          styles['radio-group-box'],
        )}
        optionType="button"
        defaultValue={docType}
        onChange={handleChange}
      >
        <Radio value={KnowledgeDocTypeEnum.DOC}>文档</Radio>
        <Radio value={KnowledgeDocTypeEnum.QA}>QA问答</Radio>
      </Radio.Group>
      {/* </div> */}
      {/*添加内容*/}
      <div
        style={{
          width: 150,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {docType === KnowledgeDocTypeEnum.DOC ? (
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
      </div>
    </header>
  );
};

export default KnowledgeHeader;
