/**
 * xterm 统一静态入口，避免生产分包后出现多份 @xterm/xterm 导致 class 继承链断裂
 */
export { FitAddon } from '@xterm/addon-fit';
export { Terminal } from '@xterm/xterm';
