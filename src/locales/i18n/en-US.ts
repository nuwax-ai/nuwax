import type { SystemLangMap } from '@/types/interfaces/i18n';

export const EN_US: SystemLangMap = {
  'PC.Common.Global.confirm': 'Confirm',
  'PC.Common.Global.cancel': 'Cancel',
  'PC.Common.Global.save': 'Save',
  'PC.Common.Global.loading': 'Loading...',
  'PC.Common.Global.copy': 'Copy',
  'PC.Common.Global.refresh': 'Refresh',
  'PC.Common.Global.emptyData': 'No data',
  'PC.Common.Global.error': 'Error',
  'PC.Common.Global.pleaseSelect': 'Please select',
  'PC.Common.Global.backHome': 'Back to Home',
  'PC.Common.Global.pending': 'Pending',
  'PC.Toast.Global.savedSuccessfully': 'Saved successfully',
  'PC.Toast.Global.copiedSuccessfully': 'Copied successfully',
  'PC.Toast.Global.networkError': 'Network error',
  'PC.Toast.Global.serverTimeout': 'Server timeout, please retry',
  'PC.Toast.Global.serverUnreachable': 'Network error, unable to connect',
  'PC.Toast.Global.languageSavedReload': 'Language saved, reloading...',
  'PC.Pages.Setting.profileTitle': 'Profile',
  'PC.Pages.Setting.accountTitle': 'Account',
  'PC.Pages.Setting.emailBind': 'Email Binding',
  'PC.Pages.Setting.phoneBind': 'Phone Binding',
  'PC.Pages.Setting.resetPassword': 'Reset Password',
  'PC.Pages.Setting.themeSwitch': 'Theme Switch',
  'PC.Pages.Setting.usageStatistics': 'Usage Statistics',
  'PC.Pages.Setting.themeLoadFailed': 'Failed to load theme config',
  'PC.Pages.Setting.userName': 'User Name',
  'PC.Pages.Setting.nickName': 'Nickname',
  'PC.Pages.Setting.inputUserName': 'Please input user name',
  'PC.Pages.Setting.inputNickName': 'Please input nickname',
  'PC.Pages.Setting.phone': 'Phone Number',
  'PC.Pages.Setting.email': 'Email',
  'PC.Pages.Setting.dynamicCode': 'Dynamic Code',
  'PC.Pages.Setting.expiresAt': 'expires at {0}',
  'PC.Pages.Setting.language': 'Language Switch',
  'PC.Pages.Setting.selectLanguage': 'Select language',
  'PC.Pages.Setting.languageTitle': 'Language Switch',
  'PC.Pages.Setting.saveButton': 'Save',
  'PC.Pages.Setting.defaultTag': 'Default',
  'PC.Pages.Setting.confirmTitle': 'Confirm Language Switch',
  'PC.Pages.Setting.confirmContent':
    'Switching languages will update all UI text. Are you sure?',
  'PC.Pages.Setting.alreadyDefault':
    'The current language is already selected.',
  'PC.Pages.Setting.saveSuccess': 'Language setting updated successfully',
  'PC.Pages.Setting.bindPending': 'Pending binding',
  'PC.Pages.SystemConfigI18n.manageTitle': 'Language Management',
  'PC.Pages.SystemConfigI18n.empty': 'No data',
  'PC.Pages.SystemConfigI18n.columnName': 'Language Name',
  'PC.Pages.SystemConfigI18n.columnLang': 'Language Code',
  'PC.Pages.SystemConfigI18n.columnDefault': 'Default',
  'PC.Pages.SystemConfigI18n.columnStatus': 'Status',
  'PC.Pages.SystemConfigI18n.columnSort': 'Sort',
  'PC.Pages.SystemConfigI18n.columnModified': 'Modified Time',
  'PC.Pages.SystemConfigI18n.columnCreated': 'Created Time',
  'PC.Pages.SystemConfigI18n.columnAction': 'Actions',
  'PC.Pages.SystemConfigI18n.addLang': 'Add Language',
  'PC.Pages.SystemConfigI18n.addLangSuccess': 'Added successfully',
  'PC.Pages.SystemConfigI18n.editLang': 'Edit Language',
  'PC.Pages.SystemConfigI18n.editLangSuccess': 'Edited successfully',
  'PC.Pages.SystemConfigI18n.inputLangName': 'Please enter language name',
  'PC.Pages.SystemConfigI18n.inputLangCode': 'Please enter language code',
  'PC.Pages.SystemConfigI18n.defaultYes': 'Yes',
  'PC.Pages.SystemConfigI18n.defaultNo': 'No',
  'PC.Pages.SystemConfigI18n.statusEnabled': 'Enabled',
  'PC.Pages.SystemConfigI18n.statusDisabled': 'Disabled',
  'PC.Pages.SystemConfigI18n.noDefaultLang':
    'There is currently no default language. Please set one first.',
  'PC.Components.UserMenu.defaultUserName': 'User Name',
  'PC.Components.UserMenu.profile': 'Profile',
  'PC.Components.UserMenu.logout': 'Logout',
  'PC.Components.UserOperate.documents': 'Documents',
  'PC.Components.UserOperate.myComputer': 'My Computer',
  'PC.Components.UserOperate.noUnreadMessage': 'No unread message',
  'PC.Components.UserOperate.unreadMessageCount': '{0} unread messages',
  'PC.Components.AppDevEmptyState.viewFullText': 'View full text',
  'PC.Components.AppDevEmptyState.loadingTitle': 'Loading...',
  'PC.Components.AppDevEmptyState.loadingDescription':
    'Loading, please wait...',
  'PC.Components.AppDevEmptyState.errorTitle': 'Error occurred',
  'PC.Components.AppDevEmptyState.errorDescription':
    'An error occurred during loading. Please retry.',
  'PC.Components.AppDevEmptyState.networkErrorTitle':
    'Network connection failed',
  'PC.Components.AppDevEmptyState.networkErrorDescription':
    'Network issue detected. Check settings and retry.',
  'PC.Components.AppDevEmptyState.permissionDeniedTitle': 'Permission denied',
  'PC.Components.AppDevEmptyState.permissionDeniedDescription':
    'You do not have permission to access this resource.',
  'PC.Components.AppDevEmptyState.emptyTitle': 'No content',
  'PC.Components.AppDevEmptyState.emptyDescription':
    'There is no content to display.',
  'PC.Components.AppDevEmptyState.noDataTitle': 'No data',
  'PC.Components.AppDevEmptyState.noDataDescription':
    'There is no available data.',
  'PC.Components.AppDevEmptyState.serverStartingTitle':
    'Waiting for dev server startup',
  'PC.Components.AppDevEmptyState.serverStartingDescription':
    'Starting development server, please wait...',
  'PC.Components.AppDevEmptyState.serverRestartingTitle': 'Restarting',
  'PC.Components.AppDevEmptyState.serverRestartingDescription':
    'Restarting development server, please wait...',
  'PC.Components.AppDevEmptyState.developingTitle': 'Developing',
  'PC.Components.AppDevEmptyState.developingDescription':
    'Starting development server, please wait...',
  'PC.Components.AppDevEmptyState.importingProjectTitle': 'Importing project',
  'PC.Components.AppDevEmptyState.importingProjectDescription':
    'Starting development server, please wait...',
  'PC.Components.AppDevEmptyState.serverErrorTitle': 'Server error',
  'PC.Components.AppDevEmptyState.serverErrorDescription':
    'Preview failed to load. Check server status or network.',
  'PC.Components.AppDevEmptyState.previewLoadFailedTitle':
    'Preview load failed',
  'PC.Components.AppDevEmptyState.previewLoadFailedDescription':
    'Preview failed to load. Check server status or network.',
  'PC.Components.AppDevEmptyState.serverStartFailedTitle':
    'Development server failed to start',
  'PC.Components.AppDevEmptyState.serverStartFailedDescription':
    'Starting development server, please wait...',
  'PC.Components.AppDevEmptyState.noPreviewUrlTitle':
    'No preview URL available',
  'PC.Components.AppDevEmptyState.noPreviewUrlDescription':
    'Starting development server, please wait...',
  'PC.Components.AppDevEmptyState.conversationEmptyTitle':
    'Start a new conversation',
  'PC.Components.AppDevEmptyState.conversationEmptyDescription':
    'Ask the AI assistant to start your project development.',
  'PC.Components.AppDevEmptyState.addDataDescription':
    'Click "+" to add data resources',
  'PC.Components.AppDevEmptyState.noFileTitle': 'No files',
  'PC.Components.AppDevEmptyState.noFileDescription':
    'No files in the current directory.',
  'PC.Components.AppDevEmptyState.close': 'Close',
  'PC.Components.HistoryConversationList.renameTitleEmpty':
    'Title cannot be empty',
  'PC.Components.HistoryConversationList.renameTitleTooLong':
    'Title length cannot exceed 50 characters',
  'PC.Components.HistoryConversationList.renameSuccess': 'Updated successfully',
  'PC.Components.HistoryConversationList.deleteSuccess': 'Deleted successfully',
  'PC.Components.HistoryConversationList.pageTitle': 'Conversation History',
  'PC.Components.HistoryConversationList.searchPlaceholder':
    'Search conversation history',
  'PC.Components.HistoryConversationList.renameModalTitle': 'Rename',
  'PC.Components.HistoryConversationList.renamePlaceholder': 'Enter new name',
  'PC.Components.HistoryConversationList.deleteModalTitle':
    'Delete conversation permanently',
  'PC.Components.HistoryConversationList.deleteModalContent':
    'This conversation will be permanently deleted and cannot be recovered. Are you sure you want to delete it?',
  'PC.Components.HistoryConversationList.editTitleTooltip': 'Edit title',
  'PC.Components.HistoryConversationList.dateTimeFormat': 'YYYY-MM-DD HH:mm:ss',
  'PC.Components.HistoryConversationList.deleteTooltip': 'Delete',
  'PC.Components.HistoryConversationList.summaryEmpty': 'No summary available',
  'PC.Components.HistoryConversationList.agentFallback': 'Agent',
  'PC.Components.HistoryConversationList.noMoreData': 'All data loaded',
  'PC.Components.PagePreviewIframe.copyTemplate': 'Copy template',
  'PC.Components.PagePreviewIframe.defaultPageTitle': 'Page preview',
  'PC.Components.PagePreviewIframe.unableToReadData': 'Unable to read data',
  'PC.Components.PagePreviewIframe.tooltipRefresh': 'Refresh',
  'PC.Components.PagePreviewIframe.tooltipBack': 'Back',
  'PC.Components.PagePreviewIframe.tooltipForward': 'Forward',
  'PC.Components.PagePreviewIframe.tooltipCopyLink': 'Copy link',
  'PC.Components.VncPreview.missingConfig':
    'Missing required configuration (service URL or container ID).',
  'PC.Components.VncPreview.desktopUnavailable':
    'Agent desktop is temporarily unavailable. Please retry later.',
  'PC.Components.VncPreview.forbidden':
    'Access denied (403 Forbidden). Check permission settings.',
  'PC.Components.VncPreview.serviceUnavailableWithStatus':
    'Service is temporarily unavailable ({0}). Please retry later.',
  'PC.Components.VncPreview.requestFailedWithStatus':
    'Request failed (HTTP {0}). Check service status.',
  'PC.Components.VncPreview.cannotConnectDesktop':
    'Unable to connect to agent desktop',
  'PC.Components.VncPreview.connectionClosed': 'Connection closed',
  'PC.Components.VncPreview.shareExpired': 'Share has expired',
  'PC.Components.VncPreview.autoCloseCanceled':
    'Automatic close has been canceled',
  'PC.Components.VncPreview.autoClosedByIdleTimeout':
    'Agent desktop connection was closed automatically due to inactivity',
  'PC.Components.VncPreview.connected': 'Connected',
  'PC.Components.VncPreview.connecting': 'Connecting...',
  'PC.Components.VncPreview.disconnected': 'Disconnected',
  'PC.Components.VncPreview.preparingConnection': 'Preparing connection',
  'PC.Components.VncPreview.desktopConnecting':
    'Connecting to agent desktop...',
  'PC.Components.VncPreview.connectionError': 'Connection error',
  'PC.Components.VncPreview.cannotEstablish': 'Unable to establish connection',
  'PC.Components.VncPreview.retry': 'Retry',
  'PC.Components.VncIdleWarningModal.title':
    'You have been inactive for a while',
  'PC.Components.VncIdleWarningModal.description':
    'The system will automatically close the agent desktop connection to save resources.',
  'PC.Components.VncIdleWarningModal.confirmText': 'Continue',
  'PC.Components.VncIdleWarningModal.countdownAutoClose': 'Auto close in {0}s',
  'PC.Components.VncIdleWarningModal.hintAction':
    'Any keyboard or mouse action will {0}',
  'PC.Components.FilePreview.errorInvalid':
    'The file format is not supported for preview or the file is corrupted. Please verify it is a valid file.',
  'PC.Components.FilePreview.errorNetwork':
    'Network request failed. Check your network and retry.',
  'PC.Components.FilePreview.errorFileLoad':
    'Failed to load file. Please retry.',
  'PC.Components.FilePreview.errorFileParse':
    'Failed to parse file. The file may be corrupted or unsupported.',
  'PC.Components.FilePreview.errorDocxPreview':
    'Document preview failed. Please verify the file format.',
  'PC.Components.FilePreview.errorXlsxPreview':
    'Spreadsheet preview failed. Please verify the file format.',
  'PC.Components.FilePreview.errorPdfPreview':
    'PDF preview failed. Please verify the file format.',
  'PC.Components.FilePreview.errorPptxPreview':
    'Presentation preview failed. Please verify the file format.',
  'PC.Components.FilePreview.errorImageLoad': 'Failed to load image.',
  'PC.Components.FilePreview.errorDefaultPreview':
    'File preview failed. Please retry.',
  'PC.Components.FilePreview.errorLoadFileContent':
    'Failed to load file content. Please retry.',
  'PC.Components.FilePreview.errorLoadHtmlContent':
    'Failed to load HTML content. Please retry.',
  'PC.Components.FilePreview.errorImageLoadCheckFile':
    'Image load failed. Please verify the file is valid.',
  'PC.Components.FilePreview.tooltipRefresh': 'Refresh',
  'PC.Components.FilePreview.tooltipDownload': 'Download',
  'PC.Components.FilePreview.emptyNoFile': 'No file available for preview',
  'PC.Components.FilePreview.loadingPreview': 'Loading preview...',
  'PC.Components.FilePreview.alertPreviewFailed': 'Preview failed',
  'PC.Components.FilePreview.alertCannotPreview': 'Unable to preview this file',
  'PC.Components.FilePreview.retry': 'Retry',
  'PC.Components.FilePreview.unsupportedType':
    'This file type is not supported for preview',
  'PC.Components.FilePreview.fileTypeLabel': 'File type: .{0}',
  'PC.Components.FilePreview.downloadFile': 'Download file',
  'PC.Components.ConversationDetails.pagePreviewName': 'Page Preview',
  'PC.Components.ConversationDetails.requiredParamsWarning':
    'Please fill in required parameters',
  'PC.Components.ConversationDetails.startConversationWithAgent':
    'Start a conversation with {0}',
  'PC.Components.ConversationDetails.expandNavigation': 'Expand navigation',
  'PC.Components.ConversationDetails.viewAgentDetails': 'View agent details',
  'PC.Components.ConversationDetails.openPreviewPage': 'Open preview page',
  'PC.Components.ConversationDetails.noAgentPermission':
    'You do not have permission for this agent',
  'PC.Components.ThemeConfigNavigationStylePanel.panelTitle': 'Navigation Bar',
  'PC.Components.ThemeConfigNavigationStylePanel.styleSectionTitle': 'Style',
  'PC.Components.ThemeConfigNavigationStylePanel.colorSectionTitle':
    'Light/Dark',
  'PC.Components.ThemeConfigNavigationStylePanel.style1Name': 'Style 1',
  'PC.Components.ThemeConfigNavigationStylePanel.style1Description':
    'Compact mode: 60px width, no text, container with margin and rounded corners.',
  'PC.Components.ThemeConfigNavigationStylePanel.style2Name': 'Style 2',
  'PC.Components.ThemeConfigNavigationStylePanel.style2Description':
    'Expanded mode: 88px width with text, container without margin or rounded corners.',
  'PC.Components.ThemeConfigNavigationStylePanel.lightMode': 'Light',
  'PC.Components.ThemeConfigNavigationStylePanel.darkMode': 'Dark',
  'PC.Components.ThemeConfigBackgroundImagePanel.panelTitle':
    'Background Image',
  'PC.Components.ThemeConfigBackgroundImagePanel.systemSectionTitle':
    'System Background Images',
  'PC.Components.ThemeConfigBackgroundImagePanel.emptyAvailable':
    'No available background image',
  'PC.Components.ThemeConfigBackgroundImagePanel.customSectionTitle':
    'Custom Background Images',
  'PC.Components.ThemeConfigBackgroundImagePanel.uploadImage': 'Upload Image',
  'PC.Components.ThemeConfigThemeColorPanel.panelTitle': 'Theme Color',
  'PC.Components.ThemeConfigThemeColorPanel.customName': 'Custom',
  'PC.Components.CopyToSpaceComponent.pageCopySuccess':
    'Page copied successfully',
  'PC.Components.CopyToSpaceComponent.templateCopySuccess':
    'Template copied successfully',
  'PC.Components.DataResourceManagement.fetchListFailed':
    'Failed to fetch data resource list',
  'PC.Components.DataResourceManagement.createSuccess': 'Created successfully',
  'PC.Components.DataResourceManagement.createFailed': 'Create failed',
  'PC.Components.DataResourceManagement.updateSuccess': 'Updated successfully',
  'PC.Components.DataResourceManagement.updateFailed': 'Update failed',
  'PC.Components.DataResourceManagement.deleteSuccess': 'Deleted successfully',
  'PC.Components.DataResourceManagement.deleteFailed': 'Delete failed',
  'PC.Components.DataResourceManagement.enableSuccess': 'Enabled successfully',
  'PC.Components.DataResourceManagement.disableSuccess':
    'Disabled successfully',
  'PC.Components.DataResourceManagement.switchStatusFailed':
    'Failed to switch resource status',
  'PC.Components.DataResourceManagement.operationFailed': 'Operation failed',
  'PC.Components.DataResourceManagement.connectionTestSuccess':
    'Connection test succeeded',
  'PC.Components.DataResourceManagement.connectionTestFailed':
    'Connection test failed',
  'PC.Components.DataResourceManagement.testFailed': 'Test failed',
  'PC.Pages.Login.inputEmailRequired': 'Please input email',
  'PC.Pages.Login.inputPhoneRequired': 'Please input phone number',
  'PC.Pages.Login.invalidEmail': 'Please input a valid email',
  'PC.Pages.Login.invalidPhone': 'Please input a valid phone number',
  'PC.Pages.Login.passwordRequired': 'Please input password with 6+ characters',
  'PC.Pages.Login.invalidPassword': 'Please input a valid password',
  'PC.Pages.Login.serviceAgreementTitle':
    'Service Agreement and Privacy Protection',
  'PC.Pages.Login.serviceAgreementAgree': 'Agree',
  'PC.Pages.Login.serviceAgreementDisagree': 'Disagree',
  'PC.Pages.Login.passwordLogin': 'Password Login',
  'PC.Pages.Login.codeLoginOrRegister': 'Code Login / Register',
  'PC.Pages.Login.welcome': 'Welcome to {0}',
  'PC.Pages.Login.inputEmailPlaceholder': 'Please input email',
  'PC.Pages.Login.inputPhonePlaceholder': 'Please input phone number',
  'PC.Pages.Login.inputPasswordPlaceholder':
    'Please input password with 6+ characters',
  'PC.Pages.Login.login': 'Login',
  'PC.Pages.Login.nextStep': 'Next',
  'PC.Pages.VerifyCode.inputEmailCode': 'Enter email verification code',
  'PC.Pages.VerifyCode.inputSmsCode': 'Enter SMS verification code',
  'PC.Pages.VerifyCode.codeSentTo': 'Verification code sent to {0}{1}',
  'PC.Pages.VerifyCode.yourEmail': 'your email ',
  'PC.Pages.VerifyCode.yourPhone': 'phone number ',
  'PC.Pages.VerifyCode.countdownSuffix': 's later',
  'PC.Pages.VerifyCode.resend': 'Resend',
  'PC.Pages.SetPassword.title': 'Set Password',
  'PC.Pages.SetPassword.description':
    'Please use at least 6 characters. Avoid passwords reused on other sites.',
  'PC.Pages.SetPassword.passwordRequired':
    'Please input password with 6+ characters',
  'PC.Pages.SetPassword.invalidPassword': 'Please input a valid password',
  'PC.Pages.SetPassword.passwordPlaceholder':
    'Please input password with 6+ characters',
  'PC.Pages.SetPassword.confirmPasswordRequired':
    'Please confirm your password',
  'PC.Pages.SetPassword.passwordMismatch': 'The two passwords do not match',
  'PC.Pages.SetPassword.confirmPasswordInvalid':
    'Please input a valid password',
  'PC.Pages.SetPassword.confirmPasswordPlaceholder':
    'Please confirm your password',
  'PC.Pages.AgentEdit.showStand': 'Showroom',
  'PC.Pages.AgentEdit.versionHistory': 'Version History',
  'PC.Pages.AgentEdit.draftAutoSavedAt': 'Draft auto-saved at {0}',
  'PC.Pages.AgentEdit.unpublishedChanges': 'Unpublished changes',
  'PC.Pages.AgentEdit.publish': 'Publish',
  'PC.Pages.AgentArrangeComponentSetting.title': 'Settings',
  'PC.Pages.AgentArrangeAsyncRun.title': 'Async Run',
  'PC.Pages.AgentArrangeAsyncRun.description':
    'When the task enters async mode, a default reply is returned. Users can continue chatting, and they are notified after background completion.',
  'PC.Pages.AgentArrangeAsyncRun.defaultReplyContent':
    'Processing has started. Please wait for the result.',
  'PC.Pages.AgentArrangeAsyncRun.replyContent': 'Reply Content',
  'PC.Pages.AgentArrangeAsyncRun.replyContentPlaceholder':
    'You can set an automatic reply here, for example: The task is in progress. I will notify you as soon as it is done. Is there anything else I can help with?',
  'PC.Pages.AgentArrangeAsyncRun.replyContentRequired':
    'Reply content is required',
  'PC.Pages.AgentArrangeOutputWay.title': 'Direct Output',
  'PC.Pages.AgentArrangeOutputWay.tooltip':
    'If set to "Yes", the workflow result is sent directly to the chat box without LLM summarization.',
  'PC.Pages.AgentArrangeOutputWay.optionNo': 'No',
  'PC.Pages.AgentArrangeOutputWay.optionYes': 'Yes',
  'PC.Pages.AgentArrangeInvokeType.title': 'Invoke Type',
  'PC.Pages.AgentArrangeInvokeType.optionAuto': 'Auto',
  'PC.Pages.AgentArrangeInvokeType.optionOnDemand': 'On demand',
  'PC.Pages.AgentArrangeInvokeType.optionManual': 'Manual',
  'PC.Pages.AgentArrangeInvokeType.optionManualOnDemand': 'Manual + On demand',
  'PC.Pages.AgentArrangeInvokeType.optionNo': 'No',
  'PC.Pages.AgentArrangeInvokeType.optionYes': 'Yes',
  'PC.Pages.AgentArrangeInvokeType.autoDescription':
    'Auto: triggered every time the user sends a message.',
  'PC.Pages.AgentArrangeInvokeType.onDemandDescription':
    'On demand: the model decides whether to invoke based on the task.',
  'PC.Pages.AgentArrangeInvokeType.manualDescription':
    'Manual: the user decides whether to use the tool; behavior matches Auto after selection.',
  'PC.Pages.AgentArrangeInvokeType.manualOnDemandDescription':
    'Manual + On demand: after user selection, the model decides whether to invoke; no selection means no invocation.',
  'PC.Pages.AgentArrangeInvokeType.skillManualDescription':
    'Manual: users can choose this skill in chat and the model will prioritize it.',
  'PC.Pages.AgentArrangeInvokeType.defaultSelected': 'Default Selected',
  'PC.Pages.AgentArrangeInvokeType.alias': 'Display Alias',
  'PC.Pages.AgentArrangeInvokeType.aliasTooltip':
    'Optional. If set, the frontend prioritizes this name.',
  'PC.Pages.AgentArrangeInvokeType.aliasPlaceholder':
    'Please enter display alias',
  'PC.Pages.AgentArrangeCardBindDataSource.selectStyle': 'Select Card Style',
  'PC.Pages.AgentArrangeCardBindDataSource.optionSingle': 'Single Card',
  'PC.Pages.AgentArrangeCardBindDataSource.optionList': 'Vertical List',
  'PC.Pages.AgentArrangeCardBindDataSource.cardListMaxLength':
    'Max Card List Length',
  'PC.Pages.AgentArrangeCardBindDataSource.cardListMaxLengthPlaceholder':
    'Please enter max card list length',
  'PC.Pages.AgentArrangeCardBindDataSource.bindArray':
    'Bind an Array for the Whole Card',
  'PC.Pages.AgentArrangeCardBindDataSource.bindArrayPlaceholder':
    'Please bind an array for the whole card',
  'PC.Pages.AgentArrangeCardBindDataSource.bindListItemData':
    'Bind Data for Card List Items',
  'PC.Pages.AgentArrangeCardBindDataSource.cardClickJump':
    'Card Click Redirect',
  'PC.Pages.AgentArrangeCardBindDataSource.cardClickJumpTooltip':
    'After binding, users can click the card in the agent conversation flow to navigate to another page.',
  'PC.Pages.AgentArrangeCardBindDataSource.urlDataSourcePlaceholder':
    'Select data source for URL',
  'PC.Pages.AgentArrangeCreateVariableModal.title': 'Edit or Add Variable',
  'PC.Pages.AgentArrangeCreateVariableModal.fieldName': 'Field Name',
  'PC.Pages.AgentArrangeCreateVariableModal.fieldNameRequired':
    'Please enter field name',
  'PC.Pages.AgentArrangeCreateVariableModal.fieldNamePlaceholder':
    'Please enter field name following naming rules',
  'PC.Pages.AgentArrangeCreateVariableModal.displayName': 'Display Name',
  'PC.Pages.AgentArrangeCreateVariableModal.displayNameRequired':
    'Please enter display name',
  'PC.Pages.AgentArrangeCreateVariableModal.displayNamePlaceholder':
    'Please enter display name for frontend rendering',
  'PC.Pages.AgentArrangeCreateVariableModal.description': 'Description',
  'PC.Pages.AgentArrangeCreateVariableModal.descriptionPlaceholder':
    'Please enter field description',
  'PC.Pages.AgentArrangeCreateVariableModal.inputType': 'Input Type',
  'PC.Pages.AgentArrangeCreateVariableModal.inputTypeText': 'Single-line Text',
  'PC.Pages.AgentArrangeCreateVariableModal.inputTypeParagraph': 'Paragraph',
  'PC.Pages.AgentArrangeCreateVariableModal.inputTypeNumber': 'Number',
  'PC.Pages.AgentArrangeCreateVariableModal.inputTypeSelect': 'Single',
  'PC.Pages.AgentArrangeCreateVariableModal.inputTypeMultipleSelect':
    'Multiple',
  'PC.Pages.AgentArrangeCreateVariableModal.inputTypeAutoRecognition':
    'Auto Recognition',
  'PC.Pages.AgentArrangeCreateVariableModal.manualCreate': 'Manual Create',
  'PC.Pages.AgentArrangeCreateVariableModal.addOption': 'Add Option',
  'PC.Pages.AgentArrangeCreateVariableModal.dataBinding': 'Data Binding',
  'PC.Pages.AgentArrangeCreateVariableModal.addOptionRequired':
    'Please add options',
  'PC.Pages.AgentArrangeCreateVariableModal.optionValueRequired':
    'Please fill option values',
  'PC.Pages.AgentArrangeCreateVariableModal.selectBindingComponent':
    'Please select a binding component',
  'PC.Pages.AgentArrangeCreateVariableModal.defaultValue': 'Default Value',
  'PC.Pages.AgentArrangeCreateVariableModal.defaultValuePlaceholder':
    'Please enter default value',
  'PC.Pages.AgentArrangeCreateVariableModal.required': 'Required',
  'PC.Toast.AgentArrangeCreateVariableModal.updateSuccess':
    'Variable updated successfully',
  'PC.Pages.AgentArrangeCreateVariables.title': 'Variables',
  'PC.Pages.AgentArrangeCreateVariables.add': 'Add',
  'PC.Pages.AgentArrangeCreateVariables.name': 'Name',
  'PC.Pages.AgentArrangeCreateVariables.description': 'Description',
  'PC.Pages.AgentArrangeCreateVariables.type': 'Type',
  'PC.Pages.AgentArrangeCreateVariables.systemVariable': 'System Variable',
  'PC.Pages.AgentArrangeCreateVariables.customVariable': 'Custom Variable',
  'PC.Pages.AgentArrangeCreateVariables.inputType': 'Input Type',
  'PC.Pages.AgentArrangeCreateVariables.required': 'Required',
  'PC.Pages.AgentArrangeCreateVariables.yes': 'Yes',
  'PC.Pages.AgentArrangeCreateVariables.no': 'No',
  'PC.Pages.AgentArrangeCreateVariables.deleteSuccess': 'Deleted successfully',
  'PC.Pages.AgentArrangeCreateVariables.updateSuccess': 'Updated successfully',
  'PC.Pages.AgentArrangeExceptionHandling.title': 'Interrupt on Exception',
  'PC.Pages.AgentArrangeExceptionHandling.description':
    'Default message sent to the LLM when an exception occurs',
  'PC.Pages.AgentArrangeExceptionHandling.defaultInfo': 'Default Message',
  'PC.Pages.AgentArrangeExceptionHandling.defaultInfoPlaceholder':
    'Please enter the default message sent to the LLM on exception',
  'PC.Pages.AgentArrangeEventBindModal.title': 'Event Binding',
  'PC.Pages.AgentArrangeEventBindModal.updateSuccess': 'Updated successfully',
  'PC.Pages.AgentArrangeEventBindModal.eventName': 'Event Name',
  'PC.Pages.AgentArrangeEventBindModal.eventNameRequired':
    'Please enter event name',
  'PC.Pages.AgentArrangeEventBindModal.eventNamePlaceholder':
    'Please enter event name',
  'PC.Pages.AgentArrangeEventBindModal.eventCode':
    'Event Identifier (for event distinction)',
  'PC.Pages.AgentArrangeEventBindModal.eventCodeRequired':
    'Please enter event identifier',
  'PC.Pages.AgentArrangeEventBindModal.eventCodePlaceholder':
    'Please enter event identifier, only letters, numbers, and underscores are allowed',
  'PC.Pages.AgentArrangeEventBindModal.eventCodeInvalid':
    'Event identifier can only contain letters, numbers, and underscores, and must start with a letter or underscore.',
  'PC.Pages.AgentArrangeEventBindModal.responseAction': 'Response Action',
  'PC.Pages.AgentArrangeEventBindModal.responseActionPlaceholder':
    'Please select response action',
  'PC.Pages.AgentArrangeEventBindModal.responseActionPage':
    'Open Extended Page',
  'PC.Pages.AgentArrangeEventBindModal.responseActionLink':
    'Open External Link',
  'PC.Pages.AgentArrangeEventBindModal.pagePath': 'Page Path',
  'PC.Pages.AgentArrangeEventBindModal.pagePathRequired':
    'Please select page path',
  'PC.Pages.AgentArrangeEventBindModal.pagePathPlaceholder':
    'Please select page path',
  'PC.Pages.AgentArrangeEventBindModal.linkUrl': 'Link URL',
  'PC.Pages.AgentArrangeEventBindModal.linkUrlRequired':
    'Please enter link URL',
  'PC.Pages.AgentArrangeEventBindModal.linkUrlInvalid':
    'Please enter a valid URL starting with http:// or https://',
  'PC.Pages.AgentArrangeEventBindModal.input': 'Input',
  'PC.Pages.AgentArrangeEventBindModal.configInputArgs':
    'Configure Input Parameters',
  'PC.Pages.AgentArrangeEventBindModal.paramName': 'Parameter Name',
  'PC.Pages.AgentArrangeEventBindModal.paramValue':
    'Parameter Value (Optional)',
  'PC.Pages.AgentArrangeEventBindModal.paramValueTip':
    'The following parameters are optional. If empty, the model fills them automatically. You can also reference parameters dynamically in the input box.',
  'PC.Pages.AgentArrangeEventBindModal.agentIdVariable': 'Agent ID',
  'PC.Pages.AgentArrangeEventBindModal.systemUserIdVariable': 'System User ID',
  'PC.Pages.AgentArrangeEventBindModal.userUidVariable': 'User UID',
  'PC.Pages.AgentArrangeEventBindModal.userNameVariable': 'User Name',
  'PC.Pages.AgentArrangeEventBindModal.paramValuePlaceholder':
    'Please enter {0}',
  'PC.Pages.AgentArrangeKnowledgeSetting.title': 'Knowledge Base Settings',
  'PC.Pages.AgentArrangeKnowledgeSetting.recallSection': 'Recall',
  'PC.Pages.AgentArrangeKnowledgeSetting.invokeType': 'Invoke Type',
  'PC.Pages.AgentArrangeKnowledgeSetting.invokeTypeTip':
    'Choose whether to auto recall each round or recall from a specific knowledge base on demand.',
  'PC.Pages.AgentArrangeKnowledgeSetting.searchStrategy': 'Search Strategy',
  'PC.Pages.AgentArrangeKnowledgeSetting.searchStrategyTip':
    'This strategy defines how knowledge is retrieved. Different strategies improve answer accuracy and usability in different scenarios.',
  'PC.Pages.AgentArrangeKnowledgeSetting.searchMixed': 'Mixed',
  'PC.Pages.AgentArrangeKnowledgeSetting.searchSemantic': 'Semantic',
  'PC.Pages.AgentArrangeKnowledgeSetting.searchFullText': 'Full Text',
  'PC.Pages.AgentArrangeKnowledgeSetting.maxRecallCount':
    'Maximum Recall Count',
  'PC.Pages.AgentArrangeKnowledgeSetting.maxRecallCountTip':
    'Maximum number of passages returned from the knowledge base to the LLM. Larger values return more content.',
  'PC.Pages.AgentArrangeKnowledgeSetting.minMatchingDegree':
    'Minimum Match Degree',
  'PC.Pages.AgentArrangeKnowledgeSetting.minMatchingDegreeTip':
    'Only passages above the configured match degree are recalled and returned to the LLM.',
  'PC.Pages.AgentArrangeKnowledgeSetting.replySection': 'Reply',
  'PC.Pages.AgentArrangeKnowledgeSetting.noRecallReply': 'No-recall Reply',
  'PC.Pages.AgentArrangeKnowledgeSetting.noRecallReplyTip':
    'Reply text used when no valid chunks are recalled from the knowledge base.',
  'PC.Pages.AgentArrangeKnowledgeSetting.noRecallDefault': 'Default',
  'PC.Pages.AgentArrangeKnowledgeSetting.noRecallCustom': 'Custom',
  'PC.Pages.AgentArrangeKnowledgeSetting.noRecallReplyPlaceholder':
    'Please enter',
  'PC.Pages.AgentArrangeKnowledgeTextList.emptyDescription':
    'After uploading documents, URLs, or third-party data sources as text knowledge bases, the agent can answer user questions with referenced knowledge content.',
  'PC.Pages.AgentArrangeKnowledgeTextList.remove': 'Remove Knowledge Base',
  'PC.Pages.AgentArrangeLongMemoryContent.description':
    'Summarize chat conversations to improve responses to user messages.',
  'PC.Pages.AgentArrangeMcpGroupComponentItem.toolsWithCount': 'Tools ({0})',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.title': 'Preset Question Settings',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.updateSuccess':
    'Updated successfully',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.requiredParamEmpty':
    'Parameter "{0}" is required and cannot be empty.',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.typeQuestion': 'Question Guide',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.typePage': 'Extended Page Path',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.typeLink': 'External Link',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.paramName': 'Parameter Name',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.paramValue': 'Parameter Value',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.paramValueTip':
    'You can dynamically reference parameters in the input. Empty values are auto-completed by the model.',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.agentIdVariable': 'Agent ID',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.systemUserIdVariable':
    'System User ID',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.userUidVariable': 'User UID',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.userNameVariable': 'User Name',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.paramValuePlaceholder':
    'Please enter {0}',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.icon': 'Icon',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.displayInfo': 'Display Info',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.displayInfoRequired':
    'Please enter display info',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.displayInfoPlaceholder':
    'Question content',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.type': 'Type',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.typePlaceholder':
    'Please select type',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.pagePath': 'Page Path',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.pagePathRequired':
    'Please select page path',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.pagePathPlaceholder':
    'Please select page path',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.linkUrl': 'Link URL',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.linkUrlRequired':
    'Please enter link URL',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.linkUrlInvalid':
    'Please enter a valid URL starting with http:// or https://',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.input': 'Input',
  'PC.Pages.AgentArrangeGuidQuestionSetModal.configInputArgs':
    'Configure Input Parameters',
  'PC.Pages.AgentArrangeOpenRemarks.headerTitle': 'Opening Remarks Copy',
  'PC.Pages.AgentArrangeOpenRemarks.placeholder':
    'Please enter opening remarks',
  'PC.Pages.AgentArrangeOpenRemarks.guidQuestionTitle':
    'Preset Opening Questions',
  'PC.Pages.AgentArrangeOpenRemarks.addGuidQuestion': 'Add Preset Question',
  'PC.Pages.AgentArrangeOpenRemarks.guidQuestionPlaceholder':
    'Enter a guided opening question',
  'PC.Pages.AgentArrangeOpenRemarks.deleteGuidQuestion':
    'Delete Preset Question',
  'PC.Pages.AgentArrangeOpenRemarks.settings': 'Settings',
  'PC.Pages.AgentArrangePageSettingModal.title': 'Settings',
  'PC.Pages.AgentArrangePageSettingModal.visibleToLlm': 'Visible to LLM',
  'PC.Pages.AgentArrangePageSettingModal.homeIndex': 'Default Home Page',
  'PC.Pages.AgentArrangePageSettingModal.updateOtherPageFailed':
    'Failed to update other pages:',
  'PC.Pages.AgentArrangePageSettingModal.saveConfigFailed':
    'Failed to save page settings:',
  'PC.Pages.AgentArrangePageSettingModal.saveFailed':
    'Save failed, please retry',
  'PC.Pages.AgentArrangeSubAgentConfig.empty':
    'No sub-agent configured. Click the top-right button to add one.',
  'PC.Pages.AgentArrangeSubAgentConfig.defaultNameWithIndex': 'Sub-agent {0}',
  'PC.Pages.AgentArrangeSubAgentConfig.edit': 'Edit',
  'PC.Pages.AgentArrangeSubAgentConfig.delete': 'Delete',
  'PC.Pages.AgentArrangeSubAgentEditModal.cancelTitle': 'Confirm Cancel',
  'PC.Pages.AgentArrangeSubAgentEditModal.cancelContent':
    'You have unsaved changes. Are you sure you want to cancel?',
  'PC.Pages.AgentArrangeSubAgentEditModal.cancelConfirm': 'Confirm Cancel',
  'PC.Pages.AgentArrangeSubAgentEditModal.keepEditing': 'Keep Editing',
  'PC.Pages.AgentArrangeSubAgentEditModal.editTitle': 'Edit Sub-agent',
  'PC.Pages.AgentArrangeSubAgentEditModal.createTitle': 'Create Sub-agent',
  'PC.Pages.AgentArrangeSubAgentEditModal.viewDoc': 'View Docs',
  'PC.Pages.AgentArrangeSubAgentEditModal.exitFullscreen': 'Exit Fullscreen',
  'PC.Pages.AgentArrangeSubAgentEditModal.enterFullscreen': 'Fullscreen Edit',
  'PC.Pages.AgentArrangeSubAgentEditModal.promptPlaceholder':
    'Please enter sub-agent prompt',
  'PC.Pages.AgentArrangeConfig.plan': 'Planning',
  'PC.Pages.AgentArrangeConfig.tools': 'Tools',
  'PC.Pages.AgentArrangeConfig.skills': 'Skills',
  'PC.Pages.AgentArrangeConfig.knowledge': 'Knowledge',
  'PC.Pages.AgentArrangeConfig.memory': 'Memory',
  'PC.Pages.AgentArrangeConfig.conversation': 'Conversation',
  'PC.Pages.AgentArrangeConfig.interface': 'Interface',
  'PC.Pages.AgentArrangeConfig.deleteSuccess': 'Deleted successfully',
  'PC.Pages.AgentArrangeConfig.addSuccess': 'Added successfully',
  'PC.Pages.AgentArrangeConfig.createSubAgentFailed':
    'Failed to create sub-agent component',
  'PC.Pages.AgentArrangeConfig.deleteSuccessSimple': 'Delete successful',
  'PC.Pages.AgentArrangeConfig.insertPromptSuccess':
    'Inserted into system prompt',
  'PC.Pages.AgentArrangeConfig.insertPromptUnavailable':
    'Insert into system prompt is unavailable',
  'PC.Pages.AgentArrangeConfig.plugin': 'Plugin',
  'PC.Pages.AgentArrangeConfig.addPlugin': 'Add Plugin',
  'PC.Pages.AgentArrangeConfig.workflow': 'Workflow',
  'PC.Pages.AgentArrangeConfig.addWorkflow': 'Add Workflow',
  'PC.Pages.AgentArrangeConfig.mcpDescription':
    'The agent can connect to service APIs through the standardized MCP protocol and invoke them.',
  'PC.Pages.AgentArrangeConfig.addMcp': 'Add MCP',
  'PC.Pages.AgentArrangeConfig.text': 'Text',
  'PC.Pages.AgentArrangeConfig.addKnowledge': 'Add Knowledge Base',
  'PC.Pages.AgentArrangeConfig.skill': 'Skill',
  'PC.Pages.AgentArrangeConfig.addSkill': 'Add Skill',
  'PC.Pages.AgentArrangeConfig.subAgent': 'Sub-agent',
  'PC.Pages.AgentArrangeConfig.addSubAgent': 'Add Sub-agent',
  'PC.Pages.AgentArrangeConfig.variable': 'Variable',
  'PC.Pages.AgentArrangeConfig.addVariable': 'Add Variable',
  'PC.Pages.AgentArrangeConfig.table': 'Data Table',
  'PC.Pages.AgentArrangeConfig.addTable': 'Add Data Table',
  'PC.Pages.AgentArrangeConfig.longMemory': 'Long-term Memory',
  'PC.Pages.AgentArrangeConfig.userQuestionSuggestion':
    'User Question Suggestions',
  'PC.Pages.AgentArrangeConfig.userQuestionSuggestionEnabled':
    'After each agent reply, provide multiple suggested user questions based on the prompt.',
  'PC.Pages.AgentArrangeConfig.userQuestionSuggestionDisabled':
    'After each agent reply, do not provide suggested user questions.',
  'PC.Pages.AgentArrangeConfig.scheduledTask': 'Scheduled Task',
  'PC.Pages.AgentArrangeConfig.scheduledTaskDescription':
    'When enabled, users can run tasks via scheduled task settings.',
  'PC.Pages.AgentArrangeConfig.hideRemoteDesktop': 'Hide Remote Desktop',
  'PC.Pages.AgentArrangeConfig.hideRemoteDesktopEnabled':
    'Hide the remote desktop on the right side of the agent chat area',
  'PC.Pages.AgentArrangeConfig.hideRemoteDesktopDisabled':
    'Show the remote desktop on the right side of the agent chat area',
  'PC.Pages.AgentArrangeConfig.openingRemarks': 'Opening Remarks',
  'PC.Pages.AgentArrangeConfig.page': 'Page',
  'PC.Pages.AgentArrangeConfig.addPage': 'Add Page',
  'PC.Pages.AgentArrangeConfig.defaultExpandPageArea':
    'Default Expanded Page Area',
  'PC.Pages.AgentArrangeConfig.defaultExpandPageAreaDesc':
    'After a page is bound to the agent, enabling this option expands the page by default beside the agent chat area.',
  'PC.Pages.AgentArrangeConfig.addPageFirst': 'Please add a page first',
  'PC.Pages.AgentArrangeConfig.eventBinding': 'Event Binding',
  'PC.Pages.AgentArrangeConfig.addEventBinding': 'Add Event Binding',
  'PC.Pages.AgentArrangeConfig.dynamicJsonParameter': 'Dynamic JSON Params',
  'PC.Pages.AgentArrangeConfig.referenceNumber': '#Reference Number',
  'PC.Pages.AgentArrangeConfig.appendReferenceInfo':
    'Append reference information after the returned content as follows',
  'PC.Pages.AgentArrangeConfig.dynamicJsonSchemaPrefix':
    'Dynamic JSON parameter JsonSchema for {0} is as follows',
  'PC.Pages.AgentArrangeConfig.conversationExperience':
    'Conversation Experience',
  'PC.Pages.AgentArrangeConfig.interfaceConfig': 'Interface Config',
  'PC.Pages.AgentArrangeConfig.allowOtherModel':
    'Allow users to select their own models',
  'PC.Pages.AgentArrangeConfig.allowOtherModelDesc':
    'When enabled, users can select their own models in the session',
  'PC.Pages.AgentArrangeConfig.allowAtSkill': 'Allow users to @ skills',
  'PC.Pages.AgentArrangeConfig.allowAtSkillDesc':
    'When enabled, users can add any skills in the session',
  'PC.Pages.AgentArrangeConfig.allowPrivateSandbox':
    'Allow users to select private computer',
  'PC.Pages.AgentArrangeConfig.allowPrivateSandboxDesc':
    'When enabled, users can choose to execute the agent in their own Claw client',
  'PC.Pages.SystemConfigCategoryManage.pageTitle': 'Category Management',
  'PC.Pages.SystemConfigCategoryManage.agent': 'Agent',
  'PC.Pages.SystemConfigCategoryManage.webApp': 'Web App',
  'PC.Pages.SystemConfigCategoryManage.component': 'Component',
  'PC.Pages.SystemConfigCategoryManage.categoryType': '{0} Category',
  'PC.Pages.SystemConfigCategoryManage.itemCount': '{0} items',
  'PC.Pages.SystemConfigCategoryManage.confirmDeleteTitle': 'Confirm Delete',
  'PC.Pages.SystemConfigCategoryManage.confirmDeleteContent':
    'Are you sure you want to delete this category? This action cannot be undone.',
  'PC.Pages.SystemConfigCategoryManage.deletedSuccessfully':
    'Category deleted successfully',
  'PC.Pages.SystemConfigCategoryManage.deleteFailed':
    'Failed to delete category:',
  'PC.Pages.SystemConfigCategoryManage.addSuccessWithType':
    '{0} category added successfully',
  'PC.Pages.SystemConfigCategoryManage.editSuccessWithType':
    '{0} category updated successfully',
  'PC.Pages.SystemConfigCategoryManage.saveFailed': 'Failed to save category:',
  'PC.Pages.SystemConfigCategoryManage.add': 'Add',
  'PC.Pages.SystemConfigCategoryModal.addTitle': 'Add {0} Category',
  'PC.Pages.SystemConfigCategoryModal.editTitle': 'Edit {0} Category',
  'PC.Pages.SystemConfigCategoryModal.name': 'Category Name',
  'PC.Pages.SystemConfigCategoryModal.namePlaceholder':
    'Please enter category name',
  'PC.Pages.SystemConfigCategoryModal.nameRequired':
    'Please enter category name',
  'PC.Pages.SystemConfigCategoryModal.nameMaxLength':
    'Category name cannot exceed 100 characters',
  'PC.Pages.SystemConfigCategoryModal.code': 'Category Code',
  'PC.Pages.SystemConfigCategoryModal.codePlaceholder':
    'Please enter category code',
  'PC.Pages.SystemConfigCategoryModal.codeRequired':
    'Please enter category code',
  'PC.Pages.SystemConfigCategoryModal.codeMaxLength':
    'Category code cannot exceed 100 characters',
  'PC.Pages.SystemConfigCategoryModal.codePatternInvalid':
    'Category code can only contain letters, numbers, underscores (_), or dollar signs ($), and cannot start with a number',
  'PC.Pages.SystemConfigCategoryModal.description': 'Description',
  'PC.Pages.SystemConfigCategoryModal.descriptionPlaceholder':
    'Please enter category description (optional)',
  'PC.Pages.SystemConfigCategoryModal.descriptionMaxLength':
    'Description cannot exceed 100 characters',
  'PC.Pages.SystemConfigSandboxModal.addTitle': 'Add Sandbox',
  'PC.Pages.SystemConfigSandboxModal.editTitle': 'Edit Sandbox',
  'PC.Pages.SystemConfigSandboxModal.name': 'Sandbox Name',
  'PC.Pages.SystemConfigSandboxModal.namePlaceholder': 'e.g. AGENT Sandbox',
  'PC.Pages.SystemConfigSandboxModal.nameRequired': 'Please enter sandbox name',
  'PC.Pages.SystemConfigSandboxModal.nameMaxLength':
    'Sandbox name cannot exceed 100 characters',
  'PC.Pages.SystemConfigSandboxModal.host': 'Sandbox Base URL',
  'PC.Pages.SystemConfigSandboxModal.hostPlaceholder':
    'e.g. http://192.168.1.21',
  'PC.Pages.SystemConfigSandboxModal.hostRequired':
    'Please enter sandbox base URL',
  'PC.Pages.SystemConfigSandboxModal.hostMaxLength':
    'URL length cannot exceed 255 characters',
  'PC.Pages.SystemConfigSandboxModal.hostInvalid':
    'Please enter a valid URL including http:// or https://',
  'PC.Pages.SystemConfigSandboxModal.agentPort': 'Agent Port',
  'PC.Pages.SystemConfigSandboxModal.agentPortRequired':
    'Please enter Agent port',
  'PC.Pages.SystemConfigSandboxModal.vncPort': 'VNC Port',
  'PC.Pages.SystemConfigSandboxModal.vncPortRequired': 'Please enter VNC port',
  'PC.Pages.SystemConfigSandboxModal.fileServerPort': 'File Service Port',
  'PC.Pages.SystemConfigSandboxModal.fileServerPortRequired':
    'Please enter file service port',
  'PC.Pages.SystemConfigSandboxModal.apiKey': 'Communication Key (Optional)',
  'PC.Pages.SystemConfigSandboxModal.apiKeyPlaceholder':
    'Leave blank to disable communication key',
  'PC.Pages.SystemConfigSandboxModal.maxUsers': 'Maximum Concurrent Users',
  'PC.Pages.SystemConfigSandboxModal.maxUsersRequired':
    'Please enter maximum concurrent users',
  'PC.Pages.SystemConfigSandboxModal.maxUsersMax':
    'Maximum concurrent users cannot exceed 9999',
  'PC.Pages.SystemConfigSandboxConfig.pageTitle': 'Sandbox Configuration',
  'PC.Pages.SystemConfigSandboxConfig.connectivitySuccess':
    'Connectivity test passed, sandbox is reachable',
  'PC.Pages.SystemConfigSandboxConfig.connectivityFailed':
    'Connectivity test failed: {0}',
  'PC.Pages.SystemConfigSandboxConfig.connectionException':
    'Connection exception',
  'PC.Pages.SystemConfigSandboxConfig.disable': 'Disable',
  'PC.Pages.SystemConfigSandboxConfig.enable': 'Enable',
  'PC.Pages.SystemConfigSandboxConfig.toggleConfirmTitle': 'Confirm {0}',
  'PC.Pages.SystemConfigSandboxConfig.toggleConfirmContent':
    'Are you sure you want to {0} sandbox {1}?',
  'PC.Pages.SystemConfigSandboxConfig.toggleSuccess': '{0} succeeded',
  'PC.Pages.SystemConfigSandboxConfig.addSuccess': 'Added successfully',
  'PC.Pages.SystemConfigSandboxConfig.columnName': 'Sandbox Name',
  'PC.Pages.SystemConfigSandboxConfig.columnUsage': 'Usage',
  'PC.Pages.SystemConfigSandboxConfig.usagePercentInUse': '{0}% in use',
  'PC.Pages.SystemConfigSandboxConfig.columnOnlineStatus': 'Online Status',
  'PC.Pages.SystemConfigSandboxConfig.online': 'Online',
  'PC.Pages.SystemConfigSandboxConfig.offline': 'Offline',
  'PC.Pages.SystemConfigSandboxConfig.columnActiveStatus': 'Active Status',
  'PC.Pages.SystemConfigSandboxConfig.enabled': 'Enabled',
  'PC.Pages.SystemConfigSandboxConfig.disabled': 'Disabled',
  'PC.Pages.SystemConfigSandboxConfig.columnAction': 'Action',
  'PC.Pages.SystemConfigSandboxConfig.connectivityTest': 'Connectivity Test',
  'PC.Pages.SystemConfigSandboxConfig.edit': 'Edit',
  'PC.Pages.SystemConfigSandboxConfig.delete': 'Delete',
  'PC.Pages.SystemConfigSandboxConfig.deleteConfirmTitle': 'Confirm Delete',
  'PC.Pages.SystemConfigSandboxConfig.deleteConfirmContent':
    'Are you sure you want to delete this sandbox?',
  'PC.Pages.SystemConfigSandboxConfig.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemConfigSandboxConfig.addSandbox': 'Add Sandbox',
  'PC.Pages.SystemConfigSandboxConfig.globalConfig': 'Global Config',
  'PC.Pages.SystemConfigSandboxConfig.perUserMemory': 'Per-user Memory',
  'PC.Pages.SystemConfigSandboxConfig.perUserCpu': 'Per-user CPU Cores',
  'PC.Pages.SystemConfigSandboxConfig.unitGb': 'GB',
  'PC.Pages.SystemConfigSandboxConfig.unitCore': 'cores',
  'PC.Pages.SystemConfigSandboxConfig.totalSandboxCount': '{0} sandboxes total',
  'PC.Pages.SystemConfigSandboxConfig.onlineSandboxCount': '{0} online',
  'PC.Pages.SystemMenuBindUser.userNotFoundBySearch': 'No matching user found',
  'PC.Pages.SystemMenuBindUser.bindUserWithName': 'Bind User - {0}',
  'PC.Pages.SystemMenuBindUser.close': 'Close',
  'PC.Pages.SystemMenuBindUser.leftSearchPlaceholder':
    'Enter username, email, or phone number and press Enter to search',
  'PC.Pages.SystemMenuBindUser.rightSearchPlaceholder':
    'Search bound members by keyword',
  'PC.Pages.Error403.licenseExpired':
    'Sorry, your license authorization has expired',
  'PC.Pages.Error404.pageNotFound':
    'Sorry, the page you visited does not exist',
  'PC.Pages.HomeDrag.errorTitle': 'Drag feature is temporarily unavailable',
  'PC.Pages.HomeDrag.errorDescription': 'Please refresh the page and try again',
  'PC.Pages.HomeDrag.refreshPage': 'Refresh Page',
  'PC.Pages.HomeDrag.hoverCategory': 'Drag to reorder categories',
  'PC.Pages.HomeDrag.hoverAgent': 'Drag to reorder agents',
  'PC.Pages.HomeDrag.updatingSort': 'Updating sort order...',
  'PC.Pages.HomeDrag.sortSuccess': 'Sort order updated successfully',
  'PC.Pages.HomeDrag.sortFailed': 'Failed to update sort order, please retry',
  'PC.Pages.HomeDrag.unknownUser': 'Unknown user',
  'PC.Pages.HomeDrag.noDescription': 'No description',
  'PC.Pages.HomeDrag.agent': 'Agent',
  'PC.Pages.HomeDrag.agentAvatar': 'Agent avatar',
  'PC.Pages.HomeDrag.agentName': 'Agent name',
  'PC.Pages.HomeDrag.unnamedAgent': 'Unnamed agent',
  'PC.Pages.HomeDrag.from': 'From',
  'PC.Pages.HomeDrag.cancelCollect': 'Uncollect',
  'PC.Pages.HomeDrag.collect': 'Collect',
  'PC.Pages.HomeDrag.dragAgentTip': 'Drag agent cards to swap positions',
  'PC.Pages.HomeDrag.emptyExplore': 'No data, explore now',
  'PC.Pages.Home.noTenantInfo': 'Tenant information not found',
  'PC.Pages.Home.linkConfigError': 'Link address configuration error',
  'PC.Pages.AppDevFileOperatingMask.defaultTip':
    'File operation in progress, please wait...',
  'PC.Pages.AppDevImageViewer.previewPath': 'Image Preview: {0}',
  'PC.Pages.AppDevImageViewer.base64Tag': ' (Base64)',
  'PC.Components.NoMoreDivider.noMoreData': 'No more data',
  'PC.Components.WorkspaceSearch.placeholder': 'Please input search content',
  'PC.Components.CreatedMcpItem.avatarAlt': 'User avatar',
  'PC.Components.CreatedMcpItem.deployedAt': 'Deployed at {0}',
  'PC.Components.CreatedMcpTools.noDescription': 'No description',
  'PC.Components.CreatedMcpTools.added': 'Added',
  'PC.Components.CreatedMcpTools.add': 'Add',
  'PC.Components.CreatedPageItem.avatarAlt': 'User avatar',
  'PC.Components.CreatedPageItem.createdAt': 'Created at {0}',
  'PC.Components.CreatedPageItem.added': 'Added',
  'PC.Components.CreatedPageItem.add': 'Add',
  'PC.Components.Created.tabPlugin': 'Plugin',
  'PC.Components.Created.tabWorkflow': 'Workflow',
  'PC.Components.Created.tabKnowledge': 'Knowledge Base',
  'PC.Components.Created.tabTable': 'Data Table',
  'PC.Components.Created.tabAgent': 'Agent',
  'PC.Components.Created.tabMcp': 'MCP Service',
  'PC.Components.Created.tabPage': 'Page',
  'PC.Components.Created.tabSkill': 'Skill',
  'PC.Components.Created.all': 'All',
  'PC.Components.Created.libraryWithLabel': '{0} Library',
  'PC.Components.Created.collect': 'Favorites',
  'PC.Components.Created.officialOnlyWithLabel': 'Official {0} Only',
  'PC.Components.Created.currentSpaceAgent': 'Current Space Agents',
  'PC.Components.Created.document': 'Document',
  'PC.Components.Created.libraryDataTable': 'Library Data Table',
  'PC.Components.Created.customService': 'Custom Service',
  'PC.Components.Created.addTitle': 'Add',
  'PC.Components.Created.userAvatar': 'User avatar',
  'PC.Components.Created.publishedAt': 'Published at {0}',
  'PC.Components.Created.added': 'Added',
  'PC.Components.Created.add': 'Add',
  'PC.Components.Created.search': 'Search',
  'PC.Components.Created.createWithLabel': 'Create {0}',
  'PC.Components.Created.emptyWithSearch': 'No data found, please search again',
  'PC.Components.Created.empty': 'No data',
  'PC.Components.ChatInputHomeAtMentionIcon.tryMentionSkill':
    'Try @ to mention skills',
  'PC.Components.ChatInputHomeManualComponentItem.keywordNetwork': 'Network',
  'PC.Components.ChatInputHomeManualComponentItem.keywordSearch': 'Search',
  'PC.Components.ChatInputHomeManualComponentItem.keywordReasoning':
    'Reasoning',
  'PC.Components.ChatInputHomeManualComponentItem.keywordThinking': 'Thinking',
  'PC.Components.ChatInputHomeMentionPopup.tabAll': 'All',
  'PC.Components.ChatInputHomeMentionPopup.tabRecent': 'Recent',
  'PC.Components.ChatInputHomeMentionPopup.tabFavorite': 'Favorites',
  'PC.Components.ChatInputHomeMentionPopup.searchSkill': 'Search skills',
  'PC.Components.ChatInputHomeMentionPopup.loading': 'Loading...',
  'PC.Components.ChatInputHomeMentionPopup.emptyFavorite': 'No favorites yet',
  'PC.Components.ChatInputHomeMentionPopup.emptyNotFound':
    'No matching items found',
  'PC.Components.ChatInputHomeMentionPopup.loadingMore': 'Loading more...',
  'PC.Components.ChatInputHome.pastedImageFileName': 'pasted-image-{0}-{1}.png',
  'PC.Components.ChatInputHome.uploadFailedWithName': '{0} upload failed',
  'PC.Components.ChatInputHome.conversationDisabled':
    'Conversation is disabled',
  'PC.Components.ChatInputHome.enterQuestion': 'Please enter your question',
  'PC.Components.ChatInputHome.clickStopConversation':
    'Click to stop current conversation',
  'PC.Components.ChatInputHome.clickSendMessage': 'Click to send message',
  'PC.Components.ChatInputHome.stoppingTask': 'Stopping task...',
  'PC.Components.ChatInputHome.clickStopAgentTask': 'Click to stop agent task',
  'PC.Components.ChatInputHome.noActiveConversation': 'No active conversation',
  'PC.Components.ChatInputHome.stoppingConversation':
    'Stopping conversation...',
  'PC.Components.ChatInputHome.noAgentPermission': 'No permission to use agent',
  'PC.Components.ChatInputHome.agentComputerUnavailable':
    'The agent computer for this conversation is unavailable',
  'PC.Components.ChatInputHome.clearRecord': 'Clear conversation history',
  'PC.Components.ChatInputHome.uploadAttachment': 'Upload attachment',
  'PC.Components.ChatInputHome.switchToNormalMode': 'Switch to normal mode',
  'PC.Components.ChatInputHome.useAgentComputerTask':
    'Use my agent computer to execute tasks',
  'PC.Components.ChatInputHome.generatedByAiNotice':
    'Content is generated by AI, please review carefully',
  'PC.Components.ChatInputHomeMentionEditor.placeholderWithMention':
    'Type commands directly, use Shift+Enter for a new line and Enter to send; supports @ to mention skills and image paste.',
  'PC.Components.ChatInputHomeMentionEditor.placeholderWithoutMention':
    'Type commands directly, use Shift+Enter for a new line and Enter to send; supports image paste.',
  'PC.Pages.SkillDetailsMoreActionsMenu.importSkill': 'Import Skill',
  'PC.Pages.SkillDetailsMoreActionsMenu.fullscreenPreview':
    'Fullscreen Preview',
  'PC.Pages.SkillDetailsMoreActionsMenu.exportSkill': 'Export Skill',
  'PC.Pages.SkillDetailsHeader.published': 'Published',
  'PC.Pages.SkillDetailsHeader.updatesNotPublished': 'Updates not published',
  'PC.Pages.SkillDetailsHeader.publish': 'Publish',
  'PC.Pages.SkillDetails.actionPublish': 'Publish',
  'PC.Pages.SkillDetails.saveBeforeAction':
    'You have unsaved file changes. Please save before {0}.',
  'PC.Pages.SkillDetails.saveSuccess': 'Saved successfully',
  'PC.Pages.SkillDetails.unsavedTitle': 'Unsaved file changes',
  'PC.Pages.SkillDetails.unsavedLeaveMessage':
    'You have unsaved file changes. Save before leaving?',
  'PC.Pages.SkillDetails.saveAndLeave': 'Save and Leave',
  'PC.Pages.SkillDetails.leaveWithoutSaving': 'Leave Without Saving',
  'PC.Pages.SkillDetails.importSuccess': 'Imported successfully',
  'PC.Pages.SkillDetails.skillIdRequired': 'Skill ID is required',
  'PC.Pages.SkillDetails.spaceIdRequired': 'Space ID is required',
  'PC.Pages.SkillDetails.uploadSizeLimitExceeded':
    'The total upload file size cannot exceed 20MB',
  'PC.Pages.SkillDetails.uploadSuccess': 'Uploaded successfully',
  'PC.Pages.SkillDetails.invalidSkillIdForExport':
    'Skill ID is missing or invalid, cannot export',
  'PC.Pages.SkillDetails.exportFailed': 'Export failed',
  'PC.Pages.SkillDetails.exportSuccess': 'Export successful!',
  'PC.Pages.SkillDetails.confirmDeleteFile':
    'Are you sure you want to delete this file?',
  'PC.Pages.SkillDetails.fileNotFound':
    'File does not exist and cannot be deleted',
  'PC.Pages.SkillDetails.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SkillDetails.skillInfoMissing':
    'Skill information is missing, cannot create file',
  'PC.Pages.SkillDetails.actionEdit': 'Edit skill',
  'PC.Pages.SkillDetails.exporting': 'Exporting',
  'PC.Pages.ApiKeyFormModal.updateSuccess': 'Updated successfully',
  'PC.Pages.ApiKeyFormModal.createSuccess': 'Created successfully',
  'PC.Pages.ApiKeyFormModal.editTitle': 'Edit API Key',
  'PC.Pages.ApiKeyFormModal.createTitle': 'Create API Key',
  'PC.Pages.ApiKeyFormModal.keyName': 'Key Name',
  'PC.Pages.ApiKeyFormModal.keyNamePlaceholder':
    'e.g. production-environment-api',
  'PC.Pages.ApiKeyFormModal.enterKeyName': 'Please enter key name',
  'PC.Pages.ApiKeyFormModal.expireTime': 'Expire Time',
  'PC.Pages.ApiKeyFormModal.expireTimeTooltip': 'Leave blank for no expiration',
  'PC.Pages.ApiKeyFormModal.apiKey': 'API Key',
  'PC.Pages.ApiKeyFormModal.autoGenerated': 'Auto generated',
  'PC.Pages.ApiKeyFormModal.status': 'Status',
  'PC.Pages.ApiKeyFormModal.statusEnabled': 'Enabled',
  'PC.Pages.ApiKeyFormModal.statusDisabled': 'Disabled',
  'PC.Pages.ApiKeyStatsModal.apiName': 'API Name',
  'PC.Pages.ApiKeyStatsModal.apiPath': 'API Path',
  'PC.Pages.ApiKeyStatsModal.totalCalls': 'Total Calls',
  'PC.Pages.ApiKeyStatsModal.monthCalls': 'Calls This Month',
  'PC.Pages.ApiKeyStatsModal.todayCalls': 'Calls Today',
  'PC.Pages.ApiKeyStatsModal.actions': 'Actions',
  'PC.Pages.ApiKeyStatsModal.viewRecords': 'View Records',
  'PC.Pages.ApiKeyStatsModal.callStatsWithName': 'Call Stats - {0}',
  'PC.Pages.ApiKeyStatsModal.close': 'Close',
  'PC.Pages.ApiKeyLogsLogProTable.type': 'Type',
  'PC.Pages.ApiKeyLogsLogProTable.selectType': 'Please select type',
  'PC.Pages.ApiKeyLogsLogProTable.targetId': 'Target ID',
  'PC.Pages.ApiKeyLogsLogProTable.enterTargetId': 'Please enter target ID',
  'PC.Pages.ApiKeyLogsLogProTable.targetName': 'Target Name',
  'PC.Pages.ApiKeyLogsLogProTable.enterTargetName': 'Please enter target name',
  'PC.Pages.ApiKeyLogsLogProTable.requestId': 'Request ID',
  'PC.Pages.ApiKeyLogsLogProTable.enterRequestId': 'Please enter request ID',
  'PC.Pages.ApiKeyLogsLogProTable.conversationId': 'Conversation ID',
  'PC.Pages.ApiKeyLogsLogProTable.enterConversationId':
    'Please enter conversation ID',
  'PC.Pages.ApiKeyLogsLogProTable.inputContent': 'Input Content',
  'PC.Pages.ApiKeyLogsLogProTable.outputContent': 'Output Content',
  'PC.Pages.ApiKeyLogsLogProTable.enterContentByKeywords':
    'Separate multiple keywords with spaces, then enter content',
  'PC.Pages.ApiKeyLogsLogProTable.timeRange': 'Time Range',
  'PC.Pages.ApiKeyLogsLogProTable.inputToken': 'Input Token',
  'PC.Pages.ApiKeyLogsLogProTable.outputToken': 'Output Token',
  'PC.Pages.ApiKeyLogsLogProTable.requestTime': 'Request Time',
  'PC.Pages.ApiKeyLogsLogProTable.totalDuration': 'Total Duration',
  'PC.Pages.ApiKeyLogsLogProTable.queryFailed': 'Query failed',
  'PC.Pages.ApiKeyLogsLogProTable.recordMissingRequestId':
    'This record is missing requestId, details are unavailable',
  'PC.Pages.ApiKeyLogsLogProTable.actions': 'Actions',
  'PC.Pages.ApiKeyLogsLogProTable.detail': 'Detail',
  'PC.Pages.Chat.conversationIdMissingCreateFile':
    'Conversation ID is missing, cannot create file',
  'PC.Pages.Chat.confirmDeleteFile':
    'Are you sure you want to delete this file?',
  'PC.Pages.Chat.fileNotFoundDelete':
    'File does not exist and cannot be deleted',
  'PC.Pages.Chat.deleteSuccess': 'Deleted successfully',
  'PC.Pages.Chat.conversationIdMissingUpload':
    'Conversation ID is missing, cannot upload files',
  'PC.Pages.Chat.uploadSizeLimitExceeded':
    'The total upload file size cannot exceed {0}MB',
  'PC.Pages.Chat.uploadSuccess': 'Uploaded successfully',
  'PC.Pages.Chat.invalidConversationIdExport':
    'Conversation ID is missing or invalid, cannot export',
  'PC.Pages.Chat.exportFailed': 'Export failed',
  'PC.Pages.Chat.exportSuccess': 'Export successful!',
  'PC.Pages.Chat.expandNavigation': 'Expand navigation',
  'PC.Pages.Chat.newConversation': 'New conversation',
  'PC.Pages.Chat.viewAgentDetails': 'View agent details',
  'PC.Pages.Chat.openPreviewPage': 'Open preview page',
  'PC.Pages.Chat.closeFilePreview': 'Close file preview',
  'PC.Pages.Chat.openFilePreview': 'Open file preview',
  'PC.Pages.Chat.closeAgentDesktop': 'Close agent desktop',
  'PC.Pages.Chat.openAgentDesktop': 'Open agent desktop',
  'PC.Pages.Chat.loadingHistoryConversation': 'Loading conversation history',
  'PC.Pages.Chat.agentExecutingWait': 'Agent is executing, please wait',
  'PC.Pages.Chat.taskExecuting': 'Task in progress',
  'PC.Pages.Chat.leaveTaskWarning':
    'A task is still running. Leaving this page may interrupt it. Are you sure you want to leave?',
  'PC.Pages.Chat.confirmLeave': 'Leave anyway',
  'PC.Pages.Chat.noAgentPermission':
    'You do not have permission for this agent',
  'PC.Pages.Chat.copyTemplate': 'Copy template',
  'PC.Toast.UploadAvatar.invalidType':
    'Please upload JPG, JPEG, or PNG image files',
  'PC.Toast.UploadAvatar.invalidSize': 'Image size cannot exceed 2MB',
  'PC.Pages.SystemDashboard.resourceOverview': 'Resource Overview',
  'PC.Pages.SystemDashboard.newSession': 'New Sessions',
  'PC.Pages.SystemDashboard.sevenDayTrend': 'Seven-day New Session Trend',
  'PC.Pages.SystemDashboard.period7d': '7 Days',
  'PC.Pages.SystemDashboard.period30d': '30 Days',
  'PC.Pages.SystemDashboard.periodMonth': 'By Month',
  'PC.Pages.SystemDashboard.chartTooltipData': 'Data',
  'PC.Pages.SystemLog.runningLog': 'Running Log',
  'PC.Pages.SystemLog.operationLog': 'Operation Log',
  'PC.Pages.SystemTaskManage.pageTitle': 'Task Management',
  'PC.Pages.SystemTaskManage.selectTargetRequired': 'Please select {0}',
  'PC.Pages.SystemTaskCreateTimedTask.createSuccess':
    'Timed task created successfully',
  'PC.Pages.SystemTaskCreateTimedTask.updateSuccess':
    'Timed task updated successfully',
  'PC.Pages.SystemTaskCreateTimedTask.createTitle': 'Create Timed Task',
  'PC.Pages.SystemTaskCreateTimedTask.updateTitle': 'Update Timed Task',
  'PC.Pages.SystemTaskCreateTimedTask.timedPeriod': 'Timed Period',
  'PC.Pages.SystemTaskCreateTimedTask.taskName': 'Task Name',
  'PC.Pages.SystemTaskCreateTimedTask.enterTaskName': 'Please enter task name',
  'PC.Pages.SystemTaskCreateTimedTask.taskTarget': 'Task Target',
  'PC.Pages.SystemTaskCreateTimedTask.keepConversation': 'Keep Conversation',
  'PC.Pages.SystemTaskCreateTimedTask.keepConversationTooltip':
    'When selecting "No", a brand-new conversation is created for each task run',
  'PC.Pages.SystemTaskCreateTimedTask.selectKeepConversation':
    'Please select whether to keep conversation',
  'PC.Pages.SystemTaskCreateTimedTask.yes': 'Yes',
  'PC.Pages.SystemTaskCreateTimedTask.no': 'No',
  'PC.Pages.SystemTaskCreateTimedTask.taskContent': 'Task Content',
  'PC.Pages.SystemTaskCreateTimedTask.enterTaskContent':
    'Please enter task content',
  'PC.Pages.SystemTaskCreateTimedTask.taskContentPlaceholder':
    'Please enter the task information to execute. More details improve execution success rate.',
  'PC.Pages.SystemTaskCreateTimedTask.parameterConfig':
    'Parameter Configuration',
  'PC.Pages.SystemTaskCreateTimedTask.fillParameterConfig':
    'Please fill in parameter configuration',
  'PC.Pages.SystemTaskSelectTarget.addItem': 'Add {0}',
  'PC.Pages.SystemTaskSelectTargetFormItem.selectLabel': 'Please select {0}',
  'PC.Pages.SystemTaskSelectTargetFormItemTarget.delete': 'Delete',
  'PC.Pages.SystemTaskTimedPeriodSelector.enter': 'Please enter',
  'PC.Pages.SystemTaskTimedPeriodSelector.specificTime': 'Specific Time',
  'PC.Pages.SystemTaskTimedPeriodSelector.selectSpecificTime':
    'Please select specific time',
  'PC.Pages.SystemTaskTimedPeriodSelector.specificTimeMustBeFuture':
    'The specific time must be later than the current time',
  'PC.Pages.SystemTaskTimedPeriodSelector.selectDateTime':
    'Please select date and time',
  'PC.Pages.SystemTaskCreateTimedTask.specificTimeMustBeFuture':
    'The specific time must be later than the current time',
  'PC.Pages.SystemConfig.pageTitle': 'System Settings',
  'PC.Pages.SystemConfig.saveSuccess': 'Saved successfully',
  'PC.Pages.SystemConfigBaseFormItem.enterDomain': 'Please enter domain',
  'PC.Pages.SystemThemeConfig.pageTitle': 'Theme Configuration',
  'PC.Pages.SystemThemeConfig.saveConfig': 'Save Configuration',
  'PC.Pages.SystemThemeConfig.resetDefault': 'Reset Default',
  'PC.Pages.SystemThemeConfig.saveSuccess':
    'Theme configuration saved successfully',
  'PC.Pages.SystemThemeConfig.resetPreview':
    'Reset to default configuration (preview)',
  'PC.Pages.SystemThemeConfig.darkMode': 'Dark',
  'PC.Pages.SystemThemeConfig.lightMode': 'Light',
  'PC.Pages.SystemThemeConfig.autoSwitchedNavModePreview':
    'Automatically switched to {0} navigation (preview)',
  'PC.Pages.SystemThemeConfig.autoSwitchedBackgroundPreview':
    'Automatically switched to {0} to match {1} navigation (preview)',
  'PC.Pages.SystemTaskCenterProTable.statusExecuting': 'Executing',
  'PC.Pages.SystemTaskCenterProTable.statusCreatedWaiting':
    'Task created, waiting for execution',
  'PC.Pages.SystemTaskCenterProTable.statusSuccessWaitingNext':
    'Executed successfully, waiting for next run',
  'PC.Pages.SystemTaskCenterProTable.statusFailedWaitingNext':
    'Execution failed, waiting for next run',
  'PC.Pages.SystemTaskCenterProTable.statusEndedNoMore':
    'Ended, no further execution',
  'PC.Pages.SystemTaskCenterProTable.executeTaskSuccess':
    'Task executed successfully',
  'PC.Pages.SystemTaskCenterProTable.enableTaskSuccess':
    'Task enabled successfully',
  'PC.Pages.SystemTaskCenterProTable.disableTaskSuccess':
    'Task disabled successfully',
  'PC.Pages.SystemTaskCenterProTable.deleteTaskSuccess':
    'Task deleted successfully',
  'PC.Pages.SystemTaskCenterProTable.taskType': 'Task Type',
  'PC.Pages.SystemTaskCenterProTable.agent': 'Agent',
  'PC.Pages.SystemTaskCenterProTable.workflow': 'Workflow',
  'PC.Pages.SystemTaskCenterProTable.selectTaskType': 'Please select task type',
  'PC.Pages.SystemTaskCenterProTable.taskName': 'Task Name',
  'PC.Pages.SystemTaskCenterProTable.enterTaskName': 'Please enter task name',
  'PC.Pages.SystemTaskCenterProTable.taskTarget': 'Task Target',
  'PC.Pages.SystemTaskCenterProTable.taskStatus': 'Task Status',
  'PC.Pages.SystemTaskCenterProTable.executionTimes': 'Execution Count',
  'PC.Pages.SystemTaskCenterProTable.latestExecutionTime':
    'Latest Execution Time',
  'PC.Pages.SystemTaskCenterProTable.nextExecutionTime': 'Next Execution Time',
  'PC.Pages.SystemTaskCenterProTable.creator': 'Creator',
  'PC.Pages.SystemTaskCenterProTable.enterCreator': 'Please enter creator',
  'PC.Pages.SystemTaskCenterProTable.createdTime': 'Created Time',
  'PC.Pages.SystemTaskCenterProTable.actions': 'Actions',
  'PC.Pages.SystemTaskCenterProTable.manualExecute': 'Run Manually',
  'PC.Pages.SystemTaskCenterProTable.enable': 'Enable',
  'PC.Pages.SystemTaskCenterProTable.confirmEnableTask':
    'Confirm enabling this task?',
  'PC.Pages.SystemTaskCenterProTable.disable': 'Disable',
  'PC.Pages.SystemTaskCenterProTable.confirmDisableTask':
    'Confirm disabling this task?',
  'PC.Pages.SystemTaskCenterProTable.edit': 'Edit',
  'PC.Pages.SystemTaskCenterProTable.executionRecord': 'Execution Record',
  'PC.Pages.SystemTaskCenterProTable.delete': 'Delete',
  'PC.Pages.SystemTaskCenterProTable.confirmDeleteTask':
    'Confirm deleting this task?',
  'PC.Pages.SpaceTaskCreateTimedTask.createSuccess':
    'Timed task created successfully',
  'PC.Pages.SpaceTaskCreateTimedTask.updateSuccess':
    'Timed task updated successfully',
  'PC.Pages.SpaceTaskCreateTimedTask.createTitle': 'Create Timed Task',
  'PC.Pages.SpaceTaskCreateTimedTask.updateTitle': 'Update Timed Task',
  'PC.Pages.SpaceTaskCreateTimedTask.timedPeriod': 'Timed Period',
  'PC.Pages.SpaceTaskCreateTimedTask.taskName': 'Task Name',
  'PC.Pages.SpaceTaskCreateTimedTask.enterTaskName': 'Please enter task name',
  'PC.Pages.SpaceTaskCreateTimedTask.taskTarget': 'Task Target',
  'PC.Pages.SpaceTaskCreateTimedTask.keepConversation': 'Keep Conversation',
  'PC.Pages.SpaceTaskCreateTimedTask.keepConversationTooltip':
    'When selecting "No", a brand-new conversation is created for each task run',
  'PC.Pages.SpaceTaskCreateTimedTask.selectKeepConversation':
    'Please select whether to keep conversation',
  'PC.Pages.SpaceTaskCreateTimedTask.yes': 'Yes',
  'PC.Pages.SpaceTaskCreateTimedTask.no': 'No',
  'PC.Pages.SpaceTaskCreateTimedTask.taskContent': 'Task Content',
  'PC.Pages.SpaceTaskCreateTimedTask.enterTaskContent':
    'Please enter task content',
  'PC.Pages.SpaceTaskCreateTimedTask.taskContentPlaceholder':
    'Please enter the task information to execute. More details improve execution success rate.',
  'PC.Pages.SpaceTaskCreateTimedTask.parameterConfig':
    'Parameter Configuration',
  'PC.Pages.SpaceTaskCreateTimedTask.fillParameterConfig':
    'Please fill in parameter configuration',
  'PC.Pages.SpaceTaskSelectTarget.addItem': 'Add {0}',
  'PC.Pages.SpaceTaskSelectTargetFormItem.selectLabel': 'Please select {0}',
  'PC.Pages.SpaceTaskSelectTargetFormItemTarget.delete': 'Delete',
  'PC.Pages.SpaceTaskTimedPeriodSelector.enter': 'Please enter',
  'PC.Pages.SpaceTaskTimedPeriodSelector.specificTime': 'Specific Time',
  'PC.Pages.SpaceTaskTimedPeriodSelector.selectSpecificTime':
    'Please select specific time',
  'PC.Pages.SpaceTaskTimedPeriodSelector.specificTimeMustBeFuture':
    'The specific time must be later than the current time',
  'PC.Pages.SpaceTaskTimedPeriodSelector.selectDateTime':
    'Please select date and time',
  'PC.Pages.SpaceTaskCreateTimedTask.specificTimeMustBeFuture':
    'The specific time must be later than the current time',
  'PC.Pages.AppDevChatArea.chatTab': 'Chat',
  'PC.Pages.AppDevChatArea.designTab': 'Design',
  'PC.Pages.AppDevChatArea.dataTab': 'Data',
  'PC.Pages.AppDevFilePathHeader.modified': 'Modified',
  'PC.Pages.AppDevHeader.defaultProjectName': 'Project',
  'PC.Pages.AppDevHeader.projectId': 'Project ID: {0}',
  'PC.Pages.AppDevHeader.published': 'Published',
  'PC.Pages.AppDevHeader.lastUpdated': 'Last updated {0}',
  'PC.Pages.AppDevHeader.updatesNotPublished': 'Updates not published',
  'PC.Pages.AppDevHeader.versionHistory': 'Version History',
  'PC.Pages.AppDevHeader.publishing': 'Publishing...',
  'PC.Pages.AppDevHeader.publish': 'Publish',
  'PC.Pages.AppDevFileTreePanel.expand': 'Expand file tree',
  'PC.Pages.AppDevFileTreePanel.collapse': 'Collapse file tree',
  'PC.Pages.AppDevFileTreePanel.loadingTitle': 'Loading...',
  'PC.Pages.AppDevFileTreePanel.loadingDescription': 'Please wait',
  'PC.Pages.AppDevFileTreePanel.importProject': 'Import Project',
  'PC.Pages.AppDevFileTreeContextMenu.rename': 'Rename',
  'PC.Pages.AppDevFileTreeContextMenu.uploadFile': 'Upload File',
  'PC.Pages.AppDevFileTreeContextMenu.delete': 'Delete',
  'PC.Pages.AppDevFileTreeContextMenu.importProject': 'Import Project',
  'PC.Pages.AppDevPlanProcess.completed': 'Completed',
  'PC.Pages.AppDevPlanProcess.inProgress': 'In Progress',
  'PC.Pages.AppDevPlanProcess.partialFailed': 'Partially Failed',
  'PC.Pages.AppDevPlanProcess.pending': 'Pending',
  'PC.Pages.AppDevPlanProcess.executionPlanProgress':
    'Execution Plan ({0}/{1} completed)',
  'PC.Pages.SystemContentAgent.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemContentAgent.deleteFailed': 'Delete failed',
  'PC.Toast.SystemTargetAuthModal.authorized': 'Authorized successfully',
  'PC.Pages.SystemTargetAuthModal.roleTab': 'Role',
  'PC.Pages.SystemTargetAuthModal.userGroupTab': 'User Group',
  'PC.Pages.SystemTargetAuthModal.emptyPrefix': 'No data, please go to',
  'PC.Pages.SystemTargetAuthModal.roleManagement': 'Role Management',
  'PC.Pages.SystemTargetAuthModal.createRole': 'Create Role',
  'PC.Pages.SystemTargetAuthModal.userGroupManagement': 'User Group Management',
  'PC.Pages.SystemTargetAuthModal.createUserGroup': 'Create User Group',
  'PC.Pages.SystemTargetAuthModal.authorize': 'Authorize',
  'PC.Pages.SystemTargetAuthModal.authorizeWithName': 'Authorize - {0}',
  'PC.Pages.SystemTargetAuthModal.selectAll': 'Select All',
  'PC.Pages.SystemTargetAuthModal.clearAll': 'Clear All',
  'PC.Toast.SystemRoleFormModal.createSuccess': 'Role created successfully',
  'PC.Toast.SystemRoleFormModal.editSuccess': 'Role updated successfully',
  'PC.Pages.SystemRoleFormModal.roleSourceSystemBuiltIn': 'System Built-in',
  'PC.Pages.SystemRoleFormModal.roleSourceUserDefined': 'User Defined',
  'PC.Pages.SystemRoleFormModal.formValidateFailed': 'Form validation failed',
  'PC.Pages.SystemRoleFormModal.editTitle': 'Edit Role',
  'PC.Pages.SystemRoleFormModal.createTitle': 'Create Role',
  'PC.Pages.SystemRoleFormModal.save': 'Save',
  'PC.Pages.SystemRoleFormModal.create': 'Create',
  'PC.Pages.SystemRoleFormModal.roleName': 'Role Name',
  'PC.Pages.SystemRoleFormModal.roleNameRequired': 'Please enter role name',
  'PC.Pages.SystemRoleFormModal.roleNamePlaceholder': 'Please enter role name',
  'PC.Pages.SystemRoleFormModal.source': 'Source',
  'PC.Pages.SystemRoleFormModal.sourcePlaceholder': 'Please select source',
  'PC.Pages.SystemRoleFormModal.sort': 'Sort',
  'PC.Pages.SystemRoleFormModal.sortPlaceholder': 'Please enter sort order',
  'PC.Pages.SystemRoleFormModal.status': 'Status',
  'PC.Pages.SystemRoleFormModal.statusTooltip': 'Enable or disable role',
  'PC.Pages.SystemRoleFormModal.enabled': 'Enabled',
  'PC.Pages.SystemRoleFormModal.disabled': 'Disabled',
  'PC.Pages.SystemRoleFormModal.description': 'Description',
  'PC.Pages.SystemRoleFormModal.descriptionPlaceholder':
    'Please enter role description',
  'PC.Pages.SystemRunningLogDetailDrawer.title': 'Log Details',
  'PC.Pages.SystemRunningLogDetailDrawer.duration': 'Duration',
  'PC.Pages.SystemRunningLogDetailDrawer.messageId': 'Message ID:',
  'PC.Pages.SystemRunningLogDetailDrawer.calledComponents': 'Called Components',
  'PC.Pages.SystemRunningLogDetailDrawer.nodeDetails': 'Node Details',
  'PC.Pages.SystemRunningLogDetailDrawer.input': 'Input',
  'PC.Pages.SystemRunningLogDetailDrawer.output': 'Output',
  'PC.Pages.SystemRunningLogDetailDrawer.executionProcess': 'Execution Process',
  'PC.Pages.SystemRunningLogDetailDrawer.empty': 'No data',
  'PC.Pages.SystemRoleManage.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemRoleManage.deleteRoleTitle': 'Delete Role',
  'PC.Pages.SystemRoleManage.deleteRoleConfirm':
    'Are you sure to delete role "{0}"?',
  'PC.Pages.SystemRoleManage.sortUpdated': 'Sort order updated successfully',
  'PC.Pages.SystemRoleManage.columnSort': 'Sort',
  'PC.Pages.SystemRoleManage.columnRoleName': 'Role Name',
  'PC.Pages.SystemRoleManage.columnCode': 'Code',
  'PC.Pages.SystemRoleManage.columnDescription': 'Description',
  'PC.Pages.SystemRoleManage.columnStatus': 'Status',
  'PC.Pages.SystemRoleManage.statusTooltip': 'Enable or disable role',
  'PC.Pages.SystemRoleManage.builtInCannotDisable':
    'System built-in roles cannot be disabled',
  'PC.Pages.SystemRoleManage.enabled': 'Enabled',
  'PC.Pages.SystemRoleManage.disabled': 'Disabled',
  'PC.Pages.SystemRoleManage.columnAction': 'Action',
  'PC.Pages.SystemRoleManage.builtInCannotEdit':
    'System built-in roles cannot be edited',
  'PC.Pages.SystemRoleManage.noPermission': 'No permission for this resource',
  'PC.Pages.SystemRoleManage.builtInCannotDelete':
    'System built-in roles cannot be deleted',
  'PC.Pages.SystemRoleManage.edit': 'Edit',
  'PC.Pages.SystemRoleManage.delete': 'Delete',
  'PC.Pages.SystemRoleManage.bindUser': 'Bind User',
  'PC.Pages.SystemRoleManage.menuPermission': 'Menu Permission',
  'PC.Pages.SystemRoleManage.dataPermission': 'Data Permission',
  'PC.Pages.SystemRoleManage.pageTitle': 'Role Management',
  'PC.Pages.SystemRoleManage.addRole': 'Add Role',
  'PC.Pages.SystemRoleManage.emptyData': 'No role data',
  'PC.Toast.SystemUserGroupFormModal.createSuccess':
    'User group created successfully',
  'PC.Toast.SystemUserGroupFormModal.updateSuccess':
    'User group updated successfully',
  'PC.Pages.SystemUserGroupFormModal.sourceSystemBuiltIn': 'System Built-in',
  'PC.Pages.SystemUserGroupFormModal.sourceUserDefined': 'User Defined',
  'PC.Pages.SystemUserGroupFormModal.formValidateFailed':
    'Form validation failed',
  'PC.Pages.SystemUserGroupFormModal.editTitle': 'Edit User Group',
  'PC.Pages.SystemUserGroupFormModal.createTitle': 'Create User Group',
  'PC.Pages.SystemUserGroupFormModal.save': 'Save',
  'PC.Pages.SystemUserGroupFormModal.create': 'Create',
  'PC.Pages.SystemUserGroupFormModal.name': 'User Group Name',
  'PC.Pages.SystemUserGroupFormModal.nameRequired':
    'Please enter user group name',
  'PC.Pages.SystemUserGroupFormModal.namePlaceholder':
    'Please enter user group name',
  'PC.Pages.SystemUserGroupFormModal.source': 'Source',
  'PC.Pages.SystemUserGroupFormModal.sourcePlaceholder': 'Please select source',
  'PC.Pages.SystemUserGroupFormModal.sort': 'Sort',
  'PC.Pages.SystemUserGroupFormModal.sortPlaceholder':
    'Please enter sort order',
  'PC.Pages.SystemUserGroupFormModal.status': 'Status',
  'PC.Pages.SystemUserGroupFormModal.statusTip':
    'Enable or disable this user group',
  'PC.Pages.SystemUserGroupFormModal.enabled': 'Enabled',
  'PC.Pages.SystemUserGroupFormModal.disabled': 'Disabled',
  'PC.Pages.SystemUserGroupFormModal.description': 'Description',
  'PC.Pages.SystemUserGroupFormModal.descriptionPlaceholder':
    'Please enter user group description',
  'PC.Pages.SystemUserGroupManage.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemUserGroupManage.deleteTitle': 'Delete User Group',
  'PC.Pages.SystemUserGroupManage.deleteConfirm':
    'Are you sure to delete user group "{0}"?',
  'PC.Pages.SystemUserGroupManage.sortUpdated':
    'Sort order updated successfully',
  'PC.Pages.SystemUserGroupManage.columnSort': 'Sort',
  'PC.Pages.SystemUserGroupManage.columnName': 'User Group Name',
  'PC.Pages.SystemUserGroupManage.columnCode': 'Code',
  'PC.Pages.SystemUserGroupManage.columnDescription': 'Description',
  'PC.Pages.SystemUserGroupManage.columnStatus': 'Status',
  'PC.Pages.SystemUserGroupManage.statusTip':
    'Enable or disable this user group',
  'PC.Pages.SystemUserGroupManage.builtInCannotDisable':
    'System built-in user groups cannot be disabled',
  'PC.Pages.SystemUserGroupManage.enabled': 'Enabled',
  'PC.Pages.SystemUserGroupManage.disabled': 'Disabled',
  'PC.Pages.SystemUserGroupManage.columnAction': 'Action',
  'PC.Pages.SystemUserGroupManage.builtInCannotEdit':
    'System built-in user groups cannot be edited',
  'PC.Pages.SystemUserGroupManage.noPermission':
    'No permission for this resource',
  'PC.Pages.SystemUserGroupManage.builtInCannotDelete':
    'System built-in user groups cannot be deleted',
  'PC.Pages.SystemUserGroupManage.edit': 'Edit',
  'PC.Pages.SystemUserGroupManage.delete': 'Delete',
  'PC.Pages.SystemUserGroupManage.bindUser': 'Bind User',
  'PC.Pages.SystemUserGroupManage.menuPermission': 'Menu Permission',
  'PC.Pages.SystemUserGroupManage.dataPermission': 'Data Permission',
  'PC.Pages.SystemUserGroupManage.pageTitle': 'User Group Management',
  'PC.Pages.SystemUserGroupManage.add': 'Add User Group',
  'PC.Pages.SystemUserGroupManage.empty': 'No user-group data',
  'PC.Pages.SystemContentAgent.view': 'View',
  'PC.Pages.SystemContentAgent.authorize': 'Authorize',
  'PC.Pages.SystemContentAgent.delete': 'Delete',
  'PC.Pages.SystemContentAgent.deleteConfirmTitle':
    'Are you sure you want to delete {0}?',
  'PC.Pages.SystemContentAgent.deleteConfirmDescription':
    'This action cannot be undone and all related data will be permanently deleted.',
  'PC.Pages.SystemContentAgent.columnName': 'Name',
  'PC.Pages.SystemContentAgent.searchName': 'Please enter agent name',
  'PC.Pages.SystemContentAgent.columnDescription': 'Description',
  'PC.Pages.SystemContentAgent.columnCreator': 'Creator',
  'PC.Pages.SystemContentAgent.columnPublishStatus': 'Publish Status',
  'PC.Pages.SystemContentAgent.statusDeveloping': 'To Publish',
  'PC.Pages.SystemContentAgent.statusApplying': 'Pending Review',
  'PC.Pages.SystemContentAgent.statusPublished': 'Published',
  'PC.Pages.SystemContentAgent.statusRejected': 'Rejected',
  'PC.Pages.SystemContentAgent.columnCreated': 'Created Time',
  'PC.Pages.SystemContentAgent.columnAccessControl': 'Access Control',
  'PC.Pages.SystemContentAgent.accessControlTooltip':
    'When enabled, agents published to the system square require authorization before use.',
  'PC.Pages.SystemContentAgent.accessControlOff': 'Off',
  'PC.Pages.SystemContentAgent.accessControlOn': 'On',
  'PC.Pages.SystemContentAgent.columnAction': 'Action',
  'PC.Pages.SystemContentAgent.pageTitle': 'Agent Management',
  'PC.Pages.SystemContentDataTable.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemContentDataTable.deleteFailed': 'Delete failed',
  'PC.Pages.SystemContentDataTable.view': 'View',
  'PC.Pages.SystemContentDataTable.delete': 'Delete',
  'PC.Pages.SystemContentDataTable.deleteConfirmTitle':
    'Are you sure you want to delete {0}?',
  'PC.Pages.SystemContentDataTable.deleteConfirmDescription':
    'This action cannot be undone and all related data will be permanently deleted.',
  'PC.Pages.SystemContentDataTable.columnName': 'Name',
  'PC.Pages.SystemContentDataTable.searchName': 'Please enter data table name',
  'PC.Pages.SystemContentDataTable.columnDescription': 'Description',
  'PC.Pages.SystemContentDataTable.columnCreator': 'Creator',
  'PC.Pages.SystemContentDataTable.columnCreated': 'Created Time',
  'PC.Pages.SystemContentDataTable.columnAction': 'Action',
  'PC.Pages.SystemContentDataTable.pageTitle': 'Data Table Management',
  'PC.Pages.SystemContentKnowledgeBase.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemContentKnowledgeBase.deleteFailed': 'Delete failed',
  'PC.Pages.SystemContentKnowledgeBase.view': 'View',
  'PC.Pages.SystemContentKnowledgeBase.delete': 'Delete',
  'PC.Pages.SystemContentKnowledgeBase.deleteConfirmTitle':
    'Are you sure you want to delete {0}?',
  'PC.Pages.SystemContentKnowledgeBase.deleteConfirmDescription':
    'This action cannot be undone and all related data will be permanently deleted.',
  'PC.Pages.SystemContentKnowledgeBase.columnName': 'Name',
  'PC.Pages.SystemContentKnowledgeBase.searchName':
    'Please enter knowledge base name',
  'PC.Pages.SystemContentKnowledgeBase.columnDescription': 'Description',
  'PC.Pages.SystemContentKnowledgeBase.columnCreator': 'Creator',
  'PC.Pages.SystemContentKnowledgeBase.columnCreated': 'Created Time',
  'PC.Pages.SystemContentKnowledgeBase.columnAction': 'Action',
  'PC.Pages.SystemContentKnowledgeBase.pageTitle': 'Knowledge Base Management',
  'PC.Pages.SystemContentMcp.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemContentMcp.deleteFailed': 'Delete failed',
  'PC.Pages.SystemContentMcp.view': 'View',
  'PC.Pages.SystemContentMcp.delete': 'Delete',
  'PC.Pages.SystemContentMcp.deleteConfirmTitle':
    'Are you sure you want to delete {0}?',
  'PC.Pages.SystemContentMcp.deleteConfirmDescription':
    'This action cannot be undone and all related data will be permanently deleted.',
  'PC.Pages.SystemContentMcp.columnName': 'Name',
  'PC.Pages.SystemContentMcp.searchName': 'Please enter MCP name',
  'PC.Pages.SystemContentMcp.columnDescription': 'Description',
  'PC.Pages.SystemContentMcp.columnCreator': 'Creator',
  'PC.Pages.SystemContentMcp.columnCreated': 'Created Time',
  'PC.Pages.SystemContentMcp.columnAction': 'Action',
  'PC.Pages.SystemContentMcp.pageTitle': 'MCP Management',
  'PC.Pages.SystemContentPlugin.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemContentPlugin.deleteFailed': 'Delete failed',
  'PC.Pages.SystemContentPlugin.view': 'View',
  'PC.Pages.SystemContentPlugin.delete': 'Delete',
  'PC.Pages.SystemContentPlugin.deleteConfirmTitle':
    'Are you sure you want to delete {0}?',
  'PC.Pages.SystemContentPlugin.deleteConfirmDescription':
    'This action cannot be undone and all related data will be permanently deleted.',
  'PC.Pages.SystemContentPlugin.columnName': 'Name',
  'PC.Pages.SystemContentPlugin.searchName': 'Please enter plugin name',
  'PC.Pages.SystemContentPlugin.columnDescription': 'Description',
  'PC.Pages.SystemContentPlugin.columnCreator': 'Creator',
  'PC.Pages.SystemContentPlugin.columnCreated': 'Created Time',
  'PC.Pages.SystemContentPlugin.columnAction': 'Action',
  'PC.Pages.SystemContentPlugin.pageTitle': 'Plugin Management',
  'PC.Pages.SystemContentWorkflow.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemContentWorkflow.deleteFailed': 'Delete failed',
  'PC.Pages.SystemContentWorkflow.view': 'View',
  'PC.Pages.SystemContentWorkflow.delete': 'Delete',
  'PC.Pages.SystemContentWorkflow.deleteConfirmTitle':
    'Are you sure you want to delete {0}?',
  'PC.Pages.SystemContentWorkflow.deleteConfirmDescription':
    'This action cannot be undone and all related data will be permanently deleted.',
  'PC.Pages.SystemContentWorkflow.columnName': 'Name',
  'PC.Pages.SystemContentWorkflow.searchName': 'Please enter workflow name',
  'PC.Pages.SystemContentWorkflow.columnDescription': 'Description',
  'PC.Pages.SystemContentWorkflow.columnCreator': 'Creator',
  'PC.Pages.SystemContentWorkflow.columnCreated': 'Created Time',
  'PC.Pages.SystemContentWorkflow.columnAction': 'Action',
  'PC.Pages.SystemContentWorkflow.pageTitle': 'Workflow Management',
  'PC.Pages.SystemContentSkill.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemContentSkill.deleteFailed': 'Delete failed',
  'PC.Pages.SystemContentSkill.view': 'View',
  'PC.Pages.SystemContentSkill.delete': 'Delete',
  'PC.Pages.SystemContentSkill.deleteConfirmTitle':
    'Are you sure you want to delete {0}?',
  'PC.Pages.SystemContentSkill.deleteConfirmDescription':
    'This action cannot be undone and all related data will be permanently deleted.',
  'PC.Pages.SystemContentSkill.columnName': 'Name',
  'PC.Pages.SystemContentSkill.searchName': 'Please enter skill name',
  'PC.Pages.SystemContentSkill.columnDescription': 'Description',
  'PC.Pages.SystemContentSkill.columnCreator': 'Creator',
  'PC.Pages.SystemContentSkill.columnCreated': 'Created Time',
  'PC.Pages.SystemContentSkill.columnAction': 'Action',
  'PC.Pages.SystemContentSkill.pageTitle': 'Skill Management',
  'PC.Pages.SystemContentSpace.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemContentSpace.deleteFailed': 'Delete failed',
  'PC.Pages.SystemContentSpace.view': 'View',
  'PC.Pages.SystemContentSpace.delete': 'Delete',
  'PC.Pages.SystemContentSpace.deleteConfirmTitle':
    'Are you sure you want to delete {0}?',
  'PC.Pages.SystemContentSpace.deleteConfirmDescription':
    'This action cannot be undone and all related data will be permanently deleted.',
  'PC.Pages.SystemContentSpace.columnName': 'Name',
  'PC.Pages.SystemContentSpace.searchName': 'Please enter name',
  'PC.Pages.SystemContentSpace.columnDescription': 'Description',
  'PC.Pages.SystemContentSpace.columnCreator': 'Creator',
  'PC.Pages.SystemContentSpace.columnCreated': 'Created Time',
  'PC.Pages.SystemContentSpace.columnAction': 'Action',
  'PC.Pages.SystemContentSpace.pageTitle': 'Space Management',
  'PC.Pages.AppDevToolCallProcess.updatePrefix': '[Update] ',
  'PC.Pages.AppDevToolCallProcess.readFile': 'Read file {0}',
  'PC.Pages.AppDevToolCallProcess.editFile': 'Edit file {0}',
  'PC.Pages.AppDevToolCallProcess.createFile': 'Create file {0}',
  'PC.Pages.AppDevToolCallProcess.executeCommand': 'Execute command {0}',
  'PC.Pages.AppDevToolCallProcess.executeCommandDefault': 'Execute command',
  'PC.Pages.AppDevToolCallProcess.genericCall': '{0} {1}',
  'PC.Pages.AppDevToolCallProcess.toolCallDefault': 'Tool call',
  'PC.Pages.AppDevToolCallProcess.statusCompleted': 'Completed',
  'PC.Pages.AppDevToolCallProcess.statusInProgress': 'In Progress',
  'PC.Pages.AppDevToolCallProcess.statusFailed': 'Failed',
  'PC.Pages.AppDevToolCallProcess.statusPending': 'Pending',
  'PC.Pages.AppDevToolCallProcess.statusLabel': 'Status:',
  'PC.Pages.AppDevToolCallProcess.timeLabel': 'Time:',
  'PC.Pages.AppDevToolCallProcess.typeLabel': 'Type:',
  'PC.Pages.AppDevToolCallProcess.toolCallUpdateType': 'Tool call update',
  'PC.Pages.AppDevMessageAttachment.imageAlt': 'Image',
  'PC.Pages.AppDevMessageAttachment.fileTypeText': 'Text file',
  'PC.Pages.AppDevMessageAttachment.fileTypeDocument': 'Document',
  'PC.Pages.AppDevMessageAttachment.fileTypeAudio': 'Audio file',
  'PC.Pages.AppDevMessageAttachment.fileTypeFile': 'File',
  'PC.Pages.AppDevMessageAttachment.dataSourcePlugin': 'Plugin',
  'PC.Pages.AppDevMessageAttachment.dataSourceWorkflow': 'Workflow',
  'PC.Pages.AppDevMessageAttachment.dataSourceDefault': 'Data source',
  'PC.Pages.AppDevChatInput.placeholderAbility1':
    'Build websites, apps, and productivity tools in one sentence. You can extend capabilities with workflows, plugins, and other data resources.',
  'PC.Pages.AppDevChatInput.placeholderAbility2':
    'Use @ to mention files, folders, and data resources to improve prompt accuracy.',
  'PC.Pages.AppDevChatInput.pendingChangesError':
    'Please save or reset changes before sending a message',
  'PC.Pages.AppDevChatInput.maxPrototypeImageWarning':
    'You can upload at most {0} prototype images. Currently {1} images exist, and up to {2} more can be uploaded.',
  'PC.Pages.AppDevChatInput.pasteImageFileName': 'PastedImage-{0}-{1}.png',
  'PC.Pages.AppDevChatInput.uploadResultSummary':
    '{0} images uploaded successfully, {1} failed',
  'PC.Pages.AppDevChatInput.codingModel': 'Coding Model',
  'PC.Pages.AppDevChatInput.visionModelOptional': 'Vision Model (Optional)',
  'PC.Pages.AppDevChatInput.attachmentFiles': 'Attachments',
  'PC.Pages.AppDevChatInput.prototypeImages': 'Prototype Images',
  'PC.Pages.AppDevChatInput.mentionsTitle': '@ Mentions',
  'PC.Pages.AppDevChatInput.uploadFile': 'Upload Attachment',
  'PC.Pages.AppDevChatInput.uploadPrototypeImage': 'Upload Prototype Image',
  'PC.Pages.AppDevChatInput.model': 'Model',
  'PC.Pages.AppDevChatInput.stopping': 'Stopping...',
  'PC.Pages.AppDevChatInput.cancelAiTask': 'Cancel AI Task',
  'PC.Pages.AppDevMentionSelector.filesAndFolders': 'Files/Folders',
  'PC.Pages.AppDevMentionSelector.dataSources': 'Data Sources',
  'PC.Pages.AppDevMentionSelector.recent': 'Recent',
  'PC.Pages.AppDevMentionSelector.recommended': 'Recommended',
  'PC.Pages.AppDevMentionSelector.browseProjectFiles': 'Browse project files',
  'PC.Pages.AppDevMentionSelector.workflowPluginEtc':
    'Workflows, plugins, etc.',
  'PC.Pages.AppDevMentionSelector.noMatchedResult': 'No matching result found',
  'PC.Pages.AppDevMentionSelector.files': 'Files',
  'PC.Pages.AppDevMentionSelector.folders': 'Folders',
  'PC.Pages.AppDevMentionSelector.back': '\u2190 Back',
  'PC.Pages.AppDevMentionSelector.fileList': 'File List',
  'PC.Pages.AppDevMentionSelector.noMatchedFileOrFolder':
    'No matching file or folder found',
  'PC.Pages.AppDevMentionSelector.noDataSourcesFound': 'No data source found',
  'PC.Pages.AppDevMentionSelector.categoryItemCount': '{0} items',
  'PC.Pages.AppDevMentionSelector.dataSourceTypeWorkflow': 'Workflow',
  'PC.Pages.AppDevMentionSelector.dataSourceTypePlugin': 'Plugin',
  'PC.Pages.AppDevMentionSelector.dataSourceTypeReverseProxy': 'Reverse Proxy',
  'PC.Pages.AppDevMentionSelector.defaultDescPlugin':
    'Plugin resource for specific functions and services',
  'PC.Pages.AppDevMentionSelector.defaultDescWorkflow':
    'Workflow resource for complex business orchestration',
  'PC.Pages.AppDevMentionSelector.defaultDescReverseProxy':
    'Reverse proxy resource for network proxy services',
  'PC.Pages.AppDevMentionSelector.defaultDescDataSource': 'Data source',
  'PC.Pages.AntvX6Published.title': 'Publish Workflow',
  'PC.Pages.AntvX6Published.scope': 'Publish Scope',
  'PC.Pages.AntvX6Published.releaseNote': 'Release Note',
  'PC.Pages.AntvX6Published.releaseNotePlaceholder':
    'Describe the release details. If global scope is selected, this workflow can be referenced by all workspaces after approval.',
  'PC.Pages.AntvX6VersionAction.restoreSuccess':
    'Version restored successfully',
  'PC.Pages.AntvX6VersionAction.restore': 'Restore',
  'PC.Pages.AntvX6Data.input': 'Input',
  'PC.Pages.AntvX6Data.output': 'Output',
  'PC.Pages.AntvX6Header.published': 'Published',
  'PC.Pages.AntvX6Header.autoSavedAt': 'Auto-saved {0}',
  'PC.Pages.AntvX6Header.unpublished': 'Unpublished',
  'PC.Pages.AntvX6Header.updatedNotPublished': 'Updated but unpublished',
  'PC.Pages.AntvX6Header.saving': 'Saving...',
  'PC.Pages.AntvX6Header.saveFailed': 'Save failed',
  'PC.Pages.AntvX6Header.saveFailedCheckNetwork':
    'Save failed, please check network connection',
  'PC.Pages.AntvX6Header.retrySave': 'Retry save',
  'PC.Pages.AntvX6Header.unsavedChanges': 'Unsaved changes',
  'PC.Pages.AntvX6Header.saveNow': 'Save now',
  'PC.Pages.AntvX6Header.undoWithShortcut': 'Undo ({0})',
  'PC.Pages.AntvX6Header.redoWithShortcut': 'Redo ({0})',
  'PC.Pages.AntvX6Header.validating': 'Validating',
  'PC.Pages.AntvX6Header.publish': 'Publish',
  'PC.Pages.AntvX6NodePanel.loopContinueDescription':
    'Terminate current loop iteration and continue next iteration',
  'PC.Pages.AntvX6NodePanel.loopBreakDescription':
    'Immediately terminate current loop and exit loop body',
  'PC.Pages.AntvX6Skill.editParams': 'Edit Parameters',
  'PC.Pages.AntvX6Skill.remove': 'Remove',
  'PC.Pages.AntvX6Condition.branchTitle': 'Conditional Branch',
  'PC.Pages.AntvX6Condition.priority': 'Priority {0}',
  'PC.Pages.AntvX6Condition.if': 'If',
  'PC.Pages.AntvX6Condition.elseIf': 'Else If',
  'PC.Pages.AntvX6Condition.and': 'AND',
  'PC.Pages.AntvX6Condition.or': 'OR',
  'PC.Pages.AntvX6Condition.referencePlaceholder':
    'Please reference a parameter',
  'PC.Pages.AntvX6Condition.add': 'Add',
  'PC.Pages.AntvX6Condition.else': 'Else',
  'PC.Pages.AntvX6Stencil.nodeSelectorTitle': 'Node Selector',
  'PC.Pages.AntvX6ControlPanel.zoomIn10Percent': 'Zoom In 10%',
  'PC.Pages.AntvX6ControlPanel.zoomOut10Percent': 'Zoom Out 10%',
  'PC.Pages.AntvX6ControlPanel.fitCanvas': 'Fit to Canvas',
  'PC.Pages.AntvX6ControlPanel.zoom50Percent': 'Zoom to 50%',
  'PC.Pages.AntvX6ControlPanel.zoom100Percent': 'Zoom to 100%',
  'PC.Pages.AntvX6ControlPanel.zoom150Percent': 'Zoom to 150%',
  'PC.Pages.AntvX6ControlPanel.zoom200Percent': 'Zoom to 200%',
  'PC.Pages.AntvX6ControlPanel.addNode': 'Add Node',
  'PC.Pages.AntvX6ControlPanel.debug': 'Debug',
  'PC.Pages.AntvX6ControlPanel.testRun': 'Test Run',
  'PC.Pages.AntvX6ErrorList.title': 'Error List',
  'PC.Pages.AntvX6ErrorList.empty': 'N/A',
  'PC.Pages.AntvX6Graph.cannotQuickAddNodeForLoopBoundary':
    'Loop start and end nodes do not support quick add for downstream nodes',
  'PC.Pages.AntvX6Workflow.cannotNestLoop':
    'Do not add nested loop nodes inside a loop body',
  'PC.Pages.AntvX6Workflow.unsupportedComponentType':
    'This component type is not supported yet',
  'PC.Pages.AntvX6Workflow.loadingV3Version': 'Loading V3 version...',
  'PC.Pages.AntvX6NodeOperations.addNodeFailed': 'Failed to add node',
  'PC.Pages.AntvX6NodeOperations.addNodeNetworkError':
    'Network error, failed to add node',
  'PC.Pages.AntvX6NodeOperations.copyNodeFailed': 'Failed to copy node',
  'PC.Pages.AntvX6NodeOperations.copyNodeNetworkError':
    'Network error, failed to copy node',
  'PC.Pages.AntvX6NodeOperations.deleteNodeFailed': 'Failed to delete node',
  'PC.Pages.AntvX6History.noUndoAvailable': 'No operations available to undo',
  'PC.Pages.AntvX6History.noRedoAvailable': 'No operations available to redo',
  'PC.Pages.AntvX6Persistence.versionConflict': 'Version conflict',
  'PC.Pages.AntvX6Persistence.versionConflictTitle': 'Version conflict',
  'PC.Pages.AntvX6Persistence.versionConflictContent':
    'Workflow was updated in another window. Force overwrite?',
  'PC.Pages.AntvX6Persistence.forceOverwrite': 'Force overwrite',
  'PC.Pages.AntvX6Persistence.cancel': 'Cancel',
  'PC.Pages.AntvX6Persistence.saveFailed': 'Save failed',
  'PC.Pages.AntvX6Persistence.networkSaveFailed': 'Network error, save failed',
  'PC.Pages.AntvX6Params.nodeLlmName': 'Large Language Model',
  'PC.Pages.AntvX6Params.nodeLlmDescription':
    'Call the large language model and generate responses with variables and prompts',
  'PC.Pages.AntvX6Params.nodePluginName': 'Plugin',
  'PC.Pages.AntvX6Params.nodePluginDescription':
    'Bing search engine. Use it when you need unknown information, such as weather...',
  'PC.Pages.AntvX6Params.nodeWorkflowName': 'Workflow',
  'PC.Pages.AntvX6Params.nodeWorkflowDescription':
    'Bing search engine. Use it when you need unknown information, such as weather...',
  'PC.Pages.AntvX6Params.nodeMcpName': 'MCP',
  'PC.Pages.AntvX6Params.nodeMcpDescription': 'MCP component',
  'PC.Pages.AntvX6Params.groupBusinessLogic': 'Business Logic',
  'PC.Pages.AntvX6Params.nodeCodeName': 'Code',
  'PC.Pages.AntvX6Params.nodeCodeDescription':
    'Write code to process input variables and generate return values',
  'PC.Pages.AntvX6Params.nodeConditionName': 'Condition Branch',
  'PC.Pages.AntvX6Params.nodeConditionDescription':
    'Connect multiple downstream branches. Run only the branch whose condition is met. If none are met, run only the “Else” branch.',
  'PC.Pages.AntvX6Params.nodeIntentRecognitionName': 'Intent Recognition',
  'PC.Pages.AntvX6Params.nodeIntentRecognitionDescription':
    'Recognize user intent and match it to preset intent options.',
  'PC.Pages.AntvX6Params.nodeLoopName': 'Loop',
  'PC.Pages.AntvX6Params.nodeLoopDescription':
    'Repeat tasks by configured loop count and loop logic.',
  'PC.Pages.AntvX6Params.nodeLoopContinueName': 'Continue Loop',
  'PC.Pages.AntvX6Params.nodeLoopBreakName': 'Break Loop',
  'PC.Pages.AntvX6Params.groupKnowledgeData': 'Knowledge & Data',
  'PC.Pages.AntvX6Params.nodeKnowledgeBaseName': 'Knowledge Base',
  'PC.Pages.AntvX6Params.nodeKnowledgeBaseDescription':
    'Recall the best matched information from selected knowledge sources based on input variables',
  'PC.Pages.AntvX6Params.nodeVariableName': 'Variable',
  'PC.Pages.AntvX6Params.nodeVariableDescription':
    'Read and write variables in the project. Variable names must match project variables.',
  'PC.Pages.AntvX6Params.nodeVariableAggregationName': 'Variable Aggregation',
  'PC.Pages.AntvX6Params.nodeVariableAggregationDescription':
    'Aggregate multiple branches or variables into grouped outputs',
  'PC.Pages.AntvX6Params.nodeLongTermMemoryName': 'Long-Term Memory',
  'PC.Pages.AntvX6Params.nodeLongTermMemoryDescription':
    'Call long-term memory to retrieve user personalization data',
  'PC.Pages.AntvX6Params.groupDataTable': 'Data Table',
  'PC.Pages.AntvX6Params.nodeTableDataAddName': 'Add Data',
  'PC.Pages.AntvX6Params.nodeTableDataAddDescription':
    'Write data to the selected data table',
  'PC.Pages.AntvX6Params.nodeTableDataDeleteName': 'Delete Data',
  'PC.Pages.AntvX6Params.nodeTableDataDeleteDescription':
    'Delete data from the selected data table by specified ID',
  'PC.Pages.AntvX6Params.nodeTableDataUpdateName': 'Update Data',
  'PC.Pages.AntvX6Params.nodeTableDataUpdateDescription':
    'Update data in the selected data table by specified conditions',
  'PC.Pages.AntvX6Params.nodeTableDataQueryName': 'Query Data',
  'PC.Pages.AntvX6Params.nodeTableDataQueryDescription':
    'Query data in the selected data table by specified conditions',
  'PC.Pages.AntvX6Params.nodeTableSqlName': 'Custom SQL',
  'PC.Pages.AntvX6Params.nodeTableSqlDescription':
    'Supports query control on data tables. Users can query data submitted by other users, controlled by developers.',
  'PC.Pages.AntvX6Params.groupComponentTool': 'Components & Tools',
  'PC.Pages.AntvX6Params.nodeQaName': 'Q&A',
  'PC.Pages.AntvX6Params.nodeQaDescription':
    'Support asking users questions in intermediate steps',
  'PC.Pages.AntvX6Params.nodeTextProcessingName': 'Text Processing',
  'PC.Pages.AntvX6Params.nodeTextProcessingDescription':
    'Process formats of multiple string-type variables',
  'PC.Pages.AntvX6Params.nodeDocumentExtractionName': 'Document Extraction',
  'PC.Pages.AntvX6Params.nodeDocumentExtractionDescription':
    'Extract document content. Supported file types: txt, markdown, pdf, html, xlsx, xls, docx, csv, md, htm',
  'PC.Pages.AntvX6Params.nodeHttpRequestName': 'HTTP Request',
  'PC.Pages.AntvX6Params.nodeHttpRequestDescription':
    'Configure HTTP requests to call existing services',
  'PC.Pages.AntvX6Params.groupOutput': 'Output',
  'PC.Pages.AntvX6Params.nodeProcessOutputName': 'Process Output',
  'PC.Pages.AntvX6Params.nodeProcessOutputDescription':
    'Support intermediate message output in both stream and non-stream modes',
  'PC.Pages.AntvX6Params.modelTypeTitleGeneration': 'Title Generation',
  'PC.Pages.AntvX6Params.cycleArrayLoop': 'Loop by Array',
  'PC.Pages.AntvX6Params.cycleSpecifyTimesLoop': 'Loop by Count',
  'PC.Pages.AntvX6Params.cycleInfiniteLoop': 'Infinite Loop',
  'PC.Pages.AntvX6Params.inputVariableName': 'Variable Name',
  'PC.Pages.AntvX6Params.inputVariableNameRequired':
    'Please enter variable name',
  'PC.Pages.AntvX6Params.selectType': 'Select Type',
  'PC.Pages.AntvX6Params.inputVariableType': 'Variable Type',
  'PC.Pages.AntvX6Params.inputVariableTypeRequired':
    'Please select variable type',
  'PC.Pages.AntvX6Params.description': 'Description',
  'PC.Pages.AntvX6Params.descriptionRequired': 'Please enter description',
  'PC.Pages.AntvX6Params.paramName': 'Parameter Name',
  'PC.Pages.AntvX6Params.paramNameRequired': 'Please enter parameter name',
  'PC.Pages.AntvX6Params.inputOrReferenceParamValue':
    'Input or reference parameter value',
  'PC.Pages.AntvX6Params.paramValue': 'Parameter Value',
  'PC.Pages.AntvX6Params.paramValueRequired': 'Please enter parameter value',
  'PC.Pages.AntvX6Params.inputParamValue': 'Input Parameter Value',
  'PC.Pages.AntvX6Params.intentDescriptionRequired':
    'Please enter user intent description',
  'PC.Pages.AntvX6Params.inputOrReferenceVariableValue':
    'Input or reference variable value',
  'PC.Pages.AntvX6Params.variableValue': 'Variable Value',
  'PC.Pages.AntvX6Params.variableValueRequired': 'Please enter variable value',
  'PC.Pages.AntvX6Params.resourceWorkflow': 'Resource Workflows',
  'PC.Pages.AntvX6Params.officialExample': 'Official Examples',
  'PC.Pages.AntvX6Params.operatorEqual': 'Equals',
  'PC.Pages.AntvX6Params.operatorNotEqual': 'Not Equals',
  'PC.Pages.AntvX6Params.operatorGreaterThan': 'Greater Than',
  'PC.Pages.AntvX6Params.operatorGreaterThanOrEqual': 'Greater Than or Equal',
  'PC.Pages.AntvX6Params.operatorLessThan': 'Less Than',
  'PC.Pages.AntvX6Params.operatorLessThanOrEqual': 'Less Than or Equal',
  'PC.Pages.AntvX6Params.operatorLengthGreaterThan': 'Length Greater Than',
  'PC.Pages.AntvX6Params.operatorLengthGreaterThanOrEqual':
    'Length Greater Than or Equal',
  'PC.Pages.AntvX6Params.operatorLengthLessThan': 'Length Less Than',
  'PC.Pages.AntvX6Params.operatorLengthLessThanOrEqual':
    'Length Less Than or Equal',
  'PC.Pages.AntvX6Params.operatorContains': 'Contains',
  'PC.Pages.AntvX6Params.operatorNotContains': 'Not Contains',
  'PC.Pages.AntvX6Params.operatorMatchRegex': 'Regex Match',
  'PC.Pages.AntvX6Params.operatorIsNull': 'Is Null',
  'PC.Pages.AntvX6Params.operatorNotNull': 'Not Null',
  'PC.Pages.AntvX6Params.operatorIn': 'In',
  'PC.Pages.AntvX6Params.operatorNotIn': 'Not In',
  'PC.Pages.SystemDashboard.pageTitle': 'System Overview',
  'PC.Pages.SystemDashboard.totalUsers': 'Total Users',
  'PC.Pages.SystemDashboard.todayNewUsers': 'Today New Users',
  'PC.Pages.SystemDashboard.todayVisits': 'Today Visits',
  'PC.Pages.SystemDashboard.last30DaysVisits': '30-Day Total Visits',
  'PC.Pages.SystemDashboard.resourceSpace': 'Space',
  'PC.Pages.SystemDashboard.resourceAgent': 'Agent',
  'PC.Pages.SystemDashboard.resourceKnowledgeBase': 'Knowledge Base',
  'PC.Pages.SystemDashboard.resourceWorkflow': 'Workflow',
  'PC.Pages.SystemDashboard.resourceDataTable': 'Data Table',
  'PC.Pages.SystemDashboard.resourceWebApplication': 'Web Application',
  'PC.Pages.SystemDashboard.resourceModel': 'Model',
  'PC.Pages.SystemDashboard.resourcePlugin': 'Plugin',
  'PC.Pages.SystemDashboard.resourceSkill': 'Skill',
  'PC.Pages.SystemDashboard.totalConversations': 'Total Conversations',
  'PC.Pages.SystemDashboard.todayNewConversations': 'Today New Conversations',
  'PC.Pages.SystemDashboard.userTrendTitle': 'User Growth Trend',
  'PC.Pages.SystemDashboard.userTrendTooltip': 'New Users',
  'PC.Pages.SystemDashboard.visitTrendTitle': '7-Day Visit Trend',
  'PC.Pages.SystemDashboard.visitTrendTooltip': 'Visits',
  'PC.Pages.SystemDashboard.last7Days': '7 Days',
  'PC.Pages.SystemContentWebApplication.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemContentWebApplication.deleteFailed': 'Delete failed',
  'PC.Pages.SystemContentWebApplication.view': 'View',
  'PC.Pages.SystemContentWebApplication.authorize': 'Authorize',
  'PC.Pages.SystemContentWebApplication.delete': 'Delete',
  'PC.Pages.SystemContentWebApplication.deleteConfirmTitle':
    'Are you sure you want to delete {0}?',
  'PC.Pages.SystemContentWebApplication.deleteConfirmDescription':
    'This action cannot be undone and all related data will be permanently deleted.',
  'PC.Pages.SystemContentWebApplication.columnName': 'Name',
  'PC.Pages.SystemContentWebApplication.searchName':
    'Please enter web application name',
  'PC.Pages.SystemContentWebApplication.columnDescription': 'Description',
  'PC.Pages.SystemContentWebApplication.columnCreator': 'Creator',
  'PC.Pages.SystemContentWebApplication.columnPublishStatus': 'Publish Status',
  'PC.Pages.SystemContentWebApplication.statusDeveloping': 'To Publish',
  'PC.Pages.SystemContentWebApplication.statusApplying': 'Pending Review',
  'PC.Pages.SystemContentWebApplication.statusPublished': 'Published',
  'PC.Pages.SystemContentWebApplication.statusRejected': 'Rejected',
  'PC.Pages.SystemContentWebApplication.columnCreated': 'Created Time',
  'PC.Pages.SystemContentWebApplication.columnAccessControl': 'Access Control',
  'PC.Pages.SystemContentWebApplication.accessControlTooltip':
    'When enabled, web applications published to the system square require authorization before use.',
  'PC.Pages.SystemContentWebApplication.accessControlOff': 'Off',
  'PC.Pages.SystemContentWebApplication.accessControlOn': 'On',
  'PC.Pages.SystemContentWebApplication.columnAction': 'Action',
  'PC.Pages.SystemContentWebApplication.pageTitle':
    'Web Application Management',
  'PC.Pages.SystemOperationLog.columnType': 'Type',
  'PC.Pages.SystemOperationLog.placeholderType': 'Please select type',
  'PC.Pages.SystemOperationLog.columnActionType': 'Action Type',
  'PC.Pages.SystemOperationLog.placeholderActionType':
    'Please select action type',
  'PC.Pages.SystemOperationLog.columnObjectName': 'Object Name',
  'PC.Pages.SystemOperationLog.placeholderObjectName':
    'Please enter object name',
  'PC.Pages.SystemOperationLog.columnObjectSubtype': 'Object Subtype',
  'PC.Pages.SystemOperationLog.placeholderObjectSubtype':
    'Please enter object subtype',
  'PC.Pages.SystemOperationLog.columnRequestParams': 'Request Params',
  'PC.Pages.SystemOperationLog.placeholderRequestParams':
    'Separate keywords with spaces',
  'PC.Pages.SystemOperationLog.columnCreator': 'Creator',
  'PC.Pages.SystemOperationLog.placeholderCreator': 'Please enter username',
  'PC.Pages.SystemOperationLog.columnTimeRange': 'Time Range',
  'PC.Pages.SystemOperationLog.columnCreated': 'Created Time',
  'PC.Pages.SystemOperationLog.queryFailed': 'Query failed',
  'PC.Pages.SystemOperationLog.missingRequestIdForDetail':
    'The record has no requestId. Details cannot be viewed.',
  'PC.Pages.SystemOperationLog.columnAction': 'Action',
  'PC.Pages.SystemOperationLog.detail': 'Detail',
  'PC.Pages.SystemOperationLog.copySuccess': 'Copied successfully',
  'PC.Pages.SystemOperationLog.detailTitle': 'Log Detail',
  'PC.Pages.SystemOperationLog.basicInfo': 'Basic Information',
  'PC.Pages.SystemOperationLog.noData': 'No data',
  'PC.Pages.AppDevChatArea.agentTaskCancelled': 'Agent task cancelled',
  'PC.Pages.AppDevChatArea.cancelAgentTaskFailed':
    'Failed to cancel Agent task: {0}',
  'PC.Pages.AppDevChatArea.unknownError': 'Unknown error',
  'PC.Pages.AppDevChatArea.noPermissionForAiChat':
    'You do not have permission to use AI chat',
  'PC.Pages.AppDevChatArea.sendMessageFailed': 'Failed to send message',
  'PC.Pages.AppDevChatArea.thinking': 'Thinking...',
  'PC.Pages.AppDevChatArea.messageSendFailed': 'Message send failed',
  'PC.Pages.AppDevChatArea.aiThinkingProcess': 'AI Thinking Process',
  'PC.Pages.AppDevChatArea.dataResources': 'Data Resources',
  'PC.Pages.AppDevChatArea.addDataResource': 'Add Data Resource',
  'PC.Pages.AppDevChatArea.loadingHistorySessions': 'Loading history sessions',
  'PC.Pages.AppDevChatArea.loadingDescription': 'Please wait...',
  'PC.Pages.AppDevChatArea.startNewConversation': 'Start a New Conversation',
  'PC.Pages.AppDevChatArea.startNewConversationDescription':
    'Ask the AI assistant to start your project development',
  'PC.Pages.AppDevChatArea.autoFixingProgress':
    '({0}/{1}) Trying automatic fixes...',
  'PC.Pages.AppDevChat.toolCall': 'Tool call',
  'PC.Pages.AppDevChat.toolCallUpdate': 'Tool call update',
  'PC.Pages.AppDevChat.errorMessageTitle': 'Error',
  'PC.Pages.AppDevChat.stopAgentAndRestartDialog':
    'Service exception. Stop Agent service and restart the conversation.',
  'PC.Pages.AppDevChat.agentServiceStopped': 'Agent service stopped',
  'PC.Pages.AppDevChat.stopAgentServiceFailedWithReason':
    'Failed to stop Agent service: {0}',
  'PC.Pages.AppDevChat.stopAgentServiceFailed': 'Failed to stop Agent service',
  'PC.Pages.AppDevChat.agentServiceRunningDetected':
    'A background Agent service is running',
  'PC.Pages.AppDevChat.stopRunningAgentServiceConfirm':
    'Stop the currently running Agent service?',
  'PC.Pages.AppDevChat.sendCancelled': 'Send cancelled',
  'PC.Pages.AppDevChat.serviceExceptionTryLater':
    'Service exception, please try again later',
  'PC.Pages.AppDevChat.aiAssistantConnectionFailed':
    'AI assistant connection failed',
  'PC.Pages.AppDevChat.inputMessageRequired': 'Please enter a message',
  'PC.Pages.AppDevDevLogConsole.clickToAddToChat': 'Click to add to chat',
  'PC.Pages.AppDevDevLogConsole.headerTitle': 'Dev Server Logs',
  'PC.Pages.AppDevDevLogConsole.latestLogsContainErrors':
    'Latest logs contain errors',
  'PC.Pages.AppDevDevLogConsole.quickIssueFix': 'Quick issue fix',
  'PC.Pages.AppDevDevLogConsole.refreshLogs': 'Refresh logs',
  'PC.Pages.AppDevDevLogConsole.clearLogs': 'Clear logs',
  'PC.Pages.AppDevDevLogConsole.closeLogConsole': 'Close log console',
  'PC.Pages.AppDevDevLogConsole.loadingLogs': 'Loading logs...',
  'PC.Pages.AppDevDevLogConsole.noLogData': 'No log data',
  'PC.Pages.AppDevContentViewer.loadingFileContentTitle':
    'Loading file content',
  'PC.Pages.AppDevContentViewer.loadingDescription': 'Please wait...',
  'PC.Pages.AppDevContentViewer.loadFileFailedTitle': 'Failed to load file',
  'PC.Pages.AppDevContentViewer.retry': 'Retry',
  'PC.Pages.AppDevContentViewer.noSelectedFileTitle': 'No file selected',
  'PC.Pages.AppDevContentViewer.noSelectedFileDescription':
    'Please select a file from the left file tree to preview',
  'PC.Pages.AppDevContentViewer.unsupportedFileTypeTitle':
    'Cannot preview this file type',
  'PC.Pages.AppDevContentViewer.unsupportedFileTypeDescription':
    'Preview is not supported for {0} files.',
  'PC.Pages.AppDevContentViewer.previewDisabledDescription':
    'Please restore or switch to the latest version to preview',
  'PC.Pages.AppDevDesignViewer.saveOrResetBeforeAddToChat':
    'Please save or reset changes before adding selected elements to chat',
  'PC.Pages.AntvX6ExceptionItem.title': 'Exception Handling',
  'PC.Pages.AntvX6ExceptionItem.titleTooltip':
    'Configure timeout, retries, and exception handling mode. After streaming output starts, exceptions cannot trigger retries or jump to exception branches.',
  'PC.Pages.AntvX6ExceptionItem.timeoutLabel': 'Timeout',
  'PC.Pages.AntvX6ExceptionItem.timeoutTooltip':
    'Set the maximum waiting time for node execution',
  'PC.Pages.AntvX6ExceptionItem.timeoutRequired': 'Please enter timeout',
  'PC.Pages.AntvX6ExceptionItem.retryCountLabel': 'Retry Count',
  'PC.Pages.AntvX6ExceptionItem.noRetry': 'No Retry',
  'PC.Pages.AntvX6ExceptionItem.retryOnce': '1 time',
  'PC.Pages.AntvX6ExceptionItem.retryTwice': '2 times',
  'PC.Pages.AntvX6ExceptionItem.retryThrice': '3 times',
  'PC.Pages.AntvX6ExceptionItem.handleTypeLabel': 'Exception Handling',
  'PC.Pages.AntvX6ExceptionItem.interruptFlow': 'Interrupt Flow',
  'PC.Pages.AntvX6ExceptionItem.returnSpecificContent':
    'Return Specific Content',
  'PC.Pages.AntvX6ExceptionItem.executeExceptionFlow': 'Execute Exception Flow',
  'PC.Pages.AntvX6ExceptionItem.customReturnContent': 'Custom Return Content',
  'PC.Pages.AntvX6ExceptionItem.customReturnContentRequired':
    'Please enter custom return content',
  'PC.Pages.AntvX6ExceptionItem.validJsonRequired': 'Please enter valid JSON',
  'PC.Pages.SystemRunningLogTable.columnType': 'Type',
  'PC.Pages.SystemRunningLogTable.targetTypeAgent': 'Agent',
  'PC.Pages.SystemRunningLogTable.targetTypePlugin': 'Plugin',
  'PC.Pages.SystemRunningLogTable.targetTypeWorkflow': 'Workflow',
  'PC.Pages.SystemRunningLogTable.placeholderType': 'Please select type',
  'PC.Pages.SystemRunningLogTable.columnObjectId': 'Object ID',
  'PC.Pages.SystemRunningLogTable.placeholderObjectId':
    'Please enter object ID',
  'PC.Pages.SystemRunningLogTable.columnObjectName': 'Object Name',
  'PC.Pages.SystemRunningLogTable.placeholderObjectName':
    'Please enter object name',
  'PC.Pages.SystemRunningLogTable.columnRequestId': 'Request ID',
  'PC.Pages.SystemRunningLogTable.placeholderRequestId':
    'Please enter request ID',
  'PC.Pages.SystemRunningLogTable.columnUserId': 'User ID',
  'PC.Pages.SystemRunningLogTable.placeholderUserIdIntegerOnly':
    'Please enter user ID. Only integers are supported',
  'PC.Pages.SystemRunningLogTable.columnUserName': 'User Name',
  'PC.Pages.SystemRunningLogTable.placeholderUserName': 'Please enter username',
  'PC.Pages.SystemRunningLogTable.columnConversationId': 'Conversation ID',
  'PC.Pages.SystemRunningLogTable.placeholderConversationId':
    'Please enter conversation ID',
  'PC.Pages.SystemRunningLogTable.columnInput': 'Input',
  'PC.Pages.SystemRunningLogTable.columnOutput': 'Output',
  'PC.Pages.SystemRunningLogTable.placeholderKeywords':
    'Separate keywords with spaces',
  'PC.Pages.SystemRunningLogTable.columnTimeRange': 'Time Range',
  'PC.Pages.SystemRunningLogTable.columnInputToken': 'Input Token',
  'PC.Pages.SystemRunningLogTable.columnOutputToken': 'Output Token',
  'PC.Pages.SystemRunningLogTable.columnRequestTime': 'Request Time',
  'PC.Pages.SystemRunningLogTable.columnElapsedTime': 'Elapsed Time',
  'PC.Pages.SystemRunningLogTable.queryFailed': 'Query failed',
  'PC.Pages.SystemRunningLogTable.missingRequestIdForDetail':
    'The record has no requestId. Details cannot be viewed.',
  'PC.Pages.SystemRunningLogTable.columnAction': 'Action',
  'PC.Pages.SystemRunningLogTable.detail': 'Detail',
  'PC.Pages.AppDevEditorHeaderRight.switchVersionButton': 'Switch to v{0}',
  'PC.Pages.AppDevEditorHeaderRight.cancel': 'Cancel',
  'PC.Pages.AppDevEditorHeaderRight.devServerConnected':
    'Development server connected',
  'PC.Pages.AppDevEditorHeaderRight.loading': 'Loading...',
  'PC.Pages.AppDevEditorHeaderRight.starting': 'Starting...',
  'PC.Pages.AppDevEditorHeaderRight.restarting': 'Restarting...',
  'PC.Pages.AppDevEditorHeaderRight.importing': 'Importing...',
  'PC.Pages.AppDevEditorHeaderRight.lastUpdated': 'Last updated: {0}',
  'PC.Pages.AppDevEditorHeaderRight.closeLog': 'Close log',
  'PC.Pages.AppDevEditorHeaderRight.viewLog': 'View log',
  'PC.Pages.AppDevEditorHeaderRight.currentTag': 'Current',
  'PC.Pages.AppDevEditorHeaderRight.menuImportProject': 'Import Project',
  'PC.Pages.AppDevEditorHeaderRight.menuRestartServer': 'Restart Server',
  'PC.Pages.AppDevEditorHeaderRight.menuFullscreenPreview':
    'Fullscreen Preview',
  'PC.Pages.AppDevEditorHeaderRight.menuExportProject': 'Export Project',
  'PC.Pages.AppDevEditorHeaderRight.refreshPreview': 'Refresh Preview',
  'PC.Pages.AntvX6CommonNode.columnParamName': 'Parameter Name',
  'PC.Pages.AntvX6CommonNode.columnVariableValue': 'Variable Value',
  'PC.Pages.AntvX6CommonNode.fieldParamName': 'Parameter Name',
  'PC.Pages.AntvX6CommonNode.placeholderParamName':
    'Please enter parameter name',
  'PC.Pages.AntvX6CommonNode.fieldVariableName': 'Variable Name',
  'PC.Pages.AntvX6CommonNode.placeholderParamValue':
    'Please enter parameter value',
  'PC.Pages.AntvX6CommonNode.columnParamValue': 'Parameter Value',
  'PC.Pages.AntvX6CommonNode.noDescription': 'No description',
  'PC.Pages.AntvX6CommonNode.otherBranchHint':
    'This option is hidden from users and is used when user replies are unrelated',
  'PC.Pages.SystemRunningLogNodeDetails.targetTypeAgent': 'Agent',
  'PC.Pages.SystemRunningLogNodeDetails.targetTypePlugin': 'Plugin',
  'PC.Pages.SystemRunningLogNodeDetails.targetTypeWorkflow': 'Workflow',
  'PC.Pages.SystemRunningLogNodeDetails.targetTypeKnowledge': 'Knowledge Base',
  'PC.Pages.SystemRunningLogNodeDetails.targetTypeVariable': 'Variable',
  'PC.Pages.SystemRunningLogNodeDetails.targetTypeTable': 'Data Table',
  'PC.Pages.SystemRunningLogNodeDetails.targetTypeModel': 'Model',
  'PC.Pages.SystemRunningLogNodeDetails.targetTypeToolCall': 'Tool Call',
  'PC.Pages.SystemRunningLogNodeDetails.targetTypePlan': 'Plan',
  'PC.Pages.SystemRunningLogNodeDetails.labelType': 'Type',
  'PC.Pages.SystemRunningLogNodeDetails.labelStatus': 'Status',
  'PC.Pages.SystemRunningLogNodeDetails.statusSuccess': 'Success',
  'PC.Pages.SystemRunningLogNodeDetails.labelName': 'Name',
  'PC.Pages.SystemRunningLogNodeDetails.labelElapsed': 'Elapsed',
  'PC.Pages.SystemRunningLogNodeDetails.labelStartTime': 'Start Time',
  'PC.Pages.SystemRunningLogNodeDetails.labelEndTime': 'End Time',
  'PC.Pages.AppDevDataResourceList.defaultDescPlugin':
    'Plugin resource for specific functions and services',
  'PC.Pages.AppDevDataResourceList.defaultDescWorkflow':
    'Workflow resource for complex business orchestration',
  'PC.Pages.AppDevDataResourceList.defaultDescDataSource': 'Data source',
  'PC.Pages.AppDevDataResourceList.deleteTargetNotFound':
    'Data source to delete was not found',
  'PC.Pages.AppDevDataResourceList.deleteConfirmContent':
    'Once deleted, this page will lose access to the data resource.',
  'PC.Pages.AppDevDataResourceList.confirmDelete': 'Confirm Delete',
  'PC.Pages.AppDevDataResourceList.cancel': 'Cancel',
  'PC.Pages.AppDevDataResourceList.delete': 'Delete',
  'PC.Pages.AntvX6EventHandlers.cannotPasteLoopNode':
    'Loop nodes cannot be pasted',
  'PC.Pages.AntvX6EventHandlers.cannotPasteStartNode':
    'Start node cannot be pasted',
  'PC.Pages.AntvX6EventHandlers.cannotPasteEndNode':
    'End node cannot be pasted',
  'PC.Pages.AntvX6EventHandlers.unsupportedCopyNodeType':
    'This node type does not support copy',
  'PC.Pages.AntvX6EventHandlers.nodeCopied': 'Node copied',
  'PC.Pages.AntvX6EventHandlers.copyNodeFirst': 'Please copy a node first',
  'PC.Pages.AntvX6EventHandlers.cannotDeleteLoopEdge':
    'Loop node edges cannot be deleted',
  'PC.Pages.AntvX6EventHandlers.cannotDeleteStartEndNodes':
    'Start and end nodes cannot be deleted',
  'PC.Pages.AntvX6EventHandlers.deleteLoopNodeConfirmTitle':
    'Are you sure you want to delete the loop node?',
  'PC.Pages.AntvX6EventHandlers.confirm': 'Confirm',
  'PC.Pages.AntvX6EventHandlers.cancel': 'Cancel',
  'PC.Pages.SystemMenuFormModal.addSuccess': 'Menu created successfully',
  'PC.Pages.SystemMenuFormModal.updateSuccess': 'Menu updated successfully',
  'PC.Pages.SystemMenuFormModal.sourceSystemBuiltIn': 'System Built-in',
  'PC.Pages.SystemMenuFormModal.sourceUserDefined': 'User Defined',
  'PC.Pages.SystemMenuFormModal.openInCurrentTab': 'Open in App',
  'PC.Pages.SystemMenuFormModal.openInNewTab': 'Open in New Tab',
  'PC.Pages.SystemMenuFormModal.imageTypeInvalid':
    'Please upload JPG, JPEG, PNG, or SVG image files',
  'PC.Pages.SystemMenuFormModal.imageSizeInvalid':
    'Image size cannot exceed 2MB',
  'PC.Pages.SystemMenuFormModal.editTitle': 'Edit Menu',
  'PC.Pages.SystemMenuFormModal.createTitle': 'Create Menu',
  'PC.Pages.SystemMenuFormModal.save': 'Save',
  'PC.Pages.SystemMenuFormModal.create': 'Create',
  'PC.Pages.SystemMenuFormModal.icon': 'Icon',
  'PC.Pages.SystemMenuFormModal.menuName': 'Menu Name',
  'PC.Pages.SystemMenuFormModal.menuNameRequired': 'Please enter menu name',
  'PC.Pages.SystemMenuFormModal.menuNamePlaceholder': 'Please enter menu name',
  'PC.Pages.SystemMenuFormModal.parentMenu': 'Parent Menu',
  'PC.Pages.SystemMenuFormModal.parentMenuPlaceholder':
    'Please select parent menu (None)',
  'PC.Pages.SystemMenuFormModal.routePath': 'Route Path',
  'PC.Pages.SystemMenuFormModal.routePathPatternInvalid':
    'Route path/URL can only contain letters, numbers, slashes, and common URL symbols (? # & = . _ - : % @ + space), e.g. /system/menu or https://example.com',
  'PC.Pages.SystemMenuFormModal.routePathLengthInvalid':
    'Route path length cannot exceed 500 characters',
  'PC.Pages.SystemMenuFormModal.routePathTipStatic':
    'Static route, e.g. /system/menu',
  'PC.Pages.SystemMenuFormModal.routePathTipDynamic':
    'Dynamic route, e.g. /space/:spaceId/develop',
  'PC.Pages.SystemMenuFormModal.routePathTipExternal':
    'External URL, e.g. https://example.com',
  'PC.Pages.SystemMenuFormModal.routePathPlaceholder':
    'Please enter route path, e.g. /system/menu',
  'PC.Pages.SystemMenuFormModal.externalOpenType': 'External Link Open Type',
  'PC.Pages.SystemMenuFormModal.openTypePlaceholder': 'Please select open type',
  'PC.Pages.SystemMenuFormModal.source': 'Source',
  'PC.Pages.SystemMenuFormModal.sourcePlaceholder': 'Please select source',
  'PC.Pages.SystemMenuFormModal.sort': 'Sort',
  'PC.Pages.SystemMenuFormModal.sortPlaceholder': 'Please enter sort',
  'PC.Pages.SystemMenuFormModal.enable': 'Enable',
  'PC.Pages.SystemMenuFormModal.enableTooltip': 'Enable or disable this menu',
  'PC.Pages.SystemMenuFormModal.enabled': 'Enabled',
  'PC.Pages.SystemMenuFormModal.disabled': 'Disabled',
  'PC.Pages.SystemMenuFormModal.description': 'Description',
  'PC.Pages.SystemMenuFormModal.descriptionPlaceholder':
    'Please enter description',
  'PC.Pages.SystemMenuFormModal.bindResourceCode': 'Bind Resource Codes',
  'PC.Pages.SystemMenuFormModal.bindResourceCodeTooltip':
    'Select resource permissions accessible by this menu',
  'PC.Pages.SystemMenuManage.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemMenuManage.deleteMenuTitle': 'Delete Menu',
  'PC.Pages.SystemMenuManage.deleteMenuConfirm':
    'Are you sure to delete menu "{0}"?',
  'PC.Pages.SystemMenuManage.sortUpdateSuccess': 'Sort updated successfully',
  'PC.Pages.SystemMenuManage.dragFailedRetry': 'Drag failed, please retry',
  'PC.Pages.SystemMenuManage.columnSort': 'Sort',
  'PC.Pages.SystemMenuManage.columnMenuName': 'Menu Name',
  'PC.Pages.SystemMenuManage.columnCode': 'Code',
  'PC.Pages.SystemMenuManage.columnRoutePath': 'Route Path',
  'PC.Pages.SystemMenuManage.columnDescription': 'Description',
  'PC.Pages.SystemMenuManage.columnEnabled': 'Enabled',
  'PC.Pages.SystemMenuManage.enabled': 'Enable',
  'PC.Pages.SystemMenuManage.disabled': 'Disable',
  'PC.Pages.SystemMenuManage.columnAction': 'Action',
  'PC.Pages.SystemMenuManage.noPermission': 'No permission',
  'PC.Pages.SystemMenuManage.actionAdd': 'Add',
  'PC.Pages.SystemMenuManage.actionEdit': 'Edit',
  'PC.Pages.SystemMenuManage.actionDelete': 'Delete',
  'PC.Pages.SystemMenuManage.systemBuiltinDeleteDisabled':
    'System built-in menus cannot be deleted',
  'PC.Pages.SystemMenuManage.pageTitle': 'Menu Management',
  'PC.Pages.SystemMenuManage.addMenu': 'Add Menu',
  'PC.Pages.SystemMenuManage.noMenuData': 'No menu data',
  'PC.Pages.SystemMenuPermissionModal.saveSuccess':
    'Menu permissions saved successfully',
  'PC.Pages.SystemMenuPermissionModal.titleWithName':
    'Menu Permission Config - {0}',
  'PC.Pages.SystemMenuPermissionModal.emptyMenuData': 'No menu data',
  'PC.Pages.SystemMenuPermissionModal.resourceLabelWithId': 'Resource {0}',
  'PC.Pages.SystemMenuDataPermissionModal.tabModel': 'Model',
  'PC.Pages.SystemMenuDataPermissionModal.tabModelTip':
    'Models require authorization before use',
  'PC.Pages.SystemMenuDataPermissionModal.tabAgent': 'Agent',
  'PC.Pages.SystemMenuDataPermissionModal.contentMgmtTip':
    'Enable access control in content management and publish to system square before authorizing here',
  'PC.Pages.SystemMenuDataPermissionModal.tabWebApp': 'Web Application',
  'PC.Pages.SystemMenuDataPermissionModal.tabDevPermission':
    'Development Permissions',
  'PC.Pages.SystemMenuDataPermissionModal.saveSuccess':
    'Data permissions saved successfully',
  'PC.Pages.SystemMenuDataPermissionModal.missingTargetId':
    'Missing ID. Unable to save data permissions',
  'PC.Pages.SystemMenuDataPermissionModal.emptySelectedModel':
    'No selected models',
  'PC.Pages.SystemMenuDataPermissionModal.searchAgentPlaceholder':
    'Search agents',
  'PC.Pages.SystemMenuDataPermissionModal.emptySelectedAgent':
    'No selected agents',
  'PC.Pages.SystemMenuDataPermissionModal.searchWebAppPlaceholder':
    'Search web applications',
  'PC.Pages.SystemMenuDataPermissionModal.emptySelectedWebApp':
    'No selected web applications',
  'PC.Pages.SystemMenuDataPermissionModal.tokenLimitLabel': 'Daily token limit',
  'PC.Pages.SystemMenuDataPermissionModal.tokenLimitTip':
    'Daily token limit. -1 means no limit',
  'PC.Pages.SystemMenuDataPermissionModal.tokenLimitPlaceholder':
    'Enter daily token limit',
  'PC.Pages.SystemMenuDataPermissionModal.maxSpaceCountLabel': 'Max workspaces',
  'PC.Pages.SystemMenuDataPermissionModal.maxSpaceCountTip':
    'Maximum number of workspaces. -1 means no limit',
  'PC.Pages.SystemMenuDataPermissionModal.maxAgentCountLabel': 'Max agents',
  'PC.Pages.SystemMenuDataPermissionModal.maxAgentCountTip':
    'Maximum number of agents. -1 means no limit',
  'PC.Pages.SystemMenuDataPermissionModal.maxWebAppCountLabel':
    'Max web applications',
  'PC.Pages.SystemMenuDataPermissionModal.maxWebAppCountTip':
    'Maximum number of web applications. -1 means no limit',
  'PC.Pages.SystemMenuDataPermissionModal.maxKnowledgeCountLabel':
    'Max knowledge bases',
  'PC.Pages.SystemMenuDataPermissionModal.maxKnowledgeCountTip':
    'Maximum number of knowledge bases. -1 means no limit',
  'PC.Pages.SystemMenuDataPermissionModal.knowledgeStorageLimitGbLabel':
    'Knowledge storage limit (GB)',
  'PC.Pages.SystemMenuDataPermissionModal.knowledgeStorageLimitGbTip':
    '-1 means no limit, 0 means no permission, precision is 0.001GB, 1GB=1024MB, 1MB=1024KB',
  'PC.Pages.SystemMenuDataPermissionModal.maxDataTableCountLabel':
    'Max data tables',
  'PC.Pages.SystemMenuDataPermissionModal.maxDataTableCountTip':
    'Maximum number of data tables. -1 means no limit',
  'PC.Pages.SystemMenuDataPermissionModal.maxScheduledTaskCountLabel':
    'Max scheduled tasks',
  'PC.Pages.SystemMenuDataPermissionModal.maxScheduledTaskCountTip':
    'Maximum number of scheduled tasks. -1 means no limit',
  'PC.Pages.SystemMenuDataPermissionModal.agentMemoryGbLabel':
    'Agent memory (GB)',
  'PC.Pages.SystemMenuDataPermissionModal.agentMemoryGbTip':
    'Agent memory (GB). Leave empty to use default 4GB',
  'PC.Pages.SystemMenuDataPermissionModal.agentCpuCoresLabel':
    'Agent CPU cores',
  'PC.Pages.SystemMenuDataPermissionModal.agentCpuCoresTip':
    'Agent CPU cores (leave empty to use default value)',
  'PC.Pages.SystemMenuDataPermissionModal.agentDailyPromptLimitLabel':
    'General agent daily conversation limit',
  'PC.Pages.SystemMenuDataPermissionModal.agentDailyPromptLimitTip':
    'General agent daily conversations. -1 means no limit',
  'PC.Pages.SystemMenuDataPermissionModal.webAppDailyPromptLimitLabel':
    'Web app development daily conversation limit',
  'PC.Pages.SystemMenuDataPermissionModal.webAppDailyPromptLimitTip':
    'Web app development daily conversations. -1 means no limit',
  'PC.Pages.SystemMenuDataPermissionModal.titleWithName':
    'Data Permission Settings - {0}',
  'PC.Pages.SystemMenuDataPermissionModal.itemAdd': 'Add',
  'PC.Pages.SystemMenuDataPermissionModal.itemAdded': 'Added',
  'PC.Pages.SystemMenuDataPermissionModal.itemRemove': 'Remove',
  'PC.Pages.AppDevPreview.devServerUrlUnavailable':
    'Development server URL is unavailable',
  'PC.Pages.AppDevPreview.retryFailedCheckNetwork':
    'Retry failed, please check network connection',
  'PC.Pages.AppDevPreview.serverErrorWithCode': 'Server Error ({0})',
  'PC.Pages.AppDevPreview.serverStartFailedWithCode':
    'Development server start failed ({0})',
  'PC.Pages.AppDevPreview.starting': 'Starting',
  'PC.Pages.AppDevPreview.importingAndRestarting':
    'Importing project and restarting development server, please wait...',
  'PC.Pages.AppDevPreview.startingEnvironment':
    'Starting development environment, please wait...',
  'PC.Pages.AppDevPreview.developingPleaseWait': 'Generating, please wait...',
  'PC.Pages.AppDevPreview.refreshing': 'Refreshing...',
  'PC.Pages.AppDevPreview.refresh': 'Refresh',
  'PC.Pages.AppDevPreview.restartServer': 'Restart Server',
  'PC.Pages.AppDevPreview.restarting': 'Restarting...',
  'PC.Pages.AppDevPreview.restartService': 'Restart Service',
  'PC.Pages.AppDevPreview.saveOrResetBeforeRefresh':
    'Please save or reset changes before refreshing preview',
  'PC.Pages.AppDevPreview.previewLoadFailedCheckServerNetwork':
    'Preview failed to load, please check development server status or network connection',
  'PC.Pages.AppDevPreview.projectIdMissingCannotSave':
    'Missing project ID, unable to save',
  'PC.Pages.AppDevPreview.noPendingChanges': 'No pending changes',
  'PC.Pages.AppDevPreview.processFileError': 'Error processing file {0}',
  'PC.Pages.AppDevPreview.saveSuccess': 'Saved successfully',
  'PC.Pages.AppDevPreview.saveFailedCheckConsole':
    'Save failed, please check console error messages',
  'PC.Pages.AppDevPreview.viewFullErrorInfo': 'View full error details',
  'PC.Pages.AppDevPreview.unsavedChanges': 'Unsaved changes',
  'PC.Pages.AppDevPreview.reset': 'Reset',
  'PC.Pages.AppDevPreview.save': 'Save',
  'PC.Pages.AntvX6ComplexNode.none': 'None',
  'PC.Pages.AntvX6ComplexNode.skills': 'Skills',
  'PC.Pages.AntvX6ComplexNode.input': 'Input',
  'PC.Pages.AntvX6ComplexNode.systemPromptTitle': 'System Prompt',
  'PC.Pages.AntvX6ComplexNode.systemPromptTooltip':
    'Provide system-level instructions for the conversation, such as role setting and response logic.',
  'PC.Pages.AntvX6ComplexNode.systemPromptPlaceholder':
    'System prompt can reference input variables with {{var}}, {{var.child}}, or {{var[index]}}.',
  'PC.Pages.AntvX6ComplexNode.userPromptTitle': 'User Prompt',
  'PC.Pages.AntvX6ComplexNode.userPromptTooltip':
    'Provide user instructions to the model, such as queries or text-based questions.',
  'PC.Pages.AntvX6ComplexNode.userPromptPlaceholder':
    'User prompt can reference input variables with {{var}}, {{var.child}}, or {{var[index]}}.',
  'PC.Pages.AntvX6ComplexNode.output': 'Output',
  'PC.Pages.AntvX6ComplexNode.promptOptimizeTitle': 'Prompt Optimization',
  'PC.Pages.AntvX6ComplexNode.intentMatchTitle': 'Intent Match',
  'PC.Pages.AntvX6ComplexNode.extraPromptTitle': 'Extra Prompt',
  'PC.Pages.AntvX6ComplexNode.extraPromptPlaceholder':
    'Support additional system prompts, for example, adding detailed examples for intent options to improve matching success.',
  'PC.Pages.AntvX6ComplexNode.questionTitle': 'Question',
  'PC.Pages.AntvX6ComplexNode.questionPlaceholder':
    'You can reference input variables with {{var}}.',
  'PC.Pages.AntvX6ComplexNode.answerTypeLabel': 'Answer Type',
  'PC.Pages.AntvX6ComplexNode.answerTypeText': 'Direct Answer',
  'PC.Pages.AntvX6ComplexNode.answerTypeSelect': 'Option Answer',
  'PC.Pages.AntvX6ComplexNode.optionContentTitle': 'Set Option Content',
  'PC.Pages.AntvX6ComplexNode.requestMethodAndPath': 'Request Method and Path',
  'PC.Pages.AntvX6ComplexNode.requestMethodPlaceholder': 'Request Method',
  'PC.Pages.AntvX6ComplexNode.urlPlaceholder': 'Please enter URL',
  'PC.Pages.AntvX6ComplexNode.requestContentTypeLabel': 'Request Content Type',
  'PC.Pages.AntvX6ComplexNode.requestTimeoutLabel': 'Request Timeout',
  'PC.Pages.AntvX6ComplexNode.requestTimeoutPlaceholder':
    'Please enter timeout duration',
  'PC.Pages.AntvX6ComplexNode.inputParams': 'Input Params',
  'PC.Pages.AntvX6ComplexNode.outputParams': 'Output Params',
  'PC.Pages.AntvX6Database.addCondition': 'Add Condition',
  'PC.Pages.AntvX6Database.and': 'AND',
  'PC.Pages.AntvX6Database.deleteCondition': 'Delete Condition',
  'PC.Pages.AntvX6Database.emptyConditionData': 'Current query data is empty',
  'PC.Pages.AntvX6Database.generateSqlTitle': 'Generate SQL Statement',
  'PC.Pages.AntvX6Database.or': 'OR',
  'PC.Pages.AntvX6Database.queryCondition': 'Query Condition',
  'PC.Pages.AntvX6Database.queryLimit': 'Query Limit',
  'PC.Pages.AntvX6Database.queryLimitPlaceholder': 'Please enter query limit',
  'PC.Pages.AntvX6Database.selectPlaceholder': 'Please select',
  'PC.Pages.AntvX6Database.selectUpdateFields': 'Select Update Fields',
  'PC.Pages.AntvX6Database.sqlPlaceholder':
    'You can reference output variables with {{var}}, {{var.child}}, and {{var[index]}}.',
  'PC.Pages.AntvX6Database.table': 'Data Table',
  'PC.Pages.AntvX6Database.updateCondition': 'Update Condition',
  'PC.Pages.AntvX6Database.variableValue': 'Variable Value',
  'PC.Pages.AntvX6VariableAggregation.noDescription': 'No description',
  'PC.Pages.AntvX6VariableAggregation.noUpstreamNodeOrParams':
    'No upstream node linked or upstream node has no parameters',
  'PC.Pages.AntvX6VariableAggregation.selectVariable': 'Select variable',
  'PC.Pages.AntvX6VariableAggregation.groupNamePlaceholder': 'Group name',
  'PC.Pages.AntvX6VariableAggregation.emptyGroupInputHint':
    'Click + to add variable reference',
  'PC.Pages.AntvX6VariableAggregation.strategyFirstNonNull':
    'Return the first non-null value in each group',
  'PC.Pages.AntvX6VariableAggregation.strategyTitle': 'Aggregation Strategy',
  'PC.Pages.AntvX6VariableAggregation.groupConfigTitle': 'Group Configuration',
  'PC.Pages.AntvX6VariableAggregation.emptyGroupHint': 'Click + to add group',
  'PC.Pages.AntvX6VariableAggregation.outputTitle': 'Output',
  'PC.Pages.AntvX6NodeItem.add': 'Add',
  'PC.Pages.AntvX6NodeItem.addGroup': 'Add Group',
  'PC.Pages.AntvX6NodeItem.aggregationStrategy': 'Aggregation Strategy',
  'PC.Pages.AntvX6NodeItem.arrayJoinSymbolDescription':
    'Use symbols below to auto-join each item in an array.',
  'PC.Pages.AntvX6NodeItem.arrayJoinSymbolSetting':
    'Array Join Symbol Settings',
  'PC.Pages.AntvX6NodeItem.code': 'Code',
  'PC.Pages.AntvX6NodeItem.comma': 'Comma (,)',
  'PC.Pages.AntvX6NodeItem.delimiter': 'Delimiter',
  'PC.Pages.AntvX6NodeItem.firstNonNullOfEachGroup':
    'Return the first non-null value in each group',
  'PC.Pages.AntvX6NodeItem.fullStop': 'Full Stop (.)',
  'PC.Pages.AntvX6NodeItem.groupConfig': 'Group Configuration',
  'PC.Pages.AntvX6NodeItem.inputVariablePlaceholder':
    'You can reference input variables with {{var}}.',
  'PC.Pages.AntvX6NodeItem.intermediateVariable': 'Intermediate Variable',
  'PC.Pages.AntvX6NodeItem.intermediateVariableTooltip':
    'Variables can be shared across loop iterations and used to pass values between iterations.',
  'PC.Pages.AntvX6NodeItem.joinSymbol': 'Join Symbol',
  'PC.Pages.AntvX6NodeItem.loopArray': 'Loop Array',
  'PC.Pages.AntvX6NodeItem.loopSetting': 'Loop Settings',
  'PC.Pages.AntvX6NodeItem.loopSettingTooltip':
    'If an array is referenced, loop count equals the array length; if a fixed count is set, it uses that count; for infinite loop, combine with the "Break Loop" node.',
  'PC.Pages.AntvX6NodeItem.loopTimes': 'Loop Times',
  'PC.Pages.AntvX6NodeItem.loopTimesPlaceholder':
    'Please enter loop times as a positive integer',
  'PC.Pages.AntvX6NodeItem.newline': 'Newline (\\n)',
  'PC.Pages.AntvX6NodeItem.optionNamePlaceholder': 'Option Name',
  'PC.Pages.AntvX6NodeItem.optionValuePlaceholder': 'Option Value',
  'PC.Pages.AntvX6NodeItem.outputContent': 'Output Content',
  'PC.Pages.AntvX6NodeItem.outputContentPlaceholder':
    'You can reference output variables with {{var}}, {{var.child}}, and {{var[index]}}.',
  'PC.Pages.AntvX6NodeItem.outputContentTooltip':
    'You can reorganize output content in the input below. The model will prioritize this content.',
  'PC.Pages.AntvX6NodeItem.outputVariable': 'Output Variable',
  'PC.Pages.AntvX6NodeItem.returnText': 'Return Text',
  'PC.Pages.AntvX6NodeItem.returnVariable': 'Return Variable',
  'PC.Pages.AntvX6NodeItem.selectJoinSymbol': 'Please select join symbol',
  'PC.Pages.AntvX6NodeItem.selectSplitSymbol': 'Please select split symbol',
  'PC.Pages.AntvX6NodeItem.semicolon': 'Semicolon (;)',
  'PC.Pages.AntvX6NodeItem.setVariable': 'Set Variable',
  'PC.Pages.AntvX6NodeItem.getVariable': 'Get Variable',
  'PC.Pages.AntvX6NodeItem.space': 'Space ( )',
  'PC.Pages.AntvX6NodeItem.stringConcat': 'String Concat',
  'PC.Pages.AntvX6NodeItem.stringSplit': 'String Split',
  'PC.Pages.AntvX6NodeItem.tab': 'Tab (\\t)',
  'PC.Pages.AntvX6NodeConstants.defaultNodeName': 'Test',
  'PC.Pages.AntvX6NodeConstants.defaultNodeDescription': 'Test',
  'PC.Pages.AntvX6AutoSave.versionConflictMessage':
    'Version conflict: workflow was modified in another window',
  'PC.Pages.SystemPermissionResourceFormModal.addSuccess':
    'Resource created successfully',
  'PC.Pages.SystemPermissionResourceFormModal.code': 'Resource Code',
  'PC.Pages.SystemPermissionResourceFormModal.codePatternInvalid':
    'Resource code must start with a letter and can only contain letters, numbers, and underscores',
  'PC.Pages.SystemPermissionResourceFormModal.codePlaceholder':
    'Please enter resource code',
  'PC.Pages.SystemPermissionResourceFormModal.codeTooltip':
    'Resource code identifies a resource. It can be empty and will be auto-generated by system. Only letters, numbers, and underscores are allowed.',
  'PC.Pages.SystemPermissionResourceFormModal.create': 'Create',
  'PC.Pages.SystemPermissionResourceFormModal.createTitle': 'Create Resource',
  'PC.Pages.SystemPermissionResourceFormModal.description': 'Description',
  'PC.Pages.SystemPermissionResourceFormModal.descriptionPlaceholder':
    'Please enter description',
  'PC.Pages.SystemPermissionResourceFormModal.editTitle': 'Edit Resource',
  'PC.Pages.SystemPermissionResourceFormModal.enabled': 'Enabled',
  'PC.Pages.SystemPermissionResourceFormModal.enabledTooltip':
    'Whether to enable this resource',
  'PC.Pages.SystemPermissionResourceFormModal.name': 'Resource Name',
  'PC.Pages.SystemPermissionResourceFormModal.namePlaceholder':
    'Please enter resource name',
  'PC.Pages.SystemPermissionResourceFormModal.nameRequired':
    'Please enter resource name',
  'PC.Pages.SystemPermissionResourceFormModal.parentNode': 'Parent Node',
  'PC.Pages.SystemPermissionResourceFormModal.parentNodePlaceholder':
    'Please select parent node (None)',
  'PC.Pages.SystemPermissionResourceFormModal.routePath': 'Route Path',
  'PC.Pages.SystemPermissionResourceFormModal.routePathLengthInvalid':
    'Route path length cannot exceed 500 characters',
  'PC.Pages.SystemPermissionResourceFormModal.routePathPatternInvalid':
    'Route path must start with a slash and can only contain letters, numbers, slashes, and common URL special characters (? # & = . _ - : % @ + space)',
  'PC.Pages.SystemPermissionResourceFormModal.routePathPlaceholder':
    'Please enter route path, e.g. /system/menu',
  'PC.Pages.SystemPermissionResourceFormModal.routePathTooltip':
    'Static route e.g. /system/menu; dynamic route e.g. /system/menu/:id',
  'PC.Pages.SystemPermissionResourceFormModal.save': 'Save',
  'PC.Pages.SystemPermissionResourceFormModal.sort': 'Sort',
  'PC.Pages.SystemPermissionResourceFormModal.sortPlaceholder':
    'Please enter sort',
  'PC.Pages.SystemPermissionResourceFormModal.source': 'Source',
  'PC.Pages.SystemPermissionResourceFormModal.sourcePlaceholder':
    'Please select source',
  'PC.Pages.SystemPermissionResourceFormModal.sourceSystemBuiltIn':
    'System Built-in',
  'PC.Pages.SystemPermissionResourceFormModal.sourceUserDefined':
    'User Defined',
  'PC.Pages.SystemPermissionResourceFormModal.switchDisabled': 'Disabled',
  'PC.Pages.SystemPermissionResourceFormModal.switchEnabled': 'Enabled',
  'PC.Pages.SystemPermissionResourceFormModal.type': 'Resource Type',
  'PC.Pages.SystemPermissionResourceFormModal.typeComponent': 'Component',
  'PC.Pages.SystemPermissionResourceFormModal.typeModule': 'Module',
  'PC.Pages.SystemPermissionResourceFormModal.typePlaceholder':
    'Please select resource type',
  'PC.Pages.SystemPermissionResourceFormModal.typeRequired':
    'Please select resource type',
  'PC.Pages.SystemPermissionResourceFormModal.updateSuccess':
    'Resource updated successfully',
  'PC.Pages.SystemPermissionResources.actionAdd': 'Add',
  'PC.Pages.SystemPermissionResources.actionDelete': 'Delete',
  'PC.Pages.SystemPermissionResources.actionEdit': 'Edit',
  'PC.Pages.SystemPermissionResources.addResource': 'Add Resource',
  'PC.Pages.SystemPermissionResources.columnAction': 'Action',
  'PC.Pages.SystemPermissionResources.columnCode': 'Code',
  'PC.Pages.SystemPermissionResources.columnDescription': 'Description',
  'PC.Pages.SystemPermissionResources.columnEnabled': 'Enabled',
  'PC.Pages.SystemPermissionResources.columnResourceName': 'Resource Name',
  'PC.Pages.SystemPermissionResources.columnRoutePath': 'Route Path',
  'PC.Pages.SystemPermissionResources.columnSort': 'Sort',
  'PC.Pages.SystemPermissionResources.columnType': 'Type',
  'PC.Pages.SystemPermissionResources.deleteResourceConfirm':
    'Are you sure to delete resource "{0}"?',
  'PC.Pages.SystemPermissionResources.deleteResourceTitle': 'Delete Resource',
  'PC.Pages.SystemPermissionResources.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SystemPermissionResources.disabled': 'Disable',
  'PC.Pages.SystemPermissionResources.dragFailedRetry':
    'Drag failed, please retry',
  'PC.Pages.SystemPermissionResources.enabled': 'Enable',
  'PC.Pages.SystemPermissionResources.noPermission': 'No permission',
  'PC.Pages.SystemPermissionResources.noResourceData': 'No resource data',
  'PC.Pages.SystemPermissionResources.pageTitle':
    'Permission Resource Management',
  'PC.Pages.SystemPermissionResources.sortUpdateSuccess':
    'Sort updated successfully',
  'PC.Pages.SystemPermissionResources.systemBuiltinDeleteDenied':
    'System built-in resources cannot be deleted',
  'PC.Pages.SystemPermissionResources.systemBuiltinDisableDenied':
    'System built-in resources cannot be disabled',
  'PC.Pages.SystemPermissionResources.systemBuiltinEditDenied':
    'System built-in resources cannot be edited',
  'PC.Pages.SystemPermissionResources.typeComponent': 'Component',
  'PC.Pages.SystemPermissionResources.typeModule': 'Module',
  'PC.Pages.AntvX6Library.defaultInputArgsDesc': 'Retrieval Keyword',
  'PC.Pages.AntvX6Library.knowledgeBase': 'Knowledge Base',
  'PC.Pages.AntvX6Library.maxRecallCount': 'Max Recall Count',
  'PC.Pages.AntvX6Library.maxRecallCountTooltip':
    'Maximum number of paragraphs returned from the knowledge base to the model. Higher values return more content.',
  'PC.Pages.AntvX6Library.minMatchScore': 'Min Match Score',
  'PC.Pages.AntvX6Library.minMatchScoreTooltip':
    'Paragraphs are returned based on the configured matching score. Content below threshold is not recalled.',
  'PC.Pages.AntvX6Library.searchStrategy': 'Search Strategy',
  'PC.Pages.AntvX6Library.searchStrategyFullText': 'Full Text',
  'PC.Pages.AntvX6Library.searchStrategyMixed': 'Mixed',
  'PC.Pages.AntvX6Library.searchStrategySemantic': 'Semantic',
  'PC.Pages.AntvX6Library.searchStrategyTooltip':
    'Retrieval strategy for obtaining knowledge from the knowledge base. Different strategies can improve answer accuracy and usability.',
  'PC.Pages.AntvX6RegisterNodes.exceptionWhen': 'On Exception',
  'PC.Pages.AntvX6RegisterNodes.failed': 'Run Failed',
  'PC.Pages.AntvX6RegisterNodes.input': 'Input',
  'PC.Pages.AntvX6RegisterNodes.optionLabel': 'Option {0}',
  'PC.Pages.AntvX6RegisterNodes.qaType': 'QA Type',
  'PC.Pages.AntvX6RegisterNodes.questionContent': 'Question Content',
  'PC.Pages.AntvX6RegisterNodes.replyQuestion': 'Please answer the question',
  'PC.Pages.AntvX6RegisterNodes.running': 'Running',
  'PC.Pages.AntvX6RegisterNodes.success': 'Run Succeeded',
  'PC.Pages.AntvX6RegisterNodes.unconfiguredContent': 'Content not configured',
  'PC.Pages.AntvX6RegisterNodes.unconfiguredInput': 'Input not configured',
  'PC.Pages.AntvX6RegisterNodes.unconfiguredIntent': 'Intent not configured',
  'PC.Pages.AntvX6RegisterNodes.unconfiguredQuestion':
    'Question not configured',
  'PC.Pages.AntvX6RunResult.totalCount': 'Total: {0}',
  'PC.Pages.AntvX6RunResult.onlyShowErrors': 'Only show errors',
  'PC.Pages.AntvX6RunResult.batchVariables': 'Batch variables in this run',
  'PC.Pages.AppDevIndex.application': 'Application',
  'PC.Pages.AppDevIndex.back': 'Back',
  'PC.Pages.AppDevIndex.bindDataSourceFailed': 'Failed to bind data source',
  'PC.Pages.AppDevIndex.bindDataSourceSuccess':
    'Data source bound successfully',
  'PC.Pages.AppDevIndex.bindDataSourceUnknownError':
    'Unknown error occurred while binding data source',
  'PC.Pages.AppDevIndex.clear': 'Clear',
  'PC.Pages.AppDevIndex.clickToPreview': 'Click to Preview',
  'PC.Pages.AppDevIndex.code': 'Code',
  'PC.Pages.AppDevIndex.confirmDeleteContent':
    'Are you sure you want to delete {0} "{1}"?',
  'PC.Pages.AppDevIndex.confirmDeleteTitle': 'Confirm Deletion',
  'PC.Pages.AppDevIndex.confirmImport': 'Confirm Import',
  'PC.Pages.AppDevIndex.currentProjectId': 'Current Project ID',
  'PC.Pages.AppDevIndex.delete': 'Delete',
  'PC.Pages.AppDevIndex.deleteFolderWarning':
    'Warning: Deleting a folder will also delete all files and subfolders inside. This action cannot be undone.',
  'PC.Pages.AppDevIndex.deleteSuccessWithType': 'Successfully deleted {0}: {1}',
  'PC.Pages.AppDevIndex.deployingSubtitle':
    'Please wait, this mask will close automatically after publishing completes',
  'PC.Pages.AppDevIndex.deployingTip': 'Publishing project...',
  'PC.Pages.AppDevIndex.exportFailed': 'Export failed',
  'PC.Pages.AppDevIndex.exportFailedWithError': 'Export failed: {0}',
  'PC.Pages.AppDevIndex.exportSuccess': 'Project exported successfully!',
  'PC.Pages.AppDevIndex.exportUnknownError':
    'Unknown error occurred during export',
  'PC.Pages.AppDevIndex.filePath': 'File Path',
  'PC.Pages.AppDevIndex.filePathPlaceholder':
    'e.g. src/components/NewComponent.tsx',
  'PC.Pages.AppDevIndex.filePathTip':
    'Enter a full file path including file name and extension, for example: src/components/NewComponent.tsx',
  'PC.Pages.AppDevIndex.fileSize': 'File Size',
  'PC.Pages.AppDevIndex.fileTypeFile': 'file',
  'PC.Pages.AppDevIndex.fileTypeFolder': 'folder',
  'PC.Pages.AppDevIndex.fileUploadFailed': 'File upload failed',
  'PC.Pages.AppDevIndex.fileUploadFailedWithError': 'File upload failed: {0}',
  'PC.Pages.AppDevIndex.fileUploadSuccess': 'File uploaded successfully: {0}',
  'PC.Pages.AppDevIndex.importProjectSuccess': 'Project imported successfully',
  'PC.Pages.AppDevIndex.importProjectTitle': 'Import Project',
  'PC.Pages.AppDevIndex.inputContentEmpty': 'Input content is empty',
  'PC.Pages.AppDevIndex.invalidProjectIdCannotBindDataSource':
    'Project ID is missing or invalid. Unable to bind data source.',
  'PC.Pages.AppDevIndex.invalidProjectIdCannotDeploy':
    'Project ID is missing or invalid. Unable to deploy.',
  'PC.Pages.AppDevIndex.invalidProjectIdCannotExport':
    'Project ID is missing or invalid. Unable to export.',
  'PC.Pages.AppDevIndex.logAddedWaitingSend':
    'Log has been added, waiting to send',
  'PC.Pages.AppDevIndex.missingProjectIdDesc':
    'Please append a projectId parameter in URL, for example:',
  'PC.Pages.AppDevIndex.missingProjectIdExample':
    '/space/your-space-id/app-dev/your-project-id',
  'PC.Pages.AppDevIndex.missingProjectIdMessage': 'Missing projectId parameter',
  'PC.Pages.AppDevIndex.notSet': 'Not set',
  'PC.Pages.AppDevIndex.onlyPluginWorkflowSupported':
    'Only plugin and workflow data sources are supported',
  'PC.Pages.AppDevIndex.preview': 'Preview',
  'PC.Pages.AppDevIndex.publishComponentSuccessDesc':
    'Project has been built and published successfully!',
  'PC.Pages.AppDevIndex.publishComponentSuccessTitle':
    'Published as Component Successfully',
  'PC.Pages.AppDevIndex.publishFailed': 'Publish failed',
  'PC.Pages.AppDevIndex.publishFailedRetryAfterFix':
    'Publish failed. Please resolve errors and retry.',
  'PC.Pages.AppDevIndex.selectFile': 'Select File',
  'PC.Pages.AppDevIndex.selectFileFirst': 'Please select a file first',
  'PC.Pages.AppDevIndex.selectedFile': 'Selected File',
  'PC.Pages.AppDevIndex.selectedFileWithName': 'Selected file: {0}',
  'PC.Pages.AppDevIndex.singleFileUploadHint':
    'Any file format is supported. The file will be added to the specified path.',
  'PC.Pages.AppDevIndex.singleFileUploadTitle': 'Upload Single File',
  'PC.Pages.AppDevIndex.targetPathRequired': 'Target path cannot be empty',
  'PC.Pages.AppDevIndex.unknownError': 'Unknown error',
  'PC.Pages.AppDevIndex.unnamedProject': 'Unnamed Project',
  'PC.Pages.AppDevIndex.upload': 'Upload',
  'PC.Pages.AppDevIndex.uploadDragText':
    'Click or drag file to this area to select',
  'PC.Pages.AppDevIndex.uploadProject': 'Upload Project',
  'PC.Pages.AppDevIndex.uploadSizeLimitExceeded':
    'The total upload file size cannot exceed {0}MB',
  'PC.Pages.AppDevIndex.uploadZipHint':
    'Only .zip archives are supported (will update current project)',
  'PC.Pages.AppDevIndex.zipOnly': 'Only .zip archive format is supported',
  'PC.Pages.AppDevDesignViewerTextAlign.reset': 'Reset',
  'PC.Pages.AppDevDesignViewerTextAlign.left': 'Align Left',
  'PC.Pages.AppDevDesignViewerTextAlign.center': 'Align Center',
  'PC.Pages.AppDevDesignViewerTextAlign.right': 'Align Right',
  'PC.Pages.AppDevDesignViewerTextAlign.justify': 'Justify',
  'PC.Pages.AppDevPageEditModal.coverImage': 'Cover Image',
  'PC.Pages.AppDevPageEditModal.coverImageTip':
    'Recommended size 356px * 200px, ratio 16:9',
  'PC.Pages.AppDevPageEditModal.description': 'Description',
  'PC.Pages.AppDevPageEditModal.descriptionPlaceholder':
    'Please enter description',
  'PC.Pages.AppDevPageEditModal.editSuccess': 'Edited successfully',
  'PC.Pages.AppDevPageEditModal.icon': 'Icon',
  'PC.Pages.AppDevPageEditModal.modalTitle': 'Edit Application',
  'PC.Pages.AppDevPageEditModal.name': 'Name',
  'PC.Pages.AppDevPageEditModal.namePlaceholder': 'Please enter name',
  'PC.Pages.AppDevPageEditModal.nameRequired': 'Please enter name',
  'PC.Components.FileContextMenu.newFile': 'New File',
  'PC.Components.FileContextMenu.newFolder': 'New Folder',
  'PC.Components.FileContextMenu.rename': 'Rename',
  'PC.Components.FileContextMenu.uploadFile': 'Upload File',
  'PC.Components.FileContextMenu.delete': 'Delete',
  'PC.Components.FileContextMenu.download': 'Download',
  'PC.Components.FileContextMenu.exportPdf': 'Export as PDF',
  'PC.Components.FileContextMenu.importSkill': 'Import Skill',
  'PC.Components.MoreActionsMenu.importProject': 'Import Project',
  'PC.Components.MoreActionsMenu.restartComputer': 'Restart Agent Computer',
  'PC.Components.MoreActionsMenu.restartComputerTooltip':
    'All running agents will be restarted',
  'PC.Components.MoreActionsMenu.restartAgent': 'Restart Agent',
  'PC.Components.MoreActionsMenu.restartAgentTooltip':
    'Current agent will restart',
  'PC.Components.MoreActionsMenu.exportResult': 'Export Result',
  'PC.Components.ShareDesktopModal.permanent': 'Permanent',
  'PC.Components.ShareDesktopModal.minute1': '1 min',
  'PC.Components.ShareDesktopModal.minute5': '5 min',
  'PC.Components.ShareDesktopModal.minute10': '10 min',
  'PC.Components.ShareDesktopModal.minute20': '20 min',
  'PC.Components.ShareDesktopModal.minute30': '30 min',
  'PC.Components.ShareDesktopModal.minute40': '40 min',
  'PC.Components.ShareDesktopModal.minute50': '50 min',
  'PC.Components.ShareDesktopModal.hour1': '1 hour',
  'PC.Components.ShareDesktopModal.hour2': '2 hours',
  'PC.Components.ShareDesktopModal.hour4': '4 hours',
  'PC.Components.ShareDesktopModal.hour8': '8 hours',
  'PC.Components.ShareDesktopModal.hour16': '16 hours',
  'PC.Components.ShareDesktopModal.day1': '1 day',
  'PC.Components.ShareDesktopModal.conversationIdMissing':
    'Conversation ID missing, unable to share',
  'PC.Components.ShareDesktopModal.desktopShareSuccess':
    'Desktop share successful, link copied to clipboard',
  'PC.Components.ShareDesktopModal.shareFailedRetry':
    'Share failed, please retry later',
  'PC.Components.ShareDesktopModal.fileShareSuccess':
    'Share successful, link copied to clipboard',
  'PC.Components.ShareDesktopModal.titleDesktop': 'Share Desktop',
  'PC.Components.ShareDesktopModal.titleFile': 'Share File',
  'PC.Components.ShareDesktopModal.generateShareLink': 'Generate Share Link',
  'PC.Components.ShareDesktopModal.validDuration': 'Valid Duration',
  'PC.Components.ShareDesktopModal.selectValidDuration':
    'Please select valid duration',
  'PC.Components.ShareDesktopModal.linkExpiresIn': 'Link expires in {0}',
  'PC.Components.ShareDesktopModal.linkPermanent': 'Link is permanently valid',
  'PC.Components.ShareDesktopModal.secondsUnit': '{0}s',
  'PC.Components.ShareDesktopModal.noticeTitle': 'Notice:',
  'PC.Components.ShareDesktopModal.noticeDescription':
    'The share link will be automatically copied to clipboard. Anyone with this link can access it. Share carefully and be aware of data risks.',
  'PC.Components.FilePathHeader.filePreview': 'File Preview',
  'PC.Components.FilePathHeader.collapseFileTree':
    'Click to collapse file tree',
  'PC.Components.FilePathHeader.expandFileTree': 'Click to expand file tree',
  'PC.Components.FilePathHeader.preview': 'Preview',
  'PC.Components.FilePathHeader.code': 'Code',
  'PC.Components.FilePathHeader.remote': 'Remote',
  'PC.Components.FilePathHeader.agentComputerSuffix': "'s Agent Computer",
  'PC.Components.FilePathHeader.exporting': 'Exporting...',
  'PC.Components.FilePathHeader.exportPdf': 'Export as PDF',
  'PC.Components.FilePathHeader.downloading': 'Downloading...',
  'PC.Components.FilePathHeader.download': 'Download',
  'PC.Components.FilePathHeader.share': 'Share',
  'PC.Components.FilePathHeader.exitFullscreen': 'Exit Fullscreen',
  'PC.Components.FilePathHeader.fullscreen': 'Fullscreen',
  'PC.Components.FilePathHeader.copy': 'Copy',
  'PC.Components.FilePathHeader.close': 'Close',
  'PC.Components.SearchView.searchPlaceholder': 'Search files...',
  'PC.Components.SearchView.noMatchingFiles': 'No matching files',
  'PC.Components.FileTree.noFiles': 'No files',
  'PC.Components.FileTreeView.noFilesToPreview':
    'No files available for preview',
  'PC.Components.FileTreeView.noMatchingFile':
    'No matching file found. Please select a file from the file tree',
  'PC.Components.FileTreeView.selectFileToPreview':
    'Please select a file from the file tree to preview',
  'PC.Components.FileTreeView.cannotPreviewType':
    'Cannot preview this file type',
  'PC.Components.FileTreeView.unsupportedFormat':
    'Preview is not supported for .{0} format',
  'PC.Components.FileTreeView.fileRenaming':
    'File is being renamed, please try later',
  'PC.Components.FileTreeView.unsavedChangesSwitchFile':
    'You have unsaved changes. Please save before switching files',
  'PC.Components.FileTreeView.unsavedChangesRename':
    'You have unsaved changes. Please save before renaming',
  'PC.Components.FileTreeView.unsavedChangesUpload':
    'You have unsaved changes. Please save before uploading',
  'PC.Components.FileTreeView.unsavedChangesDelete':
    'You have unsaved changes. Please save before deleting',
  'PC.Components.FileTreeView.unsavedChangesCreateFile':
    'You have unsaved changes. Please save before creating a file',
  'PC.Components.FileTreeView.unsavedChangesCreateFolder':
    'You have unsaved changes. Please save before creating a folder',
  'PC.Components.FileTreeView.downloading': 'Downloading',
  'PC.Components.FileTreeView.uploading': 'Uploading',
  'PC.Components.FileTreeView.exporting': 'Exporting',
  'PC.Components.FileTreeView.importing': 'Importing',
  'PC.Components.FileTreeView.files': 'Files',
  'PC.Components.FileTreeView.refreshing': 'Refreshing...',
  'PC.Components.FileTreeView.refreshFileTree': 'Refresh File Tree',
  'PC.Components.FileTreeView.restarting': 'Restarting...',
  'PC.Hooks.UseEcoMarket.confirmDelete':
    'Are you sure you want to delete this share?',
  'PC.Hooks.UseEventPolling.newVersionFound': 'New Version Available',
  'PC.Hooks.UseEventPolling.updatePrompt':
    'New version {0} detected. Update now?',
  'PC.Hooks.UseEventPolling.update': 'Update',
  'PC.Hooks.UseFileImport.unsupportedFileType':
    'Only .zip, .skill files or SKILL.md files are supported',
  'PC.Hooks.UseFileImport.importSuccess': 'Import successful',
  'PC.Hooks.UseFileImport.importFailed': 'Import failed',
  'PC.Hooks.UseNavigationGuard.confirmLeave': 'Confirm Leave',
  'PC.Hooks.UseNavigationGuard.confirmLeaveMessage':
    'Are you sure you want to leave the current page?',
  'PC.Hooks.UseNavigationGuard.discard': 'Discard',
  'PC.Hooks.UsePluginConfig.saveSuccess': 'Plugin saved successfully',
  'PC.Hooks.UseRestartDevServer.invalidProjectId':
    'Project ID is missing or invalid, unable to restart',
  'PC.Hooks.UseRestartDevServer.restartFailed':
    'Failed to restart development server',
  'PC.Hooks.UseMcp.addItem': 'Add {0}',
  'PC.Hooks.UseTryRun.reconfigureParams':
    'Please reconfigure input parameters and add sub-level',
  'PC.Hooks.UseMessageEventDelegate.pagePathConfigError':
    'Page path configuration error',
  'PC.Hooks.UseMessageEventDelegate.pagePathParamConfigError':
    'Page path parameter configuration error',
  'PC.Hooks.UseMessageEventDelegate.linkUrlConfigError':
    'Link URL configuration error',
  'PC.Hooks.UseMessageEventDelegate.page': 'Page',
  'PC.Hooks.UseSendCode.codeSent': 'Verification code sent',

  // SpaceKnowledge
  'PC.Pages.SpaceKnowledge.DocItem.analyzing': 'Analyzing',
  'PC.Pages.SpaceKnowledge.DocItem.segmentGenerating': 'Segment generating',
  'PC.Pages.SpaceKnowledge.DocItem.buildSuccess': 'Build success',
  'PC.Pages.SpaceKnowledge.DocItem.buildFailedRetry': 'Build failed, retry',
  'PC.Pages.SpaceKnowledge.DocItem.building': 'Building',
  'PC.Pages.SpaceKnowledge.DocWrap.search': 'Search',
  'PC.Pages.SpaceKnowledge.DocWrap.documentList': 'Document List',
  'PC.Pages.SpaceKnowledge.KnowledgeHeader.docCount': '{0} documents',
  'PC.Pages.SpaceKnowledge.KnowledgeHeader.doc': 'Document',
  'PC.Pages.SpaceKnowledge.KnowledgeHeader.qa': 'QA',
  'PC.Pages.SpaceKnowledge.KnowledgeHeader.addContent': 'Add Content',
  'PC.Pages.SpaceKnowledge.KnowledgeHeader.addQa': 'Add QA',
  'PC.Pages.SpaceKnowledge.CreateSet.autoSegmentClean': 'Auto Segment & Clean',
  'PC.Pages.SpaceKnowledge.CreateSet.autoSegmentCleanDesc':
    'Automatic segmentation and preprocessing rules',
  'PC.Pages.SpaceKnowledge.CreateSet.isAiSegment': 'Intelligent Segmentation',
  'PC.Pages.SpaceKnowledge.CreateSet.aiSegmentDesc':
    'Intelligently identify document structure based on AI model, automatically optimize segmentation effect',
  'PC.Pages.SpaceKnowledge.CreateSet.custom': 'Custom',
  'PC.Pages.SpaceKnowledge.CreateSet.customDesc':
    'Custom segmentation rules, segment length and preprocessing rules',
  'PC.Pages.SpaceKnowledge.CreateSet.segmentDelimiter': 'Segment Delimiter',
  'PC.Pages.SpaceKnowledge.CreateSet.inputSegmentDelimiter':
    'Enter segment delimiter',
  'PC.Pages.SpaceKnowledge.CreateSet.segmentDelimiterPlaceholder':
    'Enter segment delimiter, e.g. \\n for line break',
  'PC.Pages.SpaceKnowledge.CreateSet.segmentMaxLength': 'Max Segment Length',
  'PC.Pages.SpaceKnowledge.CreateSet.inputRange100To5000':
    'Please enter a value between 100-5000',
  'PC.Pages.SpaceKnowledge.CreateSet.inputValidNumber':
    'Please enter a valid number!',
  'PC.Pages.SpaceKnowledge.CreateSet.segmentMaxLengthRange':
    'Max segment length must be between 100 and 5000!',
  'PC.Pages.SpaceKnowledge.CreateSet.segmentOverlapPercent':
    'Segment Overlap %',
  'PC.Pages.SpaceKnowledge.CreateSet.inputRange0To100':
    'Please enter a value between 0-100',
  'PC.Pages.SpaceKnowledge.CreateSet.segmentOverlapRange':
    'Segment overlap must be between 0 and 100!',
  'PC.Pages.SpaceKnowledge.TextFill.docName': 'Document Name',
  'PC.Pages.SpaceKnowledge.TextFill.inputDocName': 'Please enter document name',
  'PC.Pages.SpaceKnowledge.TextFill.docNamePlaceholder': 'Enter document name',
  'PC.Pages.SpaceKnowledge.TextFill.docContent': 'Document Content',
  'PC.Pages.SpaceKnowledge.TextFill.inputDocContent':
    'Please enter document content',
  'PC.Pages.SpaceKnowledge.TextFill.docContentPlaceholder':
    'Enter document content',
  'PC.Pages.SpaceKnowledge.UploadFile.correctFileType':
    'Please upload a valid file type',
  'PC.Pages.SpaceKnowledge.UploadFile.supportedFileTypes':
    'Please upload PDF, TXT, DOC, DOCX, MD, JSON, JPG, PNG, GIF, WEBP, SVG, HEIC, MP4, MKV, MOV, WEBM, MP3, AAC, WAV, FLAC, OGG, OPUS files!',
  'PC.Pages.SpaceKnowledge.UploadFile.fileSizeLimit100MB':
    'File size cannot exceed 100MB!',
  'PC.Pages.SpaceKnowledge.UploadFile.clickOrDragToUpload':
    'Click to upload or drag documents here',
  'PC.Pages.SpaceKnowledge.UploadFile.uploadHint':
    'Supports PDF, TXT, DOC, DOCX, MD, JSON, JPG, PNG, GIF, WEBP, SVG, HEIC, MP4, MKV, MOV, WEBM, MP3, AAC, WAV, FLAC, OGG, OPUS. Up to 300 files, each no larger than 100MB, PDF max 500 pages',
  'PC.Pages.SpaceKnowledge.LocalCustomDocModal.docAddSuccess':
    'Document added successfully',
  'PC.Pages.SpaceKnowledge.LocalCustomDocModal.addContent': 'Add Content',
  'PC.Pages.SpaceKnowledge.LocalCustomDocModal.nextStep': 'Next',
  'PC.Pages.SpaceKnowledge.LocalCustomDocModal.prevStep': 'Previous',
  'PC.Pages.SpaceKnowledge.QaBatchModal.uploadFailedCheckFormat':
    'Upload failed, please check the file format',
  'PC.Pages.SpaceKnowledge.QaBatchModal.excelOnly':
    'Only Excel files (.xlsx/.xls) are supported',
  'PC.Pages.SpaceKnowledge.QaBatchModal.fileSizeLimit10MB':
    'File size cannot exceed 10MB',
  'PC.Pages.SpaceKnowledge.QaBatchModal.pleaseUploadFile':
    'Please upload a file',
  'PC.Pages.SpaceKnowledge.QaBatchModal.batchImportSuccess':
    'Batch import successful',
  'PC.Pages.SpaceKnowledge.QaBatchModal.exportFailed': 'Export failed',
  'PC.Pages.SpaceKnowledge.QaBatchModal.downloadTemplateFailed':
    'Failed to download QA batch Excel template',
  'PC.Pages.SpaceKnowledge.QaBatchModal.qaBatchImport': 'QA Batch Import',
  'PC.Pages.SpaceKnowledge.QaBatchModal.downloadExcelTemplate':
    'Download Excel Import Template',
  'PC.Pages.SpaceKnowledge.QaBatchModal.downloadTemplate': 'Download Template',
  'PC.Pages.SpaceKnowledge.QaBatchModal.confirmUpload': 'Confirm Upload',
  'PC.Pages.SpaceKnowledge.QaBatchModal.clickOrDragToUpload':
    'Click or drag files to this area to upload',
  'PC.Pages.SpaceKnowledge.QaBatchModal.excelUploadHint':
    'Only Excel files (.xlsx/.xls), size not exceeding 10MB',
  'PC.Pages.SpaceKnowledge.QaBatchModal.downloadTemplateHint':
    'Please download the import template first, fill in according to the format and then upload',
  'PC.Pages.SpaceKnowledge.QaBatchModal.templateFileName':
    'QA_Batch_Excel_Template.xlsx',
  'PC.Pages.SpaceKnowledge.QaModal.editQa': 'Edit QA',
  'PC.Pages.SpaceKnowledge.QaModal.addQa': 'Add QA',
  'PC.Pages.SpaceKnowledge.QaModal.question': 'Question',
  'PC.Pages.SpaceKnowledge.QaModal.inputQuestion': 'Please enter a question',
  'PC.Pages.SpaceKnowledge.QaModal.inputQuestionContent':
    'Please enter question content',
  'PC.Pages.SpaceKnowledge.QaModal.answer': 'Answer',
  'PC.Pages.SpaceKnowledge.QaModal.inputAnswer': 'Please enter an answer',
  'PC.Pages.SpaceKnowledge.QaModal.inputAnswerContent':
    'Please enter answer content',
  'PC.Pages.SpaceKnowledge.QaTableList.question': 'Question',
  'PC.Pages.SpaceKnowledge.QaTableList.answer': 'Answer',
  'PC.Pages.SpaceKnowledge.QaTableList.vectorized': 'Vectorized',
  'PC.Pages.SpaceKnowledge.QaTableList.completed': 'Completed',
  'PC.Pages.SpaceKnowledge.QaTableList.building': 'Building',
  'PC.Pages.SpaceKnowledge.QaTableList.action': 'Action',
  'PC.Pages.SpaceKnowledge.QaTableList.confirmDeleteQa':
    'Are you sure you want to delete this QA?',
  'PC.Pages.SpaceKnowledge.DocRename.updateSuccess': 'Updated successfully',
  'PC.Pages.SpaceKnowledge.DocRename.rename': 'Rename',
  'PC.Pages.SpaceKnowledge.DocRename.docNameRequired':
    'Document name cannot be empty',
  'PC.Pages.SpaceKnowledge.DocRename.inputDocName':
    'Please enter document name',
  'PC.Pages.SpaceKnowledge.RawSegmentEditModal.editRawSegment':
    'Edit Raw Segment',
  'PC.Pages.SpaceKnowledge.RawSegmentEditModal.segmentContent':
    'Segment Content',
  'PC.Pages.SpaceKnowledge.RawSegmentEditModal.inputSegmentContent':
    'Please enter segment content',
  'PC.Pages.SpaceKnowledge.RawSegmentInfo.modifySuccess':
    'Modified successfully',
  'PC.Pages.SpaceKnowledge.RawSegmentInfo.previewRawDoc':
    'Preview Raw Document',
  'PC.Pages.SpaceKnowledge.RawSegmentInfo.segmentProcessing':
    'Segments are being processed',
  'PC.Pages.SpaceKnowledge.RawSegmentInfo.edit': 'Edit',
  'PC.Pages.SpaceKnowledge.RawSegmentInfo.noSegment': 'No segments',
  'PC.Pages.SpaceKnowledge.Index.deleteDocSuccess':
    'Document deleted successfully',
  'PC.Pages.SpaceKnowledge.Index.confirmDeleteDoc':
    'Are you sure you want to delete this document?',
  'PC.Pages.SpaceKnowledge.Index.deleteQaSuccess': 'QA deleted successfully',
  'PC.Pages.SpaceKnowledge.Index.searchQuestion': 'Search by question',
  'PC.Pages.SpaceKnowledge.Index.qaUpdateSuccess': 'QA updated successfully',
  'PC.Pages.SpaceKnowledge.Index.qaAddSuccess': 'QA added successfully',

  // SpaceLibrary - Index
  'PC.Pages.SpaceLibrary.Index.pageTitle': 'Component Library',
  'PC.Pages.SpaceLibrary.Index.searchComponent': 'Search components',
  'PC.Pages.SpaceLibrary.Index.addComponent': 'Component',
  'PC.Pages.SpaceLibrary.Index.noResults': 'No results found',
  'PC.Pages.SpaceLibrary.Index.pluginCopySuccess': 'Plugin copied successfully',
  'PC.Pages.SpaceLibrary.Index.pluginDeleteSuccess':
    'Plugin deleted successfully',
  'PC.Pages.SpaceLibrary.Index.modelDeleteSuccess':
    'Model deleted successfully',
  'PC.Pages.SpaceLibrary.Index.workflowCopySuccess':
    'Workflow copied successfully',
  'PC.Pages.SpaceLibrary.Index.workflowDeleteSuccess':
    'Workflow deleted successfully',
  'PC.Pages.SpaceLibrary.Index.knowledgeDeleteSuccess':
    'Knowledge base deleted successfully',
  'PC.Pages.SpaceLibrary.Index.tableDeleteSuccess':
    'Data table deleted successfully',
  'PC.Pages.SpaceLibrary.Index.tableCopySuccess':
    'Data table copied successfully',
  'PC.Pages.SpaceLibrary.Index.confirmDeleteComponent':
    'Are you sure you want to delete this component?',
  'PC.Pages.SpaceLibrary.Index.exportConfigTitle': 'Export Config - {0}',
  'PC.Pages.SpaceLibrary.Index.exportWorkflowConfigDesc':
    'If it contains data tables or knowledge bases, the data itself will not be exported',
  'PC.Pages.SpaceLibrary.Index.exportTableConfigDesc':
    'Only the data table structure will be exported, the data itself will not be exported',

  // SpaceLibrary - ComponentItem
  'PC.Pages.SpaceLibrary.ComponentItem.lastEdited': 'Last edited',
  'PC.Pages.SpaceLibrary.ComponentItem.enabled': 'Enabled',
  'PC.Pages.SpaceLibrary.ComponentItem.disabled': 'Disabled',
  'PC.Pages.SpaceLibrary.ComponentItem.published': 'Published',

  // SpaceLibrary - CreateModel
  'PC.Pages.SpaceLibrary.CreateModel.addModel': 'Add Model',
  'PC.Pages.SpaceLibrary.CreateModel.updateModel': 'Update Model',
  'PC.Pages.SpaceLibrary.CreateModel.testConnection': 'Test Connectivity',
  'PC.Pages.SpaceLibrary.CreateModel.testConnectionSuccess':
    'Model connection test successful',
  'PC.Pages.SpaceLibrary.CreateModel.modelCreateSuccess':
    'Model created successfully',
  'PC.Pages.SpaceLibrary.CreateModel.modelUpdateSuccess':
    'Model updated successfully',
  'PC.Pages.SpaceLibrary.CreateModel.modelName': 'Model Name',
  'PC.Pages.SpaceLibrary.CreateModel.inputModelName': 'Enter model name',
  'PC.Pages.SpaceLibrary.CreateModel.modelIdentifier': 'Model Identifier',
  'PC.Pages.SpaceLibrary.CreateModel.inputModelIdentifier':
    'Enter model identifier',
  'PC.Pages.SpaceLibrary.CreateModel.modelDescription': 'Model Description',
  'PC.Pages.SpaceLibrary.CreateModel.inputModelDescription':
    'Enter model description',
  'PC.Pages.SpaceLibrary.CreateModel.modelType': 'Model Type',
  'PC.Pages.SpaceLibrary.CreateModel.selectModelType':
    'Please select model type',
  'PC.Pages.SpaceLibrary.CreateModel.reasoningModel': 'Reasoning Model',
  'PC.Pages.SpaceLibrary.CreateModel.yes': 'Yes',
  'PC.Pages.SpaceLibrary.CreateModel.no': 'No',
  'PC.Pages.SpaceLibrary.CreateModel.vectorDimension': 'Vector Dimension',
  'PC.Pages.SpaceLibrary.CreateModel.inputVectorDimension':
    'Enter vector dimension',
  'PC.Pages.SpaceLibrary.CreateModel.maxOutputTokens': 'Max Output Tokens',
  'PC.Pages.SpaceLibrary.CreateModel.inputMaxOutputTokens':
    'Enter max output tokens',
  'PC.Pages.SpaceLibrary.CreateModel.maxContextLength': 'Max Context Length',
  'PC.Pages.SpaceLibrary.CreateModel.inputMaxContextLength':
    'Enter max context length',
  'PC.Pages.SpaceLibrary.CreateModel.functionCallSupport':
    'Function Call Support',
  'PC.Pages.SpaceLibrary.CreateModel.selectFunctionCallSupport':
    'Select function call support',
  'PC.Pages.SpaceLibrary.CreateModel.enableModel': 'Enable',
  'PC.Pages.SpaceLibrary.CreateModel.disableTooltip':
    'Once disabled, it can no longer be selected. Agents currently using it will not be affected',
  'PC.Pages.SpaceLibrary.CreateModel.enable': 'Enable',
  'PC.Pages.SpaceLibrary.CreateModel.disable': 'Disable',
  'PC.Pages.SpaceLibrary.CreateModel.apiProtocol': 'API Protocol',
  'PC.Pages.SpaceLibrary.CreateModel.selectApiProtocol': 'Select API protocol',
  'PC.Pages.SpaceLibrary.CreateModel.apiConfig': 'API Configuration',
  'PC.Pages.SpaceLibrary.CreateModel.callStrategy': 'Call Strategy',
  'PC.Pages.SpaceLibrary.CreateModel.selectCallStrategy':
    'Select call strategy',
  'PC.Pages.SpaceLibrary.CreateModel.weight': 'Weight',
  'PC.Pages.SpaceLibrary.CreateModel.inputWeight': 'Enter weight value',
  'PC.Pages.SpaceLibrary.CreateModel.inputUrl': 'Enter URL',
  'PC.Pages.SpaceLibrary.CreateModel.inputApiKey': 'Enter API KEY',

  // SpaceLibrary - IntranetModel
  'PC.Pages.SpaceLibrary.IntranetModel.description':
    'Select "Intranet Model" to expose models on your local network to the platform. You only need to execute one command on your intranet server, and then you can configure your intranet address in the API URL configuration below',
  'PC.Pages.SpaceLibrary.IntranetModel.viewCommand':
    'View Intranet Server Command',
  'PC.Pages.SpaceLibrary.IntranetModel.offlineStatus':
    'Current status: Offline',
  'PC.Pages.SpaceLibrary.IntranetModel.refreshStatus': 'Refresh Status',

  // SpaceLibrary - IntranetServerCommand
  'PC.Pages.SpaceLibrary.IntranetServerCommand.modalTitle':
    'Intranet Server Command',
  'PC.Pages.SpaceLibrary.IntranetServerCommand.windowsTitle':
    'Windows (Execute in CMD window)',
  'PC.Pages.SpaceLibrary.IntranetServerCommand.windowsDownload':
    'Windows 64-bit Client Download',
  'PC.Pages.SpaceLibrary.IntranetServerCommand.macTitle':
    'Mac (Execute in Terminal)',
  'PC.Pages.SpaceLibrary.IntranetServerCommand.macDownload':
    'Mac OS 64-bit Client Download',
  'PC.Pages.SpaceLibrary.IntranetServerCommand.linuxTitle':
    'Linux (Execute in Terminal)',
  'PC.Pages.SpaceLibrary.IntranetServerCommand.linuxDownload':
    'Linux 64-bit Client Download',

  // UserManage - Common
  'PC.Common.Global.noData': 'No data',

  // UserManage - MessageSendModal
  'PC.Pages.UserManage.MessageSendModal.messageSendSuccess':
    'Message sent successfully',
  'PC.Pages.UserManage.MessageSendModal.noUserFound': 'No matching users found',
  'PC.Pages.UserManage.MessageSendModal.pleaseInputMessage':
    'Please enter message content',
  'PC.Pages.UserManage.MessageSendModal.pleaseSelectMembers':
    'Please select members to add',
  'PC.Pages.UserManage.MessageSendModal.addMessageUser':
    'Add Message Recipients',
  'PC.Pages.UserManage.MessageSendModal.sendMessage': 'Send Message',
  'PC.Pages.UserManage.MessageSendModal.inputMessageContent':
    'Enter message content',
  'PC.Pages.UserManage.MessageSendModal.searchUserPlaceholder':
    'Enter username, email or phone number, press Enter to search',
  'PC.Pages.UserManage.MessageSendModal.selectAll': 'All',
  'PC.Pages.UserManage.MessageSendModal.selectedMembers':
    'Selected Members ({0})',

  // UserManage - DataPermissionModal
  'PC.Pages.UserManage.DataPermissionModal.dataPermissionTitle':
    'Data Permissions - {0}',
  'PC.Pages.UserManage.DataPermissionModal.dailyTokenLimit':
    'Daily Token Limit',
  'PC.Pages.UserManage.DataPermissionModal.dailyTokenLimitTooltip':
    'Daily token limit, -1 means unlimited',
  'PC.Pages.UserManage.DataPermissionModal.dailyTokenLimitPlaceholder':
    'Enter daily token limit',
  'PC.Pages.UserManage.DataPermissionModal.maxSpaceCount':
    'Max Workspace Count',
  'PC.Pages.UserManage.DataPermissionModal.maxSpaceCountTooltip':
    'Max workspace count, -1 means unlimited',
  'PC.Pages.UserManage.DataPermissionModal.maxAgentCount': 'Max Agent Count',
  'PC.Pages.UserManage.DataPermissionModal.maxAgentCountTooltip':
    'Max agent count, -1 means unlimited',
  'PC.Pages.UserManage.DataPermissionModal.maxPageAppCount':
    'Max Web App Count',
  'PC.Pages.UserManage.DataPermissionModal.maxPageAppCountTooltip':
    'Max web app count, -1 means unlimited',
  'PC.Pages.UserManage.DataPermissionModal.maxKnowledgeCount':
    'Max Knowledge Base Count',
  'PC.Pages.UserManage.DataPermissionModal.maxKnowledgeCountTooltip':
    'Max knowledge base count, -1 means unlimited',
  'PC.Pages.UserManage.DataPermissionModal.knowledgeStorageLimitGb':
    'Knowledge Storage Limit (GB)',
  'PC.Pages.UserManage.DataPermissionModal.knowledgeStorageLimitGbTooltip':
    'Knowledge storage limit (GB), -1 means unlimited',
  'PC.Pages.UserManage.DataPermissionModal.maxDataTableCount':
    'Max Data Table Count',
  'PC.Pages.UserManage.DataPermissionModal.maxDataTableCountTooltip':
    'Max data table count, -1 means unlimited',
  'PC.Pages.UserManage.DataPermissionModal.maxScheduledTaskCount':
    'Max Scheduled Task Count',
  'PC.Pages.UserManage.DataPermissionModal.maxScheduledTaskCountTooltip':
    'Max scheduled task count, -1 means unlimited',
  'PC.Pages.UserManage.DataPermissionModal.agentComputerMemoryGb':
    'Agent Computer Memory (GB)',
  'PC.Pages.UserManage.DataPermissionModal.agentComputerMemoryGbTooltip':
    'Agent computer memory (GB, leave empty for default 4GB)',
  'PC.Pages.UserManage.DataPermissionModal.agentComputerCpuCores':
    'Agent Computer CPU Cores',
  'PC.Pages.UserManage.DataPermissionModal.agentComputerCpuCoresTooltip':
    'Agent computer CPU cores (leave empty for default value)',
  'PC.Pages.UserManage.DataPermissionModal.agentDailyPromptLimit':
    'Daily Agent Chat Limit',
  'PC.Pages.UserManage.DataPermissionModal.agentDailyPromptLimitTooltip':
    'Daily agent chat limit, -1 means unlimited',
  'PC.Pages.UserManage.DataPermissionModal.pageDailyPromptLimit':
    'Daily Web App Chat Limit',
  'PC.Pages.UserManage.DataPermissionModal.pageDailyPromptLimitTooltip':
    'Daily web app chat limit, -1 means unlimited',

  // UserManage - UserAuthModal
  'PC.Pages.UserManage.UserAuthModal.role': 'Role',
  'PC.Pages.UserManage.UserAuthModal.userGroup': 'User Group',
  'PC.Pages.UserManage.UserAuthModal.authTitle': 'Authorization - {0}',
  'PC.Pages.UserManage.UserAuthModal.selectAll': 'Select All',
  'PC.Pages.UserManage.UserAuthModal.deselectAll': 'Deselect All',

  // UserManage - UserFormModal
  'PC.Pages.UserManage.UserFormModal.editUser': 'Edit User',
  'PC.Pages.UserManage.UserFormModal.addUser': 'Add User',
  'PC.Pages.UserManage.UserFormModal.userName': 'Username',
  'PC.Pages.UserManage.UserFormModal.inputUserName': 'Please enter username',
  'PC.Pages.UserManage.UserFormModal.nickName': 'Nickname',
  'PC.Pages.UserManage.UserFormModal.inputNickName':
    'Please enter nickname (full name)',
  'PC.Pages.UserManage.UserFormModal.phoneNumber': 'Phone Number',
  'PC.Pages.UserManage.UserFormModal.inputPhoneNumber':
    'Please enter phone number',
  'PC.Pages.UserManage.UserFormModal.emailAddress': 'Email Address',
  'PC.Pages.UserManage.UserFormModal.inputEmailAddress':
    'Please enter email address',
  'PC.Pages.UserManage.UserFormModal.loginPassword': 'Login Password',
  'PC.Pages.UserManage.UserFormModal.inputLoginPassword':
    'Please enter login password',
  'PC.Pages.UserManage.UserFormModal.inputCorrectPassword':
    'Invalid password, at least 6 characters!',
  'PC.Pages.UserManage.UserFormModal.userType': 'User Type',
  'PC.Pages.UserManage.UserFormModal.admin': 'Admin',
  'PC.Pages.UserManage.UserFormModal.normalUser': 'Normal User',

  // UserManage - UserViewMenuModal
  'PC.Pages.UserManage.UserViewMenuModal.viewMenuResourcePermission':
    'View Menu Resource Permissions',
  'PC.Pages.UserManage.UserViewMenuModal.resourceId': 'Resource {0}',
  'PC.Pages.UserManage.UserViewMenuModal.menuId': 'Menu {0}',

  // UserManage - Index
  'PC.Pages.UserManage.Index.enableSuccess': 'Enabled successfully',
  'PC.Pages.UserManage.Index.disableSuccess': 'Disabled successfully',
  'PC.Pages.UserManage.Index.edit': 'Edit',
  'PC.Pages.UserManage.Index.disable': 'Disable',
  'PC.Pages.UserManage.Index.enable': 'Enable',
  'PC.Pages.UserManage.Index.auth': 'Authorize',
  'PC.Pages.UserManage.Index.viewMenuResourcePermission':
    'View Menu Permissions',
  'PC.Pages.UserManage.Index.viewDataPermission': 'View Data Permissions',
  'PC.Pages.UserManage.Index.userName': 'Username',
  'PC.Pages.UserManage.Index.userFullName': 'Full Name',
  'PC.Pages.UserManage.Index.nickName': 'Nickname',
  'PC.Pages.UserManage.Index.phoneNumber': 'Phone',
  'PC.Pages.UserManage.Index.email': 'Email',
  'PC.Pages.UserManage.Index.type': 'Type',
  'PC.Pages.UserManage.Index.admin': 'Admin',
  'PC.Pages.UserManage.Index.member': 'Member',
  'PC.Pages.UserManage.Index.status': 'Status',
  'PC.Pages.UserManage.Index.normal': 'Active',
  'PC.Pages.UserManage.Index.disabled': 'Disabled',
  'PC.Pages.UserManage.Index.joinTime': 'Join Time',
  'PC.Pages.UserManage.Index.action': 'Action',
  'PC.Pages.UserManage.Index.userManage': 'User Management',
  'PC.Pages.UserManage.Index.addUser': 'Add User',
  'PC.Pages.UserManage.Index.sendMessage': 'Send Message',
  'PC.Pages.UserManage.MessageSendModal.broadcast': 'Send to specified users',
  'PC.Pages.UserManage.MessageSendModal.systemMessage':
    'System message (all users)',

  // Layouts - Setting
  // Layouts - Setting > ResetPassword
  'PC.Layouts.Setting.ResetPassword.title': 'Reset Password',
  'PC.Layouts.Setting.ResetPassword.newPassword': 'New Password',
  'PC.Layouts.Setting.ResetPassword.inputNewPassword':
    'Please enter new password!',
  'PC.Layouts.Setting.ResetPassword.inputCorrectPassword':
    'Invalid new password format, at least 6 characters!',
  'PC.Layouts.Setting.ResetPassword.confirmPassword': 'Confirm Password',
  'PC.Layouts.Setting.ResetPassword.inputConfirmPassword':
    'Please enter the password again!',
  'PC.Layouts.Setting.ResetPassword.passwordMismatch':
    'Passwords do not match!',
  'PC.Layouts.Setting.ResetPassword.inputCorrectNewPassword':
    'Please enter a valid new password!',
  'PC.Layouts.Setting.ResetPassword.placeholderNewPassword':
    'Please enter a new password (at least 6 characters)',
  'PC.Layouts.Setting.ResetPassword.placeholderConfirmPassword':
    'Please enter the password again',
  'PC.Layouts.Setting.ResetPassword.verificationCode': 'Verification Code',
  'PC.Layouts.Setting.ResetPassword.inputVerificationCode':
    'Please enter verification code',
  'PC.Layouts.Setting.ResetPassword.inputCorrectCode':
    'Please enter a valid verification code!',
  'PC.Layouts.Setting.ResetPassword.placeholderCode':
    'Please enter verification code',
  'PC.Layouts.Setting.ResetPassword.sendCode': 'Send Code',
  'PC.Layouts.Setting.ResetPassword.submit': 'Confirm Change',
  'PC.Layouts.Setting.ResetPassword.resetSuccess': 'Reset successful',

  // Layouts - Setting > SettingEmail
  'PC.Layouts.Setting.SettingEmail.emailBindTitle': 'Email Binding',
  'PC.Layouts.Setting.SettingEmail.phoneBindTitle': 'Phone Binding',
  'PC.Layouts.Setting.SettingEmail.emailAddress': 'Email Address',
  'PC.Layouts.Setting.SettingEmail.phoneNumber': 'Phone Number',
  'PC.Layouts.Setting.SettingEmail.inputEmailAddress':
    'Please enter email address',
  'PC.Layouts.Setting.SettingEmail.inputPhoneNumber':
    'Please enter phone number',
  'PC.Layouts.Setting.SettingEmail.inputCorrectEmail':
    'Please enter a valid email address!',
  'PC.Layouts.Setting.SettingEmail.inputCorrectPhone':
    'Please enter a valid phone number!',
  'PC.Layouts.Setting.SettingEmail.verificationCode': 'Verification Code',
  'PC.Layouts.Setting.SettingEmail.inputVerificationCode':
    'Please enter verification code',
  'PC.Layouts.Setting.SettingEmail.inputCorrectCode':
    'Please enter a valid verification code!',
  'PC.Layouts.Setting.SettingEmail.placeholderCode':
    'Please enter verification code',
  'PC.Layouts.Setting.SettingEmail.sendCode': 'Send Code',
  'PC.Layouts.Setting.SettingEmail.bind': 'Bind',
  'PC.Layouts.Setting.SettingEmail.bindSuccess': 'Binding successful',

  // Layouts - Setting > ThemeSwitchPanel
  'PC.Layouts.Setting.ThemeSwitchPanel.title': 'Theme Switch',
  'PC.Layouts.Setting.ThemeSwitchPanel.colorUpdateFailed':
    'Failed to update theme color',
  'PC.Layouts.Setting.ThemeSwitchPanel.autoSwitchNav':
    'Automatically switched to {0} navigation bar',
  'PC.Layouts.Setting.ThemeSwitchPanel.dark': 'dark',
  'PC.Layouts.Setting.ThemeSwitchPanel.light': 'light',
  'PC.Layouts.Setting.ThemeSwitchPanel.backgroundUpdateFailed':
    'Failed to update background image',
  'PC.Layouts.Setting.ThemeSwitchPanel.navStyleUpdateFailed':
    'Failed to update navigation style',
  'PC.Layouts.Setting.ThemeSwitchPanel.autoSwitchBackground':
    'Automatically switched to {0} to match {1} navigation bar',
  'PC.Layouts.Setting.ThemeSwitchPanel.navThemeToggleFailed':
    'Failed to toggle navigation theme',

  // Layouts - Setting > UsageStatistics
  'PC.Layouts.Setting.UsageStatistics.title': 'Usage Statistics',
  'PC.Layouts.Setting.UsageStatistics.query': 'Query',
  'PC.Layouts.Setting.UsageStatistics.columnType': 'Type',
  'PC.Layouts.Setting.UsageStatistics.columnDaily': 'Daily',
  'PC.Layouts.Setting.UsageStatistics.columnOther': 'Other',
  'PC.Layouts.Setting.UsageStatistics.tokenLimit': 'Token Usage Limit',
  'PC.Layouts.Setting.UsageStatistics.agentPrompt': 'Agent Chat Count',
  'PC.Layouts.Setting.UsageStatistics.pagePrompt': 'Web App Dev Chat Count',
  'PC.Layouts.Setting.UsageStatistics.workspace': 'Workspace Creation Limit',
  'PC.Layouts.Setting.UsageStatistics.agent': 'Agent Creation Limit',
  'PC.Layouts.Setting.UsageStatistics.pageApp': 'Web App Creation Limit',
  'PC.Layouts.Setting.UsageStatistics.knowledgeBase':
    'Knowledge Base Creation Limit',
  'PC.Layouts.Setting.UsageStatistics.kbStorage':
    'Knowledge Base Storage Limit',
  'PC.Layouts.Setting.UsageStatistics.table': 'Data Table Creation Limit',
  'PC.Layouts.Setting.UsageStatistics.task': 'Scheduled Task Creation Limit',
  'PC.Layouts.Setting.UsageStatistics.sandboxMemory':
    'Agent Computer Max Memory',

  // Common - additional keys
  'PC.Common.Global.submit': 'Submit',
  'PC.Common.Global.operation': 'Action',
  'PC.Common.Global.edit': 'Edit',
  'PC.Common.Global.delete': 'Delete',
  'PC.Common.Global.add': 'Add',
  'PC.Common.Global.import': 'Import',
  'PC.Common.Global.export': 'Export',
  'PC.Common.Global.pleaseInput': 'Please enter',
  'PC.Common.Global.nameEmpty': 'Name cannot be empty',
  'PC.Common.Global.deleteConfirmTitle': 'Delete Confirmation',
  'PC.Common.Global.deleteConfirmContent': 'Are you sure you want to delete?',
  'PC.Common.Global.selectTime': 'Please select time',
  'PC.Toast.Global.deletedSuccessfully': 'Deleted successfully',
  'PC.Toast.Global.modifiedSuccessfully': 'Modified successfully',
  'PC.Toast.Global.clearedSuccessfully': 'Cleared successfully',
  'PC.Toast.Global.importedSuccessfully': 'Imported successfully',
  'PC.Toast.Global.importFailedRetry': 'Import failed, please retry',
  'PC.Toast.Global.fileUploadFailedRetry': 'File upload failed, please retry',

  // Pages - SpaceTable
  'PC.Pages.SpaceTable.Index.fieldNameValidate':
    'Field name can only contain letters, numbers, underscores, and must start with a letter',
  'PC.Pages.SpaceTable.Index.hint': 'Hint',
  'PC.Pages.SpaceTable.Index.structureModified':
    'Current table structure has been modified. Save changes?',
  'PC.Pages.SpaceTable.Index.discardChanges': 'Discard Changes',
  'PC.Pages.SpaceTable.Index.confirmSave': 'Save',
  'PC.Pages.SpaceTable.Index.modifyData': 'Edit Data',
  'PC.Pages.SpaceTable.Index.addData': 'Add Data',
  'PC.Pages.SpaceTable.Index.clearConfirm': 'Clear Confirmation',
  'PC.Pages.SpaceTable.AddAndModify.inputPlaceholder': 'Please enter {0}',
  'PC.Pages.SpaceTable.AddAndModify.defaultPlaceholder':
    'Please enter default value for {0}',
  'PC.Pages.SpaceTable.AddAndModify.integerRange':
    'Range: [-2147483648, 2147483647]',
  'PC.Pages.SpaceTable.AddAndModify.numberPrecision':
    'Precision 20 digits, max 14 integer digits, max 6 decimal digits',
  'PC.Pages.SpaceTable.DataTable.totalCount': 'Total {0} records',
  'PC.Pages.SpaceTable.DataTable.itemsPerPage': ' / page',
  'PC.Pages.SpaceTable.DataTable.tabStructure': 'Structure',
  'PC.Pages.SpaceTable.DataTable.tabData': 'Data',
  'PC.Pages.SpaceTable.DeleteSure.warning':
    'Please delete carefully. All data will be lost after confirmation!',
  'PC.Pages.SpaceTable.DeleteSure.confirmAgain': 'Please confirm again',
  'PC.Pages.SpaceTable.DeleteSure.matchValidation':
    'Input must exactly match "{0}"',
  'PC.Pages.SpaceTable.DeleteSure.inputPlaceholder':
    'Please enter "{0}" to confirm deletion',
  'PC.Pages.SpaceTable.StructureTable.systemVariable': 'System Variable',
  'PC.Pages.SpaceTable.StructureTable.serial': 'No.',
  'PC.Pages.SpaceTable.StructureTable.fieldName': 'Field Name',
  'PC.Pages.SpaceTable.StructureTable.fieldDescription': 'Field Description',
  'PC.Pages.SpaceTable.StructureTable.fieldType': 'Field Type',
  'PC.Pages.SpaceTable.StructureTable.dataLength': 'Data Length',
  'PC.Pages.SpaceTable.StructureTable.required': 'Required',
  'PC.Pages.SpaceTable.StructureTable.unique': 'Unique',
  'PC.Pages.SpaceTable.StructureTable.enabled': 'Enabled',
  'PC.Pages.SpaceTable.StructureTable.defaultValue': 'Default Value',
  'PC.Pages.SpaceTable.StructureTable.inputFieldName':
    'Please enter field name',
  'PC.Pages.SpaceTable.StructureTable.inputFieldDescription':
    'Please enter field description',
  'PC.Pages.SpaceTable.StructureTable.shortText': 'Short Text (0-255)',
  'PC.Pages.SpaceTable.StructureTable.mediumText': 'Long Text (0-16M)',
  'PC.Pages.SpaceTable.TableHeader.recordCount': '{0} records',
  'PC.Pages.SpaceTable.TableOperationBar.excelFileOnly':
    'Please upload an Excel file (.xlsx or .xls format)',
  'PC.Pages.SpaceTable.TableOperationBar.fileSizeLimit':
    'File size cannot exceed 100MB',
  'PC.Pages.SpaceTable.TableOperationBar.addField': 'Add Field',
  'PC.Pages.SpaceTable.TableOperationBar.clearAllData': 'Clear All Data',
  'PC.Pages.SpaceTable.ClearDataTooltip.clearDataToModify':
    'Can be modified after clearing table data',
  'PC.Pages.EditAgent.EventList.emptyDescription':
    'Content returned by clicking on event binding can be sent to the model',
  'PC.Pages.EditAgent.PreviewAndDebug.fillRequiredParams':
    'Please fill in the required parameters',
  'PC.Pages.EditAgent.PreviewAndDebug.convIdNotFoundFilePreview':
    'Conversation ID does not exist, unable to open file preview',
  'PC.Pages.EditAgent.PreviewAndDebug.convIdNotFoundDesktop':
    'Conversation ID does not exist, unable to open agent computer',
  'PC.Pages.EditAgent.DebugDetails.title': 'Debug Details',
  'PC.Pages.EditAgent.DebugDetails.elapsedTime': 'Elapsed {0} ms',
  'PC.Pages.EditAgent.DebugDetails.calledComponents': 'Called Components',
  'PC.Pages.EditAgent.DebugDetails.output': 'Output',

  // Pages - EditAgent (main index)
  'PC.Pages.EditAgent.convIdNotFoundCreateFile':
    'Conversation ID does not exist, unable to create file',
  'PC.Pages.EditAgent.deleteFileConfirmTitle':
    'Are you sure you want to delete this file?',
  'PC.Pages.EditAgent.convIdNotFoundDeleteFile':
    'Conversation ID does not exist, unable to delete file',
  'PC.Pages.EditAgent.fileNotFoundDelete': 'File not found, unable to delete',
  'PC.Pages.EditAgent.convIdNotFoundRenameFile':
    'Conversation ID does not exist, unable to rename file',
  'PC.Pages.EditAgent.convIdNotFoundSaveFile':
    'Conversation ID does not exist, unable to save file',
  'PC.Pages.EditAgent.convIdNotFoundUploadFile':
    'Conversation ID does not exist, unable to upload file',
  'PC.Pages.EditAgent.uploadFileSizeExceed':
    'Total upload file size cannot exceed {0}MB',
  'PC.Pages.EditAgent.uploadSuccess': 'Uploaded successfully',
  'PC.Pages.EditAgent.convIdNotFoundExport':
    'Development session ID does not exist or is invalid, unable to export',
  'PC.Pages.EditAgent.exportFailed': 'Export failed',
  'PC.Pages.EditAgent.exportSuccess': 'Exported successfully!',
  'PC.Pages.EditAgent.statUserCount': 'Chat Users',
  'PC.Pages.EditAgent.statConvCount': 'Chat Count',
  'PC.Pages.EditAgent.statCollectCount': 'Favorite Users',
  'PC.Pages.EditAgent.statLikeCount': 'Likes',
  'PC.Pages.EditAgent.exportConfigTitle': 'Export Config - {0}',
  'PC.Pages.EditAgent.exportConfigContent':
    'If it contains data tables or knowledge bases, the data itself will not be exported',
  'PC.Pages.EditAgent.agentOverview': 'Agent Overview',

  // Pages - EditAgent > ArrangeTitle
  'PC.Pages.EditAgent.ArrangeTitle.selectChatModel':
    'Please select a chat model',
  'PC.Pages.EditAgent.ArrangeTitle.arrange': 'Arrange',

  // Pages - EditAgent > PreviewAndDebug > PreviewAndDebugHeader
  'PC.Pages.EditAgent.PreviewAndDebug.PreviewAndDebugHeader.previewAndDebug':
    'Preview & Debug',
  'PC.Pages.EditAgent.PreviewAndDebug.PreviewAndDebugHeader.debug': 'Debug',
  'PC.Pages.EditAgent.PreviewAndDebug.PreviewAndDebugHeader.openPreviewPage':
    'Open Preview Page',
  'PC.Pages.EditAgent.PreviewAndDebug.PreviewAndDebugHeader.closeFilePreview':
    'Close File Preview',
  'PC.Pages.EditAgent.PreviewAndDebug.PreviewAndDebugHeader.openFilePreview':
    'Open File Preview',
  'PC.Pages.EditAgent.PreviewAndDebug.PreviewAndDebugHeader.closeAgentDesktop':
    'Close Agent Desktop',
  'PC.Pages.EditAgent.PreviewAndDebug.PreviewAndDebugHeader.openAgentDesktop':
    'Open Agent Desktop',

  // Pages - EditAgent > DebugDetails > NodeDetails
  'PC.Pages.EditAgent.NodeDetails.typePlugin': 'Plugin',
  'PC.Pages.EditAgent.NodeDetails.typeWorkflow': 'Workflow',
  'PC.Pages.EditAgent.NodeDetails.typeKnowledge': 'Knowledge Base',
  'PC.Pages.EditAgent.NodeDetails.typeVariable': 'Variable',
  'PC.Pages.EditAgent.NodeDetails.typeTable': 'Data Table',
  'PC.Pages.EditAgent.NodeDetails.typeModel': 'Model',
  'PC.Pages.EditAgent.NodeDetails.typeMCP': 'MCP',
  'PC.Pages.EditAgent.NodeDetails.labelType': 'Type',
  'PC.Pages.EditAgent.NodeDetails.labelStatus': 'Status',
  'PC.Pages.EditAgent.NodeDetails.statusSuccess': 'Success',
  'PC.Pages.EditAgent.NodeDetails.labelName': 'Name',
  'PC.Pages.EditAgent.NodeDetails.labelDuration': 'Duration',
  'PC.Pages.EditAgent.NodeDetails.labelStartTime': 'Start Time',
  'PC.Pages.EditAgent.NodeDetails.labelEndTime': 'End Time',

  // Pages - EditAgent > AgentModelSetting
  'PC.Pages.EditAgent.AgentModelSetting.modelSetting': 'Model Settings',
  'PC.Pages.EditAgent.AgentModelSetting.selectChatModel':
    'Please select a chat model',
  'PC.Pages.EditAgent.AgentModelSetting.chatModel': 'Chat Model',
  'PC.Pages.EditAgent.AgentModelSetting.reasoningModelOptional':
    'Reasoning Model (Optional)',
  'PC.Pages.EditAgent.AgentModelSetting.selectReasoningModel':
    'Please select a reasoning model',
  'PC.Pages.EditAgent.AgentModelSetting.generateDiversity':
    'Generation Diversity',
  'PC.Pages.EditAgent.AgentModelSetting.precisionModeTitle': 'Precision Mode:',
  'PC.Pages.EditAgent.AgentModelSetting.precisionModeDesc1':
    'Strictly follows instructions to generate content',
  'PC.Pages.EditAgent.AgentModelSetting.precisionModeDesc2':
    'Suitable for scenarios requiring accuracy, such as formal documents, code, etc.',
  'PC.Pages.EditAgent.AgentModelSetting.balanceModeTitle': 'Balance Mode:',
  'PC.Pages.EditAgent.AgentModelSetting.balanceModeDesc1':
    'Seeks balance between creativity and precision',
  'PC.Pages.EditAgent.AgentModelSetting.balanceModeDesc2':
    'Suitable for most daily applications, generating interesting yet rigorous content',
  'PC.Pages.EditAgent.AgentModelSetting.creativeModeTitle': 'Creative Mode:',
  'PC.Pages.EditAgent.AgentModelSetting.creativeModeDesc1':
    'Inspires creativity and provides novel and unique ideas',
  'PC.Pages.EditAgent.AgentModelSetting.creativeModeDesc2':
    'Suitable for scenarios requiring inspiration and unique perspectives, such as brainstorming, creative writing, etc.',
  'PC.Pages.EditAgent.AgentModelSetting.customModeTitle': 'Custom Mode:',
  'PC.Pages.EditAgent.AgentModelSetting.customModeDesc1':
    'Customize generation through advanced settings',
  'PC.Pages.EditAgent.AgentModelSetting.customModeDesc2':
    'Fine-tune according to needs for personalized optimization',
  'PC.Pages.EditAgent.AgentModelSetting.generateRandomness':
    'Generation Randomness',
  'PC.Pages.EditAgent.AgentModelSetting.generateRandomnessTooltip':
    'Temperature: Increasing temperature makes the model output more diverse and creative, while decreasing temperature makes the output follow instructions more closely but reduces diversity. It is recommended not to adjust together with "Top p"',
  'PC.Pages.EditAgent.AgentModelSetting.topPTooltip':
    'Top p is the cumulative probability: The model selects from the highest probability words when generating output until the total probability of these words reaches the Top p value. This limits the model to only select high-probability words, thereby controlling output diversity. It is recommended not to adjust together with "Generation Randomness".',
  'PC.Pages.EditAgent.AgentModelSetting.inputOutputSettings':
    'Input & Output Settings',
  'PC.Pages.EditAgent.AgentModelSetting.contextRoundsLabel': 'Context Rounds',
  'PC.Pages.EditAgent.AgentModelSetting.contextRoundsTooltip':
    'Set the number of conversation history rounds included in the model context. More rounds improve multi-turn dialogue relevance but consume more tokens.',
  'PC.Pages.EditAgent.AgentModelSetting.maxReplyLengthLabel':
    'Max Reply Length',
  'PC.Pages.EditAgent.AgentModelSetting.maxReplyLengthTooltip':
    'Control the maximum token length of model output. Typically, 100 tokens equals approximately 150 Chinese characters.',

  // Pages - EditAgent > SystemTipsWord
  'PC.Pages.EditAgent.SystemTipsWord.systemPromptPlaceholder':
    'Enter system prompt to shape the model role',
  'PC.Pages.EditAgent.SystemTipsWord.userPromptPlaceholder':
    'Enter user prompt, preset instructions, questions or requests',
  'PC.Pages.EditAgent.SystemTipsWord.systemPrompt': 'System Prompt',
  'PC.Pages.EditAgent.SystemTipsWord.userPrompt': 'User Prompt',
  'PC.Pages.EditAgent.SystemTipsWord.exitFullscreen': 'Exit Fullscreen',
  'PC.Pages.EditAgent.SystemTipsWord.fullscreenEdit': 'Fullscreen Edit',
  'PC.Pages.EditAgent.SystemTipsWord.autoOptimizeTooltip':
    'Auto-optimize prompt',
  'PC.Pages.EditAgent.SystemTipsWord.optimize': 'Optimize',

  // Pages - SpacePageDevelop
  'PC.Pages.SpacePageDevelop.ReverseProxyModal.title': 'Reverse Proxy',
  'PC.Pages.SpacePageDevelop.ReverseProxyContentConfig.path': 'Path',
  'PC.Pages.SpacePageDevelop.ReverseProxyContentConfig.pathPlaceholder':
    'Please enter path',
  'PC.Pages.SpacePageDevelop.ReverseProxyContentConfig.backendAddress':
    'Backend Address',
  'PC.Pages.SpacePageDevelop.ReverseProxyContentConfig.backendAddressPlaceholder':
    'Please enter backend address',
  'PC.Pages.SpacePageDevelop.ReverseProxyContentConfig.addConfig': 'Add Config',
  'PC.Pages.SpacePageDevelop.ReverseProxyContentConfig.savedSuccessfully':
    'Saved successfully',
  'PC.Pages.SpacePageDevelop.ReverseProxyContentConfig.duplicatePathError':
    'Paths cannot be the same',
  'PC.Pages.SpacePageDevelop.ReverseProxyContentConfig.rootPathError':
    'Root path / is built-in, no configuration needed',
  'PC.Pages.SpacePageDevelop.AddPathModal.addPath': 'Add Path',
  'PC.Pages.SpacePageDevelop.AddPathModal.editPath': 'Edit Path',
  'PC.Pages.SpacePageDevelop.AddPathModal.pathName': 'Path Name',
  'PC.Pages.SpacePageDevelop.AddPathModal.pleaseEnterPathName':
    'Please enter path name',
  'PC.Pages.SpacePageDevelop.AddPathModal.pathUri': 'Path URI',
  'PC.Pages.SpacePageDevelop.AddPathModal.pleaseEnterPathUri':
    'Please enter path URI',
  'PC.Pages.SpacePageDevelop.AddPathModal.pathUriFormatError':
    'Please enter a valid path URI, must start with /',
  'PC.Pages.SpacePageDevelop.AddPathModal.pathUriPlaceholder':
    'Path URI, e.g. /detail/view or /detail/view/{id}',
  'PC.Pages.SpacePageDevelop.AddPathModal.pathDescription': 'Path Description',
  'PC.Pages.SpacePageDevelop.AddPathModal.pathDescriptionPlaceholder':
    'Path description, e.g. Get detail information',
  'PC.Pages.SpacePageDevelop.AddPathModal.actionSuccess': '{0} successfully',
  'PC.Pages.SpacePageDevelop.PathParamsConfigModal.title': 'Path Params Config',
  'PC.Pages.SpacePageDevelop.PathParamsConfigModal.addPath': 'Add Path',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.title':
    'Domain Binding Management',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameTitle':
    'Please resolve the domain to one of the following CNAME addresses',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameCnValue':
    'cn-cname.nuwax.com',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameCnDesc':
    'For users in China, ICP filing is required',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameEnValue':
    'en-cname.nuwax.com',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameEnDesc':
    'For overseas users, please comply with local laws and regulations',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.boundDomains': 'Bound Domains',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.domainCount': '{0} domains',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.addDomain': 'Add New Domain',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.addSuccess':
    'Added successfully',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.modifySuccess':
    'Modified successfully',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.deleteSuccess':
    'Deleted successfully',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.pleaseEnterDomain':
    'Please enter a domain',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.invalidDomainFormat':
    'Please enter a valid domain format',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.editDomain': 'Edit Domain',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.domainInputPlaceholder':
    'Please enter domain, e.g. example.com',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.cnameResolveHint':
    'Please ensure the domain has completed CNAME resolution',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.removeDomainTitle':
    'Remove Domain Binding',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.removeDomainContent':
    'Are you sure you want to remove domain',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.removeDomainHint':
    'After removal, users will not be able to access this project via this domain. Re-binding and resolution required.',
  'PC.Models.ConversationInfo.restartAgentSuccess':
    'Agent restarted successfully',
  'PC.Models.ConversationInfo.networkTimeoutError':
    'Network timeout or service unavailable, please try again later',
  'PC.Models.ConversationInfo.taskConflictTitle': 'Notice',
  'PC.Models.ConversationInfo.taskConflictContent':
    'The agent is currently executing a task. Do you want to pause the current task before sending a new request. Do you want to pause?',
  'PC.Models.DevCollectAgent.uncollectSuccess': 'Uncollected successfully',
  'PC.Models.UserInfo.getUserInfoFailed': 'Failed to get user info',
  'PC.Models.UserInfo.refreshUserInfoFailed': 'Failed to refresh user info',
  'PC.Models.WorkflowV3.defaultNodeName': 'Test',
  'PC.Models.WorkflowV3.defaultNodeDescription': 'Test',
  'PC.Models.Workflow.defaultNodeName': 'Test',
  'PC.Models.Workflow.defaultNodeDescription': 'Test',
  'PC.Pages.SpacePageDevelop.DomainBindingModal.confirmRemove':
    'Confirm Removal',

  // Pages - SpacePageDevelop - AuthConfigModal
  'PC.Pages.SpacePageDevelop.AuthConfigModal.authConfig': 'Auth Configuration',
  'PC.Pages.SpacePageDevelop.AuthConfigModal.allowAccessWithoutLogin':
    'Allow Access Without Login',
  'PC.Pages.SpacePageDevelop.AuthConfigModal.pageIdNotExist':
    'Page ID does not exist',

  // Pages - SpacePageDevelop - PageCreateModal
  'PC.Pages.SpacePageDevelop.PageCreateModal.createApp': 'Create App',
  'PC.Pages.SpacePageDevelop.PageCreateModal.name': 'Name',
  'PC.Pages.SpacePageDevelop.PageCreateModal.pleaseEnterName':
    'Please enter name',
  'PC.Pages.SpacePageDevelop.PageCreateModal.description': 'Description',
  'PC.Pages.SpacePageDevelop.PageCreateModal.pleaseEnterDescription':
    'Please enter description',
  'PC.Pages.SpacePageDevelop.PageCreateModal.icon': 'Icon',
  'PC.Pages.SpacePageDevelop.PageCreateModal.pleaseUploadZip':
    'Please upload a project zip file',
  'PC.Pages.SpacePageDevelop.PageCreateModal.zipOnly': 'ZIP files only',
  'PC.Pages.SpacePageDevelop.PageCreateModal.uploadDragText':
    'Click or drag file to this area to upload',

  // Pages - SpacePageDevelop - PathParamsConfigContent
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.paramName': 'Param Name',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.paramNamePlaceholder':
    'Please enter param name',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.paramDescription':
    'Param Description',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.paramDescriptionPlaceholder':
    'Please enter param description',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.inputType': 'Input Type',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.isRequired': 'Required',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.defaultValue':
    'Default Value',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.defaultValuePlaceholder':
    'Please enter default value',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.enable': 'Enable',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.action': 'Action',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.noPathParams':
    'No path params',
  'PC.Pages.SpacePageDevelop.PathParamsConfigContent.addParam': 'Add Param',

  // Pages - SpacePageDevelop - Index
  'PC.Pages.SpacePageDevelop.Index.pageTitle': 'Page Development',
  'PC.Pages.SpacePageDevelop.Index.searchPlaceholder': 'Search page name',
  'PC.Pages.SpacePageDevelop.Index.create': 'Create',
  'PC.Pages.SpacePageDevelop.Index.viewDetails': 'View Details',
  'PC.Pages.SpacePageDevelop.Index.published': 'Published',
  'PC.Pages.SpacePageDevelop.Index.unpublished': 'Unpublished',
  'PC.Pages.SpacePageDevelop.Index.noResultsFound': 'No results found',
  'PC.Pages.SpacePageDevelop.Index.pageUrlNotExist': 'Page URL does not exist',
  'PC.Pages.SpacePageDevelop.Index.projectIdInvalidCannotExport':
    'Invalid project ID, cannot export',
  'PC.Pages.SpacePageDevelop.Index.exportFailed': 'Export failed',
  'PC.Pages.SpacePageDevelop.Index.exportSuccess': 'Exported successfully',
  'PC.Pages.SpacePageDevelop.Index.exportUnknownError': 'Unknown export error',
  'PC.Pages.SpacePageDevelop.Index.exportFailedWithError': 'Export failed: {0}',
  'PC.Pages.SpacePageDevelop.Index.domainBindingConditionWarning':
    'Domain binding is only available when the publish type is "App" and "Allow Access Without Login" is enabled',
  'PC.Pages.SpacePageDevelop.Index.confirmDeletePage':
    'Are you sure you want to delete this page?',

  // Pages - IMChannel - Index
  'PC.Pages.IMChannel.Index.title': 'IM Bots',
  'PC.Pages.IMChannel.Index.searchPlaceholder': 'Search agent name',
  'PC.Pages.IMChannel.Index.add': 'Add',
  'PC.Pages.IMChannel.Index.addBot': 'Add Bot',
  'PC.Pages.IMChannel.Index.addApp': 'Add App',

  // Pages - IMChannel - PlatformList
  'PC.Pages.IMChannel.PlatformList.platformList': 'Platform List',
  'PC.Pages.IMChannel.PlatformList.robotCount': '{0} bots',

  // Pages - IMChannel - CreateIMChannel
  'PC.Pages.IMChannel.CreateIMChannel.addSuccess': 'Added successfully',
  'PC.Pages.IMChannel.CreateIMChannel.editSuccess': 'Updated successfully',
  'PC.Pages.IMChannel.CreateIMChannel.testConnectionSuccess':
    'Test connection successful',
  'PC.Pages.IMChannel.CreateIMChannel.edit': 'Edit',
  'PC.Pages.IMChannel.CreateIMChannel.add': 'Add',
  'PC.Pages.IMChannel.CreateIMChannel.app': 'App',
  'PC.Pages.IMChannel.CreateIMChannel.bot': 'Bot',
  'PC.Pages.IMChannel.CreateIMChannel.testConnectivity': 'Test Connectivity',
  'PC.Pages.IMChannel.CreateIMChannel.agent': 'Agent',
  'PC.Pages.IMChannel.CreateIMChannel.agentTooltip':
    'General agents will use your sandbox (computer) environment to execute tasks. Do not share the corresponding bot with others.',
  'PC.Pages.IMChannel.CreateIMChannel.outputMode': 'Output Mode',
  'PC.Pages.IMChannel.CreateIMChannel.outputModeTooltip':
    'When the bot replies to a message, whether to display text character by character or all at once.',
  'PC.Pages.IMChannel.CreateIMChannel.streamOutput':
    'Stream output (typewriter effect)',
  'PC.Pages.IMChannel.CreateIMChannel.onceOutput': 'One-time output',
  'PC.Pages.IMChannel.CreateIMChannel.enabledStatus': 'Enabled Status',

  // Pages - IMChannel - DynamicChannelForm
  'PC.Pages.IMChannel.DynamicChannelForm.requiredField':
    'This field is required',

  // Pages - IMChannel - WechatIlinkForm
  'PC.Pages.IMChannel.WechatIlinkForm.qrTimeoutWarning':
    'QR scan has stopped due to timeout, please get a new QR code',
  'PC.Pages.IMChannel.WechatIlinkForm.connectionSuccess':
    'Connection successful',
  'PC.Pages.IMChannel.WechatIlinkForm.scanConfirmSuccess':
    'Scan confirmation successful',
  'PC.Pages.IMChannel.WechatIlinkForm.qrExpired':
    'QR code has expired, please get a new one',
  'PC.Pages.IMChannel.WechatIlinkForm.getQrSuccess':
    'QR code obtained successfully',
  'PC.Pages.IMChannel.WechatIlinkForm.statusNone': 'Not started',
  'PC.Pages.IMChannel.WechatIlinkForm.statusWait': 'Waiting to scan',
  'PC.Pages.IMChannel.WechatIlinkForm.statusScanned':
    'Scanned, please confirm on your phone',
  'PC.Pages.IMChannel.WechatIlinkForm.statusConnected': 'Connected',
  'PC.Pages.IMChannel.WechatIlinkForm.statusExpired': 'Expired',
  'PC.Pages.IMChannel.WechatIlinkForm.scanToConnect': 'Scan to Connect',
  'PC.Pages.IMChannel.WechatIlinkForm.scanTooltip':
    'Click to get the QR code and scan it with WeChat on your phone.',
  'PC.Pages.IMChannel.WechatIlinkForm.fetchingQr': 'Fetching QR code...',
  'PC.Pages.IMChannel.WechatIlinkForm.scanSuccess': 'Scan successful',
  'PC.Pages.IMChannel.WechatIlinkForm.clickConfirmToSave':
    "Please click the 'Confirm' button below to save",
  'PC.Pages.IMChannel.WechatIlinkForm.qrExpiredRefresh':
    'QR code expired, click to refresh',
  'PC.Pages.IMChannel.WechatIlinkForm.clickToGetQr':
    'Please click the button below to get the QR code',
  'PC.Pages.IMChannel.WechatIlinkForm.status': 'Status',
  'PC.Pages.IMChannel.WechatIlinkForm.importantNotice': 'Important Notice',
  'PC.Pages.IMChannel.WechatIlinkForm.importantNoticeDesc':
    'After scanning and confirming with the same WeChat account for the second time, the original bot connection will be immediately invalidated. Please be sure to click the "Confirm" button below to save and activate the current configuration.',
  'PC.Pages.IMChannel.WechatIlinkForm.reGetQr': 'Get QR Code Again',
  'PC.Pages.IMChannel.WechatIlinkForm.getQr': 'Get QR Code',

  // Pages - IMChannel - CardList
  'PC.Pages.IMChannel.CardList.deleteContent':
    'This action cannot be undone. Please proceed with caution.',
  'PC.Pages.IMChannel.CardList.smartBot': 'Smart Bot',
  'PC.Pages.IMChannel.CardList.enterpriseApp': 'Enterprise App',
  'PC.Pages.IMChannel.CardList.unboundAgent': 'No agent bound',
  'PC.Pages.IMChannel.CardList.bot': 'Bot',
  'PC.Pages.IMChannel.CardList.app': 'App',
  'PC.Pages.IMChannel.CardList.lastEdited': 'Last edited',
  'PC.Pages.IMChannel.CardList.edit': 'Edit',
  'PC.Pages.IMChannel.CardList.delete': 'Delete',
  'PC.Pages.IMChannel.CardList.confirmDelete': 'Confirm delete {0} {1}?',
  'PC.Pages.IMChannel.CardList.noMatchingResults': 'No matching results found',
  'PC.Pages.IMChannel.CardList.noResultsFound': 'No relevant results found',
  'PC.Pages.IMChannel.CardList.noKeywordResults':
    'No bots or configurations found containing "{0}"',
  'PC.Pages.IMChannel.CardList.noRobotsDesc':
    'No bots under the current platform. Click the "Add Bot" button above to start creating',
  'PC.Pages.IMChannel.CardList.defaultPlatformName': 'this ',

  // Pages - TeamSetting
  'PC.Pages.TeamSetting.roleOwner': 'Owner',
  'PC.Pages.TeamSetting.roleAdmin': 'Admin',
  'PC.Pages.TeamSetting.roleMember': 'Member',
  'PC.Pages.TeamSetting.myStatus': 'My Status: {0}',
  'PC.Pages.TeamSetting.memberManagement': 'Member Management',
  'PC.Pages.TeamSetting.spaceSetting': 'Space Settings',

  // Pages - TeamSetting - TransferSpace
  'PC.Pages.TeamSetting.TransferSpace.transferSuccess': 'Transfer successful',
  'PC.Pages.TeamSetting.TransferSpace.transferOwnershipTitle':
    'Transfer Team Ownership',
  'PC.Pages.TeamSetting.TransferSpace.transferDescription':
    'After transferring ownership, your status will change to Admin.',
  'PC.Pages.TeamSetting.TransferSpace.transferToLabel': 'Transfer ownership to',
  'PC.Pages.TeamSetting.TransferSpace.selectTeamMember':
    'Please select a team member',

  // Pages - TeamSetting - ModifyTeam
  'PC.Pages.TeamSetting.ModifyTeam.editTeamProfile': 'Edit Team Profile',
  'PC.Pages.TeamSetting.ModifyTeam.teamDescription':
    'By creating a team space, you can support collaboration and sharing of agents, plugins, workflows, large models, and knowledge bases within the team.',
  'PC.Pages.TeamSetting.ModifyTeam.teamNameLabel': 'Team Name',
  'PC.Pages.TeamSetting.ModifyTeam.teamNameRequired': 'Please enter team name',
  'PC.Pages.TeamSetting.ModifyTeam.descriptionLabel': 'Description',
  'PC.Pages.TeamSetting.ModifyTeam.descriptionPlaceholder': 'Describe the team',

  // Pages - TeamSetting - MemberManageTab
  'PC.Pages.TeamSetting.MemberManageTab.keyword': 'Keyword',
  'PC.Pages.TeamSetting.MemberManageTab.search': 'Search',
  'PC.Pages.TeamSetting.MemberManageTab.nickname': 'Nickname',
  'PC.Pages.TeamSetting.MemberManageTab.username': 'Username',
  'PC.Pages.TeamSetting.MemberManageTab.role': 'Role',
  'PC.Pages.TeamSetting.MemberManageTab.joinTime': 'Join Time',
  'PC.Pages.TeamSetting.MemberManageTab.action': 'Action',
  'PC.Pages.TeamSetting.MemberManageTab.delete': 'Delete',
  'PC.Pages.TeamSetting.MemberManageTab.confirmDelete': 'Confirm Delete',
  'PC.Pages.TeamSetting.MemberManageTab.confirmDeleteUser':
    'Are you sure you want to delete this user?',
  'PC.Pages.TeamSetting.MemberManageTab.addMember': 'Add Member',

  // Pages - TeamSetting - AddMember
  'PC.Pages.TeamSetting.AddMember.addSuccess': 'Added successfully',
  'PC.Pages.TeamSetting.AddMember.noUserFound': 'No matching users found',
  'PC.Pages.TeamSetting.AddMember.selectMemberWarning':
    'Please select members to add',
  'PC.Pages.TeamSetting.AddMember.addNewMember': 'Add New Member',
  'PC.Pages.TeamSetting.AddMember.searchPlaceholder':
    'Enter username, email, or phone number and press Enter to search',
  'PC.Pages.TeamSetting.AddMember.all': 'All',
  'PC.Pages.TeamSetting.AddMember.selectedMembers': 'Selected ({0})',

  // Pages - TeamSetting - RemoveSpace
  'PC.Pages.TeamSetting.RemoveSpace.deleteTeamTitle': 'Delete Team',
  'PC.Pages.TeamSetting.RemoveSpace.deleteWarning':
    'Please delete with caution. After deletion, all data in the team will be lost.',
  'PC.Pages.TeamSetting.RemoveSpace.enterTeamNameLabel':
    'Enter the team name to delete',
  'PC.Pages.TeamSetting.RemoveSpace.enterTeamNameRequired':
    'Please enter the team name to delete',
  'PC.Pages.TeamSetting.RemoveSpace.teamNameMismatch':
    'The entered team name does not match the team name to delete',
  'PC.Pages.TeamSetting.RemoveSpace.teamNamePlaceholder':
    'Please enter team name',

  // Pages - TeamSetting - SpaceSettingTab
  'PC.Pages.TeamSetting.SpaceSettingTab.transferSpace': 'Transfer Space',
  'PC.Pages.TeamSetting.SpaceSettingTab.transferSpaceDescription':
    'Transfer space ownership to another member. You will become an Admin after the transfer.',
  'PC.Pages.TeamSetting.SpaceSettingTab.transferSpaceBtn': 'Transfer Space',
  'PC.Pages.TeamSetting.SpaceSettingTab.deleteSpace': 'Delete Space',
  'PC.Pages.TeamSetting.SpaceSettingTab.deleteSpaceDescription':
    'Once the space is deleted, all assets cannot be recovered. Please proceed with caution.',
  'PC.Pages.TeamSetting.SpaceSettingTab.deleteSpaceBtn': 'Delete Space',
  'PC.Pages.TeamSetting.SpaceSettingTab.developerFeatures':
    'Developer Features',
  'PC.Pages.TeamSetting.SpaceSettingTab.developerFeaturesTooltip':
    'When disabled, users will not be able to see "Agent Development" and "Component Library". Creators and admins are not affected.',
  'PC.Pages.TeamSetting.SpaceSettingTab.receiveExternalPublish':
    'Receive External Space Publications',
  'PC.Pages.TeamSetting.SpaceSettingTab.receiveExternalPublishTooltip':
    "When enabled, users with permission to this space can publish agents, plugins, and workflows developed in other spaces to this space's marketplace.",
  // Pages - SpaceLibraryLog
  'PC.Pages.SpaceLibraryLog.Index.pageTitle': 'Log Query',

  'PC.Pages.SpaceLibraryLog.LogDetailDrawer.title': 'Log Details',
  'PC.Pages.SpaceLibraryLog.LogDetailDrawer.elapsedTime': 'Elapsed {0} ms',
  'PC.Pages.SpaceLibraryLog.LogDetailDrawer.tokenCount': '{0} Tokens',
  'PC.Pages.SpaceLibraryLog.LogDetailDrawer.messageId': 'Message ID:',
  'PC.Pages.SpaceLibraryLog.LogDetailDrawer.calledComponents':
    'Called Components',
  'PC.Pages.SpaceLibraryLog.LogDetailDrawer.nodeDetails': 'Node Details',
  'PC.Pages.SpaceLibraryLog.LogDetailDrawer.input': 'Input',
  'PC.Pages.SpaceLibraryLog.LogDetailDrawer.output': 'Output',
  'PC.Pages.SpaceLibraryLog.LogDetailDrawer.executionProcess':
    'Execution Process',

  'PC.Pages.SpaceLibraryLog.NodeDetails.typeAgent': 'Agent',
  'PC.Pages.SpaceLibraryLog.NodeDetails.typePlugin': 'Plugin',
  'PC.Pages.SpaceLibraryLog.NodeDetails.typeWorkflow': 'Workflow',
  'PC.Pages.SpaceLibraryLog.NodeDetails.typeKnowledge': 'Knowledge Base',
  'PC.Pages.SpaceLibraryLog.NodeDetails.typeVariable': 'Variable',
  'PC.Pages.SpaceLibraryLog.NodeDetails.typeTable': 'Data Table',
  'PC.Pages.SpaceLibraryLog.NodeDetails.typeModel': 'Model',
  'PC.Pages.SpaceLibraryLog.NodeDetails.typeMCP': 'MCP',
  'PC.Pages.SpaceLibraryLog.NodeDetails.typeToolCall': 'Tool Call',
  'PC.Pages.SpaceLibraryLog.NodeDetails.typePlan': 'Plan',
  'PC.Pages.SpaceLibraryLog.NodeDetails.labelType': 'Type',
  'PC.Pages.SpaceLibraryLog.NodeDetails.labelStatus': 'Status',
  'PC.Pages.SpaceLibraryLog.NodeDetails.statusSuccess': 'Success',
  'PC.Pages.SpaceLibraryLog.NodeDetails.labelName': 'Name',
  'PC.Pages.SpaceLibraryLog.NodeDetails.labelElapsedTime': 'Elapsed Time',
  'PC.Pages.SpaceLibraryLog.NodeDetails.labelStartTime': 'Start Time',
  'PC.Pages.SpaceLibraryLog.NodeDetails.labelEndTime': 'End Time',

  'PC.Pages.SpaceLibraryLog.LogProTable.colType': 'Type',
  'PC.Pages.SpaceLibraryLog.LogProTable.colTargetId': 'Target ID',
  'PC.Pages.SpaceLibraryLog.LogProTable.colTargetName': 'Target Name',
  'PC.Pages.SpaceLibraryLog.LogProTable.colRequestId': 'Request ID',
  'PC.Pages.SpaceLibraryLog.LogProTable.colUserId': 'User ID',
  'PC.Pages.SpaceLibraryLog.LogProTable.colUserName': 'Username',
  'PC.Pages.SpaceLibraryLog.LogProTable.colConversationId': 'Conversation ID',
  'PC.Pages.SpaceLibraryLog.LogProTable.colInput': 'Input Content',
  'PC.Pages.SpaceLibraryLog.LogProTable.colOutput': 'Output Content',
  'PC.Pages.SpaceLibraryLog.LogProTable.colTimeRange': 'Time Range',
  'PC.Pages.SpaceLibraryLog.LogProTable.colInputToken': 'Input Token',
  'PC.Pages.SpaceLibraryLog.LogProTable.colOutputToken': 'Output Token',
  'PC.Pages.SpaceLibraryLog.LogProTable.colRequestTime': 'Request Time',
  'PC.Pages.SpaceLibraryLog.LogProTable.colElapsedTime': 'Elapsed Time',
  'PC.Pages.SpaceLibraryLog.LogProTable.colActions': 'Actions',
  'PC.Pages.SpaceLibraryLog.LogProTable.phSelectType': 'Please select type',
  'PC.Pages.SpaceLibraryLog.LogProTable.phTargetId': 'Please enter target ID',
  'PC.Pages.SpaceLibraryLog.LogProTable.phTargetName':
    'Please enter target name',
  'PC.Pages.SpaceLibraryLog.LogProTable.phRequestId': 'Please enter request ID',
  'PC.Pages.SpaceLibraryLog.LogProTable.phUserId':
    'Please enter user ID (integers only)',
  'PC.Pages.SpaceLibraryLog.LogProTable.phUserName': 'Please enter username',
  'PC.Pages.SpaceLibraryLog.LogProTable.phConversationId':
    'Please enter conversation ID',
  'PC.Pages.SpaceLibraryLog.LogProTable.phInputContent':
    'Multiple keywords separated by spaces, please enter content',
  'PC.Pages.SpaceLibraryLog.LogProTable.phOutputContent':
    'Multiple keywords separated by spaces, please enter content',
  'PC.Pages.SpaceLibraryLog.LogProTable.viewConversationDetail':
    'View conversation details',
  'PC.Pages.SpaceLibraryLog.LogProTable.queryFailed': 'Query failed',
  'PC.Pages.SpaceLibraryLog.LogProTable.noRequestIdWarning':
    'This record is missing requestId and cannot view details',
  'PC.Pages.SpaceLibraryLog.LogProTable.actionDetail': 'Details',

  // Pages - Square
  'PC.Pages.Square.Square.agent': 'Agent',
  'PC.Pages.Square.Square.pageApp': 'Web App',
  'PC.Pages.Square.Square.skill': 'Skill',
  'PC.Pages.Square.Square.plugin': 'Plugin',
  'PC.Pages.Square.Square.workflow': 'Workflow',
  'PC.Pages.Square.Square.template': 'Template',
  'PC.Pages.Square.Square.all': 'All',
  'PC.Pages.Square.Square.onlyOfficial': 'Official {0} only',
  'PC.Pages.Square.Square.defaultAgentNotConfigured':
    'Default general agent is not configured for this site',
  'PC.Pages.Square.Square.bannerTitle': 'Everyone is an AI Designer',
  'PC.Pages.Square.Square.bannerSubtitle':
    'Next-gen AI application design, development, and practice platform \n No code needed, easy creation, suitable for all users, supports multi-platform publishing and API',
  'PC.Pages.Square.Square.selectCategory': 'Select category',
  'PC.Pages.Square.Square.search': 'Search',

  'PC.Pages.Square.SingleAgent.startUsing': 'Start Using',

  'PC.Pages.Square.SquareComponentInfo.publishedAt': 'Published on {0}',

  'PC.Pages.Square.TemplateItem.publishedAt': 'Published on {0}',

  'PC.Pages.Square.WorkflowIdDetail.templateCopySuccess':
    'Template copied successfully',
  'PC.Pages.Square.WorkflowIdDetail.paramName': 'Parameter Name',
  'PC.Pages.Square.WorkflowIdDetail.paramDescription': 'Parameter Description',
  'PC.Pages.Square.WorkflowIdDetail.paramType': 'Parameter Type',
  'PC.Pages.Square.WorkflowIdDetail.inputMethod': 'Input Method',
  'PC.Pages.Square.WorkflowIdDetail.required': 'Required',
  'PC.Pages.Square.WorkflowIdDetail.yes': 'Yes',
  'PC.Pages.Square.WorkflowIdDetail.no': 'No',
  'PC.Pages.Square.WorkflowIdDetail.defaultValue': 'Default Value',
  'PC.Pages.Square.WorkflowIdDetail.enabled': 'Enabled',
  'PC.Pages.Square.WorkflowIdDetail.workflowDescription':
    'Workflow Description',
  'PC.Pages.Square.WorkflowIdDetail.copyTemplate': 'Copy Template',
  'PC.Pages.Square.WorkflowIdDetail.inputConfig': 'Input Configuration',
  'PC.Pages.Square.WorkflowIdDetail.outputConfig': 'Output Configuration',

  'PC.Pages.Square.SkillDetail.templateCopySuccess':
    'Template copied successfully',
  'PC.Pages.Square.SkillDetail.skillIdInvalid':
    'Skill ID is missing or invalid, cannot export',
  'PC.Pages.Square.SkillDetail.exportFailed': 'Export failed',
  'PC.Pages.Square.SkillDetail.exportSuccess': 'Export successful!',
  'PC.Pages.Square.SkillDetail.exportFailedRetry':
    'Export failed, please try again',
  'PC.Pages.Square.SkillDetail.copyTemplate': 'Copy Template',
  'PC.Pages.Square.SkillDetail.downloadExport': 'Download Export',

  'PC.Pages.Square.PluginDetail.paramName': 'Parameter Name',
  'PC.Pages.Square.PluginDetail.paramDescription': 'Parameter Description',
  'PC.Pages.Square.PluginDetail.paramType': 'Parameter Type',
  'PC.Pages.Square.PluginDetail.inputMethod': 'Input Method',
  'PC.Pages.Square.PluginDetail.required': 'Required',
  'PC.Pages.Square.PluginDetail.yes': 'Yes',
  'PC.Pages.Square.PluginDetail.no': 'No',
  'PC.Pages.Square.PluginDetail.defaultValue': 'Default Value',
  'PC.Pages.Square.PluginDetail.enabled': 'Enabled',
  'PC.Pages.Square.PluginDetail.pluginDescription': 'Plugin Description',
  'PC.Pages.Square.PluginDetail.inputConfig': 'Input Configuration',
  'PC.Pages.Square.PluginDetail.outputConfig': 'Output Configuration',

  'PC.Pages.Square.PluginHeader.cancelCollectSuccess':
    'Uncollected successfully',
  'PC.Pages.Square.PluginHeader.collectSuccess': 'Collected successfully',
  'PC.Pages.Square.PluginHeader.publishedAt': 'Published on {0}',
  'PC.Pages.Square.PluginHeader.collectCount': 'Collect ({0})',

  // Pages - SpaceDevelop
  'PC.Pages.SpaceDevelop.Index.copySuccess': 'Copy created successfully',
  'PC.Pages.SpaceDevelop.Index.deleteSuccess': 'Deleted successfully',
  'PC.Pages.SpaceDevelop.Index.transferSuccess': 'Transferred successfully',
  'PC.Pages.SpaceDevelop.Index.statUserCount': 'Chat Users',
  'PC.Pages.SpaceDevelop.Index.statConvCount': 'Chat Count',
  'PC.Pages.SpaceDevelop.Index.statCollectCount': 'Favorite Users',
  'PC.Pages.SpaceDevelop.Index.statLikeCount': 'Likes',
  'PC.Pages.SpaceDevelop.Index.exportConfigTitle': 'Export Config - {0}',
  'PC.Pages.SpaceDevelop.Index.exportConfigContent':
    'If it contains data tables or knowledge bases, the data itself will not be exported',
  'PC.Pages.SpaceDevelop.Index.deleteConfirmText':
    'Are you sure you want to delete this agent?',
  'PC.Pages.SpaceDevelop.Index.agentFileOnly': 'Please upload a .agent file!',
  'PC.Pages.SpaceDevelop.Index.agentDevelop': 'Agent Development',
  'PC.Pages.SpaceDevelop.Index.searchAgent': 'Search agents',
  'PC.Pages.SpaceDevelop.Index.createAgent': 'Create Agent',
  'PC.Pages.SpaceDevelop.Index.noResults': 'No relevant results found',
  'PC.Pages.SpaceDevelop.Index.agentOverview': 'Agent Overview',

  // Pages - SpaceDevelop > ApplicationItem
  'PC.Pages.SpaceDevelop.ApplicationItem.lastEdited': 'Last edited',
  'PC.Pages.SpaceDevelop.ApplicationItem.published': 'Published',
  'PC.Pages.SpaceDevelop.ApplicationItem.taskType': 'General',
  'PC.Pages.SpaceDevelop.ApplicationItem.chatType': 'Q&A',
  'PC.Pages.SpaceDevelop.ApplicationItem.privateComputer': 'Private Computer',

  // Pages - SpaceDevelop > CreateApiKeyModal
  'PC.Pages.SpaceDevelop.CreateApiKeyModal.deleteConfirmText':
    'Are you sure you want to delete this API Key?',
  'PC.Pages.SpaceDevelop.CreateApiKeyModal.modalTitle': '{0} - API Key',
  'PC.Pages.SpaceDevelop.CreateApiKeyModal.creator': 'Creator',
  'PC.Pages.SpaceDevelop.CreateApiKeyModal.createdTime': 'Created Time',
  'PC.Pages.SpaceDevelop.CreateApiKeyModal.devMode': 'Dev Mode',
  'PC.Pages.SpaceDevelop.CreateApiKeyModal.devModeTooltip':
    'When dev mode is enabled, unpublished changes will be reflected in real time.',
  'PC.Pages.SpaceDevelop.CreateApiKeyModal.addApiKey': 'Add API Key',

  // Pages - SpaceDevelop > CreateTempChatModal
  'PC.Pages.SpaceDevelop.CreateTempChatModal.deleteConfirmText':
    'Are you sure you want to delete this link?',
  'PC.Pages.SpaceDevelop.CreateTempChatModal.modalTitle':
    '{0} - Temporary Chat Link Management',
  'PC.Pages.SpaceDevelop.CreateTempChatModal.linkAddress': 'Link Address',
  'PC.Pages.SpaceDevelop.CreateTempChatModal.qrCode': 'QR Code',
  'PC.Pages.SpaceDevelop.CreateTempChatModal.loginRequired': 'Login Required',
  'PC.Pages.SpaceDevelop.CreateTempChatModal.validity': 'Validity',
  'PC.Pages.SpaceDevelop.CreateTempChatModal.addLink': 'Add Link',

  // Pages - SpaceDevelop > CopyChatWidgetCode
  'PC.Pages.SpaceDevelop.CopyChatWidgetCode.iframeCodeCopy': 'iframe code copy',
  'PC.Pages.SpaceDevelop.CopyChatWidgetCode.copySuccess':
    'iframe code copied successfully',
  'PC.Pages.SpaceDevelop.CopyChatWidgetCode.copyCode': 'Copy code',

  // Pages - SpaceLog
  'PC.Pages.SpaceLog.colMessageId': 'Message ID',
  'PC.Pages.SpaceLog.colConversationId': 'Conversation ID',
  'PC.Pages.SpaceLog.colUserUid': 'User UID',
  'PC.Pages.SpaceLog.colUserName': 'User Nickname (Username)',
  'PC.Pages.SpaceLog.colUserInput': 'User Input',
  'PC.Pages.SpaceLog.colOutput': 'Output',
  'PC.Pages.SpaceLog.colInputToken': 'Input Token',
  'PC.Pages.SpaceLog.colOutputToken': 'Output Token',
  'PC.Pages.SpaceLog.colRequestTime': 'Request Time',
  'PC.Pages.SpaceLog.colElapsedTime': 'Elapsed Time',
  'PC.Pages.SpaceLog.lblMessageId': 'Message ID',
  'PC.Pages.SpaceLog.phMessageId': 'Enter message ID',
  'PC.Pages.SpaceLog.lblUserUid': 'User UID',
  'PC.Pages.SpaceLog.phUserUid': 'Enter user UID',
  'PC.Pages.SpaceLog.lblConversationId': 'Conversation ID',
  'PC.Pages.SpaceLog.phConversationId': 'Enter conversation ID',
  'PC.Pages.SpaceLog.lblUserInput': 'User Input',
  'PC.Pages.SpaceLog.phUserInput':
    'Separate multiple keywords with spaces, enter user message',
  'PC.Pages.SpaceLog.lblTimeRange': 'Time Range',
  'PC.Pages.SpaceLog.lblOutput': 'Output',
  'PC.Pages.SpaceLog.phOutput':
    'Separate multiple keywords with spaces, enter output message to search',
  'PC.Pages.SpaceLog.btnSearch': 'Search',
  'PC.Pages.SpaceLog.btnReset': 'Reset',
  'PC.Pages.SpaceLog.paginationTotal': 'Total {0} items',
  'PC.Pages.SpaceLog.itemsPerPage': 'items / page',

  // Pages - SpaceLog > LogDetails
  'PC.Pages.SpaceLog.LogDetails.title': 'Log Details',
  'PC.Pages.SpaceLog.LogDetails.elapsedTime': 'Elapsed {0} ms',
  'PC.Pages.SpaceLog.LogDetails.messageIdLabel': 'Message ID:',
  'PC.Pages.SpaceLog.LogDetails.calledComponents': 'Called Components',
  'PC.Pages.SpaceLog.LogDetails.nodeDetails': 'Node Details',
  'PC.Pages.SpaceLog.LogDetails.input': 'Input',
  'PC.Pages.SpaceLog.LogDetails.output': 'Output',

  // Pages - SpaceLog > NodeDetails
  'PC.Pages.SpaceLog.NodeDetails.lblType': 'Type',
  'PC.Pages.SpaceLog.NodeDetails.lblStatus': 'Status',
  'PC.Pages.SpaceLog.NodeDetails.statusSuccess': 'Success',
  'PC.Pages.SpaceLog.NodeDetails.lblName': 'Name',
  'PC.Pages.SpaceLog.NodeDetails.lblElapsedTime': 'Elapsed Time',
  'PC.Pages.SpaceLog.NodeDetails.lblStartTime': 'Start Time',
  'PC.Pages.SpaceLog.NodeDetails.lblEndTime': 'End Time',
  'PC.Pages.SpaceLog.NodeDetails.labelSeparator': ': ',
  'PC.Pages.SpaceLog.NodeDetails.typePlugin': 'Plugin',
  'PC.Pages.SpaceLog.NodeDetails.typeWorkflow': 'Workflow',
  'PC.Pages.SpaceLog.NodeDetails.typeKnowledge': 'Knowledge Base',
  'PC.Pages.SpaceLog.NodeDetails.typeVariable': 'Variable',
  'PC.Pages.SpaceLog.NodeDetails.typeTable': 'Data Table',
  'PC.Pages.SpaceLog.NodeDetails.typeModel': 'Model',

  // Pages - SpaceTaskCenter
  'PC.Pages.SpaceTaskCenter.title': 'Task Center',
  'PC.Pages.SpaceTaskCenter.createTask': 'Create Task',

  // Components - FormListItem
  'PC.Components.FormListItem.conditionEqual': 'Equal to',
  'PC.Components.FormListItem.conditionNotEqual': 'Not equal to',
  'PC.Components.FormListItem.conditionGreaterThan': 'Greater than',
  'PC.Components.FormListItem.conditionGreaterThanOrEqual':
    'Greater than or equal to',
  'PC.Components.FormListItem.conditionLessThan': 'Less than',
  'PC.Components.FormListItem.conditionLessThanOrEqual':
    'Less than or equal to',
  'PC.Components.FormListItem.conditionLengthGreaterThan':
    'Length greater than',
  'PC.Components.FormListItem.conditionLengthGreaterThanOrEqual':
    'Length greater than or equal to',
  'PC.Components.FormListItem.conditionLengthLessThan': 'Length less than',
  'PC.Components.FormListItem.conditionLengthLessThanOrEqual':
    'Length less than or equal to',
  'PC.Components.FormListItem.conditionContains': 'Contains',
  'PC.Components.FormListItem.conditionNotContains': 'Does not contain',
  'PC.Components.FormListItem.conditionMatchRegex': 'Matches regex',
  'PC.Components.FormListItem.conditionIsNull': 'Is empty',
  'PC.Components.FormListItem.conditionNotNull': 'Is not empty',
  'PC.Components.FormListItem.noDescription': 'No description',
  'PC.Components.FormListItem.noPreviousNodesOrParams':
    'No upstream node connected or upstream node has no parameters',
  'PC.Components.FormListItem.inputOrReferenceParam':
    'Enter or reference parameter',
  'PC.Components.FormListItem.variableName': 'Variable Name',
  'PC.Components.FormListItem.variableType': 'Variable Type',
  'PC.Components.FormListItem.outputFormat': 'Output Format',
  'PC.Components.FormListItem.outputFormatText': 'Text',
  'PC.Components.FormListItem.outputFormatTextDesc':
    'Text: Use plain text format for response',
  'PC.Components.FormListItem.outputFormatMarkdownDesc':
    'Markdown: Will guide the model to output in Markdown format',
  'PC.Components.FormListItem.outputFormatJsonDesc':
    'JSON: Will guide the model to output in JSON format',
  'PC.Components.FormListItem.outputResult': 'Output result',
  'PC.Components.FormListItem.paramNamePlaceholder': 'Enter parameter name',
  'PC.Components.FormListItem.dataTypePlaceholder': 'Select data type',
  'PC.Components.FormListItem.addChildNode': 'Add child node',
  'PC.Components.FormListItem.addDescription': 'Add description',
  'PC.Components.FormListItem.isRequired': 'Required',
  'PC.Components.FormListItem.descriptionPlaceholder': 'Enter description',

  // Pages - MyComputerManage
  'PC.Pages.MyComputerManage.pageTitle': 'My Computers',
  'PC.Pages.MyComputerManage.filterAll': 'All',
  'PC.Pages.MyComputerManage.filterOnline': 'Online',
  'PC.Pages.MyComputerManage.filterOffline': 'Offline',
  'PC.Pages.MyComputerManage.filterDeactivated': 'Deactivated',
  'PC.Pages.MyComputerManage.addComputer': 'Add Computer',
  'PC.Pages.MyComputerManage.statusDeactivated': 'Deactivated',
  'PC.Pages.MyComputerManage.statusOnline': 'Online',
  'PC.Pages.MyComputerManage.statusOffline': 'Offline',
  'PC.Pages.MyComputerManage.deactivateTooltip':
    'Once deactivated, the computer cannot be controlled by agents',
  'PC.Pages.MyComputerManage.sessionTooltip': 'Session',
  'PC.Pages.MyComputerManage.connectionKeyTooltip':
    'Connection key for standalone client container deployment, click to copy',
  'PC.Pages.MyComputerManage.editTooltip': 'Edit',
  'PC.Pages.MyComputerManage.emptyComputerConfig': 'No computer configurations',
  'PC.Pages.MyComputerManage.deleteConfirmTitle':
    'Confirm delete this computer?',
  'PC.Pages.MyComputerManage.deleteConfirmContent':
    'This action cannot be undone. Please proceed with caution.',

  // Pages - MyComputerManage > EditComputerModal
  'PC.Pages.MyComputerManage.EditComputerModal.editTitle': 'Edit Computer Name',
  'PC.Pages.MyComputerManage.EditComputerModal.addTitle': 'Add Computer',
  'PC.Pages.MyComputerManage.EditComputerModal.nameLabel': 'Computer Name',
  'PC.Pages.MyComputerManage.EditComputerModal.namePlaceholder':
    'Please enter computer name',
  'PC.Pages.MyComputerManage.EditComputerModal.nameRequired':
    'Please enter computer name',
  'PC.Pages.MyComputerManage.EditComputerModal.nameMaxLength':
    'Name cannot exceed 100 characters',
  'PC.Pages.MyComputerManage.EditComputerModal.maxAgentCountLabel':
    'Max Active Agent Sessions',
  'PC.Pages.MyComputerManage.EditComputerModal.maxAgentCountPlaceholder':
    'Please enter',
  'PC.Pages.MyComputerManage.EditComputerModal.maxAgentCountTooltip':
    'Each agent session consumes hundreds of megabytes of memory. Please adjust according to the actual memory of the computer. When the configured limit is exceeded, the system will automatically stop idle sessions (sending a message to a stopped session will reactivate it).',
  'PC.Pages.MyComputerManage.EditComputerModal.maxAgentCountRequired':
    'Please enter the max active agent sessions',
  'PC.Pages.MyComputerManage.EditComputerModal.maxAgentCountRange':
    'Value range is 1 to 99999999',
  'PC.Pages.MyComputerManage.EditComputerModal.descriptionLabel': 'Description',
  'PC.Pages.MyComputerManage.EditComputerModal.descriptionPlaceholder':
    'Please enter description',

  // Toast - MyComputerManage
  'PC.Toast.MyComputerManage.enabled': 'Enabled',
  'PC.Toast.MyComputerManage.disabled': 'Disabled',
  'PC.Toast.MyComputerManage.operationFailed': 'Operation failed',
  'PC.Toast.MyComputerManage.modifiedSuccessfully': 'Modified successfully',
  'PC.Toast.MyComputerManage.createdSuccessfully': 'Created successfully',
  'PC.Toast.MyComputerManage.modifyFailed': 'Modification failed',
  'PC.Toast.MyComputerManage.createFailed': 'Creation failed',
  'PC.Toast.MyComputerManage.connectionKeyCopied':
    'Client connection key copied',

  // Pages - SpaceSkillManage
  'PC.Pages.SpaceSkillManage.pageTitle': 'Skill Management',
  'PC.Pages.SpaceSkillManage.deleteConfirmText':
    'Are you sure you want to delete this skill?',
  'PC.Pages.SpaceSkillManage.skillInfoNotFound': 'Skill information not found',
  'PC.Pages.SpaceSkillManage.skillCopiedSuccessfully':
    'Skill copied successfully',
  'PC.Pages.SpaceSkillManage.skillIdInvalidForExport':
    'Skill ID is invalid or missing, cannot export',
  'PC.Pages.SpaceSkillManage.exportFailed': 'Export failed',
  'PC.Pages.SpaceSkillManage.exportSucceeded': 'Export successful!',
  'PC.Pages.SpaceSkillManage.exportFailedRetry': 'Export failed, please retry',
  'PC.Pages.SpaceSkillManage.importSucceeded': 'Import successful',
  'PC.Pages.SpaceSkillManage.importFailed': 'Import failed',
  'PC.Pages.SpaceSkillManage.exporting': 'Exporting',

  // Pages - SpaceSkillManage > CreateSkill
  'PC.Pages.SpaceSkillManage.CreateSkill.skillCreatedSuccessfully':
    'Skill created successfully',
  'PC.Pages.SpaceSkillManage.CreateSkill.skillUpdatedSuccessfully':
    'Skill updated successfully',
  'PC.Pages.SpaceSkillManage.CreateSkill.createSkill': 'Create Skill',
  'PC.Pages.SpaceSkillManage.CreateSkill.updateSkill': 'Update Skill',
  'PC.Pages.SpaceSkillManage.CreateSkill.iconLabel': 'Icon',
  'PC.Pages.SpaceSkillManage.CreateSkill.nameLabel': 'Name',
  'PC.Pages.SpaceSkillManage.CreateSkill.pleaseInputSkillName':
    'Please enter skill name',
  'PC.Pages.SpaceSkillManage.CreateSkill.nameMaxLength':
    'Name cannot exceed 30 characters!',
  'PC.Pages.SpaceSkillManage.CreateSkill.inputSkillName': 'Enter skill name!',
  'PC.Pages.SpaceSkillManage.CreateSkill.inputSkillNamePlaceholder':
    'Enter skill name',
  'PC.Pages.SpaceSkillManage.CreateSkill.descriptionLabel': 'Description',
  'PC.Pages.SpaceSkillManage.CreateSkill.descriptionPlaceholder':
    'Enter a description to help the model understand when to invoke this skill',

  // Pages - SpaceSkillManage > SkillStatus
  'PC.Pages.SpaceSkillManage.SkillStatus.published': 'Published',
  'PC.Pages.SpaceSkillManage.SkillStatus.reviewing': 'Under Review',
  'PC.Pages.SpaceSkillManage.SkillStatus.developing': 'In Development',
  'PC.Pages.SpaceSkillManage.SkillStatus.rejected': 'Rejected',

  // Pages - SpaceSkillManage > ComponentItem
  'PC.Pages.SpaceSkillManage.ComponentItem.lastEdited': 'Last edited',

  // Pages - SpaceSkillManage > HeaderRightSlot
  'PC.Pages.SpaceSkillManage.HeaderRightSlot.skill': 'Skill',

  // Pages - SpaceSkillManage > ImportSkillProjectModal
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.pleaseSelectFile':
    'Please select a file to import',
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileGetFailed':
    'Failed to get file, please select again',
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileTypeUnsupported':
    'Only .zip, .skill compressed file formats or SKILL.md file are supported',
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileSizeExceeded':
    'File size cannot exceed 20MB',
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.importSkill':
    'Import Skill',
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.confirmImport':
    'Confirm Import',
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.dragOrClickToSelect':
    'Click or drag file to this area to select',
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.uploadHint':
    'Only .zip, .skill compressed file formats or SKILL.md file are supported',
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileSizeHint':
    'File size cannot exceed 20MB',
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.selectedFile':
    'Selected file: ',
  'PC.Pages.SpaceSkillManage.ImportSkillProjectModal.fileSize': 'File size: ',

  // Pages - SpaceSkillManage > type
  'PC.Pages.SpaceSkillManage.type.copyToSpace': 'Copy to Space',
  'PC.Pages.SpaceSkillManage.type.exportSkill': 'Export Skill',

  // Pages - SpaceSkillManage > MainContent
  'PC.Pages.SpaceSkillManage.MainContent.noResultsFound': 'No results found',

  // Pages - PublishAudit
  'PC.Pages.PublishAudit.pageTitle': 'Publish Audit',
  'PC.Pages.PublishAudit.colPublishName': 'Publish Name',
  'PC.Pages.PublishAudit.colPublishNamePlaceholder':
    'Enter plugin, workflow, or agent name',
  'PC.Pages.PublishAudit.colType': 'Type',
  'PC.Pages.PublishAudit.typeAgent': 'Agent',
  'PC.Pages.PublishAudit.typePlugin': 'Plugin',
  'PC.Pages.PublishAudit.typeWorkflow': 'Workflow',
  'PC.Pages.PublishAudit.typeSkill': 'Skill',
  'PC.Pages.PublishAudit.colDescription': 'Description',
  'PC.Pages.PublishAudit.colVersionInfo': 'Version Info',
  'PC.Pages.PublishAudit.colPublisher': 'Publisher',
  'PC.Pages.PublishAudit.colStatus': 'Status',
  'PC.Pages.PublishAudit.statusApplying': 'Pending Review',
  'PC.Pages.PublishAudit.statusPassed': 'Approved',
  'PC.Pages.PublishAudit.statusRejected': 'Rejected',
  'PC.Pages.PublishAudit.colPublishTime': 'Publish Time',
  'PC.Pages.PublishAudit.colAction': 'Action',
  'PC.Pages.PublishAudit.actionPass': 'Approve',
  'PC.Pages.PublishAudit.actionReject': 'Reject',
  'PC.Pages.PublishAudit.actionView': 'View',
  'PC.Pages.PublishAudit.passAuditSuccess': 'Audit approved successfully',

  // Pages - PublishAudit > RejectAuditModal
  'PC.Pages.PublishAudit.RejectAuditModal.title': 'Reject Audit',
  'PC.Pages.PublishAudit.RejectAuditModal.rejectSuccess':
    'Audit rejected successfully',
  'PC.Pages.PublishAudit.RejectAuditModal.reasonLabel':
    'Please enter the rejection reason',
  'PC.Pages.PublishAudit.RejectAuditModal.reasonRequired':
    'Please enter the rejection reason',
  'PC.Pages.PublishAudit.RejectAuditModal.reasonPlaceholder':
    'Please enter the rejection reason',

  // Pages - GlobalModelManage
  'PC.Pages.GlobalModelManage.pageTitle': 'Public Model Management',
  'PC.Pages.GlobalModelManage.addModel': 'Add Model',
  'PC.Pages.GlobalModelManage.all': 'All',
  'PC.Pages.GlobalModelManage.chatText': 'Chat - Text',
  'PC.Pages.GlobalModelManage.embeddings': 'Embeddings',
  'PC.Pages.GlobalModelManage.chatMultiModal': 'Chat - Multimodal',
  'PC.Pages.GlobalModelManage.deleteFailed': 'Delete failed',
  'PC.Pages.GlobalModelManage.accessControlUpdateFailed':
    'Failed to update access control status',
  'PC.Pages.GlobalModelManage.edit': 'Edit',
  'PC.Pages.GlobalModelManage.auth': 'Authorize',
  'PC.Pages.GlobalModelManage.deleteModel': 'Delete Model',
  'PC.Pages.GlobalModelManage.confirmDeleteModel':
    'Are you sure you want to delete model {0}?',
  'PC.Pages.GlobalModelManage.columnModelName': 'Model Name',
  'PC.Pages.GlobalModelManage.columnType': 'Type',
  'PC.Pages.GlobalModelManage.columnModelId': 'Model ID',
  'PC.Pages.GlobalModelManage.columnDescription': 'Description',
  'PC.Pages.GlobalModelManage.columnStatus': 'Status',
  'PC.Pages.GlobalModelManage.statusEnabled': 'Enabled',
  'PC.Pages.GlobalModelManage.statusDisabled': 'Disabled',
  'PC.Pages.GlobalModelManage.columnCreator': 'Creator',
  'PC.Pages.GlobalModelManage.columnUpdateTime': 'Update Time',
  'PC.Pages.GlobalModelManage.columnAccessControl': 'Access Control',
  'PC.Pages.GlobalModelManage.accessControlTooltip':
    'If enabled, authorization is required to use',
  'PC.Pages.GlobalModelManage.accessControlOff': 'Off',
  'PC.Pages.GlobalModelManage.accessControlOn': 'On',
  'PC.Pages.GlobalModelManage.columnActions': 'Actions',
  'PC.Pages.GlobalModelManage.fetchDataFailed': 'Failed to fetch data',

  // Pages - SpacePluginTool
  'PC.Pages.SpacePluginTool.paramName': 'Parameter Name',
  'PC.Pages.SpacePluginTool.inputParamName':
    'Enter parameter name, ensure clear meaning',
  'PC.Pages.SpacePluginTool.paramDescription': 'Parameter Description',
  'PC.Pages.SpacePluginTool.inputParamDescription':
    'Enter parameter description for better AI understanding',
  'PC.Pages.SpacePluginTool.paramType': 'Parameter Type',
  'PC.Pages.SpacePluginTool.selectDataType': 'Select data type',
  'PC.Pages.SpacePluginTool.inputMode': 'Input Mode',
  'PC.Pages.SpacePluginTool.required': 'Required',
  'PC.Pages.SpacePluginTool.defaultValue': 'Default Value',
  'PC.Pages.SpacePluginTool.inputDefaultValue': 'Enter default value',
  'PC.Pages.SpacePluginTool.enable': 'Enable',
  'PC.Pages.SpacePluginTool.requiredParamTooltip':
    'This parameter is required. Fill in a default value to enable this toggle',
  'PC.Pages.SpacePluginTool.action': 'Actions',
  'PC.Pages.SpacePluginTool.requestConfig': 'Request Configuration',
  'PC.Pages.SpacePluginTool.requestMethodAndPath': 'Request Method & Path',
  'PC.Pages.SpacePluginTool.selectRequestMethod': 'Select request method',
  'PC.Pages.SpacePluginTool.inputRequestPath': 'Enter request path',
  'PC.Pages.SpacePluginTool.requestContentFormat': 'Request Content Format',
  'PC.Pages.SpacePluginTool.selectRequestContentFormat':
    'Select request content format',
  'PC.Pages.SpacePluginTool.requestTimeoutConfig': 'Request Timeout',
  'PC.Pages.SpacePluginTool.inputTimeoutConfig': 'Enter timeout configuration',
  'PC.Pages.SpacePluginTool.requestTimeoutPlaceholder':
    'Request timeout in seconds',
  'PC.Pages.SpacePluginTool.inputConfig': 'Input Configuration',
  'PC.Pages.SpacePluginTool.outputConfig': 'Output Configuration',
  'PC.Pages.SpacePluginTool.autoAnalysis': 'Auto Analyze',

  // Pages - SpacePluginTool > PluginHeader
  'PC.Pages.SpacePluginTool.PluginHeader.code': 'Code',
  'PC.Pages.SpacePluginTool.PluginHeader.published': 'Published',
  'PC.Pages.SpacePluginTool.PluginHeader.unpublished': 'Unpublished',
  'PC.Pages.SpacePluginTool.PluginHeader.configSavedAt': 'Config saved at {0}',
  'PC.Pages.SpacePluginTool.PluginHeader.updateUnpublished':
    'Updates unpublished',
  'PC.Pages.SpacePluginTool.PluginHeader.tryRun': 'Try Run',
  'PC.Pages.SpacePluginTool.PluginHeader.publish': 'Publish',

  // Layouts - DynamicMenusLayout
  'PC.Layouts.DynamicMenusLayout.newConversation': 'New Conversation',
  'PC.Layouts.DynamicMenusLayout.home': 'Home',
  'PC.Layouts.DynamicMenusLayout.more': 'More',

  // Layouts - DynamicMenusLayout > CollapseButton
  'PC.Layouts.DynamicMenusLayout.CollapseButton.expandMenu': 'Expand Menu',
  'PC.Layouts.DynamicMenusLayout.CollapseButton.collapseMenu': 'Collapse Menu',

  // Layouts - DynamicMenusLayout > HomeSection
  'PC.Layouts.DynamicMenusLayout.HomeSection.recentlyUsed': 'Recently Used',
  'PC.Layouts.DynamicMenusLayout.HomeSection.noAgentUsed':
    "You haven't used any agents yet",
  'PC.Layouts.DynamicMenusLayout.HomeSection.exploreSquare':
    'Go to the square and start your exploration journey~',
  'PC.Layouts.DynamicMenusLayout.HomeSection.conversationHistory':
    'Conversation History',
  'PC.Layouts.DynamicMenusLayout.HomeSection.viewAll': 'View All',
  'PC.Layouts.DynamicMenusLayout.HomeSection.lookRight': 'Look right 👉',
  'PC.Layouts.DynamicMenusLayout.HomeSection.startFirstConversation':
    'Enter instructions in the chat box to start your first conversation~',

  // Layouts - DynamicMenusLayout > ConversationItem
  'PC.Layouts.DynamicMenusLayout.ConversationItem.executing': 'Executing',

  // Layouts - DynamicMenusLayout > SpaceSection
  'PC.Layouts.DynamicMenusLayout.SpaceSection.personalSpace': 'Personal Space',
  'PC.Layouts.DynamicMenusLayout.SpaceSection.recentlyEdited':
    'Recently Edited',

  // Layouts - DynamicMenusLayout > DevCollect
  'PC.Layouts.DynamicMenusLayout.DevCollect.noCollection': 'No favorites yet',
  'PC.Layouts.DynamicMenusLayout.DevCollect.addByStar':
    'Click the ⭐️ button to add content here~',

  // Layouts - DynamicMenusLayout > CreateNewTeam
  'PC.Layouts.DynamicMenusLayout.CreateNewTeam.createSuccess':
    'Created successfully',
  'PC.Layouts.DynamicMenusLayout.CreateNewTeam.createTeamSpace':
    'Create Team Space',
  'PC.Layouts.DynamicMenusLayout.CreateNewTeam.teamSpaceTips':
    'By creating a team space, projects, agents, plugins, workflows, and knowledge bases can be collaborated and shared within the team.',
  'PC.Layouts.DynamicMenusLayout.CreateNewTeam.teamName': 'Team Name',
  'PC.Layouts.DynamicMenusLayout.CreateNewTeam.pleaseInputTeamName':
    'Please enter a team name',
  'PC.Layouts.DynamicMenusLayout.CreateNewTeam.description': 'Description',

  // Layouts - DynamicMenusLayout > SquareSection
  'PC.Layouts.DynamicMenusLayout.SquareSection.agent': 'Agent',
  'PC.Layouts.DynamicMenusLayout.SquareSection.pageApp': 'Web App',
  'PC.Layouts.DynamicMenusLayout.SquareSection.skill': 'Skill',
  'PC.Layouts.DynamicMenusLayout.SquareSection.plugin': 'Plugin',
  'PC.Layouts.DynamicMenusLayout.SquareSection.workflow': 'Workflow',
  'PC.Layouts.DynamicMenusLayout.SquareSection.template': 'Template',

  // Layouts - DynamicMenusLayout > DynamicSecondMenu
  'PC.Layouts.DynamicMenusLayout.DynamicSecondMenu.pathResolveFailed':
    'Failed to resolve path navigation, please check if the menu path exists',

  // Hooks - UseAppDevFileManagement
  'PC.Hooks.UseAppDevFileManagement.editCanceled': 'Edit canceled',
  'PC.Hooks.UseAppDevFileManagement.loadFileFailed': 'Failed to load file {0}',
  'PC.Hooks.UseAppDevFileManagement.renameFailed': 'Rename failed',
  'PC.Hooks.UseAppDevFileManagement.renameFailedWithError':
    'Rename failed: {0}',

  // Hooks - UseAppDevModelSelector
  'PC.Hooks.UseAppDevModelSelector.configCodingModel':
    'Please configure a coding model in system management or component library. Select a model that supports the Anthropic protocol. Recommended: Zhipu Coding Solution https://bigmodel.cn/glm-coding',
  'PC.Hooks.UseAppDevModelSelector.loadModelListFailed':
    'Failed to load model list, please refresh and try again',
  'PC.Hooks.UseAppDevModelSelector.notice': 'Notice',

  // Hooks - UseAppDevProjectInfo
  'PC.Hooks.UseAppDevProjectInfo.actionBuild': 'Build',
  'PC.Hooks.UseAppDevProjectInfo.actionChat': 'AI Chat',
  'PC.Hooks.UseAppDevProjectInfo.actionCreateProject': 'Create Project',
  'PC.Hooks.UseAppDevProjectInfo.actionDeploy': 'Deploy',
  'PC.Hooks.UseAppDevProjectInfo.actionFileUpdate': 'File Update',
  'PC.Hooks.UseAppDevProjectInfo.actionUnknown': 'Unknown Action',
  'PC.Hooks.UseAppDevProjectInfo.actionUploadProject': 'Upload Project',
  'PC.Hooks.UseAppDevProjectInfo.actionUploadSingleFile': 'Upload Single File',
  'PC.Hooks.UseAppDevProjectInfo.actionVersionRollback': 'Version Rollback',
  'PC.Hooks.UseAppDevProjectInfo.fetchProjectFailed':
    'Unknown error occurred while fetching project details',
  'PC.Hooks.UseAppDevProjectInfo.noPermission':
    'You do not have permission to access this project',

  // Hooks - UseAppDevServer
  'PC.Hooks.UseAppDevServer.devEnvStarted':
    'Development environment started successfully',
  'PC.Hooks.UseAppDevServer.devServerRestarted':
    'Development server restarted successfully',
  'PC.Hooks.UseAppDevServer.keepaliveFailed': 'Keepalive request failed',
  'PC.Hooks.UseAppDevServer.projectIdMissing':
    'Project ID is missing or invalid, cannot restart',
  'PC.Hooks.UseAppDevServer.restartDevServerFailed':
    'Failed to restart development server',
  'PC.Hooks.UseAppDevServer.startDevEnvFailed':
    'Failed to start development environment',

  // Hooks - UseAppDevVersionCompare
  'PC.Hooks.UseAppDevVersionCompare.projectIdNotExist':
    'Project ID does not exist',
  'PC.Hooks.UseAppDevVersionCompare.projectIdOrVersionNotExist':
    'Project ID or target version does not exist',
  'PC.Hooks.UseAppDevVersionCompare.versionCompareFailed':
    'Version comparison failed: {0}',
  'PC.Hooks.UseAppDevVersionCompare.versionSwitchFailed':
    'Version switch failed: {0}',
  'PC.Hooks.UseAppDevVersionCompare.versionSwitchSuccess':
    'Version switched successfully',

  // Hooks - UseAutoErrorHandling
  'PC.Hooks.UseAutoErrorHandling.continueAutoHandling':
    'Continue auto-handling this issue?',
  'PC.Hooks.UseAutoErrorHandling.iframeError':
    'Preview page failed to load, please analyze and fix the error:\n\n```\n{0}\n```',
  'PC.Hooks.UseAutoErrorHandling.limitReached':
    'Auto error handling limit reached',
  'PC.Hooks.UseAutoErrorHandling.logError':
    'Please analyze the following logs and fix the errors:\n\n```\n{0}\n```',
  'PC.Hooks.UseAutoErrorHandling.whiteScreenError':
    'White screen detected in preview, please analyze and fix the following error:\n\n```\n{0}\n```',

  // Hooks - UseCopyTemplate
  'PC.Hooks.UseCopyTemplate.copySuccess': 'Template copied successfully',

  // Common - additional
  'PC.Common.Global.continue': 'Continue',
  'PC.Common.Global.unknownError': 'Unknown error',

  // Pages - SpaceMcpEdit
  'PC.Pages.SpaceMcpEdit.editMcpService': 'Edit MCP Service',
  'PC.Pages.SpaceMcpEdit.updateNotDeployed': 'Updates not deployed',
  'PC.Pages.SpaceMcpEdit.save': 'Save',
  'PC.Pages.SpaceMcpEdit.saveAndDeploy': 'Save & Deploy',
  'PC.Pages.SpaceMcpEdit.saveSuccess': 'MCP service saved successfully',
  'PC.Pages.SpaceMcpEdit.saveAndDeploySuccess':
    'Saved and deployment submitted',
  'PC.Pages.SpaceMcpEdit.selectComponent': 'Please select a component',
  'PC.Pages.SpaceMcpEdit.inputServerConfig':
    'Please enter MCP service configuration',
  'PC.Pages.SpaceMcpEdit.serviceName': 'Service Name',
  'PC.Pages.SpaceMcpEdit.inputServiceName': 'Please enter MCP service name',
  'PC.Pages.SpaceMcpEdit.serviceNamePlaceholder': 'MCP service name',
  'PC.Pages.SpaceMcpEdit.description': 'Description',
  'PC.Pages.SpaceMcpEdit.inputDescription': 'Please describe your MCP service',
  'PC.Pages.SpaceMcpEdit.descriptionPlaceholder': 'Describe your MCP service',
  'PC.Pages.SpaceMcpEdit.installMethod': 'Installation Method',
  'PC.Pages.SpaceMcpEdit.selectInstallMethod':
    'Please select installation method',
  'PC.Pages.SpaceMcpEdit.mcpServiceConfig': 'MCP Service Configuration',
  'PC.Pages.SpaceMcpEdit.mcpConfigJsonTip':
    'MCP service uses JSON configuration, ensure correct format before submitting',
  'PC.Pages.SpaceMcpEdit.invalidJsonFormat': 'Please enter valid JSON format',
  'PC.Pages.SpaceMcpEdit.componentSelect': 'Component Selection',
  'PC.Pages.SpaceMcpEdit.tryRun': 'Try Run',
  'PC.Pages.SpaceMcpEdit.paramName': 'Parameter Name',
  'PC.Pages.SpaceMcpEdit.paramValue': 'Parameter Value',
  'PC.Pages.SpaceMcpEdit.inputParamValue': 'Please enter parameter value',
  'PC.Pages.SpaceMcpEdit.operation': 'Action',
  'PC.Pages.SpaceMcpEdit.inputParams': 'Input Parameters',
  'PC.Pages.SpaceMcpEdit.run': 'Run',
  'PC.Pages.SpaceMcpEdit.debugResult': 'Debug Result',
  'PC.Pages.SpaceMcpEdit.debugResultPlaceholder':
    'Debug results will be displayed here',

  // Pages - SpaceMcpCreate
  'PC.Pages.SpaceMcpCreate.createMcpService': 'Create MCP Service',

  // Pages - SpaceMcpManage
  'PC.Pages.SpaceMcpManage.title': 'MCP Management',
  'PC.Pages.SpaceMcpManage.stopSuccess': 'Stopped successfully',
  'PC.Pages.SpaceMcpManage.confirmStopService':
    'Are you sure you want to stop this service?',
  'PC.Pages.SpaceMcpManage.confirmDeleteService':
    'Are you sure you want to delete this service?',
  'PC.Pages.SpaceMcpManage.searchPlaceholder': 'Search MCP services',
  'PC.Pages.SpaceMcpManage.createMcpService': 'Create MCP Service',
  'PC.Pages.SpaceMcpManage.noResults': 'No matching results found',
  'PC.Pages.SpaceMcpManage.publishedAt': 'Published at',
  'PC.Pages.SpaceMcpManage.createdAt': 'Created at',
  'PC.Pages.SpaceMcpManage.confirmRebuildConfig':
    'Are you sure you want to regenerate the configuration?',
  'PC.Pages.SpaceMcpManage.serviceExportTitle': 'Service Export Management',
  'PC.Pages.SpaceMcpManage.configService': 'Service Configuration',
  'PC.Pages.SpaceMcpManage.configCopyTip':
    'Copy the configuration below to use in any MCP-compatible client. If needed, click',
  'PC.Pages.SpaceMcpManage.rebuildConfig': 'Regenerate Configuration',

  // Pages - MorePage.ApiKey
  'PC.Pages.MorePage.ApiKey.statusEnabled': 'Enabled',
  'PC.Pages.MorePage.ApiKey.statusDisabled': 'Disabled',
  'PC.Pages.MorePage.ApiKey.copiedToClipboard': 'API KEY copied to clipboard',
  'PC.Pages.MorePage.ApiKey.keyName': 'Key Name',
  'PC.Pages.MorePage.ApiKey.hide': 'Hide',
  'PC.Pages.MorePage.ApiKey.show': 'Show',
  'PC.Pages.MorePage.ApiKey.createdTime': 'Created Time',
  'PC.Pages.MorePage.ApiKey.expireTime': 'Expiration Time',
  'PC.Pages.MorePage.ApiKey.neverExpire': 'Never expires',
  'PC.Pages.MorePage.ApiKey.status': 'Status',
  'PC.Pages.MorePage.ApiKey.unknownStatus': 'Unknown',
  'PC.Pages.MorePage.ApiKey.actions': 'Actions',
  'PC.Pages.MorePage.ApiKey.callStats': 'Call Statistics',
  'PC.Pages.MorePage.ApiKey.viewLogs': 'View Logs',
  'PC.Pages.MorePage.ApiKey.permissionConfig': 'Permission Config',
  'PC.Pages.MorePage.ApiKey.edit': 'Edit',
  'PC.Pages.MorePage.ApiKey.delete': 'Delete',
  'PC.Pages.MorePage.ApiKey.confirmDeleteKey':
    'Are you sure to delete key "{0}"?',
  'PC.Pages.MorePage.ApiKey.deleteWarning':
    'This action cannot be undone. Please proceed with caution.',
  'PC.Pages.MorePage.ApiKey.deleteSuccess': 'Deleted successfully',
  'PC.Pages.MorePage.ApiKey.pageTitle': 'API Key Management',
  'PC.Pages.MorePage.ApiKey.pageTips':
    'Manage your API keys and access permissions',
  'PC.Pages.MorePage.ApiKey.createKey': 'Create Key',

  // Pages - MorePage.ApiKeyPermission
  'PC.Pages.MorePage.ApiKeyPermission.permissionSaved':
    'Permission configuration saved successfully',
  'PC.Pages.MorePage.ApiKeyPermission.title': 'Permission Config - {0}',
  'PC.Pages.MorePage.ApiKeyPermission.selectAll': 'Select All Permissions',
  'PC.Pages.MorePage.ApiKeyPermission.expandAll': 'Expand All',
  'PC.Pages.MorePage.ApiKeyPermission.collapseAll': 'Collapse All',
  'PC.Pages.MorePage.ApiKeyPermission.noPermissionDefs':
    'No permission definitions',

  // Pages - MorePage.ApiKeyLogs
  'PC.Pages.MorePage.ApiKeyLogs.pageTitle': 'API Call Logs',

  // Pages - EcosystemTemplate
  'PC.Pages.EcosystemTemplate.title': 'Templates',
  'PC.Pages.EcosystemTemplate.unnamedTemplate': 'Unnamed Template',
  'PC.Pages.EcosystemTemplate.noDescription': 'No description',
  'PC.Pages.EcosystemTemplate.fetchListFailed': 'Failed to fetch template list',
  'PC.Pages.EcosystemTemplate.updateFailed': 'Update failed',
  'PC.Pages.EcosystemTemplate.updateSuccess': 'Updated successfully',
  'PC.Pages.EcosystemTemplate.offlineFailed': 'Offline failed',
  'PC.Pages.EcosystemTemplate.offlineSuccess': 'Taken offline',
  'PC.Pages.EcosystemTemplate.createSuccess': 'Created successfully',
  'PC.Pages.EcosystemTemplate.fetchDataFailed': 'Failed to fetch data',
  'PC.Pages.EcosystemTemplate.agent': 'Agent',
  'PC.Pages.EcosystemTemplate.workflow': 'Workflow',
  'PC.Pages.EcosystemTemplate.pageApp': 'Web App',
  'PC.Pages.EcosystemTemplate.fetchDetailFailed': 'Failed to fetch details',
  'PC.Pages.EcosystemTemplate.templateOffline': 'Template taken offline',
  'PC.Pages.EcosystemTemplate.templateWithdrawn':
    'Template publication withdrawn',
  'PC.Pages.EcosystemTemplate.searchPlaceholder': 'Search templates',
  'PC.Pages.EcosystemTemplate.createShare': 'Create Share',
  'PC.Pages.EcosystemTemplate.viewDetail': 'View Details',

  // Pages - EcosystemPlugin
  'PC.Pages.EcosystemPlugin.title': 'Plugins',
  'PC.Pages.EcosystemPlugin.unnamedPlugin': 'Unnamed Plugin',
  'PC.Pages.EcosystemPlugin.noDescription': 'No description',
  'PC.Pages.EcosystemPlugin.fetchListFailed': 'Failed to fetch plugin list',
  'PC.Pages.EcosystemPlugin.operationFailed': 'Operation failed',
  'PC.Pages.EcosystemPlugin.updateSuccess': 'Updated successfully',
  'PC.Pages.EcosystemPlugin.updateFailed': 'Update failed',
  'PC.Pages.EcosystemPlugin.offlineFailed': 'Offline failed',
  'PC.Pages.EcosystemPlugin.offlineSuccess': 'Taken offline',
  'PC.Pages.EcosystemPlugin.createSuccess': 'Created successfully',
  'PC.Pages.EcosystemPlugin.fetchDataFailed': 'Failed to fetch data',
  'PC.Pages.EcosystemPlugin.fetchDetailFailed':
    'Failed to fetch plugin details',
  'PC.Pages.EcosystemPlugin.pluginOffline': 'Plugin taken offline',
  'PC.Pages.EcosystemPlugin.pluginWithdrawn': 'Plugin publication withdrawn',
  'PC.Pages.EcosystemPlugin.searchPlaceholder': 'Search plugins',
  'PC.Pages.EcosystemPlugin.createShare': 'Create Share',

  // Pages - PublishedManage
  'PC.Pages.PublishedManage.pageTitle': 'Published Management',
  'PC.Pages.PublishedManage.view': 'View',
  'PC.Pages.PublishedManage.offShelf': 'Unpublish',
  'PC.Pages.PublishedManage.publishName': 'Publish Name',
  'PC.Pages.PublishedManage.searchNamePlaceholder':
    'Enter plugin, workflow or agent name',
  'PC.Pages.PublishedManage.type': 'Type',
  'PC.Pages.PublishedManage.typeAgent': 'Agent',
  'PC.Pages.PublishedManage.typePlugin': 'Plugin',
  'PC.Pages.PublishedManage.typeWorkflow': 'Workflow',
  'PC.Pages.PublishedManage.typeSkill': 'Skill',
  'PC.Pages.PublishedManage.description': 'Description',
  'PC.Pages.PublishedManage.versionInfo': 'Version Info',
  'PC.Pages.PublishedManage.publisher': 'Publisher',
  'PC.Pages.PublishedManage.publishTime': 'Publish Time',
  'PC.Pages.PublishedManage.actions': 'Actions',
  'PC.Pages.PublishedManage.fetchDataFailed': 'Failed to fetch data',

  // Pages - PublishedManage.OffshelfModal
  'PC.Pages.PublishedManage.OffshelfModal.offShelfSuccess':
    'Unpublished successfully',
  'PC.Pages.PublishedManage.OffshelfModal.title': 'Unpublish',
  'PC.Pages.PublishedManage.OffshelfModal.reasonLabel':
    'Please enter the reason for unpublishing',
  'PC.Pages.PublishedManage.OffshelfModal.reasonRequired':
    'Please enter the reason for unpublishing',
  'PC.Pages.PublishedManage.OffshelfModal.reasonPlaceholder':
    'Please enter the reason for unpublishing',

  // Pages - SpaceSquare
  'PC.Pages.SpaceSquare.title': 'Space Square',
  'PC.Pages.SpaceSquare.confirmOffShelf':
    'Are you sure you want to unpublish this {0}?',
  'PC.Pages.SpaceSquare.offShelf': 'Unpublish',
  'PC.Pages.SpaceSquare.agent': 'Agent',
  'PC.Pages.SpaceSquare.template': 'Template',
  'PC.Pages.SpaceSquare.plugin': 'Plugin',
  'PC.Pages.SpaceSquare.workflow': 'Workflow',
  'PC.Pages.SpaceSquare.skill': 'Skill',

  // Pages - EcosystemMcp
  'PC.Pages.EcosystemMcp.title': 'MCP',
  'PC.Pages.EcosystemMcp.unnamedMcp': 'Unnamed MCP',
  'PC.Pages.EcosystemMcp.noDescription': 'No description',
  'PC.Pages.EcosystemMcp.fetchDetailFailed': 'Failed to fetch MCP details',
  'PC.Pages.EcosystemMcp.operationFailed': 'Operation failed',
  'PC.Pages.EcosystemMcp.enableSuccess': 'Enabled successfully',
  'PC.Pages.EcosystemMcp.disableFailed': 'Disable failed',
  'PC.Pages.EcosystemMcp.disableSuccess': 'Disabled successfully',
  'PC.Pages.EcosystemMcp.searchPlaceholder': 'Search MCP',

  // Components - ParamsSetting
  'PC.Components.ParamsSetting.paramName': 'Parameter Name',
  'PC.Components.ParamsSetting.paramType': 'Parameter Type',
  'PC.Components.ParamsSetting.required': 'Required',
  'PC.Components.ParamsSetting.notRequired': 'Optional',
  'PC.Components.ParamsSetting.defaultValue': 'Default Value',
  'PC.Components.ParamsSetting.pleaseFill': 'Please fill in',
  'PC.Components.ParamsSetting.enable': 'Enable',
  'PC.Components.ParamsSetting.enableTooltip':
    'When a parameter is disabled, the model will not be able to see it. If the parameter has a default value and is invisible, the agent will only use the set value when called.',
  'PC.Components.ParamsSetting.requiredParamTooltip':
    'This is a required parameter. The switch will be available after filling in a default value.',

  // Components - CollapseComponentList
  'PC.Components.CollapseComponentList.pluginDesc':
    "Plugins enable the agent to call external APIs, such as searching information, browsing web pages, generating images, etc., expanding the agent's capabilities and use cases.",
  'PC.Components.CollapseComponentList.workflowDesc':
    'Workflows support combining plugins, large language models, code blocks, and other functions in a visual way to achieve complex and stable business process orchestration, such as travel planning, report analysis, etc.',
  'PC.Components.CollapseComponentList.mcpDesc':
    'The agent can connect to various service APIs through the standardized protocol (MCP) and initiate calls.',
  'PC.Components.CollapseComponentList.tableDesc':
    'Organize data in a table structure to implement functions such as bookmarks and book management.',
  'PC.Components.CollapseComponentList.pageDesc':
    'Pages are the visual interface of the agent, through which users can interact with the agent.',
  'PC.Components.CollapseComponentList.skillDesc':
    "Skills are the agent's capabilities, through which users can interact with the agent.",
  'PC.Components.CollapseComponentList.settings': 'Settings',
  'PC.Components.CollapseComponentList.delete': 'Delete',

  // Components - McpCollapseComponentList
  'PC.Components.McpCollapseComponentList.agentDesc':
    'The agent is responsible for receiving user task requests, performing intelligent analysis and decision-making, coordinating the collaborative work of various modules, and ultimately providing response results.',
  'PC.Components.McpCollapseComponentList.pluginDesc':
    "Plugins enable the agent to call external APIs, such as searching information, browsing web pages, generating images, etc., expanding the agent's capabilities and use cases.",
  'PC.Components.McpCollapseComponentList.workflowDesc':
    'Workflows support combining plugins, large language models, code blocks, and other functions in a visual way to achieve complex and stable business process orchestration, such as travel planning, report analysis, etc.',
  'PC.Components.McpCollapseComponentList.knowledgeDesc':
    'After uploading documents, URLs, and third-party data sources as text knowledge bases, when users send messages, the agent can reference the content in the text knowledge to answer user questions.',
  'PC.Components.McpCollapseComponentList.tableDesc':
    'Organize data in a table structure to implement functions such as bookmarks and book management.',
  'PC.Components.McpCollapseComponentList.delete': 'Delete',

  // Components - EcosystemSelectCategory
  'PC.Components.EcosystemSelectCategory.all': 'All',
  'PC.Components.EcosystemSelectCategory.pleaseSelectCategory':
    'Please select a category',

  // Components - FoldWrap
  'PC.Components.FoldWrap.pleaseInputNodeName': 'Please enter node name',
  'PC.Components.FoldWrap.pleaseInputNodeDesc': 'Please enter node description',
  'PC.Components.FoldWrap.noContent': 'No content',

  // Components - ShowStand
  'PC.Components.ShowStand.title': 'Showcase',

  // Components - SlateVariableEditor
  'PC.Components.SlateVariableEditor.variable': 'Variable',
  'PC.Components.SlateVariableEditor.placeholder': 'Please enter content...',

  // Components - NewConversationSet
  'PC.Components.NewConversationSet.conversationSettings':
    'Conversation Settings',
  'PC.Components.NewConversationSet.startConversation': 'Start Conversation',
  'PC.Components.NewConversationSet.settingsLockedHint':
    'Once the conversation starts, the settings cannot be modified.',
  'PC.Components.NewConversationSet.pleaseSelectField': 'Please select {0}',
  'PC.Components.NewConversationSet.pleaseInputField': 'Please enter {0}',

  // Components - UploadImportConfig
  'PC.Components.UploadImportConfig.importSuccess':
    'Configuration imported successfully',
  'PC.Components.UploadImportConfig.uploadFailed': '{0} upload failed',
  'PC.Components.UploadImportConfig.notice': 'Notice',
  'PC.Components.UploadImportConfig.checkConfigHint':
    'If the configuration contains plugins or MCP, please check the related configuration after import to ensure correct operation.',
  'PC.Components.UploadImportConfig.invalidFileType':
    'Please upload a .table, .workflow or .plugin file!',
  'PC.Components.UploadImportConfig.importConfig': 'Import Configuration',

  // Components - ComputerTypeSelector
  'PC.Components.ComputerTypeSelector.noComputerAvailable':
    'No computer available',
  'PC.Components.ComputerTypeSelector.computerUnavailable':
    'Computer unavailable',
  'PC.Components.ComputerTypeSelector.personalComputerUnavailable':
    'Personal computer unavailable',
  'PC.Components.ComputerTypeSelector.selectComputer': 'Select computer',

  // Components - PluginCardDetail
  'PC.Components.PluginCardDetail.back': 'Back',
  'PC.Components.PluginCardDetail.newVersion': 'New version available',
  'PC.Components.PluginCardDetail.version': 'Version',
  'PC.Components.PluginCardDetail.publishDate': 'Publish Date',
  'PC.Components.PluginCardDetail.author': 'Author',
  'PC.Components.PluginCardDetail.uninstall': 'Uninstall',
  'PC.Components.PluginCardDetail.install': 'Install',
  'PC.Components.PluginCardDetail.pluginDescription': 'Plugin Description',
  'PC.Components.PluginCardDetail.detailedInfo': 'Detailed Information',
  'PC.Components.PluginCardDetail.pluginName': 'Plugin Name',
  'PC.Components.PluginCardDetail.supportedPlatforms': 'Supported Platforms',

  // Components - XProTable
  'PC.Components.XProTable.index': 'Index',
  'PC.Components.XProTable.reset': 'Reset',
  'PC.Components.XProTable.query': 'Query',

  // Components - OperationBtn
  'PC.Components.OperationBtn.confirmAction': 'Confirm Action',
  'PC.Components.OperationBtn.confirmActionDesc':
    'Are you sure you want to perform this action?',

  // Components - CodeEditor
  'PC.Components.CodeEditor.loadingEditor': 'Loading editor...',
  'PC.Components.CodeEditor.codeAssistant': 'Code Assistant',

  // Components - PluginTryRunModal
  'PC.Components.PluginTryRunModal.paramName': 'Parameter Name',
  'PC.Components.PluginTryRunModal.paramValue': 'Parameter Value',
  'PC.Components.PluginTryRunModal.pleaseInputParamValue':
    'Please enter parameter value',
  'PC.Components.PluginTryRunModal.tryRun': 'Try Run',
  'PC.Components.PluginTryRunModal.inputParams': 'Input Parameters',
  'PC.Components.PluginTryRunModal.run': 'Run',
  'PC.Components.PluginTryRunModal.debugResult': 'Debug Result',
  'PC.Components.PluginTryRunModal.debugResultPlaceholder':
    'Debug results will be displayed here',

  // Components - PluginAutoAnalysis
  'PC.Components.PluginAutoAnalysis.paramName': 'Parameter Name',
  'PC.Components.PluginAutoAnalysis.paramValue': 'Parameter Value',
  'PC.Components.PluginAutoAnalysis.pleaseInputParamValue':
    'Please enter parameter value',
  'PC.Components.PluginAutoAnalysis.autoAnalysis': 'Auto Analysis',
  'PC.Components.PluginAutoAnalysis.inputParams': 'Input Parameters',

  // Components - RecommendList
  'PC.Components.RecommendList.pagePreview': 'Page Preview',
  'PC.Components.RecommendList.pagePathParamError':
    'Page path parameter configuration error',
  'PC.Components.RecommendList.pagePathConfigError':
    'Page path configuration error',
  'PC.Components.RecommendList.linkAddressConfigError':
    'Link address configuration error',

  // Components - ExampleNavigation
  'PC.Components.ExampleNavigation.exampleCenter': 'Example Center',
  'PC.Components.ExampleNavigation.backgroundStyle': 'Background Style Switch',
  'PC.Components.ExampleNavigation.navigationTokenGuide':
    'Navigation Token Guide',
  'PC.Components.ExampleNavigation.antdShowcase': 'Ant Design Showcase',
  'PC.Components.ExampleNavigation.home': 'Home',
  'PC.Components.ExampleNavigation.back': 'Back',

  // Components - PromptOptimizeModal
  'PC.Components.PromptOptimizeModal.replace': 'Replace',
  'PC.Components.PromptOptimizeModal.exit': 'Exit',
  'PC.Components.PromptOptimizeModal.defaultOptimizePrompt':
    'A smart robot that can provide work help and suggestions',
  'PC.Components.PromptOptimizeModal.autoOptimize': 'Auto Optimize',
  'PC.Components.PromptOptimizeModal.promptPlaceholder':
    'Please describe your prompt requirements, such as role definition, skill requirements, etc.',

  // Components - OtherAction
  'PC.Components.OtherAction.confirmDeleteLoopNode':
    'Are you sure you want to delete the loop node?',
  'PC.Components.OtherAction.rename': 'Rename',
  'PC.Components.OtherAction.createCopy': 'Create Copy',
  'PC.Components.OtherAction.testNode': 'Test this node',

  // Components - ModelSetting
  'PC.Components.ModelSetting.pleaseSelectModel': 'Please select a model',
  'PC.Components.ModelSetting.precisionMode': 'Precision',
  'PC.Components.ModelSetting.balancedMode': 'Balanced',
  'PC.Components.ModelSetting.creativeMode': 'Creative',
  'PC.Components.ModelSetting.customMode': 'Custom',
  'PC.Components.ModelSetting.model': 'Model',
  'PC.Components.ModelSetting.generateDiversity': 'Generation Diversity',
  'PC.Components.ModelSetting.advancedSettings': 'Advanced Settings',
  'PC.Components.ModelSetting.generateRandomness': 'Randomness',
  'PC.Components.ModelSetting.temperatureDesc':
    "Temperature: Raising the temperature makes the model's output more diverse and creative. Conversely, lowering the temperature makes the output more instruction-following but less diverse. It is recommended not to adjust it together with 'Top p'.",
  'PC.Components.ModelSetting.topPDesc':
    "Top p is the cumulative probability: When generating output, the model selects from the highest probability words until the cumulative probability reaches the Top p value. This limits the model to only select these high-probability words, thus controlling output diversity. It is recommended not to adjust it together with 'Randomness'.",
  'PC.Components.ModelSetting.inputOutputSettings': 'Input & Output Settings',
  'PC.Components.ModelSetting.maxReplyLength': 'Max Reply Length',
  'PC.Components.ModelSetting.maxTokensDesc':
    'Controls the upper limit of the model output Tokens length. Typically, 100 Tokens is approximately equal to 150 Chinese characters.',

  // Components - MoveCopyComponent
  'PC.Components.MoveCopyComponent.move': 'Move',
  'PC.Components.MoveCopyComponent.copy': 'Copy',
  'PC.Components.MoveCopyComponent.agent': 'Agent',
  'PC.Components.MoveCopyComponent.page': 'Page',
  'PC.Components.MoveCopyComponent.plugin': 'Plugin',
  'PC.Components.MoveCopyComponent.workflow': 'Workflow',
  'PC.Components.MoveCopyComponent.skill': 'Skill',
  'PC.Components.MoveCopyComponent.component': 'Component',
  'PC.Components.MoveCopyComponent.selectTargetSpace':
    'Select target space to ',

  // Components - SelectComponent
  'PC.Components.SelectComponent.add': 'Add ',
  'PC.Components.SelectComponent.userAvatar': 'User avatar',
  'PC.Components.SelectComponent.publishedAt': 'Published ',
  'PC.Components.SelectComponent.added': 'Added',
  'PC.Components.SelectComponent.addBtn': 'Add',
  'PC.Components.SelectComponent.search': 'Search',

  // Components - Skill
  'PC.Components.Skill.settings': 'Settings',
  'PC.Components.Skill.configInputParams': 'Configure Input Parameters',
  'PC.Components.Skill.paramName': 'Parameter Name',
  'PC.Components.Skill.defaultValue': 'Default Value',
  'PC.Components.Skill.enable': 'Enable',
  'PC.Components.Skill.enableDesc':
    'When a parameter is set to invisible, the model will not be able to see it. If the parameter has a default value and is invisible, the agent will only use this set value by default when calling the plugin',
  'PC.Components.Skill.remove': 'Remove',

  // Components - AgentContent
  'PC.Components.AgentContent.from': 'From',

  // Components - TimedTask
  'PC.Components.TimedTask.taskCancelled': 'Timed task cancelled',
  'PC.Components.TimedTask.inProgress': 'In Progress',
  'PC.Components.TimedTask.cancelled': 'Cancelled',
  'PC.Components.TimedTask.timedTask': 'Timed Tasks',
  'PC.Components.TimedTask.addTask': 'Add',

  // Components - HistoryConversation
  'PC.Components.HistoryConversation.title': 'History Conversations',

  // Components - EcosystemCard
  'PC.Components.EcosystemCard.enabled': 'Enabled',
  'PC.Components.EcosystemCard.versionUpdate': 'New version available',

  // Components - EcosystemDetailDrawer
  'PC.Components.EcosystemDetailDrawer.updateConfig': 'Update Config',
  'PC.Components.EcosystemDetailDrawer.update': 'Update',
  'PC.Components.EcosystemDetailDrawer.saveConfigAndEnable':
    'Save Config & Enable',
  'PC.Components.EcosystemDetailDrawer.enable': 'Enable',
  'PC.Components.EcosystemDetailDrawer.enablePublishOfficialTip':
    'After enabling, it will be published to the official service list',
  'PC.Components.EcosystemDetailDrawer.enablePublishSquareTip':
    'After enabling, it will be published to the system marketplace',
  'PC.Components.EcosystemDetailDrawer.disableOfficialTip':
    'After disabling, it will no longer be visible in the official service list',
  'PC.Components.EcosystemDetailDrawer.disableSquareTip':
    'After disabling, it will no longer be visible in the marketplace {0}',
  'PC.Components.EcosystemDetailDrawer.disable': 'Disable',
  'PC.Components.EcosystemDetailDrawer.pleaseInput': 'Please input {0}',
  'PC.Components.EcosystemDetailDrawer.newVersionUpdate':
    'New version available',
  'PC.Components.EcosystemDetailDrawer.fromAuthor': 'From {0}',
  'PC.Components.EcosystemDetailDrawer.usageDoc': 'Documentation',

  // Components - EcosystemShareModal
  'PC.Components.EcosystemShareModal.paramName': 'Parameter Name',
  'PC.Components.EcosystemShareModal.paramDesc': 'Parameter Description',
  'PC.Components.EcosystemShareModal.required': 'Required',
  'PC.Components.EcosystemShareModal.saveAndPublish': 'Save & Publish',
  'PC.Components.EcosystemShareModal.offline': 'Offline',
  'PC.Components.EcosystemShareModal.withdrawPublish': 'Withdraw',
  'PC.Components.EcosystemShareModal.saveDraft': 'Save Draft',
  'PC.Components.EcosystemShareModal.editShare': 'Edit Share',
  'PC.Components.EcosystemShareModal.createShare': 'Create Share',
  'PC.Components.EcosystemShareModal.componentInfo': '{0} Info',
  'PC.Components.EcosystemShareModal.addComponent': 'Add {0}',
  'PC.Components.EcosystemShareModal.pleaseSelectComponent':
    'Please select {0}',
  'PC.Components.EcosystemShareModal.pleaseSelectComponentFirst':
    'Please select {0} first',
  'PC.Components.EcosystemShareModal.publisherInfo': 'Publisher Info',
  'PC.Components.EcosystemShareModal.pleaseInputPublisherInfo':
    'Please input publisher info',
  'PC.Components.EcosystemShareModal.publisherInfoPlaceholder':
    'Please input publisher info, e.g. Nuwa Official',
  'PC.Components.EcosystemShareModal.pluginParams': 'Plugin Parameters',
  'PC.Components.EcosystemShareModal.usageDoc': 'Documentation',
  'PC.Components.EcosystemShareModal.pleaseInputUsageDoc':
    'Please input documentation',
  'PC.Components.EcosystemShareModal.usageDocPlaceholder':
    'Please input documentation (Markdown supported)',

  // Components - ChatTitleActions
  'PC.Components.ChatTitleActions.incompleteAgentInfo':
    'Agent information is incomplete',
  'PC.Components.ChatTitleActions.uncollected': 'Removed from favorites',
  'PC.Components.ChatTitleActions.uncollectFailed':
    'Failed to remove from favorites',
  'PC.Components.ChatTitleActions.collected': 'Added to favorites',
  'PC.Components.ChatTitleActions.collectFailed': 'Failed to add to favorites',
  'PC.Components.ChatTitleActions.shareLinkCopied':
    'Share link copied to clipboard',
  'PC.Components.ChatTitleActions.noShareLink': 'No share link available',
  'PC.Components.ChatTitleActions.templateCopySuccess':
    'Template copied successfully',
  'PC.Components.ChatTitleActions.share': 'Share',
  'PC.Components.ChatTitleActions.collect': 'Favorite',
  'PC.Components.ChatTitleActions.copyTemplate': 'Copy Template',

  // Components - AgentConversation
  'PC.Components.AgentConversation.title': 'Related Conversations',
  'PC.Components.AgentConversation.viewMore': 'View More',
  'PC.Components.AgentConversation.emptyDesc': 'No related conversations',

  // Components - CreateTimedTask
  'PC.Components.CreateTimedTask.createSuccess':
    'Timed task created successfully',
  'PC.Components.CreateTimedTask.updateSuccess':
    'Timed task updated successfully',
  'PC.Components.CreateTimedTask.createTitle': 'Create Timed Task',
  'PC.Components.CreateTimedTask.updateTitle': 'Update Timed Task',
  'PC.Components.CreateTimedTask.timedPeriod': 'Timed Period',
  'PC.Components.CreateTimedTask.taskName': 'Task Name',
  'PC.Components.CreateTimedTask.pleaseInputTaskName': 'Please input task name',
  'PC.Components.CreateTimedTask.taskContent': 'Task Content',
  'PC.Components.CreateTimedTask.pleaseInputTaskContent':
    'Please input task content',
  'PC.Components.CreateTimedTask.taskContentPlaceholder':
    'Please input the task information to execute. The more detailed the information, the higher the success rate',

  // Components - TaskList
  'PC.Components.TaskList.noInProgressTasks': 'No in-progress tasks',
  'PC.Components.TaskList.noCancelledTasks': 'No cancelled tasks',
  'PC.Components.TaskList.confirmCancelTask':
    'Are you sure you want to cancel this timed task?',

  // Components - NewMonaco
  'PC.Components.NewMonaco.code': 'Code',
  'PC.Components.NewMonaco.pleaseSelectLanguage': 'Please select language',

  // Components - Monaco
  'PC.Components.Monaco.code': 'Code',
  'PC.Components.Monaco.pleaseSelectLanguage': 'Please select language',

  // Components - CodeOptimizeModal
  'PC.Components.CodeOptimizeModal.replace': 'Replace',
  'PC.Components.CodeOptimizeModal.exit': 'Exit',
  'PC.Components.CodeOptimizeModal.placeholder':
    'Please describe your specific business requirements in detail',

  // Components - MonacoEditor
  'PC.Components.MonacoEditor.loadingEditor': 'Loading editor...',
  'PC.Components.MonacoEditor.loadingEditorDesc':
    'Please wait, Monaco Editor is initializing',
  'PC.Components.MonacoEditor.selectFileToEdit': 'Select a file to edit',
  'PC.Components.MonacoEditor.selectFileToEditDesc':
    'Select a file from the file tree on the left, or create a new file to start editing',

  // Components - CreateNewPlugin
  'PC.Components.CreateNewPlugin.pluginCreated': 'Plugin created',
  'PC.Components.CreateNewPlugin.pluginUpdated': 'Plugin updated successfully',
  'PC.Components.CreateNewPlugin.createPlugin': 'Create Plugin',
  'PC.Components.CreateNewPlugin.updatePlugin': 'Update Plugin',
  'PC.Components.CreateNewPlugin.pluginName': 'Plugin Name',
  'PC.Components.CreateNewPlugin.pleaseInputPluginName':
    'Please input plugin name',
  'PC.Components.CreateNewPlugin.nameMaxChars':
    'Name cannot exceed 30 characters!',
  'PC.Components.CreateNewPlugin.pleaseInputPluginNameBang':
    'Please input plugin name!',
  'PC.Components.CreateNewPlugin.placeholderPluginName':
    'Please input a plugin name that is clear and complies with platform guidelines',
  'PC.Components.CreateNewPlugin.pluginDescription': 'Plugin Description',
  'PC.Components.CreateNewPlugin.pleaseInputPluginDesc':
    'Please input the main features and usage scenarios of the plugin',
  'PC.Components.CreateNewPlugin.placeholderPluginDesc':
    'Please input the main features and usage scenarios of the plugin, ensuring the content complies with platform guidelines. This helps users/models better understand',
  'PC.Components.CreateNewPlugin.pluginCreateTool':
    'Plugin Tool Creation Method',
  'PC.Components.CreateNewPlugin.pleaseSelectPluginCreateTool':
    'Please select a plugin tool creation method',
  'PC.Components.CreateNewPlugin.ideRuntime': 'IDE Runtime',
  'PC.Components.CreateNewPlugin.pleaseSelectPluginMode':
    'Please select plugin mode',

  // Components - CreateWorkflow
  'PC.Components.CreateWorkflow.workflowCreated':
    'Workflow created successfully',
  'PC.Components.CreateWorkflow.workflowUpdated':
    'Workflow updated successfully',
  'PC.Components.CreateWorkflow.createWorkflow': 'Create Workflow',
  'PC.Components.CreateWorkflow.updateWorkflow': 'Update Workflow',
  'PC.Components.CreateWorkflow.name': 'Name',
  'PC.Components.CreateWorkflow.pleaseInputWorkflowName':
    'Please input workflow name',
  'PC.Components.CreateWorkflow.nameMaxChars':
    'Name cannot exceed 30 characters!',
  'PC.Components.CreateWorkflow.pleaseInputWorkflowNameBang':
    'Please input workflow name!',
  'PC.Components.CreateWorkflow.placeholderWorkflowName': 'Input workflow name',
  'PC.Components.CreateWorkflow.description': 'Description',
  'PC.Components.CreateWorkflow.placeholderWorkflowDesc':
    'Please input a description so the model understands when to invoke this workflow',
  'PC.Components.CreateWorkflow.icon': 'Icon',

  // Components - CreatedItem
  'PC.Components.CreatedItem.create': 'Create',
  'PC.Components.CreatedItem.update': 'Edit',
  'PC.Components.CreatedItem.dataTable': 'Data Table',
  'PC.Components.CreatedItem.knowledge': 'Knowledge Base',
  'PC.Components.CreatedItem.plugin': 'Plugin',
  'PC.Components.CreatedItem.workflow': 'Workflow',
  'PC.Components.CreatedItem.name': 'Name',
  'PC.Components.CreatedItem.pleaseInputName': 'Please input name',
  'PC.Components.CreatedItem.nameMaxChars': 'Name cannot exceed 30 characters!',
  'PC.Components.CreatedItem.pleaseInputNameBang': 'Please input name!',
  'PC.Components.CreatedItem.placeholderName': 'Please input name',
  'PC.Components.CreatedItem.description': 'Description',
  'PC.Components.CreatedItem.placeholderDesc': 'Please input description',
  'PC.Components.CreatedItem.toolCreateMethod': 'Tool Creation Method',
  'PC.Components.CreatedItem.ideRuntime': 'IDE Runtime',

  // Components - TiptapVariableInput
  'PC.Components.TiptapVariableInput.placeholder': 'Type @ or { to get started',

  // Components - VariableList
  'PC.Components.VariableList.noMatchingVariable': 'No matching variable found',
  'PC.Components.VariableList.tabVariables': 'Variables',
  'PC.Components.VariableList.tabTools': 'Tools',
  'PC.Components.VariableList.tabSkills': 'Skills',
  'PC.Components.VariableList.description':
    'Used to save user personal information, allowing the agent to remember user characteristics and make responses more personalized.',

  // Components - MarkdownCustomProcess
  'PC.Components.MarkdownCustomProcess.noData': 'No data available',
  'PC.Components.MarkdownCustomProcess.noName': 'No name',
  'PC.Components.MarkdownCustomProcess.viewDetail': 'View details',
  'PC.Components.MarkdownCustomProcess.closePreview': 'Close preview',
  'PC.Components.MarkdownCustomProcess.previewPage': 'Preview page',
  'PC.Components.MarkdownCustomProcess.collapse': 'Collapse',
  'PC.Components.MarkdownCustomProcess.expand': 'Expand',
  'PC.Components.MarkdownCustomProcess.copyDetailData': 'Copy detail data',
  'PC.Components.MarkdownCustomProcess.copyFailedRetry':
    'Failed to copy detail data, please retry',

  // Components - SharedIcon
  'PC.Components.SharedIcon.published': 'Published',
  'PC.Components.SharedIcon.reviewing': 'Under Review',
  'PC.Components.SharedIcon.offline': 'Offline',
  'PC.Components.SharedIcon.draft': 'Draft',
  'PC.Components.SharedIcon.rejected': 'Rejected',

  // Components - ActivatedIcon
  'PC.Components.ActivatedIcon.activated': 'Activated',

  // Components - ChatView
  'PC.Components.ChatView.copy': 'Copy',

  // Components - CustomFormModal
  'PC.Components.CustomFormModal.cancel': 'Cancel',

  // Components - MarkdownRenderer
  'PC.Components.MarkdownRenderer.thinking': 'Thinking',
  'PC.Components.MarkdownRenderer.thought': 'Thought',

  // Components - PageCard
  'PC.Components.PageCard.activated': 'Activated',
  'PC.Components.PageCard.newVersion': 'New version available',
  'PC.Components.PageCard.noPreview': 'No preview available',
  'PC.Components.PageCard.startUsing': 'Start Using',
  'PC.Components.PageCard.createdAt': 'Created at',

  // Components - PluginConfigTitle
  'PC.Components.PluginConfigTitle.addParam': 'Add Parameter',

  // Components - genCustomPlugin
  'PC.Components.genCustomPlugin.table': 'Table',

  // Components - Skill database
  'PC.Components.Skill.database.collapse': 'Collapse',

  // Components - SqlOptimizeModal
  'PC.Components.SqlOptimizeModal.replace': 'Replace',
  'PC.Components.SqlOptimizeModal.exit': 'Exit',
  'PC.Components.SqlOptimizeModal.placeholder':
    'Please describe your SQL query requirements in detail',

  // Components - SubmitButton
  'PC.Components.SubmitButton.confirm': 'Confirm',

  // Components - MentionList
  'PC.Components.MentionList.noMatch': 'No matches found',

  // Components - TiptapVariableInput - useVariableTree
  'PC.Components.useVariableTree.tools': 'Tools',
  'PC.Components.useVariableTree.skills': 'Skills',

  // Components - CurrentPublishItem
  'PC.Components.CurrentPublishItem.publishedAt': 'Published at',
  'PC.Components.CurrentPublishItem.offShelf': 'Off Shelf',
  'PC.Components.CurrentPublishItem.reviewing': 'Under Review',
  'PC.Components.CurrentPublishItem.hasBeenOffShelf': 'Off Shelf',

  // Components - VersionHistory
  'PC.Components.VersionHistory.agent': 'Agent',
  'PC.Components.VersionHistory.plugin': 'Plugin',
  'PC.Components.VersionHistory.workflow': 'Workflow',
  'PC.Components.VersionHistory.offShelfSuccess':
    'Successfully taken off shelf',
  'PC.Components.VersionHistory.confirmOffShelf':
    'Are you sure you want to take this {0} off shelf?',
  'PC.Components.VersionHistory.currentPublish': 'Current Publish',
  'PC.Components.VersionHistory.arrangeAndPublishRecord':
    'Arrangement & Publish Records',
  'PC.Components.VersionHistory.noVersionHistory': 'No version history',
  'PC.Components.VersionHistory.versionHistoryTip':
    'Version history is automatically saved when you modify the project',
  'PC.Components.VersionHistory.versionHistory': 'Version History',

  // Components - SelectList
  'PC.Components.SelectList.pleaseSelect': 'Please select',

  // Components - PublishComponentModal
  'PC.Components.PublishComponentModal.selectPublishScope':
    'Select publish scope',

  // Layouts - HistoryConversation
  'PC.Layouts.HistoryConversation.title': 'History Conversations',

  // Layouts - InfiniteList
  'PC.Layouts.InfiniteList.allDataLoaded': 'All data loaded',

  // Pages - AppDev DesignViewer
  'PC.Pages.AppDevDesignViewer.selectElementToEdit':
    'Select a page element on the right to edit',
  'PC.Pages.AppDevDesignViewer.textContent': 'Text Content',
  'PC.Pages.AppDevDesignViewer.font': 'Font',
  'PC.Pages.AppDevDesignViewer.fontWeight': 'Weight',
  'PC.Pages.AppDevDesignViewer.fontSize': 'Font Size',
  'PC.Pages.AppDevDesignViewer.lineHeight': 'Line Height',
  'PC.Pages.AppDevDesignViewer.letterSpacing': 'Letter Spacing',
  'PC.Pages.AppDevDesignViewer.alignment': 'Alignment',
  'PC.Pages.AppDevDesignViewer.textColor': 'Text Color',
  'PC.Pages.AppDevDesignViewer.background': 'Background',
  'PC.Pages.AppDevDesignViewer.layout': 'Layout',
  'PC.Pages.AppDevDesignViewer.margin': 'Margin',
  'PC.Pages.AppDevDesignViewer.padding': 'Padding',
  'PC.Pages.AppDevDesignViewer.border': 'Border',
  'PC.Pages.AppDevDesignViewer.borderColor': 'Border Color',
  'PC.Pages.AppDevDesignViewer.borderStyle': 'Border Style',
  'PC.Pages.AppDevDesignViewer.borderWidth': 'Border Width',
  'PC.Pages.AppDevDesignViewer.appearance': 'Appearance',
  'PC.Pages.AppDevDesignViewer.opacity': 'Opacity',
  'PC.Pages.AppDevDesignViewer.borderRadius': 'Border Radius',
  'PC.Pages.AppDevDesignViewer.shadow': 'Shadow',

  // Pages - SpacePluginCloudTool
  'PC.Pages.SpacePluginCloudTool.inputConfig': 'Input Config',
  'PC.Pages.SpacePluginCloudTool.outputConfig': 'Output Config',
  'PC.Pages.SpacePluginCloudTool.autoAnalysis': 'Auto Analysis',
  'PC.Pages.SpacePluginCloudTool.paramName': 'Parameter Name',
  'PC.Pages.SpacePluginCloudTool.paramDesc': 'Parameter Description',
  'PC.Pages.SpacePluginCloudTool.paramType': 'Parameter Type',
  'PC.Pages.SpacePluginCloudTool.paramNamePlaceholder':
    'Enter parameter name, ensure clarity',
  'PC.Pages.SpacePluginCloudTool.paramDescPlaceholder':
    'Enter parameter description, ensure detail for better AI understanding',
  'PC.Pages.SpacePluginCloudTool.selectDataType': 'Select data type',
  'PC.Pages.SpacePluginCloudTool.isRequired': 'Required',
  'PC.Pages.SpacePluginCloudTool.defaultValue': 'Default Value',
  'PC.Pages.SpacePluginCloudTool.inputDefaultValue': 'Enter default value',
  'PC.Pages.SpacePluginCloudTool.enable': 'Enable',
  'PC.Pages.SpacePluginCloudTool.requiredParamTip':
    'This is a required parameter, the switch is available after filling in the default value',
  'PC.Pages.SpacePluginCloudTool.operation': 'Operation',

  // Layouts - MobileMenu
  'PC.Layouts.MobileMenu.menuMask': 'Menu Mask',

  // Layouts - Message
  'PC.Layouts.Message.noMessages': 'No messages',

  // Utils - PptxFallbackRenderer
  'PC.Utils.PptxFallbackRenderer.parseFailed': 'PPTX file parse failed',
  'PC.Utils.PptxFallbackRenderer.previewAlt': 'Presentation Preview',
  'PC.Utils.PptxFallbackRenderer.coverPreview': 'Presentation Cover Preview',
  'PC.Utils.PptxFallbackRenderer.slideCount': '{0} slides in total',
  'PC.Utils.PptxFallbackRenderer.complexFormatNotice':
    'This PPTX file has a complex format and full preview is not supported.<br>It is recommended to download and view in PowerPoint.',

  // Utils - Clipboard
  'PC.Utils.Clipboard.copyFailed': 'Copy failed, please copy manually',
  'PC.Utils.Clipboard.copySuccess': 'Copied successfully',
  'PC.Utils.Clipboard.noContent': 'No content to copy',

  // Utils - FetchEventSource
  'PC.Utils.FetchEventSource.sseConnectionFailed': 'SSE connection failed',

  // Utils - HtmlToPdf
  'PC.Utils.HtmlToPdf.cannotCreatePrintEnv': 'Cannot create print environment',
  'PC.Utils.HtmlToPdf.cannotAccessIframeDoc': 'Cannot access iframe document',

  // Utils - FileTree
  'PC.Utils.FileTree.emptyFileCannotExportPdf':
    'File content is empty, cannot export PDF',
  'PC.Utils.FileTree.pdfExportSuccess': 'PDF exported successfully',
  'PC.Utils.FileTree.downloadFailed': 'Download failed',
  'PC.Utils.FileTree.downloadFailedRetry': 'Download failed, please retry',

  // Utils - AntCustom
  'PC.Utils.AntCustom.okText': 'OK',
  'PC.Utils.AntCustom.cancelText': 'Cancel',

  // Utils - Mcp
  'PC.Utils.Mcp.pendingDeploy': 'Pending Deploy',
  'PC.Utils.Mcp.deploying': 'Deploying',
  'PC.Utils.Mcp.deployed': 'Deployed',
  'PC.Utils.Mcp.deployFailed': 'Deploy Failed',
  'PC.Utils.Mcp.stopped': 'Stopped',

  // Utils - ChatUtils
  'PC.Utils.ChatUtils.errorOccurred': 'Error occurred',
  'PC.Utils.ChatUtils.cancelled': 'Cancelled',
  'PC.Utils.ChatUtils.newConversation': 'New Conversation',

  // Utils - Common
  'PC.Utils.Common.yearsAgo': '{0} years ago',
  'PC.Utils.Common.lastYear': 'Last year',
  'PC.Utils.Common.monthsAgo': '{0} months ago',
  'PC.Utils.Common.daysAgo': '{0} days ago',
  'PC.Utils.Common.dayBeforeYesterday': 'Day before yesterday',
  'PC.Utils.Common.yesterday': 'Yesterday',
  'PC.Utils.Common.hoursAgo': '{0} hours ago',
  'PC.Utils.Common.minutesAgo': '{0} minutes ago',
  'PC.Utils.Common.justNow': 'Just now',
  'PC.Utils.Common.emptyInput': 'Input is empty or not a string',
  'PC.Utils.Common.invalidJsonFormat': 'Invalid JSON format',

  // Utils - MermaidExporter
  'PC.Utils.MermaidExporter.svgExportSuccess': 'SVG exported successfully',
  'PC.Utils.MermaidExporter.svgExportFailed': 'SVG export failed',
  'PC.Utils.MermaidExporter.pngExportSuccess': 'PNG exported successfully',
  'PC.Utils.MermaidExporter.pngExportFailed': 'PNG export failed',

  // Components - PermissionMask
  'PC.Components.PermissionMask.noAgentPermission': 'No agent usage permission',

  // Components - EcosystemDetailDrawer
  'PC.Components.EcosystemDetailDrawer.plugin': 'Plugin',

  // Components - EcosystemShareModal
  'PC.Components.EcosystemShareModal.plugin': 'Plugin',

  // Components - ModelBox
  'PC.Components.ModelBox.search': 'Search',

  // Components - SkillCopy
  'PC.Components.SkillCopy.editParams': 'Edit Parameters',

  // Components - TiptapVariableInput
  'PC.Components.TiptapVariableInput.tools': 'Tools',
  'PC.Components.TiptapVariableInput.skills': 'Skills',

  // Constants - Theme
  'PC.Constants.Theme.colorBlue': 'Blue',
  'PC.Constants.Theme.colorRed': 'Red',
  'PC.Constants.Theme.colorOrange': 'Orange',
  'PC.Constants.Theme.colorGreen': 'Green',
  'PC.Constants.Theme.colorPurple': 'Purple',
  'PC.Constants.Theme.colorPink': 'Pink',
  'PC.Constants.Theme.bgStarryNight': 'Starry Night',
  'PC.Constants.Theme.bgStarryNightDesc':
    'Dark background, suitable for dark layout',
  'PC.Constants.Theme.bgCloudyDay': 'Cloudy Day',
  'PC.Constants.Theme.bgCloudyDayDesc':
    'Light background, suitable for light layout',
  'PC.Constants.Theme.bgForestDawn': 'Forest Dawn',
  'PC.Constants.Theme.bgForestDawnDesc':
    'Bright background, suitable for light layout',
  'PC.Constants.Theme.bgDeepSeaNight': 'Deep Sea Night',
  'PC.Constants.Theme.bgDeepSeaNightDesc':
    'Dark background, suitable for dark layout',
  'PC.Constants.Theme.bgDreamyPurple': 'Dreamy Purple',
  'PC.Constants.Theme.bgDreamyPurpleDesc':
    'Dark tone background, suitable for dark layout',
  'PC.Constants.Theme.bgWarmSunshine': 'Warm Sunshine',
  'PC.Constants.Theme.bgWarmSunshineDesc':
    'Warm tones, suitable for light layout',
  'PC.Constants.Theme.bgNightCity': 'Night City',
  'PC.Constants.Theme.bgNightCityDesc':
    'City night view, suitable for dark layout',
  'PC.Constants.Theme.bgFreshBlueSky': 'Fresh Blue Sky',
  'PC.Constants.Theme.bgFreshBlueSkyDesc':
    'Fresh and bright, suitable for light layout',

  // ========== New keys from Agent 1 & 2 ==========

  // Common - additional
  'PC.Common.Global.agent': 'Agent',
  'PC.Common.Global.all': 'All',
  'PC.Common.Global.custom': 'Custom',
  'PC.Common.Global.dataTable': 'Data Table',
  'PC.Common.Global.disable': 'Disable',
  'PC.Common.Global.enable': 'Enable',
  'PC.Common.Global.knowledge': 'Knowledge',
  'PC.Common.Global.log': 'Log',
  'PC.Common.Global.model': 'Model',
  'PC.Common.Global.no': 'No',
  'PC.Common.Global.other': 'Other',
  'PC.Common.Global.plugin': 'Plugin',
  'PC.Common.Global.published': 'Published',
  'PC.Common.Global.syncFailed': 'Sync Failed',
  'PC.Common.Global.skill': 'Skill',
  'PC.Common.Global.template': 'Template',
  'PC.Common.Global.unpublished': 'Unpublished',
  'PC.Common.Global.workflow': 'Workflow',
  'PC.Common.Global.yes': 'Yes',

  // Constants - Mcp
  'PC.Constants.Mcp.typeAgent': 'Agent',
  'PC.Constants.Mcp.typePlugin': 'Plugin',
  'PC.Constants.Mcp.typeWorkflow': 'Workflow',
  'PC.Constants.Mcp.typeKnowledge': 'Knowledge',
  'PC.Constants.Mcp.typeDataTable': 'Data Table',
  'PC.Constants.Mcp.menuOverview': 'Overview',
  'PC.Constants.Mcp.menuTool': 'Tool',
  'PC.Constants.Mcp.menuResource': 'Resource',
  'PC.Constants.Mcp.menuPrompt': 'Prompt',
  'PC.Constants.Mcp.segCustom': 'Custom Service',
  'PC.Constants.Mcp.segOfficial': 'Official Service',
  'PC.Constants.Mcp.serviceExport': 'Service Export',
  'PC.Constants.Mcp.stopService': 'Stop Service',

  // Constants - Node
  'PC.Constants.Node.directAnswer': 'Direct Answer',
  'PC.Constants.Node.else': 'Else',
  'PC.Constants.Node.elseIf': 'Else If',
  'PC.Constants.Node.getVariable': 'Get Variable',
  'PC.Constants.Node.if': 'If',
  'PC.Constants.Node.interruptFlow': 'Interrupt Flow',
  'PC.Constants.Node.noRetry': 'No Retry',
  'PC.Constants.Node.optionAnswer': 'Option Answer',
  'PC.Constants.Node.retryOnce': 'Retry Once',
  'PC.Constants.Node.retryThreeTimes': 'Retry 3 Times',
  'PC.Constants.Node.retryTwice': 'Retry Twice',
  'PC.Constants.Node.returnSpecificContent': 'Return Specific Content',
  'PC.Constants.Node.setVariable': 'Set Variable',
  'PC.Constants.Node.testName': 'Test',
  'PC.Constants.Node.testDescription': 'Test',
  'PC.Constants.Node.execExceptionFlow': 'Exception Flow',

  // Constants - Home
  'PC.Constants.Home.exampleQ1':
    'Overview of Nuwa Agent Design Platform features',
  'PC.Constants.Home.exampleQ2': 'Recommended NLP textbook recommendations',
  'PC.Constants.Home.exampleQ3': 'Nuwa Agent Design Platform user manual',
  'PC.Constants.Home.exampleQ4':
    'What should I start preparing in my sophomore year for grad school?',
  'PC.Constants.Home.exampleQ5':
    'What should I start preparing in my sophomore year for grad school?',

  // Constants - ImChannel
  'PC.Constants.ImChannel.platformFeishu': 'Feishu',
  'PC.Constants.ImChannel.platformDingtalk': 'DingTalk',
  'PC.Constants.ImChannel.platformWework': 'WeCom',
  'PC.Constants.ImChannel.platformWechat': 'WeChat',

  // Constants - Common
  'PC.Constants.Common.subAgentTemplateName': 'Your sub-agent name',
  'PC.Constants.Common.subAgentTemplateDesc':
    'Description of when the sub-agent should be invoked',
  'PC.Constants.Common.subAgentTemplateBody':
    'Your sub-agent system prompt is displayed here. This prompt can contain multiple paragraphs,\nYou need to clearly define the role, capabilities, and approach to problem-solving for the sub-agent.\n\nIncludes specific instructions, best practices, and any limitations that the sub-agent should follow.',

  // Routes
  'PC.Routes.morePage': 'More Pages',
  'PC.Routes.systemManagement': 'System Management',
  'PC.Routes.systemOverview': 'System Overview',
  'PC.Routes.taskManagement': 'Task Management',
  'PC.Routes.userManagement': 'User Management',
  'PC.Routes.publishAudit': 'Publish Audit',
  'PC.Routes.publishedManagement': 'Published Management',
  'PC.Routes.publicModelManagement': 'Public Model Management',
  'PC.Routes.systemConfig': 'System Configuration',
  'PC.Routes.systemSetting': 'System Settings',
  'PC.Routes.themeConfig': 'Theme Configuration',
  'PC.Routes.sandboxConfig': 'Sandbox Configuration',
  'PC.Routes.categoryManagement': 'Category Management',
  'PC.Routes.i18nLangManagement': 'Language Management',
  'PC.Routes.i18nLangContent': 'Language Content',
  'PC.Routes.contentManagement': 'Content Management',
  'PC.Routes.contentSpace': 'Space',
  'PC.Routes.contentAgent': 'Agent',
  'PC.Routes.contentWebApplication': 'Web Application',
  'PC.Routes.contentKnowledgeBase': 'Knowledge Base',
  'PC.Routes.contentDataTable': 'Data Table',
  'PC.Routes.contentWorkflow': 'Workflow',
  'PC.Routes.contentPlugin': 'Plugin',
  'PC.Routes.contentSkill': 'Skill',
  'PC.Routes.menuPermission': 'Menu Permission',
  'PC.Routes.permissionResources': 'Permission Resources',
  'PC.Routes.menuManage': 'Menu Management',
  'PC.Routes.roleManage': 'Role Management',
  'PC.Routes.userGroupManage': 'User Group Management',
  'PC.Routes.logQuery': 'Log Query',
  'PC.Routes.runningLog': 'Running Log',
  'PC.Routes.ecosystemMarket': 'Ecosystem Market',
  'PC.Routes.ecosystemPlugin': 'Plugin',
  'PC.Routes.ecosystemTemplate': 'Template',

  // Utils - ExportImport
  'PC.Utils.ExportImport.exportFailed': 'Export failed',
  'PC.Utils.ExportImport.cannotParseResponse': 'Cannot parse server response',
  'PC.Utils.ExportImport.networkRequestFailed': 'Network request failed',

  // Utils - Graph
  'PC.Utils.Graph.cannotConnectExternalNode': 'Cannot connect external node',
  'PC.Utils.Graph.cannotConnectOutsideNode': 'Cannot connect outside node',
  'PC.Utils.Graph.duplicateEdgeNotAllowed': 'Cannot create duplicate edge',
  'PC.Utils.Graph.loopExitAlreadyExists':
    'Loop exit already exists for child node, please delete the edge first',
  'PC.Utils.Graph.loopExitNodeInvalid':
    'Condition branch, intent recognition, Q&A cannot be used as loop exit connection node',
  'PC.Utils.Graph.loopInnerEdgeAlreadyExists':
    'Loop already has inner edge, please delete it first',
  'PC.Utils.Graph.portConnectionWarning':
    'Left port can only be used as input, right port can only be used as output',

  // Utils - InputValidation
  'PC.Utils.InputValidation.enterNumber': 'Please enter a number',

  // Pages - AntvX6
  'PC.Pages.AntvX6.loopContinueDesc':
    'Terminate current loop and continue to next iteration',
  'PC.Pages.AntvX6.loopBreakDesc':
    'Immediately terminate current loop and break out of loop body',

  // Pages - AppDev DesignViewer
  'PC.Pages.AppDev.DesignViewer.textContent': 'Text Content',
  'PC.Pages.AppDev.DesignViewer.fontFamily': 'Font',
  'PC.Pages.AppDev.DesignViewer.fontWeight': 'Font Weight',
  'PC.Pages.AppDev.DesignViewer.fontSize': 'Font Size',
  'PC.Pages.AppDev.DesignViewer.lineHeight': 'Line Height',
  'PC.Pages.AppDev.DesignViewer.letterSpacing': 'Letter Spacing',
  'PC.Pages.AppDev.DesignViewer.textAlign': 'Text Align',
  'PC.Pages.AppDev.DesignViewer.textColor': 'Text Color',
  'PC.Pages.AppDev.DesignViewer.background': 'Background',
  'PC.Pages.AppDev.DesignViewer.layout': 'Layout',
  'PC.Pages.AppDev.DesignViewer.margin': 'Margin',
  'PC.Pages.AppDev.DesignViewer.padding': 'Padding',
  'PC.Pages.AppDev.DesignViewer.border': 'Border',
  'PC.Pages.AppDev.DesignViewer.borderColor': 'Border Color',
  'PC.Pages.AppDev.DesignViewer.borderStyle': 'Border Style',
  'PC.Pages.AppDev.DesignViewer.borderWidth': 'Border Width',
  'PC.Pages.AppDev.DesignViewer.appearance': 'Appearance',
  'PC.Pages.AppDev.DesignViewer.opacity': 'Opacity',
  'PC.Pages.AppDev.DesignViewer.borderRadius': 'Border Radius',
  'PC.Pages.AppDev.DesignViewer.shadow': 'Shadow',
  'PC.Pages.AppDev.DesignViewer.selectElementTip':
    'Select a page element on the right to edit',

  // Pages - ChatTemp
  'PC.Pages.ChatTemp.enterInstruction':
    'Enter instructions directly; press Enter for new line',

  // Pages - OpenApp
  'PC.Pages.OpenApp.collapseNav': 'Collapse Navigation',
  'PC.Pages.OpenApp.newConversation': 'New Conversation',
  'PC.Pages.OpenApp.historyConversation': 'History',
  'PC.Pages.OpenApp.viewAll': 'View All',
  'PC.Pages.OpenApp.lookRight': 'See Right >',
  'PC.Pages.OpenApp.firstConversationTip':
    'Enter instructions in the chat to start your first conversation~',

  // Pages - EditAgent
  'PC.Pages.EditAgent.bindCardDataSource': 'Bind data source for card',
  'PC.Pages.EditAgent.selectCardStyle': 'Select card style',
  'PC.Pages.EditAgent.isModelVisible': 'Visible to model',
  'PC.Pages.EditAgent.isDefaultHome': 'Set as default home',
  'PC.Pages.EditAgent.save': 'Save',
  'PC.Pages.EditAgent.pluginWorkflowDataStructure':
    'Plugin or workflow return data structure and example',

  // Pages - SpacePluginCloudTool
  'PC.Pages.SpacePluginCloudTool.enterDefaultValue': 'Enter default value',
  'PC.Pages.SpacePluginCloudTool.requiredParamTooltip':
    'This is a required parameter. Available after setting a default value',
  'PC.Pages.SpacePluginCloudTool.autoAnalyze': 'Auto Analyze',
  'PC.Pages.SpacePluginCloudTool.unpublishedUpdate': 'Unpublished updates',
  'PC.Pages.SpacePluginCloudTool.code': 'Code',
  'PC.Pages.SpacePluginCloudTool.published': 'Published',
  'PC.Pages.SpacePluginCloudTool.unpublished': 'Unpublished',
  'PC.Pages.SpacePluginCloudTool.savedAt': 'Config saved at',
  'PC.Pages.SpacePluginCloudTool.tryRun': 'Try Run',
  'PC.Pages.SpacePluginCloudTool.publish': 'Publish',

  // Components - MarkdownRenderer
  'PC.Components.MarkdownRenderer.tableCodeBlock': 'Table',

  // Pages - Space componentLibrary
  // Missing keys from Agent 1
  'PC.Constants.Common.input': 'Input',
  'PC.Constants.Common.mcpService': 'MCP Service',
  'PC.Constants.Common.page': 'Page',
  'PC.Constants.Common.reference': 'Reference',
  'PC.Constants.Common.variable': 'Variable',
  'PC.Constants.Mcp.deployed': 'Deployed',
  'PC.Pages.EditAgent.codeExampleOptionsComment': '//options Option list;',
  'PC.Pages.EditAgent.codeExampleValueComment':
    '//value: Option value; label: Option name; children: Sub-options',
  'PC.Pages.SpacePluginCloudTool.save': 'Save',
  // Pages - Space componentLibrary
  'PC.Constants.Space.componentLibrary': 'Component Library',

  'PC.Components.ActionMenu.more': 'More',
  'PC.Components.AgentType.agent': 'Agent',
  'PC.Components.AgentType.knowledge': 'Knowledge Base',
  'PC.Components.AgentType.model': 'Model',
  'PC.Components.AgentType.pageApp': 'Web App',
  'PC.Components.AgentType.plugin': 'Plugin',
  'PC.Components.AgentType.skill': 'Skill',
  'PC.Components.AgentType.table': 'Data Table',
  'PC.Components.AgentType.workflow': 'Workflow',
  'PC.Components.ChatBottomDebug.debug': 'Debug',
  'PC.Components.ChatView.guest': 'Guest',
  'PC.Components.CopyIconButton.copy': 'Copy',
  'PC.Components.CreateAgent.createSuccess': 'Agent created successfully',
  'PC.Components.CreateAgent.createTitle': 'Create Agent',
  'PC.Components.CreateAgent.descriptionLabel': 'Agent Description',
  'PC.Components.CreateAgent.descriptionPlaceholder':
    "Describe the agent's features, which will be shown to the agent's users",
  'PC.Components.CreateAgent.editSuccess': 'Agent updated successfully',
  'PC.Components.CreateAgent.iconLabel': 'Icon',
  'PC.Components.CreateAgent.nameLabel': 'Agent Name',
  'PC.Components.CreateAgent.nameMaxLength':
    'Name cannot exceed 50 characters!',
  'PC.Components.CreateAgent.namePlaceholder': 'Give the agent a unique name',
  'PC.Components.CreateAgent.nameRequired': 'Please enter the agent name',
  'PC.Components.CreateAgent.typeChatBot': 'Chatbot',
  'PC.Components.CreateAgent.typeTaskAgent': 'Task Agent',
  'PC.Components.CreateAgent.updateTitle': 'Update Agent',
  'PC.Components.CreateAgent.createTypeTitle': 'Create {0}',
  'PC.Components.CreateAgent.updateTypeTitle': 'Update {0}',
  'PC.Components.CreateKnowledge.createSuccess':
    'Knowledge base created successfully',
  'PC.Components.CreateKnowledge.createTitle': 'Create Knowledge Base',
  'PC.Components.CreateKnowledge.customWorkflow': 'Custom Workflow',
  'PC.Components.CreateKnowledge.dataParsingMethodLabel':
    'Document Content Extraction Method',
  'PC.Components.CreateKnowledge.descriptionLabel': 'Description',
  'PC.Components.CreateKnowledge.embeddingModelLabel': 'Embedding Model',
  'PC.Components.CreateKnowledge.iconLabel': 'Icon',
  'PC.Components.CreateKnowledge.nameLabel': 'Name',
  'PC.Components.CreateKnowledge.nameRequired':
    'Please enter the knowledge base name',
  'PC.Components.CreateKnowledge.remove': 'Remove',
  'PC.Components.CreateKnowledge.selectWorkflow': 'Select Workflow',
  'PC.Components.CreateKnowledge.systemDefault': 'System Default',
  'PC.Components.CreateKnowledge.updateSuccess':
    'Knowledge Base updated successful',
  'PC.Components.CreateKnowledge.updateTitle': 'Update Knowledge Base',
  'PC.Components.CreateKnowledge.namePlaceholder':
    'Give the knowledge base a clear name',
  'PC.Components.CreateKnowledge.descriptionPlaceholder':
    'Describe the content of the knowledge base to help the model better understand its purpose',
  'PC.Components.CreateKnowledge.embeddingModelRequired':
    'Please select an embedding model',
  'PC.Components.CreateKnowledge.embeddingModelTooltip':
    'Embedding models are used to convert text to vectors, which is the basis for retrieval',
  'PC.Components.CreateKnowledge.embeddingModelPlaceholder':
    'Please select an embedding model',
  'PC.Components.CreateKnowledge.dataParsingMethodTooltip':
    'Choose how to extract content from documents, supporting system default or custom workflows',
  'PC.Components.CreateKnowledge.dataParsingMethodPlaceholder':
    'Please select a data parsing method',
  'PC.Components.EcoShareStatus.draft': 'Draft',
  'PC.Components.EcoShareStatus.offline': 'Offline',
  'PC.Components.EcoShareStatus.published': 'Published',
  'PC.Components.EcoShareStatus.rejected': 'Rejected',
  'PC.Components.EcoShareStatus.reviewing': 'Under Review',
  'PC.Components.McpInstallType.componentLibrary': 'Component Library',
  'PC.Components.McpStatus.deployFailed': 'Deploy Failed',
  'PC.Components.McpStatus.deployed': 'Deployed',
  'PC.Components.McpStatus.deploying': 'Deploying',
  'PC.Components.McpStatus.pendingDeploy': 'Pending Deploy',
  'PC.Components.McpStatus.stopped': 'Stopped',
  'PC.Components.MenuListItem.cancelCollect': 'Uncollect',
  'PC.Components.PublishComponentModal.agent': 'Agent',
  'PC.Components.PublishComponentModal.allowCopyTemplate':
    'Allow Copy (Template)',
  'PC.Components.PublishComponentModal.allowCopyTemplateTip':
    'Once selected, it will appear in the marketplace templates. Users can copy it directly to their workspace. Copy selection is available only after publishing is selected.',
  'PC.Components.PublishComponentModal.categorySelect': 'Category',
  'PC.Components.PublishComponentModal.onlyTemplate': 'Template Only',
  'PC.Components.PublishComponentModal.onlyTemplateTip':
    'When selected, it will only be displayed in the template marketplace. Template-only option is available only after allow copy is selected.',
  'PC.Components.PublishComponentModal.plugin': 'Plugin',
  'PC.Components.PublishComponentModal.publishRecord': 'Publish Record',
  'PC.Components.PublishComponentModal.publishRecordPlaceholder':
    'Please enter publish record',
  'PC.Components.PublishComponentModal.publishScope': 'Publish Scope',
  'PC.Components.PublishComponentModal.publishSubmitted':
    'Publish request submitted, pending review',
  'PC.Components.PublishComponentModal.publishTitle': 'Publish {0}',
  'PC.Components.PublishComponentModal.skill': 'Skill',
  'PC.Components.PublishComponentModal.space': 'Space',
  'PC.Components.PublishComponentModal.spaceSquareTip':
    '2. Space Square: The agent will appear in the selected space square.',
  'PC.Components.PublishComponentModal.systemSquare': 'System Square',
  'PC.Components.PublishComponentModal.systemSquareTip':
    '1. System Square: The agent will appear in the system square.',
  'PC.Components.PublishComponentModal.workflow': 'Workflow',
  'PC.Components.RunOver.calling': 'Calling',
  'PC.Components.RunOver.called': 'Called {0}',
  'PC.Components.RunOver.runComplete': 'Run Complete',
  'PC.Components.RunOver.runError': 'Run Error',
  'PC.Components.RunOver.thinking': 'Thinking',
  'PC.Components.TestRun.input': 'Input',
  'PC.Components.TestRun.uploadFailed': 'Upload Failed: {0}',
  'PC.Components.TestRun.noInputRequired':
    'No input required for this test run',
  'PC.Components.TestRun.output': 'Output',
  'PC.Components.TestRun.pleaseInput': 'Please input',
  'PC.Components.TestRun.pleaseSelect': 'Please select',
  'PC.Components.TestRun.qa': 'Q&A',
  'PC.Components.TestRun.replyToContinue':
    'Reply to the following questions to continue the test run',
  'PC.Components.TestRun.robot': 'Robot',
  'PC.Components.TestRun.run': 'Run',
  'PC.Components.TestRun.runResult': 'Run Result',
  'PC.Components.TestRun.testRun': 'Test Run',
  'PC.Components.TestRun.testRunInput': 'Test Run Input',
  'PC.Components.TestRun.uploadFile': 'Upload File',
  'PC.Constants.Agent.autoInvoke': 'Auto Invoke',
  'PC.Constants.Agent.balancedMode': 'Balanced Mode',
  'PC.Constants.Agent.creativeMode': 'Creative Mode',
  'PC.Constants.Agent.default': 'Default',
  'PC.Constants.Agent.defaultEngineTooltip':
    'The default engine is more mature with the best results, supporting only selected vendor models',
  'PC.Constants.Agent.defaultRecall': 'Default',
  'PC.Constants.Agent.extLinkRedirect': 'External Link Redirect',
  'PC.Constants.Agent.extPageOpen': 'Extension Page Open',
  'PC.Constants.Agent.extPagePath': 'Extension Page Path',
  'PC.Constants.Agent.externalLink': 'External Link',
  'PC.Constants.Agent.fullText': 'Full Text',
  'PC.Constants.Agent.fullTextTooltip':
    'Keyword-based full-text search, recommended for scenarios requiring specific names, acronyms, phrases, or IDs.',
  'PC.Constants.Agent.global': 'Global',
  'PC.Constants.Agent.insertToPrompt': 'Insert to Prompt',
  'PC.Constants.Agent.manualSelect': 'Manual Select',
  'PC.Constants.Agent.manualSelectOnDemand': 'Manual Select + On Demand',
  'PC.Constants.Agent.mixed': 'Mixed',
  'PC.Constants.Agent.mixedTooltip':
    'Combines the advantages of full-text and semantic retrieval with comprehensive ranking of results',
  'PC.Constants.Agent.multiSelect': 'Multi-Select',
  'PC.Constants.Agent.number': 'Number',
  'PC.Constants.Agent.nuwaxCliEngineTooltip':
    'The NuwaxCli engine is in rapid iteration. Some scenarios may need improvement, but it supports almost all vendor models',
  'PC.Constants.Agent.onDemand': 'On Demand',
  'PC.Constants.Agent.paragraph': 'Paragraph',
  'PC.Constants.Agent.precisionMode': 'Precision Mode',
  'PC.Constants.Agent.questionGuide': 'Question Guide',
  'PC.Constants.Agent.semantic': 'Semantic',
  'PC.Constants.Agent.semanticTooltip':
    'Vector-based text relevance query, recommended for scenarios requiring semantic association and cross-language queries.',
  'PC.Constants.Agent.singleCard': 'Single Card',
  'PC.Constants.Agent.singleLineText': 'Single Line Text',
  'PC.Constants.Agent.singleSelect': 'Single Select',
  'PC.Constants.Agent.smartRecognition': 'Smart Recognition',
  'PC.Constants.Agent.verticalList': 'Vertical List',
  'PC.Constants.Agent.workspace': 'Workspace',
  'PC.Constants.AppDev.defaultAiMessage':
    'Hello! I am an AI assistant that can help you with code development, Q&A, and more. How can I help you?',
  'PC.Constants.AppDev.errChatSendFailed': 'Failed to send message',
  'PC.Constants.AppDev.errDevServerStartFailed':
    'Failed to start development environment',
  'PC.Constants.AppDev.errEmptyFilePath': 'Please enter the file path',
  'PC.Constants.AppDev.errLoadFileFailed': 'Failed to load file',
  'PC.Constants.AppDev.errNoFileSelected': 'Please select a file',
  'PC.Constants.AppDev.errNoProjectId':
    'Please create or select a project first',
  'PC.Constants.AppDev.errSaveFileFailed': 'Failed to save file',
  'PC.Constants.AppDev.errUploadFailed': 'Upload failed',
  'PC.Constants.AppDev.loadingFileContent': 'Loading file content...',
  'PC.Constants.AppDev.loadingFileTree': 'Loading file tree...',
  'PC.Constants.AppDev.previewDisabledMessage':
    'Page preview is not available in version preview mode',
  'PC.Constants.AppDev.readOnlyMessage':
    'The old version is in read-only mode. Restore or switch to the latest version to edit.',
  'PC.Constants.AppDev.statusError': 'Failed to start development environment',
  'PC.Constants.AppDev.statusRunning': 'Development environment running',
  'PC.Constants.AppDev.statusStarting': 'Starting development environment...',
  'PC.Constants.AppDev.statusStopped': 'Development environment stopped',
  'PC.Constants.AppDev.successChatCancelled': 'AI task cancelled',
  'PC.Constants.AppDev.successDevServerStarted':
    'Development environment started successfully',
  'PC.Constants.AppDev.successFileSaved': 'File saved successfully',
  'PC.Constants.AppDev.successFileUploaded': 'File uploaded successfully',
  'PC.Constants.AppDev.successProjectUploaded':
    'Project uploaded and started successfully',
  'PC.Constants.AppDev.uploadingFile': 'Uploading file...',
  'PC.Constants.DataTable.itemsPerPage': 'items/page',
  'PC.Constants.DataTable.longText': 'Long Text (0-16M)',
  'PC.Constants.DataTable.reset': 'Reset',
  'PC.Constants.DataTable.search': 'Search',
  'PC.Constants.DataTable.shortText': 'Short Text (0-255)',
  'PC.Constants.DataTable.tableData': 'Table Data',
  'PC.Constants.DataTable.tableStructure': 'Table Structure',
  'PC.Constants.DataTable.totalPrefix': 'Total ',
  'PC.Constants.DataTable.totalSuffix': ' items',
  'PC.Constants.Ecosystem.catBusinessEfficiency': 'Business Efficiency',
  'PC.Constants.Ecosystem.catComputerOps': 'Computer Operations',
  'PC.Constants.Ecosystem.catEcommerce': 'E-Commerce',
  'PC.Constants.Ecosystem.catFinancialServices': 'Financial Services',
  'PC.Constants.Ecosystem.catLifeServices': 'Life Services',
  'PC.Constants.Ecosystem.catPersonalKnowledge': 'Personal Knowledge',
  'PC.Constants.Ecosystem.catSocialMedia': 'Social Media',
  'PC.Constants.Ecosystem.catTechDev': 'Tech Development',
  'PC.Constants.Ecosystem.enabled': 'Enabled',
  'PC.Constants.Ecosystem.myShares': 'My Shares',
  'PC.Constants.Ecosystem.offline': 'Offline',
  'PC.Constants.Ecosystem.underReview': 'Under Review',
  'PC.Constants.Ecosystem.webApp': 'Web App',
  'PC.Constants.Library.audioProcess': 'Audio Processing',
  'PC.Constants.Library.batchImport': 'Batch Import',
  'PC.Constants.Library.batchImportDesc': 'Upload local files in Excel format',
  'PC.Constants.Library.chatMultimodal': 'Chat - Multimodal',
  'PC.Constants.Library.chatText': 'Chat - Text Only',
  'PC.Constants.Library.code': 'Code',
  'PC.Constants.Library.createByCloudCode':
    'Create from Cloud Code (Node.js, Python)',
  'PC.Constants.Library.createByHttp':
    'Create from Existing Service (HTTP API)',
  'PC.Constants.Library.createSettings': 'Create Settings',
  'PC.Constants.Library.dataProcess': 'Data Processing',
  'PC.Constants.Library.execRecord': 'Execution Record',
  'PC.Constants.Library.imageProcess': 'Image Processing',
  'PC.Constants.Library.localDoc': 'Local Document',
  'PC.Constants.Library.localDocDesc':
    'Upload local files in PDF, TXT, MD, DOC, DOCX format',
  'PC.Constants.Library.manualAdd': 'Manual Add',
  'PC.Constants.Library.manualExec': 'Manual Execution',
  'PC.Constants.Library.metadata': 'Metadata',
  'PC.Constants.Library.none': 'None',
  'PC.Constants.Library.publicModel': 'Public Model',
  'PC.Constants.Library.random': 'Random',
  'PC.Constants.Library.responseTime': 'Response Time',
  'PC.Constants.Library.roundRobin': 'Round Robin',
  'PC.Constants.Library.segChineseExclamation': 'Chinese Exclamation (!)',
  'PC.Constants.Library.segChinesePeriod': 'Chinese Period (。)',
  'PC.Constants.Library.segChineseQuestion': 'Chinese Question Mark (？)',
  'PC.Constants.Library.segEnglishExclamation': 'English Exclamation (!)',
  'PC.Constants.Library.segEnglishPeriod': 'English Period (.)',
  'PC.Constants.Library.segEnglishQuestion': 'English Question Mark (?)',
  'PC.Constants.Library.segNewline': 'Newline (\\n)',
  'PC.Constants.Library.segTwoNewline': 'Double Newline (\\n\\n)',
  'PC.Constants.Library.segmentSettings': 'Segmentation Settings',
  'PC.Constants.Library.supportFuncCall': 'Supports Function Calling',
  'PC.Constants.Library.supportStreamFuncCall':
    'Supports Streaming Function Calling',
  'PC.Constants.Library.textCompletion': 'Text Completion',
  'PC.Constants.Library.textEdit': 'Text Editing',
  'PC.Constants.Library.textFill': 'Text Fill',
  'PC.Constants.Library.unsupportFuncCall': 'Does Not Support Function Calling',
  'PC.Constants.Library.upload': 'Upload',
  'PC.Constants.Library.vectorEmbedding': 'Vector Embedding',
  'PC.Constants.Library.weightedLeastConn': 'Weighted Least Connections',
  'PC.Constants.Library.weightedRoundRobin': 'Weighted Round Robin',
  'PC.Constants.Menus.account': 'Account',
  'PC.Constants.Menus.document': 'Documents',
  'PC.Constants.Menus.ecosystemMarket': 'Ecosystem Market',
  'PC.Constants.Menus.emailBind': 'Email Binding',
  'PC.Constants.Menus.home': 'Home',
  'PC.Constants.Menus.logout': 'Logout',
  'PC.Constants.Menus.myComputer': 'My Computer',
  'PC.Constants.Menus.newChat': 'New Chat',
  'PC.Constants.Menus.noUnread': 'No Unread Messages',
  'PC.Constants.Menus.profile': 'Profile',
  'PC.Constants.Menus.resetPassword': 'Reset Password',
  'PC.Constants.Menus.square': 'Square',
  'PC.Constants.Menus.systemManage': 'System Management',
  'PC.Constants.Menus.themeSwitch': 'Theme Switch',
  'PC.Constants.Menus.languageSwitch': 'Language Switch',
  'PC.Constants.Menus.unread': 'Unread',
  'PC.Constants.Menus.usageStatistics': 'Usage Statistics',
  'PC.Constants.Menus.userName': 'Username',
  'PC.Constants.Menus.workspace': 'Workspace',
  'PC.Constants.PageDev.authConfig': 'Auth Config',
  'PC.Constants.PageDev.devDebug': 'Dev Debug',
  'PC.Constants.PageDev.domainBinding': 'Domain Binding',
  'PC.Constants.PageDev.exportProject': 'Export Project',
  'PC.Constants.PageDev.localImport': 'Local Import',
  'PC.Constants.PageDev.onlineCreate': 'Online Create',
  'PC.Constants.PageDev.pageComponent': 'Page Component',
  'PC.Constants.PageDev.pagePreview': 'Page Preview',
  'PC.Constants.PageDev.pathParamsConfig': 'Path Params Config',
  'PC.Constants.PageDev.production': 'Production',
  'PC.Constants.PageDev.publishAsApp': 'Publish as App',
  'PC.Constants.PageDev.publishAsComponent': 'Publish as Component',
  'PC.Constants.PageDev.smartApp': 'Smart App',
  'PC.Constants.Space.agentDev': 'Agent Development',
  'PC.Constants.Space.aiCreate': 'AI Create',
  'PC.Constants.Space.allTypes': 'All Types',
  'PC.Constants.Space.analyze': 'Analyze',
  'PC.Constants.Space.asyncRun': 'Async Run',
  'PC.Constants.Space.callMethod': 'Call Method',
  'PC.Constants.Space.cardBind': 'Card Binding',
  'PC.Constants.Space.chatBotType': 'Chatbot',
  'PC.Constants.Space.chatBotTypeTooltip':
    'Suitable for knowledge Q&A, smart customer service, and quick Q&A scenarios.',
  'PC.Constants.Space.copyToSpace': 'Copy to Space',
  'PC.Constants.Space.createSkill': 'Create Skill',
  'PC.Constants.Space.createdByMe': 'Created by Me',
  'PC.Constants.Space.defaultHome': 'Default Home',
  'PC.Constants.Space.everyone': 'Everyone',
  'PC.Constants.Space.exceptionHandling': 'Exception Handling',
  'PC.Constants.Space.exportConfig': 'Export Config',
  'PC.Constants.Space.importSkill': 'Import Skill',
  'PC.Constants.Space.independentSession': 'Independent Session',
  'PC.Constants.Space.logQuery': 'Log Query',
  'PC.Constants.Space.mcpManage': 'MCP Management',
  'PC.Constants.Space.memberAndSettings': 'Members & Settings',
  'PC.Constants.Space.migrate': 'Migrate',
  'PC.Constants.Space.outputWay': 'Output Method',
  'PC.Constants.Space.params': 'Parameters',
  'PC.Constants.Space.skillManage': 'Skill Management',
  'PC.Constants.Space.spaceSquare': 'Space Square',
  'PC.Constants.Space.standardCreate': 'Standard Create',
  'PC.Constants.Space.taskAgentType': 'Task Agent',
  'PC.Constants.Space.taskAgentTypeTooltip':
    'Assigns a dedicated execution computer to the agent, suitable for complex tasks such as app development, in-depth research, data analysis, and presentations. Consumes more memory and outputs are slower.',
  'PC.Constants.Space.taskCenter': 'Task Center',
  'PC.Constants.Space.temporarySession': 'Temporary Session',
  'PC.Constants.Space.visibleToModel': 'Visible to Model',
  'PC.Constants.Space.webAppDev': 'Web App Development',
  'PC.Constants.System.baseConfig': 'Base Config',
  'PC.Constants.System.categoryManage': 'Category Management',
  'PC.Constants.System.contentManage': 'Content Management',
  'PC.Constants.System.contentSpace': 'Space',
  'PC.Constants.System.defaultModelSetting': 'Default Model Settings',
  'PC.Constants.System.globalModelManage': 'Global Model Management',
  'PC.Constants.System.menuManage': 'Menu Management',
  'PC.Constants.System.menuPermission': 'Menu Permissions',
  'PC.Constants.System.permissionResources': 'Permission Resources',
  'PC.Constants.System.publishAudit': 'Publish Audit',
  'PC.Constants.System.publishedManage': 'Published Management',
  'PC.Constants.System.roleManage': 'Role Management',
  'PC.Constants.System.runningLog': 'Running Log',
  'PC.Constants.System.sandboxConfig': 'Sandbox Config',
  'PC.Constants.System.sendToSpecifiedUser': 'Send to Specified User',
  'PC.Constants.System.siteAgentSetting': 'Site Agent Settings',
  'PC.Constants.System.systemConfig': 'System Config',
  'PC.Constants.System.systemMessageAllUsers': 'System Message (All Users)',
  'PC.Constants.System.systemOverview': 'System Overview',
  'PC.Constants.System.systemSetting': 'System Settings',
  'PC.Constants.System.taskManage': 'Task Management',
  'PC.Constants.System.themeConfig': 'Theme Config',
  'PC.Constants.System.userGroupManage': 'User Group Management',
  'PC.Constants.System.userManage': 'User Management',
  'PC.Pages.Chat.conversationNameNoSpaces':
    'Conversation name cannot contain only spaces',
  'PC.Pages.Chat.conversationNameRequired': 'Conversation name is required',
  'PC.Pages.Chat.inputConversationName': 'Enter conversation name',
  'PC.Pages.Chat.permanentDeleteWarning':
    'This conversation data will be permanently deleted and cannot be recovered. Are you sure?',
  'PC.Pages.Chat.permanentlyDeleteConversation':
    'Permanently Delete Conversation',
  'PC.Pages.Chat.rename': 'Rename',
  'PC.Pages.ChatTemp.fillRequiredParams':
    'Please fill in the required parameters',
  'PC.Pages.ChatTemp.inputPlaceholder': 'Please input',
  'PC.Pages.ChatTemp.networkTimeout':
    'Network timeout or service unavailable, please try again later',
  'PC.Pages.ChatTemp.startConversation': 'Start Conversation',
  'PC.Pages.Login.and': 'and',
  'PC.Pages.Login.captchaDefault': 'Drag right to complete the puzzle',
  'PC.Pages.Login.captchaError': 'Verification failed',
  'PC.Pages.Login.captchaLoading': 'Loading...',
  'PC.Pages.Login.captchaMoving': 'Drag right to the puzzle position',
  'PC.Pages.Login.captchaTitle':
    'Please complete the following verification to continue',
  'PC.Pages.Login.captchaVerifying': 'Verifying...',
  'PC.Pages.Login.privacyAgreement': 'Privacy Agreement',
  'PC.Pages.Login.readAndAgree': 'I have read and agree to the agreements:',
  'PC.Pages.Login.serviceAgreement': 'Terms of Service',
  'PC.Pages.PreviewAndDebug.convIdNotFoundDesktop':
    'Conversation ID not found, unable to open agent computer',
  'PC.Pages.PreviewAndDebug.convIdNotFoundFilePreview':
    'Conversation ID not found, unable to open file preview',
  'PC.Pages.PreviewAndDebug.fillRequiredParams':
    'Please fill in the required parameters',

  // Components - ModelSelector
  'PC.Components.ModelSelector.loadingModels': 'Loading models...',
  'PC.Components.ModelSelector.noAvailableModels': 'No available models',
  'PC.Components.ModelSelector.loading': 'Loading...',
  'PC.Components.ModelSelector.selectModel': 'Select Model',
  'PC.Components.ModelSelector.addModel': 'Model',

  // Pages - SystemManagement DataPermissionModal tabs
  'PC.Pages.SystemMenuDataPermissionModal.tabApiPermission': 'API Permission',
  'PC.Pages.SystemMenuDataPermissionModal.tabApiPermissionTooltip':
    'Open API authorization, configure API call rate limits. -1 means unlimited.',

  // Pages - DataPermissionModal AgentTabPanel
  'PC.Pages.DataPermissionTabPanel.searchAgent': 'Search Agents',
  'PC.Pages.DataPermissionTabPanel.noSelectedAgent': 'No agents selected',

  // Pages - DataPermissionModal KnowledgeTabPanel
  'PC.Pages.DataPermissionTabPanel.searchKnowledge': 'Search Knowledge Bases',
  'PC.Pages.DataPermissionTabPanel.noSelectedKnowledge':
    'No knowledge bases selected',

  // Pages - DataPermissionModal ModelTabPanel
  'PC.Pages.DataPermissionTabPanel.noSelectedModel': 'No models selected',

  // Pages - DataPermissionModal PageTabPanel
  'PC.Pages.DataPermissionTabPanel.searchPage': 'Search Web Apps',
  'PC.Pages.DataPermissionTabPanel.noSelectedPage': 'No web apps selected',

  // Pages - DataPermissionModal ApiPermissionTabPanel & UserOpenApiPermissionPanel
  'PC.Pages.DataPermissionTabPanel.noApiPermission':
    'No API permission configuration',
  'PC.Pages.DataPermissionTabPanel.rpmLabel': 'Calls per minute',
  'PC.Pages.DataPermissionTabPanel.rpdLabel': 'Calls per day',

  // Pages - DataPermissionModal DeveloperPermissionFormTab
  'PC.Pages.DeveloperPermissionForm.dailyTokenLimit': 'Daily Token Limit',
  'PC.Pages.DeveloperPermissionForm.dailyTokenLimitTooltip':
    'Daily token limit, -1 means unlimited',
  'PC.Pages.DeveloperPermissionForm.dailyTokenLimitPlaceholder':
    'Enter daily token limit',
  'PC.Pages.DeveloperPermissionForm.maxSpaceCount': 'Max Workspace Count',
  'PC.Pages.DeveloperPermissionForm.maxSpaceCountTooltip':
    'Max workspace count, -1 means unlimited',
  'PC.Pages.DeveloperPermissionForm.maxAgentCount': 'Max Agent Count',
  'PC.Pages.DeveloperPermissionForm.maxAgentCountTooltip':
    'Max agent count, -1 means unlimited',
  'PC.Pages.DeveloperPermissionForm.maxPageAppCount': 'Max Web App Count',
  'PC.Pages.DeveloperPermissionForm.maxPageAppCountTooltip':
    'Max web app count, -1 means unlimited',
  'PC.Pages.DeveloperPermissionForm.maxKnowledgeCount':
    'Max Knowledge Base Count',
  'PC.Pages.DeveloperPermissionForm.maxKnowledgeCountTooltip':
    'Max knowledge base count, -1 means unlimited',
  'PC.Pages.DeveloperPermissionForm.knowledgeStorageLimitGb':
    'Knowledge Storage Limit (GB)',
  'PC.Pages.DeveloperPermissionForm.knowledgeStorageLimitGbTooltip':
    '-1 means unlimited, 0 means no permission, precision 0.001GB, 1GB=1024MB',
  'PC.Pages.DeveloperPermissionForm.maxDataTableCount': 'Max Data Table Count',
  'PC.Pages.DeveloperPermissionForm.maxDataTableCountTooltip':
    'Max data table count, -1 means unlimited',
  'PC.Pages.DeveloperPermissionForm.maxScheduledTaskCount':
    'Max Scheduled Task Count',
  'PC.Pages.DeveloperPermissionForm.maxScheduledTaskCountTooltip':
    'Max scheduled task count, -1 means unlimited',
  'PC.Pages.DeveloperPermissionForm.agentComputerMemoryGb':
    'Agent Computer Memory (GB)',
  'PC.Pages.DeveloperPermissionForm.agentComputerMemoryGbTooltip':
    'Agent computer memory (GB, leave blank to use default 4GB)',
  'PC.Pages.DeveloperPermissionForm.agentComputerCpuCores':
    'Agent Computer CPU Cores',
  'PC.Pages.DeveloperPermissionForm.agentComputerCpuCoresTooltip':
    'Agent computer CPU cores (leave blank to use default)',
  'PC.Pages.DeveloperPermissionForm.agentDailyPromptLimit':
    'Agent Daily Conversation Limit',
  'PC.Pages.DeveloperPermissionForm.agentDailyPromptLimitTooltip':
    'Agent daily conversation limit, -1 means unlimited',
  'PC.Pages.DeveloperPermissionForm.pageDailyPromptLimit':
    'Web App Dev Daily Conversation Limit',
  'PC.Pages.DeveloperPermissionForm.pageDailyPromptLimitTooltip':
    'Web app dev daily conversation limit, -1 means unlimited',

  // Pages - SystemManagement KnowledgeBase
  'PC.Pages.SystemContentKnowledgeBase.accessControlTitle': 'Access Control',
  'PC.Pages.SystemContentKnowledgeBase.accessControlTooltip':
    'When enabled, authorization is required to use this knowledge base',
  'PC.Pages.SystemContentKnowledgeBase.accessControlOn': 'On',
  'PC.Pages.SystemContentKnowledgeBase.accessControlOff': 'Off',
  'PC.Pages.SystemContentKnowledgeBase.grantAuth': 'Grant Auth',
  'PC.Pages.AntvX6RunResult.onlyError': 'Only Errors',
  'PC.Pages.Chat.clearAndCreateFailed': 'Failed to clear and create',
  'PC.Pages.Chat.createConversationFailed': 'Failed to create conversation',
  'PC.Pages.Chat.pagePreview': 'Page Preview',

  'PC.Constants.Library.webApp': 'Web App',
  'PC.Constants.Library.generalAgent': 'General Agent',
  'PC.Constants.Library.qaAgent': 'Q&A Agent',
  'PC.Constants.Library.workflow': 'Workflow',
  'PC.Constants.Library.externalApi': 'External API',
  'PC.Components.ShareDesktopModal.allowDownload': 'Allow Download',
  'PC.Components.ShareDesktopModal.allowDownloadTooltip':
    'When enabled, users with the share link can download the original file on the preview page',
  'PC.Pages.SystemManagement.DataPermission.knowledgeBase': 'Knowledge Base',
  'PC.Pages.SystemManagement.DataPermission.knowledgeBaseTooltip':
    'You can grant authorization here after enabling access control in content management. If access control is enabled, authorization is required to use this knowledge base.',
  'PC.Common.Global.action': 'Action',
  'PC.Pages.SystemConfig.I18nManage.namePlaceholder': 'e.g., English, Japanese',
  'PC.Pages.SystemConfig.I18nManage.codeLabel': 'Language Code',
  'PC.Pages.SystemConfig.I18nManage.codeTooltip':
    'Code format: language code - country code',
  'PC.Pages.SystemConfig.I18nManage.codePlaceholder': 'e.g., en-US, ja-JP',
  'PC.Pages.SystemConfig.I18nManage.orderTooltip': 'Smaller value comes first',
  'PC.Pages.SystemConfig.I18nManage.orderPlaceholder': 'e.g., 1',
  'PC.Pages.SystemConfig.I18nManage.setDefaultLang': 'Set as Default Language',
  'PC.Pages.SystemConfig.I18nManage.defaultLangTip':
    'When editing a language, if the current language is the default language, you need to set another language as default in the language list to cancel the current default.',
  'PC.Pages.SystemConfig.I18nManage.statusLabel': 'Status',
  'PC.Pages.SystemConfig.I18nManage.deleteLangTitle': 'Delete Language',
  'PC.Pages.SystemConfig.I18nManage.deleteLangConfirm':
    'Are you sure you want to delete the language "{0}"? This cannot be undone.',
  'PC.Pages.SystemConfig.I18nManage.defaultLangDeleteTip':
    'Default language cannot be deleted',
  'PC.Pages.SystemConfig.LangContent.updateSuccess': 'Update Successfully',
  'PC.Pages.SystemConfig.LangContent.addSuccess': 'Add Successfully',
  'PC.Pages.SystemConfig.LangContent.editKeyValTitle': 'Edit Key-Value Pair',
  'PC.Pages.SystemConfig.LangContent.addKeyValTitle': 'Add Key-Value Pair',
  'PC.Pages.SystemConfig.LangContent.updateBtn': 'Update',
  'PC.Pages.SystemConfig.LangContent.addBtn': 'Add',
  'PC.Pages.SystemConfig.LangContent.keyRequired': 'Please enter a Key',
  'PC.Pages.SystemConfig.LangContent.keyPlaceholder': 'e.g., User.submit',
  'PC.Pages.SystemConfig.LangContent.keyMustContainDot':
    'Key must contain a dot (.)',
  'PC.Pages.SystemConfig.LangContent.textContentLabel': 'Text Content',
  'PC.Pages.SystemConfig.LangContent.textContentRequired':
    'Please enter text content',
  'PC.Pages.SystemConfig.LangContent.textContentPlaceholder': 'e.g., Submit',
  'PC.Pages.SystemConfig.LangContent.remarkLabel': 'Remark',
  'PC.Pages.SystemConfig.LangContent.remarkPlaceholder': 'e.g., Submit Button',
  'PC.Pages.SystemConfig.LangContent.jsonFormatError':
    'JSON format error, please check and try again',
  'PC.Pages.SystemConfig.LangContent.jsonObjectRequired':
    'Please enter key-value pair JSON in object format',
  'PC.Pages.SystemConfig.LangContent.atLeastOnePair':
    'Please enter at least one key-value pair',
  'PC.Pages.SystemConfig.LangContent.batchProcessSuccess':
    'Batch processing successfully',
  'PC.Pages.SystemConfig.LangContent.batchAddOrUpdateTitle':
    'Batch Add or Update',
  'PC.Pages.SystemConfig.LangContent.translateSuccess':
    'Translate Successfully',
  'PC.Pages.SystemConfig.LangContent.moduleColumn': 'Side',
  'PC.Pages.SystemConfig.LangContent.searchKey': 'Search Key...',
  'PC.Pages.SystemConfig.LangContent.translateAllBtn': 'Translate All',
  'PC.Pages.SystemConfig.LangContent.keyValMng': 'Key-Value Management',
  'PC.Pages.SpaceDevelop.copyIndependentSessionSuccess':
    'Independent session path copied',
  'PC.Pages.AntvX6.systemPrompt': 'System Prompt',
  'PC.Pages.AntvX6.userPrompt': 'User Prompt',
  'PC.Pages.SpaceLibrary.availableScope': 'Available Scope',
  'PC.Pages.SpaceLibrary.selectAvailableScope': 'Please select available scope',
  'PC.Pages.MorePage.ApiKey.neverExpires': 'Never Expires',
  'PC.Pages.EditAgent.VariableDataBinding.pluginOrWorkflowRequired':
    'Please select a plugin or workflow that meets the standard',
};
