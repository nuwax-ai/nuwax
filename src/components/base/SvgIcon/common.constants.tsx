import { ReactComponent as AttachmentsSvgFile } from '@/assets/icons/common/attachments.svg';
import { ReactComponent as BookSvgFile } from '@/assets/icons/common/book.svg';
import { ReactComponent as CaretDownSvgFile } from '@/assets/icons/common/caret_down.svg';
import { ReactComponent as CaretLeftSvgFile } from '@/assets/icons/common/caret_left.svg';
import { ReactComponent as CaretRightSvgFile } from '@/assets/icons/common/caret_right.svg';
import { ReactComponent as CaretUpSvgFile } from '@/assets/icons/common/caret_up.svg';
import { ReactComponent as CodeSvgFile } from '@/assets/icons/common/code.svg';
import { ReactComponent as ConsoleSvgFile } from '@/assets/icons/common/console.svg';
import { ReactComponent as DebugSvgFile } from '@/assets/icons/common/debug.svg';
import { ReactComponent as DeleteSvgFile } from '@/assets/icons/common/delete.svg';
import { ReactComponent as DownloadSvgFile } from '@/assets/icons/common/download.svg';
import { ReactComponent as EditSvgFile } from '@/assets/icons/common/edit.svg';
import { ReactComponent as ExportSvgFile } from '@/assets/icons/common/export.svg';
import { ReactComponent as FullscreenSvgFile } from '@/assets/icons/common/fullscreen.svg';
import { ReactComponent as ImportSvgFile } from '@/assets/icons/common/import.svg';
import { ReactComponent as MoreSvgFile } from '@/assets/icons/common/more.svg';
import { ReactComponent as PlusSvgFile } from '@/assets/icons/common/plus.svg';
import { ReactComponent as PreviewSvgFile } from '@/assets/icons/common/preview.svg';
import { ReactComponent as RefreshSvgFile } from '@/assets/icons/common/refresh.svg';
import { ReactComponent as RestartSvgFile } from '@/assets/icons/common/restart.svg';
import { ReactComponent as SketchSvgFile } from '@/assets/icons/common/sketch.svg';
import { ReactComponent as StarsSvgFile } from '@/assets/icons/common/stars.svg';
import { ReactComponent as StrawSvgFile } from '@/assets/icons/common/straw.svg';
import { ReactComponent as UploadSvgFile } from '@/assets/icons/common/upload.svg';
import React from 'react';
import { wrapSvg } from './utils';

const AttachmentsSvg = wrapSvg(AttachmentsSvgFile);
const BookSvg = wrapSvg(BookSvgFile);
const CaretDownSvg = wrapSvg(CaretDownSvgFile);
const CaretLeftSvg = wrapSvg(CaretLeftSvgFile);
const CaretRightSvg = wrapSvg(CaretRightSvgFile);
const CaretUpSvg = wrapSvg(CaretUpSvgFile);
const CodeSvg = wrapSvg(CodeSvgFile);
const ConsoleSvg = wrapSvg(ConsoleSvgFile);
const DebugSvg = wrapSvg(DebugSvgFile);
const DeleteSvg = wrapSvg(DeleteSvgFile);
const DownloadSvg = wrapSvg(DownloadSvgFile);
const EditSvg = wrapSvg(EditSvgFile);
const ExportSvg = wrapSvg(ExportSvgFile);
const FullscreenSvg = wrapSvg(FullscreenSvgFile);
const ImportSvg = wrapSvg(ImportSvgFile);
const MoreSvg = wrapSvg(MoreSvgFile);
const PlusSvg = wrapSvg(PlusSvgFile);
const PreviewSvg = wrapSvg(PreviewSvgFile);
const RefreshSvg = wrapSvg(RefreshSvgFile);
const RestartSvg = wrapSvg(RestartSvgFile);
const SketchSvg = wrapSvg(SketchSvgFile);
const StarsSvg = wrapSvg(StarsSvgFile);
const StrawSvg = wrapSvg(StrawSvgFile);
const UploadSvg = wrapSvg(UploadSvgFile);

export default {
  'icons-common-attachments': AttachmentsSvg,
  'icons-common-book': BookSvg,
  'icons-common-caret_down': CaretDownSvg,
  'icons-common-caret_up': CaretUpSvg,
  'icons-common-caret_right': CaretRightSvg,
  'icons-common-caret_left': CaretLeftSvg,
  'icons-common-code': CodeSvg,
  'icons-common-console': ConsoleSvg,
  'icons-common-debug': DebugSvg,
  'icons-common-delete': DeleteSvg,
  'icons-common-download': DownloadSvg,
  'icons-common-edit': EditSvg,
  'icons-common-export': ExportSvg,
  'icons-common-fullscreen': FullscreenSvg,
  'icons-common-import': ImportSvg,
  'icons-common-more': MoreSvg,
  'icons-common-plus': PlusSvg,
  'icons-common-preview': PreviewSvg,
  'icons-common-refresh': RefreshSvg,
  'icons-common-restart': RestartSvg,
  'icons-common-sketch': SketchSvg,
  'icons-common-stars': StarsSvg,
  'icons-common-straw': StrawSvg,
  'icons-common-upload': UploadSvg,
} as Record<string, React.FC>;
