// 静态分享页与 React 预览共用解析、预算和页序校验，渲染器入口由构建脚本锁定。
export { init } from 'pptx-preview';
export {
  DEFAULT_PPTX_PACKAGE_LIMITS,
  preparePptxForPreview,
} from './pptxPackage';
export { validateAndOrderPptxSlides } from './pptxSlideValidation';
