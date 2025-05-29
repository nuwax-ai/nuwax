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
  const { cardKey, bindLinkUrl } = props;

  const handleClick = () => {
    if (bindLinkUrl) {
      window.open(bindLinkUrl);
    }
  };

  switch (cardKey) {
    case CardStyleEnum.ONE:
      return <CardOne {...props} onClick={handleClick} />;
    case CardStyleEnum.TWO:
      return <CardTwo {...props} onClick={handleClick} />;
    case CardStyleEnum.THREE:
      return <CardThree {...props} onClick={handleClick} />;
    case CardStyleEnum.FOUR:
      return <CardFour {...props} onClick={handleClick} />;
  }
};

export default Card;
