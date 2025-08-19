import { ReactComponent as AddSvgFile } from '@/assets/icons/chat/add.svg';
import { ReactComponent as ClearSvgFile } from '@/assets/icons/chat/clear.svg';
import { ReactComponent as ClockSvgFile } from '@/assets/icons/chat/clock.svg';
import { ReactComponent as CollectSvgFile } from '@/assets/icons/chat/collect.svg';
import { ReactComponent as CollectedSvgFile } from '@/assets/icons/chat/collected.svg';
import { ReactComponent as CopySvgFile } from '@/assets/icons/chat/copy.svg';
import { ReactComponent as DeepThinkingSvgFile } from '@/assets/icons/chat/deep_thinking.svg';
import { ReactComponent as HistorySvgFile } from '@/assets/icons/chat/history.svg';
import { ReactComponent as InfoSvgFile } from '@/assets/icons/chat/info.svg';
import { ReactComponent as NetworkSvgFile } from '@/assets/icons/chat/network.svg';
import { ReactComponent as SendSvgFile } from '@/assets/icons/chat/send.svg';
import { ReactComponent as ShareSvgFile } from '@/assets/icons/chat/share.svg';
import { ReactComponent as StopSvgFile } from '@/assets/icons/chat/stop.svg';
import { ReactComponent as XCircleFillSvgFile } from '@/assets/icons/chat/X circle-fill.svg';
import { ReactComponent as XCircleSvgFile } from '@/assets/icons/chat/X circle.svg';
import React from 'react';
import { wrapSvg } from './common';

const SendSvg = wrapSvg(SendSvgFile);
const NetworkSvg = wrapSvg(NetworkSvgFile);
const CopySvg = wrapSvg(CopySvgFile);
const StopSvg = wrapSvg(StopSvgFile);
const AddSvg = wrapSvg(AddSvgFile);
const ClearSvg = wrapSvg(ClearSvgFile);
const DeepThinkingSvg = wrapSvg(DeepThinkingSvgFile);
const ClockSvg = wrapSvg(ClockSvgFile);
const CollectSvg = wrapSvg(CollectSvgFile);
const CollectedSvg = wrapSvg(CollectedSvgFile);
const HistorySvg = wrapSvg(HistorySvgFile);
const InfoSvg = wrapSvg(InfoSvgFile);
const ShareSvg = wrapSvg(ShareSvgFile);
const XCircleFillSvg = wrapSvg(XCircleFillSvgFile);
const XCircleSvg = wrapSvg(XCircleSvgFile);

export default {
  'icons-chat-send': SendSvg,
  'icons-chat-network': NetworkSvg,
  'icons-chat-copy': CopySvg,
  'icons-chat-stop': StopSvg,
  'icons-chat-add': AddSvg,
  'icons-chat-clear': ClearSvg,
  'icons-chat-deep_thinking': DeepThinkingSvg,
  'icons-chat-clock': ClockSvg,
  'icons-chat-collect': CollectSvg,
  'icons-chat-collected': CollectedSvg,
  'icons-chat-history': HistorySvg,
  'icons-chat-info': InfoSvg,
  'icons-chat-share': ShareSvg,
  'icons-chat-x-circle-fill': XCircleFillSvg,
  'icons-chat-x-circle': XCircleSvg,
} as Record<string, React.FC>;
