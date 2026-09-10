// 类型已下沉共享层 @/types/interfaces/userProject（分层红线：非页面层禁止依赖 @/pages/**）；
// 此处再导出保持页面内既有 ../type 引用不变，新消费方请直接引共享模块。
export * from '@/types/interfaces/userProject';
