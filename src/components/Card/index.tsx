import { CardStyleEnum } from '@/types/enums/common';
import { CardProps } from '@/types/interfaces/cardInfo';
import React from 'react';
import CardFour from './CardFour';
import CardOne from './CardOne';
import CardThree from './CardThree';
import CardTwo from './CardTwo';

/**
 * 卡片
 */
const Card: React.FC<CardProps> = (props) => {
  const { cardKey, bindLinkUrl, ...info } = props;

  const handleClick = () => {
    if (bindLinkUrl) {
      window.open(bindLinkUrl);
    }
  };

  switch (cardKey) {
    case CardStyleEnum.ONE:
      return <CardOne {...info} onClick={handleClick} />;
    case CardStyleEnum.TWO:
      return <CardTwo {...info} onClick={handleClick} />;
    case CardStyleEnum.THREE:
      return <CardThree {...info} onClick={handleClick} />;
    case CardStyleEnum.FOUR:
      return <CardFour {...info} onClick={handleClick} />;
  }
};

export default Card;
