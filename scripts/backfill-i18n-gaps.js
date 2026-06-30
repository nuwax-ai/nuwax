/* eslint-disable no-console */
/**
 * 补全 locale 文件之间缺失的翻译 key。
 * 以 zh-CN 为基准，对 zh-TW/zh-HK/ja-JP 缺失的 key 按各自语言习惯补译，
 * 并按 key 字母序插入到 locale 文件的正确位置。
 *
 * 用法:
 *   node scripts/backfill-i18n-gaps.js            预览（不写文件）
 *   node scripts/backfill-i18n-gaps.js --apply    实际写入
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join('src', 'locales', 'i18n');
const FILES = {
  'zh-CN': path.join(DIR, 'zh-CN.ts'),
  'zh-TW': path.join(DIR, 'zh-TW.ts'),
  'zh-HK': path.join(DIR, 'zh-HK.ts'),
  'en-US': path.join(DIR, 'en-US.ts'),
  'ja-JP': path.join(DIR, 'ja-JP.ts'),
};
const APPLY = process.argv.includes('--apply');

// 提取文件中所有 key（同时识别单/双引号 key，行首）
function extractKeys(content) {
  const set = new Set();
  const re = /^[ \t]*['"]([A-Za-z0-9_.]+)['"]\s*:/gm;
  let m;
  while ((m = re.exec(content)) !== null) set.add(m[1]);
  return set;
}

// 提取 key -> value（仅单行双引号值；多行/单引号值不计入，但 key 存在）
function extractValues(content) {
  const map = {};
  const re = /^[ \t]*"([A-Za-z0-9_.]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/gm;
  let m;
  while ((m = re.exec(content)) !== null) map[m[1]] = m[2];
  return map;
}

// ---- 三语翻译表（key -> { tw: 台湾繁体, hk: 港式繁体, jp: 日语 }）----
// 遵循各自语言的现有用词习惯（zh-TW：專案/套件/伺服器/資料/使用者；
// zh-HK：項目/插件/服務器/數據/用戶；ja-JP：标准日语）。
const T = {
  // ---- AcpPermissionCard ----
  'PC.Components.AcpPermissionCard.allowAlways': {
    tw: '始終允許',
    hk: '始終允許',
    jp: '常に許可',
  },
  'PC.Components.AcpPermissionCard.allowOnce': {
    tw: '允許一次',
    hk: '允許一次',
    jp: '一度だけ許可',
  },
  'PC.Components.AcpPermissionCard.cancelShortcutHint': {
    tw: '取消（Esc）',
    hk: '取消（Esc）',
    jp: 'キャンセル（Esc）',
  },
  'PC.Components.AcpPermissionCard.defaultTitle': {
    tw: '需要權限確認',
    hk: '需要權限確認',
    jp: '権限の確認が必要です',
  },
  'PC.Components.AcpPermissionCard.eyebrow': {
    tw: '審批請求',
    hk: '審批請求',
    jp: '承認リクエスト',
  },
  'PC.Components.AcpPermissionCard.rejectOnce': {
    tw: '拒絕',
    hk: '拒絕',
    jp: '拒否',
  },
  'PC.Components.AcpPermissionCard.shortcutHint': {
    tw: '{0}（{1}）',
    hk: '{0}（{1}）',
    jp: '{0} ({1})',
  },
  'PC.Components.AcpPermissionCard.submitted': {
    tw: '已提交審批結果',
    hk: '已提交審批結果',
    jp: '権限応答を送信しました',
  },
  // ---- HistoryConversationList ----
  'PC.Components.HistoryConversationList.emptySession': {
    tw: '你還沒有對話喲，快去開始你的第一個任務吧',
    hk: '你還沒有對話喲，快去開始你的第一個任務吧',
    jp: 'まだ会話がありません。最初のタスクを始めましょう！',
  },
  'PC.Components.HistoryConversationList.noMore': {
    tw: '沒有更多了',
    hk: '沒有更多了',
    jp: 'これ以上ありません',
  },
  'PC.Components.HistoryConversationList.noSearchResult': {
    tw: '無搜尋結果',
    hk: '無搜索結果',
    jp: '検索結果がありません',
  },
  // ---- McpAskQuestionCard ----
  'PC.Components.McpAskQuestionCard.cancelShortcutHint': {
    tw: '取消（Esc）',
    hk: '取消（Esc）',
    jp: 'キャンセル（Esc）',
  },
  'PC.Components.McpAskQuestionCard.cancelled': {
    tw: '已取消',
    hk: '已取消',
    jp: 'キャンセルされました',
  },
  'PC.Components.McpAskQuestionCard.customInputLabel': {
    tw: '自訂內容',
    hk: '自定義內容',
    jp: 'カスタム値',
  },
  'PC.Components.McpAskQuestionCard.customInputPlaceholder': {
    tw: '請輸入',
    hk: '請輸入',
    jp: '値を入力',
  },
  'PC.Components.McpAskQuestionCard.customOption': {
    tw: '自訂',
    hk: '自定義',
    jp: 'カスタム',
  },
  'PC.Components.McpAskQuestionCard.eyebrow': {
    tw: 'Agent 提問',
    hk: 'Agent 提問',
    jp: 'エージェントの質問',
  },
  'PC.Components.McpAskQuestionCard.fieldRequired': {
    tw: '請填寫此項',
    hk: '請填寫此項',
    jp: 'この項目は必須です',
  },
  'PC.Components.McpAskQuestionCard.multiSelectMin': {
    tw: '請至少選擇一項',
    hk: '請至少選擇一項',
    jp: '少なくとも1つ選択してください',
  },
  'PC.Components.McpAskQuestionCard.nextStep': {
    tw: '下一步',
    hk: '下一步',
    jp: '次へ',
  },
  'PC.Components.McpAskQuestionCard.prevStep': {
    tw: '上一步',
    hk: '上一步',
    jp: '前へ',
  },
  'PC.Components.McpAskQuestionCard.skip': {
    tw: '跳過',
    hk: '跳過',
    jp: 'スキップ',
  },
  'PC.Components.McpAskQuestionCard.skipped': {
    tw: '已跳過',
    hk: '已跳過',
    jp: 'スキップ済み',
  },
  'PC.Components.McpAskQuestionCard.stepOf': {
    tw: '步驟 {0} / {1}',
    hk: '步驟 {0} / {1}',
    jp: 'ステップ {0} / {1}',
  },
  'PC.Components.McpAskQuestionCard.submitted': {
    tw: '已提交回答',
    hk: '已提交回答',
    jp: '回答を送信しました',
  },
  'PC.Components.McpAskQuestionCard.uploadDragText': {
    tw: '點擊或拖曳檔案到此區域上傳',
    hk: '點擊或拖拽檔案到此區域上傳',
    jp: 'ここをクリックまたはファイルをドラッグしてアップロード',
  },
  // ---- Library ----
  'PC.Constants.Library.audioProcess': {
    tw: '語音處理',
    hk: '語音處理',
    jp: '音声処理',
  },
  'PC.Constants.Library.chatMultimodal': {
    tw: '聊天對話-多模態',
    hk: '聊天對話-多模態',
    jp: 'チャット - マルチモーダル',
  },
  'PC.Constants.Library.chatText': {
    tw: '聊天對話-純文字',
    hk: '聊天對話-純文本',
    jp: 'チャット - テキストのみ',
  },
  'PC.Constants.Library.imageProcess': {
    tw: '圖像處理',
    hk: '圖像處理',
    jp: '画像処理',
  },
  'PC.Constants.Library.supportFuncCall': {
    tw: '支援一般函式呼叫',
    hk: '支持普通函數調用',
    jp: '関数呼び出し対応',
  },
  'PC.Constants.Library.textCompletion': {
    tw: '文字補全',
    hk: '文本補全',
    jp: 'テキスト補完',
  },
  'PC.Constants.Library.textEdit': {
    tw: '文字編輯',
    hk: '文本編輯',
    jp: 'テキスト編集',
  },
  'PC.Constants.Library.vectorEmbedding': {
    tw: '向量嵌入',
    hk: '向量嵌入',
    jp: 'ベクトル埋め込み',
  },
  // ---- LeftGroupList ----
  'PC.Pages.SpaceResource.LeftGroupList.groupIconLabel': {
    tw: '分組圖示',
    hk: '分組圖標',
    jp: 'グループアイコン',
  },
  'PC.Pages.SpaceResource.LeftGroupList.groupNameNoWhitespace': {
    tw: '名稱不能為空白字元',
    hk: '名稱不能為空白字符',
    jp: '名前を空白にすることはできません',
  },
  'PC.Pages.SpaceResource.LeftGroupList.groupNameMaxLength': {
    tw: '名稱長度不能超過30個字元',
    hk: '名稱長度不能超過30個字符',
    jp: '名前は30文字以内で入力してください',
  },
  'PC.Pages.SpaceResource.LeftGroupList.groupDescLabel': {
    tw: '分組描述',
    hk: '分組描述',
    jp: 'グループの説明',
  },
  'PC.Pages.SpaceResource.LeftGroupList.groupDescMaxLength': {
    tw: '描述長度不能超過100個字元',
    hk: '描述長度不能超過100個字符',
    jp: '説明は100文字以内で入力してください',
  },
  'PC.Pages.SpaceResource.LeftGroupList.groupDescPlaceholder': {
    tw: '請輸入分組描述',
    hk: '請輸入分組描述',
    jp: 'グループの説明を入力してください',
  },
  'PC.Pages.SpaceResource.LeftGroupList.groupTypeLabel': {
    tw: '分組類型',
    hk: '分組類型',
    jp: 'グループタイプ',
  },
  'PC.Pages.SpaceResource.LeftGroupList.groupTypeRequired': {
    tw: '請選擇分組類型',
    hk: '請選擇分組類型',
    jp: 'グループタイプを選択してください',
  },
  'PC.Pages.SpaceResource.LeftGroupList.unitCount': {
    tw: '{0} 個',
    hk: '{0} 個',
    jp: '{0} 件',
  },
  'PC.Pages.SpaceResource.LeftGroupList.moveToGroup': {
    tw: '移入分組',
    hk: '移入分組',
    jp: 'グループへ移動',
  },
  'PC.Pages.SpaceResource.LeftGroupList.moveToOtherGroup': {
    tw: '移動至其它分組',
    hk: '移動至其它分組',
    jp: '別のグループへ移動',
  },
  'PC.Pages.SpaceResource.LeftGroupList.removeFromGroup': {
    tw: '移出分組',
    hk: '移出分組',
    jp: 'グループから削除',
  },
  'PC.Pages.SpaceResource.LeftGroupList.confirmMoveToGroup': {
    tw: '確認移入分組',
    hk: '確認移入分組',
    jp: 'グループへの移動を確認',
  },
  'PC.Pages.SpaceResource.LeftGroupList.confirmRemoveFromGroup': {
    tw: '確認移出分組',
    hk: '確認移出分組',
    jp: 'グループからの削除を確認',
  },
  'PC.Pages.SpaceResource.LeftGroupList.confirmRemoveDesc': {
    tw: '確認將「{0}」從目前分組移出嗎？',
    hk: '確認將「{0}」從當前分組移出嗎？',
    jp: '「{0}」を現在のグループから移動しますか？',
  },
  'PC.Pages.SpaceResource.LeftGroupList.moveSuccess': {
    tw: '移入成功',
    hk: '移入成功',
    jp: '移動しました',
  },
  'PC.Pages.SpaceResource.LeftGroupList.removeSuccess': {
    tw: '移出成功',
    hk: '移出成功',
    jp: '削除しました',
  },
  'PC.Pages.SpaceResource.LeftGroupList.selectGroup': {
    tw: '選擇分組',
    hk: '選擇分組',
    jp: 'グループを選択',
  },
  'PC.Pages.SpaceResource.LeftGroupList.selectGroupPlaceholder': {
    tw: '請選擇要移入的分組',
    hk: '請選擇要移入的分組',
    jp: '移動先のグループを選択してください',
  },
  // ---- DynamicMenusLayout ----
  'PC.Layouts.DynamicMenusLayout.newProject': {
    tw: '新建專案',
    hk: '新建項目',
    jp: '新規プロジェクト',
  },
  // ---- ConversationInfo ----
  'PC.Models.ConversationInfo.askResponseFailed': {
    tw: '問題回答提交失敗',
    hk: '問題回答提交失敗',
    jp: '回答の送信に失敗しました',
  },
  'PC.Models.ConversationInfo.permissionResponseFailed': {
    tw: '權限審批結果提交失敗',
    hk: '權限審批結果提交失敗',
    jp: '権限応答の送信に失敗しました',
  },
  // ---- Chat ----
  'PC.Pages.Chat.editConversationInfo': {
    tw: '編輯會話資訊',
    hk: '編輯會話信息',
    jp: '会話情報を編集',
  },
  'PC.Pages.Chat.conversationIcon': {
    tw: '會話圖示',
    hk: '會話圖標',
    jp: '会話アイコン',
  },
  'PC.Pages.Chat.conversationName': {
    tw: '會話名稱',
    hk: '會話名稱',
    jp: '会話名',
  },
  // ---- ConversationAgent ----
  'PC.Pages.ConversationAgent.devServerReady': {
    tw: '開發伺服器已就緒',
    hk: '開發服務器已就緒',
    jp: '開発サーバーの準備ができました',
  },
  'PC.Pages.ConversationAgent.ArrangePanel.tabConfig': {
    tw: '設定',
    hk: '配置',
    jp: '設定',
  },
  'PC.Pages.ConversationAgent.ArrangePanel.tabDebug': {
    tw: '除錯',
    hk: '調試',
    jp: 'デバッグ',
  },
  'PC.Pages.ConversationAgent.ArrangePanel.tabVersion': {
    tw: '版本',
    hk: '版本',
    jp: 'バージョン',
  },
  'PC.Pages.ConversationAgent.prototypeTitle': {
    tw: 'Agent 開發原型',
    hk: 'Agent 開發原型',
    jp: 'エージェント開発プロトタイプ',
  },
  // ---- ConversationAgentSourceControl ----
  'PC.Pages.ConversationAgentSourceControl.commitAndPush': {
    tw: '推送',
    hk: '推送',
    jp: 'プッシュ',
  },
  'PC.Pages.ConversationAgentSourceControl.gitPushTooltip': {
    tw: 'Git 提交並推送到遠端倉庫',
    hk: 'Git 提交並推送到遠程倉庫',
    jp: 'Git をコミットしてリモートリポジトリにプッシュ',
  },
  'PC.Pages.ConversationAgentSourceControl.save': {
    tw: '儲存',
    hk: '保存',
    jp: '保存',
  },
  'PC.Pages.ConversationAgentSourceControl.saveTooltip': {
    tw: '儲存變更到沙箱',
    hk: '保存更改到沙箱',
    jp: '変更をサンドボックスに保存',
  },
  // ---- MySubscriptions ----
  'PC.Pages.MorePage.MySubscriptions.continuousMonthly': {
    tw: '連續包月',
    hk: '連續包月',
    jp: '月額サブスク',
  },
  'PC.Pages.MorePage.MySubscriptions.continuousQuarterly': {
    tw: '連續包季',
    hk: '連續包季',
    jp: '四半期サブスク',
  },
  'PC.Pages.MorePage.MySubscriptions.continuousYearly': {
    tw: '連續包年',
    hk: '連續包年',
    jp: '年額サブスク',
  },
  'PC.Pages.MorePage.MySubscriptions.currentPlanButton': {
    tw: '目前方案',
    hk: '當前套餐',
    jp: '現在のプラン',
  },
  'PC.Pages.MorePage.MySubscriptions.upgradeTo': {
    tw: '升級為',
    hk: '升級為',
    jp: 'にアップグレード',
  },
  // ---- SpaceKnowledgeStorage / SpaceLibrary / SpacePluginWorkflow ----
  'PC.Pages.SpaceKnowledgeStorage.pageTitle': {
    tw: '知識與資料儲存',
    hk: '知識與數據存儲',
    jp: 'ナレッジ＆データストレージ',
  },
  'PC.Pages.SpaceLibrary.CreateModel.inputModelIdentifier': {
    tw: '輸入模型標識',
    hk: '輸入模型標識',
    jp: 'モデル識別子を入力',
  },
  'PC.Pages.SpacePluginWorkflow.pluginPageTitle': {
    tw: '套件',
    hk: '插件',
    jp: 'プラグイン',
  },
  'PC.Pages.SpacePluginWorkflow.workflowPageTitle': {
    tw: '工作流',
    hk: '工作流',
    jp: 'ワークフロー',
  },
  // ---- UserManage ----
  'PC.Pages.UserManage.Index.delete': { tw: '刪除', hk: '刪除', jp: '削除' },
  'PC.Pages.UserManage.Index.deleteSuccess': {
    tw: '刪除成功',
    hk: '刪除成功',
    jp: '削除しました',
  },
  'PC.Pages.UserManage.Index.userId': {
    tw: '使用者ID',
    hk: '用戶ID',
    jp: 'ユーザーID',
  },
  'PC.Pages.UserManage.Index.placeholderUserId': {
    tw: '請輸入使用者ID，僅支援輸入整數',
    hk: '請輸入用戶ID，僅支持輸入整數',
    jp: 'ユーザーIDを入力してください。整数のみ入力可能です',
  },
  // ---- SystemCreditPackages（仅 ja-JP 缺失）----
  'PC.Pages.SystemCreditPackages.fieldCreditsPlaceholder': {
    tw: '請輸入積分數量',
    hk: '請輸入積分數量',
    jp: 'クレジット数を入力してください',
  },
  'PC.Pages.SystemCreditPackages.fieldPricePlaceholder': {
    tw: '請輸入積分套餐售價',
    hk: '請輸入積分套餐售價',
    jp: 'クレジットプランの価格を入力してください',
  },
  'PC.Pages.SystemCreditPackages.fieldValidityPeriodPlaceholder': {
    tw: '請輸入積分有效期',
    hk: '請輸入積分有效期',
    jp: 'クレジットの有効期間を入力してください',
  },
  // ---- AgentArrangePageSettingModal（仅 ja-JP 缺失，且原文件用了单引号值）----
  'PC.Pages.AgentArrangePageSettingModal.customNameAndIcon': {
    tw: '自訂名稱與圖示',
    hk: '自定義名稱與圖標',
    jp: 'カスタム名とアイコン',
  },
  'PC.Pages.AgentArrangePageSettingModal.pageNamePlaceholder': {
    tw: '請輸入頁面名稱',
    hk: '請輸入頁面名稱',
    jp: 'ページ名を入力してください',
  },
  // ---- SpaceCreateProject ----
  'PC.Pages.SpaceCreateProject.greetingTitle': {
    tw: '嗨，{0}，給我一個任務，現在開始？',
    hk: '嗨，{0}，給我一個任務，現在開始？',
    jp: 'こんにちは、{0}。タスクを教えてください。今すぐ始めますか？',
  },
  'PC.Pages.SpaceCreateProject.tabAgent': {
    tw: '智慧體',
    hk: '智能體',
    jp: 'エージェント',
  },
  'PC.Pages.SpaceCreateProject.placeholderAgent': {
    tw: '描述你想要的智慧體，例如：幫我建立一個程式碼審查助手，能自動偵測程式碼問題並給出優化建議',
    hk: '描述你想要的智能體，例如：幫我創建一個代碼審查助手，能自動檢測代碼問題並給出優化建議',
    jp: '必要なエージェントを説明してください。例：コードレビューアシスタントを作成し、コードの問題を自動検出して最適化の提案を行うもの',
  },
  'PC.Pages.SpaceCreateProject.tabPageApp': {
    tw: '網頁應用',
    hk: '網頁應用',
    jp: 'ウェブアプリ',
  },
  'PC.Pages.SpaceCreateProject.placeholderPageApp': {
    tw: '描述你想要的網頁應用，例如：幫我開發一個顏值管理網站，支援上傳照片智慧評估顏值與膚質',
    hk: '描述你想要的網頁應用，例如：幫我開發一個顏值管理網站，支持上傳照片智能評估顏值與膚質',
    jp: '必要なウェブアプリを説明してください。例：写真をアップロードして顔の評価や肌質を判定するビューティー管理サイトを開発して',
  },
  'PC.Pages.SpaceCreateProject.tabSkill': {
    tw: '技能',
    hk: '技能',
    jp: 'スキル',
  },
  'PC.Pages.SpaceCreateProject.placeholderSkill': {
    tw: '描述你想要的自訂技能，例如：幫我寫一個根據經緯度查詢目前天氣狀況的API介面',
    hk: '描述你想要的自定義技能，例如：幫我寫一個根據經緯度查詢當前天氣狀況的API接口',
    jp: '必要なカスタムスキルを説明してください。例：緯度・経度から現在の天気を取得する API エンドポイントを作成して',
  },
  'PC.Pages.SpaceCreateProject.tabPlugin': {
    tw: '套件',
    hk: '插件',
    jp: 'プラグイン',
  },
  'PC.Pages.SpaceCreateProject.placeholderPlugin': {
    tw: '描述你想要的套件工具，例如：幫我對接第三方圖片轉換的HTTP介面套件',
    hk: '描述你想要的插件工具，例如：幫我對接第三方圖片轉換的HTTP接口插件',
    jp: '必要なプラグインを説明してください。例：サードパーティの画像変換 HTTP インターフェースと連携するプラグインを作成して',
  },
  'PC.Pages.SpaceCreateProject.inputRequiredWarning': {
    tw: '請輸入您的任務描述！',
    hk: '請輸入您的任務描述！',
    jp: 'タスクの内容を入力してください！',
  },
};

const LANG_FIELD = { 'zh-TW': 'tw', 'zh-HK': 'hk', 'ja-JP': 'jp' };

function insertEntries(content, existingKeys, missingEntries) {
  // existingKeys: Set；missingEntries: [{key, value}]
  // 按字母序前驱行后插入；按前驱行号降序处理避免行号偏移
  const lines = content.split('\n');
  const keyLine = {}; // key -> 行号（最后一行所在）
  const kRe = /^[ \t]*['"]([A-Za-z0-9_.]+)['"]\s*:/;
  lines.forEach((ln, i) => {
    const m = ln.match(kRe);
    if (m) keyLine[m[1]] = i;
  });
  const existingSorted = Object.keys(keyLine).sort();
  // 按前驱分组
  const groups = new Map(); // prevKey -> [entries]
  for (const e of missingEntries) {
    let prev = null;
    for (const k of existingSorted) {
      if (k < e.key) prev = k;
      else break;
    }
    if (!groups.has(prev)) groups.set(prev, []);
    groups.get(prev).push(e);
  }
  // 前驱行号降序处理；null(插到对象开头)最后单独处理
  const prevKeys = [...groups.keys()]
    .filter((k) => k !== null)
    .sort((a, b) => keyLine[b] - keyLine[a]);
  for (const prev of prevKeys) {
    const idx = keyLine[prev];
    const block = groups
      .get(prev)
      .map((e) => `  "${e.key}": ${JSON.stringify(e.value)},`);
    lines.splice(idx + 1, 0, ...block);
  }
  // 插到对象开头的（无前驱）
  if (groups.has(null)) {
    const block = groups
      .get(null)
      .map((e) => `  "${e.key}": ${JSON.stringify(e.value)},`);
    // 找到对象起始 '{' 行后插入
    let braceIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('= {')) {
        braceIdx = i;
        break;
      }
    }
    lines.splice(braceIdx + 1, 0, ...block);
  }
  return lines.join('\n');
}

function main() {
  const baseContent = fs.readFileSync(FILES['zh-CN'], 'utf8');
  const baseKeys = extractKeys(baseContent);
  const warnings = [];

  for (const lang of ['zh-TW', 'zh-HK', 'ja-JP']) {
    const content = fs.readFileSync(FILES[lang], 'utf8');
    const curKeys = extractKeys(content);
    const missing = [...baseKeys].filter((k) => !curKeys.has(k)).sort();
    if (!missing.length) {
      console.log(`[${lang}] 无缺失 key，跳过。`);
      continue;
    }
    const field = LANG_FIELD[lang];
    const entries = [];
    for (const k of missing) {
      if (T[k] && T[k][field] !== null && T[k][field] !== undefined) {
        entries.push({ key: k, value: T[k][field] });
      } else {
        warnings.push(`[${lang}] 翻译表未覆盖: ${k}`);
      }
    }
    console.log(`[${lang}] 待补 ${entries.length}/${missing.length} 个 key`);
    if (entries.length < missing.length) {
      const covered = new Set(entries.map((e) => e.key));
      missing
        .filter((k) => !covered.has(k))
        .forEach((k) => console.log(`   ⚠ 未覆盖: ${k}`));
    }
    if (entries.length && APPLY) {
      const next = insertEntries(content, curKeys, entries);
      fs.writeFileSync(FILES[lang], next, 'utf8');
      console.log(`   ✓ 已写入 ${FILES[lang]}`);
    } else if (entries.length) {
      entries
        .slice(0, 5)
        .forEach((e) => console.log(`   · ${e.key} = ${e.value}`));
      if (entries.length > 5)
        console.log(`   · ...（共 ${entries.length} 条，--apply 后写入）`);
    }
  }

  if (warnings.length) {
    console.log('\n⚠ 警告：');
    warnings.forEach((w) => console.log('  ' + w));
  } else {
    console.log('\n✓ 翻译表已覆盖全部缺失 key');
  }
  console.log(
    APPLY
      ? '\n模式：已写入（--apply）'
      : '\n模式：预览（未写入，加 --apply 实际写入）',
  );
}

main();
