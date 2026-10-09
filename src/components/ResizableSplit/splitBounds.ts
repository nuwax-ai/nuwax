/** 容器小于两栏最小宽度总和时等比收敛，保证两栏仍可见且无负宽。 */
export const getSplitBounds = (width: number, left: number, right: number) => {
  const available = Math.max(0, width);
  const minLeft = Math.max(0, left);
  const minRight = Math.max(0, right);
  const scale =
    minLeft + minRight > available && minLeft + minRight > 0
      ? available / (minLeft + minRight)
      : 1;
  return { minLeft: minLeft * scale, minRight: minRight * scale };
};
