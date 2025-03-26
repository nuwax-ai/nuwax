import { apiAgentCardList } from '@/services/agentConfig';
import type { AgentCardInfo } from '@/types/interfaces/agent';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import BindDataSource from './BindDataSource';
import CardModeSetting from './CardModeSetting';
import styles from './index.less';

const cx = classNames.bind(styles);

const CardBind: React.FC = () => {
  const [cardKey, setCardKey] = useState<string>('');
  const [agentCardList, setAgentCardList] = useState<AgentCardInfo[]>([]);

  // 查询卡片列表
  const { run: runCard } = useRequest(apiAgentCardList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentCardInfo[]) => {
      setAgentCardList(result);
    },
  });

  useEffect(() => {
    runCard();
  }, []);

  const handleChooseCard = (cardKey: string) => {
    setCardKey(cardKey);
  };

  return (
    <div className={cx('flex', 'h-full', styles.container)}>
      <div className={cx('flex-1', 'px-16', 'py-16')}>
        <h3 className={cx(styles.title)}>选择卡片样式</h3>
        <CardModeSetting
          cardKey={cardKey}
          list={agentCardList}
          onChoose={handleChooseCard}
        />
      </div>
      <div className={cx('flex-1', 'px-16', 'py-16')}>
        <h3 className={cx(styles.title)}>为卡片绑定数据源</h3>
        <BindDataSource />
      </div>
    </div>
  );
};

export default CardBind;
