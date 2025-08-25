import { ReactComponent as ArrowDownSvgFile } from '@/assets/icons/common/arrow_down.svg';
import { ReactComponent as ArrowLeftSvgFile } from '@/assets/icons/common/arrow_left.svg';
import { ReactComponent as ArrowRightSvgFile } from '@/assets/icons/common/arrow_right.svg';
import { ReactComponent as ArrowUpSvgFile } from '@/assets/icons/common/arrow_up.svg';
import { ReactComponent as DebugSvgFile } from '@/assets/icons/common/debug.svg';
import { ReactComponent as MoreSvgFile } from '@/assets/icons/common/more.svg';
import { ReactComponent as StarsSvgFile } from '@/assets/icons/common/stars.svg';
import React from 'react';
import { wrapSvg } from './utils';

const ArrowDownSvg = wrapSvg(ArrowDownSvgFile);
const ArrowLeftSvg = wrapSvg(ArrowLeftSvgFile);
const ArrowRightSvg = wrapSvg(ArrowRightSvgFile);
const ArrowUpSvg = wrapSvg(ArrowUpSvgFile);
const MoreSvg = wrapSvg(MoreSvgFile);
const StarsSvg = wrapSvg(StarsSvgFile);
const DebugSvg = wrapSvg(DebugSvgFile);
export default {
  'icons-common-caret_down': ArrowDownSvg,
  'icons-common-caret_up': ArrowUpSvg,
  'icons-common-caret_right': ArrowRightSvg,
  'icons-common-caret_left': ArrowLeftSvg,
  'icons-common-more': MoreSvg,
  'icons-common-stars': StarsSvg,
  'icons-common-debug': DebugSvg,
} as Record<string, React.FC>;
