/**
 * Ant Design DatePicker / RangePicker 依赖 dayjs 插件（weekday 等）。
 * 须在任意 DatePicker 渲染前执行一次。
 * Ant Design 5 的 DatePicker / RangePicker 在渲染日历面板时会调用 dayjs 的 weekday() 等方法，
 * 但项目里只引入了 dayjs，没有注册 weekday、localeData 等插件，因此点击选择器会报 clone.weekday is not a function。
 */
import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localeData from 'dayjs/plugin/localeData';
import weekday from 'dayjs/plugin/weekday';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekYear from 'dayjs/plugin/weekYear';

dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);
