import {
  ICON_CSS,
  ICON_DEFAULT,
  ICON_HTML,
  ICON_JS,
  ICON_JSON,
  ICON_MD,
  ICON_PNG,
  ICON_SQL,
  ICON_SVG,
  ICON_TS,
  ICON_TSX,
} from '@/constants/fileTreeImages.constants';

// 获取文件图标
export const getFileIcon = (name: string) => {
  if (name.startsWith('.')) {
    return <ICON_DEFAULT />;
  }

  // 代码文件
  if (name.endsWith('.ts')) {
    return <ICON_TS />;
  } else if (name.endsWith('.tsx') || name.endsWith('.jsx')) {
    return <ICON_TSX />;
  } else if (name.endsWith('.css')) {
    return <ICON_CSS />;
  } else if (
    name.endsWith('.json') ||
    name.endsWith('.yml') ||
    name.endsWith('.yaml')
  ) {
    return <ICON_JSON />;
  } else if (name.endsWith('.md')) {
    return <ICON_MD />;
  } else if (name.endsWith('.html') || name.endsWith('.htm')) {
    return <ICON_HTML />;
  } else if (name.endsWith('.js')) {
    return <ICON_JS />;
  } else if (
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.gif') ||
    name.endsWith('.bmp') ||
    name.endsWith('.webp') ||
    name.endsWith('.ico') ||
    name.endsWith('.tiff')
  ) {
    return <ICON_PNG />;
  } else if (name.endsWith('.svg')) {
    return <ICON_SVG />;
  } else if (name.endsWith('.sql')) {
    return <ICON_SQL />;
  } else {
    return <ICON_DEFAULT />;
  }
};
