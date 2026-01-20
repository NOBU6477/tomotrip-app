# Agent 修正依頼テンプレ（必須）

## 守るべきルール（最優先）
- docs/DESIGN_RULES.md を遵守
- docs/AUTH_REGISTER_RULES.md を遵守
- 状態管理（検索/ページ/登録）と render の責務を変更しない

## 修正範囲
- 変更するファイル：
- 変更しないファイル（明示）：

## 禁止事項
- 検索状態・ページ状態の初期化
- render内でのstate変更
- ページネーションの独自slice/描画
- 登録済み判定の分散実装

## 確認事項（必須）
- docs/REGRESSION_TEST.md の該当シナリオをPASS
- スマホ実機で E/F を確認（登録/画像）
- window.__TT_DEBUG=true でエラーなし

## 完了報告に含めること
- 変更点の要約（箇条書き）
- 影響範囲
- 実施した回帰テスト
