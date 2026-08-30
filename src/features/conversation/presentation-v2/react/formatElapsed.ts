/** 耗时文案：X 秒 / X 分 Y 秒 / X 时 Y 分（i18n 单位拼接） */
import { dict } from '@/services/i18nRuntime';

export function formatElapsed(ms: number | undefined | null): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return '';
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds} ${dict(
      'PC.Components.ConversationRendererV2.timeSecond',
    )}`;
  }
  const totalMinutes = Math.floor(totalSeconds / 60);
  const restSeconds = totalSeconds % 60;
  if (totalMinutes < 60) {
    return `${totalMinutes} ${dict(
      'PC.Components.ConversationRendererV2.timeMinute',
    )} ${restSeconds} ${dict(
      'PC.Components.ConversationRendererV2.timeSecond',
    )}`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const restMinutes = totalMinutes % 60;
  return `${hours} ${dict(
    'PC.Components.ConversationRendererV2.timeHour',
  )} ${restMinutes} ${dict('PC.Components.ConversationRendererV2.timeMinute')}`;
}
