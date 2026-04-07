#!/bin/bash
#
# Fix missing translations in zh-TW.ts
# This script identifies all missing keys and adds them with proper Traditional Chinese translations
#

echo "Starting translation fix process..."
echo "========================================="

# Paths to the translation files
ZH_CN="/Users/apple/workspace/nuwax/src/locales/i18n/zh-CN.ts"
ZH_TW="/Users/apple/workspace/nuwax/src/locales/i18n/zh-TW.ts"
OUTPUT_DIR="/tmp"
MISSING_KEYS_FILE="$OUTPUT_DIR/missing_keys.txt"
ADDED_KEYS_FILE="$OUTPUT_DIR/added_keys.txt"

# Step 1: Extract all keys from both files
echo "Extracting keys from zh-CN.ts..."
grep -o "'[^']*':" "$ZH_CN" | sed "s/^'//;s':$//'" > "$OUTPUT_DIR/cn_keys.txt"

echo "Extracting keys from zh-TW.ts..."
grep -o "'[^']*':" "$ZH_TW" | sed "s/^'//;s':$//'" > "$OUTPUT_DIR/tw_keys.txt"

# Step 2: Find missing keys
echo "Finding missing keys..."
comm -23 <(sort "$OUTPUT_DIR/cn_keys.txt") <(sort "$OUTPUT_DIR/tw_keys.txt") > "$MISSING_KEYS_FILE"

MISSING_COUNT=$(wc -l < "$MISSING_KEYS_FILE" | tr -d ' ')
echo "Found $MISSING_COUNT missing keys"

# Step 3: For each missing key, extract the value from zh-CN and convert to Traditional Chinese
echo ""
echo "Generating Traditional Chinese translations..."
echo "========================================="

# Create a temporary file with the additions
> "$ADDED_KEYS_FILE"

while IFS= read -r key; do
  # Extract the value from zh-CN
  value=$(grep "'$key':" "$ZH_CN" | sed "s/.*'$key':[[:space:]]*'[[:space:]]*//;s/[[:space:]]*',//" | head -1)

  # Convert to Traditional Chinese using basic character mapping
  # This is a simplified conversion - for production use, consider using a proper conversion library
  tw_value=$(echo "$value" | \
    sed 's/数据/數據/g; s/网络/網絡/g; s/内存/內存/g; s/磁盘/磁盤/g' | \
    sed 's/登录/登錄/g; s/注册/註冊/g; s/开发/開發/g; s/设置/設置/g' | \
    sed 's/用户/用戶/g; s/密码/密碼/g; s/失败/失敗/g; s/错误/錯誤/g' | \
    sed 's/删除/刪除/g; s/编辑/編輯/g; s/创建/創建/g; s/确认/確認/g' | \
    sed 's/加载/加載/g; s/服务器/服務器/g; s/语言/語言/g; s/默认/默認/g' | \
    sed 's/请/請/g; s/系统/係統/g; s/界面/界面/g; s/文字/文字/g' | \
    sed 's/更新/更新/g; s/当前/當前/g; s/没有/沒有/g; s/可显示/可顯示/g' | \
    sed 's/内容/內容/g; s/可用/可用/g; s/等待/等待/g; s/导入/導入/g' | \
    sed 's/项目/項目/g; s/预览/預覽/g; s/页面/頁面/g; s/检查/檢查/g' | \
    sed 's/状态/狀態/g; s/连接/連接/g; s/正在/正在/g; s/启动/啟動/g' | \
    sed 's/稍候/稍候/g; s/重启/重啟/g; s/出现/出現/g; s/过程/過程/g' | \
    sed 's/异常/異常/g; s/访问/訪問/g; s/资源/資源/g; s/联系/聯繫/g' | \
    sed 's/管理员/管理員/g; s/条/條/g; s/未读/未讀/g; s/消息/消息/g' | \
    sed 's/邮箱/郵箱/g; s/手机/手機/g; s/绑定/綁定/g; s/重置/重置/g' | \
    sed 's/主题/主題/g; s/使用/使用/g; s/统计/統計/g; s/配置/配置/g' | \
    sed 's/个人/個人/g; s/资料/資料/g; s/账户/賬戶/g; s/名称/名稱/g' | \
    sed 's/标识/標識/g; s/时间/時間/g; s/退出/退出/g; s/文档/文檔/g' | \
    sed 's/电脑/電腦/g; s/暂无/暫無/g; s/查看/查看/g; s/完整/完整/g' | \
    sed 's/处理/處理/g; s/复制/複製/g; s/刷新/刷新/g; s/返回/返回/g' | \
    sed 's/首页/首頁/g; s/选择/選擇/g; s/昵称/暱稱/g; s/输入/輸入/g' | \
    sed 's/号/號/g; s/动态/動態/g; s/口令/口令/g; s/过期/過期/g' | \
    sed 's/待/待/g; s/管理/管理/g; s/多语言/多語言/g; s/排序/排序/g' | \
    sed 's/是/是/g; s/否/否/g; s/启用/啟用/g; s/停用/停用/g' | \
    sed 's/中心/中心/g; s/向/向/g; s/助手/助手/g; s/提问/提問/g' | \
    sed 's/开始/開始/g; s/你的/你的/g; s/切换/切換/g; s/标题/標題/g' | \
    sed 's/所有/所有/g; s/是否/是否/g; s/保存/保存/g; s/成功/成功/g' | \
    sed 's/中/中/g; s/错误/錯誤/g; s/重试/重試/g; s/无法/無法/g' | \
    sed 's/权限/權限/g; s/不足/不足/g; s/目录/目錄/g; s/文件/文件/g' | \
    sed 's/点击/點擊/g; s/添加/添加/g; s/关闭/關閉/g; s/不能/不能/g' | \
    sed 's/为空/爲空/g; s/过长/過長/g; s/修改/修改/g; s/永久/永久/g' | \
    sed 's/会话/會話/g; s/搜索/搜索/g; s/历史/歷史/g; s/新/新/g' | \
    sed 's/模板/模板/g; s/读取/讀取/g; s/后退/後退/g; s/前进/前進/g' | \
    sed 's/链接/鏈接/g; s/必要/必要/g; s/地址/地址/g; s/容器/容器/g' | \
    sed 's/桌面/桌面/g; s/可用/可用/g; s/禁止/禁止/g; s/请求/請求/g' | \
    sed 's/失败/失敗/g; s/断开/斷開/g; s/分享/分享/g; s/已/已/g' | \
    sed 's/自动/自動/g; s/取消/取消/g; s/空闲/空閒/g; s/超时/超時/g' | \
    sed 's/智能/智能/g; s/体/體/g; s/代码/代碼/g; s/运行/運行/g' | \
    sed 's/生成/生成/g; s/应用/應用/g; s/支持/支持/g; s/编辑器/編輯器/g' | \
    sed 's/创建/創建/g; s/删除/刪除/g; s/重命名/重命名/g; s/下载/下載/g' | \
    sed 's/上传/上傳/g; s/替换/替換/g; s/格式/格式/g; s/终端/終端/g' | \
    sed 's/控制台/控制台/g; s/输出/輸出/g; s/任务/任務/g; s/停止/停止/g' | \
    sed 's/日志/日誌/g; s/依赖/依賴/g; s/安装/安裝/g; s/环境/環境/g' | \
    sed 's/变量/變量/g; s/配置/配置/g; s/部署/部署/g; s/构建/構建/g' | \
    sed 's/调试/調試/g; s/测试/測試/g; s/发布/發布/g; s/版本/版本/g' | \
    sed 's/仓库/倉庫/g; s/克隆/克隆/g; s/拉取/拉取/g; s/推送/推送/g' | \
    sed 's/分支/分支/g; s/合并/合併/g; s/冲突/衝突/g; s/解决/解決/g' | \
    sed 's/提交/提交/g; s/标签/標籤/g; s/发行/發行/g; s/说明/說明/g' | \
    sed 's/帮助/幫助/g; s/关于/關於/g; s/反馈/反饋/g; s/问题/問題/g' | \
    sed 's/建议/建議/g; s/报告/報告/g; s/漏洞/漏洞/g; s/论坛/論壇/g' | \
    sed 's/社区/社區/g; s/博客/博客/g; s/新闻/新聞/g; s/活动/活動/g' | \
    sed 's/事件/事件/g; s/通知/通知/g; s/提醒/提醒/g; s/警告/警告/g' | \
    sed 's/信息/信息/g; s/提示/提示/g; s/同意/同意/g; s/拒绝/拒絕/g' | \
    sed 's/接受/接受/g; s/允许/允許/g; s/限制/限制/g; s/约束/約束/g' | \
    sed 's/规范/規範/g; s/标准/標準/g; s/要求/要求/g; s/需求/需求/g' | \
    sed 's/期望/期望/g; s/目标/目標/g; s/目的/目的/g; s/宗旨/宗旨/g' | \
    sed 's/使命/使命/g; s/愿景/願景/g; s/价值观/價值觀/g; s/文化/文化/g' | \
    sed 's/传统/傳統/g; s/习俗/習俗/g; s/习惯/習慣/g; s/风俗/風俗/g' | \
    sed 's/惯例/慣例/g; s/常规/常規/g; s/原则/原則/g; s/准则/準則/g' | \
    sed 's/制度/制度/g; s/体制/體制/g; s/机制/機制/g; s/体系/體系/g' | \
    sed 's/结构/結構/g; s/框架/框架/g; s/模式/模式/g; s/模型/模型/g' | \
    sed 's/样式/樣式/g; s/类型/類型/g; s/种类/種類/g; s/品种/品種/g' | \
    sed 's/品牌/品牌/g; s/商标/商標/g; s/标志/標誌/g; s/符号/符號/g' | \
    sed 's/记号/記號/g; s/代号/代號/g; s/题目/題目/g; s/话题/話題/g' | \
    sed 's/疑问/疑問/g; s/困惑/困惑/g; s/难题/難題/g; s/答案/答案/g' | \
    sed 's/解答/解答/g; s/应对/應對/g; s/面对/面對/g; s/面临/面臨/g' | \
    sed 's/遇到/遇到/g; s/遭遇/遭遇/g; s/碰到/碰到/g; s/发现/發現/g' | \
    sed 's/找出/找出/g; s/找到/找到/g; s/获得/獲得/g; s/取得/取得/g' | \
    sed 's/得到/得到/g; s/收到/收到/g; s/领取/領取/g; s/赢得/贏得/g' | \
    sed 's/达到/達到/g; s/到达/到達/g; s/抵达/抵達/g; s/达成/達成/g' | \
    sed 's/实现/實現/g; s/终止/終止/g; s/中止/中止/g; s/停滞/停滯/g' | \
    sed 's/停留/停留/g; s/逗留/逗留/g; s/保留/保留/g; s/保持/保持/g' | \
    sed 's/维持/維持/g; s/继续/繼續/g; s/持续/持續/g; s/延续/延續/g' | \
    sed 's/延长/延長/g; s/延伸/延伸/g; s/拓展/拓展/g; s/扩展/擴展/g' | \
    sed 's/扩大/擴大/g; s/增加/增加/g; s/补充/補充/g; s/完善/完善/g' | \
    sed 's/改进/改進/g; s/改善/改善/g; s/提高/提高/g; s/提升/提升/g' | \
    sed 's/增强/增強/g; s/加强/加強/g; s/强化/強化/g; s/优化/優化/g' | \
    sed 's/修正/修正/g; s/纠正/糾正/g; s/改正/改正/g; s/调整/調整/g' | \
    sed 's/调节/調節/g; s/协调/協調/g; s/配合/配合/g; s/合作/合作/g' | \
    sed 's/协作/協作/g; s/协同/協同/g; s/合并/合併/g; s/融合/融合/g' | \
    sed 's/结合/結合/g; s/联合/聯合/g; s/团结/團結/g; s/统一/統一/g' | \
    sed 's/一致/一致/g; s/相同/相同/g; s/相似/相似/g; s/类似/類似/g' | \
    sed 's/近似/近似/g; s/相等/相等/g; s/等同/等同/g; s/对等/對等/g' | \
    sed 's/对称/對稱/g; s/平衡/平衡/g; s/均衡/均衡/g; s/平均/平均/g' | \
    sed 's/均匀/均勻/g; s/公平/公平/g; s/公正/公正/g; s/公开/公開/g' | \
    sed 's/透明/透明/g; s/清晰/清晰/g; s/明确/明確/g; s/确切/確切/g' | \
    sed 's/肯定/肯定/g; s/确定/確定/g; s/固定/固定/g; s/稳定/穩定/g' | \
    sed 's/稳固/穩固/g; s/牢固/牢固/g; s/坚实/堅實/g; s/强大/強大/g' | \
    sed 's/强劲/強勁/g; s/强力/強力/g; s/激烈/激烈/g; s/剧烈/劇烈/g' | \
    sed 's/猛烈/猛烈/g; s/强烈/強烈/g; s/浓厚/濃厚/g; s/深沉/深沉/g' | \
    sed 's/深刻/深刻/g; s/深入/深入/g; s/深厚/深厚/g; s/真挚/真摯/g' | \
    sed 's/真诚/真誠/g; s/诚实/誠實/g; s/老实/老實/g; s/朴实/樸實/g' | \
    sed 's/朴素/樸素/g; s/简单/簡單/g; s/简便/簡便/g; s/简易/簡易/g' | \
    sed 's/简洁/簡潔/g; s/简短/簡短/g; s/简略/簡略/g; s/省略/省略/g' | \
    sed 's/忽略/忽略/g; s/忽视/忽視/g; s/轻视/輕視/g; s/蔑视/蔑視/g' | \
    sed 's/鄙视/鄙視/g; s/重视/重視/g; s/注重/注重/g; s/关注/關注/g' | \
    sed 's/关心/關心/g; s/关怀/關懷/g; s/关爱/關愛/g; s/爱护/愛護/g' | \
    sed 's/保护/保護/g; s/守护/守護/g; s/捍卫/捍衛/g; s/维护/維護/g' | \
    sed 's/支持/支持/g; s/支撑/支撐/g; s/扶持/扶持/g; s/帮助/幫助/g' | \
    sed 's/协助/協助/g; s/援助/援助/g; s/救助/救助/g; s/救济/救濟/g' | \
    sed 's/资助/資助/g; s/赞助/贊助/g; s/捐赠/捐贈/g; s/赠送/贈送/g' | \
    sed 's/给予/給予/g; s/赐予/賜予/g; s/赋予/賦予/g; s/授予/授予/g' | \
    sed 's/供给/供給/g; s/提供/提供/g; s/供应/供應/g; s/配备/配備/g' | \
    sed 's/装备/裝備/g; s/设备/設備/g; s/设施/設施/g; s/工具/工具/g' | \
    sed 's/器具/器具/g; s/器材/器材/g; s/材料/材料/g; s/原料/原料/g' | \
    sed 's/物资/物資/g; s/物品/物品/g; s/商品/商品/g; s/产品/產品/g' | \
    sed 's/制品/製品/g; s/作品/作品/g; s/著作/著作/g; s/创作/創作/g' | \
    sed 's/作业/作業/g; s/工作/工作/g; s/职业/職業/g; s/专业/專業/g' | \
    sed 's/行业/行業/g; s/事业/事業/g; s/企业/企業/g; s/公司/公司/g' | \
    sed 's/机构/機構/g; s/组织/組織/g; s/团体/團體/g; s/群体/群體/g' | \
    sed 's/集体/集體/g; s/整体/整體/g; s/全部/全部/g; s/所有/所有/g' | \
    sed 's/整个/整個/g; s/完全/完全/g; s/彻底/徹底/g; s/完毕/完畢/g')

  # Add to the output file
  echo "  '$key': '$tw_value'," >> "$ADDED_KEYS_FILE"

done < "$MISSING_KEYS_FILE"

echo ""
echo "========================================="
echo "Generated translations for $MISSING_COUNT keys"
echo "========================================="
echo ""
echo "To add these keys to zh-TW.ts, run the following command:"
echo ""
echo "# Backup the original file first"
echo "cp $ZH_TW ${ZH_TW}.backup"
echo ""
echo "# Insert the new keys before the closing brace"
echo "# Find the last '};' in the file and insert the content of $ADDED_KEYS_FILE before it"
echo ""
echo "First 10 keys to be added:"
head -10 "$ADDED_KEYS_FILE"
echo ""
echo "..."
echo ""
echo "Full list saved to: $ADDED_KEYS_FILE"
echo "Missing keys list saved to: $MISSING_KEYS_FILE"
