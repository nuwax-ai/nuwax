# 专家上框提示问题实施计划

1. Home 基于专家身份与当前已发布详情展示 RecommendList，复用链接和页面行为。
2. ChatInputUnified ref 增加 setText，清除技能和资料选择后复用 MentionEditor.setEditorText 并聚焦。
3. 首页增加提示问题区样式，沿用主题变量。
4. 扩展现有首页透传与输入框测试，运行定向测试及 test:conversation。

用户已确认：填入输入框，用户确认后发送。需求及规格见同名 intent 和 specs/expert-guid-questions.md。
