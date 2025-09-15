import { ReactComponent as CaretDownSvgFile } from '@/assets/icons/common/caret_down.svg';
import { ReactComponent as CaretLeftSvgFile } from '@/assets/icons/common/caret_left.svg';
import { ReactComponent as CaretRightSvgFile } from '@/assets/icons/common/caret_right.svg';
import { ReactComponent as CaretUpSvgFile } from '@/assets/icons/common/caret_up.svg';
import { ReactComponent as DebugSvgFile } from '@/assets/icons/common/debug.svg';
import { ReactComponent as DeleteSvgFile } from '@/assets/icons/common/delete.svg';
import { ReactComponent as EditSvgFile } from '@/assets/icons/common/edit.svg';
import { ReactComponent as MoreSvgFile } from '@/assets/icons/common/more.svg';
import { ReactComponent as PlusSvgFile } from '@/assets/icons/common/plus.svg';
import { ReactComponent as StarsSvgFile } from '@/assets/icons/common/stars.svg';
import { ReactComponent as StrawSvgFile } from '@/assets/icons/common/straw.svg';
import React from 'react';
import { wrapSvg } from './utils';

const CaretDownSvg = wrapSvg(CaretDownSvgFile);
const CaretLeftSvg = wrapSvg(CaretLeftSvgFile);
const CaretRightSvg = wrapSvg(CaretRightSvgFile);
const CaretUpSvg = wrapSvg(CaretUpSvgFile);
const MoreSvg = wrapSvg(MoreSvgFile);
const StarsSvg = wrapSvg(StarsSvgFile);
const DebugSvg = wrapSvg(DebugSvgFile);
const PlusSvg = wrapSvg(PlusSvgFile);
const StrawSvg = wrapSvg(StrawSvgFile);
const DeleteSvg = wrapSvg(DeleteSvgFile);
const EditSvg = wrapSvg(EditSvgFile);

export default {
  'icons-common-caret_down': CaretDownSvg,
  'icons-common-caret_up': CaretUpSvg,
  'icons-common-caret_right': CaretRightSvg,
  'icons-common-caret_left': CaretLeftSvg,
  'icons-common-more': MoreSvg,
  'icons-common-stars': StarsSvg,
  'icons-common-debug': DebugSvg,
  'icons-common-plus': PlusSvg,
  'icons-common-straw': StrawSvg,
  'icons-common-delete': DeleteSvg,
  'icons-common-edit': EditSvg,
} as Record<string, React.FC>;
