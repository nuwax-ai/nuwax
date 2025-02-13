// 获取当前时间戳
function getUnix() {
  let date = new Date();
  return date.getTime();
}

// 获取今天0点0分0秒的时间戳
function getTodayUnix() {
  let date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.getTime();
}

// 获取今年1月1日0点0分0秒的时间戳
function getYearUnix() {
  let date = new Date();
  date.setMonth(0);
  date.setDate(1);
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.getTime();
}

// 获取标准年月日
function getLastDate(time) {
  let date = new Date(time);
  let year = date.getFullYear();
  let month =
    date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  return `${year}-${month}-${day}`;
}

// 获取标准年月日 时分秒
function transformTDate(time) {
  let date = new Date(time);
  let year = date.getFullYear();
  let month =
    date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  let hour = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
  let minutes =
    date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
  let second =
    date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();
  return `${year}-${month}-${day} ${hour}:${minutes}:${second}`;
}

// 获取标准年月日~ 日期
function getDate(time) {
  let date = new Date(time);
  let year = date.getFullYear();
  let month =
    date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  return `${year}年${month}月${day}日`;
}

// 获取标准年月日~ 日期 2019.09.09
function getDotDate(time) {
  let date = new Date(time);
  let year = date.getFullYear();
  let month =
    date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  return `${year}.${month}.${day}`;
}

// 获取标准年月日分开成obj~ 日期
function getDateSplit(time) {
  if (!time) return {};
  let date = new Date(time);
  let year = date.getFullYear();
  let month =
    date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  return {
    year: year,
    monthDay: `${month}月${day}日`,
  };
}

// 获取音视频的时分秒格式: 1:25:05
function getDuration(duration) {
  let hour = Math.floor(duration / 3600) as string;
  if (hour < 10) {
    hour = `0${hour}`;
  }
  let less = duration % 3600;
  let minutes =
    Math.floor(less / 60) > 9
      ? Math.floor(less / 60)
      : '0' + Math.floor(less / 60);
  let seconds =
    Math.ceil(less % 60) > 9
      ? Math.ceil(less % 60)
      : '0' + Math.ceil(less % 60); // 向上取整
  return hour + ':' + minutes + ':' + seconds;
}

// 获取音视频的时分秒格式: 1小时25分05秒
function getDurationFormat(duration) {
  let hour = Math.floor(duration / 3600);
  let less = duration % 3600;
  let minutes = Math.floor(less / 60);
  let seconds =
    Math.ceil(less % 60) > 9
      ? Math.ceil(less % 60)
      : '0' + Math.ceil(less % 60); // 向上取整
  if (Number(hour) > 0) {
    return hour + '小时' + minutes + '分' + seconds + '秒';
  }
  return minutes + '分' + seconds + '秒';
}

export {
  getDate,
  getDateSplit,
  getDotDate,
  getDuration,
  getDurationFormat,
  getLastDate,
  getTodayUnix,
  getUnix,
  getYearUnix,
  transformTDate,
};
