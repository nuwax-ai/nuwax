import { ReactComponent as DebugSvgFile } from '@/assets/icons/common/debug.svg';
import { ReactComponent as MoreSvgFile } from '@/assets/icons/common/more.svg';
import { ReactComponent as StarsSvgFile } from '@/assets/icons/common/stars.svg';
import React from 'react';
import { wrapSvg } from './utils';

const MoreSvg = wrapSvg(MoreSvgFile);
const StarsSvg = wrapSvg(StarsSvgFile);
const DebugSvg = wrapSvg(DebugSvgFile);
export default {
  'icons-common-more': MoreSvg,
  'icons-common-stars': StarsSvg,
  'icons-common-debug': DebugSvg,
} as Record<string, React.FC>;
