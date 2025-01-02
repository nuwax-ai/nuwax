import { CardStyleEnum } from '@/types/enums/common';
import React, { useState } from 'react';
import CardStyleFour from './CardStyleFour';
import CardStyleOne from './CardStyleOne';
import CardStyleThree from './CardStyleThree';
import CardStyleTwo from './CardStyleTwo';

/**
 * 卡片
 */
const Card: React.FC = () => {
  const [type, setType] = useState<CardStyleEnum>(CardStyleEnum.ONE);
  return (
    <>
      <CardStyleOne type={type} onClick={setType} />
      <CardStyleTwo type={type} onClick={setType} />
      <CardStyleThree type={type} onClick={setType} />
      <CardStyleFour type={type} onClick={setType} />
    </>
  );
};

export default Card;
