import { ReactComponent as AddSvgFile } from '@/assets/icons/chat/add.svg';
import { ReactComponent as ChatSvgFile } from '@/assets/icons/chat/chat.svg';
import { ReactComponent as ClearSvgFile } from '@/assets/icons/chat/clear.svg';
import { ReactComponent as ClockSvgFile } from '@/assets/icons/chat/clock.svg';
import { ReactComponent as CloseSvgFile } from '@/assets/icons/chat/close.svg';
import { ReactComponent as CloseFillSvgFile } from '@/assets/icons/chat/close_fill.svg';
import { ReactComponent as CloseRegularSvgFile } from '@/assets/icons/chat/close_regular.svg';
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
import { ReactComponent as UserSvgFile } from '@/assets/icons/chat/user.svg';
import React from 'react';
import { wrapSvg } from './utils';

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
const CloseFillSvg = wrapSvg(CloseFillSvgFile);
const CloseSvg = wrapSvg(CloseSvgFile);
const UserSvg = wrapSvg(UserSvgFile);
const ChatSvg = wrapSvg(ChatSvgFile);
const CloseRegularSvg = wrapSvg(CloseRegularSvgFile);

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
  'icons-chat-close-fill': CloseFillSvg,
  'icons-chat-close': CloseSvg,
  'icons-chat-user': UserSvg,
  'icons-chat-chat': ChatSvg,
  'icons-chat-close_regular': CloseRegularSvg,
} as Record<string, React.FC>;
