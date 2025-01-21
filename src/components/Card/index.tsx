import { CardStyleEnum } from '@/types/enums/common';
import { CardProps } from '@/types/interfaces/common';
import React from 'react';
import CardFour from './CardFour';
import CardOne from './CardOne';
import CardThree from './CardThree';
import CardTwo from './CardTwo';

/**
 * 卡片
 */
const Card: React.FC<
  CardProps & {
    type: CardStyleEnum;
  }
> = (props) => {
  const { type } = props;
  const content = () => {
    switch (type) {
      case CardStyleEnum.ONE:
        return <CardOne {...props} />;
      case CardStyleEnum.TWO:
        return <CardTwo {...props} />;
      case CardStyleEnum.THREE:
        return <CardThree {...props} />;
      case CardStyleEnum.FOUR:
        return <CardFour {...props} />;
    }
  };
  return <>{content()}</>;
};

export default Card;
