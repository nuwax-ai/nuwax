# 多语言治理全量扫描报告（SAAS 2026-04-10）

- 生成时间：2026-04-02T04:41:14.373Z
- 扫描范围：src/pages, src/components, src/layouts, src/hooks, src/models, src/services
- 规则：hardcoded 中文字符串 / legacy `System.*` key / invalid `dict()` key 格式

## 汇总

- 总问题数：255
- hardcoded 中文：255
- legacy System key：0
- invalid dict key：0

## 按模块统计

| 模块 | hardcoded 中文 | legacyKey | invalidKey | 总计 |
| --- | --: | --: | --: | --: |
| src/hooks | 56 | 0 | 0 | 56 |
| src/models | 34 | 0 | 0 | 34 |
| src/pages/SpaceDevelop | 11 | 0 | 0 | 11 |
| src/components/FileTreeView | 11 | 0 | 0 | 11 |
| src/components/AliyunCaptcha | 10 | 0 | 0 | 10 |
| src/pages/EditAgent | 9 | 0 | 0 | 9 |
| src/pages/SpaceKnowledge | 8 | 0 | 0 | 8 |
| src/components/TestRun | 8 | 0 | 0 | 8 |
| src/pages/Login | 7 | 0 | 0 | 7 |
| src/layouts/DynamicMenusLayout | 7 | 0 | 0 | 7 |
| src/components/MarkdownCustomProcess | 6 | 0 | 0 | 6 |
| src/components/TiptapVariableInput | 6 | 0 | 0 | 6 |
| src/layouts/Setting | 6 | 0 | 0 | 6 |
| src/components/CodeViewer | 5 | 0 | 0 | 5 |
| src/components/MarkdownRenderer | 5 | 0 | 0 | 5 |
| src/components/SelectComponent | 5 | 0 | 0 | 5 |
| src/pages/IMChannel | 4 | 0 | 0 | 4 |
| src/pages/MorePage | 4 | 0 | 0 | 4 |
| src/layouts/Message | 4 | 0 | 0 | 4 |
| src/pages/EcosystemPlugin | 3 | 0 | 0 | 3 |
| src/pages/EcosystemTemplate | 3 | 0 | 0 | 3 |
| src/pages/Home | 3 | 0 | 0 | 3 |
| src/pages/SpaceSkillManage | 3 | 0 | 0 | 3 |
| src/pages/SpaceTable | 3 | 0 | 0 | 3 |
| src/components/CreateAgent | 3 | 0 | 0 | 3 |
| src/components/EcosystemDetailDrawer | 3 | 0 | 0 | 3 |
| src/components/base | 3 | 0 | 0 | 3 |
| src/pages/SpaceMcpCreate | 2 | 0 | 0 | 2 |
| src/components/AgentSidebar | 2 | 0 | 0 | 2 |
| src/components/ComputerTypeSelector | 2 | 0 | 0 | 2 |
| src/components/ProComponents | 2 | 0 | 0 | 2 |
| src/components/PublishComponentModal | 2 | 0 | 0 | 2 |
| src/pages/ChatTemp | 1 | 0 | 0 | 1 |
| src/pages/Index | 1 | 0 | 0 | 1 |
| src/pages/PublishAudit | 1 | 0 | 0 | 1 |
| src/pages/PublishedManage | 1 | 0 | 0 | 1 |
| src/pages/SpaceLibrary | 1 | 0 | 0 | 1 |
| src/pages/SpaceLibraryLog | 1 | 0 | 0 | 1 |
| src/pages/SpacePageDevelop | 1 | 0 | 0 | 1 |
| src/pages/SpaceTaskCenter | 1 | 0 | 0 | 1 |
| src/pages/Square | 1 | 0 | 0 | 1 |
| src/components/ChatInputHome | 1 | 0 | 0 | 1 |
| src/components/ChatView | 1 | 0 | 0 | 1 |
| src/components/EcosystemShareModal | 1 | 0 | 0 | 1 |
| src/components/NoMoreDivider | 1 | 0 | 0 | 1 |
| src/components/Skill | 1 | 0 | 0 | 1 |
| src/layouts/HoverMenu | 1 | 0 | 0 | 1 |

## src/hooks

- [hardcoded_chinese] src/hooks/useEventPolling.ts:121 -> `跳过重复的事件处理`
- [hardcoded_chinese] src/hooks/useEventPolling.ts:141 -> `处理事件时出错:`
- [hardcoded_chinese] src/hooks/useExclusivePanels.ts:57 -> `[ExclusivePanels] PagePreview 打开，关闭其他面板`
- [hardcoded_chinese] src/hooks/useExclusivePanels.ts:72 -> `[ExclusivePanels] AgentSidebar 打开，关闭 PagePreview`
- [hardcoded_chinese] src/hooks/useExclusivePanels.ts:78 -> `[ExclusivePanels] ShowArea 打开，关闭 PagePreview`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:46 -> `或`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:116 -> `用户已空闲`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:208 -> `⏸️ 暂停空闲检测`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:217 -> `▶️ 恢复空闲检测`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:265 -> `⚠️ 无法访问 iframe（可能是跨域）`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:281 -> `🚫 空闲检测未启用`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:291 -> `⏸️ 空闲检测已暂停，跳过事件监听器设置`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:296 -> `✅ 空闲检测已启用`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:315 -> `🧹 清理空闲检测事件监听器`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:338 -> `🖥️ 检测到 iframe 内用户活动`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:352 -> `🔗 绑定 iframe 事件监听器`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:369 -> `🔍 扫描 iframe`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:409 -> `🔄 检测到新 iframe，重新扫描`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:431 -> `🧹 清理 iframe 事件监听器`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:449 -> `👁️ 页面切出，暂停空闲计时器`
- [hardcoded_chinese] src/hooks/useIdleDetection.ts:453 -> `👁️ 页面切回，重置空闲计时器`
- [hardcoded_chinese] src/hooks/useMessageEventDelegate.ts:55 -> `[Event Delegate] 触发事件:`
- [hardcoded_chinese] src/hooks/useMessageEventDelegate.ts:62 -> `[Event Delegate] 数据解析失败:`
- [hardcoded_chinese] src/hooks/useMessageEventDelegate.ts:72 -> `[Event Delegate] 未找到事件配置: ${eventType}`
- [hardcoded_chinese] src/hooks/useMessageEventDelegate.ts:76 -> `[Event Delegate] 找到事件配置:`
- [hardcoded_chinese] src/hooks/useMessageEventDelegate.ts:112 -> `[Event Delegate] 打开页面:`
- [hardcoded_chinese] src/hooks/useMessageEventDelegate.ts:144 -> `[Event Delegate] 打开外链:`
- [hardcoded_chinese] src/hooks/useMessageEventDelegate.ts:150 -> `[Event Delegate] 未知的事件类型: ${eventConfig.type}`
- [hardcoded_chinese] src/hooks/useMessageEventDelegate.ts:183 -> `[Event Delegate] 缺少必要的属性:`
- [hardcoded_chinese] src/hooks/useMessageEventDelegate.ts:194 -> `[Event Delegate] 事件代理已初始化`
- [hardcoded_chinese] src/hooks/useMessageEventDelegate.ts:199 -> `[Event Delegate] 事件代理已清理`
- [hardcoded_chinese] src/hooks/useModifiedSaveUpdate.ts:33 -> `🔄 useModifiedSaveUpdate: 节流执行保存 [第${currentSaveCount}次]`
- [hardcoded_chinese] src/hooks/useModifiedSaveUpdate.ts:43 -> `⏸️ useModifiedSaveUpdate: 保存正在进行中，跳过本次调用`
- [hardcoded_chinese] src/hooks/useModifiedSaveUpdate.ts:49 -> `✅ useModifiedSaveUpdate: 开始执行保存操作`
- [hardcoded_chinese] src/hooks/useModifiedSaveUpdate.ts:55 -> `🎉 useModifiedSaveUpdate: 保存成功完成`
- [hardcoded_chinese] src/hooks/useModifiedSaveUpdate.ts:57 -> `❌ useModifiedSaveUpdate: 保存失败`
- [hardcoded_chinese] src/hooks/useModifiedSaveUpdate.ts:67 -> `🚀 useModifiedSaveUpdate: 节流函数被调用`
- [hardcoded_chinese] src/hooks/useModifiedSaveUpdate.ts:79 -> `📝 useModifiedSaveUpdate: isModified 状态变化 =`
- [hardcoded_chinese] src/hooks/useModifiedSaveUpdate.ts:82 -> `⚡ useModifiedSaveUpdate: 触发节流保存函数`
- [hardcoded_chinese] src/hooks/useModifiedSaveUpdate.ts:91 -> `🔗 useModifiedSaveUpdate: Hook 初始化完成`
- [hardcoded_chinese] src/hooks/useModifiedSaveUpdate.ts:94 -> `🧹 useModifiedSaveUpdate: 清理 Hook 状态`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:12 -> `确认`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:12 -> `放弃`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:12 -> `取消`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:20 -> `你有未保存的更改`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:29 -> `保存并离开`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:30 -> `不保存离开`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:52 -> `确认`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:52 -> `确认`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:54 -> `放弃`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:54 -> `放弃`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:56 -> `取消`
- [hardcoded_chinese] src/hooks/useNavigationGuard.tsx:56 -> `取消`
- [hardcoded_chinese] src/hooks/useScrollSync.ts:80 -> `🎯 标签点击：导航到 ${type}`
- [hardcoded_chinese] src/hooks/useScrollSync.ts:146 -> `🔄 滚动同步：自动切换到标签 ${targetActive}`
- [hardcoded_chinese] src/hooks/useUnifiedTheme.ts:117 -> `主题更新失败:`

## src/models

- [hardcoded_chinese] src/models/autoErrorHandling.ts:98 -> `[AutoErrorHandling] 📊 记录自动处理: 会话次数=${newCount}, 总次数=${newTotalCount}`
- [hardcoded_chinese] src/models/autoErrorHandling.ts:136 -> `[AutoErrorHandling] 🔄 重置会话计数`
- [hardcoded_chinese] src/models/autoErrorHandling.ts:149 -> `启用`
- [hardcoded_chinese] src/models/autoErrorHandling.ts:149 -> `禁用`
- [hardcoded_chinese] src/models/autoErrorHandling.ts:170 -> `[AutoErrorHandling] 📊 自动重试次数: ${newCount}`
- [hardcoded_chinese] src/models/autoErrorHandling.ts:189 -> `[AutoErrorHandling] 🔄 重置自动重试计数`
- [hardcoded_chinese] src/models/autoErrorHandling.ts:234 -> `[AutoErrorHandling] 🔄 重置并启用自动处理`
- [hardcoded_chinese] src/models/autoErrorHandling.ts:245 -> `[AutoErrorHandling] ❌ 用户取消自动处理`
- [hardcoded_chinese] src/models/autoErrorHandling.ts:258 -> `启用`
- [hardcoded_chinese] src/models/autoErrorHandling.ts:258 -> `禁用`
- [hardcoded_chinese] src/models/autoErrorHandling.ts:268 -> `[AutoErrorHandling] 🔄 重置所有状态`
- [hardcoded_chinese] src/models/conversationInfo.ts:314 -> `[keepalive] 页面可见，调用 apiEnsurePod 确保容器运行`
- [hardcoded_chinese] src/models/conversationInfo.ts:317 -> `[keepalive] apiEnsurePod 失败:`
- [hardcoded_chinese] src/models/conversationInfo.ts:339 -> `打开远程桌面视图失败`
- [hardcoded_chinese] src/models/conversationInfo.ts:509 -> `更新会话主题失败:`
- [hardcoded_chinese] src/models/conversationInfo.ts:630 -> `加载更多消息失败:`
- [hardcoded_chinese] src/models/conversationInfo.ts:678 -> `问答`
- [hardcoded_chinese] src/models/conversationInfo.ts:1003 -> `Agent正在执行任务，请等待当前任务完成后再发送新请求`
- [hardcoded_chinese] src/models/conversationInfo.ts:1006 -> `正在执行任务`
- [hardcoded_chinese] src/models/conversationInfo.ts:1007 -> `正在执行任务`
- [hardcoded_chinese] src/models/conversationInfo.ts:1039 -> `用户主动取消任务`
- [hardcoded_chinese] src/models/menuModel.ts:98 -> `加载菜单数据失败:`
- [hardcoded_chinese] src/models/spaceAgent.ts:29 -> `保存成功`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:24 -> `租户配置接口返回空数据`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:25 -> `租户配置为空`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:54 -> `租户配置保存完成，重新初始化统一主题服务`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:77 -> `已同步租户主题配置（本地无配置）:`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:79 -> `同步租户主题颜色失败:`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:82 -> `检测到本地主题配置，跳过租户配置同步`
- [hardcoded_chinese] src/models/tenantConfigInfo.ts:90 -> `租户信息接口失败`
- [hardcoded_chinese] src/models/userInfo.ts:31 -> `获取用户信息失败:`
- [hardcoded_chinese] src/models/userInfo.ts:54 -> `刷新用户信息失败:`
- [hardcoded_chinese] src/models/userInfo.ts:70 -> `更新用户信息失败:`
- [hardcoded_chinese] src/models/workflowV3.ts:4 -> `) 代替 useModel(`

## src/pages/SpaceDevelop

- [hardcoded_chinese] src/pages/SpaceDevelop/ApplicationItem/index.tsx:39 -> `收藏成功`
- [hardcoded_chinese] src/pages/SpaceDevelop/ApplicationItem/index.tsx:98 -> `无此资源权限`
- [hardcoded_chinese] src/pages/SpaceDevelop/ApplicationItem/index.tsx:107 -> `无此资源权限`
- [hardcoded_chinese] src/pages/SpaceDevelop/ApplicationItem/index.tsx:116 -> `无此资源权限`
- [hardcoded_chinese] src/pages/SpaceDevelop/ApplicationItem/index.tsx:125 -> `无此资源权限`
- [hardcoded_chinese] src/pages/SpaceDevelop/ApplicationItem/index.tsx:134 -> `无此资源权限`
- [hardcoded_chinese] src/pages/SpaceDevelop/ApplicationItem/index.tsx:143 -> `无此资源权限`
- [hardcoded_chinese] src/pages/SpaceDevelop/ApplicationItem/index.tsx:234 -> `无此资源权限`
- [hardcoded_chinese] src/pages/SpaceDevelop/CreateTempChatModal/CopyChatWidgetCode/index.tsx:44 -> `复制代码`
- [hardcoded_chinese] src/pages/SpaceDevelop/CreateTempChatModal/CopyChatWidgetCode/index.tsx:46 -> `复制代码`
- [hardcoded_chinese] src/pages/SpaceDevelop/CreateTempChatModal/CopyChatWidgetCode/index.tsx:47 -> `，默认`

## src/components/FileTreeView

- [hardcoded_chinese] src/components/FileTreeView/FilePathHeader/ShareDesktopModal/index.tsx:108 -> `永久`
- [hardcoded_chinese] src/components/FileTreeView/FilePathHeader/ShareDesktopModal/index.tsx:112 -> `永久`
- [hardcoded_chinese] src/components/FileTreeView/FilePathHeader/ShareDesktopModal/index.tsx:186 -> `分享远程桌面失败:`
- [hardcoded_chinese] src/components/FileTreeView/FilePathHeader/ShareDesktopModal/index.tsx:227 -> `分享文件失败:`
- [hardcoded_chinese] src/components/FileTreeView/FileTree/index.tsx:134 -> `重命名失败:`
- [hardcoded_chinese] src/components/FileTreeView/index.tsx:311 -> `刷新文件内容失败: `
- [hardcoded_chinese] src/components/FileTreeView/index.tsx:316 -> `刷新文件树失败: `
- [hardcoded_chinese] src/components/FileTreeView/index.tsx:429 -> `/api/computer/static/1464425/国际财经分析报告_20241222.md`
- [hardcoded_chinese] src/components/FileTreeView/index.tsx:888 -> `上传文件失败`
- [hardcoded_chinese] src/components/FileTreeView/index.tsx:1184 -> `切换预览模式时刷新文件内容失败: `
- [hardcoded_chinese] src/components/FileTreeView/index.tsx:1284 -> `下载文件失败`

## src/components/AliyunCaptcha

- [hardcoded_chinese] src/components/AliyunCaptcha/index.tsx:69 -> `[AliyunCaptcha] 验证参数生成:`
- [hardcoded_chinese] src/components/AliyunCaptcha/index.tsx:89 -> `[AliyunCaptcha] 消费 Token:`
- [hardcoded_chinese] src/components/AliyunCaptcha/index.tsx:97 -> `[AliyunCaptcha] 刷新实例以重置状态`
- [hardcoded_chinese] src/components/AliyunCaptcha/index.tsx:107 -> `[AliyunCaptcha] 清理资源`
- [hardcoded_chinese] src/components/AliyunCaptcha/index.tsx:116 -> `[AliyunCaptcha] 销毁实例`
- [hardcoded_chinese] src/components/AliyunCaptcha/index.tsx:124 -> `[AliyunCaptcha] 获取实例:`
- [hardcoded_chinese] src/components/AliyunCaptcha/index.tsx:133 -> `[AliyunCaptcha] 组件挂载`
- [hardcoded_chinese] src/components/AliyunCaptcha/index.tsx:145 -> `[AliyunCaptcha] 实例已存在，跳过初始化`
- [hardcoded_chinese] src/components/AliyunCaptcha/index.tsx:148 -> `[AliyunCaptcha] 初始化 SDK...`
- [hardcoded_chinese] src/components/AliyunCaptcha/index.tsx:175 -> `验证码初始化完成，onReady已调用`

## src/pages/EditAgent

- [hardcoded_chinese] src/pages/EditAgent/PreviewAndDebug/index.tsx:319 -> `重置`
- [hardcoded_chinese] src/pages/EditAgent/SystemTipsWord/index.tsx:88 -> `replaceText 方法不存在`
- [hardcoded_chinese] src/pages/EditAgent/index.tsx:363 -> `[EditAgent] 配置信息尚未加载，跳过更新:`
- [hardcoded_chinese] src/pages/EditAgent/index.tsx:381 -> `[EditAgent] 数组值无变化，跳过API调用:`
- [hardcoded_chinese] src/pages/EditAgent/index.tsx:389 -> `[EditAgent] 布尔值无变化，跳过API调用:`
- [hardcoded_chinese] src/pages/EditAgent/index.tsx:397 -> `[EditAgent] 数字值无变化，跳过API调用:`
- [hardcoded_chinese] src/pages/EditAgent/index.tsx:642 -> `删除文件失败:`
- [hardcoded_chinese] src/pages/EditAgent/index.tsx:759 -> `上传失败`
- [hardcoded_chinese] src/pages/EditAgent/index.tsx:787 -> `导出项目失败:`

## src/pages/SpaceKnowledge

- [hardcoded_chinese] src/pages/SpaceKnowledge/DocWrap/DocItem/index.tsx:64 -> `构建中`
- [hardcoded_chinese] src/pages/SpaceKnowledge/LocalCustomDocModal/index.tsx:217 -> `分段标识符`
- [hardcoded_chinese] src/pages/SpaceKnowledge/LocalCustomDocModal/index.tsx:223 -> `分段标识符`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaBatchModal/index.tsx:83 -> `上传文件出错:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/QaModal/index.tsx:40 -> `表单验证失败:`
- [hardcoded_chinese] src/pages/SpaceKnowledge/RawSegmentInfo/RawSegmentEditModal/index.tsx:61 -> `分段内容不能超过2000个字符`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:399 -> `QA问答更新失败`
- [hardcoded_chinese] src/pages/SpaceKnowledge/index.tsx:399 -> `添加QA问答失败`

## src/components/TestRun

- [hardcoded_chinese] src/components/TestRun/InputBox.tsx:46 -> `上传文件信息:`
- [hardcoded_chinese] src/components/TestRun/InputBox.tsx:53 -> `文件上传失败:`
- [hardcoded_chinese] src/components/TestRun/InputBox.tsx:73 -> `处理后的文件信息:`
- [hardcoded_chinese] src/components/TestRun/InputBox.tsx:76 -> `最终文件列表:`
- [hardcoded_chinese] src/components/TestRun/index.tsx:63 -> `角色陪伴-苏瑶`
- [hardcoded_chinese] src/components/TestRun/index.tsx:64 -> `智慧家具管家`
- [hardcoded_chinese] src/components/TestRun/index.tsx:253 -> `JSON 解析失败:`
- [hardcoded_chinese] src/components/TestRun/index.tsx:282 -> `JSON 解析失败:`

## src/pages/Login

- [hardcoded_chinese] src/pages/Login/ModalSliderCaptcha/index.tsx:50 -> `临时签名`
- [hardcoded_chinese] src/pages/Login/ModalSliderCaptcha/index.tsx:51 -> `临时token`
- [hardcoded_chinese] src/pages/Login/ModalSliderCaptcha/index.tsx:54 -> `验证码验证参数:`
- [hardcoded_chinese] src/pages/Login/index.tsx:150 -> `[Login] 密码登录使用验证码参数:`
- [hardcoded_chinese] src/pages/Login/index.tsx:158 -> `[Login] 验证码登录使用验证码参数:`
- [hardcoded_chinese] src/pages/Login/index.tsx:173 -> `[Login] 验证码验证成功回调:`
- [hardcoded_chinese] src/pages/Login/index.tsx:192 -> `[Login] 执行登录检查:`

## src/layouts/DynamicMenusLayout

- [hardcoded_chinese] src/layouts/DynamicMenusLayout/DynamicSecondMenu/index.tsx:600 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/DynamicSecondMenu/index.tsx:600 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/SpaceTitle/PersonalSpaceContent/index.tsx:92 -> `智能体开发`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/SpaceTitle/PersonalSpaceContent/index.tsx:97 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/SpaceTitle/PersonalSpaceContent/index.tsx:97 -> `成员与设置`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/SpaceSection/index.tsx:110 -> `工作空间智能体`
- [hardcoded_chinese] src/layouts/DynamicMenusLayout/index.tsx:579 -> `和 动态菜单的`

## src/components/MarkdownCustomProcess

- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:115 -> `暂无数据`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:168 -> `页面预览`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:278 -> `暂无数据`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:284 -> `数据格式错误`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:292 -> `页面路径不存在`
- [hardcoded_chinese] src/components/MarkdownCustomProcess/index.tsx:415 -> `复制`

## src/components/TiptapVariableInput

- [hardcoded_chinese] src/components/TiptapVariableInput/extensions/VariableSuggestion.tsx:20 -> `，默认 `
- [hardcoded_chinese] src/components/TiptapVariableInput/extensions/VariableSuggestion.tsx:95 -> `之前遇到了`
- [hardcoded_chinese] src/components/TiptapVariableInput/types.ts:105 -> `，默认 `
- [hardcoded_chinese] src/components/TiptapVariableInput/utils/htmlUtils.ts:572 -> `，默认 `
- [hardcoded_chinese] src/components/TiptapVariableInput/utils/htmlUtils.ts:728 -> `，默认 `
- [hardcoded_chinese] src/components/TiptapVariableInput/utils/suggestionUtils.ts:21 -> `开头，或者 variable.type 是`

## src/layouts/Setting

- [hardcoded_chinese] src/layouts/Setting/ThemeSwitchPanel.tsx:90 -> `更新主题色失败:`
- [hardcoded_chinese] src/layouts/Setting/ThemeSwitchPanel.tsx:119 -> `更新背景图失败:`
- [hardcoded_chinese] src/layouts/Setting/ThemeSwitchPanel.tsx:132 -> `更新导航风格失败:`
- [hardcoded_chinese] src/layouts/Setting/ThemeSwitchPanel.tsx:160 -> `预览背景图失败:`
- [hardcoded_chinese] src/layouts/Setting/ThemeSwitchPanel.tsx:179 -> `切换导航主题失败:`
- [hardcoded_chinese] src/layouts/Setting/UsageStatistics/index.tsx:139 -> `获取用量统计失败:`

## src/components/CodeViewer

- [hardcoded_chinese] src/components/CodeViewer/MonacoEditor/index.tsx:132 -> `[MonacoEditor] 无法加载语言支持: ${language}`
- [hardcoded_chinese] src/components/CodeViewer/MonacoEditor/index.tsx:139 -> `❌ [MonacoEditor] 加载语言支持失败 (${language}):`
- [hardcoded_chinese] src/components/CodeViewer/MonacoEditor/index.tsx:175 -> `⚠️ [MonacoEditor] HTML语言支持加载失败，使用默认配置:`
- [hardcoded_chinese] src/components/CodeViewer/MonacoEditor/index.tsx:211 -> `❌ [MonacoEditor] Monaco Editor初始化失败:`
- [hardcoded_chinese] src/components/CodeViewer/MonacoEditor/index.tsx:735 -> `❌ [MonacoEditor] 更新编辑器内容失败:`

## src/components/MarkdownRenderer

- [hardcoded_chinese] src/components/MarkdownRenderer/TaskResult/index.tsx:67 -> `点击会话中TaskResult事件处理: `
- [hardcoded_chinese] src/components/MarkdownRenderer/utils.ts:36 -> `提取表格单元格内容失败:`
- [hardcoded_chinese] src/components/MarkdownRenderer/utils.ts:81 -> `提取表格行内容失败:`
- [hardcoded_chinese] src/components/MarkdownRenderer/utils.ts:117 -> `提取表格区域内容失败:`
- [hardcoded_chinese] src/components/MarkdownRenderer/utils.ts:196 -> `提取表格内容失败:`

## src/components/SelectComponent

- [hardcoded_chinese] src/components/SelectComponent/index.tsx:82 -> `全部`
- [hardcoded_chinese] src/components/SelectComponent/index.tsx:89 -> `全部`
- [hardcoded_chinese] src/components/SelectComponent/index.tsx:93 -> `文档`
- [hardcoded_chinese] src/components/SelectComponent/index.tsx:97 -> `表格`
- [hardcoded_chinese] src/components/SelectComponent/index.tsx:104 -> `组件库数据表`

## src/pages/IMChannel

- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:159 -> `启用`
- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:159 -> `停用`
- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:251 -> `禁用`
- [hardcoded_chinese] src/pages/IMChannel/components/IMChannelCardList/index.tsx:251 -> `启用`

## src/pages/MorePage

- [hardcoded_chinese] src/pages/MorePage/ApiKey/ApiKeyPermissionModal/index.tsx:205 -> `或 ISO 字符串且非`
- [hardcoded_chinese] src/pages/MorePage/ApiKey/ApiKeyPermissionModal/index.tsx:209 -> `永不过期`
- [hardcoded_chinese] src/pages/MorePage/ApiKey/ApiKeyPermissionModal/index.tsx:233 -> `保存权限失败:`
- [hardcoded_chinese] src/pages/MorePage/ApiKey/index.tsx:136 -> `永不过期`

## src/layouts/Message

- [hardcoded_chinese] src/layouts/Message/index.tsx:94 -> `已清除所有未读消息`
- [hardcoded_chinese] src/layouts/Message/index.tsx:116 -> `清除所有未读消息`
- [hardcoded_chinese] src/layouts/Message/index.tsx:149 -> `暂无消息`
- [hardcoded_chinese] src/layouts/Message/index.tsx:150 -> `暂无未读消息`

## src/pages/EcosystemPlugin

- [hardcoded_chinese] src/pages/EcosystemPlugin/index.tsx:178 -> `获取插件列表失败:`
- [hardcoded_chinese] src/pages/EcosystemPlugin/index.tsx:394 -> `保存分享失败:`
- [hardcoded_chinese] src/pages/EcosystemPlugin/index.tsx:432 -> `获取数据失败:`

## src/pages/EcosystemTemplate

- [hardcoded_chinese] src/pages/EcosystemTemplate/index.tsx:233 -> `获取模板列表失败:`
- [hardcoded_chinese] src/pages/EcosystemTemplate/index.tsx:504 -> `保存分享失败:`
- [hardcoded_chinese] src/pages/EcosystemTemplate/index.tsx:565 -> `获取数据失败:`

## src/pages/Home

- [hardcoded_chinese] src/pages/Home/DraggableHomeContent/AgentItem/index.tsx:32 -> `收藏操作失败:`
- [hardcoded_chinese] src/pages/Home/DraggableHomeContent/CategoryContainer/index.tsx:135 -> `🎯 Tab点击事件: ${activeKey}`
- [hardcoded_chinese] src/pages/Home/index.tsx:175 -> `🏠 Home Tab点击事件: ${type}, 当前activeTab: ${activeTab}`

## src/pages/SpaceSkillManage

- [hardcoded_chinese] src/pages/SpaceSkillManage/ImportSkillProjectModal/index.tsx:90 -> `处理文件导入失败`
- [hardcoded_chinese] src/pages/SpaceSkillManage/index.tsx:98 -> `复制到空间`
- [hardcoded_chinese] src/pages/SpaceSkillManage/index.tsx:165 -> `导出项目失败:`

## src/pages/SpaceTable

- [hardcoded_chinese] src/pages/SpaceTable/StructureTable/index.tsx:281 -> `是否必须`
- [hardcoded_chinese] src/pages/SpaceTable/index.tsx:397 -> `文件正在处理中，跳过重复请求:`
- [hardcoded_chinese] src/pages/SpaceTable/index.tsx:432 -> `文件上传中，进度:`

## src/components/CreateAgent

- [hardcoded_chinese] src/components/CreateAgent/index.tsx:149 -> `生成`
- [hardcoded_chinese] src/components/CreateAgent/index.tsx:234 -> `请描述你希望创建一个什么样的智能体`
- [hardcoded_chinese] src/components/CreateAgent/index.tsx:238 -> `请描述你希望创建一个什么样的智能体`

## src/components/EcosystemDetailDrawer

- [hardcoded_chinese] src/components/EcosystemDetailDrawer/index.tsx:59 -> `JSON解析失败:`
- [hardcoded_chinese] src/components/EcosystemDetailDrawer/index.tsx:268 -> `更新MCP配置失败:`
- [hardcoded_chinese] src/components/EcosystemDetailDrawer/index.tsx:288 -> `更新配置参数失败:`

## src/components/base

- [hardcoded_chinese] src/components/base/CopyButton/index.tsx:26 -> `复制`
- [hardcoded_chinese] src/components/base/CopyButton/index.tsx:96 -> `复制失败:`
- [hardcoded_chinese] src/components/base/CopyIconButton/index.tsx:76 -> `复制失败:`

## src/pages/SpaceMcpCreate

- [hardcoded_chinese] src/pages/SpaceMcpCreate/index.tsx:50 -> `url地址`
- [hardcoded_chinese] src/pages/SpaceMcpCreate/index.tsx:59 -> `url地址`

## src/components/AgentSidebar

- [hardcoded_chinese] src/components/AgentSidebar/TimedTask/index.tsx:88 -> `进行中`
- [hardcoded_chinese] src/components/AgentSidebar/TimedTask/index.tsx:153 -> `进行中`

## src/components/ComputerTypeSelector

- [hardcoded_chinese] src/components/ComputerTypeSelector/index.tsx:99 -> `获取电脑列表失败:`
- [hardcoded_chinese] src/components/ComputerTypeSelector/index.tsx:234 -> `保存电脑选择失败:`
