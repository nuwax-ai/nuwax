import { ReactComponent as AddSvgFile } from '@/assets/icons/chat/add.svg';
import { ReactComponent as ClearSvgFile } from '@/assets/icons/chat/clear.svg';
import { ReactComponent as CopySvgFile } from '@/assets/icons/chat/copy.svg';
import { ReactComponent as DeepThinkingSvgFile } from '@/assets/icons/chat/deep_thinking.svg';
import { ReactComponent as NetworkSvgFile } from '@/assets/icons/chat/network.svg';
import { ReactComponent as SendSvgFile } from '@/assets/icons/chat/send.svg';
import { ReactComponent as StopSvgFile } from '@/assets/icons/chat/stop.svg';
import React from 'react';
import { wrapSvg } from './common';

const SendSvg = wrapSvg(SendSvgFile);
const NetworkSvg = wrapSvg(NetworkSvgFile);
const CopySvg = wrapSvg(CopySvgFile);
const StopSvg = wrapSvg(StopSvgFile);
const AddSvg = wrapSvg(AddSvgFile);
const ClearSvg = wrapSvg(ClearSvgFile);
const DeepThinkingSvg = wrapSvg(DeepThinkingSvgFile);

export default {
  'icons-chat-send': SendSvg,
  'icons-chat-network': NetworkSvg,
  'icons-chat-copy': CopySvg,
  'icons-chat-stop': StopSvg,
  'icons-chat-add': AddSvg,
  'icons-chat-clear': ClearSvg,
  'icons-chat-deep_thinking': DeepThinkingSvg,
} as Record<string, React.FC>;
