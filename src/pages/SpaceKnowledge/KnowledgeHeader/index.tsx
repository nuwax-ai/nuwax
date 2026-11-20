import knowledgeImage from '@/assets/images/knowledge_image.png';
import SvgIcon from '@/components/base/SvgIcon';
import CustomPopover from '@/components/CustomPopover';
import {
  KNOWLEDGE_QA_IMPORT_TYPE,
  KNOWLEDGE_TEXT_IMPORT_TYPE,
} from '@/constants/library.constants';
import useCommercialEdition from '@/hooks/useCommercialEdition';
import { dict } from '@/services/i18nRuntime';
import { KnowledgeDocTypeEnum } from '@/types/enums/library';
import type { KnowledgeHeaderProps } from '@/types/interfaces/knowledge';
import { formatBytes } from '@/utils/byteConverter';
import { jumpBack } from '@/utils/router';
import { DownOutlined, FormOutlined } from '@ant-design/icons';
import { Button, Radio, RadioChangeEvent } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
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
  onViewAllGraphs,
}) => {
  const { spaceId } = useParams();

  const { aiOSCommercialEdition } = useCommercialEdition();
  useEffect(() => {
    if (!aiOSCommercialEdition && docType === KnowledgeDocTypeEnum.GRAPH) {
      onChangeDocType(KnowledgeDocTypeEnum.DOC);
    }
  }, [aiOSCommercialEdition, docType, onChangeDocType]);

  const fileSize = knowledgeInfo?.fileSize
    ? formatBytes(knowledgeInfo.fileSize)
    : '0KB';
  const handleChange = (e: RadioChangeEvent) => {
    onChangeDocType(e.target.value);
  };

  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <SvgIcon
          name="icons-nav-backward"
          className={cx(styles['icon-back'], 'cursor-pointer')}
          onClick={() => jumpBack(`/space/${spaceId}/library`)}
        />
        <img
          className={styles.logo}
          src={knowledgeInfo?.icon || (knowledgeImage as string)}
          alt=""
        />
        <div className={styles.details}>
          <h3
            className={cx(styles.name, 'text-ellipsis')}
            title={knowledgeInfo?.name}
          >
            {knowledgeInfo?.name}
          </h3>
          <FormOutlined
            className={cx('cursor-pointer', 'hover-box')}
            onClick={onEdit}
            style={{ fontSize: 16 }}
          />

          <div className={cx(styles['bottom-box'], 'flex', 'items-center')}>
            <span className={cx(styles.box)}>{`${fileSize}`}</span>
            <span className={cx(styles.box)}>
              {dict(
                'PC.Pages.SpaceKnowledge.KnowledgeHeader.docCount',
                docCount,
              )}
            </span>
          </div>
        </div>
      </div>
      <div className={styles.controls}>
        <div className={styles.tabs}>
          <Radio.Group
            className={styles['radio-group-box']}
            optionType="button"
            value={docType}
            onChange={handleChange}
          >
            <Radio value={KnowledgeDocTypeEnum.DOC}>
              {dict('PC.Pages.SpaceKnowledge.KnowledgeHeader.doc')}
            </Radio>
            <Radio value={KnowledgeDocTypeEnum.QA}>
              {dict('PC.Pages.SpaceKnowledge.KnowledgeHeader.qa')}
            </Radio>
            {aiOSCommercialEdition && (
              <Radio value={KnowledgeDocTypeEnum.GRAPH}>
                {dict('PC.Pages.SpaceKnowledge.KnowledgeHeader.graph')}
              </Radio>
            )}
            <Radio value={KnowledgeDocTypeEnum.ACCURACYTEST}>
              {dict('PC.Pages.SpaceKnowledge.KnowledgeHeader.accuracytest')}
            </Radio>
          </Radio.Group>
        </div>
        <div className={styles.actions}>
          {docType === KnowledgeDocTypeEnum.DOC ? (
            <CustomPopover
              list={KNOWLEDGE_TEXT_IMPORT_TYPE}
              onClick={onPopover}
            >
              <Button
                type="primary"
                icon={<DownOutlined className={cx(styles['dropdown-icon'])} />}
                iconPosition="end"
              >
                {dict('PC.Pages.SpaceKnowledge.KnowledgeHeader.addContent')}
              </Button>
            </CustomPopover>
          ) : docType === KnowledgeDocTypeEnum.QA ? (
            <CustomPopover
              list={KNOWLEDGE_QA_IMPORT_TYPE}
              onClick={onQaPopover}
            >
              <Button
                type="primary"
                icon={<DownOutlined className={cx(styles['dropdown-icon'])} />}
                iconPosition="end"
              >
                {dict('PC.Pages.SpaceKnowledge.KnowledgeHeader.addQa')}
              </Button>
            </CustomPopover>
          ) : docType === KnowledgeDocTypeEnum.GRAPH ? (
            <Button type="primary" onClick={onViewAllGraphs}>
              {dict('PC.Pages.SpaceKnowledge.KnowledgeHeader.graph')}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default KnowledgeHeader;
