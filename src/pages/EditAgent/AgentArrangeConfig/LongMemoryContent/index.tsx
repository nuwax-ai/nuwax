// import TooltipIcon from '@/components/TooltipIcon';
import { t } from '@/services/i18nRuntime';
import { OpenCloseEnum } from '@/types/enums/space';
import type { LongMemoryContentProps } from '@/types/interfaces/agentConfig';
// import { InfoCircleOutlined } from '@ant-design/icons';
// import { Checkbox } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const LongMemoryContent: React.FC<LongMemoryContentProps> = ({
  textClassName,
  openLongMemory = OpenCloseEnum.Close,
}) => {
  console.log(openLongMemory);
  return (
    <div className={cx(styles.container)}>
      <p className={cx(textClassName)}>
        {t('PC.Pages.AgentArrangeLongMemoryContent.description')}
      </p>
      {/*<div className={cx('flex')}>*/}
      {/*  <Checkbox disabled={openLongMemory === OpenCloseEnum.Close}>*/}
      {/*    Enable Prompt usage*/}
      {/*  </Checkbox>*/}
      {/*  <TooltipIcon*/}
      {/*    icon={<InfoCircleOutlined />}*/}
      {/*    title="Prompt usage is enabled by default. If unchecked, prompt usage is disabled (workflow only)."*/}
      {/*  />*/}
      {/*</div>*/}
    </div>
  );
};

export default LongMemoryContent;
