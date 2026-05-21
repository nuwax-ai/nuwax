/**
 * 颜色生成器
 */
import { CONTENT_COLORS, OBJECT_COLORS, ROOT_COLOR } from '../constants/colors';

let objectColorIndex = 0;
let contentColorIndex = 0;

/**
 * 生成节点颜色
 */
export function generateColor(type: 'root' | 'object' | 'content'): string {
  if (type === 'root') {
    return ROOT_COLOR;
  } else if (type === 'object') {
    const color = OBJECT_COLORS[objectColorIndex % OBJECT_COLORS.length];
    objectColorIndex++;
    return color;
  } else {
    const color = CONTENT_COLORS[contentColorIndex % CONTENT_COLORS.length];
    contentColorIndex++;
    return color;
  }
}

/**
 * 重置颜色索引
 */
export function resetColorIndex(): void {
  objectColorIndex = 0;
  contentColorIndex = 0;
}
