// function auto zero
function zeroFill(time: number) {
  const _time = time < 10 ? '0' + time : time;
  return _time;
}

export const getTime = (date: string) => {
  const newdate = new Date(date);
  return (
    newdate.getFullYear() +
    '-' +
    zeroFill(newdate.getMonth() + 1) +
    '-' +
    zeroFill(newdate.getDate()) +
    ' ' +
    zeroFill(newdate.getHours()) +
    ':' +
    zeroFill(newdate.getMinutes()) +
    ':' +
    zeroFill(newdate.getSeconds())
  );
};
