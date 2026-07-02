/**
 * 功能开关常量
 * 用于临时启用/关闭尚未全量发布或需快速回滚的能力
 */

/** 聊天消息队列：待发送面板、入队拦截、空闲自动消费 */
export const ENABLE_CHAT_MESSAGE_QUEUE = true;

/**
 * 语音输入：在聊天输入框工具栏提供“录音 -> 识别 -> 自动发送”能力。
 * 默认开启；需整体下线该功能时改为 false 即可——<VoiceInputSlot/> 会渲染 null，
 * 业务文件无需任何回改（可插拔）。
 */
export const ENABLE_VOICE_INPUT = true;
