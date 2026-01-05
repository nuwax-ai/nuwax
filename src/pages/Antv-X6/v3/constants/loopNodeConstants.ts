/**
 * 循环节点相关常量
 * 统一管理循环节点的默认尺寸和内部节点偏移
 */

// 循环节点默认尺寸
export const LOOP_NODE_DEFAULT_WIDTH = 860;
export const LOOP_NODE_DEFAULT_HEIGHT = 240;

// 循环节点内部子节点偏移量
// 用于确保 LoopStart 和 LoopEnd 节点在循环容器内部
// 基于 Loop 860x240, LoopStart/End 220x44 计算
// Gap = 40
export const LOOP_START_NODE_X_OFFSET = 40; // 相对于循环节点左边的水平偏移
export const LOOP_END_NODE_X_OFFSET = 600; // 860 - 220 - 40 = 600
// 垂直居中: (240 - 44) / 2 = 98
export const LOOP_INNER_NODE_Y_OFFSET = 98; // 相对于循环节点顶部的垂直偏移
