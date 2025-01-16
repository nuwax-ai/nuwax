/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-01-16 17:43:16
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-01-16 18:53:41
 * @FilePath: \agent-platform-front\src\utils\flow.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import {
  ICON_END,
  ICON_NEW_AGENT,
  ICON_START,
} from '@/constants/images.constants';
import { ChildNode, Edge } from '@/types/interfaces/workflow';

// 递归获取节点的边
export const getEdges = (nodes: ChildNode[]): Edge[] => {
  return nodes
    .filter((node) => node.nextNodeIds && node.nextNodeIds.length > 0)
    .flatMap((node) =>
      (node.nextNodeIds || []).map(
        (id: number): Edge => ({
          source: node.id,
          target: id,
        }),
      ),
    );
};

// 根据type返回图片
export const returnImg = (type: string) => {
  switch (type) {
    case 'Start':
      return <ICON_START />;
    case 'End':
      return <ICON_END />;
    default:
      return <ICON_NEW_AGENT />;
  }
};

// 根据type返回背景色
export const returnBackgroundColor = (type: string) => {
  switch (type) {
    case 'Start':
      return '#EEEEFF';
    case 'End':
      return '#EEEEFF';
    default:
      return '#EEEEFF';
  }
};
