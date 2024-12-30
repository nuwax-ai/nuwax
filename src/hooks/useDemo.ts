import { useState } from 'react';

export const useDemo = () => {
  const [data, setData] = useState<number>(0);

  return {
    data,
  };
};
